(() => {
  'use strict';
  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const state={players:[],gone:new Map(),view:'starred',q:'',lastChange:null,mineSupported:null,roomSupported:null,activeRoom:null,sortBy:'rank',sortDir:'asc'};
  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const POS_COLOR={QB:'var(--qb)',RB:'var(--rb)',WR:'var(--wr)',TE:'var(--te)',K:'var(--k)',DEF:'var(--def)'};
  const SCHEMA_ERR=/column|schema cache|does not exist|42703/i;
  async function api(path,options={}){const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});if(!r.ok)throw Error(await r.text()||String(r.status));return r.status===204?null:r.json()}
  async function loadLive(){
    // "mine" and "room" may not exist as columns yet -- they're additive
    // features on top of an already-working table. Ask for both; if
    // Postgres rejects the select, drop room first (retry), then mine
    // too if it's still failing, rather than take the whole page down
    // over a bonus field.
    const attempt=async(withMine,withRoom)=>{
      const cols=['player_key','drafted','drafted_at'];
      if(withMine)cols.push('mine');
      if(withRoom)cols.push('room');
      return api(`live_draft_state?select=${cols.join(',')}&drafted=eq.true&order=drafted_at.desc`);
    };
    const wantMine=state.mineSupported!==false;
    const wantRoom=state.roomSupported!==false;
    try{
      const rows=await attempt(wantMine,wantRoom);
      if(wantMine)state.mineSupported=true;
      if(wantRoom)state.roomSupported=true;
      return rows;
    }catch(e){
      if(!SCHEMA_ERR.test(String(e.message||'')))throw e;
    }
    if(wantRoom){
      try{
        const rows=await attempt(wantMine,false);
        state.roomSupported=false;
        if(wantMine)state.mineSupported=true;
        return rows;
      }catch(e){
        if(!SCHEMA_ERR.test(String(e.message||'')))throw e;
      }
    }
    state.mineSupported=false;
    state.roomSupported=false;
    return attempt(false,false);
  }
  async function load(){
    $('syncStatus').className='status syncing';$('syncStatus').textContent='SYNCING';
    try{
      const [catalog,targets,liveAll]=await Promise.all([
        api('draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,active&active=eq.true&order=yahoo_rank.asc.nullslast'),
        api('draft_target_selection?select=player_key,user_target'),
        loadLive()
      ]);
      const tm=new Map((targets||[]).map(x=>[norm(x.player_key),!!x.user_target]));
      // The Live Sync extension runs in every open Yahoo draft tab at
      // once. Before rooms were tagged, an old mock draft left open in
      // another tab would keep writing into this same table forever,
      // and its picks would show as "gone" here even though they have
      // nothing to do with the draft actually being watched. Once rows
      // carry a room id, scope down to whichever room has the most
      // recent pick -- that's overwhelmingly the one that's actually
      // live right now, since a stale/abandoned tab stops advancing.
      let live=liveAll||[];
      state.activeRoom=null;
      if(state.roomSupported&&live.length){
        const latestByRoom=new Map();
        for(const row of live){
          const r=row.room||'(untagged)';
          const t=row.drafted_at||'';
          if(!latestByRoom.has(r)||t>latestByRoom.get(r))latestByRoom.set(r,t);
        }
        let bestRoom=null,bestTime='';
        for(const [r,t] of latestByRoom)if(t>bestTime){bestTime=t;bestRoom=r;}
        state.activeRoom=bestRoom;
        live=live.filter(row=>(row.room||'(untagged)')===bestRoom);
      }
      state.gone=new Map(live.map(x=>[norm(x.player_key),x]));
      // p.yahoo_rank must be checked for null/undefined BEFORE the Number()
      // coercion below -- Number(null) is 0, not NaN, so a catalog row with
      // no rank was passing isFinite() and sorting to the very front of the
      // list (ahead of the real #1) instead of being excluded like it
      // should be. That's what put rankless rows like Justice Hill and
      // George Holani above Jahmyr Gibbs.
      state.players=(catalog||[]).filter(p=>p.yahoo_rank!=null&&Number.isFinite(Number(p.yahoo_rank))).map(p=>({...p,key:norm(p.player_key),starred:tm.get(norm(p.player_key))===true})).sort((a,b)=>Number(a.yahoo_rank)-Number(b.yahoo_rank));
      state.lastChange=live[0]?.drafted_at||state.lastChange;
      $('syncStatus').className='status live';$('syncStatus').textContent='LIVE';
      $('notice').hidden=true;
      render();
    }catch(e){$('syncStatus').className='status error';$('syncStatus').textContent='ERROR';$('notice').hidden=false;$('notice').textContent=e.message;}
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
    }[state.sortBy]||((a,b)=>0);
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
    if($('roomTag')){
      $('roomTag').hidden=!state.roomSupported;
      $('roomTag').textContent=state.activeRoom?`Showing room ${state.activeRoom} (most recently active)`:'';
    }
    $('mineTab').hidden=state.mineSupported===false;
    if(state.mineSupported!==false)$('mineTab').textContent=`MINE (${mineCount})`;
    const a=filtered();
    $('players').innerHTML=a.map(p=>{
      const gone=state.gone.has(p.key);
      const mine=gone&&state.gone.get(p.key)?.mine===true;
      const posColor=POS_COLOR[String(p.position||'').toUpperCase()]||'';
      const style=posColor?` style="--pos-color:${posColor}"`:'';
      return `<article class="player ${p.starred?'starred':''} ${gone?'gone':''} ${mine?'mine':''}"${style}><div class="top"><span class="pos">${esc(p.position||'—')}</span><span class="rank">Yahoo #${esc(p.yahoo_rank)}</span></div><div class="name">${esc(p.yahoo_name||p.display_name)}</div><div class="meta">${esc(p.team||'')} ${gone?'· drafted':''}</div><div class="badges">${p.starred?'<span class="badge star">★ STARRED</span>':''}${gone?'<span class="badge gone">GONE</span>':''}${mine?'<span class="badge mine">YOUR PICK</span>':''}</div>${gone?`<button class="undo" data-undo="${esc(p.player_key)}">UNDO</button>`:''}</article>`;
    }).join('')||'<div class="empty">No players match this view.</div>';
    document.querySelectorAll('[data-undo]').forEach(b=>b.onclick=()=>undo(b.dataset.undo));
  }
  async function undo(key){
    try{await api(`live_draft_state?player_key=eq.${encodeURIComponent(key)}`,{method:'DELETE'});await load()}catch(e){$('notice').hidden=false;$('notice').textContent=`UNDO failed: ${e.message}`}
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));render()});
  $('search').oninput=e=>{state.q=e.target.value.trim().toLowerCase();render()};
  $('sortBy').onchange=e=>{state.sortBy=e.target.value;render()};
  $('sortDir').onclick=()=>{
    state.sortDir=state.sortDir==='asc'?'desc':'asc';
    $('sortDir').textContent=state.sortDir==='asc'?'↑':'↓';
    $('sortDir').classList.toggle('desc',state.sortDir==='desc');
    render();
  };
  $('refresh').onclick=()=>load();
  $('reset').onclick=async()=>{
    if(!confirm('Clear every drafted/gone mark? Do this between drafts (a new mock, or before draft night) so old picks don\'t carry over -- not mid-draft.'))return;
    try{await api('live_draft_state?player_key=not.is.null',{method:'DELETE'});await load()}
    catch(e){$('notice').hidden=false;$('notice').textContent=`Reset failed: ${e.message}`}
  };
  load();
  setInterval(load,2000);
})();
