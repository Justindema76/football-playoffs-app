const LIVE_URL='https://2026-fantasy-football.vercel.app/live';
const $=id=>document.getElementById(id);
async function activeTab(){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});return tab}
async function send(type){const tab=await activeTab();if(!tab?.id)throw Error('No active tab');return chrome.tabs.sendMessage(tab.id,{type})}
async function slotState(){
  const x=await chrome.storage.local.get(['draftSlot']);
  if($('slot'))$('slot').textContent=x.draftSlot?`#${x.draftSlot}`:'—';
  return x;
}
async function refresh(){
  const slot=await slotState();
  try{
    const s=await send('STATUS');
    $('count').textContent=s?.found||0;
    $('status').textContent=s?.isDraftPage?`Yahoo draft detected${s?.draftSlot?` · slot #${s.draftSlot}`:''} · ${s?.found||0} drafted found.`:'Open the Yahoo draft room first.';
  }catch(_){
    const x=await chrome.storage.local.get(['foundCount','lastError']);
    $('count').textContent=x.foundCount||0;
    $('status').textContent=x.lastError?`Last error: ${x.lastError}`:`Open Yahoo draft room${slot.draftSlot?` · last slot #${slot.draftSlot}`:''}.`;
  }
}
$('scan').onclick=async()=>{
  try{
    $('status').textContent='Scanning Yahoo draft…';
    const r=await send('SCAN_NOW');
    $('count').textContent=r?.found||0;
    await slotState();
    $('status').textContent=r?.ok?`Scan complete${r?.draftSlot?` · slot #${r.draftSlot}`:''} · ${r?.found||0} drafted found.`:'Scan failed.';
  }catch(e){$('status').textContent=e.message}
};
$('open').onclick=()=>chrome.tabs.create({url:LIVE_URL});
refresh();
