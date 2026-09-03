(() => {
  'use strict';

  let selectedTeam='ALL';

  function roleLabel(index,tags){
    const depth=index===0?'WR1':index===1?'WR2':index===2?'WR3':'WR DEPTH';
    if(tags.includes('PREMIUM'))return `${depth} / PREMIUM`;
    if(tags.includes('TARGET'))return `${depth} / TARGET`;
    if(tags.includes('SLEEPER'))return `${depth} / SLEEPER`;
    if(tags.includes('STACK'))return `${depth} / STACK`;
    return depth;
  }

  function render(ctx){
    const {state,$,esc,tagClass,intelApi,playersApi,bindTargets}=ctx;
    const allReceivers=playersApi.byPosition(state.players,'WR').slice().sort((a,b)=>String(a.team||'ZZZ').localeCompare(String(b.team||'ZZZ'))||playersApi.sortYahoo(a,b));

    const depthIndex=new Map();
    const teamDepthCount=new Map();
    allReceivers.forEach(player=>{
      const team=String(player.team||'FA').toUpperCase();
      const index=teamDepthCount.get(team)||0;
      depthIndex.set(player.player_key,index);
      teamDepthCount.set(team,index+1);
    });

    const teamOptions=playersApi.teams(allReceivers);
    if(selectedTeam!=='ALL'&&!teamOptions.includes(selectedTeam))selectedTeam='ALL';

    const receivers=allReceivers
      .filter(player=>playersApi.matches(player,state,intelApi))
      .filter(player=>selectedTeam==='ALL'||String(player.team||'FA').toUpperCase()===selectedTeam);
    const groups=playersApi.groupByTeam(receivers);

    $('pageMeta').textContent=`${receivers.length} wide receivers · ${selectedTeam==='ALL'?groups.size+' teams':selectedTeam}`;
    $('content').innerHTML=`
      <div class="position-toolbar">
        <label class="team-filter-label"><span>TEAM</span><select id="wrTeamFilter" class="team-filter"><option value="ALL">ALL TEAMS</option>${teamOptions.map(team=>`<option value="${esc(team)}" ${selectedTeam===team?'selected':''}>${esc(team)}</option>`).join('')}</select></label>
        <span class="position-toolbar-note">Same canonical players · WR view</span>
      </div>
      <div class="position-board">${[...groups.entries()].map(([team,players])=>`
        <section class="position-team-section">
          <div class="position-team-header"><span class="team-badge team-badge-large">${esc(team)}</span><b>${esc(team)} WIDE RECEIVERS</b><span>${players.length} shown</span></div>
          <div class="position-team-grid">${players.map(player=>{
            const latest=intelApi.latest(player.intel_items||[])||{};
            const tags=playersApi.allTags(player);
            const context=player.planner_reason||latest.recommendation||latest.what_changed||'No material role change currently logged.';
            const index=depthIndex.get(player.player_key)??99;
            return `<article class="player-card position-card ${player.user_target?'targeted':''}">
              <div class="card-top"><div class="position-role-wrap"><span class="pos WR">WR</span><span class="position-role wr-role">${esc(roleLabel(index,tags))}</span></div><div class="position-actions"><span class="tier-badge">TIER ${esc(player.tier??'—')}</span><span class="rank">Yahoo #${esc(player.yahoo_rank??'—')}</span><button class="target-button ${player.user_target?'on':''}" data-key="${esc(player.player_key)}" data-target="${player.user_target?'false':'true'}">${player.user_target?'TARGETED':'TARGET'}</button></div></div>
              <div class="position-name-line"><div class="player-name">${esc(player.yahoo_name||player.display_name)}</div><span class="team-badge">${esc(team)}</span></div>
              ${tags.length?`<div class="tags">${tags.map(tag=>`<span class="tag ${tagClass(tag)}">${esc(tag)}</span>`).join('')}</div>`:''}
              <div class="player-context position-current-read"><b>CURRENT READ:</b> ${esc(context)}</div>
              ${intelApi.renderPlayerDetails(player,esc,tagClass,{openSingle:false})}
            </article>`;
          }).join('')}</div>
        </section>`).join('')||'<div class="empty">No wide receivers match.</div>'}</div>`;

    const teamFilter=$('wrTeamFilter');
    if(teamFilter)teamFilter.onchange=e=>{selectedTeam=e.target.value;render(ctx)};
    bindTargets();
  }

  window.FantasyWideReceivers=Object.freeze({render});
})();