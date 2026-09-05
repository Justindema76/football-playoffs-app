(() => {
  'use strict';

  const normName=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  const normKey=normName;
  const uniq=a=>[...new Set((a||[]).filter(Boolean).map(x=>String(x).trim().toUpperCase()).filter(Boolean))];
  const sortYahoo=(a,b)=>(Number(a?.yahoo_rank)||9999)-(Number(b?.yahoo_rank)||9999)||String(a?.yahoo_name||a?.display_name||'').localeCompare(String(b?.yahoo_name||b?.display_name||''));
  const tierFor=player=>{const rank=Number(player?.yahoo_rank);return Number.isInteger(rank)&&rank>0?Math.ceil(rank/12):null};

  function groupRows(rows,keyFn){
    const map=new Map();
    (rows||[]).forEach(row=>{
      const key=keyFn(row);
      if(!key)return;
      if(!map.has(key))map.set(key,[]);
      map.get(key).push(row);
    });
    return map;
  }

  function allTags(player){
    return uniq([
      ...(player?.user_tags||[]),
      ...(player?.planner_tags||[]),
      ...((player?.intel_items||[]).flatMap(item=>[...(item.draft_tags||[]),item.action])),
      player?.user_target?'TARGET':null
    ]);
  }

  function build({catalog=[],targets=[],planner=[],intel=[],suggestions=[],intelApi}){
    const targetMap=new Map(targets.map(x=>[normKey(x.player_key),x]));
    const plannerByKey=new Map(planner.map(x=>[normKey(x.player_key),x]));
    const plannerByName=new Map(planner.map(x=>[normName(x.player_name),x]));
    const intelByName=intelApi.groupByName(intel,normName);
    const suggestionsByKey=groupRows(suggestions,x=>normKey(x.player_key));

    return catalog.map(raw=>{
      const key=normKey(raw.player_key);
      const name=normName(raw.yahoo_name||raw.display_name);
      const target=targetMap.get(key)||{};
      const plan=plannerByKey.get(key)||plannerByName.get(name)||{};
      const playerIntel=intelByName.get(name)||[];
      const playerSuggestions=(suggestionsByKey.get(key)||suggestionsByKey.get(name)||[]).slice();
      return Object.freeze({
        ...raw,
        player_key:raw.player_key||key,
        tier:tierFor(raw),
        user_target:!!target.user_target,
        user_tags:target.user_tags||[],
        user_note:target.user_note||null,
        planner_tags:plan.tags||[],
        planner_reason:plan.reason||'',
        planner_last_confirmed_date:plan.last_confirmed_date||null,
        planner_updated_at:plan.updated_at||null,
        intel_items:playerIntel,
        suggestions:playerSuggestions
      });
    }).sort(sortYahoo);
  }

  function isInjury(player,intelApi){return !!intelApi.isInjuryPlayer(player)}

  function matches(player,state,intelApi){
    const pos=String(state?.pos||'ALL').toUpperCase();
    const ppos=String(player?.position||'').toUpperCase();
    if(['QB','RB','WR','TE','DEF','K'].includes(pos)&&ppos!==pos)return false;
    if(pos==='STARRED'&&!player.user_target)return false;
    if(pos==='INTEL'&&!(player.intel_items||[]).length)return false;
    if(pos==='INJURY'&&!isInjury(player,intelApi))return false;
    const q=String(state?.q||'').trim().toLowerCase();
    if(!q)return true;
    const research=(player.suggestions||[]).some(s=>[s.suggestion_type,s.sentiment,s.note,s.source_context,s.source_name,s.suggested_round].join(' ').toLowerCase().includes(q));
    const core=[player.yahoo_name,player.display_name,player.team,player.position,player.planner_reason,player.yahoo_rank,player.tier,player.source,...allTags(player)].join(' ').toLowerCase().includes(q);
    return core||intelApi.matchesSearch(player.intel_items||[],q)||research;
  }

  function byPosition(players,position){return (players||[]).filter(player=>String(player.position||'').toUpperCase()===String(position||'').toUpperCase())}

  function teams(players){return [...new Set((players||[]).map(player=>String(player.team||'FA').toUpperCase()))].sort()}

  function groupByTeam(players){
    const groups=new Map();
    (players||[]).forEach(player=>{
      const team=String(player.team||'FA').toUpperCase();
      if(!groups.has(team))groups.set(team,[]);
      groups.get(team).push(player);
    });
    for(const group of groups.values())group.sort(sortYahoo);
    return groups;
  }

  function catalogGaps(players){
    const ranks=new Set((players||[]).map(p=>Number(p.yahoo_rank)).filter(n=>Number.isInteger(n)&&n>0));
    const maxRank=Math.max(0,...ranks),gaps=[];
    for(let rank=1;rank<=maxRank;rank++)if(!ranks.has(rank))gaps.push(rank);
    return gaps;
  }

  window.FantasyPlayers=Object.freeze({normName,normKey,uniq,sortYahoo,tierFor,allTags,build,isInjury,matches,byPosition,teams,groupByTeam,catalogGaps});
})();