(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const APP_KEY='fantasyFootball2026AppKey';
  const TIER_COUNT=15;
  const FILTERS=['ALL','QB','RB','WR','TE','DEF','K','STARRED','INTEL','INJURY'];
  const POSITION_FILTERS=new Set(['QB','RB','WR','TE','DEF','K']);
  const FILTER_VIEWS=new Set(['players','draft','intel','cowbell','injuries']);
  const state={view:'draft',pos:'ALL',q:'',players:[],intel:[],weather:[],owner:[],suggestions:[],errors:[]};
  const $=id=>document.getElementById(id);

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normPos=v=>{const p=String(v||'').toUpperCase();return ['QB','RB','WR','TE','DEF','K'].includes(p)?p:'X'};
  const sortYahoo=(a,b)=>(Number(a.yahoo_rank)||9999)-(Number(b.yahoo_rank)||9999)||String(a.yahoo_name||a.display_name||'').localeCompare(String(b.yahoo_name||b.display_name||''));
  const uniq=a=>[...new Set(a.filter(Boolean).map(x=>String(x).trim().toUpperCase()).filter(Boolean))];
  const normName=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const normKey=v=>normName(v);
  const intelSort=(a,b)=>new Date(b.updated_at||b.last_checked_at||0)-new Date(a.updated_at||a.last_checked_at||0);
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

  function mapArrayBy(rows,keyFn){
    const m=new Map();
    rows.forEach(row=>{
      const key=keyFn(row);
      if(!key)return;
      if(!m.has(key))m.set(key,[]);
      m.get(key).push(row);
    });
    return m;
  }

  function tags(p){
    const intel=p.intel_items||[];
    return uniq([
      ...(p.user_tags||[]),
      ...(p.planner_tags||[]),
      ...intel.flatMap(i=>[...(i.draft_tags||[]),i.action]),
      p.user_target?'TARGET':null
    ]);
  }

  function isInjuryPlayer(p){
    // Trust the explicit INJURY draft_tag the backend already sets on a
    // player's own intel items, instead of keyword-scanning the freeform
    // write-up. The old regex included a bare "back" (unbounded), which
    // matched inside ordinary fantasy vocabulary like "backfield" -- so any
    // fully healthy RB whose note mentioned a teammate's backfield role (or
    // an "IR" reference about that teammate, not the player) got flagged as
    // hurt. Concretely: Jahmyr Gibbs -- the #1 overall ranked, fully
    // healthy player -- was showing up on the Injuries tab and getting a red
    // INJURY badge on Intel solely because his UPGRADE note said Detroit put
    // backup Isiah Pacheco on IR, thinning the "backfield" behind him. The
    // backend already tags real injury items with draft_tags: ["INJURY"]
    // (see intel_items), so use that instead of re-deriving it from prose.
    const intel=p.intel_items||[];
    return tags(p).some(t=>t==='INJURY')||intel.some(i=>(i.draft_tags||[]).some(t=>String(t).toUpperCase()==='INJURY'));
  }

  function matches(p){
    if(POSITION_FILTERS.has(state.pos)&&normPos(p.position)!==state.pos)return false;
    if(state.pos==='STARRED'&&!p.user_target)return false;
    if(state.pos==='INTEL'&&!(p.intel_items||[]).length)return false;
    if(state.pos==='INJURY'&&!isInjuryPlayer(p))return false;
    if(!state.q)return true;
    const intel=p.intel_items||[];
    const suggestions=p.suggestions||[];
    return [p.yahoo_name,p.display_name,p.team,p.position,p.planner_reason,...(p.planner_tags||[]),...intel.flatMap(i=>[i.action,i.priority,i.status,i.what_changed,i.recommendation,...(i.draft_tags||[])]),...suggestions.flatMap(s=>[s.suggestion_type,s.sentiment,s.note,s.source_context,s.source_name,s.suggested_round])].join(' ').toLowerCase().includes(state.q);
  }

  async function load(){
    setSync('loading','SYNCING');
    const rs=await Promise.all([
      safe('catalog','draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,yahoo_verified,source,active&active=eq.true&order=yahoo_rank.asc.nullslast,yahoo_name.asc'),
      safe('targets','draft_target_selection?select=player_key,user_target,user_tags,user_note,priority,updated_at'),
      safe('planner','planner_player_tags?select=player_key,player_name,team,position,tags,reason,last_confirmed_date,updated_at,transfer_to_live'),
      safe('intel','intel_items?select=*&status=neq.RESOLVED&order=updated_at.desc.nullslast'),
      safe('suggestions','player_suggestions?select=player_key,source_name,suggestion_type,sentiment,note,suggested_round,source_context,source_date,created_at&order=source_date.desc.nullslast,created_at.desc'),
      safe('weather','weather_watch?select=*&order=game_time.asc.nullslast'),
      safe('owner','intel_owner_state?select=*')
    ]);

    const R=Object.fromEntries(rs.map(x=>[x.name,x]));
    state.intel=R.intel.data.slice().sort(intelSort);
    state.suggestions=R.suggestions.data.slice().sort(suggestionSort);

    const targetMap=new Map(R.targets.data.map(x=>[normKey(x.player_key),x]));
    const plannerByKey=new Map(R.planner.data.map(x=>[normKey(x.player_key),x]));
    const plannerByName=new Map(R.planner.data.map(x=>[normName(x.player_name),x]));
    const intelByName=mapArrayBy(state.intel,x=>normName(x.player_name));
    const suggestionsByKey=mapArrayBy(state.suggestions,x=>normKey(x.player_key));

    state.players=R.catalog.data.map(p=>{
      const key=normKey(p.player_key);
      const name=normName(p.yahoo_name||p.display_name);
      const t=targetMap.get(key)||{};
      const plan=plannerByKey.get(key)||plannerByName.get(name)||{};
      const intel=(intelByName.get(name)||[]).slice().sort(intelSort);
      const suggestions=(suggestionsByKey.get(key)||suggestionsByKey.get(name)||[]).slice().sort(suggestionSort);
      return {...p,user_target:!!t.user_target,user_tags:t.user_tags||[],user_note:t.user_note||null,planner_tags:plan.tags||[],planner_reason:plan.reason||'',planner_last_confirmed_date:plan.last_confirmed_date||null,planner_updated_at:plan.updated_at||null,intel_items:intel,suggestions};
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
    $('pageTitle').textContent=state.view.toUpperCase();
    $('yahooCount').textContent=state.players.filter(p=>Number.isFinite(Number(p.yahoo_rank))).length;
    $('targetCount').textContent=state.players.filter(p=>p.user_target).length;
    $('intelCount').textContent=state.intel.length;
    $('flagCount').textContent=state.owner.filter(x=>x.is_flagged).length;
    renderFilters();renderNotice();renderView();
  }

  function renderFilters(){
    const a=FILTER_VIEWS.has(state.view)?FILTERS:['ALL'];
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
    if(state.view==='intel')return renderIntel();
    if(state.view==='weather')return renderWeather();
    if(state.view==='cowbell')return renderTagged('cowbell');
    return renderTagged('injuries');
  }

  function visiblePlayers(targetOnly=false){return state.players.filter(p=>(!targetOnly||p.user_target)&&matches(p)).sort(sortYahoo)}

  function renderPlayerContext(p){
    const intel=p.intel_items||[];
    const suggestions=p.suggestions||[];
    let out='';
    if(p.planner_reason)out+=`<div class="player-context"><b>PLAYER READ:</b> ${esc(p.planner_reason)}</div>`;
    if(intel.length)out+=`<details class="player-details" ${intel.length===1?'open':''}><summary>Current Intel (${intel.length})</summary>${intel.map(i=>`<div class="detail-item"><b>${esc(i.action||'MONITOR')} · ${esc(i.priority||'')}</b><div>${esc(i.what_changed||'')}</div>${i.recommendation?`<div><b>WHAT TO DO:</b> ${esc(i.recommendation)}</div>`:''}${i.last_checked_at?`<small>Checked ${esc(new Date(i.last_checked_at).toLocaleString())}</small>`:''}</div>`).join('')}</details>`;
    if(suggestions.length)out+=`<details class="player-details"><summary>Research / Strategy (${suggestions.length})</summary>${suggestions.map(s=>`<div class="detail-item"><b>${esc(s.suggestion_type||'RESEARCH')}${s.suggested_round?` · Rd ${esc(s.suggested_round)}`:''}</b><div>${esc(s.note||s.source_context||'')}</div>${s.source_name?`<small>${esc(s.source_name)}${s.source_date?` · ${esc(s.source_date)}`:''}</small>`:''}</div>`).join('')}</details>`;
    if(p.user_note)out+=`<div class="player-context"><b>YOUR NOTE:</b> ${esc(p.user_note)}</div>`;
    return out;
  }

  function renderPlayers(targetOnly){
    const a=visiblePlayers(targetOnly);
    $('pageMeta').textContent=`${a.length} canonical Yahoo players`;
    $('content').innerHTML=`${targetOnly?'':`<div class="player-toolbar"><span class="source-badge">Same Yahoo player record used by Players + Draft + Intel</span><button id="addMissing" class="add-missing">+ ADD MISSING YAHOO PLAYER</button></div>`}<div class="list">${a.map(playerCard).join('')||'<div class="empty">No players match.</div>'}</div>`;
    bindTargets();
    if(!targetOnly)$('addMissing')?.addEventListener('click',openManual);
  }

  function playerCard(p){
    const po=normPos(p.position),ts=tags(p);
    return `<article class="player-card ${p.user_target?'targeted':''}"><div class="card-top"><span class="pos ${po}">${po}</span><div style="display:flex;gap:7px;align-items:center"><span class="rank">Yahoo #${esc(p.yahoo_rank??'—')}</span><button class="target-button ${p.user_target?'on':''}" data-key="${esc(p.player_key)}" data-target="${p.user_target?'false':'true'}">${p.user_target?'TARGETED':'TARGET'}</button></div></div><div class="player-name">${esc(p.yahoo_name||p.display_name)}</div><div class="player-meta">${esc(p.team||'')} · Yahoo ranking order</div>${ts.length?`<div class="tags">${ts.map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}${renderPlayerContext(p)}</article>`;
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
    const po=normPos(p.position),ts=tags(p).filter(t=>t!=='TARGET'),intel=p.intel_items||[];
    const latest=intel[0];
    const context=p.planner_reason||latest?.recommendation||latest?.what_changed||'';
    return `<div class="draft-row ${po} ${p.user_target?'targeted':''}"><div class="draft-rank">${esc(p.yahoo_rank??'—')}</div><span class="pos ${po}">${po}</span><div class="draft-player-main"><div class="draft-name">${esc(p.yahoo_name||p.display_name)}</div><div class="draft-meta">${esc(p.team||'')} · Yahoo #${esc(p.yahoo_rank??'—')}</div>${ts.length?`<div class="tags">${ts.slice(0,5).map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}${context?`<div class="draft-intel">${esc(context)}</div>`:''}</div><button class="target-button draft-target ${p.user_target?'on':''}" data-key="${esc(p.player_key)}" data-target="${p.user_target?'false':'true'}">${p.user_target?'TARGETED':'TARGET'}</button></div>`;
  }

  function renderIntel(){
    const players=state.players.filter(p=>(p.intel_items||[]).length&&matches(p)).sort(sortYahoo);
    const itemCount=players.reduce((n,p)=>n+(p.intel_items||[]).length,0);
    $('pageMeta').textContent=`${players.length} players · ${itemCount} current Intel items · Yahoo order`;
    $('content').innerHTML=`<div class="list">${players.map(p=>{
      const items=(p.intel_items||[]).slice().sort(intelSort);
      const latest=items[0]||{};
      return `<article class="intel-card ${p.user_target?'targeted':''}"><div class="card-top"><span class="pos ${normPos(p.position)}">${normPos(p.position)}</span><div style="display:flex;gap:7px;align-items:center"><span class="rank">Yahoo #${esc(p.yahoo_rank??'—')}</span><span class="tag ${tagClass(latest.action)}">${esc(latest.action||'INTEL')}</span></div></div><div class="player-name">${esc(p.yahoo_name||p.display_name)}</div><div class="player-meta">${esc(p.team||'')} · ${esc(latest.priority||'')} ${latest.last_checked_at?`· Checked ${esc(new Date(latest.last_checked_at).toLocaleString())}`:''}</div>${isInjuryPlayer(p)?'<div class="tags"><span class="tag injury">INJURY</span></div>':''}${items.map(x=>`<p>${esc(x.what_changed||'')}</p>${x.recommendation?`<p><b>WHAT TO DO:</b> ${esc(x.recommendation)}</p>`:''}${x.draft_tags?.length?`<div class="tags">${x.draft_tags.map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}`).join('')}</article>`;
    }).join('')||'<div class="empty">No current intel matches.</div>'}</div>`;
  }

  function renderWeather(){
    const a=state.weather.filter(matchGeneric);
    $('pageMeta').textContent=`${a.length} watched games`;
    $('content').innerHTML=`<div class="list">${a.map(g=>`<article class="weather-card"><div class="player-name">${esc(g.away_team)} @ ${esc(g.home_team)}</div><div class="player-meta">${esc(g.venue||'')} · ${esc(g.condition||'')}</div><p>Wind ${esc(g.wind_mph??'—')} mph · Temp ${esc(g.temperature_f??'—')}°F · Precip ${esc(g.precipitation_pct??'—')}%</p><p>${esc(g.fantasy_impact||'No material impact yet.')}</p></article>`).join('')||'<div class="empty">No weather items.</div>'}</div>`;
  }

  function matchGeneric(x){if(!state.q)return true;return Object.values(x||{}).map(v=>String(v??'')).join(' ').toLowerCase().includes(state.q)}

  function renderTagged(type){
    let a=state.players.filter(p=>{const ts=tags(p);if(type==='cowbell')return ts.some(t=>/COWBELL|WORKHORSE|BELLCOW/.test(t));return isInjuryPlayer(p)});
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