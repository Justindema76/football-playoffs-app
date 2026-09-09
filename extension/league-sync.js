(() => {
  'use strict';
  const SB='https://bbodmhffnqebhfksjier.supabase.co';
  const KEY='sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn';
  const HEAD={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
  const LEAGUE='497223',LEAGUE_KEY='battle-of-the-kings-2026',MY_TEAM='6';
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const norm=v=>clean(v).toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\b(jr|sr|ii|iii|iv)\b/g,' ').replace(/\s+/g,' ').trim();
  let syncing=false,last=null;

  async function db(path,opt={}){
    const r=await fetch(`${SB}/rest/v1/${path}`,{...opt,headers:{...HEAD,...(opt.headers||{})}});
    const text=await r.text();if(!r.ok)throw Error(`Database ${r.status}: ${text}`);return text?JSON.parse(text):null;
  }
  async function page(path){
    const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error(`Yahoo ${r.status}: ${path}`);
    return new DOMParser().parseFromString(await r.text(),'text/html');
  }
  function teamsFrom(doc){
    const out=new Map();
    for(const a of doc.querySelectorAll('a[href]')){
      let u;try{u=new URL(a.getAttribute('href'),location.origin)}catch{continue}
      const m=u.pathname.match(new RegExp(`^/f1/${LEAGUE}/(\\d+)(?:/|$)`));if(!m)continue;
      const id=m[1],name=clean(a.textContent);if(Number(id)<1||Number(id)>30||!name||/^(roster|players|matchup|edit)$/i.test(name))continue;
      if(!out.has(id)||name.length>out.get(id).name.length)out.set(id,{id,name});
    }
    return [...out.values()].sort((a,b)=>Number(a.id)-Number(b.id));
  }
  function playerAnchor(tr){
    const links=[...tr.querySelectorAll('a[href]')];
    return links.find(a=>/\/nfl\/players\/\d+|\/player\/\d+|playerId=|player_id=/i.test(a.getAttribute('href')||''))||
      links.find(a=>{const t=clean(a.textContent);return t.length>2&&t.length<45&&t.includes(' ')&&!/^(add|drop|watch|news|stats)$/i.test(t)})||null;
  }
  function slotOf(tr){
    const text=clean(tr.querySelector('th,td')?.textContent).toUpperCase().replace(/\s+/g,'');
    for(const s of ['Q/W/R/T','W/R/T','W/R','QB','RB','WR','TE','K','DEF','BN','IR+','IR','NA'])if(text===s.replace(/\s+/g,''))return s;
    return null;
  }
  function yahooKey(a,name){
    const h=a?.getAttribute('href')||'';const m=h.match(/\/nfl\/players\/(\d+)|\/player\/(\d+)|[?&](?:player_id|playerId)=(\d+)/i);
    return m?(m[1]||m[2]||m[3]):`name:${norm(name)}`;
  }
  function rosterFrom(doc){
    const out=[],seen=new Set();
    for(const tr of doc.querySelectorAll('tr')){
      const slot=slotOf(tr),a=playerAnchor(tr);if(!slot||!a)continue;
      const name=clean(a.textContent);if(!name||seen.has(name))continue;seen.add(name);
      const txt=clean(tr.textContent).toUpperCase();const meta=txt.match(/\b([A-Z]{2,3})\s*[-–·]\s*(QB|RB|WR|TE|K|DEF)\b/);
      out.push({name,slot,yahooKey:yahooKey(a,name),nflTeam:meta?.[1]||null,position:meta?.[2]||null});
    }
    return out;
  }
  function indexPlayers(players,canon){
    const map=new Map();
    const add=(n,p)=>{const k=norm(n);if(k&&!map.has(k))map.set(k,p)};
    for(const p of players||[])add(p.player_name,p);
    for(const p of canon||[]){const row={player_key:p.player_key,team:p.team,position:p.position};add(p.yahoo_name,row);for(const a of p.aliases||[])add(a,row)}
    return map;
  }
  async function saveTeam(team,existing,playerIndex,when){
    const seeded=existing.find(x=>norm(x.team_name)===norm(team.name));
    if(!seeded)throw Error(`No database team matched Yahoo team: ${team.name}`);
    const updated=await db(`fantasy_league_teams?id=eq.${seeded.id}&select=*`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({yahoo_team_key:team.id,is_my_team:team.id===MY_TEAM,last_synced_at:when,updated_at:when})});
    const teamRow=updated?.[0]||seeded;
    const doc=await page(`/f1/${LEAGUE}/${team.id}`),roster=rosterFrom(doc);
    await db(`fantasy_league_rosters?league_team_id=eq.${teamRow.id}`,{method:'DELETE'});
    let matched=0;
    const rows=roster.map(r=>{const p=playerIndex.get(norm(r.name));if(p)matched++;return {league_team_id:teamRow.id,player_key:p?.player_key||null,yahoo_player_key:r.yahooKey,yahoo_player_name:r.name,nfl_team:p?.team||r.nflTeam,position:p?.position||r.position,roster_slot:r.slot,active:true,last_synced_at:when,updated_at:when}});
    if(rows.length)await db('fantasy_league_rosters',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(rows)});
    return {teamName:team.name,yahooTeamKey:team.id,total:rows.length,matched,unmatched:rows.length-matched};
  }
  async function sync(){
    if(syncing)throw Error('Sync already running.');syncing=true;const when=new Date().toISOString();
    try{
      const [teamsDoc,existing,players,canon]=await Promise.all([
        page(`/f1/${LEAGUE}/teams`),db(`fantasy_league_teams?select=*&league_key=eq.${LEAGUE_KEY}`),db('fantasy_players?select=player_key,player_name,team,position&active=eq.true'),db('yahoo_canonical_player_feed?select=player_key,yahoo_name,team,position,aliases')]);
      const teams=teamsFrom(teamsDoc);if(teams.length!==12)throw Error(`Expected 12 teams; found ${teams.length}. Open the Yahoo Teams page and try again.`);
      const idx=indexPlayers(players,canon),result={leagueId:LEAGUE,teams:0,players:0,matched:0,unmatched:0,teamResults:[],syncedAt:when};
      for(const t of teams){const r=await saveTeam(t,existing,idx,when);result.teamResults.push(r);result.teams++;result.players+=r.total;result.matched+=r.matched;result.unmatched+=r.unmatched}
      last=result;await chrome.storage.local.set({fantasyLeagueLastSync:result});return result;
    }finally{syncing=false}
  }
  chrome.runtime.onMessage.addListener((msg,_s,reply)=>{
    if(msg?.type==='SYNC_LEAGUE'){sync().then(result=>reply({ok:true,result})).catch(e=>reply({ok:false,error:e.message}));return true}
    if(msg?.type==='LEAGUE_STATUS'){chrome.storage.local.get(['fantasyLeagueLastSync']).then(x=>reply({ok:true,lastSync:last||x.fantasyLeagueLastSync||null,syncing}));return true}
  });
})();
