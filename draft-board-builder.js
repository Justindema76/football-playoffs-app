(() => {
  'use strict';

  const TEAM_COUNT = 12;
  const MAX_ROUNDS = 15;
  const STORAGE_BOARD = 'personal-draft-board-builder-v1';
  const STORAGE_SLOT = 'personal-draft-board-slot-v1';
  const PLAYERS = Array.isArray(window.DRAFT_BOARD_PLAYERS) ? window.DRAFT_BOARD_PLAYERS : [];
  const playerMap = new Map(PLAYERS.map(player => [player.name, player]));
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let slot = clampSlot(Number(localStorage.getItem(STORAGE_SLOT)) || 9);
  let boards = loadBoards();

  function clampSlot(value){ return Math.max(1, Math.min(12, value || 1)); }
  function snakePick(draftSlot, round){ return round % 2 ? ((round - 1) * TEAM_COUNT + draftSlot) : (round * TEAM_COUNT - draftSlot + 1); }
  function nextPick(draftSlot, round){ return round < MAX_ROUNDS ? snakePick(draftSlot, round + 1) : 999; }
  function slotBoard(){
    const key = String(slot);
    if (!boards[key]) boards[key] = {};
    return boards[key];
  }
  function roundNames(round){
    const board = slotBoard();
    const key = String(round);
    if (!Array.isArray(board[key])) board[key] = [];
    return board[key];
  }
  function loadBoards(){
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_BOARD) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  function saveBoards(){ localStorage.setItem(STORAGE_BOARD, JSON.stringify(boards)); }

  function marketStatus(player, pick, upcoming){
    const delta = player.adp - pick;
    if (delta < -3) {
      return {type:'faller',label:'IF HE FALLS',detail:`normally ${Math.abs(delta).toFixed(1)} picks earlier`};
    }
    if (delta <= 6) {
      return {type:'realistic',label:'REALISTIC',detail:Math.abs(delta) < .6 ? 'right on your pick' : `${delta >= 0 ? delta.toFixed(1)+' picks later' : Math.abs(delta).toFixed(1)+' picks earlier'}`};
    }
    if (upcoming < 999 && player.adp < upcoming - 1) {
      return {type:'reach',label:'REACH',detail:`ADP ${player.adp}; likely before your next pick #${upcoming}`};
    }
    return {type:'early',label:'WAY EARLY',detail:upcoming < 999 ? `ADP ${player.adp}; next pick is #${upcoming}` : `ADP ${player.adp}`};
  }

  function renderSlots(){
    $('slotTabs').innerHTML = Array.from({length:12},(_,index)=>index+1)
      .map(number => `<button type="button" class="slot-tab ${number===slot?'active':''}" data-slot="${number}">${number}</button>`)
      .join('');
  }

  function renderSummary(){
    $('slotTitle').textContent = `Pick ${slot}`;
    $('slotText').textContent = `This board belongs only to draft slot ${slot}. Your player choices are saved separately from the other 11 slots.`;
    $('pickPath').innerHTML = Array.from({length:15},(_,index)=>index+1)
      .map(round => `<div class="pick-chip"><span>ROUND ${round}</span><b>#${snakePick(slot,round)}</b></div>`)
      .join('');
  }

  function targetRow(name, round, index){
    const player = playerMap.get(name);
    if (!player) {
      return `<div class="target-row"><div class="target-order">${index+1}</div><div><div class="target-name">${esc(name)}</div><div class="target-meta">Player is no longer in current market data.</div></div><span class="status early">CHECK</span><button class="move-button" data-move="up" data-round="${round}" data-index="${index}" type="button">↑</button><button class="move-button" data-move="down" data-round="${round}" data-index="${index}" type="button">↓</button><button class="remove-button" data-remove="${esc(name)}" data-round="${round}" type="button">×</button></div>`;
    }
    const pick = snakePick(slot,round);
    const upcoming = nextPick(slot,round);
    const status = marketStatus(player,pick,upcoming);
    return `<div class="target-row">
      <div class="target-order">${index+1}</div>
      <div>
        <div class="target-name">${esc(player.name)}</div>
        <div class="target-meta">${player.pos} · ${esc(player.team)} · ${esc(status.detail)}</div>
      </div>
      <span class="status ${status.type}">${status.label}</span>
      <div class="target-adp">ADP ${player.adp}</div>
      <button class="move-button" data-move="up" data-round="${round}" data-index="${index}" type="button" aria-label="Move ${esc(player.name)} up">↑</button>
      <button class="move-button" data-move="down" data-round="${round}" data-index="${index}" type="button" aria-label="Move ${esc(player.name)} down">↓</button>
      <button class="remove-button" data-remove="${esc(player.name)}" data-round="${round}" type="button" aria-label="Remove ${esc(player.name)}">×</button>
    </div>`;
  }

  function roundCard(round){
    const pick = snakePick(slot,round);
    const upcoming = nextPick(slot,round);
    const names = roundNames(round);
    const expectedEnd = pick + 6;
    const nextText = upcoming < 999 ? `Next pick #${upcoming}` : 'Final round';
    return `<article class="round-card" data-round-card="${round}">
      <div class="round-head">
        <div class="round-title"><b>ROUND ${round}</b><span>Build your own priority list</span></div>
        <div class="round-picks">YOUR PICK #${pick}<small>${nextText}</small></div>
      </div>
      <div class="round-body">
        <div class="market-note">Normal market neighborhood: about #${Math.max(1,pick-3)}–#${expectedEnd}. Anyone with an earlier ADP is a faller; anyone later is your decision to reach.</div>
        <div class="picker">
          <input class="player-search" data-search-round="${round}" type="search" autocomplete="off" placeholder="Search a player to add to Round ${round}…" aria-label="Search player for Round ${round}">
          <button class="add-button" data-add-round="${round}" type="button">ADD</button>
          <div class="suggestions" data-suggestions-round="${round}"></div>
        </div>
        <div class="targets" data-targets-round="${round}">${names.length ? names.map((name,index)=>targetRow(name,round,index)).join('') : '<div class="empty">No names chosen yet. This round stays empty until you add your own players.</div>'}</div>
      </div>
    </article>`;
  }

  function renderRounds(){
    $('rounds').innerHTML = Array.from({length:MAX_ROUNDS},(_,index)=>roundCard(index+1)).join('');
  }

  function renderAll(){
    renderSlots();
    renderSummary();
    renderRounds();
  }

  function matchingPlayers(query, round){
    const pick = snakePick(slot,round);
    const normalized = query.trim().toLowerCase();
    const selected = new Set(roundNames(round));
    return PLAYERS
      .filter(player => !selected.has(player.name))
      .filter(player => !normalized || player.name.toLowerCase().includes(normalized) || player.pos.toLowerCase() === normalized || player.team.toLowerCase() === normalized)
      .sort((a,b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aPrefix = normalized && aName.startsWith(normalized) ? 0 : 1;
        const bPrefix = normalized && bName.startsWith(normalized) ? 0 : 1;
        return aPrefix-bPrefix || Math.abs(a.adp-pick)-Math.abs(b.adp-pick) || a.adp-b.adp;
      })
      .slice(0,10);
  }

  function openSuggestions(input){
    const round = Number(input.dataset.searchRound);
    const box = document.querySelector(`[data-suggestions-round="${round}"]`);
    if (!box) return;
    const players = matchingPlayers(input.value,round);
    box.innerHTML = players.length ? players.map(player => {
      const status = marketStatus(player,snakePick(slot,round),nextPick(slot,round));
      return `<div class="suggestion" data-suggestion-name="${esc(player.name)}" data-suggestion-round="${round}">
        <div><div class="suggestion-name">${esc(player.name)}</div><div class="suggestion-meta">${player.pos} · ${esc(player.team)} · ${status.label}</div></div>
        <div class="suggestion-adp">ADP ${player.adp}</div>
      </div>`;
    }).join('') : '<div class="empty">No matching players.</div>';
    box.classList.add('open');
  }

  function closeSuggestions(round){
    const box = document.querySelector(`[data-suggestions-round="${round}"]`);
    if (box) box.classList.remove('open');
  }

  function addPlayer(round,name){
    const player = playerMap.get(name);
    if (!player) return false;
    const names = roundNames(round);
    if (!names.includes(name)) names.push(name);
    saveBoards();
    renderRounds();
    return true;
  }

  function addFromInput(round){
    const input = document.querySelector(`[data-search-round="${round}"]`);
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) {
      input.focus();
      openSuggestions(input);
      return;
    }
    const exact = PLAYERS.find(player => player.name.toLowerCase() === raw.toLowerCase());
    const choice = exact || matchingPlayers(raw,round)[0];
    if (choice) addPlayer(round,choice.name);
  }

  function removePlayer(round,name){
    const names = roundNames(round);
    const index = names.indexOf(name);
    if (index >= 0) names.splice(index,1);
    saveBoards();
    renderRounds();
  }

  function movePlayer(round,index,direction){
    const names = roundNames(round);
    const target = direction === 'up' ? index-1 : index+1;
    if (target < 0 || target >= names.length) return;
    [names[index],names[target]] = [names[target],names[index]];
    saveBoards();
    renderRounds();
  }

  function boardText(){
    const lines = [`2026 PERSONAL DRAFT BOARD — SLOT ${slot}`];
    for (let round=1; round<=MAX_ROUNDS; round++) {
      const pick = snakePick(slot,round);
      const names = roundNames(round);
      lines.push(`Round ${round} · Pick #${pick}: ${names.length ? names.join(' > ') : '—'}`);
    }
    return lines.join('\n');
  }

  document.addEventListener('input', event => {
    const input = event.target.closest('[data-search-round]');
    if (input) openSuggestions(input);
  });

  document.addEventListener('focusin', event => {
    const input = event.target.closest('[data-search-round]');
    if (input) openSuggestions(input);
  });

  document.addEventListener('click', event => {
    const slotButton = event.target.closest('[data-slot]');
    if (slotButton) {
      slot = clampSlot(Number(slotButton.dataset.slot));
      localStorage.setItem(STORAGE_SLOT,String(slot));
      renderAll();
      return;
    }

    const suggestion = event.target.closest('[data-suggestion-name]');
    if (suggestion) {
      addPlayer(Number(suggestion.dataset.suggestionRound),suggestion.dataset.suggestionName);
      return;
    }

    const addButton = event.target.closest('[data-add-round]');
    if (addButton) {
      addFromInput(Number(addButton.dataset.addRound));
      return;
    }

    const removeButton = event.target.closest('[data-remove]');
    if (removeButton) {
      removePlayer(Number(removeButton.dataset.round),removeButton.dataset.remove);
      return;
    }

    const moveButton = event.target.closest('[data-move]');
    if (moveButton) {
      movePlayer(Number(moveButton.dataset.round),Number(moveButton.dataset.index),moveButton.dataset.move);
      return;
    }

    if (!event.target.closest('.picker')) {
      document.querySelectorAll('.suggestions.open').forEach(box => box.classList.remove('open'));
    }
  });

  document.addEventListener('keydown', event => {
    const input = event.target.closest('[data-search-round]');
    if (!input) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      addFromInput(Number(input.dataset.searchRound));
    }
    if (event.key === 'Escape') closeSuggestions(Number(input.dataset.searchRound));
  });

  $('copyBoard').addEventListener('click', async () => {
    const text = boardText();
    try {
      await navigator.clipboard.writeText(text);
      const button = $('copyBoard');
      const original = button.textContent;
      button.textContent = 'Copied';
      setTimeout(()=>button.textContent=original,1200);
    } catch {
      window.prompt('Copy your board:',text);
    }
  });

  $('clearSlot').addEventListener('click', () => {
    if (!window.confirm(`Clear every saved player from draft slot ${slot}? Other draft slots will not be touched.`)) return;
    boards[String(slot)] = {};
    saveBoards();
    renderRounds();
  });

  renderAll();
})();
