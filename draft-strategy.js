(() => {
  'use strict';

  const $=id=>document.getElementById(id);

  // Static manual study guide. No Supabase. No live draft state. No extension data.
  const roundPools={
    1:[
      [1,'Jahmyr Gibbs','RB'],[2,'Bijan Robinson','RB'],[3,"Ja'Marr Chase",'WR'],[4,'Puka Nacua','WR'],[5,'Jonathan Taylor','RB'],[6,'Christian McCaffrey','RB'],[7,'Amon-Ra St. Brown','WR'],[8,'Jaxon Smith-Njigba','WR'],[9,'James Cook','RB'],[10,'Saquon Barkley','RB'],[11,'CeeDee Lamb','WR'],[13,'Justin Jefferson','WR']
    ],
    2:[
      [14,'Chase Brown','RB'],[16,'Omarion Hampton','RB'],[12,'Kenneth Walker III','RB'],[15,"De'Von Achane",'RB'],[17,'Derrick Henry','RB'],[18,'Nico Collins','WR'],[19,'Brock Bowers','TE'],[20,'Drake London','WR'],[21,'Ashton Jeanty','RB'],[22,'A.J. Brown','WR'],[23,'George Pickens','WR'],[24,'Malik Nabers','WR']
    ],
    3:[
      [25,'Chris Olave','WR'],[26,'DeVonta Smith','WR'],[27,'Kyren Williams','RB'],[28,'Tee Higgins','WR'],[29,'Trey McBride','TE'],[30,'Breece Hall','RB'],[31,'Josh Allen','QB'],[32,'Jeremiyah Love','RB'],[33,'Zay Flowers','WR'],[34,'Jaylen Waddle','WR'],[35,'Javonte Williams','RB'],[36,'Rashee Rice','WR']
    ],
    4:[
      [37,'Colston Loveland','TE'],[38,'Tetairoa McMillan','WR'],[39,'Ladd McConkey','WR'],[40,'Garrett Wilson','WR'],[41,'Travis Etienne Jr.','RB'],[42,"D'Andre Swift",'RB'],[43,'Emeka Egbuka','WR'],[44,'Josh Jacobs','RB'],[45,'Luther Burden III','WR'],[46,'Terry McLaurin','WR'],[47,'Tyler Warren','TE'],[48,'DJ Moore','WR']
    ],
    5:[
      [49,'Cam Skattebo','RB'],[50,'Lamar Jackson','QB'],[51,'Rome Odunze','WR'],[52,'Jameson Williams','WR'],[53,'Bucky Irving','RB'],[54,'Christian Watson','WR'],[55,'Bhayshul Tuten','RB'],[56,'Parker Washington','WR'],[57,'Davante Adams','WR'],[58,'Quinshon Judkins','RB'],[59,'David Montgomery','RB'],[60,'Jadarian Price','RB']
    ],
    6:[
      [61,'Mike Evans','WR'],[62,'Drake Maye','QB'],[63,'Jayden Daniels','QB'],[64,'Joe Burrow','QB'],[65,'TreVeyon Henderson','RB'],[66,'Jalen Hurts','QB'],[67,'Tucker Kraft','TE'],[68,'Rhamondre Stevenson','RB'],[69,'Marvin Harrison Jr.','WR'],[70,'Jaylen Warren','RB'],[71,'Sam LaPorta','TE'],[72,'Caleb Williams','QB']
    ],
    7:[
      [73,'Brian Thomas Jr.','WR'],[74,'Carnell Tate','WR'],[75,'Justin Herbert','QB'],[76,'Jonathon Brooks','RB'],[77,'DK Metcalf','WR'],[78,'Harold Fannin Jr.','TE'],[79,'Trevor Lawrence','QB'],[80,'Dak Prescott','QB'],[81,'Kyle Pitts','TE'],[82,'Tony Pollard','RB'],[83,'Rico Dowdle','RB'],[84,'J.K. Dobbins','RB']
    ],
    8:[
      [85,'Chris Godwin Jr.','WR'],[86,'Michael Wilson','WR'],[87,'Josh Downs','WR'],[88,'George Kittle','TE'],[89,'Jacory Croskey-Merritt','RB'],[90,'Stefon Diggs','WR'],[91,'Blake Corum','RB'],[92,"De'Zhaun Stribling",'WR'],[93,'Chuba Hubbard','RB'],[94,'Quentin Johnston','WR'],[95,'Jordan Addison','WR'],[96,'Jayden Reed','WR']
    ],
    9:[
      [97,'Brock Purdy','QB'],[98,'Alec Pierce','WR'],[99,'Courtland Sutton','WR'],[100,'KC Concepcion','WR'],[101,'Bo Nix','QB'],[102,'Jaxson Dart','QB'],[103,'Jordan Mason','RB'],[104,'Matthew Golden','WR'],[105,'Michael Pittman Jr.','WR'],[106,'Makai Lemon','WR'],[107,'Dalton Kincaid','TE'],[108,'Kyle Monangai','RB']
    ],
    10:[
      [109,'RJ Harvey','RB'],[110,"Wan'Dale Robinson",'WR'],[111,'Chris Rodriguez Jr.','RB'],[112,'Matthew Stafford','QB'],[113,'Jalen Coker','WR'],[114,'Kyler Murray','QB'],[115,'Kenny Gainwell','RB'],[116,'Rachaad White','RB'],[117,'Dallas Goedert','TE'],[118,'Jared Goff','QB'],[119,'Patrick Mahomes','QB'],[120,'Travis Kelce','TE']
    ],
    11:[
      [121,'Isaiah Likely','TE'],[122,'Romeo Doubs','WR'],[123,'Aaron Jones','RB'],[124,'Jordan Love','QB'],[125,'Jakobi Meyers','WR'],[126,'Jordyn Tyson','WR'],[127,'Keaton Mitchell','RB'],[128,'Mike Washington Jr.','RB'],[129,'MarShawn Lloyd','RB'],[130,'Xavier Worthy','WR'],[131,'Ricky Pearsall','WR'],[132,'Jayden Higgins','WR']
    ],
    12:[
      [133,'Woody Marks','RB'],[134,'Malik Willis','QB'],[135,'Rashid Shaheed','WR'],[136,'Mark Andrews','TE'],[137,'Baker Mayfield','QB'],[138,'Tyler Shough','QB'],[139,'Tyler Allgeier','RB'],[140,'Tank Bigsby','RB'],[141,'Khalil Shakir','WR'],[142,'Tyjae Spears','RB'],[143,'Juwan Johnson','TE'],[144,'Jonah Coleman','RB']
    ],
    13:[
      [145,'Denzel Boston','WR'],[146,'Jake Ferguson','TE'],[147,'Zach Charbonnet','RB'],[148,'Keenan Allen','WR'],[149,'Adonai Mitchell','WR'],[150,'Tre Tucker','WR'],[151,'Dalton Schultz','TE'],[152,'Deebo Samuel Sr.','WR'],[153,'Sam Darnold','QB'],[154,'Jalen McMillan','WR'],[155,'Ray Davis','RB'],[156,'Dontayvion Wicks','WR']
    ],
    14:[
      [157,'Texans D/ST','DEF'],[158,'Chig Okonkwo','TE'],[159,'Terrance Ferguson','TE'],[160,'Pat Bryant','WR'],[161,'Braelon Allen','RB'],[162,'Kaelon Black','RB'],[163,'Brian Robinson','RB'],[164,'C.J. Stroud','QB'],[165,'Ryan Flournoy','WR'],[166,'Daniel Jones','QB'],[167,'Hunter Henry','TE'],[168,'Brenton Strange','TE']
    ],
    15:[
      [169,'Brandon Aubrey','K'],[170,'Emmett Johnson','RB'],[171,'Rams D/ST','DEF'],[172,'Caleb Douglas','WR'],[173,"Ja'Kobi Lane",'WR'],[174,'Kayshon Boutte','WR'],[175,'Travis Hunter','WR'],[176,'Broncos D/ST','DEF'],[177,'Seahawks D/ST','DEF'],[178,'Cyrus Allen','WR'],[179,'Jalen Nailor','WR'],[180,'Isiah Pacheco','RB']
    ]
  };

  const r1BySlot={
    1:['Jahmyr Gibbs','Bijan Robinson',"Ja'Marr Chase"],
    2:['Bijan Robinson','Jahmyr Gibbs',"Ja'Marr Chase"],
    3:['Jonathan Taylor',"Ja'Marr Chase",'Puka Nacua'],
    4:["Ja'Marr Chase",'Puka Nacua','Jonathan Taylor'],
    5:['Puka Nacua','Jonathan Taylor','Amon-Ra St. Brown'],
    6:['Amon-Ra St. Brown','Puka Nacua','Christian McCaffrey'],
    7:['Amon-Ra St. Brown','Jaxon Smith-Njigba','James Cook'],
    8:['Jaxon Smith-Njigba','James Cook','Amon-Ra St. Brown'],
    9:['James Cook','Jaxon Smith-Njigba','Saquon Barkley'],
    10:['Saquon Barkley','CeeDee Lamb','James Cook'],
    11:['CeeDee Lamb','Justin Jefferson','Saquon Barkley'],
    12:['Justin Jefferson','CeeDee Lamb','Saquon Barkley']
  };

  const slotProfiles={
    1:{headline:'Anchor the roster with the best workload in football.',approach:'Take the elite RB anchor, then use the long turn to attack WR value. Do not panic because of the wait.',build:'Preferred first 3 rounds: RB / WR / WR. By Round 5: 2 RB + 3 WR, or 2 RB + 2 WR + elite TE.'},
    2:{headline:'Same advantage as Pick 1: secure an elite RB and let WR value come back.',approach:'Gibbs/Bijan is the cleanest start. The next two picks should normally repair WR immediately.',build:'Preferred first 3 rounds: RB / WR / WR. QB only if an elite value falls.'},
    3:{headline:'This is the Boone decision point: beat the RB cliff or take an elite WR.',approach:'Jonathan Taylor is the RB-cliff play. Chase/Puka is the elite-WR play. Whichever position you skip in Round 1 becomes the Round 2-3 priority.',build:'Preferred first 3 rounds: RB-WR-WR or WR-RB-WR. Stay balanced.'},
    4:{headline:'Elite WR territory with enough RB access at the next turn.',approach:'Start Chase/Puka unless Taylor falls. Then make sure one of Rounds 2-3 gives you a real RB1/RB2.',build:'Preferred first 3 rounds: WR / RB / WR.'},
    5:{headline:'Flexible middle slot: take the elite value and build balance.',approach:'Puka/Amon-Ra/Taylor type start. You are not forced into one construction because the waits are manageable.',build:'Preferred first 3 rounds: WR-RB-WR or RB-WR-WR.'},
    6:{headline:'Middle-board flexibility: no need to reach.',approach:'Take the best elite WR/RB left. Use Round 2 to secure a strong RB if you opened WR.',build:'By Round 5: at least 2 RB and 2 WR; elite TE can replace the third WR.'},
    7:{headline:'A great hammer spot: Amon-Ra/JSN/Cook and then attack the Round 2 RB tier.',approach:'This slot lets you combine a first-round WR with Chase Brown/Achane/Henry-type RB value, or start RB and come back with WR.',build:'Preferred first 3 rounds: WR-RB-WR or RB-WR-WR. Do not leave Round 2 without an RB unless the WR value is absurd.'},
    8:{headline:'Stay flexible, but respect the Round 2 running backs.',approach:'JSN/Cook/Amon-Ra are the clean starts. Round 2 is where the strong RB tier should be hammered if available.',build:'Preferred first 3 rounds: RB-WR-WR or WR-RB-WR.'},
    9:{headline:'Back-half value: exploit whichever side of RB/WR the room gives you.',approach:'Cook/JSN/Saquon-type start. Do not force RB if the room gifts an elite WR, but aim for one RB through two rounds.',build:'Preferred first 3 rounds: RB-WR-WR or WR-RB-WR.'},
    10:{headline:'Think in pairs, not isolated picks.',approach:'Your 1.10 and 2.03 picks are a package. A small ADP reach is fine because the player will not make it back another 20+ selections.',build:'Preferred turn: RB + WR. Alternate: RB + RB if the Round 2 RB tier is falling.'},
    11:{headline:'Use the turn to create a positional advantage.',approach:'CeeDee/Jefferson/Saquon are anchors. Brock Bowers becomes a legitimate turn option if you want elite TE advantage.',build:'Preferred turn: WR/RB + RB/WR. Elite TE may replace one side if the value is right.'},
    12:{headline:'Two picks together: take the two cornerstones you actually want.',approach:'Do not obsess over ADP at the 1/2 turn. You will wait 22 picks, so take both players you would hate to lose.',build:'Preferred turn: WR + RB or RB + RB. Jefferson/CeeDee plus Chase Brown/Henry/Achane-type RB is the ideal shape.'}
  };

  const rules={
    1:{focus:['RB','WR'],label:'CORNERSTONE',note:'Take an elite foundation player. Do not draft QB or TE here.',expert:'Boone emphasized avoiding the coming RB cliffs; Pianowski is especially high on Amon-Ra.'},
    2:{focus:['RB','WR','TE'],label:'HAMMER THE RB TIER',note:'This is the strongest Round 2 RB pocket. Chase Brown, Achane, Henry, Walker/Hampton are priority targets.',expert:'Boone called the Round 2 RB group strong regardless of your Round 1 direction. Pianowski calls Chase Brown a perfect Round 2 pick.'},
    3:{focus:['WR','TE','QB','RB'],label:'LEAN WR / VALUE ONLY',note:'RB risk rises here. Prefer WR unless a trustworthy volume back or elite positional value falls.',expert:'Boone noted most experts chose WR in Round 3 because the backs after the top tier carry more risk. Smyth likes Javonte near the end of this round.'},
    4:{focus:['WR','RB','TE'],label:'WR VALUE',note:'Build your starting WR room. Ladd McConkey is a preferred target; Etienne is the RB-volume exception.',expert:'Pianowski calls Ladd a perfect Round 4 target. Smyth upgraded Etienne because of projected volume.'},
    5:{focus:['RB','WR','TE','QB'],label:'LAST STRONG RB WINDOW',note:'If you still need RB2, attack it now. Otherwise take WR value or elite TE/QB value.',expert:'Boone described Round 5 as often the last train for guaranteed RB volume plus upside. Bucky is a Smyth value.'},
    6:{focus:['TE','WR','QB','RB'],label:'TE/QB VALUE STARTS',note:'Tucker Kraft is a highlighted TE value. Elite QBs can be taken if they fall, but waiting remains viable.',expert:'Smyth specifically likes Kraft around Round 6. Late-QB builds remain strong.'},
    7:{focus:['RB','WR','QB','TE'],label:'FILL THE STARTERS',note:'If you are light at RB, address it. Otherwise keep taking upside WR/QB/TE value.',expert:'Do not chase a mediocre player just to fill a position; keep the roster balanced.'},
    8:{focus:['WR','QB','RB','TE'],label:'VALUE + UPSIDE',note:'This is a good WR/QB value round. Blake Corum is a preferred upside RB if available.',expert:'Pianowski likes Corum as a floor-plus-upside pick.'},
    9:{focus:['RB','QB','WR','TE'],label:'UPSIDE BACKS / LATE QB',note:'Start building contingency RBs and take a falling QB if the value is obvious.',expert:'Yahoo mock takeaways highlighted intriguing backup RBs in this range.'},
    10:{focus:['QB','RB','WR','TE'],label:'LATE-QB SWEET SPOT',note:'If you waited at QB, this is where the strategy starts paying you back.',expert:'Yahoo staff mock takeaways specifically called out late-round QB strategy paying off.'},
    11:{focus:['RB','WR','QB','TE'],label:'BENCH UPSIDE',note:'Prioritize players who can become weekly starters, not low-ceiling bench fillers.',expert:'Think handcuff, emerging WR, or cheap stack partner.'},
    12:{focus:['RB','WR','QB','TE'],label:'SWING FOR CEILING',note:'Take role-change upside, handcuffs and cheap QB/TE values.',expert:'Your bench should win you weeks if an injury or depth-chart change hits.'},
    13:{focus:['RB','WR','TE','QB'],label:'FINAL SKILL DEPTH',note:'Use this round on one more upside skill player before DEF/K.',expert:'Avoid boring low-ceiling depth when an injury-away RB or emerging WR is available.'},
    14:{focus:['DEF','RB','WR','TE'],label:'DEF OR LAST UPSIDE',note:'If a preferred defense is available, take it. Otherwise one final upside skill player is fine.',expert:'Boone and the expert room pushed defenses/kickers to the final rounds.'},
    15:{focus:['K','DEF','RB','WR'],label:'KICKER / FINAL DART',note:'Finish with kicker or defense. If both are already filled, take the best final upside dart.',expert:'Do not spend meaningful draft capital on kicker or D/ST.'}
  };

  const boost={
    'Jahmyr Gibbs':4,'Bijan Robinson':4,'Jonathan Taylor':4,"Ja'Marr Chase":3,'Puka Nacua':3,'Amon-Ra St. Brown':6,'Jaxon Smith-Njigba':2,'James Cook':3,
    'Chase Brown':7,"De'Von Achane":3,'Derrick Henry':5,'Kenneth Walker III':3,'Brock Bowers':4,'Nico Collins':5,'Drake London':2,'George Pickens':2,
    'Chris Olave':4,'Trey McBride':5,'Josh Allen':3,'Javonte Williams':6,'Ladd McConkey':7,'Travis Etienne Jr.':6,'Emeka Egbuka':3,'Terry McLaurin':3,'Tyler Warren':3,
    'Bucky Irving':6,'Bhayshul Tuten':2,'Drake Maye':2,'Jayden Daniels':2,'Tucker Kraft':7,'Rhamondre Stevenson':5,'Caleb Williams':2,
    'Justin Herbert':3,'Trevor Lawrence':3,'Blake Corum':7,'Chuba Hubbard':2,'Courtland Sutton':2,'Bo Nix':8,'Jordan Mason':3,'Matthew Golden':4,
    'RJ Harvey':5,'Matthew Stafford':3,'Kyler Murray':4,'Kenny Gainwell':3,'Jordan Love':5,'Jakobi Meyers':3,'Mike Washington Jr.':5,'MarShawn Lloyd':4,'Woody Marks':5,
    'Rashid Shaheed':3,'Tyler Allgeier':3,'Braelon Allen':4,'Ray Davis':3,
    'TreVeyon Henderson':-7,'David Montgomery':-5,'Khalil Shakir':-4,'Sam Darnold':-3,'Carnell Tate':-3
  };

  function overallPick(slot,round){return (round-1)*12+(round%2?slot:13-slot)}
  function withinRound(slot,round){return round%2?slot:13-slot}
  function findPlayer(round,name){return (roundPools[round]||[]).find(p=>p[1]===name)}

  function recommendations(slot,round){
    if(round===1){return r1BySlot[slot].map(name=>findPlayer(1,name)||[0,name,'—'])}
    const pool=roundPools[round]||[];
    const center=Math.round((withinRound(slot,round)-1)/11*(pool.length-1));
    const rule=rules[round];
    return pool.map((p,i)=>{
      const posIndex=rule.focus.indexOf(p[2]);
      const posPenalty=posIndex<0?7:posIndex*1.25;
      const distance=Math.abs(i-center)*2.1;
      const expert=boost[p[1]]||0;
      return {p,score:distance+posPenalty-expert*1.35};
    }).sort((a,b)=>a.score-b.score||a.p[0]-b.p[0]).slice(0,3).map(x=>x.p)
  }

  function render(slot){
    const profile=slotProfiles[slot];
    $('slotTitle').textContent=`PICK ${slot}`;
    $('slotHeadline').textContent=profile.headline;
    $('slotApproach').textContent=profile.approach;
    $('slotBuild').textContent=profile.build;

    $('slotTabs').querySelectorAll('button').forEach(b=>b.classList.toggle('active',Number(b.dataset.slot)===slot));

    $('rounds').innerHTML=Array.from({length:15},(_,i)=>i+1).map(round=>{
      const pick=overallPick(slot,round),rule=rules[round],choices=recommendations(slot,round);
      return `<article class="round-card">
        <div class="round-head"><b>ROUND ${round}</b><span>Your pick ≈ #${pick}<br>${rule.label}</span></div>
        <div class="focus">POSITION PRIORITY: ${rule.focus.join(' → ')}</div>
        <div class="choices">${choices.map((p,index)=>`<div class="choice ${(boost[p[1]]||0)>=5?'hot':''}"><span class="num">${index+1}</span><span class="name">${p[1]}</span><span class="meta">${p[2]} · Yahoo #${p[0]}</span></div>`).join('')}</div>
        <div class="round-note">${rule.note}</div>
        <div class="expert-note">${rule.expert}</div>
      </article>`;
    }).join('');

    history.replaceState(null,'',`#pick-${slot}`);
  }

  $('slotTabs').innerHTML=Array.from({length:12},(_,i)=>i+1).map(slot=>`<button data-slot="${slot}">PICK ${slot}</button>`).join('');
  $('slotTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>render(Number(b.dataset.slot)));

  const initial=Math.min(12,Math.max(1,Number((location.hash.match(/pick-(\d+)/)||[])[1])||7));
  render(initial);
})();