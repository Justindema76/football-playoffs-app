(() => {
  'use strict';

  let selectedTeam='ALL';

  function allTags(player){
    return [...new Set([
      ...(player.user_tags||[]),
      ...(player.planner_tags||[]),
      ...((player.intel_items||[]).flatMap(item=>[...(item.draft_tags||[]),item.action])),
      player.user_target?'TARGET':null
    ].filter(Boolean).map(tag=>String(tag).trim().toUpperCase()))];
  }

  function roleLabel(player){
    const tags=allTags(player);
    if(tags.includes('COWBELL'))return 'COWBELL';
    if(tags.includes('WORKHORSE'))return 'RB1 / WORKHORSE';
    if(tags.includes('HANDCUFF'))return 'BACKUP / HANDCUFF';
    if(tags.includes('COMMITTEE'))return 'COMMITTEE';
    return 'RUNNING BACK';
  }

  function matches(player,state,intelApi){
    if(state.pos==='STARRED'&&!player.user_target)return false;
    if(state.pos==='INTEL'&&!(player.intel_items||[]).length)return false;
    if(state.pos==='INJURY'&&!intelApi.isInjuryPlayer(player))return false;
    if(!state.q)return true;
    const intel=player.intel_items||[];
    return [
      player.yahoo_name,player.display_name,player.team,player.position,player.planner_reason,
      ...allTags(player),
      ...intel.flatMap(item=>[item.action,item.priority,item.status,item.what_changed,item.recommendation,item.source_note,...(item.draft_tags||[])])
    ].join(' ').toLowerCase().includes(state.q);
  }

  function render(ctx){
    const {state,$,esc,tagClass,intelApi,bindTargets}=ctx;
    const allBacks=state.players
      .filter(player=>String(player.position||'').toUpperCase()==='RB')
      .sort((a,b)=>String(a.team||'ZZZ').localeCompare(String(b.team||'ZZZ'))||(Number(a.yahoo_rank)||9999)-(Number(b.yahoo_rank)||9999));

    const teams=[...new Set(allBacks.map(player=>String(player.team||'FA').toUpperCase()))].sort();
    if(selectedTeam!=='ALL'&&!teams.includes(selectedTeam))selectedTeam='ALL';

    const backs=allBacks
      .filter(player=>matches(player,state,intelApi))
      .filter(player=>selectedTeam==='ALL'||String(player.team||'FA').toUpperCase()===selectedTeam);

    const groups=new Map();
    backs.forEach(player=>{
      const team=String(player.team||'FA').toUpperCase();
      if(!groups.has(team))groups.set(team,[]);
      groups.get(team).push(player);
    });

    $('pageMeta').textContent=`${backs.length} running backs · ${selectedTeam==='ALL'?groups.size+' teams':selectedTeam}`;
    $('content').innerHTML=`
      <div class="position-toolbar">
        <label class="team-filter-label"><span>TEAM</span><select id="rbTeamFilter" class="team-filter"><option value="ALL">ALL TEAMS</option>${teams.map(team=>`<option value="${esc(team)}" ${selectedTeam===team?'selected':''}>${esc(team)}</option>`).join('')}</select></label>
        <span class="position-toolbar-note">RB1s, committees, backups and handcuffs</span>
      </div>
      <div class="position-board">${[...groups.entries()].map(([team,players])=>`
        <section class="position-team-section">
          <div class="position-team-header"><span class="team-badge team-badge-large">${esc(team)}</span><b>${esc(team)} RUNNING BACKS</b><span>${players.length} shown</span></div>
          <div class="position-team-grid">${players.map(player=>{
            const intel=player.intel_items||[];
            const latest=intelApi.latest(intel)||{};
            const tags=allTags(player);
            const context=player.planner_reason||latest.recommendation||latest.what_changed||'No material role change currently logged.';
            return `<article class="player-card position-card ${player.user_target?'targeted':''}">
              <div class="card-top"><div class="position-role-wrap"><span class="pos RB">RB</span><span class="position-role rb-role">${esc(roleLabel(player))}</span></div><div class="position-actions"><span class="tier-badge">TIER ${esc(player.tier??'—')}</span><span class="rank">Yahoo #${esc(player.yahoo_rank??'—')}</span><button class="target-button ${player.user_target?'on':''}" data-key="${esc(player.player_key)}" data-target="${player.user_target?'false':'true'}">${player.user_target?'TARGETED':'TARGET'}</button></div></div>
              <div class="position-name-line"><div class="player-name">${esc(player.yahoo_name||player.display_name)}</div><span class="team-badge">${esc(team)}</span></div>
              ${tags.length?`<div class="tags">${tags.map(tag=>`<span class="tag ${tagClass(tag)}">${esc(tag)}</span>`).join('')}</div>`:''}
              <div class="player-context position-current-read"><b>CURRENT READ:</b> ${esc(context)}</div>
              ${intelApi.renderPlayerDetails(player,esc,tagClass,{openSingle:false})}
            </article>`;
          }).join('')}</div>
        </section>`).join('')||'<div class="empty">No running backs match.</div>'}</div>`;

    const teamFilter=$('rbTeamFilter');
    if(teamFilter)teamFilter.onchange=e=>{selectedTeam=e.target.value;render(ctx)};
    bindTargets();
  }

  window.FantasyRunningBacks=Object.freeze({render,allTags,roleLabel});
})();