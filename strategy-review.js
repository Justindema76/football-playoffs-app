(() => {
  'use strict';
  const raw = Array.isArray(window.STRATEGY_REVIEW_PLAYERS) ? window.STRATEGY_REVIEW_PLAYERS : [];
  const players = raw.map(([name,pos,team,code,market,target,expert])=>({name,pos,team,code,market,target:!!target,expert:Number(expert)||0}));
  const $ = id => document.getElementById(id);
  const STORE = 'strategy-approval-review-v1';
  const TEAM_COUNT = 12;
  const MAX_ROUNDS = 15;
  let slot = 1;
  let review = loadReview();
  function loadReview(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{return {}}}
  function saveReview(){localStorage.setItem(STORE,JSON.stringify(review))}
  function snakePick(s,r){return r%2?((r-1)*TEAM_COUNT+s):(r*TEAM_COUNT-s+1)}
  function nextPick(s,r){return r<MAX_ROUNDS?snakePick(s,r+1):181}
  function rowKey(r){return `${slot}-${r}`}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function eligible(p,r){if(r<=13&&['DEF','K'].includes(p.pos))return false;if(r===14&&p.pos==='K')return false;return true}
  function score(p,pick){return Math.abs(p.market-pick)-(p.target?2.5:0)-p.expert*.8}
  function uniqueTop(pool,limit,sorter){return [...pool].sort(sorter).slice(0,limit)}
  function classify(r){
    const pick=snakePick(slot,r), next=nextPick(slot,r), pool=players.filter(p=>eligible(p,r));
    const realistic=uniqueTop(pool.filter(p=>p.market>=pick-3&&p.market<=pick+5),6,(a,b)=>score(a,pick)-score(b,pick));
    const fallers=uniqueTop(pool.filter(p=>p.market>=Math.max(1,pick-12)&&p.market<pick-3),3,(a,b)=>(pick-a.market)-(pick-b.market)||(b.target-a.target)||(b.expert-a.expert));
    const ceiling=Math.min(next-1,pick+20), takeLimit=(next-pick<=5?2:next-pick<=10?3:4);
    const takeNow=uniqueTop(pool.filter(p=>p.market>pick+5&&p.market<=ceiling),takeLimit,(a,b)=>(b.target-a.target)||(b.expert-a.expert)||(a.market-b.market));
    if(r>=14)realistic.sort((a,b)=>((r===14&&a.pos==='DEF')||(r===15&&['DEF','K'].includes(a.pos))?0:1)-((r===14&&b.pos==='DEF')||(r===15&&['DEF','K'].includes(b.pos))?0:1)||Math.abs(a.market-pick)-Math.abs(b.market-pick));
    return {round:r,pick,nextPick:r<15?next:null,between:r<15?Math.max(0,next-pick-1):0,window:`${Math.max(1,pick-3)}–${Math.min(180,pick+5)}`,realistic,fallers,takeNow};
  }
  function playerItem(p){return `<div class="player-item">${p.target?'<b class="star">★</b> ':''}<b>${esc(p.name)}</b> — ${esc(p.team)}${p.code?` (${esc(p.code)})`:''} · ${p.pos} · #${p.market.toFixed(1)}</div>`}
  function items(list){return list.length?list.map(playerItem).join(''):'<div class="empty">None in this window.</div>'}
  function currentRows(){return Array.from({length:15},(_,i)=>classify(i+1))}
  function renderTabs(){$('slotTabs').innerHTML=Array.from({length:12},(_,i)=>i+1).map(n=>`<button type="button" class="slot-tab ${n===slot?'active':''}" data-slot="${n}">${n}</button>`).join('')}
  function renderSummary(){const sr=currentRows();$('slotTitle').textContent=`Draft Slot ${slot}`;$('slotSummary').textContent=`Every row below is tied to your exact overall pick and the exact next time the snake comes back to you.`;$('pickPath').innerHTML=sr.map(r=>`<div class="pick-chip"><span>ROUND ${r.round}</span><b>#${r.pick}</b></div>`).join('')}
  function renderStats(){const states=Array.from({length:15},(_,i)=>review[rowKey(i+1)]?.status||'');const a=states.filter(s=>s==='approve').length,w=states.filter(s=>s==='rework').length;$('reviewStats').innerHTML=`<span class="stat">15 rounds</span><span class="stat">${a} approved</span><span class="stat">${w} flagged for rework</span><span class="stat">${15-a-w} not reviewed</span>`}
  function card(row){const k=rowKey(row.round),rv=review[k]||{},next=row.nextPick?`NEXT PICK #${row.nextPick}`:'FINAL PICK',flagged=rv.status==='rework';return `<article class="round-card ${flagged?'flagged':''}"><div class="round-head"><div class="round-badge">ROUND ${row.round}</div><div><b>MAIN PLAYER NUMBER WINDOW ${row.window}</b><div class="wait-note">${row.nextPick?`${row.between} players disappear before you pick again.`:'Final selection.'}</div></div><div class="pick-info">YOUR PICK #${row.pick}<small>${next}</small></div></div><div class="round-body"><div class="choice-grid"><section class="choice-box"><h3><span class="pill realistic">REALISTIC</span></h3><div class="player-list">${items(row.realistic)}</div></section><section class="choice-box"><h3><span class="pill faller">IF THEY FALL</span></h3><div class="player-list">${items(row.fallers)}</div></section><section class="choice-box"><h3><span class="pill take">TAKE NOW</span></h3><div class="player-list">${items(row.takeNow)}</div></section></div><div class="review-row"><button type="button" class="review-btn approve ${rv.status==='approve'?'active':''}" data-review="approve" data-key="${k}">APPROVE</button><button type="button" class="review-btn rework ${rv.status==='rework'?'active':''}" data-review="rework" data-key="${k}">REWORK</button><input class="review-note" data-note="${k}" value="${esc(rv.note||'')}" placeholder="Your note: remove a name, move someone earlier/later, add someone…"></div></div></article>`}
  function renderRounds(){const issues=$('issuesOnly').checked;let sr=currentRows();if(issues)sr=sr.filter(r=>review[rowKey(r.round)]?.status==='rework');$('rounds').innerHTML=sr.length?sr.map(card).join(''):'<div class="empty">No rows flagged for rework in this draft slot.</div>'}
  function renderAll(){renderTabs();renderSummary();renderStats();renderRounds()}
  document.addEventListener('click',e=>{const s=e.target.closest('[data-slot]');if(s){slot=Number(s.dataset.slot);renderAll();return}const b=e.target.closest('[data-review]');if(b){const k=b.dataset.key;review[k]=review[k]||{};review[k].status=review[k].status===b.dataset.review?'':b.dataset.review;saveReview();renderStats();renderRounds();}})
  document.addEventListener('input',e=>{const n=e.target.closest('[data-note]');if(!n)return;review[n.dataset.note]=review[n.dataset.note]||{};review[n.dataset.note].note=n.value;saveReview()})
  $('issuesOnly').addEventListener('change',renderRounds);
  $('clearReviews').addEventListener('click',()=>{if(!confirm(`Clear approval/rework marks and notes for draft slot ${slot}?`))return;for(let r=1;r<=15;r++)delete review[rowKey(r)];saveReview();renderAll()});
  renderAll();
})();
