(() => {
  'use strict';

  const intelSort=(a,b)=>new Date(b.updated_at||b.last_checked_at||0)-new Date(a.updated_at||a.last_checked_at||0);

  function sort(items){return (items||[]).slice().sort(intelSort)}

  async function safeLoad(api){
    try{
      const data=await api('intel_items?select=*&status=neq.RESOLVED&order=updated_at.desc.nullslast,last_checked_at.desc.nullslast');
      return {name:'intel',data:sort(data),error:null};
    }catch(error){
      return {name:'intel',data:[],error};
    }
  }

  function groupByName(rows,normName){
    const map=new Map();
    (rows||[]).forEach(row=>{
      const key=normName(row.player_name);
      if(!key)return;
      if(!map.has(key))map.set(key,[]);
      map.get(key).push(row);
    });
    for(const [key,items] of map)map.set(key,sort(items));
    return map;
  }

  function tagsFromItems(items){
    return [...new Set((items||[]).flatMap(item=>[
      ...(item.draft_tags||[]),
      item.action
    ]).filter(Boolean).map(tag=>String(tag).trim().toUpperCase()))];
  }

  function isInjuryPlayer(player){
    const items=player?.intel_items||[];
    return items.some(item=>
      item.injury_related===true ||
      (item.draft_tags||[]).some(tag=>String(tag).toUpperCase()==='INJURY')
    );
  }

  function matchesSearch(items,query){
    if(!query)return true;
    return (items||[]).some(item=>[
      item.player_name,item.team,item.position,item.action,item.priority,item.status,
      item.what_changed,item.recommendation,item.related_players,item.next_trigger,
      item.source_note,...(item.draft_tags||[])
    ].join(' ').toLowerCase().includes(query));
  }

  function latest(items){return sort(items)[0]||null}

  function latestContext(items){
    const item=latest(items);
    return item?.recommendation||item?.what_changed||'';
  }

  function sourceHtml(sourceNote,esc){
    const note=String(sourceNote||'').trim();
    if(!note)return '';
    const parts=[];
    const re=/https?:\/\/[^\s;]+/g;
    let last=0,match;
    while((match=re.exec(note))){
      if(match.index>last)parts.push(esc(note.slice(last,match.index)));
      const raw=match[0].replace(/[),.]+$/,'');
      const trailing=match[0].slice(raw.length);
      parts.push(`<a href="${esc(raw)}" target="_blank" rel="noopener noreferrer">${esc(raw)}</a>${esc(trailing)}`);
      last=match.index+match[0].length;
    }
    if(last<note.length)parts.push(esc(note.slice(last)));
    return `<div class="intel-source"><b>SOURCE:</b> ${parts.join('')}</div>`;
  }

  function checkedHtml(item,esc){
    const stamp=item?.last_checked_at||item?.updated_at;
    if(!stamp)return '';
    const d=new Date(stamp);
    return Number.isNaN(d.getTime())?'':`<small>Checked ${esc(d.toLocaleString())}</small>`;
  }

  function renderPlayerDetails(player,esc,tagClass,options={}){
    const items=sort(player?.intel_items||[]);
    if(!items.length)return '';
    const openSingle=options.openSingle!==false;
    const openAttr=openSingle&&items.length===1?' open':'';
    return `<details class="player-details"${openAttr}><summary>Current Intel (${items.length})</summary>${items.map(item=>`<div class="detail-item"><b>${esc(item.action||'MONITOR')} · ${esc(item.priority||'')}</b><div>${esc(item.what_changed||'')}</div>${item.recommendation?`<div><b>WHAT TO DO:</b> ${esc(item.recommendation)}</div>`:''}${item.draft_tags?.length?`<div class="tags">${item.draft_tags.map(tag=>`<span class="tag ${tagClass(tag)}">${esc(tag)}</span>`).join('')}</div>`:''}${sourceHtml(item.source_note,esc)}${checkedHtml(item,esc)}</div>`).join('')}</details>`;
  }

  function render({state,$,esc,normPos,tagClass,matches}){
    const players=state.players
      .filter(player=>(player.intel_items||[]).length&&matches(player))
      .sort((a,b)=>{
        const at=latest(a.intel_items)?.updated_at||latest(a.intel_items)?.last_checked_at||0;
        const bt=latest(b.intel_items)?.updated_at||latest(b.intel_items)?.last_checked_at||0;
        return new Date(bt)-new Date(at);
      });
    const itemCount=players.reduce((count,player)=>count+(player.intel_items||[]).length,0);
    $('pageMeta').textContent=`${players.length} players · ${itemCount} current Intel items · newest update first`;
    $('content').innerHTML=`<div class="list">${players.map(player=>{
      const items=sort(player.intel_items||[]);
      const newest=items[0]||{};
      return `<article class="intel-card ${player.user_target?'targeted':''}"><div class="card-top"><span class="pos ${normPos(player.position)}">${normPos(player.position)}</span><div style="display:flex;gap:7px;align-items:center"><span class="rank">Yahoo #${esc(player.yahoo_rank??'—')}</span><span class="tag ${tagClass(newest.action)}">${esc(newest.action||'INTEL')}</span></div></div><div class="player-name">${esc(player.yahoo_name||player.display_name)}</div><div class="player-team-line"><span class="team-badge">${esc(player.team||'FA')}</span><span class="player-meta">${esc(newest.priority||'')}${newest.last_checked_at?` · Checked ${esc(new Date(newest.last_checked_at).toLocaleString())}`:''}</span></div>${isInjuryPlayer(player)?'<div class="tags"><span class="tag injury">INJURY</span></div>':''}${items.map(item=>`<div class="detail-item"><p>${esc(item.what_changed||'')}</p>${item.recommendation?`<p><b>WHAT TO DO:</b> ${esc(item.recommendation)}</p>`:''}${item.draft_tags?.length?`<div class="tags">${item.draft_tags.map(tag=>`<span class="tag ${tagClass(tag)}">${esc(tag)}</span>`).join('')}</div>`:''}${sourceHtml(item.source_note,esc)}${checkedHtml(item,esc)}</div>`).join('')}</article>`;
    }).join('')||'<div class="empty">No current intel matches.</div>'}</div>`;
  }

  window.FantasyIntel=Object.freeze({
    safeLoad,
    sort,
    groupByName,
    tagsFromItems,
    isInjuryPlayer,
    matchesSearch,
    latest,
    latestContext,
    renderPlayerDetails,
    render
  });
})();