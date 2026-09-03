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

  function roleLabel(index,tags){
    const depth=index===0?'WR1':index===1?'WR2':index===2?'WR3':'WR DEPTH';
    if(tags.includes('PREMIUM'))return `${depth} / PREMIUM`;
    if(tags.includes('TARGET'))return `${depth} / TARGET`;
    if(tags.includes('SLEEPER'))return `${depth} / SLEEPER`;
    if(tags.includes('STACK'))return `${depth} / STACK`;
    return depth;
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
    const allReceivers=state.players
      .filter(player=>String(player.position||'').toUpperCase()==='WR')
      .sort((a,b)=>String(a.team||'ZZZ').localeCompare(String(b.team||'ZZZ'))||(Number(a.yahoo_rank)||9999)-(Number(b.yahoo_rank)||9999));

    const depthIndex=new Map();
    const teamDepthCount=new Map();
    allReceivers.forEach(player=>{
      const team=String(player.team||'FA').toUpperCase();
      const index=teamDepthCount.get(team)||0;
      depthIndex.set(player.player_key,index);
      teamDepthCount.set(team,index+1);
    });

    const teams=[...new Set(allReceivers.map(player=>String(player.team||'FA').toUpperCase()))].sort();
    if(selectedTeam!=='ALL'&&!teams.includes(selectedTeam))selectedTeam='ALL';

    const receivers=allReceivers
      .filter(player=>matches(player,state,intelApi))
      .filter(player=>selectedTeam==='ALL'||String(player.team||'FA').toUpperCase()===selectedTeam);

    const groups=new Map();
    receivers.forEach(player=>{
      const team=String(player.team||'FA').toUpperCase();
      if(!groups.has(team))groups.set(team,[]);
      groups.get(team).push(player);
    });

    $('pageMeta').textContent=`${receivers.length} wide receivers · ${selectedTeam==='ALL'?groups.size+' teams':selectedTeam}`;
    $('content').innerHTML=`
      <div class="position-toolbar">
        <label class="team-filter-label"><span>TEAM</span><select id="wrTeamFilter" class="team-filter"><option value="ALL">ALL TEAMS</option>${teams.map(team=>`<option value="${esc(team)}" ${selectedTeam===team?'selected':''}>${esc(team)}</option>`).join('')}</select></label>
        <span class="position-toolbar-note">WR1, WR2, WR3 and depth</span>
      </div>
      <div class="position-board">${[...groups.entries()].map(([team,players])=>`
        <section class="position-team-section">
          <div class="position-team-header"><span class="team-badge team-badge-large">${esc(team)}</span><b>${esc(team)} WIDE RECEIVERS</b><span>${players.length} shown</span></div>
          <div class="position-team-grid">${players.map(player=>{
            const intel=player.intel_items||[];
            const latest=intelApi.latest(intel)||{};
            const tags=allTags(player);
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

  window.FantasyWideReceivers=Object.freeze({render,allTags,roleLabel});
})();