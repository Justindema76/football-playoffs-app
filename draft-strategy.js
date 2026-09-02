(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  // MANUAL study guide only.
  // Sources allowed here: Justin's targets + positive current Intel + expert recommendations.
  // Explicit dislikes / AVOID players are excluded. No Supabase. No live draft state. No extension.
  const PLAYERS = [
    // Round 1 / elite pool
    [1,'Jahmyr Gibbs','RB','TARGET'],[2,'Bijan Robinson','RB','TARGET'],[3,"Ja'Marr Chase",'WR','TARGET'],[4,'Puka Nacua','WR','TARGET'],[5,'Jonathan Taylor','RB','TARGET'],
    [6,'Christian McCaffrey','RB','INTEL'],[7,'Amon-Ra St. Brown','WR','TARGET'],[8,'Jaxon Smith-Njigba','WR','TARGET'],[9,'James Cook','RB','TARGET'],[10,'Saquon Barkley','RB','INTEL'],
    [11,'CeeDee Lamb','WR','TARGET'],[12,'Kenneth Walker III','RB','INTEL'],[13,'Justin Jefferson','WR','TARGET'],

    // Round 2 / early value
    [14,'Chase Brown','RB','TARGET'],[15,"De'Von Achane",'RB','INTEL'],[17,'Derrick Henry','RB','EXPERT'],[18,'Nico Collins','WR','TARGET'],[19,'Brock Bowers','TE','TARGET'],
    [20,'Drake London','WR','TARGET'],[23,'George Pickens','WR','TARGET'],[24,'Malik Nabers','WR','TARGET'],

    // Round 3-5
    [25,'Chris Olave','WR','EXPERT'],[28,'Tee Higgins','WR','TARGET'],[29,'Trey McBride','TE','TARGET'],[31,'Josh Allen','QB','TARGET'],[35,'Javonte Williams','RB','TARGET'],
    [37,'Colston Loveland','TE','TARGET'],[38,'Tetairoa McMillan','WR','TARGET'],[39,'Ladd McConkey','WR','TARGET'],[41,'Travis Etienne Jr.','RB','TARGET'],[42,"D'Andre Swift",'RB','TARGET'],
    [43,'Emeka Egbuka','WR','TARGET'],[45,'Luther Burden III','WR','INTEL'],[46,'Terry McLaurin','WR','TARGET'],[47,'Tyler Warren','TE','TARGET'],[48,'DJ Moore','WR','TARGET'],
    [49,'Cam Skattebo','RB','TARGET'],[51,'Rome Odunze','WR','TARGET'],[53,'Bucky Irving','RB','TARGET'],[55,'Bhayshul Tuten','RB','TARGET'],[57,'Davante Adams','WR','TARGET'],
    [59,'David Montgomery','RB','TARGET'],[60,'Jadarian Price','RB','TARGET'],

    // Round 6-9
    [61,'Mike Evans','WR','INTEL'],[62,'Drake Maye','QB','TARGET'],[63,'Jayden Daniels','QB','TARGET'],[64,'Joe Burrow','QB','TARGET'],[66,'Jalen Hurts','QB','TARGET'],
    [67,'Tucker Kraft','TE','TARGET'],[68,'Rhamondre Stevenson','RB','INTEL'],[69,'Marvin Harrison Jr.','WR','TARGET'],[72,'Caleb Williams','QB','TARGET'],[73,'Brian Thomas Jr.','WR','TARGET'],
    [75,'Justin Herbert','QB','TARGET'],[76,'Jonathon Brooks','RB','TARGET'],[77,'DK Metcalf','WR','INTEL'],[79,'Trevor Lawrence','QB','TARGET'],[80,'Dak Prescott','QB','TARGET'],
    [83,'Rico Dowdle','RB','TARGET'],[84,'J.K. Dobbins','RB','TARGET'],[86,'Michael Wilson','WR','TARGET'],[88,'George Kittle','TE','TARGET'],[89,'Jacory Croskey-Merritt','RB','INTEL'],
    [90,'Stefon Diggs','WR','TARGET'],[91,'Blake Corum','RB','TARGET'],[93,'Chuba Hubbard','RB','TARGET'],[95,'Jordan Addison','WR','TARGET'],[97,'Brock Purdy','QB','TARGET'],
    [99,'Courtland Sutton','WR','TARGET'],[101,'Bo Nix','QB','EXPERT'],[103,'Jordan Mason','RB','TARGET'],[107,'Dalton Kincaid','TE','TARGET'],

    // Round 10+
    [109,'RJ Harvey','RB','TARGET'],[112,'Matthew Stafford','QB','TARGET'],[114,'Kyler Murray','QB','INTEL'],[115,'Kenny Gainwell','RB','TARGET'],[116,'Rachaad White','RB','TARGET'],
    [117,'Dallas Goedert','TE','TARGET'],[118,'Jared Goff','QB','TARGET'],[119,'Patrick Mahomes','QB','TARGET'],[120,'Travis Kelce','TE','TARGET'],[123,'Aaron Jones','RB','TARGET'],
    [124,'Jordan Love','QB','TARGET'],[125,'Jakobi Meyers','WR','TARGET'],[127,'Keaton Mitchell','RB','TARGET'],[129,'MarShawn Lloyd','RB','TARGET'],[133,'Woody Marks','RB','TARGET'],
    [137,'Baker Mayfield','QB','TARGET'],[139,'Tyler Allgeier','RB','TARGET'],[146,'Jake Ferguson','TE','TARGET'],[148,'Keenan Allen','WR','TARGET'],[151,'Dalton Schultz','TE','TARGET'],
    [152,'Deebo Samuel Sr.','WR','TARGET'],[154,'Jalen McMillan','WR','TARGET'],[158,'Chig Okonkwo','TE','TARGET'],[159,'Terrance Ferguson','TE','TARGET'],[161,'Braelon Allen','RB','TARGET'],
    [163,'Brian Robinson','RB','TARGET'],[164,'C.J. Stroud','QB','TARGET'],[166,'Daniel Jones','QB','TARGET'],[168,'Brenton Strange','TE','TARGET'],[171,'Rams D/ST','DEF','INTEL'],
    [186,'Alvin Kamara','RB','TARGET'],[197,'Malik Washington','WR','TARGET']
  ].map(([rank,name,pos,source])=>({rank,name,pos,source}));

  const HARD_AVOID = new Set([
    'Sam LaPorta','Rashid Shaheed','Khalil Shakir','Sam Darnold','Hunter Henry','Jerry Jeudy','Keon Coleman'
  ]);

  const pool = PLAYERS.filter(p=>!HARD_AVOID.has(p.name));

  const slotProfiles = {
    1:['Anchor with the best workload available.','Take the elite RB anchor, then use the long turn to attack WR value. Do not panic because of the wait.','Preferred first 3: RB / WR / WR.'],
    2:['Same elite-RB advantage as Pick 1.','Gibbs/Bijan is the cleanest start. Repair WR immediately at the 2/3 turn.','Preferred first 3: RB / WR / WR.'],
    3:['Boone decision point: beat the RB cliff or take elite WR.','Taylor is the RB-cliff play; Chase/Puka is the elite-WR play. Whichever position you skip becomes the next priority.','Preferred first 3: RB-WR-WR or WR-RB-WR.'],
    4:['Elite WR territory with RB access coming back.','Start Chase/Puka unless Taylor falls. Get a real RB in Round 2 or 3.','Preferred first 3: WR / RB / WR.'],
    5:['Flexible middle slot.','Take the elite value and stay balanced rather than forcing a build.','Preferred first 3: WR-RB-WR or RB-WR-WR.'],
    6:['Middle-board flexibility.','Take the best elite WR/RB left. Use Round 2 to secure RB if you opened WR.','By Round 5: at least 2 RB and 2 WR.'],
    7:['Hammer spot.','Amon-Ra/JSN/Cook area, then attack the Round 2 RB tier hard.','Preferred first 3: WR-RB-WR or RB-WR-WR.'],
    8:['Respect the Round 2 RB tier.','JSN/Cook/Amon-Ra are clean starts. If Chase Brown/Achane/Henry/Walker survives, hammer RB.','Preferred first 3: RB-WR-WR or WR-RB-WR.'],
    9:['Back-half value.','Exploit whichever side of RB/WR the room gives you, but aim to have one RB through two rounds.','Preferred first 3: RB-WR-WR or WR-RB-WR.'],
    10:['Think in pairs.','Treat 1.10 + 2.03 as one package. A small ADP reach is fine because the player will not make it back.','Preferred turn: RB + WR; RB + RB if the tier falls.'],
    11:['Create a positional advantage at the turn.','CeeDee/Jefferson/Saquon are anchors. Bowers is legitimate if he reaches you.','Preferred turn: WR/RB + RB/WR; elite TE can replace one side.'],
    12:['Two picks together.','Take the two cornerstones you actually want. Do not obsess over ADP when 22 picks pass before you return.','Preferred turn: WR + RB or RB + RB.']
  };

  const rules = {
    1:{focus:['RB','WR'],label:'CORNERSTONE',note:'Elite RB/WR only. No forced QB or TE.',expert:'Boone: account for the coming RB cliff. Pianowski: Amon-Ra is an early anchor.'},
    2:{focus:['RB','WR','TE'],label:'HAMMER RB VALUE',note:'This is the strongest early RB pocket. Chase Brown, Achane, Henry and Walker are priority types.',expert:'Boone called Round 2 a strong RB tier. Pianowski specifically loves Chase Brown here.'},
    3:{focus:['WR','RB','TE','QB'],label:'LEAN WR / VALUE ONLY',note:'RB risk rises. Prefer WR unless a trustworthy volume back or elite value falls.',expert:'Boone noted experts leaned WR here. Smyth likes Javonte around the back of Round 3.'},
    4:{focus:['WR','RB','TE'],label:'WR VALUE',note:'Build WR. Ladd is a preferred target; Etienne is the volume-RB exception.',expert:'Pianowski likes Ladd in Round 4. Smyth upgraded Etienne.'},
    5:{focus:['RB','WR','TE','QB'],label:'LAST STRONG RB WINDOW',note:'If RB2 is missing, attack it now. Otherwise take the best WR/TE/QB value.',expert:'Boone: Round 5 is often the last dependable-volume RB window. Smyth likes Bucky.'},
    6:{focus:['TE','WR','QB','RB'],label:'TE / QB VALUE STARTS',note:'Kraft is a highlighted TE value. Elite QB is fine if it falls; waiting is still viable.',expert:'Smyth likes Tucker Kraft around Round 6.'},
    7:{focus:['RB','WR','QB','TE'],label:'FILL STARTERS',note:'Address RB if light; otherwise keep taking upside WR/QB/TE value.',expert:'Do not force a mediocre player merely to fill a position.'},
    8:{focus:['WR','RB','QB','TE'],label:'VALUE + UPSIDE',note:'Good WR/QB value area. Corum is a preferred upside RB.',expert:'Pianowski likes Blake Corum as a later upside back.'},
    9:{focus:['RB','WR','QB','TE'],label:'UPSIDE / CONTINGENCY',note:'Build RB contingency and take a falling QB if the value is obvious.',expert:'Start shifting toward upside and role-change backs.'},
    10:{focus:['QB','RB','WR','TE'],label:'LATE-QB SWEET SPOT',note:'If you waited at QB, this is where that strategy should pay.',expert:'Yahoo mock takeaways support late-QB builds.'},
    11:{focus:['RB','WR','QB','TE'],label:'BENCH UPSIDE',note:'Prioritize players whose role can grow, not low-ceiling depth.',expert:'Use bench spots for upside, not safety-only veterans.'},
    12:{focus:['RB','WR','QB','TE'],label:'HANDCUFF / STACK VALUE',note:'Target contingency backs and cheap stack partners.',expert:'Late-round correlation and contingent value matter more now.'},
    13:{focus:['RB','WR','TE','QB'],label:'LOTTERY TICKETS',note:'Take players one injury or role change away from relevance.',expert:'Upside over floor.'},
    14:{focus:['RB','WR','TE','DEF'],label:'LAST SKILL / D-ST',note:'Take one last upside skill player or Rams D/ST if you are ready for defense.',expert:'Do not reach for defense early.'},
    15:{focus:['DEF','RB','WR','TE'],label:'DEF / KICKER LAST',note:'Rams D/ST if available. Otherwise use the final pick for D/ST or kicker rather than sacrificing skill-player upside earlier.',expert:'Boone: defense and kicker belong at the end.'}
  };

  const r1BySlot = {
    1:['Jahmyr Gibbs','Bijan Robinson',"Ja'Marr Chase"],2:['Bijan Robinson','Jahmyr Gibbs',"Ja'Marr Chase"],3:['Jonathan Taylor',"Ja'Marr Chase",'Puka Nacua'],
    4:["Ja'Marr Chase",'Puka Nacua','Jonathan Taylor'],5:['Puka Nacua','Jonathan Taylor','Amon-Ra St. Brown'],6:['Amon-Ra St. Brown','Puka Nacua','Christian McCaffrey'],
    7:['Amon-Ra St. Brown','Jaxon Smith-Njigba','James Cook'],8:['Jaxon Smith-Njigba','James Cook','Amon-Ra St. Brown'],9:['James Cook','Jaxon Smith-Njigba','Saquon Barkley'],
    10:['Saquon Barkley','CeeDee Lamb','James Cook'],11:['CeeDee Lamb','Justin Jefferson','Saquon Barkley'],12:['Justin Jefferson','CeeDee Lamb','Saquon Barkley']
  };

  const overallPick=(slot,round)=>round%2?((round-1)*12+slot):(round*12-slot+1);

  function findByName(name){return pool.find(p=>p.name===name)}

  function choicesFor(slot,round){
    if(round===1)return r1BySlot[slot].map(findByName).filter(Boolean);
    if(round===15){
      const rams=findByName('Rams D/ST');
      const late=pool.filter(p=>['RB','WR','TE'].includes(p.pos)).sort((a,b)=>Math.abs(a.rank-overallPick(slot,round))-Math.abs(b.rank-overallPick(slot,round))).slice(0,2);
      return [rams,...late].filter(Boolean).slice(0,3);
    }
    const overall=overallPick(slot,round);
    const focus=rules[round].focus;
    return pool
      .filter(p=>p.pos!=='DEF')
      .map(p=>{
        const posPenalty=Math.max(0,focus.indexOf(p.pos))*9 + (focus.includes(p.pos)?0:45);
        const reachPenalty=p.rank<overall?Math.abs(p.rank-overall)*1.18:Math.abs(p.rank-overall);
        const sourceBonus=p.source==='TARGET'?-4:p.source==='INTEL'?-2:0;
        return {...p,score:reachPenalty+posPenalty+sourceBonus};
      })
      .sort((a,b)=>a.score-b.score||a.rank-b.rank)
      .slice(0,3);
  }

  function render(slot){
    document.querySelectorAll('#slotTabs button').forEach(b=>b.classList.toggle('active',Number(b.dataset.slot)===slot));
    const [headline,approach,build]=slotProfiles[slot];
    $('slotTitle').textContent=`PICK ${slot}`;
    $('slotHeadline').textContent=headline;
    $('slotApproach').textContent=approach;
    $('slotBuild').textContent=build;

    $('rounds').innerHTML=Array.from({length:15},(_,i)=>{
      const round=i+1, overall=overallPick(slot,round), rule=rules[round], picks=choicesFor(slot,round);
      return `<article class="round-card">
        <div class="round-head"><b>ROUND ${round}</b><span>Your pick ≈ #${overall}<br>${rule.label}</span></div>
        <div class="focus">PRIORITY: ${rule.focus.join(' → ')}</div>
        <div class="choices">${picks.map((p,j)=>`<div class="choice ${j===0?'hot':''}"><span class="num">${j+1}</span><span class="name">${p.name}</span><span class="meta">${p.pos} · Y#${p.rank}<br>${p.source}</span></div>`).join('')}</div>
        <div class="round-note">${rule.note}</div>
        <div class="expert-note">${rule.expert}</div>
      </article>`;
    }).join('');
  }

  $('slotTabs').innerHTML=Array.from({length:12},(_,i)=>`<button data-slot="${i+1}">PICK ${i+1}</button>`).join('');
  $('slotTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>render(Number(b.dataset.slot)));
  render(7);
})();
