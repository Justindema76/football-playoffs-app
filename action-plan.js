(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const snake = (slot, round) => round % 2 ? ((round - 1) * 12 + slot) : (round * 12 - slot + 1);

  const TABS = [
    ['default','Elite RB-WR R1-R2',true],
    ['allen','Josh Allen R3 IF FALLS',false],
    ['bowers','Brock Bowers R2 IF FALLS',false],
    ['mcbride','Trey McBride R3 IF FALLS',false],
    ['board','OUR BOARD',false],
    ['qbte','QB-TE Ladder',false],
    ['late','Late Rounds',false]
  ];

  // These are preference instructions, not Yahoo rankings. The starred draft board
  // is the allowed player pool. Conversation decisions decide ordering inside it.
  const R1 = {
    1:'JAHMYR GIBBS',
    2:'BIJAN ROBINSON',
    3:'JONATHAN TAYLOR → JA’MARR CHASE',
    4:'JA’MARR CHASE → PUKA NACUA',
    5:'PUKA NACUA → AMON-RA ST. BROWN',
    6:'AMON-RA → JAXON SMITH-NJIGBA',
    7:'JAXON SMITH-NJIGBA → JAMES COOK',
    8:'JAXON SMITH-NJIGBA → JAMES COOK',
    9:'JAXON SMITH-NJIGBA → JAMES COOK',
    10:'JSN IF THERE → JAMES COOK IF THERE → BEST TARGETED TIER-1 FALL',
    11:'JSN IF THERE → JAMES COOK IF THERE → BEST TARGETED TIER-1 FALL',
    12:'JSN IF THERE → JAMES COOK IF THERE → BEST TARGETED TIER-1 FALL'
  };

  const R2 = {
    1:'NICO COLLINS IF HE FALLS → GEORGE PICKENS → DRAKE LONDON',
    2:'NICO COLLINS IF HE FALLS → GEORGE PICKENS → DRAKE LONDON',
    3:'NICO COLLINS IF HE FALLS → GEORGE PICKENS → DRAKE LONDON',
    4:'NICO COLLINS IF HE FALLS → GEORGE PICKENS → OMARION HAMPTON',
    5:'NICO COLLINS IF HE FALLS → GEORGE PICKENS → OMARION HAMPTON',
    6:'NICO COLLINS IF HE FALLS → OMARION HAMPTON → GEORGE PICKENS',
    7:'CHASE BROWN IF THERE → OMARION HAMPTON → NICO IF HE FALLS → PICKENS',
    8:'CHASE BROWN → OMARION HAMPTON → NICO IF HE FALLS → PICKENS',
    9:'CHASE BROWN → OMARION HAMPTON → NICO IF HE FALLS → PICKENS',
    10:'CHASE BROWN → OMARION HAMPTON → NICO IF HE FALLS → PICKENS',
    11:'CHASE BROWN → OMARION HAMPTON → NICO IF HE FALLS → PICKENS',
    12:'CHASE BROWN → OMARION HAMPTON → NICO IF HE FALLS → PICKENS'
  };

  const OPENERS = {
    1:['GIBBS + NICO/PICKENS VALUE','At #24: Nico if he has fallen that far; otherwise Pickens. Drake London stays behind Nico on our board.'],
    2:['BIJAN + NICO/PICKENS VALUE','At #23: Nico fall first, then Pickens. Do not let Yahoo push London above Nico.'],
    3:['TAYLOR/CHASE + NICO/PICKENS','Nico is preferred to Drake London. Use London only after the players we actually prefer are gone.'],
    4:['CHASE + NICO/PICKENS/HAMPTON','Round 2 stays inside our targeted pool. Nico over London; Hampton is the RB pivot.'],
    5:['PUKA + NICO/PICKENS/HAMPTON','If Puka starts the build, Stafford remains a later stack option — not a reason to force QB.'],
    6:['AMON-RA + NICO/HAMPTON/PICKENS','Nico fall first; Hampton/Pickens are the preferred pivots.'],
    7:['JSN/COOK + CHASE BROWN','If Brown is gone: Hampton. Nico is a WR fall option; Pickens remains a value option.'],
    8:['JSN/COOK + CHASE BROWN','If Brown is gone: Hampton. Stay on our targeted board only.'],
    9:['JSN/COOK + CHASE BROWN','If Brown is gone: Hampton. Do not invent a replacement outside the board.'],
    10:['TARGETED TIER-1 FALL + CHASE BROWN','JSN/Cook are preferred falls. Round 2: Brown → Hampton → Nico/Pickens if they somehow reach us.'],
    11:['TARGETED TIER-1 FALL + CHASE BROWN','Jefferson/CeeDee are value-only, not automatic Round-1 priorities.'],
    12:['TARGETED TIER-1 FALL + CHASE BROWN','Best case remains a preferred Tier-1 survivor plus Brown/Hampton at the turn.']
  };

  const R3_WR = 'LADD McCONKEY → CHRIS OLAVE → ZAY FLOWERS → DeVONTA SMITH';
  const R3_RB = 'TRAVIS ETIENNE → JAVONTE WILLIAMS → JEREMIYAH LOVE';
  const R4_WR = 'TETAIROA McMILLAN → GARRETT WILSON → EMEKA EGBUKA → JAMESON WILLIAMS';
  const R4_RB = 'D’ANDRE SWIFT → CAM SKATTEBO';
  const R5_WR = 'DJ MOORE → ROME ODUNZE → JAMESON WILLIAMS';
  const R5_RB = 'BUCKY IRVING → QUINSHON JUDKINS → DAVID MONTGOMERY';

  const QB = [
    ['R3 FALL','JOSH ALLEN — IF HE REACHES ROUND 3, TAKE HIM','We expect him to go in Round 2; Round 3 is our value trigger.'],
    ['STACK FIRST','LADD → HERBERT | PICKENS → DAK | CHASE → BURROW','WR choice helps decide QB; do not force the stack.'],
    ['STACK FIRST','PUKA → STAFFORD + QB2 | AMON-RA → GOFF | NICO → C.J. STROUD','Use the stack only at the right price.'],
    ['NO STACK','JUSTIN HERBERT → TREVOR LAWRENCE','Preferred standalone/value path if no stack develops.'],
    ['QB2','TREVOR LAWRENCE → BROCK PURDY','Only when Stafford or another risky QB1 actually needs insurance.']
  ];

  const TE = [
    ['R2 FALL','BROCK BOWERS','Receiver-level volume in the TE slot; only if he reaches our actual R2 pick.'],
    ['R3 FALL','TREY McBRIDE','Receiver-level target volume; take if he survives to our R3 pick.'],
    ['R4 VALUE','COLSTON LOVELAND','Targeted on our board; receiving-upside TE, not a panic pick.'],
    ['R5-6','TYLER WARREN','Targeted volume option if the elite two are gone.'],
    ['LATER','DALTON KINCAID → DALLAS GOEDERT','Both are on our board; Kincaid is a player we specifically like.'],
    ['DISCOUNT','GEORGE KITTLE / TUCKER KRAFT','Kittle only at a real discount; monitor injury/availability risk.'],
    ['DEEP','KELCE · JAKE FERGUSON · SCHULTZ · CHIG · TERRANCE FERGUSON · HUNTER HENRY · BRENTON STRANGE','Only if the room lets TE fall or we need insurance.']
  ];

  const BOARD = {
    yes:[
      ['JAXON SMITH-NJIGBA','If JSN reaches us in Round 1, he is a preferred pick.'],
      ['JAMES COOK','Preferred late-Round-1 fall.'],
      ['CHASE BROWN','Round-2 RB priority #1.'],
      ['OMARION HAMPTON','Round-2 RB priority #2.'],
      ['NICO COLLINS','Preferred over Drake London when both are realistic Round-2 options. Current Intel strengthens the case.'],
      ['GEORGE PICKENS','Preferred late-Round-2 WR value; we prefer paying this price over forcing CeeDee.'],
      ['BROCK BOWERS','R2 fall only; think receiver in the TE slot.'],
      ['TREY McBRIDE','R3 fall only; receiver-level target volume.'],
      ['LADD McCONKEY','Strong target because he creates the Herbert stack later.'],
      ['DALTON KINCAID','Legitimate later TE target — not just emergency insurance.'],
      ['TREVOR LAWRENCE','Favorite later QB/QB2 value.'],
      ['BROCK PURDY','Targeted QB2/value option when insurance is actually needed.']
    ],
    no:[
      ['SAQUON BARKLEY','Off our preferred board.'],
      ['KENNETH WALKER III','Off our preferred board.'],
      ['SAM LaPORTA','Off our personal board.'],
      ['MIKE EVANS','Off our board because the injury profile is not worth the mid-round cost.']
    ],
    conditional:[
      ['JUSTIN JEFFERSON','Value-only. We are not prioritizing him in Round 1; a major fall changes the price.'],
      ['CEEDEE LAMB','Value-only. We prefer Pickens at the cheaper cost for this build.'],
      ['De’VON ACHANE','Elite talent, but ONLY IF HE FALLS.'],
      ['GEORGE KITTLE','Only if the discount is worth the injury risk.'],
      ['MATTHEW STAFFORD','Puka stack only at the right price; if QB1, add targeted QB2 insurance.'],
      ['JOE BURROW','Great Chase stack, but do not reach just to complete it.']
    ]
  };

  const STACKS = [
    ['LADD McCONKEY','JUSTIN HERBERT','Favorite price/upside stack. Normally no QB2 required.'],
    ['GEORGE PICKENS','DAK PRESCOTT','Strong value stack. Do not force Dak if another QB falls better.'],
    ['JA’MARR CHASE','JOE BURROW','Elite ceiling; Burrow only if price is right.'],
    ['PUKA NACUA','MATTHEW STAFFORD','Cheap stack. If Stafford is QB1, add Lawrence/Purdy insurance.'],
    ['AMON-RA ST. BROWN','JARED GOFF','Cheap stable stack; lower rushing ceiling.'],
    ['NICO COLLINS','C.J. STROUD','Current Houston target concentration makes this a viable late-value stack.'],
    ['NO STACK','JUSTIN HERBERT / TREVOR LAWRENCE','Preferred standalone/value path.']
  ];

  const LATE = [
    ['1','TARGETED RB UPSIDE','Blake Corum · Jonathon Brooks · Rhamondre Stevenson · Rachaad White · Jordan Mason','Use only players already on our starred board.'],
    ['2','TARGETED QB VALUE','Herbert · Lawrence · Dak · Purdy · Stafford/Goff/Stroud only when the stack fits','Josh Allen is the R3 fall trigger; later QB is stack/value driven.'],
    ['3','TARGETED TE VALUE','Kincaid · Goedert · Kittle if discounted · Jake Ferguson · Chig · Brenton Strange','No unstarred TE gets inserted into the plan.'],
    ['4','TARGETED WR UPSIDE','Godwin · Diggs · Addison · Sutton · Jakobi Meyers · Shaheed · Shakir','Only names already selected on the draft board.'],
    ['5','DEF / K','Rams D/ST is targeted; kicker stays late','Do not sacrifice an approved upside player just to fill a replaceable slot.']
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
    if(activeTab==='allen') return [`${R1[activeSlot].replace(/\n/g,' / ')} → RB/WR IN R2 → ALLEN IF HE FALLS`,`Josh Allen is NOT our Round-2 plan. If he reaches your Round-3 pick #${snake(activeSlot,3)}, take him.`];
    if(activeTab==='bowers'){
      const r2 = snake(activeSlot,2);
      return r2 >= 18
        ? [`${R1[activeSlot].replace(/\n/g,' / ')} → BOWERS IF HE REACHES #${r2}`,`Bowers has reached the receiver-value zone at TE. If he is gone, stay inside our targeted RB/WR pool.`]
        : [`${R1[activeSlot].replace(/\n/g,' / ')} → TARGETED RB/WR`,`Your R2 pick is #${r2}. Do not force Bowers before our value trigger.`];
    }
    return [`${R1[activeSlot].replace(/\n/g,' / ')} → TARGETED RB/WR IN R2`,`If McBride survives to Round 3 pick #${snake(activeSlot,3)}, that is the trigger.`];
  }

  function renderRuleBar(){
    $('personalRuleBar').innerHTML = [
      '<span class="yes">STARRED BOARD = ALLOWED POOL</span>', '<span>│</span>',
      '<span class="yes">JSN / COOK = PREFERRED R1 FALLS</span>', '<span>│</span>',
      '<span class="yes">R2 RB: CHASE BROWN → HAMPTON</span>', '<span>│</span>',
      '<span class="yes">NICO > DRAKE LONDON</span>', '<span>│</span>',
      '<span class="yes">PICKENS = VALUE PRIORITY</span>', '<span>│</span>',
      '<span class="yes">ALLEN R3 FALL = TAKE</span>', '<span>│</span>',
      '<span>WR DECIDES QB STACK</span>'
    ].join('');
  }

  function renderPlan(){
    const picks = [1,2,3,4,5].map(r=>`R${r} #${snake(activeSlot,r)}`).join('  ·  ');
    $('heroPicks').textContent = picks;
    renderRuleBar();

    if(activeTab==='default'){
      $('heroRuleTitle').textContent='TARGETED BOARD FIRST — THEN OUR PREFERENCE ORDER';
      $('heroRuleText').textContent='Rounds 1-2 follow the tier and price. Round 3 checks Josh Allen first, then McBride, then returns to targeted RB/WR.';
    } else if(activeTab==='allen'){
      $('heroRuleTitle').textContent='JOSH ALLEN = ROUND-3 FALL';
      $('heroRuleText').textContent='We expect Round 2. We do not chase him there. If he reaches our Round-3 pick, take him.';
    } else if(activeTab==='bowers'){
      $('heroRuleTitle').textContent='BOWERS = ROUND-2 FALL ONLY';
      $('heroRuleText').textContent='Receiver-like usage from TE. If the price is wrong, stay on our targeted RB/WR board.';
    } else {
      $('heroRuleTitle').textContent='McBRIDE = ROUND-3 FALL ONLY';
      $('heroRuleText').textContent='Round 2 stays targeted RB/WR. If McBride reaches Round 3, take the receiver-level volume advantage.';
    }

    const [primary,alt] = openingForPath();
    $('openingPrimary').textContent = primary;
    $('openingAlt').textContent = alt;
    const cards=[];
    cards.push(roundCard(1,'TAKE OUR PREFERRED TARGETED TIER-1 PLAYER',R1[activeSlot],'r1'));

    if(activeTab==='default'){
      cards.push(roundCard(2,'TAKE OUR PREFERRED TARGETED TIER-2 VALUE',R2[activeSlot]+'\nBOWERS only if he reaches true R2 value.','r2'));
      cards.push(roundCard(3,'ALLEN FELL? TAKE. ELSE McBRIDE FELL? TAKE. ELSE RB/WR','QB: JOSH ALLEN if still there.\nTE: TREY McBRIDE if still there.\nOtherwise WR: '+R3_WR+'\nRB: '+R3_RB,'wr'));
      cards.push(roundCard(4,'KEEP BUILDING THE TARGETED CORE','WR: '+R4_WR+'\nRB: '+R4_RB));
      cards.push(roundCard(5,'FINISH THE FOUNDATION','WR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='END OF ROUND 5 CHECK';
      $('checkpointText').textContent='The first five should reflect who actually fell. If Allen/Bowers/McBride was taken at value, repair RB/WR around him. Otherwise keep hammering our targeted skill players.';
      $('checkpointBig').textContent='NO UNSTARRED NAMES';
      $('pathWarning').hidden=true;
    } else if(activeTab==='allen'){
      cards.push(roundCard(2,'STAY TARGETED RB / WR',R2[activeSlot],'r2'));
      cards.push(roundCard(3,'IF JOSH ALLEN IS THERE → TAKE HIM','Round-3 pick #'+snake(activeSlot,3)+' is the trigger. If he is gone, do not chase another QB here.','qb'));
      cards.push(roundCard(4,'BACK TO TARGETED RB / WR','WR: '+R4_WR+'\nRB: '+R4_RB));
      cards.push(roundCard(5,'FINISH THE CORE','WR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='ALLEN RULE';
      $('checkpointText').textContent='Allen is a value exception only if he reaches Round 3. If he is gone, later QB becomes stack/value driven.';
      $('checkpointBig').textContent='R3 FALL = TAKE';
      $('pathWarning').hidden=false;
      $('pathWarning').textContent='Do not spend Round 2 on Allen just because another manager might. Our plan is to take him only if the room gives us the discount.';
    } else if(activeTab==='bowers'){
      const r2 = snake(activeSlot,2);
      const take = r2 >= 18;
      cards.push(roundCard(2,take?'BOWERS IF HE IS THERE':'DO NOT FORCE BOWERS',take?'He has reached our Round-2 value zone. Count him as a receiver-level weapon.':'Stay with the targeted RB/WR board.','te'));
      cards.push(roundCard(3,'CHECK ALLEN; OTHERWISE RB / WR','If Josh Allen fell to R3, take him. Otherwise WR: '+R3_WR+'\nRB: '+R3_RB,'wr'));
      cards.push(roundCard(4,'KEEP BUILDING RB / WR','WR: '+R4_WR+'\nRB: '+R4_RB));
      cards.push(roundCard(5,'FINISH THE CORE','No second TE.\nWR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='BOWERS RULE';
      $('checkpointText').textContent='He is a receiver-volume pick occupying TE. If the room takes him before our price, let them.';
      $('checkpointBig').textContent='R2 FALL ONLY';
      $('pathWarning').hidden=false;
      $('pathWarning').textContent='Bowers never causes us to add an unstarred replacement or force another TE.';
    } else {
      cards.push(roundCard(2,'STAY TARGETED RB / WR',R2[activeSlot]+'\nMcBride is NOT the Round-2 target.','r2'));
      cards.push(roundCard(3,'ALLEN FIRST; THEN McBRIDE','If Josh Allen is still there, take Allen. If Allen is gone and McBride is there, take McBride. Otherwise return to targeted RB/WR.','te'));
      cards.push(roundCard(4,'BACK TO TARGETED RB / WR','WR: '+R4_WR+'\nRB: '+R4_RB));
      cards.push(roundCard(5,'FINISH THE CORE','No second TE.\nWR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='McBRIDE RULE';
      $('checkpointText').textContent='McBride is the Round-3 TE fall. Allen has first priority if both somehow survive to our Round-3 pick.';
      $('checkpointBig').textContent='ALLEN → McBRIDE';
      $('pathWarning').hidden=false;
      $('pathWarning').textContent='If both are gone, keep building from the players you actually starred.';
    }

    $('roundStrip').innerHTML=cards.join('');
    $('qbMini').innerHTML = activeTab==='allen'
      ? '<div class="ladder-row"><b>R3</b><span>JOSH ALLEN if he falls. Otherwise use the later stack/value ladder.</span></div>'
      : ladderRows(QB,true);
    $('teMini').innerHTML = (activeTab==='bowers'||activeTab==='mcbride')
      ? `<div class="ladder-row"><b>ELITE</b><span>${activeTab==='bowers'?'BOWERS':'McBRIDE'} only at the value trigger. Later TE options remain on the targeted board.</span></div>`
      : ladderRows(TE,true);
  }

  function renderBoard(){
    const card=(kind,title,items)=>`<article class="board-card ${kind}"><h3>${title}</h3>${items.map(([n,r])=>`<div class="board-item">${esc(n)}<small>${esc(r)}</small></div>`).join('')}</article>`;
    $('boardGrid').innerHTML=card('yes','YES / PREFERRED',BOARD.yes)+card('no','NO',BOARD.no)+card('conditional','VALUE ONLY / CONDITIONAL',BOARD.conditional);
    $('stackGrid').innerHTML=STACKS.map(([wr,qb,why])=>`<div class="stack-row"><div>${esc(wr)}</div><div class="arrow">→</div><div>${esc(qb)}<small>${esc(why)}</small></div></div>`).join('');
    $('insuranceBox').innerHTML='<h3>HOW TO READ THIS BOARD</h3><p><b>STARRED/TARGETED:</b> allowed player pool. If you did not select him, he does not enter the Action Plan.</p><p><b>PREFERENCE:</b> our conversations + current Intel decide which targeted player comes first. Yahoo rank is price/context, not the boss.</p><p><b>QB2:</b> Lawrence → Purdy only when Stafford/risky QB1 needs protection. Otherwise use the bench on RB/WR upside.</p>';
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