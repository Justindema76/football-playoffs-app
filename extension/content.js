(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const LIVE_URL='https://2026-fantasy-football.vercel.app/live';
  const state={catalog:[],aliases:new Map(),sent:new Set(),lastScan:0,observer:null,statusEl:null,lastFound:0};
  const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const isDraftPage=()=>/draft|mock/i.test(location.href)||/draft|mock/i.test(document.title);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  async function api(path,options={}){
    const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});
    if(!r.ok)throw Error(await r.text()||String(r.status));
    return r.status===204?null:r.json();
  }

  function aliasVariants(name){
    const n=norm(name);
    if(!n)return [];
    const out=new Set([n]);
    const t=n.split(' ').filter(Boolean);
    if(t.length>1){
      const first=t[0][0];
      const last=t[t.length-1];
      if(first&&last)out.add(`${first} ${last}`);
      if(first&&t.length>2)out.add(`${first} ${t[t.length-2]} ${last}`);
    }
    return [...out];
  }

  function addAlias(alias,p){
    if(!alias)return;
    if(!state.aliases.has(alias))state.aliases.set(alias,[]);
    const arr=state.aliases.get(alias);
    if(!arr.some(x=>x.player_key===p.player_key))arr.push(p);
  }

  async function loadCatalog(){
    const rows=await api('draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,active&active=eq.true&order=yahoo_rank.asc.nullslast');
    state.catalog=(rows||[]).filter(p=>Number.isFinite(Number(p.yahoo_rank)));
    state.aliases=new Map();
    state.catalog.forEach(p=>{
      [p.yahoo_name,p.display_name].filter(Boolean).forEach(name=>aliasVariants(name).forEach(a=>addAlias(a,p)));
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

  function looksLikePickContext(text){
    const t=clean(text);
    if(!t||t.length>1200)return false;
    return /(round|rd\.?)[\s#:.-]*\d+/i.test(t)||
      /(pick|pk\.?)[\s#:.-]*\d+/i.test(t)||
      /\b\d{1,2}\.\d{1,2}\b/.test(t)||
      /selected by|drafted by|was drafted|has drafted/i.test(t);
  }

  function insideAvailableOnly(text){
    const t=clean(text);
    return /available players|player list|queue|watchlist/i.test(t)&&!/selected by|drafted by|was drafted|has drafted/i.test(t);
  }

  function contextScore(p,context){
    const n=` ${norm(context)} `;
    let score=0;
    const team=norm(p.team);
    const pos=norm(p.position);
    if(team&&n.includes(` ${team} `))score+=10;
    if(pos&&n.includes(` ${pos} `))score+=7;
    return score;
  }

  function candidatesFromText(text,context=''){
    const n=norm(text);
    if(!n)return [];
    const hits=new Map();
    for(const [alias,players] of state.aliases){
      if(alias.length<3)continue;
      const matched=n===alias||n.startsWith(`${alias} `)||n.endsWith(` ${alias}`)||n.includes(` ${alias} `);
      if(!matched)continue;
      for(const p of players){
        const prior=hits.get(p.player_key);
        const aliasBonus=Math.min(alias.length,30)/10;
        const score=contextScore(p,context)+aliasBonus;
        if(!prior||score>prior.score)hits.set(p.player_key,{p,score});
      }
    }
    return [...hits.values()].sort((a,b)=>b.score-a.score||Number(a.p.yahoo_rank)-Number(b.p.yahoo_rank));
  }

  function resolvePlayer(text,context=''){
    const hits=candidatesFromText(text,context);
    if(!hits.length)return null;
    if(hits.length===1)return hits[0].p;
    if(hits[0].score>hits[1].score)return hits[0].p;
    return null;
  }

  function hasPickAncestor(el){
    let node=el;
    for(let depth=0;node&&depth<9;depth++,node=node.parentElement){
      const text=clean(node.innerText||node.textContent||'');
      if(!text)continue;
      if(insideAvailableOnly(text)&&text.length<650)return false;
      if(looksLikePickContext(text))return true;
    }
    return false;
  }

  function scanByPlayerElements(found){
    const nodes=document.querySelectorAll('a,span,div,p,strong,b,td');
    for(const el of nodes){
      if(el.childElementCount>3)continue;
      const text=clean(el.innerText||el.textContent||'');
      if(text.length<3||text.length>120)continue;
      let context=text;
      let node=el.parentElement;
      for(let depth=0;node&&depth<3;depth++,node=node.parentElement){
        context+=` ${clean(node.innerText||node.textContent||'')}`;
      }
      const p=resolvePlayer(text,context);
      if(!p)continue;
      if(hasPickAncestor(el))found.set(norm(p.player_key),p);
    }
  }

  function scanByRows(found){
    const selectors=[
      '[data-tst*="draft"]','[data-tst*="pick"]','[data-testid*="draft"]','[data-testid*="pick"]',
      '[class*="Draft"]','[class*="draft"]','[class*="Pick"]','[class*="pick"]',
      '[aria-label*="draft" i]','[aria-label*="pick" i]','[role="row"]','tr','li'
    ];
    const seen=new Set();
    selectors.forEach(sel=>{
      document.querySelectorAll(sel).forEach(el=>{
        if(seen.has(el))return; seen.add(el);
        const text=clean(el.innerText||el.textContent||'');
        if(text.length<5||text.length>1100||!looksLikePickContext(text)||insideAvailableOnly(text))return;
        const hits=candidatesFromText(text,text);
        const bestByPlayer=new Map();
        hits.forEach(h=>{
          if(!bestByPlayer.has(h.p.player_key))bestByPlayer.set(h.p.player_key,h);
        });
        [...bestByPlayer.values()].forEach(h=>found.set(norm(h.p.player_key),h.p));
      });
    });
  }

  function scanDrafted(){
    const found=new Map();
    scanByPlayerElements(found);
    scanByRows(found);
    return [...found.values()];
  }

  function tabByLabel(label){
    const want=label.toLowerCase();
    return [...document.querySelectorAll('button,a,[role="tab"]')]
      .find(el=>clean(el.textContent).toLowerCase()===want);
  }

  function activeDraftTab(){
    return [...document.querySelectorAll('button,a,[role="tab"]')]
      .find(el=>{
        const label=clean(el.textContent).toLowerCase();
        if(!['players','board','results','standings'].includes(label))return false;
        return el.getAttribute('aria-selected')==='true'||
          /\bactive\b|\bselected\b/i.test(String(el.className||''));
      });
  }

  async function scanResultsBackfill(){
    const resultsTab=tabByLabel('Results');
    if(!resultsTab)return [];
    const previous=activeDraftTab();
    const alreadyActive=previous===resultsTab||resultsTab.getAttribute('aria-selected')==='true';
    if(!alreadyActive){
      resultsTab.click();
      await wait(700);
    }
    const players=scanDrafted();
    if(!alreadyActive&&previous&&document.contains(previous)){
      previous.click();
      await wait(250);
    }
    return players;
  }

  async function loadAlreadySent(){
    const rows=await api('live_draft_state?select=player_key&drafted=eq.true');
    state.sent=new Set((rows||[]).map(x=>norm(x.player_key)));
  }

  async function markDrafted(players){
    state.lastFound=players.length;
    const fresh=players.filter(p=>!state.sent.has(norm(p.player_key)));
    if(!fresh.length){
      setStatus(`LIVE SYNC · ${state.lastFound} FOUND · ${state.sent.size} GONE`);
      return;
    }
    const body=fresh.map(p=>({player_key:p.player_key,drafted:true,drafted_at:new Date().toISOString()}));
    await api('live_draft_state?on_conflict=player_key',{
      method:'POST',
      headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify(body)
    });
    fresh.forEach(p=>state.sent.add(norm(p.player_key)));
    setStatus(`LIVE SYNC · ${state.lastFound} FOUND · ${state.sent.size} GONE`);
  }

  async function scan(force=false,backfill=false){
    if(!isDraftPage()){setStatus('LIVE SYNC · WAITING');return;}
    if(!force&&Date.now()-state.lastScan<700)return;
    state.lastScan=Date.now();
    try{
      if(!state.catalog.length){await loadCatalog();await loadAlreadySent();}
      let players=scanDrafted();
      const draftComplete=/draft complete/i.test(clean(document.body.innerText||document.body.textContent||''));
      if((backfill||draftComplete)&&players.length===0){
        const backfilled=await scanResultsBackfill();
        if(backfilled.length)players=backfilled;
      }
      await markDrafted(players);
      chrome.storage.local.set({
        lastScan:Date.now(),
        draftedCount:state.sent.size,
        foundCount:state.lastFound,
        lastUrl:location.href,
        lastError:null
      });
    }catch(e){
      setStatus('LIVE SYNC · ERROR',true);
      chrome.storage.local.set({lastScan:Date.now(),lastError:String(e.message||e)});
    }
  }

  function start(){
    ensureStatus();
    scan(true,false);
    let timer=null;
    state.observer=new MutationObserver(()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>scan(false,false),350);
    });
    state.observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    setInterval(()=>scan(false,false),5000);
    chrome.runtime.onMessage.addListener((msg,_sender,sendResponse)=>{
      if(msg?.type==='SCAN_NOW'){
        scan(true,true)
          .then(()=>sendResponse({ok:true,count:state.sent.size,found:state.lastFound}))
          .catch(e=>sendResponse({ok:false,error:e.message}));
      } else if(msg?.type==='STATUS'){
        sendResponse({ok:true,count:state.sent.size,found:state.lastFound,isDraftPage:isDraftPage(),url:location.href});
      }
      return true;
    });
  }

  start();
})();
