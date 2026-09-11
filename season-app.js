(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const APP_KEY='fantasyFootball2026AppKey';
  const LEAGUE_KEY='battle-of-the-kings-2026';
  const MY_TEAM_KEY=new URLSearchParams(location.search).get('team')||'6';
  const VIEWS=['team','intel','players','runningbacks','widereceivers','injuries','weather','league'];
  const FILTERS=['ALL','QB','RB','WR','TE','DEF','K','STARRED','INTEL','INJURY'];
  const POSITION_PANEL_FILTERS=['ALL','STARRED','INTEL','INJURY'];
  const RB_PANEL_FILTERS=['ALL','STARRED','HANDCUFF','COWBELL','INTEL','INJURY'];
  const FILTER_VIEWS=new Set(['players','intel','runningbacks','widereceivers','injuries']);
  const state={view:'team',pos:'ALL',q:'',players:[],intel:[],weather:[],owner:[],suggestions:[],roster:[],leagueTeams:[],leagueRosters:[],leagueMatchups:[],leagueWeek:1,errors:[]};
  const $=id=>document.getElementById(id);
  const playersApi=window.FantasyPlayers;
  const intelApi=window.FantasyIntel;
  const runningBacksApi=window.FantasyRunningBacks;
  const wideReceiversApi=window.FantasyWideReceivers;

  if(!playersApi||!intelApi||!runningBacksApi||!wideReceiversApi){
    console.error('Feature modules failed to load.');
    const n=$('notice');
    if(n){n.hidden=false;n.textContent='A fantasy feature module failed to load. Refresh the page.'}
    return;
  }

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normPos=v=>{const p=String(v||'').toUpperCase();return ['QB','RB','WR','TE','DEF','K'].includes(p)?p:'X'};
  const suggestionSort=(a,b)=>new Date(b.source_date||b.created_at||0)-new Date(a.source_date||a.created_at||0);
  const slotWeight=slot=>({QB:1,RB:2,WR:3,TE:4,'W/R/T':5,'W/R':5,'Q/W/R/T':5,K:6,DEF:7,BN:8,IR:9,'IR+':9,NA:10}[String(slot||'').toUpperCase()]||20);
  const isBenchSlot=slot=>['BN','IR','IR+','NA'].includes(String(slot||'').toUpperCase());
  const tagClass=t=>{
    const x=String(t||'').toLowerCase();
    for(const k of ['target','injury','monitor','cowbell','workhorse','handcuff','stack','upgrade','downgrade','avoid','committee','value','start','sit','add']) if(x.includes(k)) return k;
    return '';
  };

  async function api(path,options={}){
    const method=String(options.method||'GET').toUpperCase();
    if(method!=='GET'){
      const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});
      if(!r.ok)throw Error(await r.text()||String(r.status));
      return r.status===204?null:r.json();
    }
    const all=[];
    const pageSize=1000;
    for(let from=0;;from+=pageSize){
      const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{}),Range:`${from}-${from+pageSize-1}`},cache:'no-store'});
      if(!r.ok)throw Error(await r.text()||String(r.status));
      const data=r.status===204?null:await r.json();
      if(!Array.isArray(data))return data;
      all.push(...data);
      if(data.length<pageSize)return all;
    }
  }
  async function safe(name,path){try{return{name,data:await api(path),error:null}}catch(error){return{name,data:[],error}}}
  function setSync(s,t){$('syncPill').dataset.state=s;$('syncText').textContent=t}
  const matches=player=>playersApi.matches(player,state,intelApi);

  function buildMyRoster(teams,rosters){
    const me=(teams||[]).find(t=>String(t.yahoo_team_key||'')===String(MY_TEAM_KEY));
    if(!me)return [];
    return (rosters||[])
      .filter(r=>r.league_team_id===me.id&&r.active!==false)
      .map((r,index)=>({
        player_key:r.player_key||r.yahoo_player_key||r.yahoo_player_name,
        yahoo_player_key:r.yahoo_player_key||null,
        player_name:r.yahoo_player_name||r.player_name||'Player',
        team:r.nfl_team||r.team||null,
        position:r.position||null,
        roster_slot:r.roster_slot||r.position||'',
        lineup_group:typeof r.is_starter==='boolean'?(r.is_starter?'STARTER':'BENCH'):(isBenchSlot(r.roster_slot)?'BENCH':'STARTER'),
        display_order:Number.isFinite(Number(r.lineup_order))?Number(r.lineup_order):index+1,
        active:true,
        updated_at:r.last_synced_at||r.updated_at||null
      }))
      .sort((a,b)=>(a.display_order-b.display_order)||slotWeight(a.roster_slot)-slotWeight(b.roster_slot)||a.player_name.localeCompare(b.player_name));
  }

  async function load(){
    setSync('loading','SYNCING');
    const rs=await Promise.all([
      safe('catalog','fantasy_players?select=player_key,yahoo_player_key,yahoo_name,player_name,team,position,yahoo_rank,role,active&active=eq.true&yahoo_player_key=not.is.null&order=yahoo_rank.asc.nullslast,yahoo_name.asc'),
      safe('targets','draft_target_selection?select=player_key,user_target,user_tags,user_note,priority,updated_at'),
      safe('planner','planner_player_tags?select=player_key,player_name,team,position,tags,reason,last_confirmed_date,updated_at,transfer_to_live'),
      intelApi.safeLoad(api),
      safe('suggestions','player_suggestions?select=player_key,source_name,suggestion_type,sentiment,note,suggested_round,source_context,source_date,created_at&order=source_date.desc.nullslast,created_at.desc'),
      safe('weather','weather_watch?select=*&order=game_time.asc.nullslast'),
      safe('owner','intel_owner_state?select=*'),
      safe('leagueTeams',`fantasy_league_teams?select=*&league_key=eq.${LEAGUE_KEY}&active=eq.true&order=yahoo_team_key.asc`),
      safe('leagueRosters','fantasy_league_rosters?select=*&active=eq.true&order=league_team_id.asc,lineup_order.asc,roster_slot.asc,yahoo_player_name.asc'),
      safe('leagueMatchups',`fantasy_league_matchups?select=*&league_key=eq.${LEAGUE_KEY}&order=week.asc,matchup_key.asc`)
    ]);

    const R=Object.fromEntries(rs.map(x=>[x.name,x]));
    state.intel=intelApi.sort(R.intel?.data||[]);
    state.suggestions=(R.suggestions?.data||[]).slice().sort(suggestionSort);
    state.leagueTeams=R.leagueTeams?.data||[];
    state.leagueRosters=R.leagueRosters?.data||[];
    state.leagueMatchups=R.leagueMatchups?.data||[];
    state.roster=buildMyRoster(state.leagueTeams,state.leagueRosters);
    const master=(R.catalog?.data||[]).map(p=>({...p,display_name:p.player_name||p.yahoo_name,source:'Yahoo Players'}));
    state.players=playersApi.build({catalog:master,targets:R.targets?.data||[],planner:R.planner?.data||[],intel:state.intel,suggestions:state.suggestions,roster:state.roster,intelApi});
    state.weather=R.weather?.data||[];
    state.owner=R.owner?.data||[];
    state.errors=rs.filter(x=>x.error).map(x=>x.name);
    setSync(state.errors.length?(state.players.length?'partial':'error'):'live',state.errors.length?(state.players.length?'PARTIAL':'ERROR'):'LIVE');
    render();
  }

  function setView(view,{updateHash=true,scroll=true}={}){
    if(!VIEWS.includes(view))view='team';
    state.view=view;
    state.pos=view==='intel'?'STARRED':'ALL';
    render();
    if(scroll)scrollTo({top:0,behavior:'smooth'});
    if(updateHash)history.replaceState(null,'',`#${view}`);
  }

  function render(){
    $('shell').dataset.view=state.view;
    document.querySelectorAll('.bottom-nav button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
    const titles={team:'MY TEAM',intel:'INTEL',players:'PLAYERS',runningbacks:'RUNNING BACKS',widereceivers:'WIDE RECEIVERS',injuries:'INJURIES',weather:'WEATHER',league:'LEAGUE'};
    $('pageTitle').textContent=titles[state.view]||state.view.toUpperCase();
    $('rosterCount').textContent=state.roster.length;
    $('starterCount').textContent=state.roster.filter(x=>x.lineup_group==='STARTER').length;
    $('intelCount').textContent=state.intel.length;
    $('flagCount').textContent=state.owner.filter(x=>x.is_flagged).length;
    renderFilters();renderNotice();renderView();
  }

  function renderFilters(){
    const a=['team','weather','league'].includes(state.view)?[]:state.view==='runningbacks'?RB_PANEL_FILTERS:state.view==='widereceivers'?POSITION_PANEL_FILTERS:(FILTER_VIEWS.has(state.view)?FILTERS:['ALL']);
    $('positionFilters').innerHTML=a.map(p=>`<button class="${state.pos===p?'active':''}" data-pos="${p}">${p}</button>`).join('');
    $('positionFilters').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.pos=b.dataset.pos;renderFilters();renderView()});
  }

  function renderNotice(){
    const n=$('notice');
    if(!state.errors.length){n.hidden=true;n.textContent='';return}
    n.hidden=false;n.textContent=`Some current data could not load: ${state.errors.join(', ')}.`;
  }

  function renderView(){
    if(state.view==='team')return renderTeam();
    if(state.view==='players')return renderPlayers();
    if(state.view==='intel')return intelApi.render({state,$,esc,normPos,tagClass,matches});
    if(state.view==='weather')return renderWeather();
    if(state.view==='league')return renderLeague();
    if(state.view==='runningbacks')return runningBacksApi.render({state,$,esc,tagClass,intelApi,playersApi,bindTargets});
    if(state.view==='widereceivers')return wideReceiversApi.render({state,$,esc,tagClass,intelApi,playersApi,bindTargets});
    return renderTagged();
  }

  function rosterPlayer(row){
    const key=playersApi.normKey(row.player_key||row.player_name||row.yahoo_player_name);
    return state.players.find(p=>playersApi.normKey(p.player_key||p.yahoo_name||p.display_name)===key)||null;
  }

  function rosterMatches(row){
    const q=state.q;
    if(!q)return true;
    const p=rosterPlayer(row);
    return [row.player_name,row.team,row.position,row.roster_slot,p?.planner_reason,...(p?playersApi.allTags(p):[])].join(' ').toLowerCase().includes(q);
  }

  function renderTeam(){
    const roster=state.roster.filter(rosterMatches);
    const starters=roster.filter(x=>x.lineup_group==='STARTER');
    const bench=roster.filter(x=>x.lineup_group==='BENCH');
    const rb=state.roster.filter(x=>x.position==='RB').length,wr=state.roster.filter(x=>x.position==='WR').length,te=state.roster.filter(x=>x.position==='TE').length,qb=state.roster.filter(x=>x.position==='QB').length;
    $('pageMeta').textContent=`${state.roster.length} rostered · ${starters.length} starters · ${bench.length} bench`;
    $('content').innerHTML=`
      <div class="roster-overview"><div><b>${qb}</b><span>QB</span></div><div><b>${rb}</b><span>RB</span></div><div><b>${wr}</b><span>WR</span></div><div><b>${te}</b><span>TE</span></div></div>
      ${rosterSection('STARTERS',starters)}
      ${rosterSection('BENCH',bench)}
    `;
  }

  function rosterSection(title,rows){
    return `<section class="roster-section"><div class="roster-section-head"><b>${title}</b><span>${rows.length} players</span></div><div class="roster-grid">${rows.map(rosterCard).join('')||'<div class="empty">No players.</div>'}</div></section>`;
  }

  function rosterCard(row){
    const p=rosterPlayer(row);
    const tags=p?playersApi.allTags(p).filter(t=>t!=='TARGET'):[];
    const lower=tags.map(t=>String(t).toUpperCase());
    const statusClass=lower.includes('INJURY')?'injury':lower.includes('MONITOR')?'monitor':'';
    const latest=p?intelApi.latest(p.intel_items||[]):null;
    const context=p?.planner_reason||latest?.recommendation||latest?.what_changed||'No material roster change currently logged.';
    return `<article class="roster-card ${statusClass}"><div class="roster-slot">${esc(row.roster_slot)}</div><div class="roster-main"><div class="roster-name">${esc(row.player_name)}</div><div class="roster-meta"><span class="pos ${normPos(row.position)}">${esc(row.position)}</span><span class="team-badge">${esc(row.team||'FA')}</span></div>${tags.length?`<div class="tags">${tags.slice(0,6).map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}<div class="roster-read">${esc(context)}</div>${lower.includes('INJURY')?'<div class="roster-alert">INJURY / AVAILABILITY ITEM — keep monitoring.</div>':''}</div></article>`;
  }

  function visiblePlayers(){return state.players.filter(matches).sort(playersApi.sortYahoo)}

  function renderPlayerContext(p){
    const suggestions=p.suggestions||[];
    let out='';
    if(p.planner_reason)out+=`<div class="player-context"><b>PLAYER READ:</b> ${esc(p.planner_reason)}</div>`;
    out+=intelApi.renderPlayerDetails(p,esc,tagClass);
    if(suggestions.length)out+=`<details class="player-details"><summary>Research / Strategy (${suggestions.length})</summary>${suggestions.map(s=>`<div class="detail-item"><b>${esc(s.suggestion_type||'RESEARCH')}</b><div>${esc(s.note||s.source_context||'')}</div>${s.source_name?`<small>${esc(s.source_name)}${s.source_date?` · ${esc(s.source_date)}`:''}</small>`:''}</div>`).join('')}</details>`;
    if(p.user_note)out+=`<div class="player-context"><b>YOUR NOTE:</b> ${esc(p.user_note)}</div>`;
    return out;
  }

  function renderPlayers(){
    const a=visiblePlayers();
    $('pageMeta').textContent=state.pos==='STARRED'?`${a.length} MY TEAM players`:`${a.length} Yahoo players`;
    $('content').innerHTML=`<div class="player-toolbar"><span class="source-badge">YAHOO MASTER PLAYER DATABASE · live intel + roster context</span></div><div class="list">${a.map(playerCard).join('')||'<div class="empty">No players match.</div>'}</div>`;
    bindTargets();
  }

  function playerCard(p){
    const po=normPos(p.position),ts=playersApi.allTags(p);
    const action=p.is_rostered?'<span class="target-button on">★ MY TEAM</span>':`<button class="target-button ${p.user_target?'on':''}" data-key="${esc(p.player_key)}" data-target="${p.user_target?'false':'true'}">${p.user_target?'TARGETED':'TARGET'}</button>`;
    return `<article class="player-card ${p.is_rostered||p.user_target?'targeted':''}"><div class="card-top"><span class="pos ${po}">${po}</span><div style="display:flex;gap:7px;align-items:center"><span class="rank">${esc(p.team||'FA')}</span>${action}</div></div><div class="player-name">${esc(p.yahoo_name||p.display_name)}</div>${p.is_rostered?`<div class="player-meta">MY TEAM · ${esc(p.roster_slot||'ROSTER')} · ${esc(p.lineup_group||'')}</div>`:''}${ts.length?`<div class="tags">${ts.map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}${renderPlayerContext(p)}</article>`;
  }

  function bindTargets(){$('content').querySelectorAll('button.target-button').forEach(b=>b.onclick=()=>toggleTarget(b.dataset.key,b.dataset.target==='true'))}

  async function toggleTarget(key,target){
    const token=localStorage.getItem(APP_KEY);
    if(!token){openKey();return}
    try{await api('rpc/mobile_set_target',{method:'POST',body:JSON.stringify({p_token:token,p_player_key:key,p_target:target})});await load()}
    catch(e){localStorage.removeItem(APP_KEY);alert('Watchlist update failed. Re-enter the app key.');openKey()}
  }

  function renderWeather(){
    const a=state.weather.filter(matchGeneric);
    $('pageMeta').textContent=`${a.length} watched games`;
    $('content').innerHTML=`<div class="list">${a.map(g=>`<article class="weather-card"><div class="player-name">${esc(g.away_team)} @ ${esc(g.home_team)}</div><div class="player-meta">${esc(g.venue||'')} · ${esc(g.condition||'')}</div><p>Wind ${esc(g.wind_mph??'—')} mph · Temp ${esc(g.temperature_f??'—')}°F · Precip ${esc(g.precipitation_pct??'—')}%</p><p>${esc(g.fantasy_impact||'No material impact yet.')}</p></article>`).join('')||'<div class="empty">No fantasy-relevant weather watches.</div>'}</div>`;
  }

  function matchGeneric(x){if(!state.q)return true;return Object.values(x||{}).map(v=>String(v??'')).join(' ').toLowerCase().includes(state.q)}

  function leagueRosterFor(team){return state.leagueRosters.filter(r=>r.league_team_id===team?.id).slice().sort((a,b)=>slotWeight(a.roster_slot)-slotWeight(b.roster_slot)||(Number(a.lineup_order)||999)-(Number(b.lineup_order)||999)||String(a.yahoo_player_name||'').localeCompare(String(b.yahoo_player_name||'')))}
  function leagueTeamMatches(team,rows){
    if(!state.q)return true;
    const q=state.q;
    if([team.team_name,team.manager_name,team.yahoo_team_key].join(' ').toLowerCase().includes(q))return true;
    return rows.some(r=>[r.yahoo_player_name,r.nfl_team,r.position,r.roster_slot].join(' ').toLowerCase().includes(q));
  }
  function scoreText(points,projected){
    if(points!==null&&points!==undefined&&Number(points)!==0)return Number(points).toFixed(2);
    if(projected!==null&&projected!==undefined)return `Proj ${Number(projected).toFixed(2)}`;
    return '—';
  }
  function leagueMatchupCard(m){
    const aMine=String(m.team_a_yahoo_key)===String(MY_TEAM_KEY),bMine=String(m.team_b_yahoo_key)===String(MY_TEAM_KEY);
    return `<article class="league-matchup-card ${aMine||bMine?'mine':''}"><div class="league-matchup-team ${aMine?'you':''}"><b>${esc(m.team_a_name)}${aMine?' · YOU':''}</b><span>${esc(scoreText(m.team_a_points,m.team_a_projected))}</span></div><div class="league-vs">VS</div><div class="league-matchup-team ${bMine?'you':''}"><b>${esc(m.team_b_name)}${bMine?' · YOU':''}</b><span>${esc(scoreText(m.team_b_points,m.team_b_projected))}</span></div>${m.status?`<small>${esc(m.status)}</small>`:''}</article>`;
  }
  function leaguePlayerRow(row){
    const p=rosterPlayer({player_key:row.player_key,player_name:row.yahoo_player_name});
    const tags=p?playersApi.allTags(p).filter(t=>t!=='TARGET').slice(0,3):[];
    return `<div class="league-player-row"><span class="league-slot">${esc(row.roster_slot||row.position||'—')}</span><div class="league-player-main"><b>${esc(row.yahoo_player_name||'Player')}</b><small>${esc(row.position||'—')} · ${esc(row.nfl_team||'—')}</small></div>${tags.length?`<div class="league-player-tags">${tags.map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}</div>`;
  }
  function leagueTeamCard(team){
    let rows=leagueRosterFor(team);
    if(state.q)rows=rows.filter(r=>[team.team_name,team.manager_name,r.yahoo_player_name,r.nfl_team,r.position,r.roster_slot].join(' ').toLowerCase().includes(state.q));
    const mine=String(team.yahoo_team_key)===String(MY_TEAM_KEY);
    return `<section class="league-team-card ${mine?'mine':''}"><div class="league-team-head"><div><b>${esc(team.team_name)}</b><small>Yahoo Team ${esc(team.yahoo_team_key||'—')}${team.manager_name?` · ${esc(team.manager_name)}`:''}</small></div><span>${leagueRosterFor(team).length}</span></div><div>${rows.map(leaguePlayerRow).join('')||'<div class="empty">No roster players match.</div>'}</div></section>`;
  }
  function renderLeague(){
    const matchups=state.leagueMatchups||[];
    const weeks=state.leagueWeek==='all'?[...new Set(matchups.map(m=>Number(m.week)).filter(Boolean))].sort((a,b)=>a-b):[state.leagueWeek];
    const ordered=[...state.leagueTeams].sort((a,b)=>(String(b.yahoo_team_key)===String(MY_TEAM_KEY))-(String(a.yahoo_team_key)===String(MY_TEAM_KEY))||Number(a.yahoo_team_key||99)-Number(b.yahoo_team_key||99));
    const visibleTeams=ordered.filter(team=>leagueTeamMatches(team,leagueRosterFor(team)));
    $('pageMeta').textContent=`${state.leagueTeams.length} teams · ${state.leagueRosters.length} rostered · ${state.leagueMatchups.length} matchups`;
    const weekButtons=[`<button data-league-week="all" class="${state.leagueWeek==='all'?'active':''}">ALL WEEKS</button>`,...Array.from({length:18},(_,i)=>`<button data-league-week="${i+1}" class="${state.leagueWeek===i+1?'active':''}">W${i+1}</button>`)].join('');
    const schedule=weeks.map(week=>{
      const rows=matchups.filter(m=>Number(m.week)===Number(week));
      return `<div class="league-week-block"><div class="league-week-title">WEEK ${week} · ${rows.length} MATCHUPS</div><div class="league-matchup-grid">${rows.map(leagueMatchupCard).join('')||'<div class="empty">No matchup data for this week.</div>'}</div></div>`;
    }).join('');
    $('content').innerHTML=`
      <div class="league-summary"><div><b>${state.leagueTeams.length}</b><span>TEAMS</span></div><div><b>${state.leagueRosters.length}</b><span>ROSTERED</span></div><div><b>${state.leagueRosters.filter(r=>r.player_key).length}</b><span>MATCHED</span></div><div><b>${state.leagueMatchups.length}</b><span>MATCHUPS</span></div></div>
      <section class="roster-section league-schedule"><div class="roster-section-head"><b>WEEKLY MATCHUPS</b><span>Yahoo synced</span></div><div class="league-week-picker">${weekButtons}</div><div class="league-schedule-body">${schedule}</div></section>
      <section class="roster-section league-rosters"><div class="roster-section-head"><b>ALL ROSTERS</b><span>${visibleTeams.length} teams shown</span></div><div class="league-team-grid">${visibleTeams.map(leagueTeamCard).join('')||'<div class="empty">No teams match your search.</div>'}</div></section>`;
    $('content').querySelectorAll('[data-league-week]').forEach(btn=>btn.onclick=()=>{state.leagueWeek=btn.dataset.leagueWeek==='all'?'all':Number(btn.dataset.leagueWeek);renderLeague()});
  }

  function renderTagged(){
    const a=state.players.filter(p=>playersApi.isInjury(p,intelApi)).filter(matches).sort(playersApi.sortYahoo);
    $('pageMeta').textContent=`${a.length} current players`;
    $('content').innerHTML=`<div class="list">${a.map(playerCard).join('')||'<div class="empty">No current injuries match.</div>'}</div>`;
    bindTargets();
  }

  function openKey(){$('keyInput').value=localStorage.getItem(APP_KEY)||'';$('keyModal').hidden=false;setTimeout(()=>$('keyInput').focus(),0)}
  function closeKey(){$('keyModal').hidden=true}
  function saveKey(){const v=$('keyInput').value.trim();if(!/^\d{6}$/.test(v)){alert('Enter the 6-digit app key.');return}localStorage.setItem(APP_KEY,v);closeKey()}

  $('search').oninput=e=>{state.q=e.target.value.trim().toLowerCase();renderView()};
  document.querySelectorAll('.bottom-nav button[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
  document.querySelectorAll('[data-view-link]').forEach(link=>link.onclick=e=>{e.preventDefault();setView(link.dataset.viewLink)});
  $('keyButton').onclick=openKey;
  $('saveKey').onclick=saveKey;
  document.querySelectorAll('[data-close-key]').forEach(x=>x.onclick=closeKey);
  $('keyInput').onkeydown=e=>{if(e.key==='Enter')saveKey();if(e.key==='Escape')closeKey()};
  window.addEventListener('hashchange',()=>{const view=(location.hash||'#team').slice(1).toLowerCase();if(VIEWS.includes(view)&&view!==state.view)setView(view,{updateHash:false})});

  const requested=(location.hash||'#team').slice(1).toLowerCase();
  if(VIEWS.includes(requested))state.view=requested;
  if(state.view==='intel')state.pos='STARRED';
  load();
  setInterval(load,60000);
})();
