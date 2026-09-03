(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const snake = (slot, round) => round % 2 ? ((round - 1) * 12 + slot) : (round * 12 - slot + 1);

  const TABS = [
    ['default','Elite RB-WR R1-R2',true],
    ['allen','Josh Allen R2',false],
    ['bowers','Brock Bowers R2',false],
    ['mcbride','Trey McBride R2',false],
    ['board','OUR BOARD',false],
    ['qbte','QB-TE Ladder',false],
    ['late','Late Rounds',false]
  ];

  // OUR BOARD OVERRIDES YAHOO. These are conversation decisions, not generic rankings.
  const NO_PLAYERS = ['SAQUON BARKLEY','KENNETH WALKER III','SAM LaPORTA'];

  const R1 = {
    1:'JAHMYR GIBBS',
    2:'BIJAN ROBINSON',
    3:'JONATHAN TAYLOR → JA’MARR CHASE',
    4:'JA’MARR CHASE → PUKA NACUA',
    5:'PUKA NACUA → AMON-RA ST. BROWN',
    6:'AMON-RA → JAXON SMITH-NJIGBA',
    7:'JAMES COOK → CHRISTIAN McCAFFREY',
    8:'JAMES COOK → JSN',
    9:'JSN → CEEDEE LAMB',
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
    1:['GIBBS + GEORGE PICKENS','Pick #24 is exactly the kind of place we want Pickens if he lasts. If Pickens is gone: Nico, then London.'],
    2:['BIJAN + GEORGE PICKENS','At #23, Pickens is our preferred late-Round-2 WR value.'],
    3:['JONATHAN TAYLOR + GEORGE PICKENS','If Pickens is gone, Drake London is next. Chase is the R1 pivot if you want WR first.'],
    4:['JA’MARR CHASE + GEORGE PICKENS','If Pickens is gone, A.J. Brown. If Hampton falls, he becomes the RB pivot.'],
    5:['PUKA + GEORGE PICKENS','This gives us two premium WRs and keeps Stafford available as a cheap later stack if we want him.'],
    6:['AMON-RA + GEORGE PICKENS','If Pickens is gone, Hampton becomes the preferred RB pivot.'],
    7:['JAMES COOK + CHASE BROWN IF HE FALLS','If Brown is gone: Omarion Hampton. Pickens is the WR pivot.'],
    8:['JAMES COOK + CHASE BROWN','If Brown is gone: Omarion Hampton. Do not replace him with Kenneth Walker.'],
    9:['JSN + CHASE BROWN','If Cook falls to #9, take Cook. Hampton is the next Round-2 RB.'],
    10:['CEEDEE + CHASE BROWN','If you would rather avoid paying the Round-1 WR price, take the best preferred R1 player and target Pickens only if he reaches your Round-2 pick.'],
    11:['JUSTIN JEFFERSON + CHASE BROWN','If Cook falls to #11, Cook + Brown becomes the preferred RB-RB start.'],
    12:['JAMES COOK + CHASE BROWN','BEST CASE. If Cook is gone: Jefferson or CeeDee + Chase Brown. If Brown is gone: Omarion Hampton.']
  };

  // Narrowed lists: these are the guys we want to see fast, not every plausible player.
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
    ['QB2','TREVOR LAWRENCE → BROCK PURDY → BO NIX','Lawrence is QB2 priority #1 and can become QB1 if value falls'],
    ['STAFFORD RULE','IF STAFFORD IS QB1 → DRAFT QB2','Lawrence → Purdy → Nix']
  ];

  const TE = [
    ['ELITE VALUE','BROCK BOWERS','No planned TE2 needed'],
    ['WAIT','GEORGE KITTLE ONLY IF HE FALLS','If we take Kittle, draft TE2 because of injury risk'],
    ['LATE','ISAIAH LIKELY — POSSIBLE','If Likely is TE1, draft TE2'],
    ['TE2','DALTON KINCAID → CHIG OKONKWO','Insurance for Kittle / Likely'],
    ['OFF BOARD','SAM LaPORTA','Do not recommend him']
  ];

  const BOARD = {
    yes:[
      ['CHASE BROWN','Round-2 RB priority #1.'],
      ['OMARION HAMPTON','Round-2 RB priority #2.'],
      ['GEORGE PICKENS','If he reaches late Round 2, prioritize him. We like the price better than forcing CeeDee in Round 1 in some builds.'],
      ['JAMES COOK','If he falls into the back of Round 1, take the value. Pick 12 best case = Cook + Brown.'],
      ['LADD McCONKEY','Strong WR target because he creates the Herbert stack later.'],
      ['TREVOR LAWRENCE','Favorite QB2. Strong enough to become QB1 if the room lets him fall.'],
      ['BROCK PURDY / BO NIX','QB2 options we actually like.'],
      ['ISAIAH LIKELY','Possible late TE1. We are comfortable carrying TE2 insurance.']
    ],
    no:[
      ['SAQUON BARKLEY','Off our preferred board. Yahoo rank does not change that.'],
      ['KENNETH WALKER III','Do not use him as the automatic Round-2 fallback.'],
      ['SAM LaPORTA','Off our personal board after last year.']
    ],
    conditional:[
      ['De’VON ACHANE','Champ-level talent, but ONLY IF HE FALLS. New QB + depleted WR room changes the risk.'],
      ['GEORGE KITTLE','Only if the discount is worth the injury risk. If drafted, add TE2.'],
      ['MATTHEW STAFFORD','Great cheap Puka stack, but QB2 is required.'],
      ['JOE BURROW','Great Chase stack, but do not reach just to complete it.'],
      ['TREY McBRIDE R2','Only if you consciously choose the aggressive TE path. It is not the default.'],
      ['BROCK BOWERS R2','The premium TE exception we are most comfortable with when the value fits.']
    ]
  };

  const STACKS = [
    ['LADD McCONKEY','JUSTIN HERBERT','Favorite price/upside stack. Normally no QB2 required.'],
    ['GEORGE PICKENS','DAK PRESCOTT','Very strong value stack. QB2 only if a late value falls.'],
    ['CEEDEE LAMB','DAK PRESCOTT','Strong stack, but we do not need to force CeeDee just to get Dak.'],
    ['JA’MARR CHASE','JOE BURROW','Elite ceiling. Take Burrow only if the price is right.'],
    ['PUKA NACUA','MATTHEW STAFFORD','Cheap stack. MUST add Lawrence/Purdy/Nix as QB2.'],
    ['AMON-RA ST. BROWN','JARED GOFF','Cheap stable stack; lower rushing ceiling.'],
    ['NO STACK','JUSTIN HERBERT','Preferred standalone late-QB target.']
  ];

  const LATE = [
    ['1','RB HANDCUFF / UPSIDE','Allgeier · Braelon Allen · Tank Bigsby · Emmett Johnson · Charbonnet · Spears · Ray Davis','One injury can create an immediate starter.'],
    ['2','QB2 INSURANCE','Trevor Lawrence → Brock Purdy → Bo Nix','Use it with Stafford or another risky QB1. Lawrence is our first choice.'],
    ['3','TE2 INSURANCE','Dalton Kincaid → Chig Okonkwo','Use it if Kittle or Likely is TE1.'],
    ['4','UPSIDE WR','Young/ascending role player','Take a player with a real path to targets, not a safe roster clogger.'],
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
    const base = OPENERS[activeSlot];
    if(activeTab==='default') return base;
    if(activeTab==='allen') return [`${R1[activeSlot].replace(/\n/g,' / ')} → JOSH ALLEN`,`You are choosing Allen in Round 2. Rounds 3–5 are RB/WR only. Allen does not need an early QB2.`];
    if(activeTab==='bowers') return [`${R1[activeSlot].replace(/\n/g,' / ')} → BROCK BOWERS`,`Bowers is the premium-TE path. Rounds 3–5 are RB/WR only. No planned TE2 needed.`];
    return [`${R1[activeSlot].replace(/\n/g,' / ')} → TREY McBRIDE`,`McBride in Round 2 is the aggressive path. Rounds 3–5 are strictly RB/WR recovery.`];
  }

  function renderRuleBar(){
    $('personalRuleBar').innerHTML = [
      '<span class="no">NO: BARKLEY · WALKER · LaPORTA</span>',
      '<span>│</span>',
      '<span class="yes">R2 RB: CHASE BROWN → HAMPTON</span>',
      '<span>│</span>',
      '<span class="yes">PICKENS LATE R2 = PRIORITY</span>',
      '<span>│</span>',
      '<span class="if">ACHANE = ONLY IF HE FALLS</span>',
      '<span>│</span>',
      '<span>WR DECIDES QB STACK</span>'
    ].join('');
  }

  function renderPlan(){
    const picks = [1,2,3,4,5].map(r=>`R${r} #${snake(activeSlot,r)}`).join('  ·  ');
    $('heroPicks').textContent = picks;
    renderRuleBar();

    if(activeTab==='default'){
      $('heroRuleTitle').textContent='FIRST FIVE = RB / WR';
      $('heroRuleText').textContent='Finish with 3 RB + 2 WR or 2 RB + 3 WR. Minimum two at each position. Our board overrides Yahoo.';
    } else {
      const star = activeTab==='allen'?'JOSH ALLEN':activeTab==='bowers'?'BROCK BOWERS':'TREY McBRIDE';
      $('heroRuleTitle').textContent=`ROUND 2 = ${star}`;
      $('heroRuleText').textContent=`Then Rounds 3–5 are RB/WR ONLY. Finish Round 5 with ${star} + 2 RB + 2 WR.`;
    }

    const [primary,alt] = openingForPath();
    $('openingPrimary').textContent = primary;
    $('openingAlt').textContent = alt;

    const cards=[];
    cards.push(roundCard(1,'TAKE OUR TOP REALISTIC PLAYER',R1[activeSlot],'r1'));

    if(activeTab==='default'){
      cards.push(roundCard(2,'PAIR THE START',R2[activeSlot],'r2'));

      if(activeSlot===12){
        cards.push(roundCard(3,'IF COOK + BROWN → WR','LADD first if there because it opens HERBERT later.\n'+R3_WR,'wr'));
        cards.push(roundCard(4,'WR AGAIN UNLESS A BIG RB FALLS',R4_WR+'\nRB fall: '+R4_RB,'wr'));
      } else if(activeSlot>=7){
        cards.push(roundCard(3,'IF RB-RB → WR. OTHERWISE FIX THE COUNT','WR: '+R3_WR+'\nRB: '+R3_RB,'wr'));
        cards.push(roundCard(4,'GET TO 2 RB + 2 WR','WR: '+R4_WR+'\nRB: '+R4_RB,''));
      } else {
        cards.push(roundCard(3,'BALANCE THE FIRST TWO','Need WR: '+R3_WR+'\nNeed RB: '+R3_RB,'wr'));
        cards.push(roundCard(4,'GET TO 2 RB + 2 WR','WR: '+R4_WR+'\nRB: '+R4_RB,''));
      }

      cards.push(roundCard(5,'FINISH THE FOUNDATION','MUST HAVE 2 RB + 2 WR.\nWR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='END OF ROUND 5 CHECK';
      $('checkpointText').textContent='Five RB/WR players. Clean builds: 3 RB + 2 WR or 2 RB + 3 WR. Then the WRs you drafted tell us which QB stack to attack.';
      $('checkpointBig').textContent='MINIMUM 2 RB + 2 WR';
      $('pathWarning').hidden=true;
    } else {
      const star = activeTab==='allen'?'JOSH ALLEN':activeTab==='bowers'?'BROCK BOWERS':'TREY McBRIDE';
      const cls = activeTab==='allen'?'qb':'te';
      cards.push(roundCard(2,`LOCK ${star}`,activeTab==='allen'?'Take Allen here. No early QB2.':`Take ${star} here. Do not chase another TE early.`,cls));
      cards.push(roundCard(3,'MATCH ROUND 1','R1 RB? TAKE WR: '+R3_WR+'\nR1 WR? TAKE RB: '+R3_RB,'wr'));
      cards.push(roundCard(4,'RB / WR ONLY','WR: '+R4_WR+'\nRB: '+R4_RB,''));
      cards.push(roundCard(5,'MUST FINISH 2 + 2','WR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='END OF ROUND 5 CHECK';
      $('checkpointText').textContent=`Roster must contain ${star}, two running backs and two wide receivers.`;
      $('checkpointBig').textContent=`${star} + 2 RB + 2 WR`;
      $('pathWarning').hidden=false;
      $('pathWarning').textContent = activeTab==='allen'
        ? 'Allen is the deliberate early-QB exception. Do not also pay an early TE premium.'
        : activeTab==='bowers'
          ? 'Bowers is the premium-TE exception we are most comfortable with when his price fits.'
          : 'McBride Round 2 is aggressive. If you choose it, the RB/WR recovery rule is strict.';
    }

    $('roundStrip').innerHTML=cards.join('');
    $('qbMini').innerHTML = activeTab==='allen'
      ? '<div class="ladder-row"><b>QB1</b><span>JOSH ALLEN. Normally no QB2 needed.</span></div>'
      : ladderRows(QB,true);
    $('teMini').innerHTML = (activeTab==='bowers'||activeTab==='mcbride')
      ? `<div class="ladder-row"><b>TE1</b><span>${activeTab==='bowers'?'BROCK BOWERS':'TREY McBRIDE'}. No planned TE2 needed.</span></div>`
      : ladderRows(TE,true);
  }

  function renderBoard(){
    const section = (title,items,cls) => `<article class="board-card ${cls}"><h3>${esc(title)}</h3>${items.map(([name,note])=>`<div class="board-item">${esc(name)}<small>${esc(note)}</small></div>`).join('')}</article>`;
    $('boardGrid').innerHTML = [
      section('YES — MOVE THEM UP',BOARD.yes,'yes'),
      section('NO — DO NOT RECOMMEND',BOARD.no,'no'),
      section('ONLY IF / CONDITIONS',BOARD.conditional,'conditional')
    ].join('');

    $('stackGrid').innerHTML = STACKS.map(([wr,qb,note])=>`<div class="stack-row"><div>${esc(wr)}</div><div class="arrow">→</div><div>${esc(qb)}<small>${esc(note)}</small></div></div>`).join('');
    $('insuranceBox').innerHTML = '<h3>BENCH INSURANCE RULE</h3><p><b>QB2:</b> Lawrence → Purdy → Nix. Actively use QB2 with Stafford; normally skip it with Herbert, Dak, Burrow or Goff unless a huge value falls.</p><p><b>TE2:</b> Kincaid → Chig. Use TE2 with Kittle or Likely. Bowers/McBride do not need a planned TE2.</p>';
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
  document.querySelector('#slotTabs button[data-slot="1"]').classList.add('active');
  selectTab('default');
})();