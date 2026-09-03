(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const overallPick = (slot, round) => round % 2 ? ((round - 1) * 12 + slot) : (round * 12 - slot + 1);

  const PATHS = {
    default: {
      label: 'DEFAULT · RB/WR FIRST 5',
      short: 'DEFAULT ACTION PLAN',
      recommended: true,
      headline: 'Build the roster first. Do not enter the draft needing a quarterback or tight end by a certain round.',
      approach: 'Rounds 1–5 are RB/WR foundation rounds. Leave Round 5 with a minimum of 2 RB + 2 WR. The fifth player is simply the best value: either 3 RB + 2 WR or 2 RB + 3 WR.',
      build: 'ROUND 5 CHECKPOINT: 5 RB/WR total · minimum 2 RB · minimum 2 WR.',
      warning: ''
    },
    allen: {
      label: 'JOSH ALLEN · ROUND 2',
      short: 'ALLEN R2 ACTION PLAN',
      headline: 'Allen is a deliberate Round-2 exception, not the default Boone build.',
      approach: 'Take an elite RB/WR in Round 1, Josh Allen in Round 2, then spend Rounds 3–5 on RB/WR only. You cannot follow Allen with an early TE and still keep the roster balanced.',
      build: 'ROUND 5 CHECKPOINT: Josh Allen + 2 RB + 2 WR.',
      warning: 'Allen went #31 overall in the Sept. 2 Yahoo expert draft. Taking him in Round 2 is a conscious reach. If you make it, do not compound it by reaching for TE next.'
    },
    bowers: {
      label: 'BROCK BOWERS · ROUND 2',
      short: 'BOWERS R2 ACTION PLAN',
      headline: 'Bowers is the cleanest premium onesie exception because his current market price actually sits in Round 2.',
      approach: 'Take an elite RB/WR in Round 1, Bowers in Round 2, then use Rounds 3–5 exclusively on RB/WR. Quarterback becomes a value hunt after the foundation is repaired.',
      build: 'ROUND 5 CHECKPOINT: Brock Bowers + 2 RB + 2 WR.',
      warning: 'Bowers went #18 overall in the Sept. 2 Yahoo expert draft. Around the middle/back of Round 2, the price is defensible. Do not also pay an early premium at QB.'
    },
    mcbride: {
      label: 'TREY McBRIDE · ROUND 2',
      short: 'McBRIDE R2 ACTION PLAN',
      headline: 'McBride in Round 2 is a conviction pick and requires the strictest recovery plan.',
      approach: 'Take an elite RB/WR in Round 1, McBride in Round 2, then RB/WR only in Rounds 3–5. Quarterback must wait unless a massive value falls.',
      build: 'ROUND 5 CHECKPOINT: Trey McBride + 2 RB + 2 WR.',
      warning: 'McBride went #44 overall in the Sept. 2 Yahoo expert draft. Round 2 is a major reach versus the current market, so the next three picks cannot be luxury picks.'
    }
  };

  const SLOT_NOTES = {
    1:['Long-wait discipline.','At the front, assume a player you pass will not make it back 23 picks. Take the cornerstone, then plan the turn before it reaches you.'],
    2:['Near-front discipline.','You still face a long wait. Favor scarce RB volume when RB and WR values are close.'],
    3:['Boone decision slot.','Use tiers instead of raw rank. A small RB reach is acceptable if the remaining volume tier will disappear before your next pick.'],
    4:['Early-middle flexibility.','Take the best player inside the RB/WR foundation rule and avoid reacting to positional runs.'],
    5:['Middle-slot flexibility.','You can let value come to you. Do not force the fifth RB/WR pick to be a specific position if you already have two at each.'],
    6:['True middle.','This is the easiest slot to stay balanced. Keep RB scarcity in mind, but do not turn every close call into an RB reach.'],
    7:['Hammer spot.','Pair your Round-1 cornerstone with the best Round-2 RB/WR value and keep the first-five checkpoint in view.'],
    8:['Back-half discipline.','Slight reaches are fine for players who will not survive the turn. Keep the plan, not ADP, in control.'],
    9:['Back-half value.','Think about two picks at once. Secure one scarce piece and one best-value piece.'],
    10:['Pair your picks.','Treat each trip near the turn as one two-pick decision: RB+WR, RB+RB, or WR+WR only when the value clearly supports it.'],
    11:['Turn leverage.','You can make small controlled reaches because the board will swing 20+ picks before you return.'],
    12:['Full turn strategy.','Choose two players you would hate to lose. Your pair should still respect the 2-RB / 2-WR minimum through five rounds.']
  };

  const POOLS = {
    1:{
      RB:['Jahmyr Gibbs','Bijan Robinson','Jonathan Taylor','Christian McCaffrey','James Cook III','Saquon Barkley'],
      WR:["Ja'Marr Chase",'Puka Nacua','Amon-Ra St. Brown','Jaxon Smith-Njigba','CeeDee Lamb','Justin Jefferson']
    },
    2:{
      RB:['Chase Brown','Omarion Hampton','Kenneth Walker III',"De'Von Achane",'Derrick Henry','Kyren Williams','Ashton Jeanty'],
      WR:['A.J. Brown','Drake London','George Pickens','Nico Collins']
    },
    3:{
      RB:['Travis Etienne Jr.','Javonte Williams','Jeremiyah Love'],
      WR:['Chris Olave','DeVonta Smith','Zay Flowers','Jaylen Waddle','Tee Higgins','Rashee Rice','Ladd McConkey']
    },
    4:{
      RB:["D'Andre Swift",'Breece Hall','Jadarian Price','Cam Skattebo'],
      WR:['Tetairoa McMillan','Garrett Wilson','Emeka Egbuka','Luther Burden III','Jameson Williams']
    },
    5:{
      RB:['Bucky Irving','Quinshon Judkins','David Montgomery','Bhayshul Tuten'],
      WR:['Christian Watson','DJ Moore','Rome Odunze','Terry McLaurin']
    },
    6:{
      RB:['Rhamondre Stevenson','Jaylen Warren','TreVeyon Henderson','J.K. Dobbins','MarShawn Lloyd'],
      WR:['Mike Evans','Brian Thomas Jr.'],
      QB:['Jalen Hurts','Lamar Jackson','Drake Maye','Joe Burrow'],
      TE:['Tyler Warren','Sam LaPorta','Tucker Kraft']
    },
    7:{
      RB:['Jonathon Brooks','Blake Corum','Chuba Hubbard','Kyle Monangai'],
      WR:['Marvin Harrison Jr.','Carnell Tate','Courtland Sutton','DK Metcalf','Chris Godwin Jr.'],
      QB:['Jalen Hurts','Lamar Jackson','Drake Maye','Joe Burrow'],
      TE:['George Kittle','Kyle Pitts','Dalton Kincaid']
    },
    8:{
      RB:['Jacory Croskey-Merritt','Jordan Mason','Rico Dowdle'],
      WR:['Jayden Reed','Josh Downs','Quentin Johnston'],
      QB:['Jayden Daniels','Caleb Williams'],
      TE:['George Kittle','Kyle Pitts','Dalton Kincaid']
    },
    9:{
      RB:['Kenny Gainwell','RJ Harvey'],
      WR:['Jordan Addison',"Wan'Dale Robinson",'Michael Pittman Jr.','Romeo Doubs','Makai Lemon','KC Concepcion'],
      QB:['Justin Herbert','Dak Prescott'],
      TE:['Isaiah Likely','Travis Kelce']
    },
    10:{
      RB:['Chris Rodriguez Jr.','Jonah Coleman','Rachaad White'],
      WR:['Stefon Diggs'],
      QB:['Trevor Lawrence','Brock Purdy','Matthew Stafford','Bo Nix'],
      TE:['Isaiah Likely','Travis Kelce']
    },
    11:{
      RB:['Tyler Allgeier','Keaton Mitchell','Woody Marks','Braelon Allen','Tank Bigsby'],
      WR:['Jakobi Meyers','Tre Tucker','Rashid Shaheed','Xavier Worthy'],
      QB:['Brock Purdy','Matthew Stafford','Bo Nix'],
      TE:['Dallas Goedert','Jake Ferguson']
    },
    12:{
      RB:['Brian Robinson Jr.','Emmett Johnson','Zach Charbonnet','Tyjae Spears','Dylan Sampson'],
      WR:['Denzel Boston','Dontayvion Wicks'],
      QB:['Matthew Stafford','Bo Nix'],
      TE:['Dallas Goedert']
    },
    13:{RB:['Best upside RB / direct contingency back'],WR:['Best upside WR with a path to targets']},
    14:{RB:['One final upside skill player if value remains'],WR:['One final upside skill player if value remains'],DEF:['Defense may enter here']},
    15:{DEF:['Defense / streamer'],K:['Kicker — final round']}
  };

  const QB_LADDER = {
    6:'Only if a clear fall: Hurts / Lamar / Maye / Burrow',
    7:'Only if a clear fall: Hurts / Lamar / Maye / Burrow',
    8:'Target: Jayden Daniels / Caleb Williams',
    9:'Preferred value: Justin Herbert → Dak Prescott',
    10:'Fallback: Trevor Lawrence → Brock Purdy → Matthew Stafford → Bo Nix'
  };

  const TE_LADDER = {
    6:'Target: Tyler Warren → Sam LaPorta → Tucker Kraft',
    7:'Target: George Kittle → Kyle Pitts → Dalton Kincaid',
    8:'Target: George Kittle → Kyle Pitts → Dalton Kincaid',
    9:'Fallback: Isaiah Likely → Travis Kelce',
    10:'Fallback: Isaiah Likely → Travis Kelce'
  };

  let activeSlot = 1;
  let activePath = 'default';

  function pathRoundRule(round) {
    const path = PATHS[activePath];
    if (round === 1) return {label:'ELITE CORNERSTONE',priority:'RB / WR',note:'Take the best elite RB or WR available. Do not start with QB or TE.'};

    if (round === 2 && activePath === 'allen') return {label:'LOCK JOSH ALLEN',priority:'QB',note:'This is your one premium-QB exception. After this, Rounds 3–5 are RB/WR only.'};
    if (round === 2 && activePath === 'bowers') return {label:'LOCK BROCK BOWERS',priority:'TE',note:'Take Bowers here only because you chose the premium-TE path. After this, Rounds 3–5 are RB/WR only.'};
    if (round === 2 && activePath === 'mcbride') return {label:'LOCK TREY McBRIDE',priority:'TE',note:'This is an intentional reach. After this, there are no more luxury picks before the Round-5 checkpoint.'};

    if (round <= 5) return {label:'FOUNDATION',priority:'RB / WR ONLY',note: activePath === 'default'
      ? 'Keep building toward 3 RB + 2 WR or 2 RB + 3 WR. Minimum two of each by the end of Round 5.'
      : 'Correction round. Build toward exactly 2 RB + 2 WR around your Round-2 QB/TE.'};

    if (round === 6) return {label:'QB / TE VALUE OPENS',priority:activePath === 'allen' ? 'TE → RB/WR' : (activePath === 'bowers' || activePath === 'mcbride') ? 'QB → RB/WR' : 'TE / QB / RB-WR VALUE',note:'Your core should now be built. Start attacking value at the onesie positions without forcing either one.'};
    if (round === 7) return {label:'VALUE, NOT PANIC',priority:activePath === 'allen' ? 'TE / RB / WR' : (activePath === 'bowers' || activePath === 'mcbride') ? 'QB / RB / WR' : 'QB / TE / RB / WR',note:'If a preferred QB/TE is not there, take another useful RB/WR and keep waiting.'};
    if (round === 8) return {label:'MAIN QB/TE WINDOW',priority:'QB / TE VALUE',note:'This is where the late-QB and mid/late-TE plan starts paying off.'};
    if (round === 9) return {label:'PREFERRED LATE-QB ZONE',priority:'QB → TE → UPSIDE',note:'Herbert and Dak are priority quarterback values if you still need QB.'};
    if (round === 10) return {label:'FINISH STARTERS',priority:'QB / TE IF NEEDED',note:'Use the fallback ladders. If both starters are already set, take upside RB/WR.'};
    if (round <= 13) return {label:'BENCH UPSIDE',priority:'RB HANDCUFF / UPSIDE WR',note:'Draft players whose roles can grow. Avoid low-ceiling bench clutter.'};
    if (round === 14) return {label:'LAST SKILL / DEF',priority:'UPSIDE OR DEF',note:'Defense can enter now. Do not move it earlier just to draft a name.'};
    return {label:'KICKER LAST',priority:'K / DEF',note:'Final round only for kicker; stream defense when useful.'};
  }

  function box(pos, title, names, mode='VALUE') {
    const cls = `pos-${pos.toLowerCase()}`;
    const body = names && names.length
      ? names.slice(0,7).map(name => `<div class="position-option simple"><div class="position-name">${esc(name)}</div><div class="position-meta">${esc(mode)}</div></div>`).join('')
      : `<div class="wait-text">WAIT — do not spend this round here.</div>`;
    return `<section class="position-box ${cls} ${names && names.length ? '' : 'wait'}"><div class="position-title"><b>${esc(pos)}</b><span>${esc(title)}</span></div>${body}</section>`;
  }

  function specialRoundTwoBoxes() {
    const pool = POOLS[2];
    if (activePath === 'allen') return [
      box('QB','LOCK',['Josh Allen'],'ROUND-2 EXCEPTION'),
      box('RB','REFERENCE ONLY',pool.RB,'ONLY IF YOU ABANDON ALLEN PATH'),
      box('WR','REFERENCE ONLY',pool.WR,'ONLY IF YOU ABANDON ALLEN PATH'),
      box('TE','WAIT',[])
    ];
    if (activePath === 'bowers') return [
      box('TE','LOCK',['Brock Bowers'],'ROUND-2 EXCEPTION'),
      box('RB','REFERENCE ONLY',pool.RB,'ONLY IF YOU ABANDON BOWERS PATH'),
      box('WR','REFERENCE ONLY',pool.WR,'ONLY IF YOU ABANDON BOWERS PATH'),
      box('QB','WAIT',[])
    ];
    if (activePath === 'mcbride') return [
      box('TE','LOCK',['Trey McBride'],'INTENTIONAL REACH'),
      box('RB','REFERENCE ONLY',pool.RB,'ONLY IF YOU ABANDON McBRIDE PATH'),
      box('WR','REFERENCE ONLY',pool.WR,'ONLY IF YOU ABANDON McBRIDE PATH'),
      box('QB','WAIT',[])
    ];
    return [box('RB','PRIMARY',pool.RB),box('WR','PRIMARY',pool.WR),box('TE','WAIT',[]),box('QB','WAIT',[])];
  }

  function roundBoxes(round) {
    const pool = POOLS[round] || {};
    if (round === 2 && activePath !== 'default') return specialRoundTwoBoxes();

    if (round <= 5) {
      return [
        box('RB','PRIMARY',pool.RB || []),
        box('WR','PRIMARY',pool.WR || []),
        box('TE','WAIT',[]),
        box('QB','WAIT',[])
      ];
    }

    if (round >= 6 && round <= 10) {
      const qbDone = activePath === 'allen';
      const teDone = activePath === 'bowers' || activePath === 'mcbride';
      return [
        box('RB','VALUE / UPSIDE',pool.RB || []),
        box('WR','VALUE / UPSIDE',pool.WR || []),
        qbDone ? box('QB','DONE — ALLEN',[]) : box('QB',QB_LADDER[round] || 'VALUE',pool.QB || []),
        teDone ? box('TE','DONE — TE1',[]) : box('TE',TE_LADDER[round] || 'VALUE',pool.TE || [])
      ];
    }

    if (round === 14) return [box('RB','LAST UPSIDE',pool.RB || []),box('WR','LAST UPSIDE',pool.WR || []),box('QB','WAIT',[]),box('TE','WAIT',[])];
    if (round === 15) return [box('QB','WAIT',[]),box('TE','WAIT',[]),box('RB','WAIT',[]),box('WR','WAIT',[])];

    return [box('RB','HANDCUFF / UPSIDE',pool.RB || []),box('WR','UPSIDE',pool.WR || []),box('QB','ONLY IF NEEDED',pool.QB || []),box('TE','ONLY IF NEEDED',pool.TE || [])];
  }

  function renderCheckpoint() {
    const path = PATHS[activePath];
    const items = activePath === 'default'
      ? [
          ['R1–R5','RB / WR ONLY','Five foundation picks.'],
          ['MINIMUM','2 RB + 2 WR','Never leave Round 5 below this.'],
          ['IDEAL','3 RB + 2 WR','When RB value wins the fifth-pick decision.'],
          ['ALSO GOOD','2 RB + 3 WR','When WR value wins the fifth-pick decision.']
        ]
      : [
          ['ROUND 1','ELITE RB / WR','Start with a cornerstone.'],
          ['ROUND 2',activePath === 'allen' ? 'JOSH ALLEN' : activePath === 'bowers' ? 'BROCK BOWERS' : 'TREY McBRIDE','Your chosen exception.'],
          ['ROUNDS 3–5','RB / WR ONLY','No second luxury pick.'],
          ['END OF R5','2 RB + 2 WR','Plus your Round-2 QB/TE.']
        ];
    $('checkpoint').innerHTML = items.map(([k,v,s]) => `<article><b>${esc(k)}</b><strong>${esc(v)}</strong><span>${esc(s)}</span></article>`).join('');
  }

  function render() {
    const path = PATHS[activePath];
    const [slotHeadline, slotApproach] = SLOT_NOTES[activeSlot];

    document.querySelectorAll('#slotTabs button').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.slot) === activeSlot));
    document.querySelectorAll('#pathTabs button').forEach(btn => btn.classList.toggle('active', btn.dataset.path === activePath));

    $('slotTitle').textContent = `PICK ${activeSlot} · ${path.short}`;
    $('slotHeadline').textContent = `${slotHeadline} ${path.headline}`;
    $('slotApproach').textContent = `${slotApproach} ${path.approach}`;
    $('slotBuild').textContent = path.build;
    $('pathWarning').hidden = !path.warning;
    $('pathWarning').textContent = path.warning;
    renderCheckpoint();

    const cards = [];
    for (let round = 1; round <= 15; round++) {
      const rule = pathRoundRule(round);
      const pick = overallPick(activeSlot, round);
      const boxes = roundBoxes(round);
      let check = '';
      if (round === 5) check = activePath === 'default'
        ? 'STOP AND CHECK: Do I have at least 2 RB and 2 WR? If yes, Round 6 can open QB/TE value. If no, keep fixing RB/WR.'
        : `STOP AND CHECK: Do I have ${activePath === 'allen' ? 'Josh Allen' : activePath === 'bowers' ? 'Brock Bowers' : 'Trey McBride'} + 2 RB + 2 WR? If not, keep fixing the foundation.`;
      if (round === 9 && activePath !== 'allen') check = 'QB PRIORITY: Justin Herbert first, Dak Prescott second if both are available in this value zone.';
      if (round === 10 && activePath === 'default') check = 'By now, finish whichever starter is still missing at QB or TE. Do not draft a backup onesie before your starting lineup is handled.';

      cards.push(`<article class="round-card ${round === 2 && activePath !== 'default' ? 'locked' : ''}">
        <div class="round-head"><b>ROUND ${round}</b><span>Your snake pick = #${pick}<br>${esc(rule.label)}</span></div>
        <div class="focus">ACTION: ${esc(rule.priority)}</div>
        <div class="priority-banner">${esc(rule.note)}</div>
        <div class="position-grid">${boxes.join('')}</div>
        ${check ? `<div class="round-check">${esc(check)}</div>` : ''}
      </article>`);
    }
    $('rounds').innerHTML = cards.join('');
  }

  $('slotTabs').innerHTML = Array.from({length:12}, (_,i) => `<button type="button" data-slot="${i+1}">PICK ${i+1}</button>`).join('');
  $('slotTabs').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {activeSlot = Number(btn.dataset.slot); render();}));

  $('pathTabs').innerHTML = Object.entries(PATHS).map(([key,path]) => `<button type="button" data-path="${key}" class="${path.recommended ? 'recommended' : ''}">${esc(path.label)}${path.recommended ? '<br><small>RECOMMENDED</small>' : ''}</button>`).join('');
  $('pathTabs').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {activePath = btn.dataset.path; render();}));

  render();
})();