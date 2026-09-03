(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const state={players:[],gone:new Map(),q:'',lastChange:null,activeRoom:null,session:null};
  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
    return api('live_draft_state?select=player_key,drafted,drafted_at,room&drafted=eq.true&order=drafted_at.desc');
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
      const [catalog,liveAll,session]=await Promise.all([
        api('draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,active&active=eq.true&order=yahoo_rank.asc.nullslast'),
        loadLive(),
        loadSession()
      ]);

      state.session=session;
      state.activeRoom=session?.room||null;
      let live=liveAll||[];

      if(state.activeRoom){
        const scoped=live.filter(row=>row.room===state.activeRoom);
        if(scoped.length)live=scoped;
      }

      state.gone=new Map(live.map(x=>[norm(x.player_key),x]));
      state.players=(catalog||[])
        .filter(p=>p.yahoo_rank!=null&&Number.isFinite(Number(p.yahoo_rank)))
        .map(p=>({...p,key:norm(p.player_key),tier:Math.ceil(Number(p.yahoo_rank)/12)}))
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
    if(!state.q)return state.players;
    return state.players.filter(p=>`${p.yahoo_name||p.display_name} ${p.team||''} ${p.position||''}`.toLowerCase().includes(state.q));
  }

  function render(){
    const goneCount=state.players.filter(p=>state.gone.has(p.key)).length;
    const avail=state.players.length-goneCount;

    $('availableCount').textContent=avail;
    $('goneCount').textContent=goneCount;
    $('lastUpdate').textContent=state.lastChange?new Date(state.lastChange).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'—';

    renderDraftContext(goneCount);

    if($('roomTag')){
      const updated=state.session?.updated_at?new Date(state.session.updated_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'}):null;
      $('roomTag').textContent=state.activeRoom?`Yahoo room connected${updated?` · last signal ${updated}`:''}`:'Waiting for Yahoo draft-room signal…';
    }

    const rows=filtered();
    $('players').innerHTML=rows.map(p=>{
      const gone=state.gone.has(p.key);
      const posColor=POS_COLOR[String(p.position||'').toUpperCase()]||'';
      const style=posColor?` style="--pos-color:${posColor}"`:'';
      return `<article class="player ${gone?'gone':''}"${style}>
        ${gone?'<div class="drafted-mark">DRAFTED</div>':''}
        <div class="top"><span class="pos">${esc(p.position||'—')}</span><span class="rank">Yahoo #${esc(p.yahoo_rank)}</span></div>
        <div class="name">${esc(p.yahoo_name||p.display_name)}</div>
        <div class="meta">${esc(p.team||'')}</div>
        <div class="tier-line"><b>TIER ${p.tier}</b> · OVERALL ${esc(p.yahoo_rank)}</div>
      </article>`;
    }).join('')||'<div class="empty">No players match your search.</div>';
  }

  $('search').oninput=e=>{state.q=e.target.value.trim().toLowerCase();render();};

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
  setInterval(load,1500);
})();
