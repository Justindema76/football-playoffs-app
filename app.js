(() => {
  'use strict';

  const SB = 'https://bbodmhffnqebhfksjier.supabase.co';
  const API_KEY = 'sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const APP_KEY_STORAGE = 'fantasyFootball2026AppKey';
  const LEAGUE_SIZE = 12;
  const MAX_TIERS = 12;
  const REFRESH_MS = 60000;
  const H = {apikey: API_KEY, Authorization: `Bearer ${API_KEY}`, 'Content-Type':'application/json'};

  const S = {view:'draft', pos:'ALL', q:'', players:[], intel:[], weather:[], owner:[], errors:[]};
  const $ = id => document.getElementById(id);
  const POS = ['ALL','QB','RB','WR','TE','DEF','K'];
  const TITLES = {intel:'INTEL',players:'PLAYERS',targets:'TARGETS',cowbell:'COWBELL',injuries:'INJURIES',weather:'WEATHER',draft:'DRAFT'};
  const FILTER_VIEWS = new Set(['players','targets','cowbell','injuries','draft']);

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normPos = v => ['QB','RB','WR','TE','DEF','K'].includes(String(v||'').toUpperCase()) ? String(v).toUpperCase() : 'X';
  const sortYahoo = (a,b) => (Number(a.yahoo_rank)||9999)-(Number(b.yahoo_rank)||9999) || String(a.yahoo_name||a.name||'').localeCompare(String(b.yahoo_name||b.name||''));
  const uniq = a => [...new Set(a.filter(Boolean).map(x=>String(x).trim().toUpperCase()).filter(Boolean))];
  const tagClass = t => {
    const x=String(t||'').toLowerCase();
    for (const k of ['target','cowbell','bellcow','stack','injury','monitor','handcuff','workhorse','upgrade','downgrade','avoid']) if(x.includes(k)) return k;
    return '';
  };
  const tags = p => uniq([...(p.intel_tags||[]),...(p.user_tags||[]),p.user_target?'TARGET':null,p.intel_action]);
  const matchPos = p => S.pos==='ALL' || normPos(p.position||p.pos)===S.pos;
  const matchQuery = obj => !S.q || Object.values(obj||{}).map(v=>Array.isArray(v)?v.join(' '):String(v??'')).join(' ').toLowerCase().includes(S.q);

  async function api(path, options={}) {
    const r = await fetch(`${SB}/rest/v1/${path}`, {...options, headers:{...H,...(options.headers||{})}});
    if(!r.ok) throw new Error(await r.text() || `${r.status}`);
    return r.status===204 ? null : r.json();
  }
  async function safe(name,path,fallback=[]) {
    try { return {name,data:await api(path),error:null}; }
    catch(error){ return {name,data:fallback,error}; }
  }

  function setSync(state,label){ $('syncPill').dataset.state=state; $('sync').textContent=label; }

  async function load(){
    setSync('loading','SYNCING');
    const rs = await Promise.all([
      safe('catalog','draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,role,yahoo_rank,consensus_rank,yahoo_verified,active&active=eq.true&order=yahoo_rank.asc.nullslast,yahoo_name.asc'),
      safe('targets','draft_target_selection?select=player_key,user_target,user_tags,user_note,priority&user_target=eq.true'),
      safe('overlay','yahoo_canonical_player_feed?select=*'),
      safe('intel','intel_items?select=*&status=neq.RESOLVED&order=priority.asc,updated_at.desc'),
      safe('weather','weather_watch?select=*&order=game_time.asc.nullslast'),
      safe('owner','intel_owner_state?select=*')
    ]);
    const R=Object.fromEntries(rs.map(x=>[x.name,x]));
    const targetMap=new Map(R.targets.data.map(x=>[x.player_key,x]));
    const overlayMap=new Map(R.overlay.data.map(x=>[x.player_key,x]));
    S.players=R.catalog.data.map(p=>{
      const t=targetMap.get(p.player_key), o=overlayMap.get(p.player_key)||{};
      return {...p,
        user_target:!!t?.user_target,user_tags:t?.user_tags||[],user_note:t?.user_note||null,user_priority:t?.priority??null,
        intel_tags:o.intel_tags||[],intel_action:o.intel_action||null,intel_priority:o.intel_priority||null,
        intel_recommendation:o.intel_recommendation||null,intel_what_changed:o.intel_what_changed||null,suggestions:o.suggestions||[]
      };
    }).sort(sortYahoo);
    S.intel=R.intel.data; S.weather=R.weather.data; S.owner=R.owner.data;
    S.errors=rs.filter(x=>x.error).map(x=>x.name);
    setSync(S.errors.length ? (S.players.length?'partial':'error') : 'live', S.errors.length ? (S.players.length?'PARTIAL':'ERROR') : 'LIVE');
    render();
  }

  function render(){
    $('app').dataset.view=S.view;
    $('viewTitle').textContent=TITLES[S.view];
    document.querySelectorAll('.nav-inner button').forEach(b=>b.classList.toggle('active',b.dataset.view===S.view));
    $('intelCount').textContent=S.intel.length;
    $('highCount').textContent=S.intel.filter(x=>['HIGH','CRITICAL'].includes(String(x.priority||'').toUpperCase())).length;
    $('flagCount').textContent=S.owner.filter(x=>x.is_flagged).length;
    $('targetCount').textContent=S.players.filter(x=>x.user_target).length;
    renderFilters(); renderNotice(); renderView();
  }

  function renderFilters(){
    const choices=FILTER_VIEWS.has(S.view)?POS:['ALL'];
    $('filters').innerHTML=choices.map(p=>`<button class="filter-chip ${S.pos===p?'active':''}" data-pos="${p}">${p}</button>`).join('');
    $('filters').querySelectorAll('[data-pos]').forEach(b=>b.onclick=()=>{S.pos=b.dataset.pos;renderFilters();renderView();});
  }
  function renderNotice(){
    const n=$('notice');
    if(!S.errors.length){n.hidden=true;n.textContent='';return;}
    n.hidden=false;n.textContent=`Some optional data could not load (${S.errors.join(', ')}). Yahoo player data remains available.`;
  }
  function renderView(){
    if(S.view==='draft') return renderDraft();
    if(S.view==='players') return renderPlayers(false);
    if(S.view==='targets') return renderPlayers(true);
    if(S.view==='cowbell') return renderSpecial('cowbell');
    if(S.view==='injuries') return renderSpecial('injuries');
    if(S.view==='weather') return renderWeather();
    return renderIntel();
  }

  function filteredPlayers(targetOnly=false){
    return S.players.filter(p=>(!targetOnly||p.user_target)&&matchPos(p)&&matchQuery(p)).sort(sortYahoo);
  }

  function renderPlayers(targetOnly){
    const a=filteredPlayers(targetOnly);
    $('viewMeta').textContent=targetOnly?`${a.length} starred targets`:`${a.length} Yahoo players`;
    $('content').innerHTML=`${targetOnly?'':`<div class="player-actions"><button type="button" class="add-player-button" id="addMissingPlayerButton">+ ADD MISSING YAHOO PLAYER</button></div>`}<div class="list-stack">${a.map(playerCard).join('')||'<div class="empty">No players match.</div>'}</div>`;
    bindStars();
    if(!targetOnly) $('addMissingPlayerButton')?.addEventListener('click',openPlayerModal);
  }

  function playerCard(p){
    const po=normPos(p.position), ts=tags(p).slice(0,6);
    return `<article class="card"><div class="card-top"><span class="position-badge ${po}">${po}</span><div style="display:flex;align-items:center;gap:7px"><span class="rank-badge">Yahoo #${esc(p.yahoo_rank??'—')}</span><button class="target-toggle ${p.user_target?'active':''}" data-key="${esc(p.player_key)}" data-target="${p.user_target?'false':'true'}">${p.user_target?'★':'☆'}</button></div></div><div class="card-name">${esc(p.yahoo_name||p.display_name)}</div><div class="card-meta">${esc(p.team||'')}${p.yahoo_verified?' · Yahoo verified':''}</div>${ts.length?`<div class="tags">${ts.map(tagHtml).join('')}</div>`:''}${p.intel_recommendation?`<div class="card-rec">${esc(p.intel_recommendation)}</div>`:''}</article>`;
  }

  function renderDraft(){
    const a=filteredPlayers(true);
    $('viewMeta').textContent=`${a.length} targets · Yahoo order · ${Math.min(MAX_TIERS,Math.ceil(a.length/LEAGUE_SIZE))} tiers`;
    if(!a.length){$('content').innerHTML='<div class="empty">No targets match.</div>';return;}
    const groups=[];
    a.forEach((p,i)=>{const t=Math.min(MAX_TIERS,Math.ceil((i+1)/LEAGUE_SIZE));(groups[t-1]??=[]).push(p);});
    $('content').innerHTML=`<div class="draft-summary"><div class="draft-summary-card"><span>STATUS</span><strong>PRE</strong></div><div class="draft-summary-card"><span>TARGETS</span><strong>${S.players.filter(x=>x.user_target).length}</strong></div><div class="draft-summary-card"><span>LEAGUE</span><strong>${LEAGUE_SIZE}</strong></div><div class="draft-summary-card"><span>ORDER</span><strong>YAHOO</strong></div></div><div class="tier-grid">${groups.map((g,i)=>tierBox(i+1,g)).join('')}</div>`;
  }

  function tierBox(n,a){
    const ranks=a.map(x=>Number(x.yahoo_rank)).filter(Number.isFinite);
    const label=ranks.length?`Yahoo #${Math.min(...ranks)}-${Math.max(...ranks)}`:'Yahoo rank pending';
    return `<section class="tier-box"><div class="tier-head"><strong>TIER ${n}</strong><span>${label} · ${a.length}</span></div>${a.map(draftRow).join('')}</section>`;
  }
  function draftRow(p){
    const po=normPos(p.position), intel=S.intel.find(x=>String(x.player_name||'').toLowerCase()===String(p.yahoo_name||'').toLowerCase());
    const ts=uniq([...(p.user_tags||[]),...(p.intel_tags||[]),...(intel?.draft_tags||[]),intel?.action]).slice(0,5);
    return `<div class="draft-row ${po}"><div class="draft-rank">${esc(p.yahoo_rank??'—')}</div><span class="position-badge ${po}">${po}</span><div class="draft-player"><div class="draft-name">${esc(p.yahoo_name)}</div><div class="draft-meta">${esc(p.team||'')} · Yahoo #${esc(p.yahoo_rank??'—')}</div>${ts.length?`<div class="tags">${ts.map(tagHtml).join('')}</div>`:''}${intel?.recommendation?`<div class="draft-intel">${esc(intel.recommendation)}</div>`:''}</div><span class="ready">READY</span></div>`;
  }

  function renderSpecial(type){
    const injury=/injur|practice|pup|\bir\b/i;
    let a=S.players.filter(p=>type==='cowbell'?tags(p).some(t=>/COWBELL|BELLCOW|WORKHORSE/.test(t)):tags(p).some(t=>/INJUR|MONITOR/.test(t))||injury.test(`${p.intel_what_changed||''} ${p.intel_recommendation||''}`));
    a=a.filter(matchPos).filter(matchQuery).sort(sortYahoo);
    $('viewMeta').textContent=`${a.length} players`; $('content').innerHTML=`<div class="list-stack">${a.map(playerCard).join('')||'<div class="empty">No players match.</div>'}</div>`; bindStars();
  }
  function renderIntel(){
    const a=S.intel.filter(matchQuery); $('viewMeta').textContent=`${a.length} active intel items`;
    $('content').innerHTML=`<div class="list-stack">${a.map(x=>{const po=normPos(x.position),act=x.action||'MONITOR';return `<article class="card"><div class="card-top"><span class="position-badge ${po}">${po}</span><span class="tag ${tagClass(act)}">${esc(act)}</span></div><div class="card-name">${esc(x.player_name)}</div><div class="card-meta">${esc(x.team||'')} · ${esc(x.priority||'')}</div><div class="card-text">${esc(x.what_changed||'')}</div>${x.recommendation?`<div class="card-rec"><b>WHAT TO DO</b><br>${esc(x.recommendation)}</div>`:''}</article>`}).join('')||'<div class="empty">No active intel.</div>'}</div>`;
  }
  function renderWeather(){
    const a=S.weather.filter(matchQuery); $('viewMeta').textContent=`${a.length} watched games`;
    $('content').innerHTML=`<div class="list-stack">${a.map(g=>`<article class="card"><div class="card-name">${esc(g.away_team)} @ ${esc(g.home_team)}</div><div class="card-meta">${esc(g.venue||'')}${g.condition?` · ${esc(g.condition)}`:''}</div><div class="card-text">Wind ${esc(g.wind_mph??'—')} mph · Temp ${esc(g.temperature_f??'—')}°F · Precip ${esc(g.precipitation_pct??'—')}%</div><div class="card-rec">${esc(g.fantasy_impact||'No material weather impact yet.')}</div></article>`).join('')||'<div class="empty">No material weather items yet.</div>'}</div>`;
  }
  const tagHtml=t=>`<span class="tag ${tagClass(t)}">${esc(t)}</span>`;

  function bindStars(){$('content').querySelectorAll('.target-toggle').forEach(b=>b.onclick=()=>toggleStar(b.dataset.key,b.dataset.target==='true'));}
  async function toggleStar(key,target){
    const token=localStorage.getItem(APP_KEY_STORAGE); if(!token){openKey();return;}
    try{await api('rpc/mobile_set_target',{method:'POST',body:JSON.stringify({p_token:token,p_player_key:key,p_target:target})});await load();}
    catch(e){localStorage.removeItem(APP_KEY_STORAGE);window.alert('Target update failed. Re-enter the app key.');openKey();}
  }
  function openKey(){$('keyInput').value=localStorage.getItem(APP_KEY_STORAGE)||'';$('keyModal').hidden=false;setTimeout(()=>$('keyInput').focus(),0);}
  function closeKey(){$('keyModal').hidden=true;}
  function saveKey(){const v=$('keyInput').value.trim();if(v)localStorage.setItem(APP_KEY_STORAGE,v);closeKey();}

  function openPlayerModal(){
    const token=localStorage.getItem(APP_KEY_STORAGE); if(!token){openKey();return;}
    $('manualName').value=''; $('manualTeam').value=''; $('manualPosition').value='RB'; $('manualRank').value='';
    $('playerModal').hidden=false; setTimeout(()=>$('manualName').focus(),0);
  }
  function closePlayerModal(){$('playerModal').hidden=true;}
  async function saveManualPlayer(){
    const token=localStorage.getItem(APP_KEY_STORAGE); if(!token){closePlayerModal();openKey();return;}
    const name=$('manualName').value.trim(), team=$('manualTeam').value.trim().toUpperCase(), position=$('manualPosition').value, rank=Number($('manualRank').value);
    if(!name || !Number.isInteger(rank) || rank<1){window.alert('Enter the Yahoo player name and Yahoo rank.');return;}
    try{
      await api('rpc/mobile_add_player',{method:'POST',body:JSON.stringify({p_token:token,p_name:name,p_team:team,p_position:position,p_yahoo_rank:rank,p_target:true})});
      closePlayerModal(); await load();
    }catch(e){window.alert('Could not add player: '+(e?.message||'unknown error'));}
  }

  $('search').oninput=e=>{S.q=e.target.value.trim().toLowerCase();renderView();};
  document.querySelectorAll('.nav-inner button').forEach(b=>b.onclick=()=>{S.view=b.dataset.view;S.pos='ALL';render();scrollTo({top:0,behavior:'smooth'});});
  $('keyButton').onclick=openKey; $('saveKeyButton').onclick=saveKey; document.querySelectorAll('[data-close-modal]').forEach(x=>x.onclick=closeKey);
  $('keyInput').onkeydown=e=>{if(e.key==='Enter')saveKey();if(e.key==='Escape')closeKey();};
  $('savePlayerButton').onclick=saveManualPlayer; document.querySelectorAll('[data-close-player-modal]').forEach(x=>x.onclick=closePlayerModal);
  $('manualRank').onkeydown=e=>{if(e.key==='Enter')saveManualPlayer();if(e.key==='Escape')closePlayerModal();};

  load(); setInterval(load,REFRESH_MS);
})();
