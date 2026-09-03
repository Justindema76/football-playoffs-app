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
    ['qbte','QB-TE Ladder',false],
    ['late','Late Rounds',false]
  ];

  const R1 = {
    1:'JAHMYR GIBBS',
    2:'BIJAN ROBINSON',
    3:'JONATHAN TAYLOR / JA’MARR CHASE',
    4:'JA’MARR CHASE / PUKA NACUA',
    5:'PUKA NACUA / AMON-RA ST. BROWN',
    6:'AMON-RA / JAXON SMITH-NJIGBA',
    7:'CMC / JAMES COOK',
    8:'JAMES COOK / JSN',
    9:'JSN / SAQUON BARKLEY',
    10:'SAQUON / CEEDEE LAMB',
    11:'CEEDEE / JUSTIN JEFFERSON',
    12:'JAMES COOK IF HE FALLS\nJEFFERSON / CEEDEE / SAQUON'
  };

  const R2 = {
    1:'DRAKE LONDON / GEORGE PICKENS / NICO COLLINS\nor a falling Round-2 RB',
    2:'A.J. BROWN / DRAKE LONDON / GEORGE PICKENS\nor a falling Round-2 RB',
    3:'A.J. BROWN / DRAKE LONDON\nor HENRY / KENNETH WALKER',
    4:'KENNETH WALKER / ACHANE / HENRY / KYREN',
    5:'KENNETH WALKER / ACHANE / HENRY / KYREN',
    6:'KENNETH WALKER / ACHANE / HENRY / KYREN',
    7:'CHASE BROWN / OMARION HAMPTON / KENNETH WALKER',
    8:'CHASE BROWN / HAMPTON / KENNETH WALKER',
    9:'CHASE BROWN / HAMPTON / KENNETH WALKER',
    10:'CHASE BROWN / HAMPTON / KENNETH WALKER',
    11:'CHASE BROWN / HAMPTON / KENNETH WALKER',
    12:'CHASE BROWN / HAMPTON / KENNETH WALKER\nBEST CASE: COOK + CHASE BROWN'
  };

  const OPENERS = {
    1:['GIBBS + LONDON / PICKENS / NICO','At #24, do not pretend the top half of Round 2 is coming back. Take the best realistic survivor.'],
    2:['BIJAN + A.J. BROWN / LONDON / PICKENS','If Gibbs falls to #2, take him. Your second pick is #23.'],
    3:['TAYLOR or CHASE + A.J. BROWN / LONDON / HENRY / WALKER','This is the Boone decision spot: protect yourself against the RB cliff.'],
    4:['CHASE / PUKA + WALKER / ACHANE / HENRY / KYREN','A clean WR + RB start is usually available here.'],
    5:['PUKA / AMON-RA + WALKER / ACHANE / HENRY / KYREN','Do not force TE/QB if the Round-2 RB pocket is still strong.'],
    6:['AMON-RA / JSN + WALKER / ACHANE / HENRY / KYREN','Middle slot gives you freedom: take the better RB/WR value.'],
    7:['CMC / COOK + CHASE BROWN / HAMPTON / WALKER','RB-RB is absolutely live if the board gives it to you.'],
    8:['COOK / JSN + CHASE BROWN / HAMPTON / WALKER','Cook + Brown is strong if Brown lasts to #17.'],
    9:['JSN / SAQUON + CHASE BROWN / HAMPTON / WALKER','If Cook falls to #9, he jumps into the first-pick conversation.'],
    10:['SAQUON / CEEDEE + CHASE BROWN / HAMPTON / WALKER','Think of #10 and #15 as one two-player decision.'],
    11:['CEEDEE / JEFFERSON + CHASE BROWN / HAMPTON / WALKER','If Cook falls to #11, Cook + Brown becomes a strong RB-RB start.'],
    12:['JAMES COOK + CHASE BROWN','BEST CASE. Cook is a fall to #12; Brown is exactly in the #13 range. If Cook is gone: Jefferson / CeeDee / Saquon + Brown / Hampton / Walker.']
  };

  const R3_WR = 'OLAVE / DeVONTA SMITH / ZAY FLOWERS / WADDLE / TEE HIGGINS / RASHEE RICE / LADD';
  const R3_RB = 'ETIENNE / JAVONTE WILLIAMS / JEREMIYAH LOVE';
  const R4_WR = 'McMILLAN / GARRETT WILSON / EGBUKA / BURDEN / JAMESON WILLIAMS';
  const R4_RB = 'BREECE HALL / D’ANDRE SWIFT / JADARIAN PRICE / CAM SKATTEBO';
  const R5_WR = 'CHRISTIAN WATSON / DJ MOORE / ROME ODUNZE / TERRY McLAURIN';
  const R5_RB = 'BUCKY IRVING / QUINSHON JUDKINS / DAVID MONTGOMERY / BHAYSHUL TUTEN';

  const QB = [
    ['R6–7','HURTS → LAMAR → DRAKE MAYE → BURROW','ONLY IF THEY FALL'],
    ['R8','JAYDEN DANIELS → CALEB WILLIAMS','GOOD TARGET WINDOW'],
    ['R9','JUSTIN HERBERT → DAK PRESCOTT','PREFERRED VALUE'],
    ['R10+','TREVOR LAWRENCE → BROCK PURDY → STAFFORD → BO NIX','DON’T PANIC']
  ];

  const TE = [
    ['R6','TYLER WARREN → SAM LaPORTA → TUCKER KRAFT','GOOD TARGET WINDOW'],
    ['R7–8','GEORGE KITTLE → KYLE PITTS → DALTON KINCAID','PREFERRED'],
    ['R9–10','ISAIAH LIKELY → TRAVIS KELCE','FALLBACK'],
    ['AFTER TE1','STOP','NO BACKUP TE EARLY']
  ];

  const LATE = [
    ['1','RB HANDCUFF / UPSIDE','Allgeier · Braelon Allen · Tank Bigsby · Emmett Johnson · Charbonnet · Spears · Ray Davis','One injury can create an immediate starter.'],
    ['2','UPSIDE WR','Young/ascending role players','Take a player with a real path to targets, not a safe roster clogger.'],
    ['3','QB2','Only if your starter is risky or the stack is unusually strong','If you drafted Josh Allen, normally skip QB2.'],
    ['4','DEFENSE','Matchup-based','Final two rounds. Streaming is fine.'],
    ['5','KICKER','Good offense / matchup','Final round. Replaceable position.']
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
    if(activeTab==='allen') return [`${R1[activeSlot].replace(/\n/g,' / ')} → JOSH ALLEN`,`You are choosing Allen in Round 2. That means Rounds 3–5 are RB/WR recovery only. No early TE.`];
    if(activeTab==='bowers') return [`${R1[activeSlot].replace(/\n/g,' / ')} → BROCK BOWERS`,`Bowers is the premium-TE path. After Round 2, Rounds 3–5 are RB/WR only. No early QB reach.`];
    return [`${R1[activeSlot].replace(/\n/g,' / ')} → TREY McBRIDE`,`McBride in Round 2 is a major reach versus current market. If you do it, Rounds 3–5 are strictly RB/WR recovery.`];
  }

  function renderPlan(){
    const picks = [1,2,3,4,5].map(r=>`R${r} #${snake(activeSlot,r)}`).join('  ·  ');
    $('heroPicks').textContent = picks;

    if(activeTab==='default'){
      $('heroRuleTitle').textContent='FIRST FIVE = RB / WR';
      $('heroRuleText').textContent='Finish with 3 RB + 2 WR or 2 RB + 3 WR. Minimum two at each position.';
    } else {
      const star = activeTab==='allen'?'JOSH ALLEN':activeTab==='bowers'?'BROCK BOWERS':'TREY McBRIDE';
      $('heroRuleTitle').textContent=`ROUND 2 = ${star}`;
      $('heroRuleText').textContent=`Then Rounds 3–5 are RB/WR ONLY. Finish Round 5 with ${star} + 2 RB + 2 WR.`;
    }

    const [primary,alt] = openingForPath();
    $('openingPrimary').textContent = primary;
    $('openingAlt').textContent = alt;

    const cards=[];
    cards.push(roundCard(1,'GET YOUR CORNERSTONE',R1[activeSlot],'r1'));

    if(activeTab==='default'){
      cards.push(roundCard(2,'PAIR THE START',R2[activeSlot],'r2'));
      cards.push(roundCard(3,'CHECK YOUR FIRST 2','2 RB? TAKE WR: '+R3_WR+'\n2 WR? TAKE RB: '+R3_RB+'\n1 RB + 1 WR? BEST VALUE','wr'));
      cards.push(roundCard(4,'GET TO 2 + 2','Need WR: '+R4_WR+'\nNeed RB: '+R4_RB+'\nIf already balanced: best value',''));
      cards.push(roundCard(5,'FINISH THE FOUNDATION','MUST HAVE 2 RB + 2 WR. Fifth skill player = best value.\nWR: '+R5_WR+'\nRB: '+R5_RB,'finish'));
      $('checkpointTitle').textContent='END OF ROUND 5 CHECK';
      $('checkpointText').textContent='You should have five RB/WR players. The clean builds are 3 RB + 2 WR or 2 RB + 3 WR.';
      $('checkpointBig').textContent='MINIMUM 2 RB + 2 WR';
      $('pathWarning').hidden=true;
    } else {
      const star = activeTab==='allen'?'JOSH ALLEN':activeTab==='bowers'?'BROCK BOWERS':'TREY McBRIDE';
      const cls = activeTab==='allen'?'qb':'te';
      cards.push(roundCard(2,`LOCK ${star}`,activeTab==='allen'?'Take Allen here and STOP thinking about QB.':`Take ${star} here and STOP thinking about TE.`,cls));
      cards.push(roundCard(3,'MATCH ROUND 1','R1 was RB? TAKE WR: '+R3_WR+'\nR1 was WR? TAKE RB: '+R3_RB,'wr'));
      cards.push(roundCard(4,'RB / WR ONLY','Do not take QB/TE. Keep the count moving toward 2 RB + 2 WR.\nWR: '+R4_WR+'\nRB: '+R4_RB,''));
      cards.push(roundCard(5,'MUST FINISH 2 + 2','WR: '+R5_WR+'\nRB: '+R5_RB+'\nYou do not leave this round without 2 RB + 2 WR.','finish'));
      $('checkpointTitle').textContent='END OF ROUND 5 CHECK';
      $('checkpointText').textContent=`Your roster must now contain ${star}, two running backs and two wide receivers.`;
      $('checkpointBig').textContent=`${star} + 2 RB + 2 WR`;
      $('pathWarning').hidden=false;
      $('pathWarning').textContent = activeTab==='allen'
        ? 'Allen in Round 2 is a deliberate reach versus Boone’s preferred wait-QB construction. Do not pay another early premium at TE.'
        : activeTab==='bowers'
          ? 'Bowers is the most defensible Round-2 exception. Once you take him, do not spend another useful pick on TE.'
          : 'McBride in Round 2 is the most aggressive path. The recovery rule is strict: no QB and no second TE before the RB/WR base is repaired.';
    }

    $('roundStrip').innerHTML=cards.join('');
    $('qbMini').innerHTML = activeTab==='allen'
      ? '<div class="ladder-row"><b>DONE</b><span>JOSH ALLEN is QB1. Do not draft QB2 early.</span></div>'
      : ladderRows(QB.slice(1),true);
    $('teMini').innerHTML = (activeTab==='bowers'||activeTab==='mcbride')
      ? `<div class="ladder-row"><b>DONE</b><span>${activeTab==='bowers'?'BROCK BOWERS':'TREY McBRIDE'} is TE1. Do not draft TE2 early.</span></div>`
      : ladderRows(TE,true);
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
    $('qbTePanel').classList.toggle('active',tab==='qbte');
    $('latePanel').classList.toggle('active',tab==='late');
    if(isPlan) renderPlan();
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