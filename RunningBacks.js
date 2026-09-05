(() => {
  'use strict';

  let selectedTeam='ALL';
  let selectedRole='ALL';

  function roleLabel(player,playersApi){
    const tags=playersApi.allTags(player);
    if(tags.includes('COWBELL'))return 'COWBELL';
    if(tags.includes('WORKHORSE'))return 'RB1 / WORKHORSE';
    if(tags.includes('HANDCUFF'))return 'BACKUP / HANDCUFF';
    if(tags.includes('COMMITTEE'))return 'COMMITTEE';
    return 'RUNNING BACK';
  }

  function render(ctx){
    const {state,$,esc,tagClass,intelApi,playersApi,bindTargets}=ctx;
    const allBacks=playersApi.byPosition(state.players,'RB').slice().sort((a,b)=>String(a.team||'ZZZ').localeCompare(String(b.team||'ZZZ'))||playersApi.sortYahoo(a,b));
    const teamOptions=playersApi.teams(allBacks);
    if(selectedTeam!=='ALL'&&!teamOptions.includes(selectedTeam))selectedTeam='ALL';

    const backs=allBacks
      .filter(player=>playersApi.matches(player,state,intelApi))
      .filter(player=>state.pos!=='COWBELL'||playersApi.allTags(player).includes('COWBELL'))
      .filter(player=>selectedRole==='ALL'||playersApi.allTags(player).includes(selectedRole))
      .filter(player=>selectedTeam==='ALL'||String(player.team||'FA').toUpperCase()===selectedTeam);
    const groups=playersApi.groupByTeam(backs);

    const viewLabel=selectedRole==='HANDCUFF'?'handcuffs':'running backs';
    $('pageMeta').textContent=`${backs.length} ${viewLabel} · ${selectedTeam==='ALL'?groups.size+' teams':selectedTeam}`;
    $('content').innerHTML=`
      <div class="position-toolbar">
        <label class="team-filter-label"><span>RB SORT</span><select id="rbRoleFilter" class="team-filter"><option value="ALL" ${selectedRole==='ALL'?'selected':''}>ALL RUNNING BACKS</option><option value="HANDCUFF" ${selectedRole==='HANDCUFF'?'selected':''}>HANDCUFFS</option></select></label>
        <label class="team-filter-label"><span>TEAM</span><select id="rbTeamFilter" class="team-filter"><option value="ALL">ALL TEAMS</option>${teamOptions.map(team=>`<option value="${esc(team)}" ${selectedTeam===team?'selected':''}>${esc(team)}</option>`).join('')}</select></label>
        <span class="position-toolbar-note">${selectedRole==='HANDCUFF'?'Live HANDCUFF intel tags · updates automatically':'Same canonical players · RB view'}</span>
      </div>
      <div class="position-board">${[...groups.entries()].map(([team,players])=>`
        <section class="position-team-section">
          <div class="position-team-header"><span class="team-badge team-badge-large">${esc(team)}</span><b>${esc(team)} RUNNING BACKS</b><span>${players.length} shown</span></div>
          <div class="position-team-grid">${players.map(player=>{
            const latest=intelApi.latest(player.intel_items||[])||{};
            const tags=playersApi.allTags(player);
            const context=player.planner_reason||latest.recommendation||latest.what_changed||'No material role change currently logged.';
            return `<article class="player-card position-card ${player.user_target?'targeted':''}">
              <div class="card-top"><div class="position-role-wrap"><span class="pos RB">RB</span><span class="position-role rb-role">${esc(roleLabel(player,playersApi))}</span></div><div class="position-actions"><span class="tier-badge">TIER ${esc(player.tier??'—')}</span><span class="rank">Yahoo #${esc(player.yahoo_rank??'—')}</span><button class="target-button ${player.user_target?'on':''}" data-key="${esc(player.player_key)}" data-target="${player.user_target?'false':'true'}">${player.user_target?'TARGETED':'TARGET'}</button></div></div>
              <div class="position-name-line"><div class="player-name">${esc(player.yahoo_name||player.display_name)}</div><span class="team-badge">${esc(team)}</span></div>
              ${tags.length?`<div class="tags">${tags.map(tag=>`<span class="tag ${tagClass(tag)}">${esc(tag)}</span>`).join('')}</div>`:''}
              <div class="player-context position-current-read"><b>CURRENT READ:</b> ${esc(context)}</div>
              ${intelApi.renderPlayerDetails(player,esc,tagClass,{openSingle:false})}
            </article>`;
          }).join('')}</div>
        </section>`).join('')||'<div class="empty">No running backs match.</div>'}</div>`;

    const roleFilter=$('rbRoleFilter');
    if(roleFilter)roleFilter.onchange=e=>{selectedRole=e.target.value;render(ctx)};
    const teamFilter=$('rbTeamFilter');
    if(teamFilter)teamFilter.onchange=e=>{selectedTeam=e.target.value;render(ctx)};
    bindTargets();
  }

  window.FantasyRunningBacks=Object.freeze({render});
})();