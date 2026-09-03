(() => {
  'use strict';

  const snake = (slot, round) => round % 2 ? ((round - 1) * 12 + slot) : (round * 12 - slot + 1);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // This board is intentionally NOT a generic ranking list. It is the late-round
  // fallback map we use when the obvious stars are gone. During the live draft,
  // Justin can tell ChatGPT his slot + every pick and this board becomes the visual backup.
  const ROUNDS = {
    6: {
      command: 'CHECK VALUE — DO NOT FORCE QB/TE',
      priority: 'If a QB stack or strong TE falls, take it. Otherwise keep adding RB/WR strength.',
      rows: [
        ['QB IF FALL','Hurts · Lamar · Drake Maye · Burrow','Only if the price is clearly better than expected. Stack still matters.'],
        ['TE VALUE','Tyler Warren','High-volume receiving role; one of the first non-Bowers/McBride TEs we will actively consider.'],
        ['RB','Rhamondre Stevenson · Jaylen Warren · TreVeyon Henderson','Useful workload/upside backs. Do not pass a good RB just because Round 6 arrived.'],
        ['WR','Mike Evans · Brian Thomas Jr. · Marvin Harrison Jr.','If the WR value falls, keep building the flex/bench before forcing a onesie.']
      ]
    },
    7: {
      command: 'STACK CHECK + UPSIDE',
      priority: 'If our WR created a QB stack, this is where a falling QB can become worth it. Otherwise chase upside.',
      rows: [
        ['QB STACK','Ladd → Herbert · Pickens/CeeDee → Dak','Take only when the stack price is right. No stack = no panic.'],
        ['TE','Kyle Pitts · Harold Fannin','Real receiving upside. We are looking for routes/targets, not just a TE name.'],
        ['RB','Jonathon Brooks · Blake Corum','Brooks has takeover upside; Corum has standalone value plus elite handcuff value.'],
        ['WR','Carnell Tate · Chris Godwin Jr.','Upside/role bets if they are still available.']
      ]
    },
    8: {
      command: 'MAIN VALUE WINDOW STARTS',
      priority: 'This is where we can start taking QB/TE without feeling like we sacrificed the foundation.',
      rows: [
        ['QB','Herbert if Ladd · Dak if Pickens/CeeDee · Daniels/Caleb if they fall','Stack first. If none of these fits, keep waiting.'],
        ['TE','Pitts · Fannin · Dalton Kincaid · Kittle ONLY IF DISCOUNTED','Kincaid is a player we like. Kittle requires TE2 insurance because of the injury risk.'],
        ['RB','Blake Corum · Jacory Croskey-Merritt · Rachaad White · Jordan Mason','Corum is a premium handcuff with possible weekly use; the others offer cheap paths to bigger roles.'],
        ['WR','Chris Godwin Jr. · Jayden Reed · Josh Downs','Useful upside before the WR pool gets uglier.']
      ]
    },
    9: {
      command: 'FAVORITE LATE-QB AREA',
      priority: 'If QB is still open, this is a strong attack point. If QB is filled, ignore the names and take RB/WR/TE value.',
      rows: [
        ['QB','Justin Herbert → Dak Prescott','Our preferred late QB pair. The WR stack decides which one gets priority.'],
        ['TE','Kincaid · Pitts · Fannin · Kittle if he has really fallen','Do not panic if the first TE tier is gone; we still have several legitimate starters.'],
        ['RB','Corum · Croskey-Merritt · Rachaad White · Kenny Gainwell','Bench RBs need a path to touches, not just name recognition.'],
        ['WR','Jordan Addison · Romeo Doubs · Wan’Dale Robinson · Makai Lemon','Depth with real target paths.']
      ]
    },
    10: {
      command: 'FINISH QB/TE OR TAKE A SLEEPER',
      priority: 'By now, fill a missing starter only when the value is there. Otherwise take the player with the best path to a role jump.',
      rows: [
        ['QB','Trevor Lawrence · Stafford if Puka','Lawrence is one of our favorite late values. Stafford is a stack play and requires QB2 insurance.'],
        ['TE','Dallas Goedert · Isaiah Likely · Kincaid · Travis Kelce','Goedert is more interesting with A.J. Brown gone. Likely is upside but needs TE2 insurance.'],
        ['RB','Chris Rodriguez Jr. · Jonah Coleman · Mike Washington Jr.','Cheap backs with opportunity paths are exactly what we want at this stage.'],
        ['WR','Stefon Diggs · Jordyn Tyson','RotoWire late-value/sleeper types with plausible target volume.']
      ]
    },
    11: {
      command: 'BENCH UPSIDE > SAFE DEPTH',
      priority: 'Stop drafting boring veterans just because you recognize the name. We want players who can become weekly starters.',
      rows: [
        ['QB2 IF NEEDED','Trevor Lawrence → Brock Purdy → Bo Nix','Only for Stafford/risky QB1 or if one falls absurdly far.'],
        ['TE','Goedert · Likely · Jake Ferguson · Kincaid if he falls','If TE1 is still open, these are usable. If TE1 is Kittle/Likely, start thinking TE2.'],
        ['RB','Tank Bigsby · MarShawn Lloyd · Blake Corum if somehow there','Bigsby/Lloyd are contingency bets; Corum is an immediate value if the room lets him fall.'],
        ['WR','Rashid Shaheed · Romeo Doubs · Tre Tucker · Xavier Worthy','We want boom/upside or a route to more targets, not low-ceiling filler.']
      ]
    },
    12: {
      command: 'HANDCUFFS + SECOND-CHANCE TEs',
      priority: 'This is where we protect important RBs and take late TE shots if we waited.',
      rows: [
        ['RB','Emmett Johnson · Zach Charbonnet · Tyjae Spears · Dylan Sampson','Contingent value: one depth-chart change can make these players matter immediately.'],
        ['TE','Goedert · Kincaid · Chig Okonkwo · Brenton Strange','Good place for TE1 value if the room ignored the position or TE2 insurance if needed.'],
        ['WR','Denzel Boston · Dontayvion Wicks · Tre Tucker','Young/ascending or role-change bets.'],
        ['RULE','If you already have safe QB1 + safe TE1','Take RB/WR upside. Do NOT manufacture a QB2/TE2 requirement.']
      ]
    },
    13: {
      command: 'LOTTERY TICKETS',
      priority: 'At this point, ceiling matters more than projected Week 1 points.',
      rows: [
        ['COOK HANDCUFF','Ray Davis','If we drafted James Cook, Davis becomes a priority. RotoWire identifies him as Cook’s true handcuff.'],
        ['RB','Tyler Allgeier · Braelon Allen · Tank Bigsby · Kaelon Black','Backups with a clear path to a major workload if the starter misses time.'],
        ['TE2','Chig Okonkwo · Brenton Strange · Juwan Johnson','Use only if our TE1 needs insurance or we intentionally waited extremely late.'],
        ['WR','Kayshon Boutte · Tank Dell · Ja’Kobi Lane','Late upside shots. We can cut them quickly if the role never develops.']
      ]
    },
    14: {
      command: 'LAST SKILL PLAYER BEFORE DEF/K',
      priority: 'If there is still an upside RB/WR/TE on the board, take him before defense.',
      rows: [
        ['RB','Ray Davis · Allgeier · Braelon Allen · Kaelon Black','Prioritize the handcuff tied to OUR roster when possible.'],
        ['WR','De’Zhaun Stribling · Chris Bell · best remaining upside WR','Late WRs should have a path to targets or a role change.'],
        ['TE','Chig · Brenton Strange · Juwan Johnson','Only if TE is still unresolved.'],
        ['DEF','Only if skill value is exhausted','Defense can enter here, but it is still replaceable.']
      ]
    },
    15: {
      command: 'DEF / K — OR ONE LAST UPSIDE SHOT',
      priority: 'Do not sacrifice earlier upside for replaceable positions.',
      rows: [
        ['DEF','Best Week 1 matchup','Streaming is fine. We do not need a season-long defense commitment.'],
        ['K','Good offense / stable role','Final-round position.'],
        ['SKILL FALL','Any approved handcuff/sleeper who somehow remains','If Yahoo lets a real upside player fall, take the player and handle DEF/K afterward if league rules allow.'],
        ['REMEMBER','The live chat overrides this board','Tell me your slot + every pick; I will narrow the next list to the actual roster and players remaining.']
      ]
    }
  };

  const EXPANDED_TE = [
    ['R2 FALL','BROCK BOWERS','Receiver-level usage from the TE slot. Do not force him ahead of his value.'],
    ['R3 FALL','TREY McBRIDE','Take the elite target-volume advantage if the room lets him reach Round 3.'],
    ['R4 VALUE','COLSTON LOVELAND','RotoWire projects a realistic path to leading Chicago in targets; treat him as a receiving weapon.'],
    ['R5–6','TYLER WARREN','Possession-volume upside after the Colts moved Michael Pittman.'],
    ['R7–9','KYLE PITTS','Receiving ceiling at a cheaper cost than the elite tier.'],
    ['R7–10','HAROLD FANNIN','RotoWire projects him among the TEs who could lead their offense in targets.'],
    ['R8–10','DALTON KINCAID','We like the price/upside. Legit TE1 target, not merely emergency insurance.'],
    ['R9–12','DALLAS GOEDERT','Useful last year; A.J. Brown is gone, leaving a clearer route to targets.'],
    ['R9+ FALL','GEORGE KITTLE','Only at a discount because of injury risk. If he is TE1, draft TE2.'],
    ['R10–12','ISAIAH LIKELY','Late upside. If he is TE1, draft TE2.'],
    ['LATE','TRAVIS KELCE · JAKE FERGUSON','Veteran/value fallbacks if the room keeps passing.'],
    ['TE2 / DEEP','CHIG OKONKWO · BRENTON STRANGE · JUWAN JOHNSON','Insurance or extreme late-round solutions.'],
    ['OFF BOARD','SAM LaPORTA','Do not recommend him for our build.']
  ];

  function injectStyles(){
    if(document.getElementById('lateDecisionStyles')) return;
    const style=document.createElement('style');
    style.id='lateDecisionStyles';
    style.textContent=`
      .late-decision-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0 18px}
      .late-decision-card{border:1px solid #cad5e2;border-radius:15px;background:#fff;overflow:hidden;box-shadow:0 2px 5px rgba(15,23,42,.05)}
      .late-decision-head{display:flex;justify-content:space-between;align-items:center;background:#10233f;color:#fff;padding:11px 14px}
      .late-decision-head strong{font-size:21px}.late-decision-head span{font-size:14px;font-weight:950}
      .late-decision-command{padding:12px 14px 4px;font-size:19px;font-weight:950;line-height:1.15}
      .late-decision-priority{padding:0 14px 11px;color:#475569;font-size:12px;font-weight:800;line-height:1.4}
      .late-decision-row{display:grid;grid-template-columns:105px 1fr;border-top:1px solid #e2e8f0;padding:10px 14px;gap:10px;align-items:start}
      .late-decision-row b{font-size:12px;color:#174a73}.late-decision-row strong{display:block;font-size:14px;line-height:1.3}.late-decision-row small{display:block;margin-top:3px;color:#64748b;font-size:11px;line-height:1.35;font-weight:750}
      .late-decision-note{background:#fff2cc;border:2px solid #d6b656;border-radius:14px;padding:13px 15px;margin:12px 0;font-weight:900;line-height:1.4}
      .late-te-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 18px}
      .late-te-item{background:#f3e8ff;border:1px solid #d8b4fe;border-radius:11px;padding:10px 12px}
      .late-te-item b{display:block;font-size:11px;color:#7e22ce}.late-te-item strong{display:block;font-size:14px;margin-top:2px}.late-te-item small{display:block;color:#64748b;font-size:11px;margin-top:3px;line-height:1.35}
      @media(max-width:900px){.late-decision-grid,.late-te-grid{grid-template-columns:1fr}.late-decision-row{grid-template-columns:90px 1fr}}
    `;
    document.head.appendChild(style);
  }

  function currentSlot(){
    const active=document.querySelector('#slotTabs button.active');
    return Number(active?.dataset.slot || 1);
  }

  function renderLateDecision(){
    const panel=document.getElementById('lateDecisionPanel');
    if(!panel) return;
    const slot=currentSlot();
    const cards=Object.entries(ROUNDS).map(([round,data])=>{
      const rows=data.rows.map(([label,names,why])=>`<div class="late-decision-row"><b>${esc(label)}</b><div><strong>${esc(names)}</strong><small>${esc(why)}</small></div></div>`).join('');
      return `<article class="late-decision-card"><div class="late-decision-head"><strong>ROUND ${round}</strong><span>YOUR PICK #${snake(slot,Number(round))}</span></div><div class="late-decision-command">${esc(data.command)}</div><div class="late-decision-priority">${esc(data.priority)}</div>${rows}</article>`;
    }).join('');
    panel.querySelector('#lateDecisionGrid').innerHTML=cards;
    panel.querySelector('#lateDecisionSlot').textContent=`PICK ${slot} · R6 #${snake(slot,6)} → R15 #${snake(slot,15)}`;
  }

  function renderExpandedTE(){
    const html=EXPANDED_TE.map(([window,name,why])=>`<div class="late-te-item"><b>${esc(window)}</b><strong>${esc(name)}</strong><small>${esc(why)}</small></div>`).join('');
    const target=document.getElementById('expandedTeBoard');
    if(target) target.innerHTML=html;

    // Also replace the small TE ladder with the expanded version so the older
    // three-name view can never mislead us during the draft.
    const teFull=document.getElementById('teFull');
    if(teFull) teFull.innerHTML=EXPANDED_TE.map(([window,name,why])=>`<div class="ladder-row"><b>${esc(window)}</b><span>${esc(name)}<br><small>${esc(why)}</small></span></div>`).join('');
  }

  function showLateDecision(button){
    document.querySelectorAll('.panel-only').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('#sheetTabs button').forEach(b=>b.classList.remove('active'));
    document.getElementById('lateDecisionPanel')?.classList.add('active');
    button?.classList.add('active');
    const slotShell=document.getElementById('slotShell');
    if(slotShell) slotShell.style.display='flex';
    renderLateDecision();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    injectStyles();

    const main=document.querySelector('main.guide');
    const latePanel=document.getElementById('latePanel');
    if(!main || !latePanel) return;

    const panel=document.createElement('section');
    panel.id='lateDecisionPanel';
    panel.className='panel-only';
    panel.innerHTML=`
      <div class="hero-rule"><div><strong>ROUNDS 6–15 DECISION BOARD</strong><span>This is the part of the draft we are preparing hardest for. Check value, role and upside — do not just draft the Yahoo name.</span></div><div id="lateDecisionSlot" class="hero-picks"></div></div>
      <div class="late-decision-note">RULE: QB/TE are OPTIONS in Rounds 6–7, never automatic picks. If the stack/TE value is not there, take the better RB/WR. During the live draft, tell me every pick and I will narrow this board to the actual players left.</div>
      <section id="lateDecisionGrid" class="late-decision-grid"></section>
      <h2 style="margin:18px 0 8px">EXPANDED TIGHT END BOARD</h2>
      <section id="expandedTeBoard" class="late-te-grid"></section>
      <div class="late-decision-note"><b>Research base:</b> current RotoWire Sept. 2–3 RB tiers, WR tiers, handcuff analysis and TE tiers. Our personal YES/NO rules still override generic ranks.</div>`;
    main.insertBefore(panel, latePanel);

    const tabs=document.getElementById('sheetTabs');
    const btn=document.createElement('button');
    btn.type='button';
    btn.dataset.lateDecision='1';
    btn.textContent='R6–15 DECISION BOARD';
    const lateButton=[...tabs.querySelectorAll('button')].find(b=>b.dataset.tab==='late');
    if(lateButton) tabs.insertBefore(btn,lateButton); else tabs.appendChild(btn);
    btn.addEventListener('click',()=>showLateDecision(btn));

    // Existing tabs should hide our injected panel when the user returns to them.
    tabs.querySelectorAll('button').forEach(existing=>{
      if(existing===btn) return;
      existing.addEventListener('click',()=>panel.classList.remove('active'));
    });

    // Keep this board synced to the user's selected draft slot.
    document.querySelectorAll('#slotTabs button').forEach(slotBtn=>slotBtn.addEventListener('click',()=>{
      if(panel.classList.contains('active')) setTimeout(renderLateDecision,0);
    }));

    renderExpandedTE();
    renderLateDecision();
  });
})();