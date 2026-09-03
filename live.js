(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const state={players:[],gone:new Map(),view:'starred',q:'',lastChange:null,activeRoom:null,session:null,sortBy:'rank',sortDir:'asc'};
  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const POS_COLOR={QB:'var(--qb)',RB:'var(--rb)',WR:'var(--wr)',TE:'var(--te)',K:'var(--k)',DEF:'var(--def)'};

  async function api(path,options={}){
    const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});
    if(!r.ok)throw Error(await r.text()||String(r.status));
    return r.status===204?null:r.json();
  }

  async function loadSession(){
    try{
      const rows=await api('live_draft_session?select=room,draft_slot,team_count,status,updated_at&order=updated_at.desc&limit=1');
      return rows?.[0]||null;
    }catch(_e){
      return null;
    }
  }

  async function loadLive(){
    return api('live_draft_state?select=player_key,drafted,drafted_at,mine,room&drafted=eq.true&order=drafted_at.desc');
  }

  function snakePick(slot,round,teams){
    return round%2?((round-1)*teams+slot):(round*teams-slot+1);
  }

  function ordinal(n){
    const v=n%100;
    return `${n}${v>=11&&v<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th')}`;
  }

  function renderDraftContext(goneCount){
    const s=state.session;
    const slot=Number(s?.draft_slot);
    const teams=Number(s?.team_count)||12;

    if(!Number.isInteger(slot)||slot<1||slot>teams){
      $('draftSlot').textContent='—';
      $('slotStatus').textContent='Waiting for Yahoo position';
      $('nextPick').textContent='—';
      $('picksAway').textContent='Open the Yahoo waiting room';
      $('currentRound').textContent='—';
      $('leagueSize').textContent=`${teams}-team snake`;
      $('overallPick').textContent='—';
      return;
    }

    const waiting=String(s?.status||'').toUpperCase()==='WAITING';
    const currentOverall=waiting?1:Math.max(1,goneCount+1);
    const round=Math.max(1,Math.ceil(currentOverall/teams));
    let nextPick=null,nextRound=null;

    for(let r=round;r<=25;r++){
      const pick=snakePick(slot,r,teams);
      if(pick>=currentOverall){nextPick=pick;nextRound=r;break;}
    }

    const away=nextPick==null?null:Math.max(0,nextPick-currentOverall);
    $('draftSlot').textContent=`#${slot}`;
    $('slotStatus').textContent=`${ordinal(slot)} of ${teams} · ${String(s?.status||'CONNECTED').toUpperCase()}`;
    $('nextPick').textContent=nextPick==null?'—':`#${nextPick}`;
    $('picksAway').textContent=away==null?'Waiting for draft':away===0?'YOU ARE ON THE CLOCK':`${away} pick${away===1?'':'s'} away · Round ${nextRound}`;
    $('currentRound').textContent=`R${round}`;
    $('leagueSize').textContent=`${teams}-team snake`;
    $('overallPick').textContent=`#${currentOverall}`;
  }

  async function load(){
    $('syncStatus').className='status syncing';
    $('syncStatus').textContent='SYNCING';

    try{
      const [catalog,targets,liveAll,session]=await Promise.all([
        api('draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,active&active=eq.true&order=yahoo_rank.asc.nullslast'),
        api('draft_target_selection?select=player_key,user_target'),
        loadLive(),
        loadSession()
      ]);

      state.session=session;
      state.activeRoom=session?.room||null;
      const tm=new Map((targets||[]).map(x=>[norm(x.player_key),!!x.user_target]));
      let live=liveAll||[];

      // Use room-scoped rows when the sync extension has tagged them. Older
      // rows remain compatible so the viewer does not go blank during the transition.
      if(state.activeRoom){
        const scoped=live.filter(row=>row.room===state.activeRoom);
        if(scoped.length)live=scoped;
      }

      state.gone=new Map(live.map(x=>[norm(x.player_key),x]));
      state.players=(catalog||[])
        .filter(p=>p.yahoo_rank!=null&&Number.isFinite(Number(p.yahoo_rank)))
        .map(p=>({...p,key:norm(p.player_key),starred:tm.get(norm(p.player_key))===true,tier:Math.ceil(Number(p.yahoo_rank)/12)}))
        .sort((a,b)=>Number(a.yahoo_rank)-Number(b.yahoo_rank));

      state.lastChange=live[0]?.drafted_at||state.lastChange;
      $('syncStatus').className='status live';
      $('syncStatus').textContent=session?.draft_slot?'YAHOO CONNECTED':'LIVE FEED';
      $('notice').hidden=true;
      render();
    }catch(e){
      $('syncStatus').className='status error';
      $('syncStatus').textContent='ERROR';
      $('notice').hidden=false;
      $('notice').textContent=e.message;
    }
  }

  function filtered(){
    const rows=state.players.filter(p=>{
      const gone=state.gone.has(p.key);
      const mine=gone&&state.gone.get(p.key)?.mine===true;
      if(state.view==='starred'&&!p.starred)return false;
      if(state.view==='gone'&&!gone)return false;
      if(state.view==='mine'&&!mine)return false;
      if(state.q&&!`${p.yahoo_name||p.display_name} ${p.team||''} ${p.position||''}`.toLowerCase().includes(state.q))return false;
      return true;
    });

    const dir=state.sortDir==='desc'?-1:1;
    const cmp={
      rank:(a,b)=>(Number(a.yahoo_rank)-Number(b.yahoo_rank))*dir,
      name:(a,b)=>String(a.yahoo_name||a.display_name).localeCompare(String(b.yahoo_name||b.display_name))*dir,
      pos:(a,b)=>(String(a.position||'').localeCompare(String(b.position||''))||Number(a.yahoo_rank)-Number(b.yahoo_rank))*dir,
      team:(a,b)=>(String(a.team||'').localeCompare(String(b.team||''))||Number(a.yahoo_rank)-Number(b.yahoo_rank))*dir
    }[state.sortBy]||(()=>0);

    return rows.sort(cmp);
  }

  function render(){
    const goneCount=state.players.filter(p=>state.gone.has(p.key)).length;
    const avail=state.players.length-goneCount;
    const starredLeft=state.players.filter(p=>p.starred&&!state.gone.has(p.key)).length;
    const mineCount=state.players.filter(p=>state.gone.get(p.key)?.mine===true).length;

    $('availableCount').textContent=avail;
    $('goneCount').textContent=goneCount;
    $('starCount').textContent=starredLeft;
    $('lastUpdate').textContent=state.lastChange?new Date(state.lastChange).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'—';
    $('mineTab').hidden=mineCount===0;
    if(mineCount)$('mineTab').textContent=`MY PICKS (${mineCount})`;

    renderDraftContext(goneCount);

    if($('roomTag')){
      const updated=state.session?.updated_at?new Date(state.session.updated_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'}):null;
      $('roomTag').textContent=state.activeRoom?`Yahoo room: ${state.activeRoom}${updated?` · position signal ${updated}`:''}`:'Waiting for Yahoo draft-room signal…';
    }

    const rows=filtered();
    $('players').innerHTML=rows.map(p=>{
      const gone=state.gone.has(p.key);
      const mine=gone&&state.gone.get(p.key)?.mine===true;
      const posColor=POS_COLOR[String(p.position||'').toUpperCase()]||'';
      const style=posColor?` style="--pos-color:${posColor}"`:'';
      return `<article class="player ${p.starred?'starred':''} ${gone?'gone':''} ${mine?'mine':''}"${style}>
        <div class="top"><span class="pos">${esc(p.position||'—')}</span><span class="rank">Yahoo #${esc(p.yahoo_rank)}</span></div>
        <div class="name">${esc(p.yahoo_name||p.display_name)}</div>
        <div class="meta">${esc(p.team||'')} ${gone?'· drafted':''}</div>
        <div class="tier-line"><b>TIER ${p.tier}</b> · OVERALL ${esc(p.yahoo_rank)}</div>
        <div class="badges">${p.starred?'<span class="badge star">★ MY TARGET</span>':''}${gone?'<span class="badge gone">DRAFTED</span>':''}${mine?'<span class="badge mine">MY PICK</span>':''}</div>
        ${gone?`<button class="undo" data-undo="${esc(p.player_key)}">UNDO</button>`:''}
      </article>`;
    }).join('')||'<div class="empty">No players match this view.</div>';

    document.querySelectorAll('[data-undo]').forEach(b=>b.onclick=()=>undo(b.dataset.undo));
  }

  async function undo(key){
    try{
      await api(`live_draft_state?player_key=eq.${encodeURIComponent(key)}`,{method:'DELETE'});
      await load();
    }catch(e){
      $('notice').hidden=false;
      $('notice').textContent=`UNDO failed: ${e.message}`;
    }
  }

  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{
    state.view=b.dataset.view;
    document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));
    render();
  });

  $('search').oninput=e=>{state.q=e.target.value.trim().toLowerCase();render();};
  $('sortBy').onchange=e=>{state.sortBy=e.target.value;render();};
  $('sortDir').onclick=()=>{
    state.sortDir=state.sortDir==='asc'?'desc':'asc';
    $('sortDir').textContent=state.sortDir==='asc'?'↑':'↓';
    $('sortDir').classList.toggle('desc',state.sortDir==='desc');
    render();
  };
  $('refresh').onclick=()=>load();
  $('reset').onclick=async()=>{
    if(!confirm('Clear every drafted mark before a new mock/draft?'))return;
    try{
      await api('live_draft_state?player_key=not.is.null',{method:'DELETE'});
      await load();
    }catch(e){
      $('notice').hidden=false;
      $('notice').textContent=`Reset failed: ${e.message}`;
    }
  };

  load();
  setInterval(load,2000);
})();
