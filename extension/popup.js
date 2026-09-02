const LIVE_URL='https://2026-fantasy-football.vercel.app/live';
const $=id=>document.getElementById(id);
async function activeTab(){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});return tab}
async function send(type){const tab=await activeTab();if(!tab?.id)throw Error('No active tab');return chrome.tabs.sendMessage(tab.id,{type})}
async function refresh(){
  try{
    const s=await send('STATUS');
    $('count').textContent=s?.count||0;
    $('status').textContent=s?.isDraftPage?`Yahoo draft detected · ${s?.found||0} picks found.`:'Open the Yahoo draft room first.';
  } catch(_){
    const x=await chrome.storage.local.get(['draftedCount','foundCount','lastError']);
    $('count').textContent=x.draftedCount||0;
    $('status').textContent=x.lastError?`Last error: ${x.lastError}`:`Open Yahoo draft room · ${x.foundCount||0} picks last found.`;
  }
}
$('scan').onclick=async()=>{
  try{
    $('status').textContent='Scanning Yahoo draft…';
    const r=await send('SCAN_NOW');
    $('count').textContent=r?.count||0;
    $('status').textContent=r?.ok?`Scan complete · ${r?.found||0} picks found.`:'Scan failed.';
  }catch(e){$('status').textContent=e.message}
};
$('open').onclick=()=>chrome.tabs.create({url:LIVE_URL});
refresh();
