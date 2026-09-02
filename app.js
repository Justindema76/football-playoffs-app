(() => {
  'use strict';
  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const APP_KEY='fantasyFootball2026AppKey';
  const TIER_COUNT=12;
  const POSITIONS=['ALL','QB','RB','WR','TE','DEF','K'];
  const FILTER_VIEWS=new Set(['players','targets','draft','cowbell','injuries']);
  const state={view:'draft',pos:'ALL',q:'',players:[],intel:[],weather:[],owner:[],errors:[]};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const normPos=v=>{const p=String(v||'').toUpperCase();return ['QB','RB','WR','TE','DEF','K'].includes(p)?p:'X'};
  const sortYahoo=(a,b)=>(Number(a.yahoo_rank)||9999)-(Number(b.yahoo_rank)||9999)||String(a.yahoo_name||'').localeCompare(String(b.yahoo_name||''));
  const uniq=a=>[...new Set(a.filter(Boolean).map(x=>String(x).toUpperCase()))];
  const tagClass=t=>{const x=String(t||'').toLowerCase();for(const k of ['target','injury','monitor','cowbell','workhorse','handcuff','stack','upgrade','downgrade','avoid'])if(x.includes(k))return k;return''};
  const normName=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const intelSort=(a,b)=>new Date(b.updated_at||b.last_checked_at||0)-new Date(a.updated_at||a.last_checked_at||0);
  function currentIntelForPlayer(p){
    const names=[p.yahoo_name,p.display_name].map(normName).filter(Boolean);
    return state.intel.find(x=>names.includes(normName(x.player_name)))||null;
  }
  async function api(path,options={}){const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});if(!r.ok)throw Error(await r.text()||String(r.status));return r.status===204?null:r.json()}
  async function safe(name,path){try{return{name,data:await api(path),error:null}}catch(error){return{name,data:[],error}}}
  function setSync(s,t){$('syncPill').dataset.state=s;$('syncText').textContent=t}
  function matches(p){if(state.pos!=='ALL'&&normPos(p.position)!==state.pos)return false;if(!state.q)return true;const i=p.current_intel||{};return [p.yahoo_name,p.team,p.position,i.recommendation,i.what_changed,i.action,...(i.draft_tags||[])].join(' ').toLowerCase().includes(state.q)}
  function tags(p){const i=p.current_intel||{};return uniq([...(p.user_tags||[]),...(i.draft_tags||[]),p.user_target?'TARGET':null,i.action])}

  async function load(){
    setSync('loading','SYNCING');
    const rs=await Promise.all([
      safe('catalog','draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,yahoo_verified,source,active&active=eq.true&order=yahoo_rank.asc.nullslast,yahoo_name.asc'),
      safe('targets','draft_target_selection?select=player_key,user_target,user_tags,user_note,priority&user_target=eq.true'),
      safe('intel','intel_items?select=*&status=neq.RESOLVED&order=updated_at.desc.nullslast'),
      safe('weather','weather_watch?select=*&order=game_time.asc.nullslast'),
      safe('owner','intel_owner_state?select=*')
    ]);
    const R=Object.fromEntries(rs.map(x=>[x.name,x]));
    const targetMap=new Map(R.targets.data.map(x=>[x.player_key,x]));
    state.intel=R.intel.data.slice().sort(intelSort);
    state.players=R.catalog.data.map(p=>{const t=targetMap.get(p.player_key)||{};const base={...p,user_target:!!t.user_target,user_tags:t.user_tags||[],user_note:t.user_note||null};return{...base,current_intel:currentIntelForPlayer(base)}}).sort(sortYahoo);
    state.weather=R.weather.data;state.owner=R.owner.data;state.errors=rs.filter(x=>x.error).map(x=>x.name);
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
  function renderFilters(){const a=FILTER_VIEWS.has(state.view)?POSITIONS:['ALL'];$('positionFilters').innerHTML=a.map(p=>`<button class="${state.pos===p?'active':''}" data-pos="${p}">${p}</button>`).join('');$('positionFilters').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.pos=b.dataset.pos;renderFilters();renderView()})}
  function renderNotice(){const n=$('notice');if(!state.errors.length){n.hidden=true;n.textContent='';return}n.hidden=false;n.textContent=`Some optional data could not load: ${state.errors.join(', ')}.`}
  function renderView(){if(state.view==='players')return renderPlayers(false);if(state.view==='targets')return renderPlayers(true);if(state.view==='draft')return renderDraft();if(state.view==='intel')return renderIntel();if(state.view==='weather')return renderWeather();if(state.view==='cowbell')return renderTagged('cowbell');return renderTagged('injuries')}

  function visiblePlayers(targetOnly=false){return state.players.filter(p=>(!targetOnly||p.user_target)&&matches(p)).sort(sortYahoo)}
  function renderPlayers(targetOnly){const a=visiblePlayers(targetOnly);$('pageMeta').textContent=targetOnly?`${a.length} targeted players`:`${a.length} Yahoo Player List rows`;$('content').innerHTML=`${targetOnly?'':`<div class="player-toolbar"><span class="source-badge">Source: Yahoo Player List sync</span><button id="addMissing" class="add-missing">+ ADD MISSING YAHOO PLAYER</button></div>`}<div class="list">${a.map(playerCard).join('')||'<div class="empty">No players match.</div>'}</div>`;bindTargets();if(!targetOnly)$('addMissing')?.addEventListener('click',openManual)}
  function playerCard(p){const po=normPos(p.position),ts=tags(p).slice(0,6),i=p.current_intel;return`<article class="player-card ${p.user_target?'targeted':''}"><div class="card-top"><span class="pos ${po}">${po}</span><div style="display:flex;gap:7px;align-items:center"><span class="rank">Yahoo #${esc(p.yahoo_rank??'—')}</span><button class="target-button ${p.user_target?'on':''}" data-key="${esc(p.player_key)}" data-target="${p.user_target?'false':'true'}">${p.user_target?'TARGETED':'TARGET'}</button></div></div><div class="player-name">${esc(p.yahoo_name||p.display_name)}</div><div class="player-meta">${esc(p.team||'')} · ${esc(p.source||'Yahoo')}</div>${ts.length?`<div class="tags">${ts.map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}${i?.recommendation?`<div class="current-intel">${esc(i.recommendation)}</div>`:''}</article>`}
  function bindTargets(){$('content').querySelectorAll('.target-button').forEach(b=>b.onclick=()=>toggleTarget(b.dataset.key,b.dataset.target==='true'))}
  async function toggleTarget(key,target){const token=localStorage.getItem(APP_KEY);if(!token){openKey();return}try{await api('rpc/mobile_set_target',{method:'POST',body:JSON.stringify({p_token:token,p_player_key:key,p_target:target})});await load()}catch(e){localStorage.removeItem(APP_KEY);alert('Target update failed. Re-enter the app key.');openKey()}}

  function renderDraft(){
    const all=state.players.slice().sort(sortYahoo);
    const shown=all.filter(matches);
    const targeted=all.filter(p=>p.user_target).length;
    $('pageMeta').textContent=`${shown.length} Yahoo players shown · ${targeted} targeted · ${TIER_COUNT} tiers`;
    if(!all.length){$('content').innerHTML='<div class="empty">No Yahoo players synced yet.</div>';return}
    const size=Math.max(1,Math.ceil(all.length/TIER_COUNT));
    const grouped=Array.from({length:TIER_COUNT},()=>[]);
    all.forEach((p,i)=>grouped[Math.min(TIER_COUNT-1,Math.floor(i/size))].push(p));
    const allowed=new Set(shown.map(x=>x.player_key));
    const displayGroups=grouped.map(g=>g.filter(p=>allowed.has(p.player_key)));
    $('content').innerHTML=`<div class="draft-summary"><div><span>YAHOO PLAYERS</span><b>${all.length}</b></div><div><span>TARGETED</span><b>${targeted}</b></div><div><span>TIERS</span><b>${TIER_COUNT}</b></div><div><span>ORDER</span><b>YAHOO</b></div></div><div class="tier-grid">${displayGroups.map((g,i)=>tier(i+1,g)).join('')}</div>`;
    bindTargets();
  }
  function tier(n,a){const ranks=a.map(x=>Number(x.yahoo_rank)).filter(Number.isFinite);return`<section class="tier"><div class="tier-head"><b>TIER ${n}</b><span>${ranks.length?`Yahoo #${Math.min(...ranks)}-${Math.max(...ranks)}`:'No matches'} · ${a.length}</span></div>${a.map(draftRow).join('')}</section>`}
  function draftRow(p){const po=normPos(p.position),i=p.current_intel,ts=tags(p).filter(t=>t!=='TARGET').slice(0,3);return`<div class="draft-row ${po} ${p.user_target?'targeted':''}"><div class="draft-rank">${esc(p.yahoo_rank??'—')}</div><span class="pos ${po}">${po}</span><div class="draft-player-main"><div class="draft-name">${esc(p.yahoo_name)}</div><div class="draft-meta">${esc(p.team||'')} · Yahoo #${esc(p.yahoo_rank??'—')}</div>${ts.length?`<div class="tags">${ts.map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}${i?.recommendation?`<div class="draft-intel">${esc(i.recommendation)}</div>`:''}</div><button class="target-button draft-target ${p.user_target?'on':''}" data-key="${esc(p.player_key)}" data-target="${p.user_target?'false':'true'}">${p.user_target?'TARGETED':'TARGET'}</button></div>`}

  function renderIntel(){const a=state.intel.filter(matchGeneric).slice().sort(intelSort);$('pageMeta').textContent=`${a.length} current Fantasy Intel Watch items`;$('content').innerHTML=`<div class="list">${a.map(x=>`<article class="intel-card"><div class="card-top"><span class="pos ${normPos(x.position)}">${normPos(x.position)}</span><span class="tag ${tagClass(x.action)}">${esc(x.action||'MONITOR')}</span></div><div class="player-name">${esc(x.player_name)}</div><div class="player-meta">${esc(x.team||'')} · ${esc(x.priority||'')} · ${x.last_checked_at?`Checked ${esc(new Date(x.last_checked_at).toLocaleString())}`:''}</div><p>${esc(x.what_changed||'')}</p>${x.recommendation?`<p><b>WHAT TO DO:</b> ${esc(x.recommendation)}</p>`:''}${x.draft_tags?.length?`<div class="tags">${x.draft_tags.map(t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join('')}</div>`:''}</article>`).join('')||'<div class="empty">No current intel.</div>'}</div>`}
  function renderWeather(){const a=state.weather.filter(matchGeneric);$('pageMeta').textContent=`${a.length} watched games`;$('content').innerHTML=`<div class="list">${a.map(g=>`<article class="weather-card"><div class="player-name">${esc(g.away_team)} @ ${esc(g.home_team)}</div><div class="player-meta">${esc(g.venue||'')} · ${esc(g.condition||'')}</div><p>Wind ${esc(g.wind_mph??'—')} mph · Temp ${esc(g.temperature_f??'—')}°F · Precip ${esc(g.precipitation_pct??'—')}%</p><p>${esc(g.fantasy_impact||'No material impact yet.')}</p></article>`).join('')||'<div class="empty">No weather items.</div>'}</div>`}
  function matchGeneric(x){if(!state.q)return true;return Object.values(x||{}).map(v=>String(v??'')).join(' ').toLowerCase().includes(state.q)}
  function renderTagged(type){const injury=/injur|practice|pup|\bir\b/i;let a=state.players.filter(p=>{const i=p.current_intel||{},ts=tags(p);return type==='cowbell'?ts.some(t=>/COWBELL|WORKHORSE|BELLCOW/.test(t)):ts.some(t=>/INJUR|MONITOR/.test(t))||injury.test(`${i.recommendation||''} ${i.what_changed||''}`)});a=a.filter(matches).sort(sortYahoo);$('pageMeta').textContent=`${a.length} current players`;$('content').innerHTML=`<div class="list">${a.map(playerCard).join('')||'<div class="empty">No current players match.</div>'}</div>`;bindTargets()}

  function openKey(){$('keyInput').value=localStorage.getItem(APP_KEY)||'';$('keyModal').hidden=false;setTimeout(()=>$('keyInput').focus(),0)}function closeKey(){$('keyModal').hidden=true}function saveKey(){const v=$('keyInput').value.trim();if(!/^\d{6}$/.test(v)){alert('Enter the 6-digit app key.');return}localStorage.setItem(APP_KEY,v);closeKey()}
  function openManual(){if(!localStorage.getItem(APP_KEY)){openKey();return}$('mName').value='';$('mTeam').value='';$('mPos').value='RB';$('mRank').value='';$('manualModal').hidden=false;setTimeout(()=>$('mName').focus(),0)}function closeManual(){$('manualModal').hidden=true}
  async function saveManual(){const token=localStorage.getItem(APP_KEY);const name=$('mName').value.trim(),team=$('mTeam').value.trim().toUpperCase(),position=$('mPos').value,rank=Number($('mRank').value);if(!token){closeManual();openKey();return}if(!name||!Number.isInteger(rank)||rank<1){alert('Enter the exact Yahoo player name and rank.');return}try{await api('rpc/mobile_add_player',{method:'POST',body:JSON.stringify({p_token:token,p_name:name,p_team:team,p_position:position,p_yahoo_rank:rank,p_target:true})});closeManual();await load()}catch(e){alert('Could not add player: '+e.message)}}

  $('search').oninput=e=>{state.q=e.target.value.trim().toLowerCase();renderView()};document.querySelectorAll('.bottom-nav button').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;state.pos='ALL';render();scrollTo({top:0,behavior:'smooth'})});$('keyButton').onclick=openKey;$('saveKey').onclick=saveKey;document.querySelectorAll('[data-close-key]').forEach(x=>x.onclick=closeKey);$('keyInput').onkeydown=e=>{if(e.key==='Enter')saveKey();if(e.key==='Escape')closeKey()};$('saveManual').onclick=saveManual;document.querySelectorAll('[data-close-manual]').forEach(x=>x.onclick=closeManual);$('mRank').onkeydown=e=>{if(e.key==='Enter')saveManual();if(e.key==='Escape')closeManual()};
  load();setInterval(load,60000);
})();