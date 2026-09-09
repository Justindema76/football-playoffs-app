(() => {
  'use strict';
  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const LEAGUE_KEY='battle-of-the-kings-2026';
  const state={teams:[],rosters:[],tags:new Map(),intel:new Map(),q:''};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  async function api(path){
    const r=await fetch(`${SB}/rest/v1/${path}`,{headers:H,cache:'no-store'});
    if(!r.ok)throw new Error(await r.text()||String(r.status));
    return r.json();
  }

  async function load(){
    setSync('loading','LOADING');
    $('teams').innerHTML='<div class="loading">Loading league ownership…</div>';
    try{
      const [teams,rosters,tags,intel]=await Promise.all([
        api(`fantasy_league_teams?select=*&league_key=eq.${LEAGUE_KEY}&active=eq.true&order=is_my_team.desc,team_name.asc`),
        api('fantasy_league_rosters?select=*&active=eq.true&order=roster_slot.asc,yahoo_player_name.asc'),
        api('planner_player_tags?select=player_key,tags,reason,last_confirmed_date'),
        api('intel_items?select=player_name,action,priority,recommendation,last_confirmed_date,updated_at&resolved_at=is.null&transfer_to_live=eq.true&order=updated_at.desc')
      ]);
      state.teams=teams||[];state.rosters=rosters||[];
      state.tags=new Map((tags||[]).map(x=>[norm(x.player_key),x]));
      state.intel=new Map();
      for(const item of intel||[]){const k=norm(item.player_name);if(k&&!state.intel.has(k))state.intel.set(k,item)}
      render();
      const last=state.teams.map(t=>t.last_synced_at).filter(Boolean).sort().at(-1)||null;
      setSync('live',state.rosters.length?'SYNCED':'WAITING',last);
      $('notice').hidden=state.rosters.length>0;
      if(!state.rosters.length){$('notice').textContent='The 12 teams are ready, but player rosters have not been synced yet. Run the Yahoo League Sync extension from your Yahoo league.'}
    }catch(error){
      console.error(error);setSync('error','ERROR');$('teams').innerHTML='<div class="loading">League data could not load.</div>';
      $('notice').hidden=false;$('notice').textContent=error.message;
    }
  }

  function setSync(mode,label,time=null){
    $('syncDot').className=mode==='live'?'live':mode==='error'?'error':'';
    $('syncLabel').textContent=label;
    $('syncTime').textContent=time?`Last sync ${new Date(time).toLocaleString()}`:'';
  }

  function rosterFor(team){return state.rosters.filter(r=>r.league_team_id===team.id)}
  function rowMatches(team,row){
    if(!state.q)return true;
    return [team.team_name,team.manager_name,row.yahoo_player_name,row.nfl_team,row.position,row.roster_slot].join(' ').toLowerCase().includes(state.q);
  }
  function teamMatches(team,rows){
    if(!state.q)return true;
    if([team.team_name,team.manager_name,team.yahoo_team_key].join(' ').toLowerCase().includes(state.q))return true;
    return rows.some(r=>rowMatches(team,r));
  }
  function slotWeight(slot){
    const map={QB:1,RB:2,WR:3,TE:4,'W/R/T':5,'W/R':5,'Q/W/R/T':5,K:6,DEF:7,BN:8,IR:9,'IR+':9,NA:10};
    return map[String(slot||'').toUpperCase()]||20;
  }

  function render(){
    const all=state.rosters;
    $('teamCount').textContent=state.teams.length;
    $('rosterCount').textContent=all.length;
    $('matchedCount').textContent=all.filter(x=>x.player_key).length;
    $('unmatchedCount').textContent=all.filter(x=>!x.player_key).length;

    const cards=[];
    for(const team of state.teams){
      let rows=rosterFor(team).sort((a,b)=>slotWeight(a.roster_slot)-slotWeight(b.roster_slot)||String(a.yahoo_player_name).localeCompare(String(b.yahoo_player_name)));
      if(!teamMatches(team,rows))continue;
      if(state.q)rows=rows.filter(r=>rowMatches(team,r)||[team.team_name,team.manager_name].join(' ').toLowerCase().includes(state.q));
      cards.push(teamCard(team,rows));
    }
    $('teams').innerHTML=cards.join('')||'<div class="loading">No teams or players match your search.</div>';
    document.querySelectorAll('.team-head').forEach(head=>head.addEventListener('click',()=>head.closest('.team-card')?.classList.toggle('open')));
  }

  function teamCard(team,rows){
    const originalCount=rosterFor(team).length;
    const manager=team.manager_name?` · ${esc(team.manager_name)}`:'';
    const synced=team.last_synced_at?new Date(team.last_synced_at).toLocaleDateString():'';
    return `<section class="team-card ${team.is_my_team?'my-team open':''}">
      <header class="team-head">
        <div class="team-title"><h2>${esc(team.team_name)}</h2><p>Yahoo Team ${esc(team.yahoo_team_key||'—')}${manager}${synced?` · synced ${esc(synced)}`:''}</p></div>
        <div class="team-badges">${team.is_my_team?'<span class="badge mine">YOUR TEAM</span>':''}<span class="team-count">${originalCount}</span></div>
      </header>
      <div class="roster">${rows.map(playerRow).join('')||'<div class="empty">No roster synced yet.</div>'}</div>
    </section>`;
  }

  function playerRow(row){
    const key=norm(row.player_key||row.yahoo_player_name);
    const tag=state.tags.get(key);
    const intel=state.intel.get(norm(row.yahoo_player_name));
    const tags=(tag?.tags||[]).slice(0,2);
    const action=intel?.action?String(intel.action).toLowerCase():'';
    return `<div class="player-row">
      <span class="slot">${esc(row.roster_slot||'—')}</span>
      <div class="player-main"><div class="player-name">${esc(row.yahoo_player_name)}</div><div class="player-meta">${esc(row.position||'—')} · ${esc(row.nfl_team||'—')}</div></div>
      <div class="player-right">${intel?.action?`<span class="intel ${esc(action)}">${esc(intel.action)}</span>`:''}${tags.map(t=>`<span class="intel">${esc(t)}</span>`).join('')}${!row.player_key?'<span class="unmatched">UNMATCHED</span>':''}</div>
    </div>`;
  }

  $('search').addEventListener('input',e=>{state.q=e.target.value.trim().toLowerCase();render()});
  $('refreshButton').addEventListener('click',load);
  $('themeButton').addEventListener('click',()=>{
    document.documentElement.classList.toggle('light');
    $('themeButton').textContent=document.documentElement.classList.contains('light')?'🌙':'☀️';
    localStorage.setItem('fantasyLeagueTheme',document.documentElement.classList.contains('light')?'light':'dark');
  });
  if(localStorage.getItem('fantasyLeagueTheme')==='light'){document.documentElement.classList.add('light');$('themeButton').textContent='🌙'}
  load();
})();
