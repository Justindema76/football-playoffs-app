(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const POSITIONS = ['RB','WR','TE','QB'];

  // One market scale for everybody. These are current 2026 half-PPR market numbers,
  // cross-checked against Yahoo's Sept. 4 consensus/ADP plus current expert boards.
  // EXPERT means the player is backed by the Boone/expert research; the number is NOT
  // the expert-league pick number anymore.
  const PLAYERS = [
    [1.1,'Jahmyr Gibbs','RB','TARGET'],[2.0,'Bijan Robinson','RB','TARGET'],[3.1,"Ja'Marr Chase",'WR','TARGET'],[5.2,'Puka Nacua','WR','TARGET'],[5.5,'Christian McCaffrey','RB','INTEL'],[5.8,'Jonathan Taylor','RB','TARGET'],[6.5,'Jaxon Smith-Njigba','WR','TARGET'],[7.5,'Amon-Ra St. Brown','WR','TARGET'],[9.6,'James Cook','RB','TARGET'],[10.0,'CeeDee Lamb','WR','TARGET'],[11.8,'Justin Jefferson','WR','TARGET'],[13.8,"De'Von Achane",'RB','INTEL'],[13.9,'Saquon Barkley','RB','INTEL'],[15.5,'Chase Brown','RB','TARGET'],[16.1,'Derrick Henry','RB','EXPERT'],[16.9,'Kenneth Walker III','RB','INTEL'],
    [18.1,'Omarion Hampton','RB','EXPERT'],[18.3,'Ashton Jeanty','RB','EXPERT'],[18.8,'A.J. Brown','WR','EXPERT'],[19.3,'Josh Allen','QB','TARGET'],[19.5,'Brock Bowers','TE','TARGET'],[19.7,'Drake London','WR','TARGET'],[20.7,'Nico Collins','WR','TARGET'],[24.5,'George Pickens','WR','TARGET'],[24.5,'Trey McBride','TE','TARGET'],[25.3,'Kyren Williams','RB','EXPERT'],[27.9,'Jeremiyah Love','RB','EXPERT'],[30.3,'DeVonta Smith','WR','EXPERT'],[31.2,'Chris Olave','WR','EXPERT'],[31.3,'Javonte Williams','RB','TARGET'],[31.3,'Breece Hall','RB','EXPERT'],[31.3,'Lamar Jackson','QB','EXPERT'],[32.7,'Tee Higgins','WR','TARGET'],[34.6,'Zay Flowers','WR','EXPERT'],[35.0,'Rashee Rice','WR','EXPERT'],[35.6,'Malik Nabers','WR','TARGET'],[36.7,'Cam Skattebo','RB','TARGET'],[37.1,'Colston Loveland','TE','TARGET'],[39.7,'Travis Etienne Jr.','RB','TARGET'],
    [42.1,'Jaylen Waddle','WR','EXPERT'],[42.3,'Ladd McConkey','WR','TARGET'],[42.5,'Drake Maye','QB','TARGET'],[43.0,'Josh Jacobs','RB','EXPERT'],[43.3,'Tetairoa McMillan','WR','TARGET'],[45.7,'David Montgomery','RB','TARGET'],[46.0,"D'Andre Swift",'RB','TARGET'],[46.1,'Garrett Wilson','WR','EXPERT'],[47.8,'Joe Burrow','QB','TARGET'],[48.4,'Tyler Warren','TE','TARGET'],[49.7,'Emeka Egbuka','WR','TARGET'],[50.2,'Bucky Irving','RB','TARGET'],[53.4,'Luther Burden III','WR','INTEL'],[54.3,'Jalen Hurts','QB','TARGET'],[55.4,'TreVeyon Henderson','RB','EXPERT'],[55.7,'Tucker Kraft','TE','TARGET'],[56.3,'Terry McLaurin','WR','TARGET'],[57.4,'Quinshon Judkins','RB','EXPERT'],[57.7,'Sam LaPorta','TE','EXPERT'],[58.3,'Jadarian Price','RB','TARGET'],[58.7,'Jayden Daniels','QB','TARGET'],[60.0,'Jameson Williams','WR','EXPERT'],[60.7,'Davante Adams','WR','TARGET'],[61.9,'Bhayshul Tuten','RB','TARGET'],[63.0,'Jaylen Warren','RB','EXPERT'],
    [65.3,'Christian Watson','WR','EXPERT'],[65.9,'DJ Moore','WR','TARGET'],[66.3,'Mike Evans','WR','INTEL'],[67.2,'Caleb Williams','QB','TARGET'],[69.0,'Harold Fannin','TE','EXPERT'],[70.8,'Rome Odunze','WR','TARGET'],[71.0,'Parker Washington','WR','EXPERT'],[71.2,'Dak Prescott','QB','TARGET'],[72.7,'Justin Herbert','QB','TARGET'],[74.0,'Rhamondre Stevenson','RB','INTEL'],[74.1,'Kyle Pitts','TE','EXPERT'],[76.2,'Rico Dowdle','RB','TARGET'],[77.0,'Marvin Harrison Jr.','WR','TARGET'],[77.2,'George Kittle','TE','TARGET'],[79.0,'Carnell Tate','WR','EXPERT'],[80.6,'DK Metcalf','WR','INTEL'],[80.8,'Trevor Lawrence','QB','TARGET'],[82.0,'Brian Thomas Jr.','WR','TARGET'],[83.7,'Tony Pollard','RB','EXPERT'],[88.0,'Jordyn Tyson','WR','EXPERT'],[88.3,'Blake Corum','RB','TARGET'],[88.8,'Brock Purdy','QB','TARGET'],[90.6,'Dalton Kincaid','TE','TARGET'],[91.0,'Jordan Mason','RB','TARGET'],[91.4,'Jonathon Brooks','RB','TARGET'],[91.5,'Travis Kelce','TE','TARGET'],[91.8,'Jaxson Dart','QB','EXPERT'],[91.9,'Chuba Hubbard','RB','TARGET'],[92.0,'Alec Pierce','WR','EXPERT'],[94.4,'Jacory Croskey-Merritt','RB','INTEL'],[95.3,'RJ Harvey','RB','TARGET'],[96.1,'Chris Godwin','WR','EXPERT'],[96.3,'J.K. Dobbins','RB','TARGET'],[96.3,'Michael Wilson','WR','TARGET'],[96.4,'Jayden Reed','WR','EXPERT'],[97.6,'Patrick Mahomes','QB','TARGET'],[99.6,'Bo Nix','QB','EXPERT'],
    [101.0,'Matthew Stafford','QB','TARGET'],[101.8,'Courtland Sutton','WR','TARGET'],[104.5,'Stefon Diggs','WR','TARGET'],[104.6,'MarShawn Lloyd','RB','TARGET'],[105.5,'Dallas Goedert','TE','TARGET'],[106.7,'Aaron Jones','RB','TARGET'],[108.0,'Jordan Love','QB','TARGET'],[108.3,'Kyle Monangai','RB','EXPERT'],[109.2,"De'Zhaun Stribling",'WR','EXPERT'],[109.5,'Isaiah Likely','TE','EXPERT'],[110.1,'Quentin Johnston','WR','EXPERT'],[112.1,'Kyler Murray','QB','INTEL'],[115.0,'Mark Andrews','TE','EXPERT'],[115.8,'Jordan Addison','WR','TARGET'],[116.0,'Jared Goff','QB','TARGET'],[116.2,'Makai Lemon','WR','EXPERT'],[116.5,'Aaron Rodgers','QB','EXPERT'],[117.0,'Jake Ferguson','TE','TARGET'],[118.8,'Fernando Mendoza','QB','EXPERT'],[119.4,'Brian Robinson','RB','TARGET'],[119.6,'Kenny Gainwell','RB','TARGET'],[120.7,'Michael Pittman Jr.','WR','INTEL'],[121.0,'Josh Downs','WR','EXPERT'],[121.6,'Bryce Young','QB','EXPERT'],[123.1,'Mike Washington','RB','EXPERT'],[123.8,'Rachaad White','RB','TARGET'],[124.4,'Cam Ward','QB','EXPERT'],[124.5,'Juwan Johnson','TE','EXPERT'],[125.1,'Malik Willis','QB','EXPERT'],[125.3,'C.J. Stroud','QB','TARGET'],[125.4,'AJ Barner','TE','EXPERT'],[125.6,'Isiah Pacheco','RB','EXPERT'],[125.7,'Travis Hunter','WR','EXPERT'],[125.8,'Keenan Allen','WR','TARGET'],[125.9,'Alvin Kamara','RB','TARGET'],[126.6,'Dalton Schultz','TE','TARGET'],[126.8,"Ja'Kobi Lane",'WR','EXPERT'],[127.0,'KC Concepcion','WR','EXPERT'],[127.1,'Daniel Jones','QB','TARGET'],[127.3,'Deebo Samuel Sr.','WR','TARGET'],[127.6,'Hunter Henry','TE','EXPERT'],[127.9,'Braelon Allen','RB','TARGET'],[128.4,'Rashid Shaheed','WR','EXPERT'],[128.5,'T.J. Hockenson','TE','EXPERT'],[129.2,'Jalen Nailor','WR','EXPERT'],[129.3,'Jonah Coleman','RB','EXPERT'],[129.3,'Brenton Strange','TE','TARGET'],[129.7,'Tank Bigsby','RB','EXPERT'],[130.0,'Tyler Allgeier','RB','TARGET'],[130.4,'Zach Charbonnet','RB','EXPERT'],[130.5,'Kaelon Black','RB','EXPERT'],[130.7,'Woody Marks','RB','TARGET'],[130.8,'Tyrone Tracy Jr.','RB','EXPERT'],[131.7,'Keaton Mitchell','RB','TARGET'],[133.0,'Xavier Worthy','WR','EXPERT'],[133.0,'Jalen Coker','WR','EXPERT'],[138.0,'Baker Mayfield','QB','TARGET'],[141.0,'Chris Rodriguez','RB','EXPERT'],[142.0,'Tre Tucker','WR','EXPERT'],[143.0,'Tyjae Spears','RB','EXPERT'],[145.0,'Denzel Boston','WR','EXPERT'],[146.0,'Emmett Johnson','RB','EXPERT'],[147.0,"Wan'Dale Robinson",'WR','EXPERT'],[148.0,'Dylan Sampson','RB','EXPERT'],[150.0,'Romeo Doubs','WR','EXPERT'],[150.0,'Terrance Ferguson','TE','TARGET'],[151.0,'Matthew Golden','WR','EXPERT'],[154.0,'Jalen McMillan','WR','TARGET'],[158.0,'Chig Okonkwo','TE','TARGET'],[165.0,'Jaylin Noel','WR','EXPERT'],[170.0,'Kayshon Boutte','WR','EXPERT'],[174.0,'Dontayvion Wicks','WR','EXPERT'],[175.0,'Tank Dell','WR','EXPERT'],[178.0,'Adonai Mitchell','WR','EXPERT'],[197.0,'Malik Washington','WR','TARGET'],
    [150.0,'Rams D/ST','DEF','INTEL']
  ].map(([rank,name,pos,source])=>({rank,name,pos,source,tier:Math.ceil(rank/12)}));

  const SLOT_PROFILES = {
    1:['Front of every tier.','Boone philosophy: use the advantage of picking first in a tier. Take the premium player, then plan for the long wait before your next turn.','Do not assume a back-of-tier player will make it all the way around.'],
    2:['Near the front of every tier.','You can still attack premium tier values, but the next wait is long. Boone’s RB-cliff thinking matters more here than strict ADP.','Build RB/WR foundation first; QB/TE only when value is obvious.'],
    3:['Boone decision point.','Rankings are a guide, not a script. If the RB tier will be gone before your next selection, reaching slightly for the last strong-volume back is justified.','Preferred opening shape: RB-WR-WR or WR-RB-WR.'],
    4:['Early-middle of every tier.','Take the best value in your part of the tier and keep one eye on RB scarcity before the board comes back.','Avoid forcing a position just because of roster construction.'],
    5:['Middle-slot flexibility.','This slot gives you access to both sides of most tiers. Stay flexible while respecting the RB drop-offs.','Preferred opening shape: balanced RB/WR.'],
    6:['Middle of every tier.','Use the board. If RB dries up before your next pick, act now; if not, take the stronger WR/TE value.','By Round 5, aim for a solid RB/WR core.'],
    7:['Hammer spot.','This is a strong place to pair a first-round cornerstone with the Round 2 RB pocket.','Round 2 RB value matters here.'],
    8:['Back half of each tier.','You are closer to the turn, so slight reaches for players you will not see again are acceptable.','Do not wait for ADP permission if your guy will be gone.'],
    9:['Back-half value.','Exploit falling players, but assume the very front of each tier is normally gone by your pick.','Prioritize realistic survivors, not wish-list names.'],
    10:['Think in pairs.','Your picks are close to the turn. Treat consecutive selections as one roster-building decision and accept small reaches.','RB + WR is the default early shape.'],
    11:['Turn leverage.','Take the best realistic survivor, then use the second pick to attack scarcity or positional edge.','Elite TE can be a legitimate turn play.'],
    12:['The turn.','The first 11 players of a tier are usually gone. Start at the back of the tier and spill into the next one.','Take the two cornerstones you would hate to lose before the long wait.']
  };

  const ROUND_PLAN = {
    1:{label:'CORNERSTONE',priority:['RB','WR'],modes:{RB:'PRIMARY',WR:'PRIMARY',TE:'WAIT',QB:'WAIT'},note:'Elite RB/WR only. Boone: rankings are a guide, and RB scarcity should affect the decision.',expert:'Build around the best realistic survivor near your exact pick.'},
    2:{label:'HAMMER RB VALUE',priority:['RB','WR','TE'],modes:{RB:'PRIMARY',WR:'FALLBACK',TE:'ELITE VALUE',QB:'WAIT'},note:'Boone sees this as the strongest early RB pocket. Attack RB unless a clearly better WR/elite-TE value falls.',expert:'Round 2 is the time to beat the RB cliff, not chase a back after it.'},
    3:{label:'LEAN WR / VALUE ONLY',priority:['WR','RB','TE','QB'],modes:{RB:'VALUE ONLY',WR:'PRIMARY',TE:'ELITE FALL',QB:'JOSH ALLEN ONLY'},note:'The RBs get riskier. Prefer WR unless a trustworthy volume back or elite TE falls. QB: Josh Allen only if he reaches your pick.',expert:'Boone’s expert room leaned WR here because the RB quality became shakier.'},
    4:{label:'WR / ELITE TE',priority:['WR','TE','RB','QB'],modes:{RB:'VALUE ONLY',WR:'PRIMARY',TE:'PRIMARY',QB:'ALLEN / LAMAR'},note:'Do not force a bad RB. Elite-TE upside is worth considering. QB: Allen is a fall; Lamar becomes live at value.',expert:'Roster value matters more than blindly filling a position.'},
    5:{label:'LAST STRONG RB WINDOW',priority:['RB','WR','TE','QB'],modes:{RB:'PRIMARY',WR:'PRIMARY',TE:'VALUE',QB:'VALUE ONLY'},note:'Important RB decision point. BY END OF ROUND 5: aim for five RB/WR core pieces — normally 3 RB + 2 WR or 2 RB + 3 WR — unless you deliberately spent one early pick on elite QB/TE.',expert:'Boone treats Round 5 as a major RB decision point. Do not force QB if the core is thin.'},
    6:{label:'CORE FIRST, THEN QB/TE',priority:['RB','WR','TE','QB'],modes:{RB:'VALUE',WR:'PRIMARY',TE:'VALUE',QB:'IF CORE BUILT'},note:'If your Round-5 RB/WR core is built, QB or TE becomes guilt-free. If not, keep filling the core.',expert:'QB reminder: from here forward, take the proper-value quarterback instead of waiting just to wait.'},
    7:{label:'FILL STARTERS',priority:['RB','WR','QB','TE'],modes:{RB:'VALUE',WR:'PRIMARY',TE:'VALUE',QB:'IF CORE BUILT'},note:'Keep filling starters and take the best upside value. If you still do not have QB and the right one reaches you, this is a live QB round.',expert:'Stay flexible; the board decides whether this becomes QB/TE or more RB/WR.'},
    8:{label:'GET YOUR GUYS',priority:['RB','WR','TE','QB'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Boone “Get Your Guys” territory. Take players you believe can beat the slot. QB value is live if you waited.',expert:'Conviction matters more than tiny market-number differences here.'},
    9:{label:'BACKUP RB / QB VALUE',priority:['RB','QB','WR','TE'],modes:{RB:'UPSIDE',WR:'VALUE',TE:'VALUE',QB:'VALUE'},note:'Target contingent RB upside and late-QB discounts. If you still need QB, do not forget the position now.',expert:'This is where waiting on QB should start paying off.'},
    10:{label:'LATE-QB SWEET SPOT',priority:['QB','RB','WR','TE'],modes:{RB:'UPSIDE',WR:'VALUE',TE:'VALUE',QB:'PRIMARY'},note:'If you waited on QB, this is the strong final planned attack zone. Otherwise keep taking RB/WR upside.',expert:'Do not leave the draft without a QB plan.'},
    11:{label:'BENCH UPSIDE',priority:['RB','WR','QB','TE'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Use bench spots on players whose roles can grow.',expert:'Upside over safe low-ceiling depth.'},
    12:{label:'HANDCUFF / STACK VALUE',priority:['RB','WR','QB','TE'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Target contingency backs, cheap stacks and late breakouts.',expert:'One role change can make these picks matter.'},
    13:{label:'LOTTERY TICKETS',priority:['RB','WR','TE','QB'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Keep chasing upside. Do not spend the pick on defense yet unless skill value is exhausted.',expert:'Late picks should have a path to becoming useful.'},
    14:{label:'LAST SKILL / DEF',priority:['RB','WR','TE','DEF'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'WAIT'},note:'One last upside skill player is fine. Defense only enters now.',expert:'Do not draft defense early.'},
    15:{label:'DEF / KICKER LAST',priority:['DEF','K'],modes:{RB:'LAST UPSIDE',WR:'LAST UPSIDE',TE:'WAIT',QB:'WAIT'},note:'Boone still wants DEF/K at the end, but the RB/WR boxes show your final upside alternatives if you choose to wait one more pick.',expert:'Do not sacrifice earlier upside picks for DEF/K.'}
  };

  const FALL_TRIGGERS = {
    3:[
      {text:'QB CHECK: JOSH ALLEN ONLY. If Allen reaches your Round 3 pick, he is the only quarterback worth breaking the normal wait rule for.'},
      {text:'IF BROCK BOWERS SURVIVES TO YOUR ROUND 3 PICK → TAKE HIM. He has fallen past his normal elite-TE window.'}
    ],
    4:[
      {text:'QB CHECK: LAMAR JACKSON BECOMES LIVE. Allen is an obvious fall; otherwise Lamar is the elite-QB value check.'},
      {text:'IF TREY McBRIDE SURVIVES TO YOUR ROUND 4 PICK → TAKE HIM. This is the value point to stop waiting.'}
    ],
    5:[{text:'ROSTER CHECK: By the end of Round 5, aim for 5 RB/WR core pieces — 3 RB + 2 WR or 2 RB + 3 WR — unless an intentional elite QB/TE pick changed the build.'}],
    6:[{text:'QB CHECK: If the core is built and you still need QB, start taking the proper-value quarterback here.'}],
    9:[{text:'QB CHECK: If you waited this long, do not forget QB. Rounds 9–10 are the planned late-QB attack zone.'}]
  };

  const SOURCE_ORDER={TARGET:0,INTEL:1,EXPERT:2};
  const overallPick=(slot,round)=>round%2?((round-1)*12+slot):(round*12-slot+1);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function availabilityWindow(overall,round){
    const fall=round<=4?4:round<=8?7:10;
    const reach=round<=4?12:round<=8?18:28;
    return {min:Math.max(1,overall-fall),max:overall+reach};
  }

  function availabilityLabel(rank,overall){
    const d=rank-overall;
    if(d<-4)return 'IF STILL THERE';
    if(d<=3)return 'RIGHT IN RANGE';
    if(d<=10)return 'REALISTIC';
    if(d<=18)return 'REACH';
    return 'DEEP REACH';
  }

  function candidatesFor(round,pos,overall,recent){
    const mode=ROUND_PLAN[round].modes[pos]||'WAIT';
    if(mode==='WAIT')return {mode,options:[]};

    const limit=(pos==='RB'||pos==='WR')?4:2;
    const window=availabilityWindow(overall,round);
    const eligible=p=>p.pos===pos && p.rank>=window.min && p.rank<=window.max && (!recent.has(p.name) || round-recent.get(p.name)>2);

    // Use the exact snake pick and the player's current market number.
    // This deliberately allows a nearby player from an adjacent 12-pick tier to appear
    // as a fall/reach instead of pretending every draft room stops exactly at round borders.
    const candidates=PLAYERS.filter(eligible).sort((a,b)=>{
      const da=Math.abs(a.rank-overall),db=Math.abs(b.rank-overall);
      const sa=SOURCE_ORDER[a.source]??9,sb=SOURCE_ORDER[b.source]??9;
      return da-db||sa-sb||a.rank-b.rank;
    });

    return {mode,options:candidates.slice(0,limit).map(p=>({...p,status:availabilityLabel(p.rank,overall)}))};
  }

  function playerRow(p){
    const star=p.source==='TARGET'?'★ ':'';
    const source=p.source==='TARGET'?'YOUR TARGET':p.source==='INTEL'?'INTEL':'EXPERT';
    return `<div class="position-option"><div class="position-name">${star}${esc(p.name)}</div><div class="position-meta"><b>MARKET #${p.rank}</b> · ${esc(p.status)} · ${source}</div></div>`;
  }

  function positionBox(pos,result){
    const {mode,options}=result;
    const posClass=`pos-${pos.toLowerCase()}`;
    if(mode==='WAIT')return `<section class="position-box ${posClass} wait"><div class="position-title"><b>${pos}</b><span>WAIT</span></div><div class="wait-text">Boone build says do not spend this round here.</div></section>`;
    const body=options.length?options.map(playerRow).join(''):`<div class="wait-text">No approved ${pos} fits this pick window — do not force it.</div>`;
    return `<section class="position-box ${posClass}"><div class="position-title"><b>${pos}</b><span>${esc(mode)} · ${options.length} CHOICES</span></div>${body}</section>`;
  }

  function triggerBlock(round){
    const list=FALL_TRIGGERS[round]||[];
    return list.length?`<div class="fall-triggers">${list.map(t=>`<div class="fall-trigger">${esc(t.text)}</div>`).join('')}</div>`:'';
  }

  function render(slot){
    document.querySelectorAll('#slotTabs button').forEach(b=>b.classList.toggle('active',Number(b.dataset.slot)===slot));
    const [headline,approach,build]=SLOT_PROFILES[slot];
    $('slotTitle').textContent=`PICK ${slot}`;
    $('slotHeadline').textContent=headline;
    $('slotApproach').textContent=approach;
    $('slotBuild').textContent=build;

    const recent=new Map();
    const cards=[];

    for(let round=1;round<=15;round++){
      const overall=overallPick(slot,round),plan=ROUND_PLAN[round],results={};
      for(const pos of POSITIONS)results[pos]=candidatesFor(round,pos,overall,recent);

      Object.values(results).forEach(r=>r.options.forEach(p=>recent.set(p.name,round)));

      const ordered=plan.priority.filter(p=>POSITIONS.includes(p));
      const rest=POSITIONS.filter(p=>!ordered.includes(p));
      const all=[...ordered,...rest];

      cards.push(`<article class="round-card">
        <div class="round-head"><b>ROUND ${round}</b><span>Your snake pick ≈ #${overall}<br>${esc(plan.label)}</span></div>
        <div class="focus">BOONE PRIORITY: ${plan.priority.join(' → ')}</div>
        ${triggerBlock(round)}
        <div class="position-grid">${all.map(pos=>positionBox(pos,results[pos])).join('')}</div>
        <div class="round-note">${esc(plan.note)}</div>
        <div class="expert-note">${esc(plan.expert)}</div>
      </article>`);
    }

    $('rounds').innerHTML=cards.join('');
  }

  $('slotTabs').innerHTML=Array.from({length:12},(_,i)=>`<button type="button" data-slot="${i+1}">PICK ${i+1}</button>`).join('');
  $('slotTabs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>render(Number(b.dataset.slot))));
  render(1);
})();
