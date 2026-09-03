(() => {
  'use strict';

  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const snake=(slot,round)=>round%2?((round-1)*12+slot):(round*12-slot+1);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();

  // Only players on draft_target_selection are allowed to render as recommendations.
  // If research finds a new late sleeper, it stays OUT until Justin stars/adds him.
  const FALLBACK_TARGETS=new Set([
    'rhamondre stevenson','jonathon brooks','jk dobbins','blake corum','chuba hubbard','jordan mason','rj harvey','rachaad white','aaron jones','keaton mitchell','marshawn lloyd','woody marks','tyler allgeier','braelon allen','brian robinson','justice hill',
    'brian thomas','marvin harrison','dk metcalf','chris godwin','stefon diggs','jordan addison','courtland sutton','jakobi meyers','rashid shaheed','khalil shakir','keenan allen','deebo samuel','jalen mcmillan','jerry jeudy','malik washington','keon coleman',
    'drake maye','jayden daniels','joe burrow','jalen hurts','caleb williams','justin herbert','trevor lawrence','dak prescott','brock purdy','matthew stafford','jared goff','patrick mahomes','jordan love','baker mayfield','sam darnold','cj stroud','daniel jones',
    'tucker kraft','george kittle','dalton kincaid','dallas goedert','travis kelce','jake ferguson','dalton schultz','chig okonkwo','terrance ferguson','hunter henry','brenton strange','david njoku','brock bowers','trey mcbride','colston loveland','tyler warren',
    'rams d st'
  ].map(norm));

  let targetSet=new Set(FALLBACK_TARGETS);
  let syncState='fallback';

  const ROUNDS={
    6:{
      command:'CHECK FALLS — DO NOT FORCE QB/TE',
      priority:'The first question is always: did one of OUR targeted players fall below his normal price?',
      rows:[
        ['QB FALL',['Jalen Hurts','Drake Maye','Joe Burrow'],'Only if one falls well below expectation. Otherwise keep building RB/WR.'],
        ['TE VALUE',['Tyler Warren'],'Our targeted receiving TE in this range if the room gives us the price.'],
        ['RB VALUE',['Rhamondre Stevenson','Jonathon Brooks'],'Stevenson is current lead/value; Brooks is a targeted upside back if he falls.'],
        ['WR FALL',['Brian Thomas Jr.','Marvin Harrison Jr.','DK Metcalf'],'These are targeted players — take the discount rather than forcing a position.']
      ]
    },
    7:{
      command:'STACK CHECK + TARGETED UPSIDE',
      priority:'QB starts to enter only when the price or stack makes sense. The board still beats positional panic.',
      rows:[
        ['QB STACK',['Justin Herbert','Dak Prescott','Jayden Daniels','Caleb Williams'],'Herbert rises with Ladd; Dak rises with Pickens. Daniels/Caleb only if they fall.'],
        ['TE',['Tucker Kraft','George Kittle'],'Kraft is targeted; Kittle only if the discount compensates for injury risk.'],
        ['RB',['Jonathon Brooks','J.K. Dobbins','Blake Corum'],'All are already on your board. Corum has contingency upside; Brooks has role-growth upside.'],
        ['WR',['DK Metcalf','Chris Godwin Jr.','Courtland Sutton'],'Use a targeted WR fall instead of reaching for QB/TE.']
      ]
    },
    8:{
      command:'MAIN QB/TE VALUE WINDOW OPENS',
      priority:'This is an option window, not a command. If the targeted RB/WR is better, keep waiting.',
      rows:[
        ['QB',['Justin Herbert','Dak Prescott','Trevor Lawrence'],'Stack first; Lawrence is the preferred standalone/value fallback.'],
        ['TE',['George Kittle','Tucker Kraft'],'Kittle only at discount. Kraft is a targeted alternative if healthy/value.'],
        ['RB',['Blake Corum','Chuba Hubbard','Jordan Mason','RJ Harvey'],'Bench RBs need a path to more work. Every name here is on your board.'],
        ['WR',['Chris Godwin Jr.','Stefon Diggs','Courtland Sutton','Jordan Addison'],'Take targeted volume/upside if QB/TE is not worth the pick.']
      ]
    },
    9:{
      command:'FAVORITE LATE-QB / KINCAID AREA',
      priority:'If QB is still open, this is a strong attack point. Kincaid also enters the value conversation here.',
      rows:[
        ['QB',['Trevor Lawrence','Brock Purdy','Justin Herbert','Dak Prescott'],'Lawrence/Purdy are targeted values; Herbert/Dak depend on stack and fall.'],
        ['TE',['Dalton Kincaid','George Kittle'],'Kincaid is specifically liked. Kittle remains discount-only.'],
        ['RB',['Blake Corum','Jordan Mason','RJ Harvey','Rachaad White'],'Targeted RB depth with a route to usable touches.'],
        ['WR',['Stefon Diggs','Jordan Addison','Courtland Sutton','Jakobi Meyers'],'Stay inside the starred pool.']
      ]
    },
    10:{
      command:'FINISH A STARTER ONLY IF VALUE IS THERE',
      priority:'Do not fill QB/TE just because the roster box is empty. Compare the targeted options across positions.',
      rows:[
        ['QB',['Trevor Lawrence','Matthew Stafford','Brock Purdy'],'Stafford is primarily the Puka stack and needs QB2 insurance if used as QB1.'],
        ['TE',['Dalton Kincaid','Dallas Goedert','Travis Kelce'],'Goedert is a real later TE option; Kincaid remains preferred if available.'],
        ['RB',['Rachaad White','Aaron Jones','Keaton Mitchell','MarShawn Lloyd'],'Cheap targeted backs with workload/contingency paths.'],
        ['WR',['Jakobi Meyers','Rashid Shaheed','Khalil Shakir'],'Targeted WR depth — no outside sleeper gets inserted automatically.']
      ]
    },
    11:{
      command:'BENCH UPSIDE > NAME RECOGNITION',
      priority:'The bench should contain targeted players who can gain value, not random names we never approved.',
      rows:[
        ['QB2 IF NEEDED',['Trevor Lawrence','Brock Purdy'],'Only for Stafford/risky QB1 or an absurd fall. No automatic QB2.'],
        ['TE',['Dallas Goedert','Jake Ferguson','Dalton Kincaid'],'If TE is unresolved, these are targeted options.'],
        ['RB',['Aaron Jones','Keaton Mitchell','MarShawn Lloyd','Woody Marks'],'Use the player with the clearest path to touches or role growth.'],
        ['WR',['Rashid Shaheed','Khalil Shakir','Keenan Allen','Deebo Samuel Sr.'],'All are already on the board; pick based on role/value at that moment.']
      ]
    },
    12:{
      command:'TARGETED DEPTH + SECOND-CHANCE TE',
      priority:'This is where the selected late names matter. We are no longer guessing from famous names.',
      rows:[
        ['RB',['MarShawn Lloyd','Woody Marks','Tyler Allgeier','Braelon Allen'],'Contingency/upside from the actual starred pool.'],
        ['TE',['Jake Ferguson','Dalton Schultz','Chig Okonkwo','Terrance Ferguson'],'Late targeted TE choices if the room ignored the position.'],
        ['WR',['Rashid Shaheed','Khalil Shakir','Keenan Allen','Jalen McMillan'],'Take upside/role, not a random unstarred sleeper.'],
        ['QB',['Jared Goff','Patrick Mahomes','Jordan Love','Baker Mayfield'],'Only if QB remains open or one has fallen far below cost.']
      ]
    },
    13:{
      command:'LOTTERY TICKETS — FROM YOUR BOARD',
      priority:'Ceiling matters now, but the player still has to be someone you selected.',
      rows:[
        ['RB',['Tyler Allgeier','Braelon Allen','Brian Robinson','Justice Hill'],'Backups/role bets already approved on your board.'],
        ['TE',['Chig Okonkwo','Terrance Ferguson','Hunter Henry','Brenton Strange'],'Late TE1/TE2 options only if needed.'],
        ['WR',['Jalen McMillan','Keon Coleman','Malik Washington','Jerry Jeudy'],'These are your late WR lottery tickets, not outside names.'],
        ['QB',['Baker Mayfield','Sam Darnold','C.J. Stroud','Daniel Jones'],'Emergency/value pool only; stack can elevate Stroud.']
      ]
    },
    14:{
      command:'LAST TARGETED SKILL UPSIDE',
      priority:'Before defense/kicker, take another approved upside player if one is still worth rostering.',
      rows:[
        ['RB',['Tyler Allgeier','Braelon Allen','Brian Robinson','Justice Hill'],'Choose the one tied to your roster or clearest opportunity path.'],
        ['WR',['Jalen McMillan','Keon Coleman','Malik Washington','Jerry Jeudy'],'Only targeted late WRs.'],
        ['TE',['Chig Okonkwo','Terrance Ferguson','Hunter Henry','Brenton Strange'],'Only if TE is unresolved or insurance is justified.'],
        ['DEF',['Rams D/ST'],'This is the defense you actually starred.']
      ]
    },
    15:{
      command:'DEF / K — OR LAST APPROVED UPSIDE SHOT',
      priority:'Do not throw away a useful targeted skill player for a replaceable position if league rules let us wait.',
      rows:[
        ['DEF',['Rams D/ST'],'Targeted defense. If unavailable, stream the best Week 1 matchup.'],
        ['SKILL',['Braelon Allen','Justice Hill','Jalen McMillan','Malik Washington'],'If one of our approved upside players is still there, he can beat a forced kicker pick.'],
        ['RULE',[],'Live chat overrides this screen. Tell me every pick and I narrow the next choices from the remaining targeted board.']
      ]
    }
  };

  const TE_BOARD=[
    ['R2 FALL',['Brock Bowers'],'Receiver-level usage from the TE slot.'],
    ['R3 FALL',['Trey McBride'],'Receiver-level target volume.'],
    ['R4 VALUE',['Colston Loveland'],'Targeted receiving-upside TE.'],
    ['R5-6',['Tyler Warren'],'Targeted volume option.'],
    ['R6-8',['Tucker Kraft'],'Targeted option; use only if health/value lines up.'],
    ['R8+ FALL',['George Kittle'],'Discount only because of injury risk.'],
    ['R9-11',['Dalton Kincaid'],'A TE we specifically like at the later price.'],
    ['R10-12',['Dallas Goedert'],'Useful target path and already on your board.'],
    ['LATE',['Travis Kelce','Jake Ferguson','Dalton Schultz'],'Targeted veteran/value fallbacks.'],
    ['DEEP',['Chig Okonkwo','Terrance Ferguson','Hunter Henry','Brenton Strange','David Njoku'],'Only if TE is still unresolved or justified insurance.']
  ];

  function isTargeted(name){return targetSet.has(norm(name))}
  function targeted(names){return (names||[]).filter(isTargeted)}

  async function syncTargets(){
    try{
      const r=await fetch(`${SB}/rest/v1/draft_target_selection?select=player_key,user_target&user_target=eq.true`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
      if(!r.ok) throw Error(String(r.status));
      const rows=await r.json();
      const live=new Set(rows.map(x=>norm(x.player_key)).filter(Boolean));
      if(live.size){targetSet=live;syncState='live'}
    }catch(_){syncState='fallback'}
  }

  function injectStyles(){
    if(document.getElementById('lateDecisionStyles'))return;
    const s=document.createElement('style');
    s.id='lateDecisionStyles';
    s.textContent=`
      .late-decision-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0 18px}
      .late-decision-card{border:1px solid #cad5e2;border-radius:15px;background:#fff;overflow:hidden;box-shadow:0 2px 5px rgba(15,23,42,.05)}
      .late-decision-head{display:flex;justify-content:space-between;align-items:center;background:#10233f;color:#fff;padding:11px 14px}
      .late-decision-head strong{font-size:21px}.late-decision-head span{font-size:14px;font-weight:950}
      .late-decision-command{padding:12px 14px 4px;font-size:19px;font-weight:950;line-height:1.15}
      .late-decision-priority{padding:0 14px 11px;color:#475569;font-size:12px;font-weight:800;line-height:1.4}
      .late-decision-row{display:grid;grid-template-columns:105px 1fr;border-top:1px solid #e2e8f0;padding:10px 14px;gap:10px;align-items:start}
      .late-decision-row b{font-size:12px;color:#174a73}.late-decision-row strong{display:block;font-size:14px;line-height:1.3}.late-decision-row small{display:block;margin-top:3px;color:#64748b;font-size:11px;line-height:1.35;font-weight:750}
      .late-decision-note{background:#fff2cc;border:2px solid #d6b656;border-radius:14px;padding:13px 15px;margin:12px 0;font-weight:900;line-height:1.4}
      .target-sync{font-size:11px;font-weight:950;color:#166534;margin-left:8px}
      .late-te-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 18px}
      .late-te-item{background:#f3e8ff;border:1px solid #d8b4fe;border-radius:11px;padding:10px 12px}
      .late-te-item b{display:block;font-size:11px;color:#7e22ce}.late-te-item strong{display:block;font-size:14px;margin-top:2px}.late-te-item small{display:block;color:#64748b;font-size:11px;margin-top:3px;line-height:1.35}
      @media(max-width:900px){.late-decision-grid,.late-te-grid{grid-template-columns:1fr}.late-decision-row{grid-template-columns:90px 1fr}}
    `;
    document.head.appendChild(s);
  }

  function currentSlot(){
    const active=document.querySelector('#slotTabs button.active');
    return Number(active?.dataset.slot||1);
  }

  function renderRows(rows){
    return rows.map(([label,names,why])=>{
      const kept=targeted(names);
      if(names.length&&!kept.length)return '';
      const title=kept.length?kept.join(' · '):'LIVE DRAFT RULE';
      return `<div class="late-decision-row"><b>${esc(label)}</b><div><strong>${esc(title)}</strong><small>${esc(why)}</small></div></div>`;
    }).join('');
  }

  function renderLateDecision(){
    const panel=document.getElementById('lateDecisionPanel');
    if(!panel)return;
    const slot=currentSlot();
    panel.querySelector('#lateDecisionGrid').innerHTML=Object.entries(ROUNDS).map(([round,data])=>`<article class="late-decision-card"><div class="late-decision-head"><strong>ROUND ${round}</strong><span>YOUR PICK #${snake(slot,Number(round))}</span></div><div class="late-decision-command">${esc(data.command)}</div><div class="late-decision-priority">${esc(data.priority)}</div>${renderRows(data.rows)}</article>`).join('');
    panel.querySelector('#lateDecisionSlot').innerHTML=`PICK ${slot} · R6 #${snake(slot,6)} → R15 #${snake(slot,15)} <span class="target-sync">${syncState==='live'?'LIVE STARRED BOARD':'STARRED BOARD FALLBACK'}</span>`;
  }

  function renderExpandedTE(){
    const html=TE_BOARD.map(([window,names,why])=>{
      const kept=targeted(names);
      if(!kept.length)return '';
      return `<div class="late-te-item"><b>${esc(window)}</b><strong>${esc(kept.join(' · '))}</strong><small>${esc(why)}</small></div>`;
    }).join('');
    document.getElementById('expandedTeBoard')?.replaceChildren();
    const target=document.getElementById('expandedTeBoard');
    if(target)target.innerHTML=html;
  }

  function showLateDecision(button){
    document.querySelectorAll('.panel-only').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('#sheetTabs button').forEach(b=>b.classList.remove('active'));
    document.getElementById('lateDecisionPanel')?.classList.add('active');
    button?.classList.add('active');
    const slotShell=document.getElementById('slotShell');
    if(slotShell)slotShell.style.display='flex';
    renderLateDecision();
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    injectStyles();
    const main=document.querySelector('main.guide');
    const latePanel=document.getElementById('latePanel');
    const tabs=document.getElementById('sheetTabs');
    if(!main||!latePanel||!tabs)return;

    const panel=document.createElement('section');
    panel.id='lateDecisionPanel';
    panel.className='panel-only';
    panel.innerHTML=`<div class="hero-rule"><div><strong>ROUNDS 6–15 — YOUR STARRED PLAYERS ONLY</strong><span>No unselected player can appear as a recommendation. New research stays outside the plan until you add the player to your board.</span></div><div id="lateDecisionSlot" class="hero-picks"></div></div><div class="late-decision-note"><b>HOW TO USE THIS:</b> compare the targeted players who actually remain. QB/TE are value options — not automatic Round 6/7 picks. During the live draft, your roster and the players already taken override this static screen.</div><section id="lateDecisionGrid" class="late-decision-grid"></section><h2 style="margin:18px 0 8px">TARGETED TE FALLBACK BOARD</h2><section id="expandedTeBoard" class="late-te-grid"></section>`;
    latePanel.before(panel);

    const btn=document.createElement('button');
    btn.type='button';
    btn.dataset.tab='lateDecision';
    btn.textContent='R6–15 DECISION BOARD';
    const lateBtn=tabs.querySelector('button[data-tab="late"]');
    if(lateBtn)tabs.insertBefore(btn,lateBtn);else tabs.appendChild(btn);
    btn.addEventListener('click',()=>showLateDecision(btn));

    document.querySelectorAll('#slotTabs button').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{if(panel.classList.contains('active'))renderLateDecision()},0)));

    await syncTargets();
    renderLateDecision();
    renderExpandedTE();
  });
})();