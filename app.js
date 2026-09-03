(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const APP_KEY='fantasyFootball2026AppKey';
  const TIER_COUNT=15;
  const FILTERS=['ALL','QB','RB','WR','TE','DEF','K','STARRED','INTEL','INJURY'];
  const POSITION_PANEL_FILTERS=['ALL','STARRED','INTEL','INJURY'];
  const POSITION_FILTERS=new Set(['QB','RB','WR','TE','DEF','K']);
  const FILTER_VIEWS=new Set(['players','draft','intel','runningbacks','widereceivers','injuries']);
  const state={view:'draft',pos:'ALL',q:'',players:[],intel:[],weather:[],owner:[],suggestions:[],errors:[]};
  const $=id=>document.getElementById(id);
  const intelApi=window.FantasyIntel;
  const runningBacksApi=window.FantasyRunningBacks;
  const wideReceiversApi=window.FantasyWideReceivers;

  if(!intelApi||!runningBacksApi||!wideReceiversApi){
    console.error('Feature modules failed to load.');
    const n=$('notice');
    if(n){n.hidden=false;n.textContent='A fantasy feature module failed to load. Refresh the page.'}
    return;
  }

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normPos=v=>{const p=String(v||'').toUpperCase();return ['QB','RB','WR','TE','DEF','K'].includes(p)?p:'X'};
  const sortYahoo=(a,b)=>(Number(a.yahoo_rank)||9999)-(Number(b.yahoo_rank)||9999)||String(a.yahoo_name||a.display_name||'').localeCompare(String(b.yahoo_name||b.display_name||''));
  const uniq=a=>[...new Set(a.filter(Boolean).map(x=>String(x).trim().toUpperCase()).filter(Boolean))];
  const normName=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const normKey=v=>normName(v);
  const suggestionSort=(a,b)=>new Date(b.source_date||b.created_at||0)-new Date(a.source_date||a.created_at||0);

  const tagClass=t=>{
    const x=String(t||'').toLowerCase();
    for(const k of ['target','injury','monitor','cowbell','workhorse','handcuff','stack','upgrade','downgrade','avoid','committee','value']) if(x.includes(k)) return k;
    return '';
  };

  async function api(path,options={}){
    const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});
    if(!r.ok) throw Error(await r.text()||String(r.status));
    return r.status===204?null:r.json();
  }
  async function safe(name,path){try{return{name,data:await api(path),error:null}}catch(error){return{name,data:[],error}}}
  function setSync(s,t){$('syncPill').dataset.state=s;$('syncText').textContent=t}

  function tags(p){
    return uniq([
      ...(p.user_tags||[]),
      ...(p.planner_tags||[]),
      ...(intelApi.tagsFromItems(p.intel_items||[])||[]),
      p.user_target?'TARGET':null
    ]);
  }

  function isInjuryPlayer(p){return intelApi.isInjuryPlayer(p)||false}

  function matches(p){
    if(POSITION_FILTERS.has(state.pos)&&normPos(p.position)!==state.pos)return false;
    if(state.pos==='STARRED'&&!p.user_target)return false;
    if(state.pos==='INTEL'&&!(p.intel_items||[]).length)return false;
    if(state.pos==='INJURY'&&!isInjuryPlayer(p))return false;
    if(!state.q)return true;
    const suggestions=p.suggestions||[];
    const core=[p.yahoo_name,p.display_name,p.team,p.position,p.planner_reason,...(p.planner_tags||[])].join(' ').toLowerCase().includes(state.q);
    const intel=intelApi.matchesSearch(p.intel_items||[],state.q);
    const research=suggestions.some(s=>[s.suggestion_type,s.sentiment,s.note,s.source_context,s.source_name,s.suggested_round].join(' ').toLowerCase().includes(state.q));
    return core||intel||research;
  }

  async function load(){
    setSync('loading','SYNCING');
    const rs=await Promise.all([
      safe('catalog','draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,yahoo_verified,source,active&active=eq.true&order=yahoo_rank.asc.nullslast,yahoo_name.asc'),
      safe('targets','draft_target_selection?select=player_key,user_target,user_tags,user_note,priority,updated_at'),
      safe('planner','planner_player_tags?select=player_key,player_name,team,position,tags,reason,last_confirmed_date,updated_at,transfer_to_live'),
      intelApi.safeLoad(api),
      safe('suggestions','player_suggestions?select=player_key,source_name,suggestion_type,sentiment,note,suggested_round,source_context,source_date,created_at&order=source_date.desc.nullslast,created_at.desc'),
      safe('weather','weather_watch?select=*&order=game_time.asc.nullslast'),
      safe('owner','intel_owner_state?select=*')
    ]);

    const R=Object.fromEntries(rs.map(x=>[x.name,x]));
    state.intel=intelApi.sort(R.intel.data);
    state.suggestions=R.suggestions.data.slice().sort(suggestionSort);

    const targetMap=new Map(R.targets.data.map(x=>[normKey(x.player_key),x]));
    const plannerByKey=new Map(R.planner.data.map(x=>[normKey(x.player_key),x]));
    const plannerByName=new Map(R.planner.data.map(x=>[normName(x.player_name),x]));
    const intelByName=intelApi.groupByName(state.intel,normName);
    const suggestionsByKey=new Map();
    state.suggestions.forEach(row=>{
      const key=normKey(row.player_key);
      if(!key)return;
      if(!suggestionsByKey.has(key))suggestionsByKey.set(key,[]);
      suggestionsByKey.get(key).push(row);
    });

    state.players=R.catalog.data.map(p=>{
      const key=normKey(p.player_key);
      const name=normName(p.yahoo_name||p.display_name);
      const t=targetMap.get(key)||{};
      const plan=plannerByKey.get(key)||plannerByName.get(name)||{};
      const intel=intelByName.get(name)||[];
      const suggestions=(suggestionsByKey.get(key)||suggestionsByKey.get(name)||[]).slice().sort(suggestionSort);
      return {...p,tier:intelApi.tierFor(p),user_target:!!t.user_target,user_tags:t.user_tags||[],user_note:t.user_note||null,planner_tags:plan.tags||[],planner_reason:plan.reason||'',planner_last_confirmed_date:plan.last_confirmed_date||null,planner_updated_at:plan.updated_at||null,intel_items:intel,suggestions};
    }).sort(sortYahoo);

    state.weather=R.weather.data;
    state.owner=R.owner.data;
    state.errors=rs.filter(x=>x.error).map(x=>x.name);
    setSync(state.errors.length?(state.players.length?'partial':'error'):'live',state.errors.length?(state.players.length?'PARTIAL':'ERROR'):'LIVE');
    render();
  }

  function render(){
    $('shell').dataset.view=state.view;
    document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
    $('pageTitle').textContent=state.view==='runningbacks'?'RUNNING BACKS':state.view==='widereceivers'?'WIDE RECEIVERS':state.view.toUpperCase();
    $('yahooCount').textContent=state.players.filter(p=>Number.isFinite(Number(p.yahoo_rank))).length;
    $('targetCount').textContent=state.players.filter(p=>p.user_target).length;
    $('intelCount').textContent=state.intel.length;
    $('flagCount').textContent=state.owner.filter(x=>x.is_flagged).length;
    renderFilters();renderNotice();renderView();
  }

  function renderFilters(){
    const isPositionPanel=state.view==='runningbacks'||state.view==='widereceivers';
    const a=isPositionPanel?POSITION_PANEL_FILTERS:(FILTER_VIEWS.has(state.view)?FILTERS:['ALL']);
    $('positionFilters').innerHTML=a.map(p=>`<button class="${state.pos===p?'active':''}" data-pos="${p}">${p}</button>`).join('');
    $('positionFilters').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.pos=b.dataset.pos;renderFilters();renderView()});
  }

  function renderNotice(){
    const n=$('notice');
    if(!state.errors.length){n.hidden=true;n.textContent='';return}
    n.hidden=false;n.textContent=`Some current data could not load: ${state.errors.join(', ')}.`;
  }

  function renderView(){
    if(state.view==='players')return renderPlayers(false);
    if(state.view==='draft')return renderDraft();
    if(state.view==='intel')return intelApi.render({state,$,esc,normPos,tagClass,matches});
    if(state.view==='weather')return renderWeather();
    if(state.view==='runningbacks')return runningBacksApi.render({state,$,esc,tagClass,intelApi,bindTargets});
    if(state.view==='widereceivers')return wideReceiversApi.render({state,$,esc,tagClass,intelApi,bindTargets});
    return renderTagged();
  }

  function visiblePlayers(targetOnly=false){return state.players.filter(p=>(!targetOnly||p.user_target)&&matches(p)).sort(sortYahoo)}

  function renderPlayerContext(p){
    const suggestions=p.suggestions||[];
    let out='';
    if(p.planner_reason)out+=`<div class="player-context"><b>PLAYER READ:</b> ${esc(p.planner_reason)}</div>`;
    out+=intelApi.renderPlayerDetails(p,esc,tagClass);
    if(suggestions.length)out+=`<details class="player-details"><summary>Research / Strategy (${suggestions.length})</summary>${suggestions.map(s=>`<div class="detail-item"><b>${esc(s.suggestion_type||'RESEARCH')}${s.suggested_round?` · Rd ${esc(s.suggested_round)}`:''}</b><div>${esc(s.note||s.source_context||'')}</div>${s.source_name?`<small>${esc(s.source_name)}${s.source_date?` · ${esc(s.source_date)}`:''}</small>`:''}</div>`).join('')}</details>`;
    if(p.user_note)out+=`<div class="player-context"><b>YOUR NOTE:</b> ${esc(p.user_note)}</div>`;
    return out;
  }

  function renderPlayers(targetOnly){
    const a=visiblePlayers(targetOnly);
    $('pageMeta').textContent=`${a.length} canonical Yahoo players`;
    $('content').innerHTML=`${targetOnly?'':`<div class="player-toolbar"><span class="source-badge">Same canonical player record used by Players + Draft + Running Backs + Wide Receivers + Intel</span><button id="addMissing" class="add-missing">+ ADD MISSING YAHOO PLAYER</button></div>`}<div class="list">${a.map(playerCard).join('')||'<div class="empty">No players match.</div>'}</div>`;
    bindTargets();
    if(!targetOnly)$('addMissing')?.addEventListener('click',openManual);
  }

  function playerCard(p){
    const po=normPos(p.position),ts=tags(p);
    return `<article class="player-card ${p.user_target?'targeted':''}"><div class="card-top"><span class="pos ${po}">${po}</span><div style="display:flex;gap:7px;align-items:center"><span class="tier-badge">TIER ${esc(p.tier??'—')}</span><span class="rank">Yahoo #${esc(p.yahoo_rank??'—')}</span><button class="target-button ${p.user_target?'on':''}" data-key="${esc(p.player_key)}" data-target="${p.user_target?'false':'true'}">${p.user_target?'TARGETED':'TARGET'}</button></div></div><div class="player-name">${esc(p.yahoo_name||p.display_name)}</div><div class="player-team-line"><span class="team-badge">${esc(p.team||'FA')}</span><span class="player-meta">Yahoo ranking order</span></div>${ts.length?`<div class="tags">${ts.map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}${renderPlayerContext(p)}</article>`;
  }

  function bindTargets(){$('content').querySelectorAll('.target-button').forEach(b=>b.onclick=()=>toggleTarget(b.dataset.key,b.dataset.target==='true'))}

  async function toggleTarget(key,target){
    const token=localStorage.getItem(APP_KEY);
    if(!token){openKey();return}
    try{await api('rpc/mobile_set_target',{method:'POST',body:JSON.stringify({p_token:token,p_player_key:key,p_target:target})});await load()}
    catch(e){localStorage.removeItem(APP_KEY);alert('Target update failed. Re-enter the app key.');openKey()}
  }

  function firstCatalogGap(all){
    const ranks=new Set(all.map(p=>Number(p.yahoo_rank)).filter(Number.isInteger));
    const maxRank=Math.max(0,...ranks);
    if(maxRank<1)return 1;
    for(let r=1;r<=maxRank;r++)if(!ranks.has(r))return r;
    return null;
  }

  function renderDraft(){
    const all=state.players.slice().sort(sortYahoo);
    const shown=all.filter(matches);
    const targeted=all.filter(p=>p.user_target).length;
    const gap=firstCatalogGap(all);
    $('pageMeta').textContent=`${shown.length} Yahoo players shown · ${targeted} starred · 15 rounds · 12 picks per round`;
    if(!all.length){$('content').innerHTML='<div class="empty">No Yahoo players synced yet.</div>';return}
    if(gap){$('content').innerHTML=`<div class="catalog-error"><b>YAHOO CATALOG INCOMPLETE</b><span>Yahoo rank #${gap} is missing. The Draft board is intentionally hidden until the complete Yahoo Player List sync succeeds.</span></div>`;return}
    const tiers=Array.from({length:TIER_COUNT},(_,i)=>{const start=i*12+1,end=start+11;return shown.filter(p=>Number(p.yahoo_rank)>=start&&Number(p.yahoo_rank)<=end)});
    const late=shown.filter(p=>Number(p.yahoo_rank)>180||!Number.isFinite(Number(p.yahoo_rank)));
    $('content').innerHTML=`<div class="draft-summary"><div><span>YAHOO PLAYERS</span><b>${all.length}</b></div><div><span>STARRED</span><b>${targeted}</b></div><div><span>ROUNDS</span><b>${TIER_COUNT}</b></div><div><span>ORDER</span><b>YAHOO</b></div></div><div class="tier-grid">${tiers.map((g,i)=>tier(i+1,g)).join('')}</div>${late.length?`<section class="late-pool"><div class="late-pool-head"><b>LATE POOL</b><span>Yahoo #181+ · ${late.length} players</span></div><div class="late-grid">${late.map(draftRow).join('')}</div></section>`:''}`;
    bindTargets();
  }

  function tier(n,a){const start=(n-1)*12+1,end=start+11;return `<section class="tier"><div class="tier-head"><b>ROUND ${n}</b><span>Yahoo #${start}-${end} · ${a.length}</span></div>${a.map(draftRow).join('')}</section>`}

  function draftRow(p){
    const po=normPos(p.position),ts=tags(p).filter(t=>t!=='TARGET');
    const context=p.planner_reason||intelApi.latestContext(p.intel_items||[]);
    return `<div class="draft-row ${po} ${p.user_target?'targeted':''}"><div class="draft-rank">${esc(p.yahoo_rank??'—')}</div><span class="pos ${po}">${po}</span><div class="draft-player-main"><div class="draft-name">${esc(p.yahoo_name||p.display_name)}</div><div class="draft-meta"><span class="team-badge">${esc(p.team||'FA')}</span> · Tier ${esc(p.tier??'—')} · Yahoo #${esc(p.yahoo_rank??'—')}</div>${ts.length?`<div class="tags">${ts.slice(0,5).map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}${context?`<div class="draft-intel">${esc(context)}</div>`:''}</div><button class="target-button draft-target ${p.user_target?'on':''}" data-key="${esc(p.player_key)}" data-target="${p.user_target?'false':'true'}">${p.user_target?'TARGETED':'TARGET'}</button></div>`;
  }

  function renderWeather(){
    const a=state.weather.filter(matchGeneric);
    $('pageMeta').textContent=`${a.length} watched games`;
    $('content').innerHTML=`<div class="list">${a.map(g=>`<article class="weather-card"><div class="player-name">${esc(g.away_team)} @ ${esc(g.home_team)}</div><div class="player-meta">${esc(g.venue||'')} · ${esc(g.condition||'')}</div><p>Wind ${esc(g.wind_mph??'—')} mph · Temp ${esc(g.temperature_f??'—')}°F · Precip ${esc(g.precipitation_pct??'—')}%</p><p>${esc(g.fantasy_impact||'No material impact yet.')}</p></article>`).join('')||'<div class="empty">No weather items.</div>'}</div>`;
  }

  function matchGeneric(x){if(!state.q)return true;return Object.values(x||{}).map(v=>String(v??'')).join(' ').toLowerCase().includes(state.q)}

  function renderTagged(){
    let a=state.players.filter(isInjuryPlayer);
    a=a.filter(matches).sort(sortYahoo);
    $('pageMeta').textContent=`${a.length} current players`;
    $('content').innerHTML=`<div class="list">${a.map(playerCard).join('')||'<div class="empty">No current players match.</div>'}</div>`;
    bindTargets();
  }

  function openKey(){$('keyInput').value=localStorage.getItem(APP_KEY)||'';$('keyModal').hidden=false;setTimeout(()=>$('keyInput').focus(),0)}
  function closeKey(){$('keyModal').hidden=true}
  function saveKey(){const v=$('keyInput').value.trim();if(!/^\d{6}$/.test(v)){alert('Enter the 6-digit app key.');return}localStorage.setItem(APP_KEY,v);closeKey()}
  function openManual(){if(!localStorage.getItem(APP_KEY)){openKey();return}$('mName').value='';$('mTeam').value='';$('mPos').value='RB';$('mRank').value='';$('manualModal').hidden=false;setTimeout(()=>$('mName').focus(),0)}
  function closeManual(){$('manualModal').hidden=true}
  async function saveManual(){
    const token=localStorage.getItem(APP_KEY),name=$('mName').value.trim(),team=$('mTeam').value.trim().toUpperCase(),position=$('mPos').value,rank=Number($('mRank').value);
    if(!token){closeManual();openKey();return}
    if(!name||!Number.isInteger(rank)||rank<1){alert('Enter the exact Yahoo player name and rank.');return}
    try{await api('rpc/mobile_add_player',{method:'POST',body:JSON.stringify({p_token:token,p_name:name,p_team:team,p_position:position,p_yahoo_rank:rank,p_target:true})});closeManual();await load()}
    catch(e){alert('Could not add player: '+e.message)}
  }

  $('search').oninput=e=>{state.q=e.target.value.trim().toLowerCase();renderView()};
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;state.pos='ALL';render();scrollTo({top:0,behavior:'smooth'})});
  $('keyButton').onclick=openKey;
  $('saveKey').onclick=saveKey;
  document.querySelectorAll('[data-close-key]').forEach(x=>x.onclick=closeKey);
  $('keyInput').onkeydown=e=>{if(e.key==='Enter')saveKey();if(e.key==='Escape')closeKey()};
  $('saveManual').onclick=saveManual;
  document.querySelectorAll('[data-close-manual]').forEach(x=>x.onclick=closeManual);
  $('mRank').onkeydown=e=>{if(e.key==='Enter')saveManual();if(e.key==='Escape')closeManual()};

  load();
  setInterval(load,60000);
})();