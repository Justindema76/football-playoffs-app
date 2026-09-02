(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const POSITIONS = ['RB','WR','TE','QB'];

  // Manual study guide only. No Supabase, no live board, no extension.
  // Approved pool = explicit targets + positive current Intel + expert additions.
  // Tier = current 12-player Yahoo tier. Tabs are pick-aware inside each tier.
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
    1:['Front of every tier.','Boone philosophy: use the advantage of picking first in a tier. Take the premium player, then plan for the long wait before your next turn.','Do not assume a back-of-tier player will make it all the way around.'],
    2:['Near the front of every tier.','You can still attack premium tier values, but the next wait is long. Boone’s RB-cliff thinking matters more here than strict ADP.','Build RB/WR foundation first; QB/TE only when value is obvious.'],
    3:['Boone decision point.','Rankings are a guide, not a script. If the RB tier will be gone before your next selection, reaching slightly for the last strong-volume back is justified.','Preferred opening shape: RB-WR-WR or WR-RB-WR.'],
    4:['Early-middle of every tier.','Take the best value in your part of the tier and keep one eye on RB scarcity before the board comes back.','Avoid forcing a position just because of roster construction.'],
    5:['Middle-slot flexibility.','This slot gives you enough access to both sides of most tiers. Boone mentality: stay flexible while respecting the RB drop-offs.','Preferred opening shape: balanced RB/WR.'],
    6:['Middle of every tier.','Use the board. If RB dries up before your next pick, act now; if not, take the stronger WR/TE value.','By Round 5, aim for a solid RB/WR core.'],
    7:['Hammer spot.','This is a great place to pair a first-round cornerstone with the strong Round 2 RB pocket.','Round 2 RB value matters here.'],
    8:['Back half of each tier.','Boone philosophy: you are closer to the turn, so slight reaches for players you will not see again are acceptable.','Do not wait for ADP permission if your guy will be gone.'],
    9:['Back-half value.','Exploit falling players, but assume the very front of each tier is normally gone by your pick.','Prioritize realistic survivors, not wish-list names.'],
    10:['Think in pairs.','Your picks are close to the turn. Treat consecutive selections as one roster-building decision and accept small reaches.','RB + WR is the default early shape.'],
    11:['Turn leverage.','You are almost drafting in pairs. Take the best realistic survivor, then use the second pick to attack scarcity or positional edge.','Elite TE can be a legitimate turn play.'],
    12:['The turn.','The first 11 players of a tier are usually gone. Your normal list starts at the BACK of that tier and spills into the next one.','Do not show yourself Gibbs at 1.12. Take the best realistic survivor plus the best early-next-tier player.']
  };

  const ROUND_PLAN = {
    1:{label:'CORNERSTONE',priority:['RB','WR'],modes:{RB:'PRIMARY',WR:'PRIMARY',TE:'WAIT',QB:'WAIT'},note:'Elite RB/WR only. Boone: rankings are a guide, and RB scarcity should affect the decision.',expert:'Build around the best realistic survivor in your part of Tier 1.'},
    2:{label:'HAMMER RB VALUE',priority:['RB','WR','TE'],modes:{RB:'PRIMARY',WR:'FALLBACK',TE:'ELITE VALUE',QB:'WAIT'},note:'Boone sees this as the strongest early RB pocket. Attack RB unless a clearly better WR/elite-TE value falls.',expert:'Round 2 is the time to beat the RB cliff, not chase a back after it.'},
    3:{label:'LEAN WR / VALUE ONLY',priority:['WR','RB','TE'],modes:{RB:'VALUE ONLY',WR:'PRIMARY',TE:'ELITE FALL',QB:'WAIT'},note:'The RBs get riskier. Prefer WR unless a trustworthy volume back or elite TE falls.',expert:'Boone’s expert room leaned WR here because the RB quality became shakier.'},
    4:{label:'WR / ELITE TE',priority:['WR','TE','RB'],modes:{RB:'VALUE ONLY',WR:'PRIMARY',TE:'PRIMARY',QB:'WAIT'},note:'Do not force a bad RB. Elite-TE upside is worth considering when the RB value is not there.',expert:'This is where roster value matters more than blindly filling a position.'},
    5:{label:'LAST STRONG RB WINDOW',priority:['RB','WR','TE'],modes:{RB:'PRIMARY',WR:'PRIMARY',TE:'VALUE',QB:'WAIT'},note:'Often the last strong window for dependable RB volume plus upside.',expert:'Boone treats Round 5 as a major RB decision point.'},
    6:{label:'CORE FIRST, THEN QB/TE',priority:['RB','WR','TE','QB'],modes:{RB:'VALUE',WR:'PRIMARY',TE:'VALUE',QB:'IF CORE BUILT'},note:'If your RB/WR core is built, QB or TE becomes guilt-free. If not, keep filling the core.',expert:'Do not take QB merely because the round number says so.'},
    7:{label:'FILL STARTERS',priority:['RB','WR','QB','TE'],modes:{RB:'VALUE',WR:'PRIMARY',TE:'VALUE',QB:'IF CORE BUILT'},note:'Keep filling starters and take the best upside value.',expert:'Stay flexible; the board decides whether this becomes QB/TE or more RB/WR.'},
    8:{label:'GET YOUR GUYS',priority:['RB','WR','TE','QB'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Boone “Get Your Guys” territory. Take players you believe can beat the slot.',expert:'Conviction matters more than tiny ADP differences here.'},
    9:{label:'BACKUP RB / QB VALUE',priority:['RB','QB','WR','TE'],modes:{RB:'UPSIDE',WR:'VALUE',TE:'VALUE',QB:'VALUE'},note:'Target contingent RB upside and late-QB discounts.',expert:'This is where waiting on QB can start paying off.'},
    10:{label:'LATE-QB SWEET SPOT',priority:['QB','RB','WR','TE'],modes:{RB:'UPSIDE',WR:'VALUE',TE:'VALUE',QB:'PRIMARY'},note:'If you waited on QB, this is a strong place to attack.',expert:'Otherwise keep taking RB/WR upside.'},
    11:{label:'BENCH UPSIDE',priority:['RB','WR','QB','TE'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Use bench spots on players whose roles can grow.',expert:'Upside over safe low-ceiling depth.'},
    12:{label:'HANDCUFF / STACK VALUE',priority:['RB','WR','QB','TE'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Target contingency backs, cheap stacks and late breakouts.',expert:'One role change can make these picks matter.'},
    13:{label:'LOTTERY TICKETS',priority:['RB','WR','TE','QB'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Keep chasing upside. Do not spend the pick on defense yet unless skill value is exhausted.',expert:'Late picks should have a path to becoming useful.'},
    14:{label:'LAST SKILL / DEF',priority:['RB','WR','TE','DEF'],modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'WAIT'},note:'One last upside skill player is fine. Defense only enters now.',expert:'Do not draft defense early.'},
    15:{label:'DEF / KICKER LAST',priority:['DEF','K'],modes:{RB:'WAIT',WR:'WAIT',TE:'WAIT',QB:'WAIT'},note:'Defense and kicker belong at the end.',expert:'Do not sacrifice earlier upside picks for them.'}
  };

  // Deliberate conditional repeats: these are FALL alerts, not normal round options.
  const FALL_TRIGGERS = {
    3:[{name:'Brock Bowers',text:'IF BROCK BOWERS SURVIVES TO YOUR ROUND 3 PICK → TAKE HIM. He has fallen past his normal elite-TE window.'}],
    4:[{name:'Trey McBride',text:'IF TREY McBRIDE SURVIVES TO YOUR ROUND 4 PICK → TAKE HIM. This is the value point to stop waiting.'}]
  };

  const SOURCE_ORDER = {TARGET:0,INTEL:1,EXPERT:2};
  const overallPick = (slot,round) => round % 2 ? ((round-1)*12+slot) : (round*12-slot+1);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

  function availabilityWindow(overall,round){
    const fall = round <= 4 ? 3 : round <= 8 ? 5 : 8;
    const reach = round <= 4 ? 10 : round <= 8 ? 13 : 18;
    return {min:Math.max(1,overall-fall),max:overall+reach};
  }

  function availabilityLabel(rank,overall){
    const delta = rank-overall;
    if(delta < -1) return 'IF STILL THERE';
    if(delta <= 3) return 'RIGHT IN RANGE';
    if(delta <= 8) return 'REALISTIC';
    return 'SMALL REACH';
  }

  function candidatesFor(round,pos,overall,used){
    const mode = ROUND_PLAN[round].modes[pos] || 'WAIT';
    if(mode==='WAIT') return {mode,options:[]};

    const {min,max}=availabilityWindow(overall,round);
    let candidates = PLAYERS.filter(p =>
      p.pos===pos &&
      !used.has(p.name) &&
      p.rank>=min && p.rank<=max
    );

    candidates = candidates.sort((a,b)=>{
      const da=Math.abs(a.rank-overall), db=Math.abs(b.rank-overall);
      return da-db || (SOURCE_ORDER[a.source]-SOURCE_ORDER[b.source]) || a.rank-b.rank;
    });

    if(candidates.length<2){
      const expandedMax=max+6;
      const extras=PLAYERS.filter(p=>
        p.pos===pos && !used.has(p.name) && p.rank>max && p.rank<=expandedMax &&
        !candidates.some(x=>x.name===p.name)
      ).sort((a,b)=>(SOURCE_ORDER[a.source]-SOURCE_ORDER[b.source]) || a.rank-b.rank);
      candidates=candidates.concat(extras);
    }

    return {
      mode,
      options:candidates.slice(0,2).map(p=>({...p,status:availabilityLabel(p.rank,overall)}))
    };
  }

  function playerRow(p){
    const star=p.source==='TARGET'?'★ ':'';
    const source=p.source==='TARGET'?'YOUR TARGET':p.source==='INTEL'?'INTEL':'EXPERT';
    return `<div class="position-option"><div class="position-name">${star}${esc(p.name)}</div><div class="position-meta">Y#${p.rank} · ${esc(p.status)} · ${source}</div></div>`;
  }

  function positionBox(round,pos,overall,result){
    const {mode,options}=result;
    const posClass=`pos-${pos.toLowerCase()}`;
    if(mode==='WAIT') return `<section class="position-box ${posClass} wait"><div class="position-title"><b>${pos}</b><span>WAIT</span></div><div class="wait-text">Boone build says do not spend this round here.</div></section>`;
    const body=options.length?options.map(playerRow).join(''):`<div class="wait-text">No approved ${pos} fits this exact pick window — do not force it.</div>`;
    return `<section class="position-box ${posClass}"><div class="position-title"><b>${pos}</b><span>${esc(mode)}</span></div>${body}</section>`;
  }

  function triggerBlock(round){
    const triggers=FALL_TRIGGERS[round]||[];
    if(!triggers.length)return '';
    return `<div class="fall-triggers">${triggers.map(t=>`<div class="fall-trigger">${esc(t.text)}</div>`).join('')}</div>`;
  }

  function render(slot){
    document.querySelectorAll('#slotTabs button').forEach(b=>b.classList.toggle('active',Number(b.dataset.slot)===slot));
    const [headline,approach,build]=SLOT_PROFILES[slot];
    $('slotTitle').textContent=`PICK ${slot}`;
    $('slotHeadline').textContent=headline;
    $('slotApproach').textContent=approach;
    $('slotBuild').textContent=build;

    const used=new Set();
    const cards=[];

    for(let round=1;round<=15;round++){
      const overall=overallPick(slot,round);
      const plan=ROUND_PLAN[round];
      const results={};

      for(const pos of POSITIONS){
        results[pos]=candidatesFor(round,pos,overall,used);
      }

      Object.values(results).forEach(r=>r.options.forEach(p=>used.add(p.name)));

      const positionOrder=plan.priority.filter(p=>POSITIONS.includes(p));
      const remaining=POSITIONS.filter(p=>!positionOrder.includes(p));
      const allPositions=[...positionOrder,...remaining];

      cards.push(`<article class="round-card">
        <div class="round-head"><b>ROUND ${round}</b><span>Your snake pick ≈ #${overall}<br>Tier ${round} · ${esc(plan.label)}</span></div>
        <div class="focus">BOONE PRIORITY: ${plan.priority.join(' → ')}</div>
        ${triggerBlock(round)}
        <div class="position-grid">${allPositions.map(pos=>positionBox(round,pos,overall,results[pos])).join('')}</div>
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
