(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  let lastPayload='';
  let timer=null;

  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();

  async function api(path,options={}){
    const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});
    if(!r.ok)throw Error(await r.text()||String(r.status));
    return r.status===204?null:r.json();
  }

  function roomId(){
    const u=new URL(location.href);
    const direct=u.searchParams.get('mid')||u.searchParams.get('league_id')||u.searchParams.get('leagueId')||u.searchParams.get('draft_id')||u.searchParams.get('draftId');
    if(direct)return `yahoo:${direct}`;
    const pathMatch=u.pathname.match(/(?:draftclient|mock|draft)[^/]*\/([^/?#]+)/i);
    if(pathMatch?.[1])return `yahoo:${pathMatch[1]}`;
    return `yahoo:${u.pathname.replace(/\/+$/,'').split('/').slice(-3).join(':')||'draft'}`;
  }

  function detectDraftSlot(text){
    const patterns=[
      /you\s+will\s+draft\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
      /your\s+draft\s+(?:position|slot)\s*[:#-]?\s*(\d{1,2})\b/i,
      /draft\s+(?:position|slot)\s*[:#-]?\s*(\d{1,2})\b/i,
      /you\s+(?:are|have)\s+(?:pick|position|slot)\s*#?\s*(\d{1,2})\b/i
    ];
    for(const re of patterns){
      const m=text.match(re);
      const n=Number(m?.[1]);
      if(Number.isInteger(n)&&n>=1&&n<=20)return n;
    }
    return null;
  }

  function detectTeamCount(text){
    const explicit=text.match(/\b(8|10|12|14|16|18|20)[ -]?team\b/i);
    if(explicit)return Number(explicit[1]);

    // Yahoo waiting rooms render numbered draft seats. Count a clean run
    // of seat labels when available; otherwise this project's study guide
    // is built around a 12-team league, so 12 is the safe fallback.
    const seatNumbers=new Set();
    document.querySelectorAll('th,td,li,div,span').forEach(el=>{
      if(el.childElementCount>2)return;
      const t=clean(el.textContent);
      if(/^\d{1,2}$/.test(t)){
        const n=Number(t);
        if(n>=1&&n<=20)seatNumbers.add(n);
      }
    });
    for(const size of [20,18,16,14,12,10,8]){
      let full=true;
      for(let i=1;i<=size;i++)if(!seatNumbers.has(i)){full=false;break;}
      if(full)return size;
    }
    return 12;
  }

  function detectStatus(text){
    if(/draft complete|final results/i.test(text))return 'COMPLETE';
    if(/starts? in|waiting room|you will draft/i.test(text)||/mock_waiting/i.test(location.href))return 'WAITING';
    if(/on the clock|draft results|draft board|round\s*\d+/i.test(text))return 'LIVE';
    return 'CONNECTED';
  }

  async function publish(){
    const text=clean(document.body?.innerText||document.body?.textContent||'');
    if(!text)return;
    const slot=detectDraftSlot(text);
    if(!slot)return;

    const payload={
      room:roomId(),
      draft_slot:slot,
      team_count:detectTeamCount(text),
      status:detectStatus(text),
      updated_at:new Date().toISOString()
    };

    const signature=JSON.stringify([payload.room,payload.draft_slot,payload.team_count,payload.status]);
    if(signature===lastPayload){
      const last=Number((await chrome.storage.local.get('draftSlotPublishedAt')).draftSlotPublishedAt||0);
      if(Date.now()-last<5000)return;
    }

    await api('live_draft_session?on_conflict=room',{
      method:'POST',
      headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify(payload)
    });

    lastPayload=signature;
    chrome.storage.local.set({
      draftSlot:slot,
      draftTeamCount:payload.team_count,
      draftRoom:payload.room,
      draftStatus:payload.status,
      draftSlotPublishedAt:Date.now()
    });
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>publish().catch(()=>{}),250);
  }

  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('pageshow',schedule);
  window.addEventListener('popstate',schedule);
  setInterval(()=>publish().catch(()=>{}),5000);
  schedule();
})();
