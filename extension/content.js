(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const LIVE_URL='https://2026-fantasy-football.vercel.app/live';
  const state={catalog:[],byName:new Map(),sent:new Set(),lastScan:0,observer:null,statusEl:null};
  const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const isDraftPage=()=>/draft/i.test(location.href)||/draft/i.test(document.title);

  async function api(path,options={}){
    const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});
    if(!r.ok)throw Error(await r.text()||String(r.status));
    return r.status===204?null:r.json();
  }

  async function loadCatalog(){
    const rows=await api('draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,active&active=eq.true&order=yahoo_rank.asc.nullslast');
    state.catalog=(rows||[]).filter(p=>Number.isFinite(Number(p.yahoo_rank)));
    state.byName=new Map();
    state.catalog.forEach(p=>{
      const names=[p.yahoo_name,p.display_name].map(norm).filter(Boolean);
      names.forEach(n=>state.byName.set(n,p));
    });
  }

  function ensureStatus(){
    if(state.statusEl&&document.contains(state.statusEl))return;
    const el=document.createElement('button');
    el.type='button';
    el.textContent='LIVE SYNC';
    el.title='Open Fantasy Live Draft viewer';
    Object.assign(el.style,{position:'fixed',right:'12px',bottom:'12px',zIndex:'2147483647',padding:'8px 11px',borderRadius:'999px',border:'1px solid #16a34a',background:'#052e16',color:'#dcfce7',font:'700 11px system-ui',boxShadow:'0 4px 16px rgba(0,0,0,.25)',cursor:'pointer'});
    el.onclick=()=>window.open(LIVE_URL,'_blank','noopener');
    document.documentElement.appendChild(el);
    state.statusEl=el;
  }

  function setStatus(text,error=false){
    ensureStatus();
    state.statusEl.textContent=text;
    state.statusEl.style.borderColor=error?'#dc2626':'#16a34a';
    state.statusEl.style.background=error?'#450a0a':'#052e16';
    state.statusEl.style.color=error?'#fee2e2':'#dcfce7';
  }

  function candidateContainers(){
    const selectors=[
      '[data-tst*="draft"]',
      '[data-testid*="draft"]',
      '[class*="DraftResults"]',
      '[class*="draft-results"]',
      '[class*="DraftPick"]',
      '[class*="draft-pick"]',
      '[aria-label*="draft" i]'
    ];
    const seen=new Set(),out=[];
    selectors.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{if(!seen.has(el)){seen.add(el);out.push(el)}}));
    return out;
  }

  function namesFromContainer(el){
    const text=String(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
    if(!text)return [];
    if(/available players|player list|queue|watchlist/i.test(text)&&!/drafted|selected|round\s+\d|pick\s+\d/i.test(text))return [];
    if(!/drafted|selected|round\s+\d|pick\s+\d/i.test(text))return [];
    const lower=norm(text),hits=[];
    for(const [name,p] of state.byName){
      if(name.length<5)continue;
      if(lower.includes(name))hits.push(p);
    }
    return hits;
  }

  function scanDrafted(){
    const found=new Map();
    candidateContainers().forEach(el=>namesFromContainer(el).forEach(p=>found.set(norm(p.player_key),p)));
    return [...found.values()];
  }

  async function markDrafted(players){
    const fresh=players.filter(p=>!state.sent.has(norm(p.player_key)));
    if(!fresh.length){setStatus(`LIVE SYNC · ${state.sent.size}`);return;}
    const body=fresh.map(p=>({player_key:p.player_key,drafted:true,drafted_at:new Date().toISOString()}));
    await api('live_draft_state?on_conflict=player_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)});
    fresh.forEach(p=>state.sent.add(norm(p.player_key)));
    setStatus(`LIVE SYNC · ${state.sent.size}`);
  }

  async function scan(force=false){
    if(!isDraftPage()){setStatus('LIVE SYNC · WAITING');return;}
    if(!force&&Date.now()-state.lastScan<700)return;
    state.lastScan=Date.now();
    try{
      if(!state.catalog.length)await loadCatalog();
      const players=scanDrafted();
      await markDrafted(players);
      chrome.storage.local.set({lastScan:Date.now(),draftedCount:state.sent.size,lastUrl:location.href,lastError:null});
    }catch(e){
      setStatus('LIVE SYNC · ERROR',true);
      chrome.storage.local.set({lastScan:Date.now(),lastError:String(e.message||e)});
    }
  }

  function start(){
    ensureStatus();
    scan(true);
    let timer=null;
    state.observer=new MutationObserver(()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>scan(false),350);
    });
    state.observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    setInterval(()=>scan(false),5000);
    chrome.runtime.onMessage.addListener((msg,_sender,sendResponse)=>{
      if(msg?.type==='SCAN_NOW')scan(true).then(()=>sendResponse({ok:true,count:state.sent.size})).catch(e=>sendResponse({ok:false,error:e.message}));
      else if(msg?.type==='STATUS')sendResponse({ok:true,count:state.sent.size,isDraftPage:isDraftPage(),url:location.href});
      return true;
    });
  }

  start();
})();
