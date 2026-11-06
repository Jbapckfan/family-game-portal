import {GAMES, LAUNCH_GAMES, CREATORS, BONUS_GAMES, gameURL, featuredGames, todayThree, dailyJourney, buildDailyShare} from './catalog.mjs';
import {startPlaytest} from './playtest.mjs';

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const dateParts = new Intl.DateTimeFormat('en-US', {timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'});
const dateLabel = new Intl.DateTimeFormat('en-US', {timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'});

export function dateKey(now = new Date()) {
  const parts = Object.fromEntries(dateParts.formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function readJSON(storage, key) {
  let raw;
  try {raw = storage.getItem(key);} catch {return {available: false, value: null};}
  if (raw === null) return {available: true, value: null};
  try {return {available: true, value: JSON.parse(raw)};} catch {return {available: true, value: null};}
}

function stableJSON(value) {
  if (Array.isArray(value)) return `[${value.map(stableJSON).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJSON(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

/** Read only. Validation is delegated to the same engine used when playing. */
export function readDailyStatus({slug, engine, puzzles, storage, now = new Date()}) {
  const daily = engine.getDaily(puzzles, now);
  const saved = readJSON(storage, `${slug}:v1:daily:${daily.dateKey}`);
  const records = readJSON(storage, `${slug}:v1:records`);
  const record = records.value && typeof records.value === 'object' && !Array.isArray(records.value)
    ? records.value[daily.dateKey] : null;
  // The shell preserves the first valid daily record. It may survive an
  // interrupted or quota-limited write of the full game, or vice versa.
  if (record && engine.getStats({[daily.dateKey]: record}, daily.dateKey).played === 1) {
    return {status: record.status, dateKey: daily.dateKey};
  }
  const game = engine.restoreGame(daily.puzzle, saved.value);
  if (['won', 'lost', 'revealed'].includes(game.status)) return {status: game.status, dateKey: daily.dateKey};
  if (!saved.available || !records.available) return {status: 'unavailable', dateKey: daily.dateKey};
  return {status: stableJSON(game) === stableJSON(engine.createGame(daily.puzzle)) ? 'new' : 'playing', dateKey: daily.dateKey};
}


/** Imported game snapshots contain status only; each game's detailed saves stay namespaced. */
export function readKimiStatus({slug, storage, now = new Date()}) {
  const key = dateKey(now);
  const prefix = `${slug}:v1:` + (slug === 'qwen-territory-tactics' ? 'edition:exact-v2:' : '');
  const saved = readJSON(storage, `${prefix}status:${key}`);
  const records = readJSON(storage, `${prefix}records`);
  const record = records.value && !Array.isArray(records.value) ? records.value[key] : null;
  if (['won','lost','revealed'].includes(record?.status)) return {status:record.status,dateKey:key};
  if (!saved.available || !records.available) return {status:'unavailable',dateKey:key};
  return {status:['playing','won','lost','revealed'].includes(saved.value?.status) ? saved.value.status : 'new',dateKey:key};
}

const STATUS = Object.freeze({
  loading: {label: '', action: 'Play today'},
  new: {label: '', action: 'Play today'},
  playing: {label: 'In progress', action: 'Continue'},
  won: {label: 'Solved', action: 'See result'},
  lost: {label: 'Not solved', action: 'See result'},
  revealed: {label: 'Revealed', action: 'See result'},
  unavailable: {label: 'Progress unavailable', action: 'Play today'},
});

function card(game, url) {
  return `<article class="preference-card" data-pref-game="${game.slug}" data-pref-creator="${game.creator}"><a class="game-card ${game.group === 'logic' ? 'word' : game.group}-card game-${game.slug}" href="${escape(url)}" data-game="${game.slug}" data-creator="${game.creator}">
    <div class="card-topline"><span class="game-category">${escape(game.category)}</span><span class="game-status" data-status="loading" hidden><span class="status-dot" aria-hidden="true"></span><span data-status-label></span></span></div>
    <div class="card-motif"><img src="${escape(new URL('icon.svg', url).href)}" width="96" height="96" alt="" loading="lazy"></div>
    <div class="card-copy"><h3>${escape(game.name)}</h3><span class="creator-credit">${escape(game.credit || `Developed by ${game.creator}`)}</span><p>${escape(game.description)}</p></div>
    <div class="card-bottom"><span class="card-detail">${game.boards.toLocaleString('en-US')} puzzles · Practice anytime</span><span class="card-action"><span data-action-label>Play today</span><span class="card-arrow" aria-hidden="true">↗</span></span></div>
  </a><div data-pref-controls="${game.slug}" data-pref-name="${escape(game.name)}"></div></article>`;
}

export function startHome(doc = document, win = window) {
  const $ = id => doc.getElementById(id);
  const base = doc.documentElement.dataset.gameBase || './games/';
  const urls = new Map(GAMES.map(game => [game.slug, gameURL(game.slug, base, doc.baseURI)]));
  doc.querySelectorAll('[data-first-game]').forEach(link=>{link.href=urls.get(link.dataset.firstGame);});
  for (const group of ['flagship', 'word', 'logic', 'classic']) {
    $(`${group}-games`).innerHTML = GAMES.filter(game => game.group === group).map(game => card(game, urls.get(game.slug))).join('');
  }
  $('featured-games').innerHTML = featuredGames().map(game => card(game, urls.get(game.slug))).join('');
  $('bonus-games').innerHTML=BONUS_GAMES.map(game=>`<article class="preference-card" data-pref-game="${game.slug}" data-pref-creator="${game.creator}"><a class="bonus-card" href="${escape(new URL(game.slug+'/',new URL(base,doc.baseURI)).href)}" data-bonus="${game.slug}"><img src="${escape(new URL(game.slug+'/icon.svg',new URL(base,doc.baseURI)).href)}" width="56" height="56" alt=""><div><span class="eyebrow">A change of pace · Local AI</span><h3>${escape(game.name)}</h3><p>${escape(game.description)}</p></div><span class="card-action">Play a match ↗</span></a><div data-pref-controls="${game.slug}" data-pref-name="${escape(game.name)}"></div></article>`).join('');
  $('progress-marks').innerHTML = LAUNCH_GAMES.map(game => `<li class="progress-mark game-${game.slug}" data-mark="${game.slug}" title="${escape(game.name)}"><span class="mark-symbol" aria-hidden="true"></span><span class="sr-only">${escape(game.name)}: checking progress</span></li>`).join('');

  const filterButtons = doc.querySelectorAll('[data-creator-filter]');
  let selectedCreator = 'All', preferences = null, favoritesOnly = false, showHidden = false;
  const allGames = [...GAMES,...BONUS_GAMES];
  function allowed(game) {
    const pref = preferences?.readPreferences(game.slug,win) || {favorite:false,hidden:false};
    return (selectedCreator === 'All' || game.creator === selectedCreator) && (!favoritesOnly || pref.favorite) && (showHidden || !pref.hidden);
  }
  function applyFilter(value = selectedCreator, announce = true) {
    selectedCreator = CREATORS.includes(value) ? value : 'All';
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.creatorFilter === selectedCreator)));
    doc.querySelectorAll('[data-pref-game]').forEach(item => {
      const game = allGames.find(game => game.slug === item.dataset.prefGame);
      const hides = game ? !allowed(game) : false;
      if(hides && item.contains(doc.activeElement)) $('show-hidden')?.focus();
      item.hidden = hides;
      const pref = preferences?.readPreferences(item.dataset.prefGame,win);
      item.classList.toggle('is-hidden-game',Boolean(pref?.hidden));
    });
    for (const group of ['flagship','word','logic','classic']) {
      $(`${group}-games`).closest('section').hidden = !GAMES.some(game => game.group === group && allowed(game));
    }
    const visible = GAMES.filter(allowed);
    const puzzles = visible.reduce((sum,game) => sum+game.boards,0);
    $('filter-summary').textContent = `${visible.length} daily games · ${puzzles.toLocaleString('en-US')} puzzles${selectedCreator === 'All' ? '' : ` · ${selectedCreator}`}`;
    const empty = $('preferences-empty');
    if (empty) empty.hidden = allGames.some(allowed);
    const note = $('preference-summary');
    if (note) {
      const hiddenCount=allGames.filter(game=>preferences?.readPreferences(game.slug,win).hidden).length;
      note.textContent = `${favoritesOnly ? 'Showing favorites' : 'Showing all games'}${showHidden ? ', including hidden games' : ` · ${hiddenCount} hidden`}. Filters change the cards shown; today’s set and records stay unchanged.`;
    }
    if (announce) { try {win.localStorage.setItem('alford:catalog:creator',selectedCreator);} catch {} }
  }
  function mountPreferences() {
    if (!preferences) return;
    doc.querySelectorAll('[data-pref-controls]').forEach(container => preferences.mountPreferenceButtons(container,container.dataset.prefControls,container.dataset.prefName,win));
    applyFilter(selectedCreator,false);
    const errors=allGames.map(game=>preferences.readPreferences(game.slug,win).error).filter(Boolean);
    if ($('preference-error')) $('preference-error').textContent=errors[0] || '';
  }
  filterButtons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.creatorFilter)));
  $('favorites-only')?.addEventListener('click',()=>{
    favoritesOnly=!favoritesOnly; $('favorites-only').setAttribute('aria-pressed',String(favoritesOnly));applyFilter(selectedCreator,false);
  });
  $('show-hidden')?.addEventListener('click',()=>{
    showHidden=!showHidden; $('show-hidden').setAttribute('aria-pressed',String(showHidden));applyFilter(selectedCreator,false);
  });
  $('browse-all').addEventListener('click', () => { favoritesOnly=false;$('favorites-only')?.setAttribute('aria-pressed','false');applyFilter('All'); $('today').focus(); });
  let savedFilter = 'All'; try {savedFilter = win.localStorage.getItem('alford:catalog:creator') || 'All';} catch {}
  applyFilter(savedFilter, false);
  // Preserve synchronous startHome and support both the collection root and games/daily.
  const preferencesReady = import(new URL('deepseek-runtime/player-tools.mjs',new URL(base,doc.baseURI)).href).then(module=>{
    preferences=module;mountPreferences();
    win.addEventListener(module.PREFERENCE_EVENT,()=>applyFilter(selectedCreator,false));
    win.addEventListener('storage',event=>{if(event.key===null||event.key.startsWith(module.PREFERENCE_PREFIX))mountPreferences();});
    return module;
  }).catch(()=>{if($('preference-error'))$('preference-error').textContent='Game preference controls could not load. Reload to try again.';});

  const imports = new Map();
  function runtime(slug) {
    if (!imports.has(slug)) {
      const url = urls.get(slug);
      imports.set(slug, Promise.all([import(new URL('engine.mjs', url).href), import(new URL('puzzles.mjs', url).href)])
        .then(([engine, content]) => ({engine, puzzles: content.PUZZLES})));
    }
    return imports.get(slug);
  }

  let sequence = 0;
  let shownDate;
  let shareSnapshot = null;
  let shareGeneration = 0;
  startPlaytest(doc,win,()=>({date:dateKey(),results:shareSnapshot?.date===dateKey()?shareSnapshot.results:[]}));
  async function refresh() {
    const current = ++sequence;
    const now = new Date();
    const nextDate = dateKey(now), dayChanged = nextDate !== shownDate;
    shownDate = nextDate;
    $('share-today').disabled = true;
    if (dayChanged) {
      shareGeneration++;
      $('todays-three').innerHTML = todayThree(shownDate).map(game => card(game, urls.get(game.slug))).join('');
      mountPreferences();
      applyFilter(selectedCreator,false);
      $('share-fallback').hidden = true; $('share-text').value = ''; $('share-status').textContent = '';
    }
    $('today-date').dateTime = shownDate;
    $('today-date').textContent = dateLabel.format(now);
    let storage;
    try {storage = win.localStorage;} catch {storage = null;}
    const results = await Promise.all(GAMES.map(async game => {
      try {return {slug: game.slug, ...(game.runtime !== 'alford' ? readKimiStatus({slug:game.slug, storage, now}) : readDailyStatus({slug: game.slug, ...await runtime(game.slug), storage, now}))};}
      catch {return {slug: game.slug, status: 'unavailable', dateKey: shownDate};}
    }));
    if (current !== sequence) return;
    for (const result of results) {
      const state = STATUS[result.status] || STATUS.unavailable;
      doc.querySelectorAll(`[data-game="${result.slug}"]`).forEach(item => {
        item.querySelector('[data-status]').dataset.status = result.status;
        item.querySelector('[data-status-label]').textContent = state.label;
        item.querySelector('[data-status]').hidden = !state.label;
        item.querySelector('[data-action-label]').textContent = state.action;
      });
      const mark = doc.querySelector(`[data-mark="${result.slug}"]`);
      if (mark) {
        const game = GAMES.find(item => item.slug === result.slug);
        mark.dataset.status = result.status;
        mark.title = state.label ? `${game.name}: ${state.label}` : game.name;
        mark.querySelector('.sr-only').textContent = state.label ? `${game.name}: ${state.label}` : game.name;
        mark.querySelector('.mark-symbol').textContent = result.status === 'won' ? '✓' : result.status === 'playing' ? '·' : '';
      }
    }
    const launch = results.filter(result => LAUNCH_GAMES.some(game => game.slug === result.slug));
    const solved = launch.filter(result => result.status === 'won').length;
    const unavailable = launch.filter(result => result.status === 'unavailable').length;
    $('progress-count').textContent = unavailable === LAUNCH_GAMES.length ? 'Saved progress is unavailable'
      : unavailable ? `${solved} of ${GAMES.length} solved · some saves unavailable`
      : solved === GAMES.length ? `${GAMES.length} of ${GAMES.length} solved. A day well played.` : `${solved} of ${GAMES.length} solved today`;
    $('progress-note').hidden = !unavailable;
    $('progress-note').textContent = unavailable ? 'You can still choose a game. This page could not read every saved result on this device.' : '';
    const journey=dailyJourney(shownDate,results);
    $('three-progress').textContent = journey.complete?`Daily set complete · ${journey.solved} of ${journey.games.length} solved`:`${journey.finished} of ${journey.games.length} finished · ${journey.solved} solved`;
    $('daily-set-note').textContent=journey.complete?'A set well played. Share your result, try Practice, or return for a fresh set tomorrow.':'No timer. No need to play everything. Start one, and return whenever you like.';
    shareSnapshot = {date: shownDate, results};
    $('share-today').disabled = false;
  }

  $('share-today').addEventListener('click', async () => {
    if (!shareSnapshot || shareSnapshot.date !== dateKey()) {
      await refresh(); $('share-status').textContent = 'A new day is ready. Tap Share again for today’s result.'; return;
    }
    const capturedDate = shareSnapshot.date, request = ++shareGeneration;
    const isCurrentShare = () => request === shareGeneration && capturedDate === dateKey() && shareSnapshot?.date === capturedDate;
    const text = buildDailyShare(capturedDate, shareSnapshot.results);
    $('share-status').textContent = '';
    try {
      if (win.navigator.share) { await win.navigator.share({title: 'Alford Daily', text}); return; }
      if (win.navigator.clipboard?.writeText) { await win.navigator.clipboard.writeText(text); if (isCurrentShare()) $('share-status').textContent = 'Result copied. No answers included.'; return; }
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
    if (!isCurrentShare()) return;
    $('share-text').value = text; $('share-fallback').hidden = false;
    $('share-status').textContent = 'Select and copy your result below. No answers included.';
    $('share-text').focus(); $('share-text').select();
  });

  const dialog = $('about-dialog');
  let returnFocus;
  function closeAbout() {dialog.close();}
  doc.querySelectorAll('[data-open-about]').forEach(button => button.addEventListener('click', () => {
    returnFocus = doc.activeElement;
    dialog.showModal();
    $('close-about').focus();
  }));
  $('close-about').addEventListener('click', closeAbout);
  $('about-done').addEventListener('click', closeAbout);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeAbout();
  });
  dialog.addEventListener('close', () => {if (returnFocus?.isConnected) returnFocus.focus();});
  win.addEventListener('storage', event => {
    if (event.key === null || GAMES.some(game => event.key.startsWith(`${game.slug}:v1:`))) void refresh();
  });
  win.addEventListener('pageshow', () => {mountPreferences();void refresh();});
  win.addEventListener('focus', () => {if (dateKey() !== shownDate) void refresh();});
  doc.addEventListener('visibilitychange', () => {if (doc.visibilityState === 'visible') void refresh();});
  win.setInterval(() => {if (doc.visibilityState === 'visible' && dateKey() !== shownDate) void refresh();}, 30_000);
  void refresh();
  return {refresh,preferencesReady};
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') startHome();
