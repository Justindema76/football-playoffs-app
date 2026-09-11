(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const APP_KEY='fantasyFootball2026AppKey';
  const LEAGUE_KEY='battle-of-the-kings-2026';
  const MY_TEAM_KEY=new URLSearchParams(location.search).get('team')||'6';
  const REQUESTED_WEEK=Number(new URLSearchParams(location.search).get('week'));
  const VIEWS=['team','matchup','all-matchups','intel','players','injuries','weather','league'];
  const FILTERS=['ALL','QB','RB','WR','TE','DEF','K','STARRED','INTEL','INJURY'];
  const FILTER_VIEWS=new Set(['players','intel','injuries']);

  const state={
    view:'team',
    pos:'ALL',
    q:'',
    week:Number.isFinite(REQUESTED_WEEK)&&REQUESTED_WEEK>=1&&REQUESTED_WEEK<=18?REQUESTED_WEEK:1,
    playerSort:'PROJ',
    playerView:'WAIVER',
    players:[],
    intel:[],
    weather:[],
    owner:[],
    suggestions:[],
    roster:[],
    leagueTeams:[],
    leagueRosters:[],
    leagueMatchups:[],
    weekStats:[],
    playerPool:[],
    leagueWeek:1,
    errors:[]
  };

  const $=id=>document.getElementById(id);
  const playersApi=window.FantasyPlayers;
  const intelApi=window.FantasyIntel;

  if(!playersApi||!intelApi){
    console.error('Fantasy feature modules failed to load.');
    const n=$('notice');
    if(n){n.hidden=false;n.textContent='A fantasy feature module failed to load. Refresh the page.'}
    return;
  }

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normPos=v=>{const p=String(v||'').toUpperCase();return ['QB','RB','WR','TE','DEF','K'].includes(p)?p:'X'};
  const suggestionSort=(a,b)=>new Date(b.source_date||b.created_at||0)-new Date(a.source_date||a.created_at||0);
  const slotWeight=slot=>({QB:1,RB:2,WR:3,TE:4,'W/R/T':5,'W/R':5,'Q/W/R/T':5,K:6,DEF:7,BN:8,IR:9,'IR+':9,NA:10}[String(slot||'').toUpperCase()]||20);
  const isBenchSlot=slot=>['BN','IR','IR+','NA'].includes(String(slot||'').toUpperCase());
  const num=v=>v===null||v===undefined||v===''?null:Number(v);
  const fmt=v=>num(v)===null?'—':num(v).toFixed(2);
  const upper=v=>String(v||'').toUpperCase();
  const tagClass=t=>{
    const x=String(t||'').toLowerCase();
    for(const k of ['target','injury','monitor','cowbell','workhorse','handcuff','stack','upgrade','downgrade','avoid','committee','value','start','sit','add']) if(x.includes(k))return k;
    return '';
  };

  async function api(path,options={}){
    const method=String(options.method||'GET').toUpperCase();
    if(method!=='GET'){
      const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});
      if(!r.ok)throw Error(await r.text()||String(r.status));
      return r.status===204?null:r.json();
    }
    const all=[],pageSize=1000;
    for(let from=0;;from+=pageSize){
      const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{}),Range:`${from}-${from+pageSize-1}`},cache:'no-store'});
      if(!r.ok)throw Error(await r.text()||String(r.status));
      const data=r.status===204?null:await r.json();
      if(!Array.isArray(data))return data;
      all.push(...data);
      if(data.length<pageSize)return all;
    }
  }

  async function safe(name,path){
    try{return{name,data:await api(path),error:null}}
    catch(error){return{name,data:[],error}}
  }

  function setSync(s,t){$('syncPill').dataset.state=s;$('syncText').textContent=t}
  const matches=player=>playersApi.matches(player,state,intelApi);

  function byKeys(rows){
    const yahoo=new Map(),player=new Map();
    for(const row of rows||[]){
      if(row.yahoo_player_key)yahoo.set(String(row.yahoo_player_key),row);
      if(row.player_key)player.set(String(row.player_key),row);
    }
    return {yahoo,player};
  }

  function weeklyGroups(rows){
    const yahoo=new Map(),player=new Map();
    for(const row of rows||[]){
      const w=Number(row.week)||1;
      if(row.yahoo_player_key){
        const k=String(row.yahoo_player_key);
        if(!yahoo.has(k))yahoo.set(k,[]);
        yahoo.get(k).push({...row,week:w});
      }
      if(row.player_key){
        const k=String(row.player_key);
        if(!player.has(k))player.set(k,[]);
        player.get(k).push({...row,week:w});
      }
    }
    return {yahoo,player};
  }

  function decorateMaster(catalog,pool,weekStats){
    const poolIndex=byKeys(pool),weeks=weeklyGroups(weekStats);
    return (catalog||[]).map(p=>{
      const yahoo=String(p.yahoo_player_key||''),key=String(p.player_key||'');
      const poolRow=poolIndex.yahoo.get(yahoo)||poolIndex.player.get(key)||null;
      const weekly=(weeks.yahoo.get(yahoo)||weeks.player.get(key)||[]).slice().sort((a,b)=>a.week-b.week);
      return {
        ...p,
        display_name:p.player_name||p.yahoo_name,
        source:'Yahoo Players',
        pool_status:poolRow,
        weekly_stats:weekly,
        availability_status:poolRow?.availability_status||'FREE_AGENT',
        owning_team_name:poolRow?.owning_team_name||null,
        percent_rostered:poolRow?.percent_rostered??null,
        percent_started:poolRow?.percent_started??null,
        waiver_clear_text:poolRow?.waiver_clear_text||null,
        yahoo_rank:poolRow?.yahoo_rank??p.yahoo_rank??null
      };
    });
  }

  function myTeam(){return state.leagueTeams.find(t=>String(t.yahoo_team_key||'')===String(MY_TEAM_KEY))||null}
  function teamByYahooKey(key){return state.leagueTeams.find(t=>String(t.yahoo_team_key||'')===String(key||''))||null}

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
        lineup_group:isBenchSlot(r.roster_slot)?'BENCH':'STARTER',
        display_order:Number.isFinite(Number(r.lineup_order))?Number(r.lineup_order):index+1,
        active:true,
        updated_at:r.last_synced_at||r.updated_at||null
      }))
      .sort((a,b)=>(a.display_order-b.display_order)||slotWeight(a.roster_slot)-slotWeight(b.roster_slot)||a.player_name.localeCompare(b.player_name));
  }

  function weeklyFor(player,week=state.week){
    if(!player)return null;
    return (player.weekly_stats||[]).find(x=>Number(x.week)===Number(week))||null;
  }

  function weeklyForRow(row,week=state.week){
    const yahoo=String(row?.yahoo_player_key||''),key=String(row?.player_key||'');
    return state.weekStats.find(x=>Number(x.week)===Number(week)&&((yahoo&&String(x.yahoo_player_key||'')===yahoo)||(key&&String(x.player_key||'')===key)))||null;
  }

  function rosterPlayer(row){
    const yahoo=String(row?.yahoo_player_key||'');
    if(yahoo){
      const exact=state.players.find(p=>String(p.yahoo_player_key||'')===yahoo);
      if(exact)return exact;
    }
    const key=playersApi.normKey(row?.player_key||row?.player_name||row?.yahoo_player_name);
    return state.players.find(p=>playersApi.normKey(p.player_key||p.yahoo_name||p.display_name)===key)||null;
  }

  function teamWeekRows(teamId,week){
    const rows=state.weekStats.filter(x=>Number(x.week)===Number(week)&&x.league_team_id===teamId);
    if(rows.length){
      return rows.map((r,index)=>({
        player_key:r.player_key||r.yahoo_player_key||r.yahoo_player_name,
        yahoo_player_key:r.yahoo_player_key||null,
        player_name:r.yahoo_player_name||'Player',
        team:r.nfl_team||null,
        position:r.position||null,
        roster_slot:r.roster_slot||r.position||'',
        lineup_group:r.is_starter===false?'BENCH':'STARTER',
        display_order:Number.isFinite(Number(r.lineup_order))?Number(r.lineup_order):index+1,
        _weekly:r
      })).sort((a,b)=>(a.display_order-b.display_order)||slotWeight(a.roster_slot)-slotWeight(b.roster_slot));
    }
    const team=state.leagueTeams.find(t=>t.id===teamId);
    if(!team)return [];
    return state.leagueRosters
      .filter(r=>r.league_team_id===teamId&&r.active!==false)
      .map((r,index)=>({
        player_key:r.player_key||r.yahoo_player_key||r.yahoo_player_name,
        yahoo_player_key:r.yahoo_player_key||null,
        player_name:r.yahoo_player_name||'Player',
        team:r.nfl_team||null,
        position:r.position||null,
        roster_slot:r.roster_slot||r.position||'',
        lineup_group:isBenchSlot(r.roster_slot)?'BENCH':'STARTER',
        display_order:Number.isFinite(Number(r.lineup_order))?Number(r.lineup_order):index+1,
        _weekly:weeklyForRow(r,week)
      })).sort((a,b)=>(a.display_order-b.display_order)||slotWeight(a.roster_slot)-slotWeight(b.roster_slot));
  }

  async function load(){
    setSync('loading','SYNCING');
    const rs=await Promise.all([
      safe('catalog','fantasy_players?select=player_key,yahoo_player_key,yahoo_name,player_name,team,position,yahoo_rank,role,active&active=eq.true&yahoo_player_key=not.is.null&order=yahoo_rank.asc.nullslast,yahoo_name.asc'),
      safe('pool',`fantasy_league_player_pool?select=*&league_key=eq.${LEAGUE_KEY}&order=availability_status.asc,position.asc,yahoo_player_name.asc`),
      safe('weekStats',`fantasy_player_week_stats?select=*&league_key=eq.${LEAGUE_KEY}&order=week.asc,yahoo_player_key.asc`),
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
    state.playerPool=R.pool?.data||[];
    state.weekStats=R.weekStats?.data||[];
    state.leagueTeams=R.leagueTeams?.data||[];
    state.leagueRosters=R.leagueRosters?.data||[];
    state.leagueMatchups=R.leagueMatchups?.data||[];
    state.roster=buildMyRoster(state.leagueTeams,state.leagueRosters);

    const master=decorateMaster(R.catalog?.data||[],state.playerPool,state.weekStats);
    state.players=playersApi.build({
      catalog:master,
      targets:R.targets?.data||[],
      planner:R.planner?.data||[],
      intel:state.intel,
      suggestions:state.suggestions,
      roster:state.roster,
      intelApi
    });

    state.weather=R.weather?.data||[];
    state.owner=R.owner?.data||[];

    if(!Number.isFinite(REQUESTED_WEEK)){
      const available=[...new Set(state.weekStats.map(x=>Number(x.week)).filter(x=>x>=1&&x<=18))].sort((a,b)=>a-b);
      if(available.length)state.week=available.at(-1);
    }

    state.leagueWeek=state.week;
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

  function setWeek(week){
    const w=Math.max(1,Math.min(18,Number(week)||1));
    state.week=w;
    state.leagueWeek=w;
    const u=new URL(location.href);
    u.searchParams.set('week',String(w));
    history.replaceState(null,'',`${u.pathname}${u.search}#${state.view}`);
    render();
  }

  function weekToolbar(){
    return `<div class="week-review"><span>WEEK</span><div class="league-week-picker">${Array.from({length:18},(_,i)=>`<button data-review-week="${i+1}" class="${state.week===i+1?'active':''}">W${i+1}</button>`).join('')}</div></div>`;
  }

  function bindWeekButtons(){
    $('content').querySelectorAll('[data-review-week]').forEach(btn=>btn.onclick=()=>setWeek(btn.dataset.reviewWeek));
  }

  function matchupToolbar(mode='matchup'){
    const options=Array.from({length:18},(_,i)=>`<option value="${i+1}" ${state.week===i+1?'selected':''}>Week ${i+1}</option>`).join('');
    const action=mode==='matchup'
      ?'<button class="all-matchups-button" type="button" data-all-matchups>ALL MATCHUPS</button>'
      :'<button class="all-matchups-button" type="button" data-my-matchup>MY MATCHUP</button>';
    return `<div class="matchup-toolbar"><div class="matchup-week-controls"><button type="button" data-week-prev aria-label="Previous week">‹</button><select data-week-select aria-label="Select week">${options}</select><button type="button" data-week-next aria-label="Next week">›</button></div>${action}</div>`;
  }

  function bindMatchupToolbar(){
    const root=$('content');
    const go=week=>setWeek(Math.max(1,Math.min(18,Number(week)||1)));
    root.querySelector('[data-week-prev]')?.addEventListener('click',()=>go(state.week-1));
    root.querySelector('[data-week-next]')?.addEventListener('click',()=>go(state.week+1));
    root.querySelector('[data-week-select]')?.addEventListener('change',e=>go(e.target.value));
    root.querySelector('[data-all-matchups]')?.addEventListener('click',()=>setView('all-matchups'));
    root.querySelector('[data-my-matchup]')?.addEventListener('click',()=>setView('matchup'));
    root.querySelectorAll('[data-roster-toggle]').forEach(button=>button.addEventListener('click',()=>{
      const panel=document.getElementById(button.dataset.rosterToggle);
      if(!panel)return;
      panel.hidden=!panel.hidden;
      button.textContent=panel.hidden?'PLAYERS ▼':'PLAYERS ▲';
    }));
  }

  function render(){
    $('shell').dataset.view=state.view;
    const navView=state.view==='all-matchups'?'matchup':state.view;
    document.querySelectorAll('.bottom-nav button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===navView));
    const titles={team:'MY TEAM',matchup:'MATCHUP','all-matchups':'ALL MATCHUPS',intel:'INTEL',players:'PLAYERS',injuries:'INJURIES',weather:'WEATHER',league:'LEAGUE'};
    $('pageTitle').textContent=titles[state.view]||state.view.toUpperCase();
    $('rosterCount').textContent=state.roster.length;
    $('starterCount').textContent=state.roster.filter(x=>x.lineup_group==='STARTER').length;
    $('intelCount').textContent=state.intel.length;
    $('flagCount').textContent=state.owner.filter(x=>x.is_flagged).length;
    renderFilters();
    renderNotice();
    renderView();
  }

  function renderFilters(){
    const a=['team','matchup','all-matchups','weather','league'].includes(state.view)?[]:(FILTER_VIEWS.has(state.view)?FILTERS:['ALL']);
    $('positionFilters').innerHTML=a.map(p=>`<button class="${state.pos===p?'active':''}" data-pos="${p}">${p}</button>`).join('');
    $('positionFilters').querySelectorAll('button').forEach(b=>b.onclick=()=>{
      state.pos=b.dataset.pos;
      renderFilters();
      renderView();
    });
  }

  function renderNotice(){
    const n=$('notice');
    if(!state.errors.length){
      n.hidden=true;
      n.textContent='';
      return;
    }
    n.hidden=false;
    n.textContent=`Some current data could not load: ${state.errors.join(', ')}.`;
  }

  function renderView(){
    if(state.view==='team')return renderTeam();
    if(state.view==='matchup')return renderMatchup();
    if(state.view==='all-matchups')return renderAllMatchups();
    if(state.view==='players')return renderPlayers();
    if(state.view==='intel')return intelApi.render({state,$,esc,normPos,tagClass,matches});
    if(state.view==='weather')return renderWeather();
    if(state.view==='league')return renderLeague();
    return renderTagged();
  }

  function rosterMatches(row){
    if(!state.q)return true;
    const p=rosterPlayer(row);
    return [row.player_name,row.team,row.position,row.roster_slot,p?.planner_reason,...(p?playersApi.allTags(p):[])].join(' ').toLowerCase().includes(state.q);
  }

  function weeklySummary(w){
    if(!w)return '<div class="weekly-strip"><b>NO WEEKLY DATA</b><span>Run this week through the Yahoo extension when available.</span></div>';
    return `<div class="weekly-strip"><b>W${esc(w.week)} · ${fmt(w.fantasy_points)} PTS</b><span>PROJ ${fmt(w.projected_points)}</span><span>${esc(w.opponent||'Opponent —')}</span><span>${esc(w.game_status||w.game_time||'')}</span></div>`;
  }

  function renderTeam(){
    const me=myTeam();
    const source=me?teamWeekRows(me.id,state.week):state.roster;
    const roster=source.filter(rosterMatches);
    const starters=roster.filter(x=>x.lineup_group==='STARTER');
    const bench=roster.filter(x=>x.lineup_group==='BENCH');
    const rb=roster.filter(x=>x.position==='RB').length;
    const wr=roster.filter(x=>x.position==='WR').length;
    const te=roster.filter(x=>x.position==='TE').length;
    const qb=roster.filter(x=>x.position==='QB').length;

    $('pageMeta').textContent=`Week ${state.week} · ${roster.length} rostered · ${starters.length} starters · ${bench.length} bench`;
    $('content').innerHTML=`${weekToolbar()}<div class="roster-overview"><div><b>${qb}</b><span>QB</span></div><div><b>${rb}</b><span>RB</span></div><div><b>${wr}</b><span>WR</span></div><div><b>${te}</b><span>TE</span></div></div>${rosterSection('STARTERS',starters)}${rosterSection('BENCH',bench)}`;
    bindWeekButtons();
  }

  function rosterSection(title,rows){
    return `<section class="roster-section"><div class="roster-section-head"><b>${title}</b><span>${rows.length} players</span></div><div class="roster-grid">${rows.map(rosterCard).join('')||'<div class="empty">No players.</div>'}</div></section>`;
  }

  function rosterCard(row){
    const p=rosterPlayer(row);
    const tags=p?playersApi.allTags(p).filter(t=>t!=='TARGET'):[];
    const lower=tags.map(t=>String(t).toUpperCase());
    const latest=p?intelApi.latest(p.intel_items||[]):null;
    const context=p?.planner_reason||latest?.recommendation||latest?.what_changed||'No material roster change currently logged.';
    const w=row._weekly||weeklyFor(p,state.week)||weeklyForRow(row,state.week);
    const statusClass=lower.includes('INJURY')?'injury':lower.includes('MONITOR')?'monitor':'';

    return `<article class="roster-card ${statusClass}"><div class="roster-slot">${esc(row.roster_slot)}</div><div class="roster-main"><div class="roster-name">${esc(row.player_name)}</div><div class="roster-meta"><span class="pos ${normPos(row.position)}">${esc(row.position)}</span><span class="team-badge">${esc(row.team||'FA')}</span></div>${weeklySummary(w)}${tags.length?`<div class="tags">${tags.slice(0,6).map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}<div class="roster-read">${esc(context)}</div>${lower.includes('INJURY')?'<div class="roster-alert">INJURY / AVAILABILITY ITEM — keep monitoring.</div>':''}</div></article>`;
  }

  function myMatchup(week){
    return state.leagueMatchups.find(m=>Number(m.week)===Number(week)&&(String(m.team_a_yahoo_key)===String(MY_TEAM_KEY)||String(m.team_b_yahoo_key)===String(MY_TEAM_KEY)))||null;
  }

  function starterRowsFor(team,week){
    return team?teamWeekRows(team.id,week).filter(x=>x.lineup_group==='STARTER').sort((a,b)=>(a.display_order-b.display_order)||slotWeight(a.roster_slot)-slotWeight(b.roster_slot)):[];
  }

  function rowProjection(row){
    const p=rosterPlayer(row);
    const w=row?._weekly||weeklyFor(p,state.week)||weeklyForRow(row,state.week);
    return num(w?.projected_points);
  }

  function shortName(name){
    const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
    if(parts.length<2)return upper(name||'—');
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`.toUpperCase();
  }

  function matchupPosition(row){
    const slot=upper(row?.roster_slot||row?.position||'');
    if(['W/R/T','W/R','Q/W/R/T'].includes(slot))return 'WRT';
    if(slot==='DST')return 'DEF';
    return slot||'—';
  }

  function matchupInfo(row,side){
    if(!row)return `<div class="matchup-player-info ${side}"><div class="matchup-player-name">—</div></div>`;
    const p=rosterPlayer(row);
    const w=row._weekly||weeklyFor(p,state.week)||weeklyForRow(row,state.week);
    const latest=intelApi.latest(p?.intel_items||[]);
    const meta=[row.team||'—',w?.game_time,w?.opponent].filter(Boolean).join(' · ');
    return `<div class="matchup-player-info ${side}"><div class="matchup-player-name">${esc(shortName(row.player_name))}</div><div class="matchup-player-meta">${esc(meta)}</div>${latest?.action?`<span class="matchup-player-intel ${tagClass(latest.action)}">${esc(upper(latest.action))}</span>`:''}</div>`;
  }

  function matchupPoints(row){
    if(!row)return '<div class="matchup-player-points"><b>—</b><span>—</span></div>';
    const p=rosterPlayer(row);
    const w=row._weekly||weeklyFor(p,state.week)||weeklyForRow(row,state.week);
    return `<div class="matchup-player-points"><b>${fmt(w?.fantasy_points)}</b><span>${fmt(w?.projected_points)}</span></div>`;
  }

  function matchupRows(mine,theirs){
    const count=Math.max(mine.length,theirs.length);
    if(!count)return '<div class="empty">No player-level weekly lineup has been synced for this matchup.</div>';
    return Array.from({length:count},(_,i)=>{
      const left=mine[i]||null,right=theirs[i]||null,pos=matchupPosition(left||right),cls=pos.toLowerCase().replace(/[^a-z]/g,'');
      return `<div class="matchup-player-row">${matchupInfo(left,'left')}${matchupPoints(left)}<div class="matchup-position ${cls}">${esc(pos)}</div>${matchupPoints(right)}${matchupInfo(right,'right')}</div>`;
    }).join('');
  }

  function matchupScoreHero(my,opp,myPts,myProj,oppPts,oppProj){
    const total=(num(myProj)||0)+(num(oppProj)||0);
    const pct=num(myProj)!==null&&num(oppProj)!==null&&total?Math.round(Number(myProj)/total*100):50;
    const hasPct=num(myProj)!==null&&num(oppProj)!==null;
    return `<div class="matchup-score-card"><div class="score-teams"><div class="score-team"><small>YOUR TEAM</small><b>${esc(my?.team_name||'House of the Dragon')}</b><strong>${fmt(myPts)}</strong><span>${fmt(myProj)} projected</span></div><div class="score-vs">VS</div><div class="score-team right"><small>OPPONENT</small><b>${esc(opp?.team_name||'Opponent')}</b><strong>${fmt(oppPts)}</strong><span>${fmt(oppProj)} projected</span></div></div><div class="win-meter"><b>${hasPct?`${pct}%`:'—'}</b><div class="win-track"><div class="win-fill" style="width:${pct}%"></div></div><b>${hasPct?`${100-pct}%`:'—'}</b></div></div>`;
  }

  function compatibleForSlot(candidate,starter){
    const slot=upper(starter?.roster_slot);
    const pos=upper(candidate?.position);
    if(slot==='W/R/T')return ['RB','WR','TE'].includes(pos);
    if(slot==='W/R')return ['RB','WR'].includes(pos);
    if(slot==='Q/W/R/T')return ['QB','RB','WR','TE'].includes(pos);
    if(slot==='DEF')return pos==='DEF';
    if(slot==='K')return pos==='K';
    return pos===upper(starter?.position)||pos===slot;
  }

  function intelFlags(row){
    const p=rosterPlayer(row);
    const tags=p?playersApi.allTags(p).map(upper):[];
    const latest=intelApi.latest(p?.intel_items||[]);
    const action=upper(latest?.action);
    const flagged=['SIT','DOWNGRADE','AVOID','INJURY','MONITOR'].includes(action)||tags.some(t=>['SIT','DOWNGRADE','AVOID','INJURY','MONITOR'].includes(t));
    return {flagged,action:action||null,recommendation:latest?.recommendation||latest?.what_changed||p?.planner_reason||''};
  }

  function availablePlayer(p){
    const status=upper(p?.pool_status?.availability_status||p?.availability_status);
    return !p?.is_rostered&&(status==='FREE_AGENT'||status==='WAIVERS');
  }

  function weatherMatchesWeek(g){
    const label=String(g?.week_label||'');
    const m=label.match(/\d+/);
    return !m||Number(m[0])===Number(state.week);
  }

  function weatherForTeam(team){
    const t=upper(team);
    if(!t)return null;
    return state.weather.find(g=>{
      if(!weatherMatchesWeek(g))return false;
      return [g.away_team,g.home_team].some(x=>upper(x)===t||upper(x).includes(t)||t.includes(upper(x)));
    })||null;
  }

  function weatherIsMaterial(g){
    if(!g)return false;
    const wind=num(g.wind_mph)||0;
    const precip=num(g.precipitation_pct)||0;
    const severe=upper(g.severe_risk);
    const action=upper(g.action);
    return wind>=15||precip>=40||(!['','NONE','LOW'].includes(severe))||['MONITOR','AVOID','UPGRADE','DOWNGRADE'].includes(action);
  }

  function adviceCard(kind,title,body,items=[]){
    return `<article class="advice-card ${kind}"><div class="advice-title">${esc(title)}</div><p>${esc(body)}</p>${items.length?`<ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</article>`;
  }

  function buildMatchupAdvice(my,opp,mine,theirs,myProj,oppProj){
    const cards=[];
    const gap=num(myProj)!==null&&num(oppProj)!==null?num(myProj)-num(oppProj):null;

    if(gap!==null){
      if(gap<=-10)cards.push(adviceCard('danger','CHASE CEILING',`You are projected ${Math.abs(gap).toFixed(2)} points behind. Favor upside and aggressive pivots over low-ceiling floor plays.`));
      else if(gap<0)cards.push(adviceCard('warn','SMALL DEFICIT',`You are projected ${Math.abs(gap).toFixed(2)} points behind. Look for one or two lineup edges rather than forcing every position.`));
      else if(gap>=10)cards.push(adviceCard('good','PROTECT THE EDGE',`You are projected ${gap.toFixed(2)} points ahead. Avoid unnecessary injury or role risk when a safer option is close.`));
      else cards.push(adviceCard('info','TOSS-UP',`The projection gap is only ${Math.abs(gap).toFixed(2)} points. Small lineup, waiver and weather edges matter this week.`));
    }else{
      cards.push(adviceCard('info','WEEKLY PLAN','Team-level projections are incomplete, so the review below leans on player projections, Intel and availability.'));
    }

    const fullMine=my?teamWeekRows(my.id,state.week):[];
    const bench=fullMine.filter(x=>x.lineup_group==='BENCH');
    const swaps=[];
    for(const b of bench){
      const bp=rowProjection(b);
      if(bp===null)continue;
      const candidates=mine.filter(s=>compatibleForSlot(b,s)&&rowProjection(s)!==null).sort((a,b2)=>rowProjection(a)-rowProjection(b2));
      const starter=candidates[0];
      if(!starter)continue;
      const sp=rowProjection(starter);
      if(bp>=sp+1){
        swaps.push({gain:bp-sp,text:`Consider ${b.player_name} (${bp.toFixed(2)}) over ${starter.player_name} (${sp.toFixed(2)}) — +${(bp-sp).toFixed(2)} projected.`});
      }
    }
    swaps.sort((a,b)=>b.gain-a.gain);
    if(swaps.length)cards.push(adviceCard('good','LINEUP MOVES','Your bench has projected paths to improve the starting lineup.',swaps.slice(0,4).map(x=>x.text)));

    const risks=mine.map(row=>({row,...intelFlags(row)})).filter(x=>x.flagged);
    if(risks.length)cards.push(adviceCard('warn','STARTER RISK WATCH','These starters have current Intel that deserves another check before lock.',risks.slice(0,5).map(x=>`${x.row.player_name}: ${x.action||'MONITOR'}${x.recommendation?` — ${x.recommendation}`:''}`)));

    const threats=theirs
      .map(row=>({row,proj:rowProjection(row)}))
      .filter(x=>x.proj!==null)
      .sort((a,b)=>b.proj-a.proj)
      .slice(0,4);
    if(threats.length)cards.push(adviceCard('info','OPPONENT THREATS','These are the biggest projected scorers on the other side.',threats.map(x=>`${x.row.player_name} — ${x.proj.toFixed(2)} projected`)));

    const waiverCandidates=state.players
      .filter(availablePlayer)
      .filter(p=>weeklyFor(p,state.week)?.projected_points!=null)
      .sort((a,b)=>(num(weeklyFor(b,state.week)?.projected_points)||0)-(num(weeklyFor(a,state.week)?.projected_points)||0));

    const waiverMoves=[];
    for(const p of waiverCandidates){
      const pp=num(weeklyFor(p,state.week)?.projected_points);
      const starterCandidates=mine.filter(s=>compatibleForSlot(p,s)&&rowProjection(s)!==null).sort((a,b)=>rowProjection(a)-rowProjection(b));
      const starter=starterCandidates[0];
      if(!starter)continue;
      const sp=rowProjection(starter);
      if(pp>=sp+2){
        const status=upper(p.availability_status)==='WAIVERS'?'WAIVERS':'FREE AGENT';
        waiverMoves.push({gain:pp-sp,text:`${p.yahoo_name||p.display_name} (${status}, ${pp.toFixed(2)}) over ${starter.player_name} (${sp.toFixed(2)}) — +${(pp-sp).toFixed(2)} projected.`});
      }
      if(waiverMoves.length>=8)break;
    }
    waiverMoves.sort((a,b)=>b.gain-a.gain);
    if(waiverMoves.length)cards.push(adviceCard('good','WAIVER / FREE-AGENT EDGES','Available players who project materially above one of your current starters.',waiverMoves.slice(0,4).map(x=>x.text)));

    const myDefense=mine.find(x=>upper(x.position)==='DEF'||upper(x.roster_slot)==='DEF');
    const defenseStreamers=waiverCandidates.filter(p=>upper(p.position)==='DEF').slice(0,5);
    const defItems=[];
    if(myDefense){
      const dp=rowProjection(myDefense);
      defItems.push(`${myDefense.player_name}: ${dp===null?'no projection':`${dp.toFixed(2)} projected`}`);
    }
    for(const p of defenseStreamers.slice(0,3)){
      const pw=weeklyFor(p,state.week);
      const proj=num(pw?.projected_points);
      const g=weatherForTeam(p.team);
      const weather=weatherIsMaterial(g)?` · weather ${g.wind_mph??'—'} mph wind / ${g.precipitation_pct??'—'}% precip`:'';
      defItems.push(`${p.yahoo_name||p.display_name}: ${proj===null?'—':proj.toFixed(2)} projected${weather}`);
    }
    if(defItems.length)cards.push(adviceCard('info','DEFENSE STREAMING','Compare your current defense with the best available Week '+state.week+' options.',defItems));

    const weatherRows=[...mine,...theirs]
      .map(row=>({row,g:weatherForTeam(row.team)}))
      .filter(x=>weatherIsMaterial(x.g));
    if(weatherRows.length){
      const unique=[];
      const seen=new Set();
      for(const x of weatherRows){
        const key=`${x.g.away_team}-${x.g.home_team}`;
        if(seen.has(key))continue;
        seen.add(key);
        unique.push(`${x.g.away_team} @ ${x.g.home_team}: ${x.g.condition||'conditions'} · wind ${x.g.wind_mph??'—'} mph · precip ${x.g.precipitation_pct??'—'}%${x.g.fantasy_impact?` — ${x.g.fantasy_impact}`:''}`);
      }
      cards.push(adviceCard('warn','WEATHER WATCH','Weather that could change passing, kicking or defensive value.',unique.slice(0,4)));
    }

    if(!cards.length)cards.push(adviceCard('info','NO MAJOR EDGE YET','No meaningful projection, Intel, waiver or weather edge is currently loaded for this matchup.'));
    return cards.join('');
  }

  function renderMatchup(){
    const m=myMatchup(state.week);
    $('pageMeta').textContent=`Week ${state.week} · Yahoo matchup + weekly advice`;

    if(!m){
      $('content').innerHTML=`${matchupToolbar('matchup')}<div class="empty">No matchup is saved for your team in Week ${state.week} yet.</div>`;
      bindMatchupToolbar();
      return;
    }

    const mineA=String(m.team_a_yahoo_key)===String(MY_TEAM_KEY);
    const myKey=mineA?m.team_a_yahoo_key:m.team_b_yahoo_key;
    const oppKey=mineA?m.team_b_yahoo_key:m.team_a_yahoo_key;
    const my=teamByYahooKey(myKey);
    const opp=teamByYahooKey(oppKey);
    const mine=starterRowsFor(my,state.week);
    const theirs=starterRowsFor(opp,state.week);
    const myPts=mineA?m.team_a_points:m.team_b_points;
    const myProj=mineA?m.team_a_projected:m.team_b_projected;
    const oppPts=mineA?m.team_b_points:m.team_a_points;
    const oppProj=mineA?m.team_b_projected:m.team_a_projected;
    const rows=matchupRows(mine,theirs);
    const advice=buildMatchupAdvice(my,opp,mine,theirs,myProj,oppProj);
    const opponentBench=opp?teamWeekRows(opp.id,state.week).filter(x=>x.lineup_group==='BENCH'):[];

    $('content').innerHTML=`${matchupToolbar('matchup')}<section class="matchup-panel-old">${matchupScoreHero(my,opp,myPts,myProj,oppPts,oppProj)}<div class="matchup-list">${rows}</div>${opponentBench.length?`<details class="matchup-bench"><summary>SHOW ${esc(upper(opp?.team_name||'OPPONENT'))} BENCH ▼</summary><div class="matchup-bench-list">${opponentBench.map(inlineMatchupRosterPlayer).join('')}</div></details>`:''}</section><section class="matchup-advice"><div class="matchup-advice-head"><div><small>WEEK ${state.week}</small><b>YOUR GAME PLAN</b></div><span>Yahoo projections + roster + waivers + Intel + weather</span></div><div class="advice-grid">${advice}</div></section>`;
    bindMatchupToolbar();
  }

  function matchupActualProjected(m,team,side){
    if(side==='a')return {points:m.team_a_points,projected:m.team_a_projected};
    if(side==='b')return {points:m.team_b_points,projected:m.team_b_projected};
    if(team?.id===m.team_a_id)return {points:m.team_a_points,projected:m.team_a_projected};
    return {points:m.team_b_points,projected:m.team_b_projected};
  }

  function inlineMatchupRosterPlayer(row){
    const p=rosterPlayer(row);
    const w=row._weekly||weeklyFor(p,state.week)||weeklyForRow(row,state.week);
    const latest=intelApi.latest(p?.intel_items||[]);
    return `<div class="all-matchup-player-row"><span class="all-matchup-slot">${esc(row.roster_slot||row.position||'—')}</span><div><b>${esc(row.player_name)}</b><small>${esc(row.position||'—')} · ${esc(row.team||'—')}</small>${latest?.action?`<span class="matchup-player-intel ${tagClass(latest.action)}">${esc(upper(latest.action))}</span>`:''}</div><div class="all-matchup-player-score"><strong>${fmt(w?.fantasy_points)}</strong><span>Proj ${fmt(w?.projected_points)}</span></div></div>`;
  }

  function allMatchupTeamPanel(team,m,side,index){
    const score=matchupActualProjected(m,team,side);
    const rows=team?teamWeekRows(team.id,state.week):[];
    const id=`all-roster-${state.week}-${index}-${side}`;
    const mine=String(team?.yahoo_team_key||'')===String(MY_TEAM_KEY);
    return `<div class="all-matchup-team"><div class="all-matchup-team-head"><div><b>${esc(team?.team_name||'Team')}${mine?' · YOU':''}</b><small>${esc(team?.manager_name||'')}</small><button type="button" class="roster-toggle" data-roster-toggle="${id}">PLAYERS ▼</button></div><div class="all-matchup-team-score"><strong>${fmt(score.points)}</strong><span>${fmt(score.projected)} proj</span></div></div><div id="${id}" class="inline-roster" hidden>${rows.map(inlineMatchupRosterPlayer).join('')||'<div class="empty">No players synced.</div>'}</div></div>`;
  }

  function allMatchupCard(m,index){
    const a=state.leagueTeams.find(t=>t.id===m.team_a_id)||teamByYahooKey(m.team_a_yahoo_key);
    const b=state.leagueTeams.find(t=>t.id===m.team_b_id)||teamByYahooKey(m.team_b_yahoo_key);
    const mine=String(m.team_a_yahoo_key)===String(MY_TEAM_KEY)||String(m.team_b_yahoo_key)===String(MY_TEAM_KEY);
    return `<article class="all-matchup-card ${mine?'mine':''}">${allMatchupTeamPanel(a,m,'a',index)}${allMatchupTeamPanel(b,m,'b',index)}</article>`;
  }

  function renderAllMatchups(){
    const rows=(state.leagueMatchups||[]).filter(m=>Number(m.week)===Number(state.week));
    $('pageMeta').textContent=`Week ${state.week} · ${rows.length} league matchups`;
    $('content').innerHTML=`${matchupToolbar('all-matchups')}<section class="all-matchups-wrap"><div class="all-matchups-list">${rows.map(allMatchupCard).join('')||'<div class="empty">No league matchups are synced for this week.</div>'}</div></section>`;
    bindMatchupToolbar();
  }

  function playerSort(a,b){
    const aw=weeklyFor(a,state.week),bw=weeklyFor(b,state.week);
    if(state.playerSort==='PTS')return (num(bw?.fantasy_points)??-999)-(num(aw?.fantasy_points)??-999)||playersApi.sortYahoo(a,b);
    if(state.playerSort==='ROSTERED')return (num(b.percent_rostered)??-1)-(num(a.percent_rostered)??-1)||playersApi.sortYahoo(a,b);
    if(state.playerSort==='YAHOO')return playersApi.sortYahoo(a,b);
    return (num(bw?.projected_points)??-999)-(num(aw?.projected_points)??-999)||playersApi.sortYahoo(a,b);
  }

  function playerStatus(p){
    if(p.is_rostered)return 'MY_ROSTER';
    const status=upper(p?.pool_status?.availability_status||p?.availability_status||'FREE_AGENT');
    if(status==='ROSTERED')return 'ROSTERED';
    if(status==='WAIVERS')return 'WAIVERS';
    return 'FREE_AGENT';
  }

  function visiblePlayers(){
    return state.players.filter(matches).filter(p=>{
      const status=playerStatus(p);
      if(state.playerView==='WAIVER')return status==='FREE_AGENT'||status==='WAIVERS';
      if(state.playerView==='MY')return status==='MY_ROSTER';
      if(state.playerView==='ROSTERED')return status==='ROSTERED';
      return true;
    }).sort(playerSort);
  }

  function renderPlayerContext(p){
    const suggestions=p.suggestions||[];
    let out='';
    if(p.planner_reason)out+=`<div class="player-context"><b>PLAYER READ:</b> ${esc(p.planner_reason)}</div>`;
    out+=intelApi.renderPlayerDetails(p,esc,tagClass);
    if(suggestions.length)out+=`<details class="player-details"><summary>Research / Strategy (${suggestions.length})</summary>${suggestions.map(s=>`<div class="detail-item"><b>${esc(s.suggestion_type||'RESEARCH')}</b><div>${esc(s.note||s.source_context||'')}</div>${s.source_name?`<small>${esc(s.source_name)}${s.source_date?` · ${esc(s.source_date)}`:''}</small>`:''}</div>`).join('')}</details>`;
    if(p.user_note)out+=`<div class="player-context"><b>YOUR NOTE:</b> ${esc(p.user_note)}</div>`;
    return out;
  }

  function playerGroup(title,subtitle,players,groupClass,open=true){
    if(!players.length)return '';
    return `<details class="player-group ${groupClass}" ${open?'open':''}><summary><div><b>${esc(title)}</b><span>${esc(subtitle)}</span></div><strong>${players.length}</strong></summary><div class="player-group-list">${players.map(playerCard).join('')}</div></details>`;
  }

  function renderPlayers(){
    const a=visiblePlayers();
    const groups={
      mine:a.filter(p=>playerStatus(p)==='MY_ROSTER'),
      free:a.filter(p=>playerStatus(p)==='FREE_AGENT'),
      waivers:a.filter(p=>playerStatus(p)==='WAIVERS'),
      rostered:a.filter(p=>playerStatus(p)==='ROSTERED')
    };

    $('pageMeta').textContent=`Week ${state.week} · ${a.length} shown · ${state.players.length} Yahoo players loaded`;

    const openRostered=!!state.q||state.playerView==='ROSTERED';
    $('content').innerHTML=`${weekToolbar()}<div class="player-toolbar"><span class="source-badge">YAHOO MASTER PLAYERS · weekly scoring + ownership + Fantasy Intel</span><div class="player-controls"><label class="player-sort-label">SHOW <select id="playerView" class="player-sort"><option value="WAIVER" ${state.playerView==='WAIVER'?'selected':''}>WAIVER WIRE</option><option value="MY" ${state.playerView==='MY'?'selected':''}>MY ROSTER</option><option value="ROSTERED" ${state.playerView==='ROSTERED'?'selected':''}>ROSTERED BY OTHERS</option><option value="ALL" ${state.playerView==='ALL'?'selected':''}>ALL PLAYERS</option></select></label><label class="player-sort-label">SORT <select id="playerSort" class="player-sort"><option value="PROJ" ${state.playerSort==='PROJ'?'selected':''}>PROJECTED</option><option value="PTS" ${state.playerSort==='PTS'?'selected':''}>ACTUAL POINTS</option><option value="YAHOO" ${state.playerSort==='YAHOO'?'selected':''}>YAHOO RANK</option><option value="ROSTERED" ${state.playerSort==='ROSTERED'?'selected':''}>% ROSTERED</option></select></label></div></div><div class="player-groups">${playerGroup('MY ROSTER','House of the Dragon',groups.mine,'mine',true)}${playerGroup('FREE AGENTS','Available to add now',groups.free,'available',true)}${playerGroup('WAIVERS','Available after waiver processing',groups.waivers,'waivers',true)}${playerGroup('ROSTERED BY OTHER TEAMS','Owner is highlighted on every card',groups.rostered,'rostered',openRostered)}${!a.length?'<div class="empty">No players match.</div>':''}</div>`;

    bindWeekButtons();
    bindTargets();
    $('playerView').onchange=e=>{state.playerView=e.target.value;renderPlayers()};
    $('playerSort').onchange=e=>{state.playerSort=e.target.value;renderPlayers()};
  }

  function playerCard(p){
    const po=normPos(p.position);
    const ts=playersApi.allTags(p);
    const w=weeklyFor(p,state.week);
    const pool=p.pool_status||{};
    const status=playerStatus(p);
    const owner=pool.owning_team_name||p.owning_team_name||'';
    const ownerBadge=status==='MY_ROSTER'
      ?'<span class="ownership-pill mine">MY ROSTER</span>'
      :status==='ROSTERED'
        ?`<span class="ownership-pill rostered">ROSTERED BY ${esc(owner||'OTHER TEAM')}</span>`
        :status==='WAIVERS'
          ?'<span class="ownership-pill waivers">WAIVERS</span>'
          :'<span class="ownership-pill available">FREE AGENT</span>';
    const action=p.is_rostered
      ?'<span class="target-button on">★ MY TEAM</span>'
      :`<button class="target-button ${p.user_target?'on':''}" data-key="${esc(p.player_key)}" data-target="${p.user_target?'false':'true'}">${p.user_target?'TARGETED':'TARGET'}</button>`;
    const ownership=[
      `Yahoo #${p.yahoo_rank||'—'}`,
      p.percent_rostered!=null?`${p.percent_rostered}% rostered`:null,
      p.percent_started!=null?`${p.percent_started}% started`:null,
      p.waiver_clear_text||null
    ].filter(Boolean).join(' · ');

    return `<article class="player-card ${p.is_rostered||p.user_target?'targeted':''} ownership-${status.toLowerCase()}"><div class="card-top"><span class="pos ${po}">${po}</span><div class="player-card-actions"><span class="rank">${esc(p.team||'FA')}</span>${action}</div></div><div class="player-name">${esc(p.yahoo_name||p.display_name)}</div><div class="ownership-row">${ownerBadge}<span>${esc(ownership)}</span></div>${weeklySummary(w)}${ts.length?`<div class="tags">${ts.map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}${renderPlayerContext(p)}</article>`;
  }

  function bindTargets(){
    $('content').querySelectorAll('button.target-button').forEach(b=>b.onclick=()=>toggleTarget(b.dataset.key,b.dataset.target==='true'));
  }

  async function toggleTarget(key,target){
    const token=localStorage.getItem(APP_KEY);
    if(!token){openKey();return}
    try{
      await api('rpc/mobile_set_target',{method:'POST',body:JSON.stringify({p_token:token,p_player_key:key,p_target:target})});
      await load();
    }catch(e){
      localStorage.removeItem(APP_KEY);
      alert('Watchlist update failed. Re-enter the app key.');
      openKey();
    }
  }

  function renderWeather(){
    const a=state.weather.filter(matchGeneric);
    $('pageMeta').textContent=`${a.length} watched games`;
    $('content').innerHTML=`<div class="list">${a.map(g=>`<article class="weather-card"><div class="player-name">${esc(g.away_team)} @ ${esc(g.home_team)}</div><div class="player-meta">${esc(g.week_label||'')} · ${esc(g.venue||'')} · ${esc(g.condition||'')}</div><p>Wind ${esc(g.wind_mph??'—')} mph · Temp ${esc(g.temperature_f??'—')}°F · Precip ${esc(g.precipitation_pct??'—')}%</p><p>${esc(g.fantasy_impact||'No material impact yet.')}</p></article>`).join('')||'<div class="empty">No fantasy-relevant weather watches.</div>'}</div>`;
  }

  function matchGeneric(x){
    if(!state.q)return true;
    return Object.values(x||{}).map(v=>String(v??'')).join(' ').toLowerCase().includes(state.q);
  }

  function leagueRosterFor(team){
    return state.leagueRosters
      .filter(r=>r.league_team_id===team?.id)
      .slice()
      .sort((a,b)=>slotWeight(a.roster_slot)-slotWeight(b.roster_slot)||(Number(a.lineup_order)||999)-(Number(b.lineup_order)||999)||String(a.yahoo_player_name||'').localeCompare(String(b.yahoo_player_name||'')));
  }

  function leagueTeamMatches(team,rows){
    if(!state.q)return true;
    const q=state.q;
    if([team.team_name,team.manager_name,team.yahoo_team_key].join(' ').toLowerCase().includes(q))return true;
    return rows.some(r=>[r.yahoo_player_name,r.nfl_team,r.position,r.roster_slot].join(' ').toLowerCase().includes(q));
  }

  function scoreText(points,projected){
    if(num(points)!==null&&num(points)!==0)return fmt(points);
    if(num(projected)!==null)return `Proj ${fmt(projected)}`;
    return '—';
  }

  function leagueMatchupCard(m){
    const aMine=String(m.team_a_yahoo_key)===String(MY_TEAM_KEY);
    const bMine=String(m.team_b_yahoo_key)===String(MY_TEAM_KEY);
    return `<article class="league-matchup-card ${aMine||bMine?'mine':''}"><div class="league-matchup-team ${aMine?'you':''}"><b>${esc(m.team_a_name)}${aMine?' · YOU':''}</b><span>${esc(scoreText(m.team_a_points,m.team_a_projected))}</span></div><div class="league-vs">VS</div><div class="league-matchup-team ${bMine?'you':''}"><b>${esc(m.team_b_name)}${bMine?' · YOU':''}</b><span>${esc(scoreText(m.team_b_points,m.team_b_projected))}</span></div>${m.status?`<small>${esc(m.status)}</small>`:''}</article>`;
  }

  function leaguePlayerRow(row){
    const p=rosterPlayer({player_key:row.player_key,yahoo_player_key:row.yahoo_player_key,player_name:row.yahoo_player_name});
    const tags=p?playersApi.allTags(p).filter(t=>t!=='TARGET').slice(0,3):[];
    const w=weeklyFor(p,state.leagueWeek);
    return `<div class="league-player-row"><span class="league-slot">${esc(row.roster_slot||row.position||'—')}</span><div class="league-player-main"><b>${esc(row.yahoo_player_name||'Player')}</b><small>${esc(row.position||'—')} · ${esc(row.nfl_team||'—')} · Proj ${fmt(w?.projected_points)}</small></div>${tags.length?`<div class="league-player-tags">${tags.map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}</div>`;
  }

  function leagueTeamCard(team){
    let rows=leagueRosterFor(team);
    if(state.q)rows=rows.filter(r=>[team.team_name,team.manager_name,r.yahoo_player_name,r.nfl_team,r.position,r.roster_slot].join(' ').toLowerCase().includes(state.q));
    const mine=String(team.yahoo_team_key)===String(MY_TEAM_KEY);
    return `<section class="league-team-card ${mine?'mine':''}"><div class="league-team-head"><div><b>${esc(team.team_name)}</b><small>Yahoo Team ${esc(team.yahoo_team_key||'—')}${team.manager_name?` · ${esc(team.manager_name)}`:''}</small></div><span>${leagueRosterFor(team).length}</span></div><div>${rows.map(leaguePlayerRow).join('')||'<div class="empty">No roster players match.</div>'}</div></section>`;
  }

  function renderLeague(){
    const matchups=state.leagueMatchups||[];
    const weeks=state.leagueWeek==='all'
      ?[...new Set(matchups.map(m=>Number(m.week)).filter(Boolean))].sort((a,b)=>a-b)
      :[state.leagueWeek];
    const ordered=[...state.leagueTeams].sort((a,b)=>(String(b.yahoo_team_key)===String(MY_TEAM_KEY))-(String(a.yahoo_team_key)===String(MY_TEAM_KEY))||Number(a.yahoo_team_key||99)-Number(b.yahoo_team_key||99));
    const visibleTeams=ordered.filter(team=>leagueTeamMatches(team,leagueRosterFor(team)));

    $('pageMeta').textContent=`${state.leagueTeams.length} teams · ${state.leagueRosters.length} rostered · ${state.leagueMatchups.length} matchups`;

    const weekButtons=[
      `<button data-league-week="all" class="${state.leagueWeek==='all'?'active':''}">ALL WEEKS</button>`,
      ...Array.from({length:18},(_,i)=>`<button data-league-week="${i+1}" class="${state.leagueWeek===i+1?'active':''}">W${i+1}</button>`)
    ].join('');

    const schedule=weeks.map(week=>{
      const rows=matchups.filter(m=>Number(m.week)===Number(week));
      return `<div class="league-week-block"><div class="league-week-title">WEEK ${week} · ${rows.length} MATCHUPS</div><div class="league-matchup-grid">${rows.map(leagueMatchupCard).join('')||'<div class="empty">No matchup data for this week.</div>'}</div></div>`;
    }).join('');

    $('content').innerHTML=`<div class="league-summary"><div><b>${state.leagueTeams.length}</b><span>TEAMS</span></div><div><b>${state.leagueRosters.length}</b><span>ROSTERED</span></div><div><b>${state.leagueRosters.filter(r=>r.player_key).length}</b><span>MATCHED</span></div><div><b>${state.leagueMatchups.length}</b><span>MATCHUPS</span></div></div><section class="roster-section league-schedule"><div class="roster-section-head"><b>WEEKLY MATCHUPS</b><span>Yahoo synced</span></div><div class="league-week-picker">${weekButtons}</div><div class="league-schedule-body">${schedule}</div></section><section class="roster-section league-rosters"><div class="roster-section-head"><b>ALL ROSTERS</b><span>${visibleTeams.length} teams shown</span></div><div class="league-team-grid">${visibleTeams.map(leagueTeamCard).join('')||'<div class="empty">No teams match your search.</div>'}</div></section>`;

    $('content').querySelectorAll('[data-league-week]').forEach(btn=>btn.onclick=()=>{
      state.leagueWeek=btn.dataset.leagueWeek==='all'?'all':Number(btn.dataset.leagueWeek);
      renderLeague();
    });
  }

  function renderTagged(){
    const a=state.players.filter(p=>playersApi.isInjury(p,intelApi)).filter(matches).sort(playerSort);
    $('pageMeta').textContent=`${a.length} current players`;
    $('content').innerHTML=`${weekToolbar()}<div class="list">${a.map(playerCard).join('')||'<div class="empty">No current injuries match.</div>'}</div>`;
    bindWeekButtons();
    bindTargets();
  }

  function openKey(){
    $('keyInput').value=localStorage.getItem(APP_KEY)||'';
    $('keyModal').hidden=false;
    setTimeout(()=>$('keyInput').focus(),0);
  }
  function closeKey(){$('keyModal').hidden=true}
  function saveKey(){
    const v=$('keyInput').value.trim();
    if(!/^\d{6}$/.test(v)){alert('Enter the 6-digit app key.');return}
    localStorage.setItem(APP_KEY,v);
    closeKey();
  }

  $('search').oninput=e=>{state.q=e.target.value.trim().toLowerCase();renderView()};
  document.querySelectorAll('.bottom-nav button[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
  document.querySelectorAll('[data-view-link]').forEach(link=>link.onclick=e=>{e.preventDefault();setView(link.dataset.viewLink)});
  $('keyButton').onclick=openKey;
  $('saveKey').onclick=saveKey;
  document.querySelectorAll('[data-close-key]').forEach(x=>x.onclick=closeKey);
  $('keyInput').onkeydown=e=>{if(e.key==='Enter')saveKey();if(e.key==='Escape')closeKey()};

  window.addEventListener('hashchange',()=>{
    const view=(location.hash||'#team').slice(1).toLowerCase();
    if(VIEWS.includes(view)&&view!==state.view)setView(view,{updateHash:false});
  });

  const requested=(location.hash||'#team').slice(1).toLowerCase();
  if(VIEWS.includes(requested))state.view=requested;
  if(state.view==='intel')state.pos='STARRED';

  load();
  setInterval(load,60000);
})();
