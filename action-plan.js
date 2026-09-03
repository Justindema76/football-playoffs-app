(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const overallPick = (slot, round) => round % 2 ? ((round - 1) * 12 + slot) : (round * 12 - slot + 1);

  const PATHS = {
    default:{label:'DEFAULT · RB/WR FIRST 5',short:'DEFAULT ACTION PLAN',recommended:true,headline:'Build the roster first, but use your exact snake position — not a generic best-player list.',approach:'Rounds 1–5 are RB/WR foundation rounds. Leave Round 5 with a minimum of 2 RB + 2 WR. The fifth player is the best value: 3 RB + 2 WR or 2 RB + 3 WR.',build:'ROUND 5 CHECKPOINT: 5 RB/WR total · minimum 2 RB · minimum 2 WR.',warning:''},
    allen:{label:'JOSH ALLEN · ROUND 2',short:'ALLEN R2 ACTION PLAN',headline:'Allen is a deliberate Round-2 exception, not the default Boone build.',approach:'Take a realistic elite RB/WR at your Round-1 slot, Josh Allen in Round 2, then spend Rounds 3–5 on realistic RB/WR options around your exact snake picks.',build:'ROUND 5 CHECKPOINT: Josh Allen + 2 RB + 2 WR.',warning:'Allen went #31 overall in the Sept. 2 Yahoo expert draft. Round 2 is a conscious reach. Do not compound it by reaching for TE next.'},
    bowers:{label:'BROCK BOWERS · ROUND 2',short:'BOWERS R2 ACTION PLAN',headline:'Bowers is the cleanest premium onesie exception because his market price sits in Round 2.',approach:'Take a realistic elite RB/WR in Round 1, Bowers in Round 2, then use Rounds 3–5 exclusively on RB/WR around your actual snake positions.',build:'ROUND 5 CHECKPOINT: Brock Bowers + 2 RB + 2 WR.',warning:'Bowers went #18 overall in the Sept. 2 Yahoo expert draft. He fits best around the middle/back of Round 2; he is a bigger reach from the 1–4 slots.'},
    mcbride:{label:'TREY McBRIDE · ROUND 2',short:'McBRIDE R2 ACTION PLAN',headline:'McBride in Round 2 is a conviction pick and requires the strictest recovery plan.',approach:'Take a realistic RB/WR in Round 1, McBride in Round 2, then RB/WR only in Rounds 3–5. Quarterback must wait unless a massive value falls.',build:'ROUND 5 CHECKPOINT: Trey McBride + 2 RB + 2 WR.',warning:'McBride went #44 overall in the Sept. 2 Yahoo expert draft. Round 2 is a major reach versus the current market.'}
  };

  const SLOT_NOTES = {
    1:['Long-wait discipline.','Your picks are 1, 24, 25, 48, 49. Players near the back of a tier will not usually make the full trip back.'],
    2:['Near-front discipline.','Your picks are 2, 23, 26, 47, 50. Plan for the long gap instead of assuming a favorite survives.'],
    3:['Boone decision slot.','Your picks are 3, 22, 27, 46, 51. This is where a small RB reach can make sense if the volume tier will disappear.'],
    4:['Early-middle flexibility.','Your picks are 4, 21, 28, 45, 52. You can usually balance RB/WR without forcing either one.'],
    5:['Middle-slot flexibility.','Your picks are 5, 20, 29, 44, 53. Let the nearest value tier come to you.'],
    6:['True middle.','Your picks are 6, 19, 30, 43, 54. This is one of the easiest slots to stay balanced.'],
    7:['Hammer spot.','Your picks are 7, 18, 31, 42, 55. Round 2 lines up directly with the premium RB/Bowers pocket.'],
    8:['Back-half discipline.','Your picks are 8, 17, 32, 41, 56. Slight reaches are fine because the return trip is long.'],
    9:['Back-half value.','Your picks are 9, 16, 33, 40, 57. Think of the first two picks as a paired roster decision.'],
    10:['Pair your picks.','Your picks are 10, 15, 34, 39, 58. You can deliberately pair RB+RB or RB+WR based on the remaining tier.'],
    11:['Turn leverage.','Your picks are 11, 14, 35, 38, 59. The first two picks are close enough to plan together.'],
    12:['Full turn strategy.','Your picks are 12 and 13, then 36 and 37. You should plan two-player combinations, not one isolated pick at a time.']
  };

  const SLOT_OPENERS = {
    1:{primary:'Gibbs + Nico Collins / George Pickens / Drake London',alt:'Bijan or Ja\'Marr if preferred, then the best Round-2 WR/RB survivor near #24.'},
    2:{primary:'Bijan + George Pickens / Drake London / Ashton Jeanty',alt:'Gibbs if he falls, then attack the back of the Round-2 tier at #23.'},
    3:{primary:'Jonathan Taylor or Ja\'Marr + Drake London / A.J. Brown / Ashton Jeanty',alt:'Boone used Taylor here because he expected the RB cliff before pick #22.'},
    4:{primary:'Ja\'Marr / Puka + Ashton Jeanty / A.J. Brown / Kyren Williams',alt:'If Taylor falls, RB + WR is also clean.'},
    5:{primary:'Puka / Amon-Ra + A.J. Brown / Kyren Williams / Brock Bowers',alt:'Use Bowers only if you choose the premium-TE path.'},
    6:{primary:'Amon-Ra / CMC + Kyren Williams / Brock Bowers / Derrick Henry',alt:'This slot is flexible enough to go RB+RB, WR+RB, or WR+Bowers.'},
    7:{primary:'CMC / James Cook + Brock Bowers / Derrick Henry / De\'Von Achane',alt:'The #18 second pick is almost exactly Bowers market price.'},
    8:{primary:'James Cook / JSN + Derrick Henry / Achane / Kenneth Walker',alt:'Cook + one of the Round-2 RBs is a strong double-RB build.'},
    9:{primary:'JSN / Saquon + Achane / Kenneth Walker / Omarion Hampton',alt:'If Cook falls from #8, he becomes the priority.'},
    10:{primary:'Saquon / CeeDee + Kenneth Walker / Hampton / Chase Brown',alt:'This is a very natural RB+RB or WR+RB start.'},
    11:{primary:'CeeDee / Justin Jefferson + Hampton / Kenneth Walker / Chase Brown',alt:'If James Cook falls, Cook immediately becomes one of the best options.'},
    12:{primary:'BEST-CASE RB-RB: James Cook + Chase Brown',alt:'If Cook is gone: Justin Jefferson / CeeDee / Saquon + Chase Brown / Omarion Hampton / Kenneth Walker. Do not reach down the board just to force RB-RB.'}
  };

  // Market locations are based primarily on the Sept. 2 Yahoo Expert League draft,
  // with current Yahoo/target ranks filling gaps. They are used to show realistic
  // survivors around YOUR exact snake pick rather than the same list for every slot.
  const MARKET = [
    [1,'Jahmyr Gibbs','RB'],[2,'Bijan Robinson','RB'],[3,'Jonathan Taylor','RB'],[4,"Ja'Marr Chase",'WR'],[5,'Puka Nacua','WR'],[6,'Amon-Ra St. Brown','WR'],[7,'Christian McCaffrey','RB'],[8,'James Cook III','RB'],[9,'Jaxon Smith-Njigba','WR'],[10,'Saquon Barkley','RB'],[11,'CeeDee Lamb','WR'],[12,'Justin Jefferson','WR'],
    [13,'Chase Brown','RB'],[14,'Omarion Hampton','RB'],[15,'Kenneth Walker III','RB'],[16,"De'Von Achane",'RB'],[17,'Derrick Henry','RB'],[18,'Brock Bowers','TE'],[19,'Kyren Williams','RB'],[20,'A.J. Brown','WR'],[21,'Ashton Jeanty','RB'],[22,'Drake London','WR'],[23,'George Pickens','WR'],[24,'Nico Collins','WR'],
    [27,'Chris Olave','WR'],[28,'DeVonta Smith','WR'],[29,'Trey McBride','TE'],[30,'Zay Flowers','WR'],[31,'Josh Allen','QB'],[32,'Jaylen Waddle','WR'],[33,'Jeremiyah Love','RB'],[35,'Rashee Rice','WR'],[35.5,'Javonte Williams','RB'],
    [37,'Colston Loveland','TE'],[38,'Tetairoa McMillan','WR'],[39,'Breece Hall','RB'],[40,'Garrett Wilson','WR'],[41,'Travis Etienne Jr.','RB'],[42,"D'Andre Swift",'RB'],[43,'Emeka Egbuka','WR'],[45,'Luther Burden III','WR'],[47,'Jameson Williams','WR'],
    [50,'Parker Washington','WR'],[51,'Christian Watson','WR'],[53,'Quinshon Judkins','RB'],[55,'Bhayshul Tuten','RB'],[57,'Davante Adams','WR'],[59,'David Montgomery','RB'],[60,'Jadarian Price','RB'],
    [61,'Mike Evans','WR'],[62,'Drake Maye','QB'],[63,'Jayden Daniels','QB'],[64,'Joe Burrow','QB'],[66,'Jalen Hurts','QB'],[66.5,'Jaylen Warren','RB'],[67,'TreVeyon Henderson','RB'],[67.5,'Tucker Kraft','TE'],[68,'Rhamondre Stevenson','RB'],[69,'Marvin Harrison Jr.','WR'],[71,'Tony Pollard','RB'],[72,'Caleb Williams','QB'],
    [73,'Brian Thomas Jr.','WR'],[75,'Justin Herbert','QB'],[76,'Jonathon Brooks','RB'],[77,'Carnell Tate','WR'],[79,'Alec Pierce','WR'],[80,'Dak Prescott','QB'],[83,'Kyle Monangai','RB'],[84,'Chris Godwin Jr.','WR'],
    [85,'Jayden Reed','WR'],[86,'Kyle Pitts','TE'],[87,"De'Zhaun Stribling",'WR'],[88,'Jayden Daniels','QB'],[89,'Josh Downs','WR'],[90,'Jacory Croskey-Merritt','RB'],[91,'Jordan Mason','RB'],[92,'Rico Dowdle','RB'],[93,'Quentin Johnston','WR'],[94,'George Kittle','TE'],[95,'Dalton Kincaid','TE'],[96,'Caleb Williams','QB'],
    [97,'KC Concepcion','WR'],[98,'Matthew Golden','WR'],[99,'Kenny Gainwell','RB'],[100,'Dak Prescott','QB'],[101,'Jordan Addison','WR'],[102,"Wan'Dale Robinson",'WR'],[103,'Makai Lemon','WR'],[104,'Justin Herbert','QB'],[105,'Josh Jacobs','RB'],[106,'Michael Pittman Jr.','WR'],[107,'Romeo Doubs','WR'],[108,'RJ Harvey','RB'],
    [109,'Chris Rodriguez Jr.','RB'],[110,'Jonah Coleman','RB'],[111,'Stefon Diggs','WR'],[112,'Isaiah Likely','TE'],[113,'Mike Washington Jr.','RB'],[114,'Trevor Lawrence','QB'],[115,'Juwan Johnson','TE'],[116,'Rachaad White','RB'],[117,'Travis Kelce','TE'],
    [118,'Jordyn Tyson','WR'],[120,'Jalen Coker','WR'],[122,'Tre Tucker','WR'],[125,'Rashid Shaheed','WR'],[127,'Xavier Worthy','WR'],[132,'Tank Bigsby','RB'],[135,'Denzel Boston','WR'],[137,'Dontayvion Wicks','WR'],[139,'Emmett Johnson','RB'],[140,'Zach Charbonnet','RB'],[142,'Tyjae Spears','RB'],[143,'Dylan Sampson','RB'],[152,'Jaylin Noel','WR'],[155,'Tyrone Tracy Jr.','RB'],[170,'Kayshon Boutte','WR'],[175,'Tank Dell','WR'],[177,"Ja'Kobi Lane",'WR'],[178,'Adonai Mitchell','WR']
  ].map(([rank,name,pos])=>({rank,name,pos}));

  const DEDUPED = MARKET.filter((p,i,a)=>a.findIndex(x=>x.name===p.name&&x.rank===p.rank)===i);
  let activeSlot=1;
  let activePath='default';

  function marketStatus(rank,pick){
    const d=rank-pick;
    if(d<=-7)return 'BIG FALL — TAKE';
    if(d<=-2)return 'IF HE FALLS';
    if(d<=3)return 'RIGHT IN YOUR RANGE';
    if(d<=7)return 'SMALL REACH';
    return 'REACH — ONLY IF YOUR GUY';
  }

  function realistic(pos,pick,round,limit=5){
    const before=round<=2?4:round<=5?6:9;
    const after=round<=2?8:round<=5?10:15;
    let list=DEDUPED.filter(p=>p.pos===pos&&p.rank>=Math.max(1,pick-before)&&p.rank<=pick+after);
    list.sort((a,b)=>Math.abs(a.rank-pick)-Math.abs(b.rank-pick)||a.rank-b.rank);
    return list.slice(0,limit);
  }

  function playerRows(players,pick){
    if(!players.length)return '<div class="wait-text">No realistic approved option in this pick window — do not force the position.</div>';
    return players.map(p=>`<div class="position-option simple"><div class="position-name">${esc(p.name)}</div><div class="position-meta">MARKET #${Math.round(p.rank)} · ${esc(marketStatus(p.rank,pick))}</div></div>`).join('');
  }

  function box(pos,title,players,pick){
    const cls=`pos-${pos.toLowerCase()}`;
    return `<section class="position-box ${cls} ${players.length?'':'wait'}"><div class="position-title"><b>${esc(pos)}</b><span>${esc(title)}</span></div>${playerRows(players,pick)}</section>`;
  }

  function waitBox(pos,label='WAIT'){
    return `<section class="position-box pos-${pos.toLowerCase()} wait"><div class="position-title"><b>${pos}</b><span>${label}</span></div><div class="wait-text">Do not spend this pick here unless the Action Plan explicitly unlocks it.</div></section>`;
  }

  function roundRule(round){
    if(round===1)return {label:'REALISTIC CORNERSTONE',priority:'RB / WR',note:'These names are centered on your exact overall pick, not the entire first-round pool.'};
    if(round===2&&activePath==='allen')return {label:'LOCK JOSH ALLEN',priority:'QB',note:'Your chosen exception. The reference RB/WR boxes show what you are giving up at this exact pick.'};
    if(round===2&&activePath==='bowers')return {label:'LOCK BROCK BOWERS',priority:'TE',note:'Your chosen exception. The reference RB/WR boxes show realistic alternatives at this exact pick.'};
    if(round===2&&activePath==='mcbride')return {label:'LOCK TREY McBRIDE',priority:'TE',note:'Your chosen reach. The reference boxes show the realistic RB/WR cost.'};
    if(round<=5)return {label:'FOUNDATION',priority:'RB / WR',note:activePath==='default'?'Keep building toward 3 RB + 2 WR or 2 RB + 3 WR.':'Correction round: RB/WR only until you have 2 RB + 2 WR around the Round-2 exception.'};
    if(round<=7)return {label:'ONESIE VALUE CAN OPEN',priority:activePath==='allen'?'TE / RB / WR':(activePath==='bowers'||activePath==='mcbride')?'QB / RB / WR':'QB / TE / RB / WR',note:'Only take QB/TE if the realistic names around your exact pick are worth it.'};
    if(round<=10)return {label:'QB / TE VALUE ZONE',priority:'QB / TE / UPSIDE',note:'This is the main late-QB and TE value area. The names shown are tied to your exact overall pick.'};
    if(round<=13)return {label:'BENCH UPSIDE',priority:'RB HANDCUFF / UPSIDE WR',note:'Use the actual pick number to find realistic contingency backs and upside receivers.'};
    if(round===14)return {label:'LAST SKILL / DEF',priority:'UPSIDE OR DEF',note:'Defense can enter now.'};
    return {label:'KICKER LAST',priority:'K / DEF',note:'Kicker belongs at the end.'};
  }

  function roundBoxes(round,pick){
    const rb=realistic('RB',pick,round,5),wr=realistic('WR',pick,round,5),qb=realistic('QB',pick,round,4),te=realistic('TE',pick,round,4);

    if(round===2&&activePath==='allen')return [box('QB','LOCK',[{rank:31,name:'Josh Allen',pos:'QB'}],pick),box('RB','WHAT YOU PASS',rb,pick),box('WR','WHAT YOU PASS',wr,pick),waitBox('TE')];
    if(round===2&&activePath==='bowers')return [box('TE','LOCK',[{rank:18,name:'Brock Bowers',pos:'TE'}],pick),box('RB','WHAT YOU PASS',rb,pick),box('WR','WHAT YOU PASS',wr,pick),waitBox('QB')];
    if(round===2&&activePath==='mcbride')return [box('TE','LOCK',[{rank:44,name:'Trey McBride',pos:'TE'}],pick),box('RB','WHAT YOU PASS',rb,pick),box('WR','WHAT YOU PASS',wr,pick),waitBox('QB')];

    if(round<=5)return [box('RB','REALISTIC AT #'+pick,rb,pick),box('WR','REALISTIC AT #'+pick,wr,pick),waitBox('TE'),waitBox('QB')];

    const qbDone=activePath==='allen';
    const teDone=activePath==='bowers'||activePath==='mcbride';
    if(round<=10)return [
      box('RB','REALISTIC VALUE',rb,pick),
      box('WR','REALISTIC VALUE',wr,pick),
      qbDone?waitBox('QB','DONE — ALLEN'):box('QB','REALISTIC QB WINDOW',qb,pick),
      teDone?waitBox('TE','DONE — TE1'):box('TE','REALISTIC TE WINDOW',te,pick)
    ];

    if(round<=13)return [box('RB','HANDCUFF / UPSIDE',rb,pick),box('WR','UPSIDE',wr,pick),qbDone?waitBox('QB','DONE'):box('QB','ONLY IF NEEDED',qb,pick),teDone?waitBox('TE','DONE'):box('TE','ONLY IF NEEDED',te,pick)];
    return [waitBox('RB'),waitBox('WR'),waitBox('QB'),waitBox('TE')];
  }

  function renderCheckpoint(){
    const items=activePath==='default'?
      [['R1–R5','RB / WR FOUNDATION','But now every round uses your exact snake pick.'],['MINIMUM','2 RB + 2 WR','Never leave Round 5 below this.'],['IDEAL','3 RB + 2 WR','When the RB tier is better at your actual picks.'],['ALSO GOOD','2 RB + 3 WR','When the WR tier is better at your actual picks.']]:
      [['ROUND 1','REALISTIC RB / WR','Names are filtered to your exact slot.'],['ROUND 2',activePath==='allen'?'JOSH ALLEN':activePath==='bowers'?'BROCK BOWERS':'TREY McBRIDE','Your chosen exception.'],['ROUNDS 3–5','RB / WR ONLY','Realistic names around your snake picks.'],['END OF R5','2 RB + 2 WR','Plus your Round-2 QB/TE.']];
    $('checkpoint').innerHTML=items.map(([k,v,s])=>`<article><b>${esc(k)}</b><strong>${esc(v)}</strong><span>${esc(s)}</span></article>`).join('');
  }

  function render(){
    const path=PATHS[activePath];
    const [slotHeadline,slotApproach]=SLOT_NOTES[activeSlot];
    const opener=SLOT_OPENERS[activeSlot];
    document.querySelectorAll('#slotTabs button').forEach(b=>b.classList.toggle('active',Number(b.dataset.slot)===activeSlot));
    document.querySelectorAll('#pathTabs button').forEach(b=>b.classList.toggle('active',b.dataset.path===activePath));

    $('slotTitle').textContent=`PICK ${activeSlot} · ${path.short}`;
    $('slotHeadline').textContent=`${slotHeadline} ${path.headline}`;
    $('slotApproach').innerHTML=`${esc(slotApproach)} ${esc(path.approach)}<br><br><b>REALISTIC OPENING:</b> ${esc(opener.primary)}<br><b>FALLBACK:</b> ${esc(opener.alt)}`;
    $('slotBuild').textContent=path.build;
    $('pathWarning').hidden=!path.warning;
    $('pathWarning').textContent=path.warning;
    renderCheckpoint();

    const cards=[];
    for(let round=1;round<=15;round++){
      const pick=overallPick(activeSlot,round),rule=roundRule(round),boxes=roundBoxes(round,pick);
      let check='';
      if(round===2&&activeSlot===12&&activePath==='default')check='PICK 12/13 TURN: If James Cook reaches #12, Cook + Chase Brown is an excellent RB-RB start. If Cook is gone, do not force RB-RB — pair the best elite WR/RB survivor with Brown, Hampton or Walker.';
      if(round===5)check=activePath==='default'?'STOP: Do you have at least 2 RB + 2 WR? If yes, QB/TE can open next. If no, keep fixing the foundation.':'STOP: Do you have your Round-2 exception + 2 RB + 2 WR? If not, keep fixing RB/WR.';
      if(round===9&&! (activePath==='allen'))check='In the Yahoo expert draft, Dak went #100 and Herbert #104. If your ninth-round pick is near that range, this is a real — not theoretical — late-QB window.';
      cards.push(`<article class="round-card ${round===2&&activePath!=='default'?'locked':''}"><div class="round-head"><b>ROUND ${round}</b><span>YOUR EXACT PICK = #${pick}<br>${esc(rule.label)}</span></div><div class="focus">ACTION: ${esc(rule.priority)}</div><div class="priority-banner">${esc(rule.note)}</div><div class="position-grid">${boxes.join('')}</div>${check?`<div class="round-check">${esc(check)}</div>`:''}</article>`);
    }
    $('rounds').innerHTML=cards.join('');
  }

  $('slotTabs').innerHTML=Array.from({length:12},(_,i)=>`<button type="button" data-slot="${i+1}">PICK ${i+1}</button>`).join('');
  $('slotTabs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{activeSlot=Number(b.dataset.slot);render();}));
  $('pathTabs').innerHTML=Object.entries(PATHS).map(([key,path])=>`<button type="button" data-path="${key}" class="${path.recommended?'recommended':''}">${esc(path.label)}${path.recommended?'<br><small>RECOMMENDED</small>':''}</button>`).join('');
  $('pathTabs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{activePath=b.dataset.path;render();}));
  render();
})();