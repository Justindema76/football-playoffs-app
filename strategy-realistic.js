(() => {
  'use strict';

  const DATA_DATE = 'September 4, 2026';
  const TEAM_COUNT = 12;
  const MAX_ROUNDS = 15;
  const STORAGE_SLOT = 'fantasy-realistic-slot-v1';
  const STORAGE_GONE = 'fantasy-realistic-gone-v1';
  const STORAGE_MINE = 'fantasy-realistic-mine-v1';

  // Yahoo 1QB Half-PPR market prices / queue references current Sept. 4, 2026.
  // These are MARKET numbers only. Expert-draft pick numbers are never stored here.
  const PLAYERS = [
    ['Jahmyr Gibbs','RB','DET',1.3],['Bijan Robinson','RB','ATL',2.0],["Ja'Marr Chase",'WR','CIN',3.5],['Puka Nacua','WR','LAR',4.9],
    ['Christian McCaffrey','RB','SF',5.8],['Jonathan Taylor','RB','IND',6.4],['Jaxon Smith-Njigba','WR','SEA',7.2],['Amon-Ra St. Brown','WR','DET',7.9],
    ['James Cook','RB','BUF',9.5],['CeeDee Lamb','WR','DAL',10.9],['Saquon Barkley','RB','PHI',11.5],['Justin Jefferson','WR','MIN',13.2],
    ["De'Von Achane",'RB','MIA',15.3],['Kenneth Walker','RB','KC',15.6],['Chase Brown','RB','CIN',15.9],['Ashton Jeanty','RB','LV',17.1],
    ['Derrick Henry','RB','BAL',17.3],['Omarion Hampton','RB','LAC',18.3],['Drake London','WR','ATL',19.9],['Josh Allen','QB','BUF',20.4],
    ['Brock Bowers','TE','LV',21.0],['Nico Collins','WR','HOU',21.8],['George Pickens','WR','DAL',22.5],['A.J. Brown','WR','NE',24.1],
    ['Trey McBride','TE','ARI',26.8],['Kyren Williams','RB','LAR',28.2],['DeVonta Smith','WR','PHI',29.5],['Jeremiyah Love','RB','ARI',29.7],
    ['Malik Nabers','WR','NYG',30.7],['Chris Olave','WR','NO',31.6],['Tee Higgins','WR','CIN',33.5],['Javonte Williams','RB','DAL',34.1],
    ['Breece Hall','RB','NYJ',34.7],['Rashee Rice','WR','KC',35.4],['Zay Flowers','WR','BAL',35.7],['Lamar Jackson','QB','BAL',38.5],
    ['Colston Loveland','TE','CHI',39.3],['Jaylen Waddle','WR','DEN',40.3],['Tetairoa McMillan','WR','CAR',41.8],['Travis Etienne','RB','NO',42.3],
    ['Cam Skattebo','RB','NYG',42.4],['Josh Jacobs','RB','GB',43.0],['Ladd McConkey','WR','LAC',44.8],['Emeka Egbuka','WR','TB',45.2],
    ["D'Andre Swift",'RB','CHI',46.0],['Tyler Warren','TE','IND',47.2],['Drake Maye','QB','NE',47.5],['Garrett Wilson','WR','NYJ',48.4],
    ['Joe Burrow','QB','CIN',50.1],['David Montgomery','RB','HOU',53.2],['Terry McLaurin','WR','WAS',54.1],['Quinshon Judkins','RB','CLE',54.2],
    ['Bucky Irving','RB','TB',54.7],['Jayden Daniels','QB','WAS',54.9],['Davante Adams','WR','LAR',56.2],['Jalen Hurts','QB','PHI',56.8],
    ['Luther Burden','WR','CHI',58.2],['DJ Moore','WR','BUF',59.7],['Tucker Kraft','TE','GB',60.5],['Bhayshul Tuten','RB','JAX',61.6],
    ['Sam LaPorta','TE','DET',63.2],['Jadarian Price','RB','SEA',64.4],['Jameson Williams','WR','DET',65.8],['TreVeyon Henderson','RB','NE',66.1],
    ['Rome Odunze','WR','CHI',66.5],['Caleb Williams','QB','CHI',67.0],['Christian Watson','WR','GB',67.8],['Mike Evans','WR','SF',69.0],
    ['Justin Herbert','QB','LAC',70.3],['Harold Fannin','TE','CLE',71.0],['Kyle Pitts','TE','ATL',72.3],['Dak Prescott','QB','DAL',73.5],
    ['Jaylen Warren','RB','PIT',76.4],['Rhamondre Stevenson','RB','NE',78.1],['Parker Washington','WR','JAX',78.2],['Marvin Harrison Jr.','WR','ARI',78.3],
    ['Carnell Tate','WR','TEN',81.2],['George Kittle','TE','SF',83.6],['Trevor Lawrence','QB','JAX',83.9],['Brian Thomas Jr.','WR','JAX',84.2],
    ['Tony Pollard','RB','TEN',85.8],['DK Metcalf','WR','PIT',85.9],['Rico Dowdle','RB','PIT',86.6],['Chuba Hubbard','RB','CAR',89.8],
    ['Jaxson Dart','QB','NYG',91.4],['Jonathon Brooks','RB','CAR',92.3],['Travis Kelce','TE','KC',94.6],['J.K. Dobbins','RB','DEN',95.0],
    ['Alec Pierce','WR','IND',95.6],['Chris Godwin','WR','TB',96.1],['Dalton Kincaid','TE','BUF',97.9],['Brock Purdy','QB','SF',98.4],
    ['Bo Nix','QB','DEN',99.0],['Blake Corum','RB','LAR',99.5],['Jordyn Tyson','WR','NO',99.5],['Matthew Stafford','QB','LAR',99.8],
    ['Michael Wilson','WR','ARI',101.0],['Patrick Mahomes','QB','KC',102.7],['Stefon Diggs','WR','WAS',104.5],['MarShawn Lloyd','RB','GB',104.6],
    ['Dallas Goedert','TE','PHI',105.5],['Courtland Sutton','WR','DEN',105.4],['Josh Downs','WR','IND',107.1],['Jacory Croskey-Merritt','RB','WAS',107.3],
    ['RJ Harvey','RB','DEN',107.8],['Kyle Monangai','RB','CHI',108.3],["De'Zhaun Stribling",'WR','SF',109.2],['Isaiah Likely','TE','NYG',109.5],
    ['Quentin Johnston','WR','LAC',110.1],['Kyler Murray','QB','MIN',112.5],['Jordan Mason','RB','MIN',113.1],['Mark Andrews','TE','BAL',113.2],
    ['Jared Goff','QB','DET',113.9],['Jordan Addison','WR','MIN',115.8],['Aaron Rodgers','QB','PIT',116.5],['Makai Lemon','WR','PHI',116.2],
    ['Jake Ferguson','TE','DAL',117.0],['Jayden Reed','WR','GB',117.3],['Fernando Mendoza','QB','LV',118.8],['Brian Robinson','RB','ATL',119.4],
    ['Kenny Gainwell','RB','TB',119.6],['Michael Pittman','WR','PIT',120.7],['Bryce Young','QB','CAR',121.6],['Sam Darnold','QB','SEA',122.5],
    ['Jordan Love','QB','GB',123.1],['Mike Washington','RB','LV',123.1],['Cameron Dicker','K','LAC',123.4],['Rachaad White','RB','WAS',123.8],
    ['Aaron Jones','RB','MIN',124.0],['KC Concepcion','WR','CLE',124.2],['Cam Ward','QB','TEN',124.4],['Juwan Johnson','TE','NO',124.5],
    ['Malik Willis','QB','MIA',125.1],['C.J. Stroud','QB','HOU',125.3],['AJ Barner','TE','SEA',125.4],['Baker Mayfield','QB','TB',125.9],
    ['Alvin Kamara','RB','NO',125.9],['Travis Hunter','WR','JAX',125.7],['Keenan Allen','WR','IND',125.8],['Isiah Pacheco','RB','DET',125.6],
    ['Oronde Gadsden','TE','LAC',126.6],['Dalton Schultz','TE','HOU',126.6],["Ja'Kobi Lane",'WR','BAL',126.8],['Daniel Jones','QB','IND',127.1],
    ['Deebo Samuel','WR','SF',127.3],['Hunter Henry','TE','NE',127.6],['Braelon Allen','RB','NYJ',127.9],['Rashid Shaheed','WR','SEA',128.4],
    ['T.J. Hockenson','TE','MIN',128.5],['New England Patriots','DEF','NE',128.7],['Xavier Worthy','WR','KC',129.1],['Jalen Nailor','WR','LV',129.2],
    ['Jonah Coleman','RB','DEN',129.3],['Brenton Strange','TE','JAX',129.3],['Tank Bigsby','RB','PHI',129.7],['Tyler Shough','QB','NO',130.0],
    ['Tyler Allgeier','RB','ARI',130.0],['Kenyon Sadiq','TE','NYJ',130.0],['Cam Little','K','JAX',130.1],['Jakobi Meyers','WR','JAX',130.1],
    ['Zach Charbonnet','RB','SEA',130.4],['Kaelon Black','RB','SF',130.5],['Woody Marks','RB','HOU',130.7],["Wan'Dale Robinson",'WR','TEN',130.7],
    ['Tyrone Tracy','RB','NYG',130.8],['Chris Rodriguez','RB','JAX',130.9],['Khalil Shakir','WR','BUF',130.9],['Denzel Boston','WR','CLE',131.4],
    ['Keaton Mitchell','RB','LAC',131.7],['Romeo Doubs','WR','NE',132.0],['Jason Myers','K','SEA',122.0],['Brandon Aubrey','K','DAL',86.5],
    ['Los Angeles Rams','DEF','LAR',87.8],['Houston Texans','DEF','HOU',93.7],['Denver Broncos','DEF','DEN',101.7],['Seattle Seahawks','DEF','SEA',108.3],
    ['Philadelphia Eagles','DEF','PHI',123.6],['Minnesota Vikings','DEF','MIN',131.2],['Pittsburgh Steelers','DEF','PIT',136.3],['Baltimore Ravens','DEF','BAL',138.7]
  ].map(([name,pos,team,adp]) => ({name,pos,team,adp}));

  const TARGETS = new Set([
    'Jahmyr Gibbs','Bijan Robinson',"Ja'Marr Chase",'Puka Nacua','Jonathan Taylor','Jaxon Smith-Njigba','Amon-Ra St. Brown','James Cook','CeeDee Lamb','Justin Jefferson',
    "De'Von Achane",'Brock Bowers','Trey McBride','Josh Allen','Nico Collins','Chris Olave','Tee Higgins','Ladd McConkey','Emeka Egbuka','Bucky Irving','Drake Maye','Jayden Daniels',
    'Jalen Hurts','Caleb Williams','Justin Herbert','Trevor Lawrence','Brock Purdy','Bo Nix','Matthew Stafford','Dak Prescott','Patrick Mahomes'
  ]);

  const ROUND_PLAN = {
    1:{priority:['RB','WR'],allow:['RB','WR'],label:'CORNERSTONE',note:'Elite RB/WR only. Start with the best player who actually reaches your slot.'},
    2:{priority:['RB','WR','TE','QB'],allow:['RB','WR','TE','QB'],label:'RB/WR FOUNDATION · ELITE QB/TE ONLY AT REAL PRICE',note:'Boone-style default is RB/WR. Allen, Bowers or McBride only appear when Yahoo price says the decision is real.'},
    3:{priority:['WR','RB','TE','QB'],allow:['RB','WR','TE','QB'],label:'LEAN WR · TAKE TRUE FALLERS',note:'Do not force the shakier RB tier. A premium TE/QB is a value only if the room actually lets one fall.'},
    4:{priority:['WR','RB','TE','QB'],allow:['RB','WR','TE','QB'],label:'BEST STARTER VALUE',note:'Keep building starters. QB/TE becomes live when its actual market reaches your pick.'},
    5:{priority:['RB','WR','QB','TE'],allow:['RB','WR','TE','QB'],label:'IMPORTANT RB WINDOW',note:'Respect the RB cliff, but do not pass a clearly better WR or a correctly priced QB/TE.'},
    6:{priority:['WR','RB','QB','TE'],allow:['RB','WR','TE','QB'],label:'CORE FIRST · QB/TE IF THE PRICE IS HERE',note:'This is where the old page failed. Early QBs show only as fallers; market-priced options show under Expected.'},
    7:{priority:['WR','RB','QB','TE'],allow:['RB','WR','TE','QB'],label:'FILL STARTERS',note:'Fill remaining starters without reaching multiple rounds past market.'},
    8:{priority:['RB','WR','QB','TE'],allow:['RB','WR','TE','QB'],label:'GET YOUR GUYS',note:'Upside matters more now, but Yahoo price still tells you who can realistically survive.'},
    9:{priority:['RB','WR','QB','TE'],allow:['RB','WR','TE','QB'],label:'UPSIDE + QB VALUE',note:'Contingent backs and late-QB values become attractive.'},
    10:{priority:['QB','RB','WR','TE'],allow:['RB','WR','TE','QB'],label:'LATE-QB SWEET SPOT',note:'If you waited on QB, attack the real market here instead of a fake round label.'},
    11:{priority:['RB','WR','TE','QB'],allow:['RB','WR','TE','QB'],label:'BENCH UPSIDE',note:'Prioritize players whose role can grow. Safe low-ceiling depth is not the goal.'},
    12:{priority:['RB','WR','TE','QB'],allow:['RB','WR','TE','QB'],label:'HANDCUFFS · STACKS · BREAKOUTS',note:'Take contingency value, cheap stacks and upside.'},
    13:{priority:['RB','WR','TE','QB'],allow:['RB','WR','TE','QB'],label:'LOTTERY TICKETS',note:'Yahoo late-round ADP gets volatile. Treat earlier-priced survivors as fallers, not expected gifts.'},
    14:{priority:['RB','WR','DEF'],allow:['RB','WR','TE','DEF'],label:'LAST SKILL OR DEF',note:'Defense can enter here. One last upside skill player is fine if somebody useful survives.'},
    15:{priority:['DEF','K'],allow:['DEF','K','RB','WR'],label:'DEF / KICKER LAST',note:'Finish DEF/K. Do not sacrifice earlier skill-position upside for them.'}
  };

  const SPECIAL_QB = ['Josh Allen','Lamar Jackson','Drake Maye','Joe Burrow','Jayden Daniels','Jalen Hurts','Caleb Williams','Justin Herbert','Dak Prescott','Trevor Lawrence','Brock Purdy','Bo Nix','Matthew Stafford','Kyler Murray'];
  const SPECIAL_TE = ['Brock Bowers','Trey McBride','Colston Loveland','Tyler Warren','Tucker Kraft','Sam LaPorta','Harold Fannin','Kyle Pitts','George Kittle','Travis Kelce','Dalton Kincaid'];

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let slot = clampSlot(Number(localStorage.getItem(STORAGE_SLOT)) || 9);
  let gone = loadSet(STORAGE_GONE);
  let mine = loadSet(STORAGE_MINE);

  function clampSlot(value){ return Math.max(1, Math.min(12, value || 1)); }
  function loadSet(key){
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
    catch { return new Set(); }
  }
  function saveSet(key,set){ localStorage.setItem(key, JSON.stringify([...set])); }
  function snakePick(draftSlot, round){ return round % 2 ? ((round - 1) * TEAM_COUNT + draftSlot) : (round * TEAM_COUNT - draftSlot + 1); }
  function nextPick(draftSlot, round){ return round < MAX_ROUNDS ? snakePick(draftSlot, round + 1) : 999; }
  function deltaLabel(adp, pick){
    const diff = +(adp - pick).toFixed(1);
    if (Math.abs(diff) < .6) return 'right on your pick';
    return diff > 0 ? `${Math.abs(diff)} picks later than you` : `${Math.abs(diff)} picks earlier than you`;
  }
  function allowedPlayer(player, round){
    const plan = ROUND_PLAN[round];
    if (!plan.allow.includes(player.pos)) return false;
    if (round === 2 && player.pos === 'QB' && player.name !== 'Josh Allen') return false;
    if (round === 3 && player.pos === 'QB' && !['Josh Allen','Lamar Jackson'].includes(player.name)) return false;
    if (round <= 3 && player.pos === 'TE' && !['Brock Bowers','Trey McBride'].includes(player.name)) return false;
    if (round < 14 && ['DEF','K'].includes(player.pos)) return false;
    return true;
  }
  function priorityIndex(player, round){
    const idx = ROUND_PLAN[round].priority.indexOf(player.pos);
    return idx < 0 ? 9 : idx;
  }
  function sortScore(player, pick, round){
    const targetBonus = TARGETS.has(player.name) ? -2.6 : 0;
    return Math.abs(player.adp - pick) + priorityIndex(player, round) * 3 + targetBonus;
  }
  function diversePick(pool, pick, round, limit, sorter){
    const sorted = [...pool].sort(sorter);
    const chosen = sorted.slice(0, limit);
    // When QB/TE is genuinely in this market window, do not let a long RB/WR list hide it.
    for (const pos of ['QB','TE']) {
      if (round < 2) continue;
      const best = sorted.find(p => p.pos === pos);
      if (!best || chosen.some(p => p.name === best.name)) continue;
      const replaceAt = [...chosen].reverse().findIndex(p => ['RB','WR'].includes(p.pos));
      if (replaceAt >= 0) chosen[chosen.length - 1 - replaceAt] = best;
      else if (chosen.length < limit) chosen.push(best);
    }
    return [...new Map(chosen.map(p => [p.name,p])).values()]
      .sort(sorter)
      .slice(0,limit);
  }
  function classifyPlayers(round, pick, upcoming){
    const available = PLAYERS.filter(p => !gone.has(p.name) && !mine.has(p.name) && allowedPlayer(p, round));
    const expectedBack = round <= 6 ? 6 : round <= 10 ? 8 : 10;
    const fallBack = round <= 6 ? 15 : round <= 10 ? 20 : 32;
    const reachForward = round <= 6 ? 18 : round <= 10 ? 24 : 30;
    const byPreference = (a,b) => sortScore(a,pick,round)-sortScore(b,pick,round);
    const byFall = (a,b) => (pick-a.adp)-(pick-b.adp) || priorityIndex(a,round)-priorityIndex(b,round);
    const expectedPool = available.filter(p => p.adp >= pick - 3 && p.adp <= pick + expectedBack);
    const fallPool = available.filter(p => p.adp < pick - 3 && p.adp >= pick - fallBack);
    const reachCeiling = Math.min(pick + reachForward, upcoming - 2);
    const reachPool = available.filter(p => p.adp > pick + expectedBack && p.adp <= reachCeiling);
    return {
      expected: diversePick(expectedPool,pick,round,7,byPreference),
      fall: diversePick(fallPool,pick,round,5,byFall),
      reach: diversePick(reachPool,pick,round,5,byPreference)
    };
  }

  function renderSlots(){
    $('slotTabs').innerHTML = Array.from({length:12},(_,i)=>i+1).map(n => `<button class="slot-tab ${n===slot?'active':''}" data-slot="${n}" type="button">${n}</button>`).join('');
  }
  function renderRoster(){
    const rosterPlayers = [...mine].map(name => PLAYERS.find(p=>p.name===name)).filter(Boolean);
    $('myRoster').innerHTML = rosterPlayers.length
      ? rosterPlayers.map(p => `<span class="roster-chip">${esc(p.name)} · ${p.pos}<button type="button" data-unmine="${esc(p.name)}" aria-label="Remove ${esc(p.name)} from my roster">×</button></span>`).join('')
      : '<span class="empty">No picks marked Mine yet.</span>';
  }
  function renderSummary(){
    $('slotHeading').textContent = `Pick ${slot}`;
    const early = [1,2,3,4,5,6].map(r=>`#${snakePick(slot,r)}`).join(', ');
    $('slotSummary').textContent = `Your first six selections are ${early}. Every recommendation below is calculated from those exact overall picks — not from “Round 6 = ranks 61–72.”`;
    $('pickPath').innerHTML = Array.from({length:15},(_,i)=>i+1).map(r => `<div class="pick-chip"><span>ROUND ${r}</span><b>#${snakePick(slot,r)}</b></div>`).join('');
    renderRoster();
  }
  function renderMarket(){
    const chip = p => `<span class="market-chip"><b>${esc(p.name)}</b> · ${p.pos} · ADP ${p.adp}</span>`;
    const qbs = SPECIAL_QB.map(name=>PLAYERS.find(p=>p.name===name)).filter(Boolean);
    const tes = SPECIAL_TE.map(name=>PLAYERS.find(p=>p.name===name)).filter(Boolean);
    $('marketStrip').innerHTML = `
      <article class="market-card"><h3>Quarterbacks</h3><div class="market-list">${qbs.map(chip).join('')}</div></article>
      <article class="market-card"><h3>Tight Ends</h3><div class="market-list">${tes.map(chip).join('')}</div></article>`;
  }
  function playerRow(player, pick){
    return `<div class="player-row">
      <div class="player-main">
        <div class="player-name">${TARGETS.has(player.name)?'<span class="star">★</span> ':''}${esc(player.name)}</div>
        <div class="player-meta">${player.pos} · ${esc(player.team)} · ${esc(deltaLabel(player.adp,pick))}</div>
      </div>
      <div class="adp">ADP ${player.adp}</div>
      <button class="mine-btn" type="button" data-mine="${esc(player.name)}">MINE</button>
      <button class="gone-btn" type="button" data-gone="${esc(player.name)}">GONE</button>
    </div>`;
  }
  function bucket(title, type, players, pick, emptyText){
    return `<section class="bucket">
      <h3><span class="pill ${type}">${title}</span></h3>
      <div class="player-list">${players.length ? players.map(p=>playerRow(p,pick)).join('') : `<div class="empty">${esc(emptyText)}</div>`}</div>
    </section>`;
  }
  function lateSpecial(round, pick){
    const plan = ROUND_PLAN[round];
    const defenses = PLAYERS.filter(p=>p.pos==='DEF'&&!gone.has(p.name)&&!mine.has(p.name)).sort((a,b)=>a.adp-b.adp).slice(0,5);
    const kickers = PLAYERS.filter(p=>p.pos==='K'&&!gone.has(p.name)&&!mine.has(p.name)).sort((a,b)=>a.adp-b.adp).slice(0,4);
    const upside = PLAYERS.filter(p=>['RB','WR','TE'].includes(p.pos)&&!gone.has(p.name)&&!mine.has(p.name)&&p.adp>=110).sort((a,b)=>b.adp-a.adp).slice(0,6);
    return `<article class="round-card">
      <div class="round-head">
        <div class="round-number">ROUND ${round}</div>
        <div class="round-title"><b>${esc(plan.label)}</b><span>${esc(plan.note)}</span></div>
        <div class="round-picks">YOUR PICK #${pick}<small>${round<15?`NEXT PICK #${nextPick(slot,round)}`:'FINAL PICK'}</small></div>
      </div>
      <div class="round-body">
        <div class="strategy-note"><span>PRIORITY</span><span class="priority-chain">${plan.priority.join(' → ')}</span></div>
        <div class="bucket-grid">
          ${bucket('DEF OPTIONS','expected',defenses,pick,'No defense options left in this page data.')}
          ${bucket('KICKER OPTIONS','reach',kickers,pick,'No kicker options left in this page data.')}
          ${bucket('LAST SKILL SURVIVORS','fall',upside,pick,'At this point take the best late survivor on your actual Yahoo board.')}
        </div>
        <div class="round-foot">DEF/K are intentionally held to the end even when Yahoo queue placement is earlier. That is a strategy decision, not an availability claim.</div>
      </div>
    </article>`;
  }
  function renderRounds(){
    const cards = [];
    for(let round=1;round<=MAX_ROUNDS;round++){
      const pick = snakePick(slot,round);
      const upcoming = nextPick(slot,round);
      if(round>=14){ cards.push(lateSpecial(round,pick)); continue; }
      const plan = ROUND_PLAN[round];
      const groups = classifyPlayers(round,pick,upcoming);
      cards.push(`<article class="round-card">
        <div class="round-head">
          <div class="round-number">ROUND ${round}</div>
          <div class="round-title"><b>${esc(plan.label)}</b><span>${esc(plan.note)}</span></div>
          <div class="round-picks">YOUR PICK #${pick}<small>NEXT PICK #${upcoming}</small></div>
        </div>
        <div class="round-body">
          <div class="strategy-note"><span>BOONE-STYLE PRIORITY</span><span class="priority-chain">${plan.priority.join(' → ')}</span></div>
          <div class="bucket-grid">
            ${bucket('EXPECTED','expected',groups.expected,pick,'No preferred player in the tight expected window. Use the fall/reach columns and your live Yahoo board.')}
            ${bucket('IF THEY FALL','fall',groups.fall,pick,'No meaningful earlier-ADP faller in this window.')}
            ${bucket('TAKE NOW / REACH','reach',groups.reach,pick, upcoming-pick<=5?'Your next pick is close. Do not manufacture a reach.':'No preferred reach before your next selection.')}
          </div>
          <div class="round-foot">Market test: Expected players must have Yahoo ADP from roughly #${Math.max(1,pick-3)} to #${pick+(round<=6?6:round<=10?8:10)}. Earlier-priced players can only appear as <b>If They Fall</b>. Reach candidates stop before your next snake pick (#${upcoming}).</div>
        </div>
      </article>`);
    }
    $('rounds').innerHTML = cards.join('');
  }
  function renderAll(){ renderSlots(); renderSummary(); renderMarket(); renderRounds(); }

  document.addEventListener('click', event => {
    const slotButton = event.target.closest('[data-slot]');
    if(slotButton){
      slot = clampSlot(Number(slotButton.dataset.slot));
      localStorage.setItem(STORAGE_SLOT,String(slot));
      renderAll();
      return;
    }
    const goneButton = event.target.closest('[data-gone]');
    if(goneButton){
      gone.add(goneButton.dataset.gone);
      saveSet(STORAGE_GONE,gone);
      renderRounds();
      return;
    }
    const mineButton = event.target.closest('[data-mine]');
    if(mineButton){
      mine.add(mineButton.dataset.mine);
      gone.delete(mineButton.dataset.mine);
      saveSet(STORAGE_MINE,mine);
      saveSet(STORAGE_GONE,gone);
      renderSummary();
      renderRounds();
      return;
    }
    const unmineButton = event.target.closest('[data-unmine]');
    if(unmineButton){
      mine.delete(unmineButton.dataset.unmine);
      saveSet(STORAGE_MINE,mine);
      renderSummary();
      renderRounds();
    }
  });

  $('resetGone').addEventListener('click', () => {
    gone.clear();
    saveSet(STORAGE_GONE,gone);
    renderRounds();
  });

  $('resetMine').addEventListener('click', () => {
    mine.clear();
    saveSet(STORAGE_MINE,mine);
    renderSummary();
    renderRounds();
  });

  renderAll();
  console.info(`Realistic Draft Action Plan market data: ${DATA_DATE}`);
})();
