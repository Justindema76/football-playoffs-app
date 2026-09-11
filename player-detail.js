(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const LEAGUE_KEY='battle-of-the-kings-2026';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const cache={players:null};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>v===null||v===undefined||v===''?'—':Number(v).toFixed(2);
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const currentWeek=()=>Math.max(1,Math.min(18,Number(new URLSearchParams(location.search).get('week'))||1));

  async function api(path){
    const out=[],page=1000;
    for(let from=0;;from+=page){
      const r=await fetch(`${SB}/rest/v1/${path}`,{headers:{...H,Range:`${from}-${from+page-1}`},cache:'no-store'});
      if(!r.ok)throw Error(await r.text()||String(r.status));
      const data=await r.json();
      if(!Array.isArray(data))return data;
      out.push(...data);
      if(data.length<page)return out;
    }
  }

  async function masterPlayers(){
    if(cache.players)return cache.players;
    cache.players=await api('fantasy_players?select=player_key,yahoo_player_key,yahoo_name,player_name,team,position,yahoo_rank,role,active&active=eq.true&order=yahoo_rank.asc.nullslast,yahoo_name.asc');
    return cache.players;
  }

  function visibleName(el){
    return el.querySelector('.matchup-player-name')?.textContent?.trim()
      ||el.querySelector('.roster-name')?.textContent?.trim()
      ||el.querySelector('.league-player-main b')?.textContent?.trim()
      ||el.querySelector('.player-name')?.textContent?.trim()
      ||el.querySelector('.all-matchup-player-row b')?.textContent?.trim()
      ||el.querySelector('b')?.textContent?.trim()
      ||'';
  }

  function visibleTeam(el){
    const meta=el.querySelector('.matchup-player-meta,.roster-meta,.league-player-main small,.player-meta,.all-matchup-player-row small')?.textContent||'';
    return String(meta).split(/[·\s]/).map(x=>x.trim()).find(x=>/^[A-Z]{2,4}$/.test(x))||'';
  }

  function resolvePlayer(name,team,players){
    const exact=players.find(p=>norm(p.yahoo_name||p.player_name)===norm(name));
    if(exact)return exact;
    const m=String(name).match(/^([A-Z])\.\s+(.+)$/i);
    if(m){
      const first=m[1].toLowerCase(),last=norm(m[2]);
      const matches=players.filter(p=>{
        const full=String(p.yahoo_name||p.player_name||'').trim().split(/\s+/);
        return full.length>1&&full[0][0]?.toLowerCase()===first&&norm(full.slice(1).join(' '))===last;
      });
      if(team){const byTeam=matches.find(p=>String(p.team||'').toUpperCase()===String(team).toUpperCase());if(byTeam)return byTeam}
      if(matches.length)return matches[0];
    }
    const loose=players.filter(p=>norm(p.yahoo_name||p.player_name).includes(norm(name))||norm(name).includes(norm(p.yahoo_name||p.player_name)));
    if(team){const byTeam=loose.find(p=>String(p.team||'').toUpperCase()===String(team).toUpperCase());if(byTeam)return byTeam}
    return loose[0]||null;
  }

  function ensureModal(){
    if(document.getElementById('sharedPlayerModal'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="sharedPlayerModal" class="modal" hidden><div class="shade" data-player-close></div><section class="dialog" style="width:min(760px,100%);max-height:88vh;overflow:auto"><div class="dialog-actions" style="margin-top:0;justify-content:flex-end"><button class="secondary" type="button" data-player-close style="flex:0 0 auto">CLOSE</button></div><div id="sharedPlayerBody"></div></section></div>`);
  }

  function linkify(note){
    const s=String(note||'');
    let out='',last=0;const re=/https?:\/\/[^\s;]+/g;let m;
    while((m=re.exec(s))){out+=esc(s.slice(last,m.index));const raw=m[0].replace(/[),.]+$/,'');out+=`<a href="${esc(raw)}" target="_blank" rel="noopener noreferrer">${esc(raw)}</a>`;out+=esc(m[0].slice(raw.length));last=m.index+m[0].length}
    return out+esc(s.slice(last));
  }

  function tagsHtml(tags){
    const list=[...new Set((tags||[]).filter(Boolean).map(x=>String(x).toUpperCase()))];
    return list.length?`<div class="tags">${list.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`:'';
  }

  async function loadDetail(player){
    const y=player.yahoo_player_key?encodeURIComponent(player.yahoo_player_key):'';
    const k=player.player_key?encodeURIComponent(player.player_key):'';
    const n=encodeURIComponent(player.yahoo_name||player.player_name||'');
    const weeklyPath=y?`fantasy_player_week_stats?select=*&league_key=eq.${LEAGUE_KEY}&yahoo_player_key=eq.${y}&order=week.asc`:`fantasy_player_week_stats?select=*&league_key=eq.${LEAGUE_KEY}&player_key=eq.${k}&order=week.asc`;
    const poolPath=y?`fantasy_league_player_pool?select=*&league_key=eq.${LEAGUE_KEY}&yahoo_player_key=eq.${y}&limit=1`:`fantasy_league_player_pool?select=*&league_key=eq.${LEAGUE_KEY}&player_key=eq.${k}&limit=1`;
    const rosterPath=y?`fantasy_league_rosters?select=*&yahoo_player_key=eq.${y}&active=eq.true&limit=1`:`fantasy_league_rosters?select=*&player_key=eq.${k}&active=eq.true&limit=1`;
    const plannerPath=k?`planner_player_tags?select=*&player_key=eq.${k}&limit=1`:`planner_player_tags?select=*&player_name=eq.${n}&limit=1`;
    const intelByKey=y?`intel_items?select=*&yahoo_player_key=eq.${y}&status=neq.RESOLVED&order=updated_at.desc.nullslast,last_checked_at.desc.nullslast`:(k?`intel_items?select=*&player_key=eq.${k}&status=neq.RESOLVED&order=updated_at.desc.nullslast,last_checked_at.desc.nullslast`:`intel_items?select=*&player_name=eq.${n}&status=neq.RESOLVED&order=updated_at.desc.nullslast,last_checked_at.desc.nullslast`);
    const [weekly,pool,roster,planner,intel]=await Promise.all([
      api(weeklyPath).catch(()=>[]),api(poolPath).catch(()=>[]),api(rosterPath).catch(()=>[]),api(plannerPath).catch(()=>[]),api(intelByKey).catch(async()=>api(`intel_items?select=*&player_name=eq.${n}&status=neq.RESOLVED&order=updated_at.desc.nullslast,last_checked_at.desc.nullslast`).catch(()=>[]))
    ]);
    return {weekly,pool:pool[0]||null,roster:roster[0]||null,planner:planner[0]||null,intel};
  }

  function render(player,d){
    const week=currentWeek();
    const w=d.weekly.find(x=>Number(x.week)===week)||null;
    const pool=d.pool||{};
    const owner=pool.owning_team_name||d.roster?.owning_team_name||'';
    const status=String(pool.availability_status|| (owner?'ROSTERED':'FREE_AGENT')).replaceAll('_',' ');
    const newest=d.intel[0]||null;
    const tags=[...(d.planner?.tags||[]),...(newest?.draft_tags||[]),newest?.action].filter(Boolean);
    const game=[w?.game_time,w?.opponent,w?.game_status].filter(Boolean).join(' · ');
    const gameLog=d.weekly.length?d.weekly.map(x=>`<div class="detail-item"><b>WEEK ${esc(x.week)} · ${fmt(x.fantasy_points)} PTS</b><div>${esc([x.opponent,x.game_status,x.game_time].filter(Boolean).join(' · ')||'Game detail not synced')}</div><small>Projected ${fmt(x.projected_points)}</small></div>`).join(''):'<div class="detail-item">No weekly Yahoo scoring has been synced for this player yet.</div>';
    const intel=d.intel.length?d.intel.map(item=>`<div class="detail-item"><b>${esc(String(item.action||'MONITOR').toUpperCase())} · ${esc(item.priority||'')}</b>${item.what_changed?`<div>${esc(item.what_changed)}</div>`:''}${item.recommendation?`<div><b>WHAT TO DO:</b> ${esc(item.recommendation)}</div>`:''}${item.next_trigger?`<div><b>WHAT CHANGES THE CALL:</b> ${esc(item.next_trigger)}</div>`:''}${item.source_note?`<small><b>SOURCE:</b> ${linkify(item.source_note)}</small>`:''}</div>`).join(''):'<div class="detail-item">No active Fantasy Intel item is attached yet.</div>';

    document.getElementById('sharedPlayerBody').innerHTML=`<div class="card-top"><span class="pos ${esc(player.position||'X')}">${esc(player.position||'—')}</span><span class="rank">${esc(player.team||'FA')} · Yahoo #${esc(player.yahoo_rank||'—')}</span></div><div class="player-name">${esc(player.yahoo_name||player.player_name)}</div><div class="player-meta">${esc(status)}${owner?` · ${esc(owner)}`:''}${player.role?` · ${esc(player.role)}`:''}</div><div class="roster-overview" style="margin-top:14px"><div><b>${fmt(w?.fantasy_points)}</b><span>W${week} PTS</span></div><div><b>${fmt(w?.projected_points)}</b><span>PROJECTED</span></div><div><b>${esc(player.yahoo_rank||'—')}</b><span>YAHOO RANK</span></div><div><b>${pool.percent_rostered!=null?`${esc(pool.percent_rostered)}%`:'—'}</b><span>ROSTERED</span></div></div>${game?`<div class="weekly-strip"><b>W${week}</b><span>${esc(game)}</span><span>${pool.percent_started!=null?`${esc(pool.percent_started)}% started`:''}</span></div>`:''}${tagsHtml(tags)}${d.planner?.reason?`<div class="player-context"><b>PLAYER READ:</b> ${esc(d.planner.reason)}</div>`:''}${newest?`<div class="player-context"><b>CURRENT CALL:</b> ${esc(newest.recommendation||newest.what_changed||'Monitor current Intel.')}</div>`:''}<details class="player-details" open><summary>CURRENT INTEL (${d.intel.length})</summary>${intel}</details><details class="player-details"><summary>YAHOO WEEKLY LOG (${d.weekly.length})</summary>${gameLog}</details>`;
  }

  async function openFrom(el){
    ensureModal();
    const modal=document.getElementById('sharedPlayerModal');
    const body=document.getElementById('sharedPlayerBody');
    modal.hidden=false;body.innerHTML='<div class="empty">Loading player Intel…</div>';
    try{
      const players=await masterPlayers();
      const name=visibleName(el),team=visibleTeam(el),player=resolvePlayer(name,team,players);
      if(!player)throw Error(`Could not match ${name||'that player'} to the Yahoo master player database.`);
      render(player,await loadDetail(player));
    }catch(error){body.innerHTML=`<div class="empty">${esc(error.message)}</div>`}
  }

  function markClickable(root=document){
    root.querySelectorAll?.('.matchup-player-info,.all-matchup-player-row,.roster-card,.league-player-row,.player-card,.intel-card').forEach(el=>{
      el.dataset.playerDetail='1';el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`Open ${visibleName(el)||'player'} details`);el.style.cursor='pointer';
    });
  }

  ensureModal();markClickable();
  new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1){markClickable(n);if(n.matches?.('.matchup-player-info,.all-matchup-player-row,.roster-card,.league-player-row,.player-card,.intel-card'))markClickable(n.parentElement||document)}}))).observe(document.body,{childList:true,subtree:true});

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-player-close]')){document.getElementById('sharedPlayerModal').hidden=true;return}
    if(e.target.closest('a,button,input,select,summary'))return;
    const el=e.target.closest('[data-player-detail]');if(el)openFrom(el);
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')document.getElementById('sharedPlayerModal').hidden=true;
    if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-player-detail]')){e.preventDefault();openFrom(e.target.closest('[data-player-detail]'))}
  });
})();
