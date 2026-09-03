(() => {
  'use strict';

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

  function render({state,$,esc,tagClass,intelApi,bindTargets}){
    const backs=state.players
      .filter(player=>String(player.position||'').toUpperCase()==='RB')
      .filter(player=>matches(player,state,intelApi))
      .sort((a,b)=>String(a.team||'ZZZ').localeCompare(String(b.team||'ZZZ'))||(Number(a.yahoo_rank)||9999)-(Number(b.yahoo_rank)||9999));

    const groups=new Map();
    backs.forEach(player=>{
      const team=String(player.team||'FA').toUpperCase();
      if(!groups.has(team))groups.set(team,[]);
      groups.get(team).push(player);
    });

    $('pageMeta').textContent=`${backs.length} running backs · ${groups.size} teams · RB1s, committees and backups`;
    $('content').innerHTML=`<div class="rb-board">${[...groups.entries()].map(([team,players])=>`
      <section class="rb-team-section">
        <div class="rb-team-header"><span class="team-badge team-badge-large">${esc(team)}</span><b>${esc(team)} RUNNING BACKS</b><span>${players.length} tracked</span></div>
        <div class="rb-team-grid">${players.map(player=>{
          const intel=player.intel_items||[];
          const latest=intelApi.latest(intel)||{};
          const tags=allTags(player);
          const context=player.planner_reason||latest.recommendation||latest.what_changed||'No material role change currently logged.';
          return `<article class="player-card rb-card ${player.user_target?'targeted':''}">
            <div class="card-top"><div class="rb-role-wrap"><span class="pos RB">RB</span><span class="rb-role">${esc(roleLabel(player))}</span></div><div class="rb-actions"><span class="rank">Yahoo #${esc(player.yahoo_rank??'—')}</span><button class="target-button ${player.user_target?'on':''}" data-key="${esc(player.player_key)}" data-target="${player.user_target?'false':'true'}">${player.user_target?'TARGETED':'TARGET'}</button></div></div>
            <div class="rb-name-line"><div class="player-name">${esc(player.yahoo_name||player.display_name)}</div><span class="team-badge">${esc(team)}</span></div>
            ${tags.length?`<div class="tags">${tags.map(tag=>`<span class="tag ${tagClass(tag)}">${esc(tag)}</span>`).join('')}</div>`:''}
            <div class="player-context"><b>CURRENT READ:</b> ${esc(context)}</div>
            ${intelApi.renderPlayerDetails(player,esc,tagClass)}
          </article>`;
        }).join('')}</div>
      </section>`).join('')||'<div class="empty">No running backs match.</div>'}</div>`;
    bindTargets();
  }

  window.FantasyRunningBacks=Object.freeze({render,allTags,roleLabel});
})();