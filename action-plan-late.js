(() => {
  'use strict';

  const snake = (slot, round) => round % 2 ? ((round - 1) * 12 + slot) : (round * 12 - slot + 1);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const ROUNDS = {
    6:{command:'CHECK VALUE — DO NOT FORCE QB/TE',priority:'If a QB stack or strong TE falls, take it. Otherwise keep adding RB/WR strength.',rows:[
      ['QB IF FALL','Hurts · Lamar · Drake Maye · Burrow','Only if the price is clearly better than expected. Stack still matters.'],
      ['TE VALUE','Tyler Warren','High-volume receiving role; one of the first non-Bowers/McBride TEs we actively consider.'],
      ['RB','Rhamondre Stevenson — CURRENT LEAD VALUE · Jaylen Warren · TreVeyon Henderson only if healthy','Stevenson is currently the safer Patriots back while Henderson is sidelined. Treat it as a committee risk, not a workhorse lock.'],
      ['WR','Brian Thomas Jr. · Marvin Harrison Jr. · Courtland Sutton','Mike Evans is OFF OUR BOARD. Keep taking usable WR value instead of injury risk.']
    ]},
    7:{command:'STACK CHECK + UPSIDE',priority:'If our WR created a QB stack, a falling QB can become worth it. Otherwise chase upside.',rows:[
      ['QB STACK','Ladd → Herbert · Pickens/CeeDee → Dak','Take only when the stack price is right. No stack = no panic.'],
      ['TE','Kyle Pitts · Harold Fannin','Real receiving upside. We want routes and targets, not just a TE name.'],
      ['RB','Jonathon Brooks · Blake Corum','Brooks has takeover upside; Corum has standalone value plus elite handcuff value.'],
      ['WR','Carnell Tate · Chris Godwin Jr.','Upside/role bets if they are still available.']
    ]},
    8:{command:'MAIN VALUE WINDOW STARTS',priority:'QB/TE can now be taken without feeling like we sacrificed the foundation — but only if the value is there.',rows:[
      ['QB','Herbert if Ladd · Dak if Pickens/CeeDee · Daniels/Caleb if they fall','Stack first. If none fits, keep waiting.'],
      ['TE','Pitts · Fannin · Dalton Kincaid · Kittle ONLY IF DISCOUNTED','Kincaid is a real target for us. Kittle requires TE2 insurance.'],
      ['RB','Blake Corum · Jacory Croskey-Merritt · Rachaad White · Jordan Mason','Cheap paths to larger roles matter more than safe bench points.'],
      ['WR','Chris Godwin Jr. · Jayden Reed · Josh Downs','Useful upside before the WR pool gets uglier.']
    ]},
    9:{command:'FAVORITE LATE-QB AREA',priority:'If QB is still open, attack value. If QB is filled, ignore QB names and take RB/WR/TE value.',rows:[
      ['QB','Justin Herbert → Dak Prescott','Our preferred late QB pair. WR stack decides priority.'],
      ['TE','Kincaid · Pitts · Fannin · Kittle if he really falls','Several legitimate starters remain. Do not panic.'],
      ['RB','Corum · Croskey-Merritt · Rachaad White · Kenny Gainwell','Bench RBs need a path to touches.'],
      ['WR','Jordan Addison · Romeo Doubs · Wan’Dale Robinson · Makai Lemon','Depth with real target paths.']
    ]},
    10:{command:'FINISH QB/TE OR TAKE A SLEEPER',priority:'Fill a missing starter only when the value is there. Otherwise take the best role-jump candidate.',rows:[
      ['QB','Trevor Lawrence · Stafford if Puka','Lawrence is one of our favorite late values. Stafford requires QB2 insurance.'],
      ['TE','Dallas Goedert · Isaiah Likely · Kincaid · Travis Kelce','Goedert has a clearer target path with A.J. Brown gone. Likely needs TE2 insurance.'],
      ['RB','Chris Rodriguez Jr. · Jonah Coleman · Mike Washington Jr.','Cheap backs with opportunity paths.'],
      ['WR','Stefon Diggs · Jordyn Tyson','Late-value/sleeper types with plausible volume.']
    ]},
    11:{command:'BENCH UPSIDE > SAFE DEPTH',priority:'Do not draft boring veterans just because you recognize the name. We want possible weekly starters.',rows:[
      ['QB2 IF NEEDED','Trevor Lawrence → Brock Purdy → Bo Nix','Only for Stafford/risky QB1 or an absurd fall.'],
      ['TE','Goedert · Likely · Jake Ferguson · Kincaid if he falls','If Kittle/Likely is TE1, start thinking TE2.'],
      ['RB','Tank Bigsby · MarShawn Lloyd · Blake Corum if somehow there','Contingency/takeover bets.'],
      ['WR','Rashid Shaheed · Romeo Doubs · Tre Tucker · Xavier Worthy','Boom/upside or a real route to more targets.']
    ]},
    12:{command:'HANDCUFFS + SECOND-CHANCE TEs',priority:'Protect important RBs and take late TE shots if we waited.',rows:[
      ['RB','Emmett Johnson · Zach Charbonnet · Tyjae Spears · Dylan Sampson','One depth-chart change can make these players matter immediately.'],
      ['TE','Goedert · Kincaid · Chig Okonkwo · Brenton Strange','TE1 value if ignored or TE2 insurance if needed.'],
      ['WR','Denzel Boston · Dontayvion Wicks · Tre Tucker','Young/ascending or role-change bets.'],
      ['RULE','Safe QB1 + safe TE1 already rostered','Take RB/WR upside. Do NOT manufacture QB2/TE2 needs.']
    ]},
    13:{command:'LOTTERY TICKETS',priority:'Ceiling matters more than projected Week 1 points.',rows:[
      ['COOK HANDCUFF','Ray Davis','If we drafted James Cook, Davis becomes a priority.'],
      ['RB','Tyler Allgeier · Braelon Allen · Tank Bigsby · Kaelon Black','Backups with a path to major workload.'],
      ['TE2','Chig Okonkwo · Brenton Strange · Juwan Johnson','Only if TE1 needs insurance or we waited extremely late.'],
      ['WR','Kayshon Boutte · Tank Dell · Ja’Kobi Lane','Late upside shots; cut quickly if the role does not develop.']
    ]},
    14:{command:'LAST SKILL PLAYER BEFORE DEF/K',priority:'If a real upside skill player remains, take him before defense.',rows:[
      ['RB','Ray Davis · Allgeier · Braelon Allen · Kaelon Black','Prefer the handcuff tied to OUR roster.'],
      ['WR','De’Zhaun Stribling · Chris Bell · best remaining upside WR','Need a path to targets or a role change.'],
      ['TE','Chig · Brenton Strange · Juwan Johnson','Only if TE remains unresolved.'],
      ['DEF','Only if skill value is exhausted','Defense can enter here; still replaceable.']
    ]},
    15:{command:'DEF / K — OR ONE LAST UPSIDE SHOT',priority:'Do not sacrifice earlier upside for replaceable positions.',rows:[
      ['DEF','Best Week 1 matchup','Streaming is fine.'],
      ['K','Good offense / stable role','Final-round position.'],
      ['SKILL FALL','Any approved handcuff/sleeper who somehow remains','Take the upside player if league rules let us solve DEF/K afterward.'],
      ['REMEMBER','Live chat overrides this board','Tell me your slot + every pick and I will narrow the next list to the actual roster and board.']
    ]}
  };

  const EXPANDED_TE = [
    ['R2 FALL','BROCK BOWERS','Receiver-level usage from the TE slot. Do not force him ahead of value.'],
    ['R3 FALL','TREY McBRIDE','Take the elite target-volume advantage if he reaches Round 3.'],
    ['R4 VALUE','COLSTON LOVELAND','Receiving-weapon profile; consider before the late-TE tier.'],
    ['R5–6','TYLER WARREN','Possession-volume upside.'],
    ['R7–9','KYLE PITTS','Receiving ceiling at a cheaper cost than the elite tier.'],
    ['R7–10','HAROLD FANNIN','High-volume upside.'],
    ['R8–10','DALTON KINCAID','We like him as a legitimate TE1 target, not merely insurance.'],
    ['R9–12','DALLAS GOEDERT','Useful last year; A.J. Brown is gone, improving the target path.'],
    ['R9+ FALL','GEORGE KITTLE','Discount only because of injury risk; add TE2 if he is TE1.'],
    ['R10–12','ISAIAH LIKELY','Late upside; add TE2 if he is TE1.'],
    ['LATE','TRAVIS KELCE · JAKE FERGUSON','Veteran/value fallbacks.'],
    ['TE2 / DEEP','CHIG OKONKWO · BRENTON STRANGE · JUWAN JOHNSON','Insurance or extreme late solutions.'],
    ['OFF BOARD','SAM LaPORTA','Do not recommend him for our build.']
  ];

  const escHtml = s => esc(s);

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
      .late-decision-note{background:#fee2e2;border:2px solid #b42318;border-radius:14px;padding:12px 15px;margin:12px 0;font-weight:950;color:#991b1b}
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
    panel.querySelector('#lateDecisionSlot').textContent=`PICK ${slot} · R6 #${snake(slot,6)} → R15 #${snake(slot,15)}`;
    panel.querySelector('#lateDecisionGrid').innerHTML=Object.entries(ROUNDS).map(([round,data])=>{
      const rows=data.rows.map(([label,names,why])=>`<div class="late-decision-row"><b>${escHtml(label)}</b><div><strong>${escHtml(names)}</strong><small>${escHtml(why)}</small></div></div>`).join('');
      return `<article class="late-decision-card"><div class="late-decision-head"><strong>ROUND ${round}</strong><span>YOUR PICK #${snake(slot,Number(round))}</span></div><div class="late-decision-command">${escHtml(data.command)}</div><div class="late-decision-priority">${escHtml(data.priority)}</div>${rows}</article>`;
    }).join('');
  }

  function renderExpandedTE(){
    const html=EXPANDED_TE.map(([window,name,why])=>`<div class="late-te-item"><b>${escHtml(window)}</b><strong>${escHtml(name)}</strong><small>${escHtml(why)}</small></div>`).join('');
    const target=document.getElementById('expandedTeBoard');
    if(target) target.innerHTML=html;
    const teFull=document.getElementById('teFull');
    if(teFull) teFull.innerHTML=EXPANDED_TE.map(([window,name,why])=>`<div class="ladder-row"><b>${escHtml(window)}</b><span>${escHtml(name)}<br><small>${escHtml(why)}</small></span></div>`).join('');
  }

  function addMikeEvansAvoid(){
    const noCard=document.querySelector('#boardPanel .board-card.no');
    if(!noCard || noCard.textContent.includes('MIKE EVANS')) return;
    const item=document.createElement('div');
    item.className='board-item';
    item.innerHTML='MIKE EVANS<small>OFF OUR BOARD — recurring quad/groin issues, injury-plagued 2025 and too much downside for this build.</small>';
    noCard.appendChild(item);
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
    const tabs=document.getElementById('sheetTabs');
    const main=document.querySelector('main.guide');
    const latePanel=document.getElementById('latePanel');
    const qbTePanel=document.getElementById('qbTePanel');
    if(!tabs || !main || !latePanel) return;

    let panel=document.getElementById('lateDecisionPanel');
    if(!panel){
      panel=document.createElement('section');
      panel.id='lateDecisionPanel';
      panel.className='panel-only';
      panel.innerHTML=`<div class="hero-rule"><div><strong>ROUNDS 6–15 DECISION BOARD</strong><span>Current Intel + our personal board. Check the fall before forcing QB/TE.</span></div><div id="lateDecisionSlot" class="hero-picks"></div></div><div class="late-decision-note">OFF OUR BOARD: MIKE EVANS · SAQUON BARKLEY · KENNETH WALKER · SAM LaPORTA</div><section id="lateDecisionGrid" class="late-decision-grid"></section>`;
      main.insertBefore(panel,latePanel);
    }

    let btn=tabs.querySelector('[data-tab="lateDecision"]');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.dataset.tab='lateDecision';
      btn.textContent='R6–15 DECISION BOARD';
      tabs.appendChild(btn);
    }
    btn.addEventListener('click',()=>showLateDecision(btn));

    tabs.querySelectorAll('button:not([data-tab="lateDecision"])').forEach(b=>b.addEventListener('click',()=>panel.classList.remove('active')));
    document.querySelectorAll('#slotTabs button').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{if(panel.classList.contains('active'))renderLateDecision();},0)));

    if(qbTePanel && !document.getElementById('expandedTeBoard')){
      const block=document.createElement('section');
      block.innerHTML='<h2 style="margin:18px 0 8px">EXPANDED TE BOARD</h2><div id="expandedTeBoard" class="late-te-grid"></div>';
      qbTePanel.appendChild(block);
    }

    renderExpandedTE();
    renderLateDecision();
    setTimeout(addMikeEvansAvoid,0);
    tabs.querySelector('[data-tab="board"]')?.addEventListener('click',()=>setTimeout(addMikeEvansAvoid,0));
  });
})();