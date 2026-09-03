(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const snake = (slot, round) => round % 2 ? ((round - 1) * 12 + slot) : (round * 12 - slot + 1);

  const TABS = [
    ['default','Elite RB-WR R1-R2',true],
    ['allen','Josh Allen R2',false],
    ['bowers','Brock Bowers R2 IF FALLS',false],
    ['mcbride','Trey McBride R3 IF FALLS',false],
    ['board','OUR BOARD',false],
    ['qbte','QB-TE Ladder',false],
    ['late','Late Rounds',false]
  ];

  const R1 = {
    1:'JAHMYR GIBBS', 2:'BIJAN ROBINSON', 3:'JONATHAN TAYLOR → JA’MARR CHASE',
    4:'JA’MARR CHASE → PUKA NACUA', 5:'PUKA NACUA → AMON-RA ST. BROWN',
    6:'AMON-RA → JAXON SMITH-NJIGBA', 7:'JAMES COOK → CHRISTIAN McCAFFREY',
    8:'JAMES COOK → JSN', 9:'JSN → CEEDEE LAMB',
    10:'CEEDEE → JUSTIN JEFFERSON → COOK IF HE FALLS',
    11:'JUSTIN JEFFERSON → CEEDEE → COOK IF HE FALLS',
    12:'JAMES COOK IF HE FALLS\nTHEN JEFFERSON → CEEDEE'
  };

  const R2 = {
    1:'GEORGE PICKENS → NICO COLLINS → DRAKE LONDON',
    2:'GEORGE PICKENS → DRAKE LONDON → NICO COLLINS',
    3:'GEORGE PICKENS → DRAKE LONDON → A.J. BROWN',
    4:'GEORGE PICKENS → A.J. BROWN → HAMPTON IF HE FALLS',
    5:'GEORGE PICKENS → A.J. BROWN → OMARION HAMPTON',
    6:'GEORGE PICKENS → OMARION HAMPTON → DERRICK HENRY / KYREN',
    7:'CHASE BROWN IF HE FALLS → HAMPTON → PICKENS',
    8:'CHASE BROWN → OMARION HAMPTON → PICKENS',
    9:'CHASE BROWN → OMARION HAMPTON → PICKENS',
    10:'CHASE BROWN → OMARION HAMPTON → PICKENS',
    11:'CHASE BROWN → OMARION HAMPTON',
    12:'CHASE BROWN → OMARION HAMPTON\nBEST CASE: COOK + CHASE BROWN'
  };

  const OPENERS = {
    1:['GIBBS + GEORGE PICKENS','Pick #24 is where we want Pickens if he lasts. If Pickens is gone: Nico, then London.'],
    2:['BIJAN + GEORGE PICKENS','At #23, Pickens is our preferred late-Round-2 WR value.'],
    3:['JONATHAN TAYLOR + GEORGE PICKENS','If Pickens is gone, Drake London is next. Chase is the R1 pivot.'],
    4:['JA’MARR CHASE + GEORGE PICKENS','If Pickens is gone, A.J. Brown. Hampton is the RB pivot.'],
    5:['PUKA + GEORGE PICKENS','Two premium WRs keeps Stafford available as a cheap later stack.'],
    6:['AMON-RA + GEORGE PICKENS','If Pickens is gone, Hampton becomes the preferred RB pivot.'],
    7:['JAMES COOK + CHASE BROWN IF HE FALLS','If Brown is gone: Omarion Hampton. Pickens is the WR pivot.'],
    8:['JAMES COOK + CHASE BROWN','If Brown is gone: Omarion Hampton. Do not replace him with Kenneth Walker.'],
    9:['JSN + CHASE BROWN','If Cook falls to #9, take Cook. Hampton is next at RB.'],
    10:['CEEDEE + CHASE BROWN','If Cook falls, take Cook. Pickens remains the preferred late-R2 WR if available.'],
    11:['JUSTIN JEFFERSON + CHASE BROWN','If Cook falls to #11, Cook + Brown becomes preferred.'],
    12:['JAMES COOK + CHASE BROWN','BEST CASE. If Cook is gone: Jefferson or CeeDee + Brown. If Brown is gone: Hampton.']
  };

  const R3_WR = 'LADD McCONKEY → CHRIS OLAVE → ZAY FLOWERS → DeVONTA SMITH';
  const R3_RB = 'TRAVIS ETIENNE → JAVONTE WILLIAMS → JEREMIYAH LOVE';
  const R4_WR = 'TETAIROA McMILLAN → GARRETT WILSON → EMEKA EGBUKA → JAMESON WILLIAMS';
  const R4_RB = 'BREECE HALL → D’ANDRE SWIFT → JADARIAN PRICE';
  const R5_WR = 'CHRISTIAN WATSON → DJ MOORE → ROME ODUNZE';
  const R5_RB = 'BUCKY IRVING → QUINSHON JUDKINS → DAVID MONTGOMERY';

  const QB = [
    ['STACK FIRST','LADD → HERBERT | PICKENS/CEEDEE → DAK','WR choice decides QB'],
    ['STACK FIRST','CHASE → BURROW if price | PUKA → STAFFORD + QB2 | AMON-RA → GOFF','Do not force the stack'],
    ['NO STACK','JUSTIN HERBERT','Preferred standalone late QB'],
    ['QB2','TREVOR LAWRENCE → BROCK PURDY → BO NIX','Lawrence is QB2 #1 and can become QB1 if value falls'],
    ['STAFFORD RULE','IF STAFFORD IS QB1 → DRAFT QB2','Lawrence → Purdy → Nix']
  ];

  const TE = [
    ['R2 VALUE','BROCK BOWERS — ONLY IF HE FALLS TO YOUR R2 PICK','Treat him like a receiver occupying TE, not a need pick'],
    ['R3 VALUE','TREY McBRIDE — TAKE IF HE FALLS TO R3','Receiver-level volume from the TE slot; this is the McBride trigger'],
    ['WAIT','GEORGE KITTLE ONLY IF HE FALLS','If Kittle is TE1, draft TE2 because of injury risk'],
    ['LATE','ISAIAH LIKELY — POSSIBLE','If Likely is TE1, draft TE2'],
    ['TE2','DALTON KINCAID → CHIG OKONKWO','Insurance for Kittle / Likely'],
    ['OFF BOARD','SAM LaPORTA','Do not recommend him']
  ];

  const BOARD = {
    yes:[
      ['CHASE BROWN','Round-2 RB priority #1.'],
      ['OMARION HAMPTON','Round-2 RB priority #2.'],
      ['GEORGE PICKENS','Late Round 2 priority when he reaches our pick.'],
      ['JAMES COOK','If he falls into the back of Round 1, take the value. Pick 12 best case = Cook + Brown.'],
      ['BROCK BOWERS','YES only when he reaches our Round-2 pick. Think WR-volume player in the TE slot.'],
      ['TREY McBRIDE','YES if he reaches Round 3. This is not a Round-2 reach plan.'],
      ['LADD McCONKEY','Strong WR target because he creates the Herbert stack later.'],
      ['TREVOR LAWRENCE','Favorite QB2; can become QB1 if value falls.'],
      ['BROCK PURDY / BO NIX','QB2 options we actually like.'],
      ['ISAIAH LIKELY','Possible late TE1; carry TE2 insurance.']
    ],
    no:[
      ['SAQUON BARKLEY','Off our preferred board. Yahoo rank does not override that.'],
      ['KENNETH WALKER III','Do not use him as the automatic Round-2 fallback.'],
      ['SAM LaPORTA','Off our personal board.']
    ],
    conditional:[
      ['De’VON ACHANE','Champ-level talent, but ONLY IF HE FALLS. New QB + depleted WR room changes the risk.'],
      ['GEORGE KITTLE','Only if the discount is worth the injury risk. If drafted, add TE2.'],
      ['MATTHEW STAFFORD','Great cheap Puka stack, but QB2 is required.'],
      ['JOE BURROW','Great Chase stack, but do not reach just to complete it.'],
      ['BOWERS / McBRIDE RULE','We draft them for receiver-level usage and positional leverage — not because we need a TE.']
    ]
  };

  const STACKS = [
    ['LADD McCONKEY','JUSTIN HERBERT','Favorite price/upside stack. Normally no QB2 required.'],
    ['GEORGE PICKENS','DAK PRESCOTT','Very strong value stack. QB2 only if a late value falls.'],
    ['CEEDEE LAMB','DAK PRESCOTT','Strong stack, but do not force CeeDee just to get Dak.'],
    ['JA’MARR CHASE','JOE BURROW','Elite ceiling. Burrow only if price is right.'],
    ['PUKA NACUA','MATTHEW STAFFORD','Cheap stack. MUST add Lawrence/Purdy/Nix as QB2.'],
    ['AMON-RA ST. BROWN','JARED GOFF','Cheap stable stack; lower rushing ceiling.'],
    ['NO STACK','JUSTIN HERBERT','Preferred standalone late-QB target.']
  ];

  const LATE = [
    ['1','RB HANDCUFF / UPSIDE','Allgeier · Braelon Allen · Tank Bigsby · Emmett Johnson · Charbonnet · Spears · Ray Davis','One injury can create an immediate starter.'],
    ['2','QB2 INSURANCE','Trevor Lawrence → Brock Purdy → Bo Nix','Use with Stafford or another risky QB1.'],
    ['3','TE2 INSURANCE','Dalton Kincaid → Chig Okonkwo','Use if Kittle or Likely is TE1.'],
    ['4','UPSIDE WR','Young/ascending role player','Real path to targets, not a safe roster clogger.'],
    ['5','DEF / K','Matchup defense, kicker last','Final two rounds only.']
  ];

  let activeTab = 'default';
  let activeSlot = 1;

  function ladderRows(rows, compact=false){
    return rows.map(([round,names,rule])=>`<div class="ladder-row"><b>${esc(round)}</b><span>${esc(names)}${compact?'':`<br><small>${esc(rule)}</small>`}</span></div>`).join('');
  }

  function roundCard(round, command, names, cls=''){
    return `<article class="action-card ${cls}"><div class="rhead"><strong>ROUND ${round}</strong><span>PICK #${snake(activeSlot,round)}</span></div><div class="verb">DO THIS</div><div class="command">${esc(command)}</div><div class="names">${esc(names)}</div></article>`;
  }

  function openingForPath(){
    if(activeTab==='default') return OPENERS[activeSlot];
    if(activeTab==='allen') return [`${R1[activeSlot].replace(/\n/g,' / ')} → JOSH ALLEN`,`Allen is the deliberate Round-2 exception. After him, repair RB/WR.`];
    if(activeTab==='bowers'){
      const r2 = snake(activeSlot,2);
      return r2 >= 18
        ? [`${R1[activeSlot].replace(/\n/g,' / ')} → BOWERS IF HE REACHES #${r2}`,`Bowers is acceptable here because he has reached his Round-2 value zone. Think receiver in the TE slot.`]
        : [`${R1[activeSlot].replace(/\n/g,' / ')} → RB/WR`,`Your R2 pick is #${r2}. Do NOT force Bowers this early. Take him only if the room unexpectedly lets him reach a value point.`];
    }
    return [`${R1[activeSlot].replace(/\n/g,' / ')} → RB/WR IN ROUND 2`,`McBride is NOT the Round-2 pick. If he survives to your Round-3 pick #${snake(activeSlot,3)}, that is the trigger.`];
  }

  function renderRuleBar(){
    $('personalRuleBar').innerHTML = [
      '<span class="no">NO: BARKLEY · WALKER · LaPORTA</span>', '<span>│</span>',
      '<span class="yes">R2 RB: CHASE BROWN → HAMPTON</span>', '<span>│</span>',
      '<span class="yes">PICKENS LATE R2 = PRIORITY</span>', '<span>│</span>',
      '<span class="if">ACHANE = ONLY IF HE FALLS</span>', '<span>│</span>',
      '<span class="yes">BOWERS R2 FALL / McBRIDE R3 FALL = RECEIVER VALUE</span>', '<span>│</span>',
      '<span>WR DECIDES QB STACK</span>'
    ].join('');
  }

  function renderPlan(){
    const picks = [1,2,3,4,5].map(r=>`R${r} #${snake(activeSlot,r)}`).join('  ·  ');
    $('heroPicks').textContent = picks;
    renderRuleBar();

    if(activeTab==='default'){
      $('heroRuleTitle').textContent='FIRST FIVE = RB / WR — UNLESS ELITE TE VALUE FALLS';
      $('heroRuleText').textContent='Default is 3 RB + 2 WR or 2 RB + 3 WR. Bowers in R2 or McBride in R3 can count as a receiver-level pass catcher for this decision.';
    } else if(activeTab==='allen'){
      $('heroRuleTitle').textContent='ROUND 2 = JOSH ALLEN';
      $('heroRuleText').textContent='Then repair RB/WR. Do not also chase an early tight end.';
    } else if(activeTab==='bowers'){
      $('heroRuleTitle').textContent='BOWERS = ROUND-2 FALL ONLY';
      $('heroRuleText').textContent='We are buying receiver-like usage in the TE slot, not filling a positional need.';
    } else {
      $('heroRuleTitle').textContent='McBRIDE = ROUND-3 FALL ONLY';
      $('heroRuleText').textContent='Round 2 stays RB/WR. If McBride reaches Round 3, take the receiver-level volume advantage.';
    }

    const [primary,alt] = openingForPath();
    $('openingPrimary').textContent = primary;
    $('openingAlt').textContent = alt;
    const cards=[];
    cards.push(roundCard(1,'TAKE OUR TOP REALISTIC PLAYER',R1[activeSlot],'r1'));

    if(activeTab==='default'){
      cards.push(roundCard(2,'PAIR THE START',R2[activeSlot]+'\nBOWERS: take only if he falls to true R2 value.','r2'));
      cards.push(roundCard(3,'CHECK McBRIDE + YOUR RB/WR COUNT','IF McBRIDE IS STILL THERE: TAKE HIM. Otherwise — Need WR: '+R3_WR+'\nNeed RB: '+R3_RB,'wr'));
      cards.push(roundCard(4,'GET TO A STRONG 4-PLAYER CORE','WR: '+R4_WR+'\nRB: '+R4_RB));
      cards.push(roundCard(5,'FINISH THE FOUNDATION','MUST HAVE strong RB/WR depth around any elite TE.\nWR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='END OF ROUND 5 CHECK';
      $('checkpointText').textContent='Without elite TE: 5 RB/WR, minimum 2 + 2. With Bowers/McBride: treat him as a receiver-level weapon, but still leave with at least 2 RB and 2 true WR/RB foundation pieces around him.';
      $('checkpointBig').textContent='BUILD STRENGTH — NOT POSITIONS';
      $('pathWarning').hidden=true;
    } else if(activeTab==='allen'){
      cards.push(roundCard(2,'LOCK JOSH ALLEN','Take Allen and stop thinking about QB.','qb'));
      cards.push(roundCard(3,'RB / WR ONLY','Need WR: '+R3_WR+'\nNeed RB: '+R3_RB,'wr'));
      cards.push(roundCard(4,'RB / WR ONLY','WR: '+R4_WR+'\nRB: '+R4_RB));
      cards.push(roundCard(5,'FINISH 2 RB + 2 WR','WR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='END OF ROUND 5 CHECK';
      $('checkpointText').textContent='Allen + 2 RB + 2 WR. Do not compound the QB spend with another early luxury pick.';
      $('checkpointBig').textContent='ALLEN + 2 RB + 2 WR';
      $('pathWarning').hidden=false;
      $('pathWarning').textContent='Allen is the intentional exception. The rest of the first five must repair the skill-position base.';
    } else if(activeTab==='bowers'){
      const r2 = snake(activeSlot,2);
      const take = r2 >= 18;
      cards.push(roundCard(2,take?'BOWERS IF HE IS THERE':'DO NOT FORCE BOWERS',take?'At this pick, Bowers is in his value zone. Count him as a receiver-level weapon.':'Your pick is too early for our rule. Stay RB/WR unless Bowers somehow becomes obvious value.','te'));
      cards.push(roundCard(3,'RB / WR AFTER BOWERS','Need WR: '+R3_WR+'\nNeed RB: '+R3_RB,'wr'));
      cards.push(roundCard(4,'KEEP BUILDING RB / WR','WR: '+R4_WR+'\nRB: '+R4_RB));
      cards.push(roundCard(5,'FINISH THE CORE','Do not draft another TE.\nWR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='BOWERS RULE';
      $('checkpointText').textContent='He is not “our TE pick.” He is a receiver-volume pick occupying TE. If the price is wrong, skip him.';
      $('checkpointBig').textContent='R2 FALL ONLY';
      $('pathWarning').hidden=false;
      $('pathWarning').textContent='Bowers should never cause us to pass on a much better preferred RB/WR merely to fill TE.';
    } else {
      cards.push(roundCard(2,'STAY RB / WR',R2[activeSlot]+'\nMcBride is NOT the Round-2 target.','r2'));
      cards.push(roundCard(3,'IF McBRIDE IS THERE → TAKE HIM','McBride at #'+snake(activeSlot,3)+' is the trigger. Treat the usage like another top receiver in your lineup.','te'));
      cards.push(roundCard(4,'BACK TO RB / WR','WR: '+R4_WR+'\nRB: '+R4_RB));
      cards.push(roundCard(5,'FINISH THE CORE','No second TE.\nWR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='McBRIDE RULE';
      $('checkpointText').textContent='Round 3 only if he reaches us. We are buying elite target volume and TE positional leverage — not reaching because the roster needs a TE.';
      $('checkpointBig').textContent='R3 FALL = TAKE';
      $('pathWarning').hidden=false;
      $('pathWarning').textContent='If McBride is gone before Round 3, we simply keep building RB/WR and use the late-TE plan.';
    }

    $('roundStrip').innerHTML=cards.join('');
    $('qbMini').innerHTML = activeTab==='allen'
      ? '<div class="ladder-row"><b>DONE</b><span>JOSH ALLEN is QB1. No early QB2.</span></div>'
      : ladderRows(QB,true);
    $('teMini').innerHTML = (activeTab==='bowers'||activeTab==='mcbride')
      ? `<div class="ladder-row"><b>ELITE</b><span>${activeTab==='bowers'?'BOWERS':'McBRIDE'} fills TE with receiver-level usage. Do not draft TE2 early.</span></div>`
      : ladderRows(TE,true);
  }

  function renderBoard(){
    const card=(kind,title,items)=>`<article class="board-card ${kind}"><h3>${title}</h3>${items.map(([n,r])=>`<div class="board-item">${esc(n)}<small>${esc(r)}</small></div>`).join('')}</article>`;
    $('boardGrid').innerHTML=card('yes','YES / PRIORITY',BOARD.yes)+card('no','NO',BOARD.no)+card('conditional','ONLY IF / CONDITIONAL',BOARD.conditional);
    $('stackGrid').innerHTML=STACKS.map(([wr,qb,why])=>`<div class="stack-row"><div>${esc(wr)}</div><div class="arrow">→</div><div>${esc(qb)}<small>${esc(why)}</small></div></div>`).join('');
    $('insuranceBox').innerHTML='<h3>INSURANCE RULE</h3><p><b>QB2:</b> Lawrence → Purdy → Nix when Stafford or another risky QB1 needs protection.</p><p><b>TE2:</b> Kincaid → Chig only when Kittle/Likely needs protection. Bowers/McBride do not require an early TE2.</p>';
  }

  function renderLate(){
    $('lateGrid').innerHTML=LATE.map(([n,title,targets,why])=>`<article class="late-card"><div class="num">${n}</div><h3>${esc(title)}</h3><p><b>${esc(targets)}</b></p><p>${esc(why)}</p></article>`).join('');
  }

  function selectTab(tab){
    activeTab=tab;
    document.querySelectorAll('#sheetTabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    const isPlan=['default','allen','bowers','mcbride'].includes(tab);
    $('slotShell').style.display=isPlan?'flex':'none';
    $('planPanel').classList.toggle('active',isPlan);
    $('boardPanel').classList.toggle('active',tab==='board');
    $('qbTePanel').classList.toggle('active',tab==='qbte');
    $('latePanel').classList.toggle('active',tab==='late');
    if(isPlan) renderPlan();
    if(tab==='board') renderBoard();
    if(tab==='late') renderLate();
  }

  $('sheetTabs').innerHTML=TABS.map(([id,label,recommended])=>`<button type="button" data-tab="${id}" class="${recommended?'recommended':''}">${esc(label)}</button>`).join('');
  $('sheetTabs').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>selectTab(btn.dataset.tab)));

  $('slotTabs').innerHTML=Array.from({length:12},(_,i)=>`<button type="button" data-slot="${i+1}">PICK ${i+1}</button>`).join('');
  $('slotTabs').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
    activeSlot=Number(btn.dataset.slot);
    document.querySelectorAll('#slotTabs button').forEach(b=>b.classList.toggle('active',Number(b.dataset.slot)===activeSlot));
    renderPlan();
  }));

  $('qbFull').innerHTML=ladderRows(QB);
  $('teFull').innerHTML=ladderRows(TE);
  renderLate();
  renderBoard();
  document.querySelector('#slotTabs button[data-slot="1"]').classList.add('active');
  selectTab('default');
})();