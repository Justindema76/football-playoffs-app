(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const LIVE_URL='https://2026-fantasy-football.vercel.app/live';
  const state={catalog:[],names:new Map(),room:null,slot:null,teams:12,lastFound:0,lastScan:0,statusEl:null};
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const isDraftPage=()=>/draft|mock/i.test(location.href)||/draft|mock/i.test(document.title);

  async function api(path,options={}){
    const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});
    const text=await r.text();
    if(!r.ok)throw Error(`HTTP ${r.status}: ${text||r.status}`);
    if(!text)return null;
    try{return JSON.parse(text)}catch{return null}
  }

  function roomKey(){
    try{
      const u=new URL(location.href);
      const mid=u.searchParams.get('mid');
      if(mid)return `yahoo:${mid}`;
      const nums=u.pathname.match(/\d{5,}/g);
      if(nums?.length)return `yahoo:${nums[nums.length-1]}`;
    }catch(_e){}
    return `yahoo:${location.pathname}`;
  }

  function detectSlot(text){
    try{
      const u=new URL(location.href);
      const direct=Number(u.searchParams.get('slot')||u.searchParams.get('draft_slot')||u.searchParams.get('draftSlot'));
      if(Number.isInteger(direct)&&direct>=1&&direct<=20)return direct;
      const m=u.pathname.match(/draftclient\/(?:f1\/)?\d+\/(\d{1,2})(?:\/|$)/i);
      const n=Number(m?.[1]);
      if(Number.isInteger(n)&&n>=1&&n<=20)return n;
    }catch(_e){}
    const patterns=[
      /you\s+will\s+draft\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
      /you\s+will\s+pick\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
      /your\s+draft\s+(?:position|slot)\s*[:#-]?\s*(\d{1,2})\b/i,
      /you\s+(?:are|have)\s+(?:pick|position|slot)\s*#?\s*(\d{1,2})\b/i
    ];
    for(const re of patterns){
      const n=Number(text.match(re)?.[1]);
      if(Number.isInteger(n)&&n>=1&&n<=20)return n;
    }
    return null;
  }

  function detectTeams(text){
    const explicit=Number(text.match(/\b(8|10|12|14|16|18|20)[ -]?team\b/i)?.[1]);
    if(explicit)return explicit;
    const you=[...document.querySelectorAll('td,th')].find(el=>/^(you|me)$/i.test(clean(el.textContent)));
    const table=you?.closest('table');
    if(table){
      const nums=[...table.querySelectorAll('th,td')].map(el=>Number(clean(el.textContent))).filter(n=>Number.isInteger(n)&&n>=1&&n<=20);
      const set=new Set(nums);
      for(const size of [20,18,16,14,12,10,8]){
        if(Array.from({length:size},(_,i)=>i+1).every(n=>set.has(n)))return size;
      }
    }
    return state.teams||12;
  }

  function detectStatus(text){
    if(/draft complete|final results/i.test(text))return 'COMPLETE';
    if(/starts? in|waiting room|you will draft|you will pick/i.test(text)||/mock_waiting/i.test(location.href))return 'WAITING';
    if(/on the clock|draft board|draft results|round\s*\d+/i.test(text))return 'LIVE';
    return 'CONNECTED';
  }

  async function publishSession(){
    const text=clean(document.body?.innerText||document.body?.textContent||'');
    if(!text)return;
    state.room=roomKey();
    const slot=detectSlot(text);
    const teams=detectTeams(text);
    if(slot){
      state.slot=slot; state.teams=teams;
      await chrome.storage.local.set({draftSlot:slot,draftTeamCount:teams,draftRoom:state.room,draftSlotPublishedAt:Date.now()});
    }else{
      const saved=await chrome.storage.local.get(['draftSlot','draftTeamCount','draftRoom','draftSlotPublishedAt']);
      if(Number.isInteger(Number(saved.draftSlot))&&(saved.draftRoom===state.room||Date.now()-Number(saved.draftSlotPublishedAt||0)<20*60*1000)){
        state.slot=Number(saved.draftSlot); state.teams=Number(saved.draftTeamCount)||teams||12;
      }
    }
    if(!state.slot)return;
    await api('live_draft_session?on_conflict=room',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({room:state.room,draft_slot:state.slot,team_count:state.teams,status:detectStatus(text),updated_at:new Date().toISOString()})});
  }

  async function loadCatalog(){
    if(state.catalog.length)return;
    const rows=await api('draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,active&active=eq.true&order=yahoo_rank.asc.nullslast');
    state.catalog=(rows||[]).filter(p=>p.yahoo_rank!=null&&Number.isFinite(Number(p.yahoo_rank)));
    state.names=new Map();
    for(const p of state.catalog){
      for(const raw of [p.yahoo_name,p.display_name]){
        const n=norm(raw); if(n)state.names.set(n,p);
      }
    }
  }

  function matchPlayer(raw){
    const n=norm(raw);
    if(!n)return null;
    if(state.names.has(n))return state.names.get(n);
    if(n.length>70)return null;
    const toks=n.split(' ').filter(Boolean);
    if(toks.length>=2){
      const initial=toks[0][0], last=toks.slice(1).join(' ');
      const hits=state.catalog.filter(p=>{
        const ft=norm(p.yahoo_name||p.display_name).split(' ').filter(Boolean);
        return ft.length>=2&&ft[0][0]===initial&&ft.slice(-toks.length+1).join(' ')===last;
      });
      if(hits.length)return hits.sort((a,b)=>Number(a.yahoo_rank)-Number(b.yahoo_rank))[0];
    }
    for(const [name,p] of state.names){
      if(name.length>=5&&(n===name||n.startsWith(`${name} `)||n.endsWith(` ${name}`)))return p;
    }
    return null;
  }

  function addMatchesFromContainer(container,found){
    if(!container)return;
    container.querySelectorAll('li,ul,a,span,div,p,strong,b,td').forEach(el=>{
      if(el.childElementCount>4)return;
      const text=clean(el.innerText||el.textContent||'');
      if(text.length<3||text.length>55)return;
      const p=matchPlayer(text);
      if(p)found.set(norm(p.player_key),p);
    });
  }

  function findPicksPanel(){
    const tab=[...document.querySelectorAll('[role="tab"],button')].find(el=>/^picks$/i.test(clean(el.textContent)));
    if(!tab)return null;
    const controls=tab.getAttribute('aria-controls');
    if(controls&&document.getElementById(controls))return document.getElementById(controls);
    const tablist=tab.closest('[role="tablist"]');
    if(tablist){
      const tabs=[...tablist.querySelectorAll('[role="tab"]')];
      const idx=tabs.indexOf(tab);
      const scope=tablist.parentElement?.parentElement||tablist.parentElement;
      const panels=scope?[...scope.querySelectorAll('[role="tabpanel"]')]:[];
      if(idx>=0&&panels[idx])return panels[idx];
    }
    return tablist?.parentElement?.nextElementSibling||null;
  }

  function scanPicksPanel(found){
    addMatchesFromContainer(findPicksPanel(),found);
  }

  function scanAnnouncements(found){
    document.querySelectorAll('[aria-live],[role="status"],[role="log"]').forEach(el=>{
      const text=clean(el.innerText||el.textContent||'');
      if(!text||text.length>900||!/draft|pick|select|round|on the clock/i.test(text))return;
      const n=norm(text);
      for(const [name,p] of state.names)if(name.length>=5&&n.includes(name))found.set(norm(p.player_key),p);
      text.split(/[|•·\n]/).forEach(part=>{const p=matchPlayer(part);if(p)found.set(norm(p.player_key),p)});
    });
  }

  function scanPickContext(found){
    const selectors='[data-tst*="pick"],[data-testid*="pick"],[class*="Pick"],[class*="pick"],[aria-label*="pick" i],[role="row"],tr,li';
    document.querySelectorAll(selectors).forEach(el=>{
      const text=clean(el.innerText||el.textContent||'');
      if(text.length<5||text.length>700)return;
      if(/available players|queue|watchlist/i.test(text)&&!/selected by|drafted by|round|pick\s*\d+/i.test(text))return;
      if(!/selected by|drafted by|was drafted|has drafted|round\s*\d+|pick\s*[#:. -]*\d+/i.test(text))return;
      const n=norm(text);
      for(const [name,p] of state.names)if(name.length>=5&&n.includes(name))found.set(norm(p.player_key),p);
    });
  }

  function scanDrafted(){
    const found=new Map();
    scanPicksPanel(found);
    scanAnnouncements(found);
    scanPickContext(found);
    return [...found.values()];
  }

  async function writeDrafted(players){
    state.lastFound=players.length;
    if(!players.length)return;
    const rows=players.map(p=>({player_key:p.player_key,drafted:true,drafted_at:new Date().toISOString(),room:state.room||roomKey()}));
    await api('live_draft_state?on_conflict=player_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)});
  }

  function ensureStatus(){
    if(state.statusEl&&document.contains(state.statusEl))return;
    const el=document.createElement('button');
    el.type='button'; el.title='Open Fantasy Live Viewer'; el.onclick=()=>window.open(LIVE_URL,'_blank','noopener');
    Object.assign(el.style,{position:'fixed',right:'12px',bottom:'12px',zIndex:'2147483647',padding:'8px 11px',borderRadius:'999px',border:'1px solid #16a34a',background:'#052e16',color:'#dcfce7',font:'700 11px system-ui',boxShadow:'0 4px 16px rgba(0,0,0,.25)',cursor:'pointer'});
    document.documentElement.appendChild(el); state.statusEl=el;
  }

  function showStatus(error=null){
    ensureStatus();
    if(error){state.statusEl.textContent='LIVE SYNC · ERROR';state.statusEl.style.background='#450a0a';state.statusEl.style.borderColor='#dc2626';return}
    state.statusEl.style.background='#052e16';state.statusEl.style.borderColor='#16a34a';
    state.statusEl.textContent=`LIVE SYNC · ${state.lastFound} DRAFTED${state.slot?` · SLOT ${state.slot}`:''}`;
  }

  async function scan(force=false){
    if(!isDraftPage()){state.lastFound=0;showStatus();return}
    if(!force&&Date.now()-state.lastScan<600)return;
    state.lastScan=Date.now();
    try{
      await loadCatalog();
      await publishSession();
      await writeDrafted(scanDrafted());
      showStatus();
      await chrome.storage.local.set({lastScan:Date.now(),foundCount:state.lastFound,draftSlot:state.slot,draftTeamCount:state.teams,draftRoom:state.room,lastError:null});
    }catch(e){
      console.error('[LiveSync]',e); showStatus(e);
      await chrome.storage.local.set({lastScan:Date.now(),lastError:String(e.message||e)});
    }
  }

  function start(){
    ensureStatus(); scan(true);
    let timer=null;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>scan(false),250)}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    setInterval(()=>scan(false),2000);
    chrome.runtime.onMessage.addListener((msg,_sender,sendResponse)=>{
      if(msg?.type==='SCAN_NOW')scan(true).then(()=>sendResponse({ok:true,found:state.lastFound,draftSlot:state.slot})).catch(e=>sendResponse({ok:false,error:e.message}));
      else if(msg?.type==='STATUS')sendResponse({ok:true,found:state.lastFound,draftSlot:state.slot,teamCount:state.teams,room:state.room,isDraftPage:isDraftPage(),url:location.href});
      return true;
    });
  }

  start();
})();
