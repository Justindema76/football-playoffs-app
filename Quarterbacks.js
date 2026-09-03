(() => {
  'use strict';

  // Dedicated QB strategy for the 12-team, 1-QB draft study guide.
  // This module intentionally controls QB timing separately from the general PLAYERS pool.
  // A quarterback being in the player pool does NOT mean he should be drafted in that round.

  const QB_PLAYERS = [
    {rank:31,name:'Josh Allen',group:'ELITE',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:50,name:'Lamar Jackson',group:'ELITE',source:'EXPERT',rankLabel:'ADP#'},
    {rank:62,name:'Drake Maye',group:'PREFERRED',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:64,name:'Joe Burrow',group:'PREFERRED',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:66,name:'Jalen Hurts',group:'PREFERRED',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:119,name:'Patrick Mahomes',group:'PREFERRED',source:'YOUR TARGET',rankLabel:'Y#'},

    {rank:75,name:'Justin Herbert',group:'VALUE',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:80,name:'Dak Prescott',group:'VALUE',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:97,name:'Brock Purdy',group:'VALUE',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:79,name:'Trevor Lawrence',group:'VALUE',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:118,name:'Jared Goff',group:'VALUE',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:124,name:'Jordan Love',group:'VALUE',source:'YOUR TARGET',rankLabel:'Y#'},

    // Secondary choices are not equal to the groups above. They only appear when the draft gets late.
    {rank:63,name:'Jayden Daniels',group:'SECONDARY',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:72,name:'Caleb Williams',group:'SECONDARY',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:101,name:'Bo Nix',group:'SECONDARY',source:'EXPERT',rankLabel:'E#'},
    {rank:112,name:'Matthew Stafford',group:'SECONDARY',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:137,name:'Baker Mayfield',group:'SECONDARY',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:164,name:'C.J. Stroud',group:'SECONDARY',source:'YOUR TARGET',rankLabel:'Y#'},
    {rank:114,name:'Kyler Murray',group:'SECONDARY',source:'INTEL',rankLabel:'Y#'},
    {rank:166,name:'Daniel Jones',group:'SECONDARY',source:'YOUR TARGET',rankLabel:'Y#'}
  ];

  const ROUND_QB = {
    1:{mode:'WAIT',names:[],note:'NO QB. Round 1 belongs to elite RB/WR. Do not spend a first-round pick on quarterback in this 1-QB build.'},
    2:{mode:'WAIT',names:[],note:'NO QB. Keep building RB/WR. Elite TE is the only early positional exception.'},
    3:{mode:'ALLEN ONLY',names:['Josh Allen'],note:'Josh Allen is the only quarterback to consider here. If Allen is gone, keep waiting.'},
    4:{mode:'ELITE QB WINDOW',names:['Josh Allen','Lamar Jackson'],note:'Allen is a smash if he somehow fell. Lamar becomes live at fair value. Otherwise keep building the core.'},
    5:{mode:'ELITE / PREFERRED FALL',names:['Lamar Jackson','Drake Maye','Joe Burrow'],note:'Only take one if the value is obvious. Round 5 is still an important RB/WR decision point.'},
    6:{mode:'PREFERRED QB',names:['Lamar Jackson','Drake Maye','Joe Burrow','Jalen Hurts'],note:'If your RB/WR core is healthy, this is a real quarterback window. Do not force QB over clearly better skill-position value.'},
    7:{mode:'PREFERRED / VALUE',names:['Drake Maye','Joe Burrow','Jalen Hurts','Justin Herbert','Dak Prescott','Trevor Lawrence'],note:'If you still need a starter, begin taking quarterback seriously here.'},
    8:{mode:'VALUE QB',names:['Justin Herbert','Dak Prescott','Trevor Lawrence','Brock Purdy','Jared Goff','Jordan Love'],note:'Strong value window. Take the quarterback you trust rather than chasing a name because of ADP.'},
    9:{mode:'VALUE QB',names:['Justin Herbert','Dak Prescott','Trevor Lawrence','Brock Purdy','Jared Goff','Jordan Love','Patrick Mahomes'],note:'Good late-QB territory. A falling preferred quarterback beats reaching for a lower tier.'},
    10:{mode:'LATE-QB SWEET SPOT',names:['Brock Purdy','Jared Goff','Jordan Love','Patrick Mahomes','Matthew Stafford','Bo Nix'],note:'If you waited, this is a strong place to finish the starter job.'},
    11:{mode:'LATE VALUE / STACK',names:['Brock Purdy','Jared Goff','Jordan Love','Patrick Mahomes','Matthew Stafford','Bo Nix','Baker Mayfield','C.J. Stroud'],note:'Take your starter if you still need one. Only consider QB2 later if your starter is risky or the stack is unusually valuable.'},
    12:{mode:'LATE VALUE / STACK',names:['Jared Goff','Jordan Love','Matthew Stafford','Bo Nix','Baker Mayfield','C.J. Stroud','Kyler Murray'],note:'Starter first. QB2 is optional, not mandatory, with only five bench spots.'},
    13:{mode:'ROSTER CHECK',names:['Matthew Stafford','Bo Nix','Baker Mayfield','C.J. Stroud','Kyler Murray','Daniel Jones'],note:'If you still do not have a quarterback, take the best remaining starter now. Otherwise keep chasing RB/WR upside.'},
    14:{mode:'EMERGENCY QB',names:['Matthew Stafford','Bo Nix','Baker Mayfield','C.J. Stroud','Kyler Murray','Daniel Jones'],note:'Only use this box if you somehow still need QB1. Otherwise ignore quarterback and follow the skill/DEF plan.'},
    15:{mode:'EMERGENCY QB',names:['Matthew Stafford','Bo Nix','Baker Mayfield','C.J. Stroud','Kyler Murray','Daniel Jones'],note:'Do not leave the draft without a starting quarterback. If QB is already filled, stay with DEF/K or final upside.'}
  };

  const GROUP_ORDER={ELITE:0,PREFERRED:1,VALUE:2,SECONDARY:3};

  function overallPick(slot,round){
    return round%2?((round-1)*12+slot):(round*12-slot+1);
  }

  function availabilityLabel(rank,overall){
    const d=rank-overall;
    if(d<-4)return 'IF STILL THERE';
    if(d<=3)return 'RIGHT IN RANGE';
    if(d<=10)return 'REALISTIC';
    if(d<=18)return 'REACH';
    return 'DEEP REACH';
  }

  function esc(v){
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function selectedSlot(){
    const active=document.querySelector('#slotTabs button.active');
    return Number(active?.dataset.slot)||1;
  }

  function candidatesFor(round,slot){
    const plan=ROUND_QB[round];
    if(!plan||plan.mode==='WAIT')return [];

    const overall=overallPick(slot,round);
    const allowed=new Set(plan.names);
    const minRank=Math.max(1,overall-(round<=6?15:round<=10?24:36));
    const maxRank=overall+(round<=6?22:36);

    let list=QB_PLAYERS.filter(p=>allowed.has(p.name)&&p.rank>=minRank&&p.rank<=maxRank);

    // Keep the approved QB list visible when a player has fallen. We do not rotate a QB out
    // simply because he was shown in the previous round; "if still there" is useful information.
    if(!list.length)list=QB_PLAYERS.filter(p=>allowed.has(p.name));

    list.sort((a,b)=>{
      const da=Math.abs(a.rank-overall),db=Math.abs(b.rank-overall);
      return da-db||(GROUP_ORDER[a.group]??9)-(GROUP_ORDER[b.group]??9)||a.rank-b.rank;
    });

    return list.slice(0,3).map(p=>({...p,status:availabilityLabel(p.rank,overall)}));
  }

  function renderQBBox(box,round,slot){
    const plan=ROUND_QB[round]||{mode:'WAIT',note:'Wait for quarterback value.'};
    box.classList.toggle('wait',plan.mode==='WAIT');

    if(plan.mode==='WAIT'){
      box.innerHTML=`<div class="position-title"><b>QB</b><span>WAIT</span></div><div class="wait-text">${esc(plan.note)}</div>`;
      return;
    }

    const options=candidatesFor(round,slot);
    const rows=options.length?options.map(p=>{
      const star=p.source==='YOUR TARGET'?'★ ':'';
      return `<div class="position-option"><div class="position-name">${star}${esc(p.name)}</div><div class="position-meta">${esc(p.rankLabel)}${p.rank} · ${esc(p.status)} · ${esc(p.group)} QB · ${esc(p.source)}</div></div>`;
    }).join(''):'<div class="wait-text">No approved quarterback fits this window. Do not force one.</div>';

    box.innerHTML=`<div class="position-title"><b>QB</b><span>${esc(plan.mode)} · ${options.length} CHOICES</span></div>${rows}<div class="wait-text">${esc(plan.note)}</div>`;
  }

  function renderQBRule(card,round){
    const plan=ROUND_QB[round];
    if(!plan)return;

    let rule=card.querySelector('.qb-rule-focus');
    if(!rule){
      rule=document.createElement('div');
      rule.className='focus qb-rule-focus';
      const firstFocus=card.querySelector('.focus');
      if(firstFocus)firstFocus.insertAdjacentElement('afterend',rule);
      else card.prepend(rule);
    }
    rule.textContent=`QB RULE: ${plan.note}`;
  }

  function renderAll(){
    const slot=selectedSlot();
    document.querySelectorAll('#rounds .round-card').forEach((card,index)=>{
      const round=index+1;
      const box=card.querySelector('.pos-qb');
      if(box)renderQBBox(box,round,slot);
      renderQBRule(card,round);
    });
  }

  function start(){
    renderAll();
    document.querySelectorAll('#slotTabs button').forEach(button=>{
      button.addEventListener('click',()=>setTimeout(renderAll,0));
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();
