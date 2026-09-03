(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const $=id=>document.getElementById(id);
  const POSITIONS=['RB','WR','TE','QB'];
  const OPTIONS_PER_POSITION=6;
  const playerApi=window.FantasyPlayers;
  const intelApi=window.FantasyIntel;

  if(!playerApi||!intelApi){
    document.body.innerHTML='<main class="guide"><div class="load-error">Shared Players/Intel modules failed to load.</div></main>';
    return;
  }

  const state={slot:1,players:[],loading:true,error:null};

  const SLOT_PROFILES={
    1:['Front of every tier.','Take the premium player, then plan for the long wait. Do not assume a back-of-tier player survives the turn.','Use the larger choice pool below instead of locking onto one name.'],
    2:['Near the front of every tier.','Attack premium values but respect the RB drop-offs before your next pick.','Build RB/WR first; QB/TE only when the value is clearly better.'],
    3:['Boone decision point.','Rankings are a guide. If the last strong-volume RB will be gone by your next pick, a small reach is fine.','Preferred early shapes: RB-WR-WR or WR-RB-WR.'],
    4:['Early-middle flexibility.','Take the strongest value in your window and watch the RB cliff before the board comes back.','Do not force a position when the player quality is worse.'],
    5:['Middle-slot flexibility.','You can play both sides of most tiers. Stay flexible while respecting RB scarcity.','Balanced RB/WR foundation first.'],
    6:['Middle of every tier.','Use the board. If RB dries up before your next pick, act; otherwise take the better WR/TE value.','By Round 5, aim to have a real RB/WR core.'],
    7:['Hammer spot.','Pair a first-round cornerstone with the strong Round 2 RB/WR pocket.','Round 2 is a major decision point.'],
    8:['Back half of each tier.','You are closer to the turn, so small reaches for players you will not see again are acceptable.','Use the six-name lists to make the turn less panicky.'],
    9:['Back-half value.','Expect the very front of each tier to be gone; focus on realistic survivors and fallers.','Do not build around wish-list names that should already be drafted.'],
    10:['Think in pairs.','Treat your two nearby picks as one roster-building decision.','RB + WR is the default early pairing unless elite value falls.'],
    11:['Turn leverage.','Take the best survivor, then attack scarcity or positional edge with the next selection.','Elite TE can be legitimate if the board gives it to you.'],
    12:['The turn.','Start at the back of the current tier and spill into the next one.','Take the two players you would hate to lose during the long wait.']
  };

  const ROUND_PLAN={
    1:{label:'CORNERSTONE',modes:{RB:'PRIMARY',WR:'PRIMARY',TE:'WAIT',QB:'WAIT'},note:'Elite RB/WR. Boone showed he is willing to move off pure rankings to avoid the wrong side of an RB cliff.'},
    2:{label:'STRONG RB POCKET',modes:{RB:'PRIMARY',WR:'PRIMARY',TE:'ELITE VALUE',QB:'WAIT'},note:'The Yahoo Expert League hammered RB here: Brown, Hampton, Walker, Achane, Henry, Williams and Jeanty all went in Round 2.'},
    3:{label:'WR LEAN / RB VALUE',modes:{RB:'VALUE ONLY',WR:'PRIMARY',TE:'VALUE',QB:'FALL ONLY'},note:'The expert room leaned WR. Boone specifically noted that QB depth makes an early passer hard to justify.'},
    4:{label:'VALUE + ELITE TE',modes:{RB:'VALUE',WR:'PRIMARY',TE:'PRIMARY',QB:'WAIT'},note:'Breece Hall and D’Andre Swift were viewed as values; Boone passed on weaker RB value for Colston Loveland.'},
    5:{label:'LAST VOLUME RB TRAIN',modes:{RB:'PRIMARY',WR:'PRIMARY',TE:'VALUE',QB:'VALUE FALL'},note:'Boone called this an important final window for guaranteed RB volume plus upside, while still taking Christian Watson himself.'},
    6:{label:'CORE DEPTH',modes:{RB:'VALUE',WR:'PRIMARY',TE:'VALUE',QB:'VALUE'},note:'Keep building RB/WR depth. Boone took MarShawn Lloyd while Maye and Burrow also came off the board.'},
    7:{label:'QB BECOMES LIVE',modes:{RB:'UPSIDE',WR:'PRIMARY',TE:'VALUE',QB:'PRIMARY IF CORE SET'},note:'Boone took Jalen Hurts once most of his starting lineup was filled. WR depth remained strong.'},
    8:{label:'GET YOUR GUYS',modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'VALUE'},note:'Attack players who can beat their slot. Do not let tiny ADP differences keep you from the player you prefer.'},
    9:{label:'UPSIDE + LATE QB',modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'PRIMARY'},note:'This is a strong late-QB zone if you waited. Otherwise keep taking contingent RBs and ascending WRs.'},
    10:{label:'QB / FLEX VALUE',modes:{RB:'UPSIDE',WR:'VALUE',TE:'VALUE',QB:'PRIMARY'},note:'If QB is still open, use the depth here. If not, keep taking players with a path to meaningful touches/targets.'},
    11:{label:'BENCH UPSIDE',modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'BACKUP ONLY'},note:'Boone took Tyler Allgeier in this range. Bench spots should buy contingent upside, not low-ceiling safety.'},
    12:{label:'HANDCUFFS / ROLE BETS',modes:{RB:'PRIMARY',WR:'UPSIDE',TE:'VALUE',QB:'BACKUP ONLY'},note:'Boone took Tyjae Spears. Prioritize backs one injury away and receivers whose roles can expand.'},
    13:{label:'LOTTERY TICKETS',modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'VALUE',QB:'BACKUP ONLY'},note:'This is where DEF/K can start appearing, but skill-player upside is still useful if your roster allows it.'},
    14:{label:'DEF / FINAL UPSIDE',modes:{RB:'UPSIDE',WR:'UPSIDE',TE:'LATE',QB:'LATE'},note:'Take your defense if required; otherwise one more upside bench swing.'},
    15:{label:'KICKER / LAST SWING',modes:{RB:'LAST SWING',WR:'LAST SWING',TE:'LAST SWING',QB:'ONLY IF NEEDED'},note:'Kicker/DEF timing depends on roster needs. Do not burn useful bench value earlier just to fill them.'}
  };

  const BOONE_PICKS=new Map([
    ['jonathan taylor',1],['drake london',2],['chris olave',3],['colston loveland',4],
    ['christian watson',5],['marshawn lloyd',6],['jalen hurts',7],['tyler allgeier',11],['tyjae spears',12]
  ]);

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function api(path){
    const r=await fetch(`${SB}/rest/v1/${path}`,{headers:H});
    if(!r.ok)throw Error(await r.text()||String(r.status));
    return r.json();
  }

  async function safe(path){try{return await api(path)}catch{return []}}

  async function loadPlayers(){
    try{
      state.loading=true;renderStatus('SYNCING SHARED PLAYER DATABASE');
      const [catalog,targets,planner,intelResult,suggestions]=await Promise.all([
        api('draft_player_catalog?select=player_key,yahoo_name,display_name,team,position,yahoo_rank,yahoo_verified,source,active&active=eq.true&order=yahoo_rank.asc.nullslast,yahoo_name.asc'),
        safe('draft_target_selection?select=player_key,user_target,user_tags,user_note,priority,updated_at'),
        safe('planner_player_tags?select=player_key,player_name,team,position,tags,reason,last_confirmed_date,updated_at,transfer_to_live'),
        intelApi.safeLoad(api),
        safe('player_suggestions?select=player_key,source_name,suggestion_type,sentiment,note,suggested_round,source_context,source_date,created_at&order=source_date.desc.nullslast,created_at.desc')
      ]);
      state.players=playerApi.build({catalog,targets,planner,intel:intelResult.data||[],suggestions,intelApi})
        .filter(p=>Number.isInteger(Number(p.yahoo_rank))&&Number(p.yahoo_rank)>0);
      state.loading=false;state.error=null;
      renderStatus(`${state.players.length} SHARED CANONICAL PLAYERS · YAHOO RANKS FROM DATABASE`);
      render();
    }catch(error){
      state.loading=false;state.error=error;
      renderStatus('PLAYER DATABASE ERROR');
      render();
    }
  }

  function renderStatus(text){const el=$('guideDataStatus');if(el)el.textContent=text}

  function overallPick(round,slot){return round%2===1?(round-1)*12+slot:round*12-slot+1}

  function candidateWindow(round){
    if(round<=3)return {before:10,after:24};
    if(round<=7)return {before:14,after:32};
    return {before:20,after:44};
  }

  function candidateScore(player,pick){
    const rank=Number(player.yahoo_rank);
    const distance=Math.abs(rank-pick);
    const likelyGone=rank<pick-12?28:0;
    const target=player.user_target?-22:0;
    const tags=playerApi.allTags(player);
    const value=tags.includes('VALUE')||tags.includes('PREMIUM')?-8:0;
    const avoid=tags.includes('AVOID')?24:0;
    const verified=player.yahoo_verified===false?18:0;
    return distance+likelyGone+target+value+avoid+verified;
  }

  function optionsFor(position,round,pick){
    const {before,after}=candidateWindow(round);
    const pool=playerApi.byPosition(state.players,position)
      .filter(p=>Number(p.yahoo_rank)>=Math.max(1,pick-before)&&Number(p.yahoo_rank)<=pick+after)
      .sort((a,b)=>candidateScore(a,pick)-candidateScore(b,pick)||Number(a.yahoo_rank)-Number(b.yahoo_rank));

    if(pool.length<OPTIONS_PER_POSITION){
      const used=new Set(pool.map(p=>p.player_key));
      playerApi.byPosition(state.players,position)
        .filter(p=>!used.has(p.player_key))
        .sort((a,b)=>candidateScore(a,pick)-candidateScore(b,pick)||Number(a.yahoo_rank)-Number(b.yahoo_rank))
        .slice(0,OPTIONS_PER_POSITION-pool.length)
        .forEach(p=>pool.push(p));
    }
    return pool.slice(0,OPTIONS_PER_POSITION);
  }

  function rangeLabel(player,pick){
    const rank=Number(player.yahoo_rank);
    if(player.user_target)return 'YOUR TARGET';
    if(rank<=pick-8)return 'FALL VALUE';
    if(rank<=pick+5)return 'IN RANGE';
    if(rank<=pick+18)return 'NEXT TIER';
    return 'REACH';
  }

  function optionFlags(player){
    const tags=playerApi.allTags(player).filter(t=>['TARGET','PREMIUM','VALUE','SLEEPER','WORKHORSE','COWBELL','HANDCUFF','STACK','INJURY','MONITOR','AVOID','REACH OK'].includes(t));
    return tags.slice(0,3);
  }

  function renderOption(player,pick){
    const flags=optionFlags(player);
    const booneRound=BOONE_PICKS.get(playerApi.normName(player.yahoo_name||player.display_name));
    const extras=[...flags,player.yahoo_verified===false?'UNVERIFIED':null].filter(Boolean);
    return `<div class="position-option">
      <div class="position-name">${esc(player.yahoo_name||player.display_name)}</div>
      <div class="position-meta">Yahoo #${esc(player.yahoo_rank)} · Tier ${esc(player.tier??'—')} · ${esc(player.team||'FA')} · ${esc(rangeLabel(player,pick))}${booneRound?` · Boone Rd ${booneRound}`:''}${extras.length?` · ${esc(extras.join(' / '))}`:''}</div>
    </div>`;
  }

  function renderPosition(position,round,pick,mode){
    const options=optionsFor(position,round,pick);
    return `<section class="position-box pos-${position.toLowerCase()} ${String(mode).includes('WAIT')?'wait':''}">
      <div class="position-title"><b>${position}</b><span>${esc(mode)}</span></div>
      ${options.map(p=>renderOption(p,pick)).join('')||'<div class="wait-text">No ranked canonical players in this range.</div>'}
    </section>`;
  }

  function fallTriggers(round,pick){
    const plan=ROUND_PLAN[round];
    const primary=POSITIONS.filter(pos=>!String(plan.modes[pos]).includes('WAIT'));
    const falls=state.players
      .filter(p=>primary.includes(String(p.position||'').toUpperCase()))
      .filter(p=>Number(p.yahoo_rank)>=Math.max(1,pick-16)&&Number(p.yahoo_rank)<=pick-6)
      .sort((a,b)=>Number(a.yahoo_rank)-Number(b.yahoo_rank))
      .slice(0,3);
    if(!falls.length)return '';
    return `<div class="fall-triggers">${falls.map(p=>`<div class="fall-trigger"><b>IF ${esc(p.yahoo_name||p.display_name)} FALLS</b><span>Yahoo #${esc(p.yahoo_rank)} · Tier ${esc(p.tier??'—')} · ${esc(p.position)} · take the value instead of forcing the normal plan.</span></div>`).join('')}</div>`;
  }

  function renderRound(round){
    const pick=overallPick(round,state.slot);
    const plan=ROUND_PLAN[round];
    return `<article class="round-card">
      <div class="round-head"><b>ROUND ${round}</b><span>Your pick #${pick}<br>${esc(plan.label)}</span></div>
      <div class="focus">Six choices per position from the same canonical Yahoo-ranked player database.</div>
      ${fallTriggers(round,pick)}
      <div class="position-grid">${POSITIONS.map(pos=>renderPosition(pos,round,pick,plan.modes[pos])).join('')}</div>
      <div class="round-note">${esc(plan.note)}</div>
    </article>`;
  }

  function renderTabs(){
    $('slotTabs').innerHTML=Array.from({length:12},(_,i)=>i+1).map(slot=>`<button type="button" class="${slot===state.slot?'active':''}" data-slot="${slot}">PICK ${slot}</button>`).join('');
    $('slotTabs').querySelectorAll('button').forEach(button=>button.onclick=()=>{state.slot=Number(button.dataset.slot);renderTabs();render()});
  }

  function renderSummary(){
    const profile=SLOT_PROFILES[state.slot];
    $('slotTitle').textContent=`PICK ${state.slot}`;
    $('slotHeadline').textContent=profile[0];
    $('slotApproach').textContent=profile[1];
    $('slotBuild').textContent=profile[2];
  }

  function render(){
    renderSummary();
    if(state.loading){$('rounds').innerHTML='<article class="round-card">Loading the same canonical players used by Players, RB, WR, Intel and Draft…</article>';return}
    if(state.error){$('rounds').innerHTML=`<article class="round-card">Could not load the canonical player database: ${esc(state.error.message||state.error)}</article>`;return}
    $('rounds').innerHTML=Array.from({length:15},(_,i)=>renderRound(i+1)).join('');
  }

  renderTabs();
  renderSummary();
  loadPlayers();
})();