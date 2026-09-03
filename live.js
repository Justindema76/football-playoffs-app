(() => {
  'use strict';
  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const state={players:[],gone:new Map(),view:'starred',q:'',lastChange:null};
  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(path,options={}){const r=await fetch(`${SB}/rest/v1/${path}`,{...options,headers:{...H,...(options.headers||{})}});if(!r.ok)throw Error(await r.text()||String(r.status));return r.status===204?null:r.json()}
  async function load(){
    $('syncStatus').className='status syncing';$('syncStatus').textContent='SYNCING';
    try{
      const [catalog,targets,live]=await Promise.all([
        api('draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,active&active=eq.true&order=yahoo_rank.asc.nullslast'),
        api('draft_target_selection?select=player_key,user_target'),
        api('live_draft_state?select=player_key,drafted,drafted_at&drafted=eq.true&order=drafted_at.desc')
      ]);
      const tm=new Map((targets||[]).map(x=>[norm(x.player_key),!!x.user_target]));
      state.gone=new Map((live||[]).map(x=>[norm(x.player_key),x]));
      // p.yahoo_rank must be checked for null/undefined BEFORE the Number()
      // coercion below -- Number(null) is 0, not NaN, so a catalog row with
      // no rank was passing isFinite() and sorting to the very front of the
      // list (ahead of the real #1) instead of being excluded like it
      // should be. That's what put rankless rows like Justice Hill and
      // George Holani above Jahmyr Gibbs.
      state.players=(catalog||[]).filter(p=>p.yahoo_rank!=null&&Number.isFinite(Number(p.yahoo_rank))).map(p=>({...p,key:norm(p.player_key),starred:tm.get(norm(p.player_key))===true})).sort((a,b)=>Number(a.yahoo_rank)-Number(b.yahoo_rank));
      state.lastChange=(live||[])[0]?.drafted_at||state.lastChange;
      $('syncStatus').className='status live';$('syncStatus').textContent='LIVE';
      $('notice').hidden=true;
      render();
    }catch(e){$('syncStatus').className='status error';$('syncStatus').textContent='ERROR';$('notice').hidden=false;$('notice').textContent=e.message;}
  }
  function filtered(){return state.players.filter(p=>{
    const gone=state.gone.has(p.key);
    if(state.view==='starred'&&!p.starred)return false;
    if(state.view==='gone'&&!gone)return false;
    if(state.q&&!`${p.yahoo_name||p.display_name} ${p.team||''} ${p.position||''}`.toLowerCase().includes(state.q))return false;
    return true;
  })}
  function render(){
    const goneCount=state.players.filter(p=>state.gone.has(p.key)).length;
    const avail=state.players.length-goneCount;
    const starredLeft=state.players.filter(p=>p.starred&&!state.gone.has(p.key)).length;
    $('availableCount').textContent=avail;
    $('goneCount').textContent=goneCount;
    $('starCount').textContent=starredLeft;
    $('lastUpdate').textContent=state.lastChange?new Date(state.lastChange).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'—';
    const a=filtered();
    $('players').innerHTML=a.map(p=>{
      const gone=state.gone.has(p.key);
      return `<article class="player ${p.starred?'starred':''} ${gone?'gone':''}"><div class="top"><span class="pos">${esc(p.position||'—')}</span><span class="rank">Yahoo #${esc(p.yahoo_rank)}</span></div><div class="name">${esc(p.yahoo_name||p.display_name)}</div><div class="meta">${esc(p.team||'')} ${gone?'· drafted':''}</div><div class="badges">${p.starred?'<span class="badge star">★ STARRED</span>':''}${gone?'<span class="badge gone">GONE</span>':''}</div>${gone?`<button class="undo" data-undo="${esc(p.player_key)}">UNDO</button>`:''}</article>`;
    }).join('')||'<div class="empty">No players match this view.</div>';
    document.querySelectorAll('[data-undo]').forEach(b=>b.onclick=()=>undo(b.dataset.undo));
  }
  async function undo(key){
    try{await api(`live_draft_state?player_key=eq.${encodeURIComponent(key)}`,{method:'DELETE'});await load()}catch(e){$('notice').hidden=false;$('notice').textContent=`UNDO failed: ${e.message}`}
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));render()});
  $('search').oninput=e=>{state.q=e.target.value.trim().toLowerCase();render()};
  $('refresh').onclick=()=>load();
  load();
  setInterval(load,2000);
})();