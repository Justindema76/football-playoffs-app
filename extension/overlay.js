(() => {
  'use strict';
  if (!location.pathname.startsWith('/f1/497223')) return;

  const SITE_URL='https://2026-fantasy-football.vercel.app/league';
  const ID='fantasy-intel-connection';
  if (document.getElementById(ID)) return;

  const root=document.createElement('div');
  root.id=ID;
  root.innerHTML=`
    <button id="fi-pill" type="button" aria-expanded="true">
      <span class="fi-dot"></span><b>FANTASY INTEL</b><span id="fi-pill-status">CONNECTED</span>
    </button>
    <section id="fi-panel">
      <div class="fi-head"><div><small>CONNECTED TO</small><strong>Battle of the Kings</strong><span>House of the Dragon · Team 6</span></div><button id="fi-close" type="button" aria-label="Collapse">×</button></div>
      <div id="fi-status" class="fi-status"><span class="fi-dot"></span><div><b>Extension connected</b><small>You can sync the league from right here.</small></div></div>
      <div id="fi-stats" class="fi-stats" hidden><div><b id="fi-teams">0</b><span>TEAMS</span></div><div><b id="fi-players">0</b><span>PLAYERS</span></div><div><b id="fi-matched">0</b><span>MATCHED</span></div><div><b id="fi-unmatched">0</b><span>UNMATCHED</span></div></div>
      <div class="fi-actions"><button id="fi-sync" type="button">SYNC ALL TEAMS</button><button id="fi-open" type="button">OPEN LEAGUE VIEW</button></div>
      <small id="fi-last" class="fi-last">Not synced yet</small>
    </section>`;

  const style=document.createElement('style');
  style.textContent=`
    #${ID}{position:fixed;left:18px;bottom:18px;z-index:2147483647;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#eef8ff;filter:drop-shadow(0 12px 28px rgba(0,0,0,.28))}
    #${ID} *{box-sizing:border-box}
    #fi-pill{display:none;align-items:center;gap:7px;border:1px solid #1d7d50;background:#092c1d;color:#eafff4;border-radius:999px;padding:9px 13px;font-size:11px;font-weight:900;letter-spacing:.03em;cursor:pointer}
    #fi-pill .fi-dot,.fi-status .fi-dot{width:9px;height:9px;border-radius:50%;background:#38d487;box-shadow:0 0 0 4px rgba(56,212,135,.12);flex:0 0 auto}
    #fi-pill-status{color:#8ff0bd;font-size:9px}
    #fi-panel{width:330px;border:1px solid #2b4765;background:linear-gradient(155deg,#07111f,#0d2138);border-radius:16px;padding:14px;box-shadow:0 18px 50px rgba(0,0,0,.34)}
    .fi-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.fi-head small{display:block;color:#5fd8ff;font-size:9px;font-weight:900;letter-spacing:.14em}.fi-head strong{display:block;font-size:17px;margin:2px 0 1px}.fi-head span{display:block;color:#95aac1;font-size:10px}.fi-head button{border:0;background:transparent;color:#9bb0c6;font-size:22px;line-height:1;cursor:pointer;padding:0 2px}
    .fi-status{display:flex;gap:10px;align-items:center;border:1px solid #1d6e4b;background:#092b1d;border-radius:11px;padding:10px;margin:12px 0}.fi-status b{display:block;font-size:12px}.fi-status small{display:block;color:#9ac9ae;font-size:9px;margin-top:1px}.fi-status.syncing{border-color:#7a621d;background:#30260c}.fi-status.syncing .fi-dot{background:#ffc84f}.fi-status.error{border-color:#8b2f35;background:#351116}.fi-status.error .fi-dot{background:#ff6b76}.fi-status.error small{color:#e5a6ab}
    .fi-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}.fi-stats div{border:1px solid #213c59;background:#0a192b;border-radius:8px;padding:7px 3px;text-align:center}.fi-stats b{display:block;font-size:15px}.fi-stats span{display:block;color:#8199b3;font-size:7px;font-weight:900;letter-spacing:.08em}
    .fi-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.fi-actions button{border-radius:9px;padding:9px 8px;font-size:9px;font-weight:900;cursor:pointer}.fi-actions button:first-child{border:0;background:#42cbff;color:#06111c}.fi-actions button:last-child{border:1px solid #315474;background:#10263f;color:#e6f2ff}.fi-actions button:disabled{opacity:.55;cursor:wait}
    .fi-last{display:block;color:#7089a2;font-size:8px;margin-top:9px;text-align:center}
    @media(max-width:650px){#${ID}{left:10px;right:10px;bottom:10px}#fi-panel{width:100%}}
  `;
  document.documentElement.append(style,root);

  const pill=document.getElementById('fi-pill');
  const panel=document.getElementById('fi-panel');
  const status=document.getElementById('fi-status');
  const syncButton=document.getElementById('fi-sync');
  const lastText=document.getElementById('fi-last');

  function collapse(){panel.style.display='none';pill.style.display='flex';pill.setAttribute('aria-expanded','false')}
  function expand(){panel.style.display='block';pill.style.display='none';pill.setAttribute('aria-expanded','true')}
  function setStatus(title,text,type=''){
    status.className=`fi-status ${type}`.trim();
    status.querySelector('b').textContent=title;
    status.querySelector('small').textContent=text;
    document.getElementById('fi-pill-status').textContent=type==='error'?'ERROR':type==='syncing'?'SYNCING':'CONNECTED';
  }
  function showResult(r){
    if(!r)return;
    document.getElementById('fi-stats').hidden=false;
    document.getElementById('fi-teams').textContent=r.teams||0;
    document.getElementById('fi-players').textContent=r.players||0;
    document.getElementById('fi-matched').textContent=r.matched||0;
    document.getElementById('fi-unmatched').textContent=r.unmatched||0;
    lastText.textContent=r.syncedAt?`Last sync: ${new Date(r.syncedAt).toLocaleString()}`:'Last sync complete';
  }

  document.getElementById('fi-close').onclick=collapse;
  pill.onclick=expand;
  document.getElementById('fi-open').onclick=()=>window.open(SITE_URL,'_blank','noopener');
  syncButton.onclick=async()=>{
    syncButton.disabled=true;syncButton.textContent='SYNCING…';
    setStatus('Syncing league','Reading all 12 Yahoo teams and current rosters.','syncing');
    try{
      const response=await chrome.runtime.sendMessage({type:'SYNC_CURRENT_TAB'});
      if(!response?.ok)throw new Error(response?.error||'Sync failed.');
      showResult(response.result);
      setStatus('Sync complete',`${response.result.teams} teams · ${response.result.players} roster spots saved.`);
    }catch(error){setStatus('Sync failed',error.message,'error')}
    finally{syncButton.disabled=false;syncButton.textContent='SYNC ALL TEAMS'}
  };

  chrome.storage.local.get(['fantasyLeagueLastSync']).then(data=>{
    if(data.fantasyLeagueLastSync){showResult(data.fantasyLeagueLastSync);setStatus('Extension connected','Yahoo league sync is ready.');}
  });
  setTimeout(()=>{if(panel.style.display!=='none')collapse()},8000);
})();
