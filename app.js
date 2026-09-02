(() => {
  'use strict';

  const CONFIG = Object.freeze({
    supabaseUrl: 'https://bbodmhffnqebhfksjier.supabase.co',
    publishableKey: 'sb_publishable_L048cgw2gZwCeWmSWpUclA_cuKCSyQn',
    refreshMs: 60_000,
    leagueSize: 12,
    tokenStorageKey: 'fantasyFootball2026AppKey'
  });

  const state = {
    view: 'draft',
    position: 'ALL',
    query: '',
    feed: [],
    intel: [],
    weather: [],
    plan: [],
    owner: [],
    errors: []
  };

  const VIEW_TITLES = Object.freeze({
    intel: 'INTEL',
    players: 'PLAYERS',
    targets: 'TARGETS',
    cowbell: 'COWBELL',
    injuries: 'INJURIES',
    weather: 'WEATHER',
    draft: 'DRAFT'
  });

  const FILTERED_VIEWS = new Set(['draft', 'players', 'targets', 'cowbell', 'injuries']);
  const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'DEF', 'K'];

  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const content = $('content');
  const filters = $('filters');
  const notice = $('notice');
  const syncPill = $('syncPill');

  const headers = Object.freeze({
    apikey: CONFIG.publishableKey,
    Authorization: `Bearer ${CONFIG.publishableKey}`,
    'Content-Type': 'application/json'
  });

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function normalizePosition(value) {
    const position = String(value || '').toUpperCase();
    return ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].includes(position) ? position : 'X';
  }

  function tierFromYahooRank(rank) {
    const numericRank = Number(rank);
    return Number.isFinite(numericRank) && numericRank > 0
      ? Math.ceil(numericRank / CONFIG.leagueSize)
      : null;
  }

  function uniqueTags(values) {
    return [...new Set(values.filter(Boolean).map((value) => String(value).trim().toUpperCase()).filter(Boolean))];
  }

  function tagsForPlayer(player) {
    return uniqueTags([
      ...(player.intel_tags || []),
      ...(player.tags || []),
      player.user_target ? 'TARGET' : null,
      player.intel_action
    ]);
  }

  function tagClass(tag) {
    const value = String(tag || '').toLowerCase();
    if (value.includes('target')) return 'target';
    if (value.includes('cowbell')) return 'cowbell';
    if (value.includes('bellcow')) return 'bellcow';
    if (value.includes('stack')) return 'stack';
    if (value.includes('injur')) return 'injury';
    if (value.includes('monitor')) return 'monitor';
    if (value.includes('handcuff')) return 'handcuff';
    if (value.includes('workhorse')) return 'workhorse';
    if (value.includes('upgrade')) return 'upgrade';
    if (value.includes('downgrade')) return 'downgrade';
    if (value.includes('avoid')) return 'avoid';
    return '';
  }

  function matchesQuery(record) {
    if (!state.query) return true;
    const searchable = Object.values(record || {})
      .map((value) => Array.isArray(value) ? value.join(' ') : String(value ?? ''))
      .join(' ')
      .toLowerCase();
    return searchable.includes(state.query);
  }

  function matchesPosition(record) {
    if (state.position === 'ALL') return true;
    return normalizePosition(record.position || record.pos) === state.position;
  }

  async function request(path, options = {}) {
    const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `${response.status} ${response.statusText}`);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  async function loadResource(name, path, transform = (value) => value, fallback = []) {
    try {
      const value = await request(path);
      return { name, data: transform(value), error: null };
    } catch (error) {
      return { name, data: fallback, error };
    }
  }

  function feedPlanFallback(feed) {
    return feed
      .filter((player) => player.user_target)
      .map((player) => ({
        player_key: player.player_key,
        yahoo_canonical_name: player.yahoo_name,
        name: player.yahoo_name,
        team: player.team,
        pos: player.position,
        yahoo_rank: player.yahoo_rank,
        tags: player.intel_tags || []
      }))
      .sort(sortByYahooRank);
  }

  function sortByYahooRank(a, b) {
    return (Number(a.yahoo_rank) || 9999) - (Number(b.yahoo_rank) || 9999)
      || String(a.name || a.yahoo_name || '').localeCompare(String(b.name || b.yahoo_name || ''));
  }

  async function loadData() {
    setSync('loading', 'SYNCING');
    const resources = await Promise.all([
      loadResource('players', 'yahoo_canonical_player_feed?select=*&order=yahoo_rank.asc.nullslast,yahoo_name.asc'),
      loadResource('intel', 'intel_items?select=*&status=neq.RESOLVED&order=priority.asc,updated_at.desc'),
      loadResource('weather', 'weather_watch?select=*&order=game_time.asc.nullslast'),
      loadResource('plan', 'draft_command_plan?select=targets,version,league_size,roster_spots&id=eq.1', (rows) => (rows?.[0]?.targets || []).slice().sort(sortByYahooRank)),
      loadResource('owner', 'intel_owner_state?select=*')
    ]);

    const byName = Object.fromEntries(resources.map((resource) => [resource.name, resource]));
    state.feed = byName.players.data;
    state.intel = byName.intel.data;
    state.weather = byName.weather.data;
    state.owner = byName.owner.data;
    state.plan = byName.plan.data.length ? byName.plan.data : feedPlanFallback(state.feed);
    state.errors = resources.filter((resource) => resource.error).map((resource) => resource.name);

    if (!state.feed.length && !state.plan.length && byName.players.error && byName.plan.error) {
      setSync('error', 'ERROR');
    } else if (state.errors.length) {
      setSync('partial', 'PARTIAL');
    } else {
      setSync('live', 'LIVE');
    }

    render();
  }

  function setSync(status, label) {
    syncPill.dataset.state = status;
    $('sync').textContent = label;
  }

  function render() {
    app.dataset.view = state.view;
    $('viewTitle').textContent = VIEW_TITLES[state.view];
    document.querySelectorAll('.nav-inner button').forEach((button) => {
      button.classList.toggle('active', button.dataset.view === state.view);
    });
    renderStats();
    renderFilters();
    renderNotice();
    renderView();
  }

  function renderStats() {
    $('intelCount').textContent = state.intel.length;
    $('highCount').textContent = state.intel.filter((item) => ['HIGH', 'CRITICAL'].includes(String(item.priority || '').toUpperCase())).length;
    $('flagCount').textContent = state.owner.filter((item) => item.is_flagged).length;
    $('targetCount').textContent = state.plan.length;
  }

  function renderFilters() {
    const positions = FILTERED_VIEWS.has(state.view) ? POSITIONS : ['ALL'];
    filters.innerHTML = positions.map((position) => (
      `<button type="button" class="filter-chip ${state.position === position ? 'active' : ''}" data-position="${position}">${position}</button>`
    )).join('');

    filters.querySelectorAll('[data-position]').forEach((button) => {
      button.addEventListener('click', () => {
        state.position = button.dataset.position;
        renderFilters();
        renderView();
      });
    });
  }

  function renderNotice() {
    if (!state.errors.length) {
      notice.hidden = true;
      notice.textContent = '';
      return;
    }
    notice.hidden = false;
    notice.textContent = `Some optional data could not load (${state.errors.join(', ')}). Available sections remain usable.`;
  }

  function renderView() {
    switch (state.view) {
      case 'draft': renderDraft(); break;
      case 'players': renderPlayerList({ targetOnly: false }); break;
      case 'targets': renderPlayerList({ targetOnly: true }); break;
      case 'cowbell': renderCowbell(); break;
      case 'injuries': renderInjuries(); break;
      case 'weather': renderWeather(); break;
      default: renderIntel();
    }
  }

  function activeIntelFor(playerName) {
    const target = String(playerName || '').trim().toLowerCase();
    if (!target) return null;
    return state.intel.find((item) => String(item.player_name || '').trim().toLowerCase() === target) || null;
  }

  function renderDraft() {
    const rows = state.plan
      .filter(matchesPosition)
      .filter(matchesQuery)
      .slice()
      .sort(sortByYahooRank);

    $('viewMeta').textContent = `${rows.length} plan players · Yahoo order`;

    if (!rows.length) {
      content.innerHTML = '<div class="empty">No draft players match this filter.</div>';
      return;
    }

    const tiers = new Map();
    rows.forEach((player) => {
      const tier = tierFromYahooRank(player.yahoo_rank) || 99;
      if (!tiers.has(tier)) tiers.set(tier, []);
      tiers.get(tier).push(player);
    });

    const tierHtml = [...tiers.entries()]
      .sort(([tierA], [tierB]) => tierA - tierB)
      .map(([tier, players]) => renderTier(tier, players))
      .join('');

    content.innerHTML = `
      <div class="draft-summary">
        <div class="draft-summary-card"><span>STATUS</span><strong>PRE</strong></div>
        <div class="draft-summary-card"><span>PLAN</span><strong>${state.plan.length}</strong></div>
        <div class="draft-summary-card"><span>LEAGUE</span><strong>${CONFIG.leagueSize}</strong></div>
        <div class="draft-summary-card"><span>ORDER</span><strong>YAHOO</strong></div>
      </div>
      <div class="tier-grid">${tierHtml}</div>`;
  }

  function renderTier(tier, players) {
    const start = (tier - 1) * CONFIG.leagueSize + 1;
    const end = tier * CONFIG.leagueSize;
    return `
      <section class="tier-box">
        <div class="tier-head">
          <strong>TIER ${tier}</strong>
          <span>Yahoo ${start}-${end} · ${players.length}</span>
        </div>
        ${players.map(renderDraftRow).join('')}
      </section>`;
  }

  function renderDraftRow(player) {
    const position = normalizePosition(player.pos || player.position);
    const name = player.yahoo_canonical_name || player.name || player.yahoo_name || 'Unknown player';
    const intel = activeIntelFor(name);
    const tags = uniqueTags([...(player.tags || []), ...(intel?.draft_tags || []), intel?.action]).slice(0, 5);
    const recommendation = intel?.recommendation || '';

    return `
      <div class="draft-row ${position}">
        <div class="draft-rank">${escapeHtml(player.yahoo_rank ?? '—')}</div>
        <span class="position-badge ${position}">${position}</span>
        <div class="draft-player">
          <div class="draft-name">${escapeHtml(name)}</div>
          <div class="draft-meta">${escapeHtml(player.team || '')} · Yahoo #${escapeHtml(player.yahoo_rank ?? '—')}</div>
          ${tags.length ? `<div class="tags">${tags.map(renderTag).join('')}</div>` : ''}
          ${recommendation ? `<div class="draft-intel">${escapeHtml(recommendation)}</div>` : ''}
        </div>
        <span class="ready">READY</span>
      </div>`;
  }

  function renderPlayerList({ targetOnly }) {
    const players = state.feed
      .filter((player) => !targetOnly || player.user_target)
      .filter(matchesPosition)
      .filter(matchesQuery)
      .slice()
      .sort(sortByYahooRank);

    $('viewMeta').textContent = `${players.length} players`;
    content.innerHTML = `<div class="list-stack">${players.map(renderPlayerCard).join('') || '<div class="empty">No players match.</div>'}</div>`;
    bindTargetButtons();
  }

  function renderPlayerCard(player) {
    const position = normalizePosition(player.position);
    const tags = tagsForPlayer(player).slice(0, 6);
    return `
      <article class="card">
        <div class="card-top">
          <span class="position-badge ${position}">${position}</span>
          <div style="display:flex;align-items:center;gap:7px">
            <span class="rank-badge">Yahoo #${escapeHtml(player.yahoo_rank ?? '—')}</span>
            <button type="button" class="target-toggle ${player.user_target ? 'active' : ''}" data-player-key="${escapeHtml(player.player_key)}" data-target="${player.user_target ? 'false' : 'true'}" aria-label="${player.user_target ? 'Remove target' : 'Add target'}">${player.user_target ? '★' : '☆'}</button>
          </div>
        </div>
        <div class="card-name">${escapeHtml(player.yahoo_name)}</div>
        <div class="card-meta">${escapeHtml(player.team || '')} · Tier ${escapeHtml(tierFromYahooRank(player.yahoo_rank) || '—')}</div>
        ${tags.length ? `<div class="tags">${tags.map(renderTag).join('')}</div>` : ''}
        ${player.intel_recommendation ? `<div class="card-rec">${escapeHtml(player.intel_recommendation)}</div>` : ''}
      </article>`;
  }

  function renderCowbell() {
    const players = state.feed
      .filter((player) => tagsForPlayer(player).some((tag) => tag.includes('COWBELL') || tag.includes('BELLCOW') || tag.includes('WORKHORSE')))
      .filter(matchesPosition)
      .filter(matchesQuery)
      .slice()
      .sort(sortByYahooRank);

    $('viewMeta').textContent = `${players.length} cowbell players`;
    content.innerHTML = `<div class="list-stack">${players.map(renderPlayerCard).join('') || '<div class="empty">No cowbell players match.</div>'}</div>`;
    bindTargetButtons();
  }

  function renderInjuries() {
    const injuryPattern = /injur|practice|pup|\bir\b/i;
    const players = state.feed
      .filter((player) => tagsForPlayer(player).some((tag) => tag.includes('INJUR') || tag.includes('MONITOR'))
        || injuryPattern.test(`${player.intel_what_changed || ''} ${player.intel_recommendation || ''}`))
      .filter(matchesPosition)
      .filter(matchesQuery)
      .slice()
      .sort(sortByYahooRank);

    $('viewMeta').textContent = `${players.length} injury watches`;
    content.innerHTML = `<div class="list-stack">${players.map(renderPlayerCard).join('') || '<div class="empty">No injury watches match.</div>'}</div>`;
    bindTargetButtons();
  }

  function renderIntel() {
    const items = state.intel.filter(matchesQuery);
    $('viewMeta').textContent = `${items.length} active intel items`;
    content.innerHTML = `<div class="list-stack">${items.map((item) => {
      const position = normalizePosition(item.position);
      const action = item.action || 'MONITOR';
      return `
        <article class="card">
          <div class="card-top">
            <span class="position-badge ${position}">${position}</span>
            <span class="tag ${tagClass(action)}">${escapeHtml(action)}</span>
          </div>
          <div class="card-name">${escapeHtml(item.player_name)}</div>
          <div class="card-meta">${escapeHtml(item.team || '')} · ${escapeHtml(item.priority || '')}</div>
          <div class="card-text">${escapeHtml(item.what_changed || '')}</div>
          ${item.recommendation ? `<div class="card-rec"><b>WHAT TO DO</b><br>${escapeHtml(item.recommendation)}</div>` : ''}
        </article>`;
    }).join('') || '<div class="empty">No active intel.</div>'}</div>`;
  }

  function renderWeather() {
    const games = state.weather.filter(matchesQuery);
    $('viewMeta').textContent = `${games.length} watched games`;
    content.innerHTML = `<div class="list-stack">${games.map((game) => `
      <article class="card">
        <div class="card-name">${escapeHtml(game.away_team)} @ ${escapeHtml(game.home_team)}</div>
        <div class="card-meta">${escapeHtml(game.venue || '')}${game.condition ? ` · ${escapeHtml(game.condition)}` : ''}</div>
        <div class="card-text">Wind ${escapeHtml(game.wind_mph ?? '—')} mph · Temp ${escapeHtml(game.temperature_f ?? '—')}°F · Precip ${escapeHtml(game.precipitation_pct ?? '—')}%</div>
        <div class="card-rec">${escapeHtml(game.fantasy_impact || 'No material weather impact yet.')}</div>
      </article>`).join('') || '<div class="empty">No material weather items yet.</div>'}</div>`;
  }

  function renderTag(tag) {
    return `<span class="tag ${tagClass(tag)}">${escapeHtml(tag)}</span>`;
  }

  function bindTargetButtons() {
    content.querySelectorAll('.target-toggle').forEach((button) => {
      button.addEventListener('click', () => toggleTarget(button.dataset.playerKey, button.dataset.target === 'true'));
    });
  }

  async function toggleTarget(playerKey, targetValue) {
    const token = localStorage.getItem(CONFIG.tokenStorageKey);
    if (!token) {
      openKeyModal();
      return;
    }

    try {
      await request('rpc/mobile_set_target', {
        method: 'POST',
        body: JSON.stringify({ p_token: token, p_player_key: playerKey, p_target: targetValue })
      });
      const player = state.feed.find((item) => item.player_key === playerKey);
      if (player) player.user_target = targetValue;
      await loadData();
    } catch (error) {
      window.alert('Target update failed. Check the app key and try again.');
    }
  }

  function openKeyModal() {
    $('keyInput').value = localStorage.getItem(CONFIG.tokenStorageKey) || '';
    $('keyModal').hidden = false;
    window.setTimeout(() => $('keyInput').focus(), 0);
  }

  function closeKeyModal() {
    $('keyModal').hidden = true;
  }

  function saveKey() {
    const value = $('keyInput').value.trim();
    if (value) localStorage.setItem(CONFIG.tokenStorageKey, value);
    closeKeyModal();
  }

  function setView(view) {
    state.view = view;
    state.position = 'ALL';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindEvents() {
    $('search').addEventListener('input', (event) => {
      state.query = event.target.value.trim().toLowerCase();
      renderView();
    });

    document.querySelectorAll('.nav-inner button').forEach((button) => {
      button.addEventListener('click', () => setView(button.dataset.view));
    });

    $('keyButton').addEventListener('click', openKeyModal);
    $('saveKeyButton').addEventListener('click', saveKey);
    document.querySelectorAll('[data-close-modal]').forEach((element) => element.addEventListener('click', closeKeyModal));
    $('keyInput').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') saveKey();
      if (event.key === 'Escape') closeKeyModal();
    });
  }

  bindEvents();
  loadData();
  window.setInterval(loadData, CONFIG.refreshMs);
})();
