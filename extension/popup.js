const LIVE_URL='https://2026-fantasy-football.vercel.app/live';
const $=id=>document.getElementById(id);
async function activeTab(){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});return tab}
async function send(type){const tab=await activeTab();if(!tab?.id)throw Error('No active tab');return chrome.tabs.sendMessage(tab.id,{type})}
async function refresh(){
  try{const s=await send('STATUS');$('count').textContent=s?.count||0;$('status').textContent=s?.isDraftPage?'Yahoo draft detected — live sync ready.':'Open the Yahoo draft room first.'}
  catch(_){const x=await chrome.storage.local.get(['draftedCount','lastError']);$('count').textContent=x.draftedCount||0;$('status').textContent=x.lastError?`Last error: ${x.lastError}`:'Open the Yahoo draft room first.'}
}
$('scan').onclick=async()=>{try{$('status').textContent='Scanning rendered Yahoo draft…';const r=await send('SCAN_NOW');$('count').textContent=r?.count||0;$('status').textContent=r?.ok?'Scan complete.':'Scan failed.'}catch(e){$('status').textContent=e.message}};
$('open').onclick=()=>chrome.tabs.create({url:LIVE_URL});
refresh();
