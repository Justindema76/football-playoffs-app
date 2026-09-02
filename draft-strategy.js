(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const POSITIONS = ['RB','WR','TE','QB'];

  // Manual study guide only. No Supabase, no live board, no extension.
  // Approved pool = Justin's explicit targets + positive Intel + expert-only additions.
  // Stars mark Justin's explicit targets. AVOID/disliked players are excluded.
  const PLAYERS = [
    [1,'Jahmyr Gibbs','RB','TARGET'],[2,'Bijan Robinson','RB','TARGET'],[3,"Ja'Marr Chase",'WR','TARGET'],[4,'Puka Nacua','WR','TARGET'],[5,'Jonathan Taylor','RB','TARGET'],[6,'Christian McCaffrey','RB','INTEL'],[7,'Amon-Ra St. Brown','WR','TARGET'],[8,'Jaxon Smith-Njigba','WR','TARGET'],[9,'James Cook','RB','TARGET'],[10,'Saquon Barkley','RB','INTEL'],[11,'CeeDee Lamb','WR','TARGET'],[12,'Kenneth Walker III','RB','INTEL'],
    [13,'Justin Jefferson','WR','TARGET'],[14,'Chase Brown','RB','TARGET'],[15,"De'Von Achane",'RB','INTEL'],[17,'Derrick Henry','RB','EXPERT'],[18,'Nico Collins','WR','TARGET'],[19,'Brock Bowers','TE','TARGET'],[20,'Drake London','WR','TARGET'],[23,'George Pickens','WR','TARGET'],[24,'Malik Nabers','WR','TARGET'],
    [25,'Chris Olave','WR','EXPERT'],[28,'Tee Higgins','WR','TARGET'],[29,'Trey McBride','TE','TARGET'],[31,'Josh Allen','QB','TARGET'],[35,'Javonte Williams','RB','TARGET'],
    [37,'Colston Loveland','TE','TARGET'],[38,'Tetairoa McMillan','WR','TARGET'],[39,'Ladd McConkey','WR','TARGET'],[41,'Travis Etienne Jr.','RB','TARGET'],[42,"D'Andre Swift",'RB','TARGET'],[43,'Emeka Egbuka','WR','TARGET'],[45,'Luther Burden III','WR','INTEL'],[46,'Terry McLaurin','WR','TARGET'],[47,'Tyler Warren','TE','TARGET'],[48,'DJ Moore','WR','TARGET'],
    [49,'Cam Skattebo','RB','TARGET'],[51,'Rome Odunze','WR','TARGET'],[53,'Bucky Irving','RB','TARGET'],[55,'Bhayshul Tuten','RB','TARGET'],[57,'Davante Adams','WR','TARGET'],[59,'David Montgomery','RB','TARGET'],[60,'Jadarian Price','RB','TARGET'],
    [61,'Mike Evans','WR','INTEL'],[62,'Drake Maye','QB','TARGET'],[63,'Jayden Daniels','QB','TARGET'],[64,'Joe Burrow','QB','TARGET'],[66,'Jalen Hurts','QB','TARGET'],[67,'Tucker Kraft','TE','TARGET'],[68,'Rhamondre Stevenson','RB','INTEL'],[69,'Marvin Harrison Jr.','WR','TARGET'],[72,'Caleb Williams','QB','TARGET'],
    [73,'Brian Thomas Jr.','WR','TARGET'],[75,'Justin Herbert','QB','TARGET'],[76,'Jonathon Brooks','RB','TARGET'],[77,'DK Metcalf','WR','INTEL'],[79,'Trevor Lawrence','QB','TARGET'],[80,'Dak Prescott','QB','TARGET'],[83,'Rico Dowdle','RB','TARGET'],[84,'J.K. Dobbins','RB','TARGET'],
    [86,'Michael Wilson','WR','TARGET'],[88,'George Kittle','TE','TARGET'],[89,'Jacory Croskey-Merritt','RB','INTEL'],[90,'Stefon Diggs','WR','TARGET'],[91,'Blake Corum','RB','TARGET'],[93,'Chuba Hubbard','RB','TARGET'],[95,'Jordan Addison','WR','TARGET'],
    [97,'Brock Purdy','QB','TARGET'],[99,'Courtland Sutton','WR','TARGET'],[101,'Bo Nix','QB','EXPERT'],[103,'Jordan Mason','RB','TARGET'],[105,'Michael Pittman Jr.','WR','INTEL'],[107,'Dalton Kincaid','TE','TARGET'],
    [109,'RJ Harvey','RB','TARGET'],[112,'Matthew Stafford','QB','TARGET'],[114,'Kyler Murray','QB','INTEL'],[115,'Kenny Gainwell','RB','TARGET'],[116,'Rachaad White','RB','TARGET'],[117,'Dallas Goedert','TE','TARGET'],[118,'Jared Goff','QB','TARGET'],[119,'Patrick Mahomes','QB','TARGET'],[120,'Travis Kelce','TE','TARGET'],
    [123,'Aaron Jones','RB','TARGET'],[124,'Jordan Love','QB','TARGET'],[125,'Jakobi Meyers','WR','TARGET'],[127,'Keaton Mitchell','RB','TARGET'],[129,'MarShawn Lloyd','RB','TARGET'],
    [133,'Woody Marks','RB','TARGET'],[137,'Baker Mayfield','QB','TARGET'],[139,'Tyler Allgeier','RB','TARGET'],
    [146,'Jake Ferguson','TE','TARGET'],[148,'Keenan Allen','WR','TARGET'],[151,'Dalton Schultz','TE','TARGET'],[152,'Deebo Samuel Sr.','WR','TARGET'],[154,'Jalen McMillan','WR','TARGET'],
    [158,'Chig Okonkwo','TE','TARGET'],[159,'Terrance Ferguson','TE','TARGET'],[161,'Braelon Allen','RB','TARGET'],[163,'Brian Robinson','RB','TARGET'],[164,'C.J. Stroud','QB','TARGET'],[166,'Daniel Jones','QB','TARGET'],[168,'Brenton Strange','TE','TARGET'],[171,'Rams D/ST','DEF','INTEL']
  ].map(([rank,name,pos,source]) => ({rank,name,pos,source,tier:Math.ceil(rank/12)}));

  const SLOT_PROFILES = {
    1:['Elite RB anchor, then survive the long turn.','Boone philosophy: account for the RB cliff before it happens. Start with elite workload and use the 2/3 turn to rebuild WR depth.','Preferred opening shape: RB / WR / WR.'],
    2:['Same elite-RB advantage as Pick 1.','Take the elite back if available, then let the board bring WR value back to you.','Preferred opening shape: RB / WR / WR.'],
    3:['The classic Boone decision point.','Rankings are a guide, not a script. If the RB cliff is coming before your next pick, reaching slightly for the last elite-volume back is justified.','Preferred opening shape: RB-WR-WR or WR-RB-WR.'],
    4:['Elite WR territory, but keep one eye on RB scarcity.','Take the best elite WR/RB value, then make sure you secure a meaningful RB before the dependable volume evaporates.','Preferred opening shape: WR / RB / WR.'],
    5:['Middle-slot flexibility.','Do not force a build. Take the elite value, then stay balanced across RB and WR.','Preferred opening shape: WR-RB-WR or RB-WR-WR.'],
    6:['Middle-board flexibility with manageable waits.','Boone mentality: stay value-conscious, but do not ignore the RB cliff just because the board looks balanced.','By Round 5: aim for at least 2 RB and 2 WR.'],
    7:['Hammer spot.','This is a great place to pair an elite WR/RB with the strong Round 2 running-back tier.','Preferred opening shape: WR-RB-WR or RB-WR-WR.'],
    8:['Respect the Round 2 RB tier.','If a Chase Brown/Achane/Henry type survives to you, that is exactly the kind of value Boone wants attacked.','Preferred opening shape: RB-WR-WR or WR-RB-WR.'],
    9:['Back-half value.','Exploit whichever side of RB/WR the room gives you, but avoid leaving Round 2 without a real RB unless the WR value is exceptional.','Preferred opening shape: RB-WR-WR or WR-RB-WR.'],
    10:['Think in pairs.','Treat the turn as one decision. Small ADP reaches are acceptable because the player may not survive the long wait back.','Preferred turn: RB + WR; RB + RB if the tier falls.'],
    11:['Use the turn to create an edge.','Take the best cornerstone and be willing to use the second pick on elite TE value if it creates a real positional advantage.','Preferred turn: WR/RB + RB/WR; elite TE may replace one side.'],
    12:['Two picks together.','Do not obsess over ADP. Take the two cornerstone players you would hate to lose before the 22-pick wait.','Preferred turn: WR + RB or RB + RB.']
  };

  const ROUND_PLAN = {
    1:{label:'CORNERSTONE',priority:['RB','WR'],modes:{RB:'PRIMARY',WR:'PRIMARY',TE:'WAIT',QB:'WAIT'},note:'Elite RB/WR only. Boone: rankings are a guide, and RB scarcity should influence whether you reach slightly.',expert:'Account for the coming RB cliff instead of blindly following rankings.'},
    2:{label:'HAMMER RB VALUE',priority:['RB','WR','TE'],modes:{RB:'PRIMARY',WR:'FALLBACK',TE:'ELITE VALUE',QB:'WAIT'},note:'This is the strongest early RB pocket. Attack it regardless of your Round 1 direction unless WR/TE value is clearly better.',expert:'Boone called Brown, Walker, Achane, Henry and the surrounding backs strong Round 2 selections.'},
    3:{label:'LEAN WR / VALUE ONLY',priority:['WR','RB','TE'],modes:{RB:'VALUE ONLY',WR:'PRIMARY',TE:'ELITE FALL',QB:'WAIT'},note:'The RBs are riskier now. Prefer WR unless a trustworthy volume back or elite TE fall creates obvious value.',expert:'Boone noted most managers chose WR here because the RBs after the top 12 carry more risk.'},
    4:{label:'WR / ELITE TE',priority:['WR','TE','RB'],modes:{RB:'VALUE ONLY',WR:'PRIMARY',TE:'PRIMARY',QB:'WAIT'},note:'Do not force a bad RB. Boone himself spent up on elite-TE upside when the RB value was not there.',expert:'Boone passed on weak RB value and used the round to chase elite TE upside.'},
    5:{label:'LAST STRONG RB WINDOW',priority:['RB','WR','TE'],modes:{RB:'PRIMARY',WR:'PRIMARY',TE:'VALUE',QB:'WAIT'},note:'This is often the last train for dependable RB volume plus upside. WR remains a frequent Boone target here.',expert:'Boone says Round 5 is often the final strong window for guaranteed RB volume.'},
    6:{label:'CORE FIRST, THEN QB/TE',priority:['RB','WR','TE','QB'],modes:{RB:'VALUE',WR:'PRIMARY',TE:'VALUE',QB:'IF CORE BUILT'},note:'If your RB/WR core is built, QB or TE becomes guilt-free. If not, keep filling the core.',expert:'Boone: balanced builds can dip into QB/TE once the foundation is secure; RB talent is thinning.'},
    7:{label:'FILL STARTERS',priority:['RB','WR','QB','TE'],modes:{RB:'VALUE',WR:'PRIMARY',TE:'VALUE',QB:'IF CORE BUILT'},note:'Keep filling starters and take the best upside value. Do not draft a mediocre player merely to fill a position.',expert:'Stay flexible; the board should decide whether you use this pick on depth or your first QB/TE.'},
    8:{label:'GET YOUR GUYS',priority:['RB','WR','TE','QB'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Boone calls this “Get Your Guys” territory. Take players you believe can vastly outperform the slot.',expert:'Round 8 is where conviction and upside matter more than tiny ADP differences.'},
    9:{label:'BACKUP RB / QB VALUE',priority:['RB','QB','WR','TE'],modes:{RB:'UPSIDE',WR:'VALUE',TE:'VALUE',QB:'VALUE'},note:'Target contingent RB upside and start taking the late-QB discounts the room gives you.',expert:'Boone highlighted the value of later QBs compared with paying the Round 3 price for an elite passer.'},
    10:{label:'LATE-QB SWEET SPOT',priority:['QB','RB','WR','TE'],modes:{RB:'UPSIDE',WR:'VALUE',TE:'VALUE',QB:'PRIMARY'},note:'If you waited on QB, this is where the plan should pay. Otherwise keep taking upside at RB/WR.',expert:'Boone/Harmon explicitly like the late-round QB attack because strong starters remain available here.'},
    11:{label:'BENCH UPSIDE',priority:['RB','WR','QB','TE'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Use bench spots on players whose role can grow. Floor-only depth is less useful than contingent upside.',expert:'Start prioritizing paths to a larger role over safe low-ceiling veterans.'},
    12:{label:'HANDCUFF / STACK VALUE',priority:['RB','WR','QB','TE'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Target contingency backs, cheap stacks and late breakouts.',expert:'At this point the best picks are players one role change away from major relevance.'},
    13:{label:'LOTTERY TICKETS',priority:['RB','WR','TE','QB'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Keep chasing upside. Do not spend the pick on defense yet unless your skill-player board is exhausted.',expert:'Boone wants late picks used on players who can actually become league-winning assets.'},
    14:{label:'LAST SKILL / DEF',priority:['RB','WR','TE','DEF'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'WAIT'},note:'One last upside skill player is fine. Defense only enters the conversation now.',expert:'Boone: do not draft defense early.'},
    15:{label:'DEF / KICKER LAST',priority:['DEF','K'],modes:{RB:'WAIT',WR:'WAIT',TE:'WAIT',QB:'WAIT'},note:'Defense and kicker belong at the end. Do not sacrifice earlier upside picks for them.',expert:'Boone’s final-draft rule: DEF and K in the final two rounds only.'}
  };

  const FALL_TRIGGERS = {
    3:[{name:'Brock Bowers',text:'AUTO-TAKE IF HE REACHES ROUND 3 — elite TE value has fallen too far.'}],
    4:[{name:'Trey McBride',text:'AUTO-TAKE IF HE REACHES ROUND 4 — this is the value point to stop waiting.'}]
  };

  const SOURCE_ORDER = {TARGET:0,INTEL:1,EXPERT:2};
  const overallPick = (slot,round) => round % 2 ? ((round-1)*12+slot) : (round*12-slot+1);
  const byName = name => PLAYERS.find(p=>p.name===name);
  const tierPlayers = round => PLAYERS.filter(p=>p.tier===round);

  function optionsFor(round,pos,overall){
    const mode = ROUND_PLAN[round].modes[pos] || 'WAIT';
    if(mode==='WAIT') return {mode,options:[]};
    const options = tierPlayers(round)
      .filter(p=>p.pos===pos)
      .sort((a,b)=>(SOURCE_ORDER[a.source]-SOURCE_ORDER[b.source]) || (a.rank-b.rank))
      .slice(0,2)
      .map(p=>({
        ...p,
        status: p.rank <= overall-5 ? 'IF STILL THERE' : p.rank >= overall+6 ? 'SLIGHT REACH' : 'IN RANGE'
      }));
    return {mode,options};
  }

  function playerRow(p){
    const star = p.source==='TARGET' ? '★ ' : '';
    return `<div class="position-option"><div class="position-name">${star}${p.name}</div><div class="position-meta">Y#${p.rank} · ${p.status}${p.source!=='TARGET'?` · ${p.source}`:''}</div></div>`;
  }

  function positionBox(round,pos,overall){
    const {mode,options} = optionsFor(round,pos,overall);
    if(mode==='WAIT') return `<section class="position-box wait"><div class="position-title"><b>${pos}</b><span>WAIT</span></div><div class="wait-text">Boone build says do not spend this round here.</div></section>`;
    const body = options.length ? options.map(playerRow).join('') : `<div class="wait-text">No approved ${pos} in this tier — do not force the position.</div>`;
    return `<section class="position-box"><div class="position-title"><b>${pos}</b><span>${mode}</span></div>${body}</section>`;
  }

  function triggerBlock(round){
    const triggers = FALL_TRIGGERS[round] || [];
    if(!triggers.length) return '';
    return `<div class="fall-triggers">${triggers.map(t=>{const p=byName(t.name);return `<div class="fall-trigger"><b>${t.name}${p&&p.source==='TARGET'?' ★':''}</b><span>${t.text}</span></div>`}).join('')}</div>`;
  }

  function render(slot){
    document.querySelectorAll('#slotTabs button').forEach(b=>b.classList.toggle('active',Number(b.dataset.slot)===slot));
    const [headline,approach,build] = SLOT_PROFILES[slot];
    $('slotTitle').textContent = `PICK ${slot}`;
    $('slotHeadline').textContent = headline;
    $('slotApproach').textContent = approach;
    $('slotBuild').textContent = build;

    $('rounds').innerHTML = Array.from({length:15},(_,i)=>{
      const round=i+1;
      const overall=overallPick(slot,round);
      const plan=ROUND_PLAN[round];
      const groups = round===15
        ? `<section class="position-box"><div class="position-title"><b>DEF</b><span>PRIMARY</span></div><div class="position-option"><div class="position-name">Rams D/ST</div><div class="position-meta">Only now — or take your preferred final defense</div></div></section><section class="position-box"><div class="position-title"><b>K</b><span>FINAL PICK</span></div><div class="wait-text">Use the final pick for kicker. Do not spend an earlier pick here.</div></section>`
        : POSITIONS.map(pos=>positionBox(round,pos,overall)).join('');
      return `<article class="round-card">
        <div class="round-head"><b>ROUND ${round}</b><span>Your pick ≈ #${overall}<br>${plan.label}</span></div>
        <div class="focus">BOONE PRIORITY: ${plan.priority.join(' → ')}</div>
        ${triggerBlock(round)}
        <div class="position-grid">${groups}</div>
        <div class="round-note">${plan.note}</div>
        <div class="expert-note">${plan.expert}</div>
      </article>`;
    }).join('');
  }

  $('slotTabs').innerHTML = Array.from({length:12},(_,i)=>`<button data-slot="${i+1}">PICK ${i+1}</button>`).join('');
  $('slotTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>render(Number(b.dataset.slot)));
  render(7);
})();
