import {practiceCandidates} from '../deepseek-runtime/practice-calendar.mjs';
/** Shared daily/practice shell. Game rules and game-specific rendering stay in the adapter. */
export const esc = value => String(value).replace(/[&<>"']/g, character => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
}[character]));

export function createShell(config) {
  const { slug, name, puzzles, engine } = config;
  const $ = id => document.getElementById(id);
  const prefix = slug + ':v1:';
  const memory = new Map();
  const dirtyKeys = new Set();
  const acceptedSaves = new Map();
  const dialog = $('game-dialog');
  let mode = 'daily';
  let daily = engine.getDaily(puzzles);
  let puzzle = daily.puzzle;
  let game = engine.restoreGame(puzzle, read('daily:' + daily.dateKey, null, true));
  let records = {};
  let feedback = '';
  let feedbackTone = null;
  let defaultFeedback = '';
  let defaultNote = '';
  let storageWarning = false;
  let soundOn = read('settings', {})?.sound === true;
  let audioContext;
  let lastFocus = null;
  let toastTimer;
  let resultTimer;
  let started = false;

  const api = {
    get game() { return game; }, get puzzle() { return puzzle; },
    get mode() { return mode; }, get isBonus() { return mode === 'practice' && puzzle.id === config.sample?.id; }, get daily() { return daily; },
    start, render, commit, notice, announce, openDialog, closeDialog,
    toast, sound, showResult, randomPractice,
  };

  // The bundled iOS app owns this optional bridge. Browser play is unchanged.
  function nativeMessage(payload) {
    try {
      const handler = window.webkit?.messageHandlers?.alford;
      if (!handler?.postMessage) return false;
      handler.postMessage({...payload, slug});
      return true;
    } catch { return false; }
  }

  function storedValue(key) {
    try {
      const raw = localStorage.getItem(prefix + key);
      return raw === null ? null : JSON.parse(raw);
    } catch { return null; }
  }
  function read(key, fallback, acceptGame = false) {
    if (dirtyKeys.has(key) && memory.has(key)) return memory.get(key);
    let value;
    try {
      const raw = localStorage.getItem(prefix + key);
      value = raw === null ? null : JSON.parse(raw);
      // Statistics and practice availability inspect saves without loading them
      // into the active board. Only an actual board load acknowledges its bytes.
      if (acceptGame) acceptedSaves.set(key, raw);
    } catch { value = null; }
    if (value !== null) { memory.set(key, value); return value; }
    return memory.has(key) ? memory.get(key) : fallback;
  }
  function write(key, value, storageReadable = true) {
    memory.set(key, value);
    try {
      // A denied read is not evidence that this key is empty. Stay in memory
      // until storage can be checked, even when the browser still allows writes.
      if (!storageReadable) throw new Error('Storage could not be verified for this action.');
      localStorage.getItem(prefix + key);
      const raw = JSON.stringify(value);
      localStorage.setItem(prefix + key, raw);
      acceptedSaves.set(key, raw);
      dirtyKeys.delete(key);
      storageWarning = dirtyKeys.size > 0;
      return true;
    } catch {
      dirtyKeys.add(key);
      if (!storageWarning) toast('You can play, but this browser could not save your progress.');
      storageWarning = true;
      return false;
    }
  }
  function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function validRecord(dateKey, value) { return engine.getStats({[dateKey]:value}, dateKey).played === 1; }
  function mergeRecords() {
    records = {...records, ...object(read('records', {}))};
    // A dirty local records object can coexist with a different day's result from
    // another tab. Merge valid persisted records before writing the combined set.
    for (const [dateKey, value] of Object.entries(object(storedValue('records')))) {
      if (validRecord(dateKey, value)) records[dateKey] = value;
    }
  }
  function recordTerminal(dateKey, state) {
    if (state.status === 'playing' || validRecord(dateKey, records[dateKey])) return;
    const value = config.record(state);
    if (!validRecord(dateKey, value)) return;
    records = {...records, [dateKey]:value};
    write('records', records);
  }
  function reconcile() {
    mergeRecords();
    if (mode === 'daily') recordTerminal(daily.dateKey, game);
    const current = engine.getDaily(puzzles);
    recordTerminal(current.dateKey, engine.restoreGame(current.puzzle, read('daily:' + current.dateKey, null)));
  }
  function gameKey() { return mode === 'daily' ? 'daily:' + daily.dateKey : 'practice:' + puzzle.id; }
  function isTerminal(state) { return state.status !== 'playing'; }
  function save(nextState) {
    const key = gameKey();
    let raw;
    try { raw = localStorage.getItem(prefix + key); } catch {}
    let persisted = null;
    try { persisted = engine.restoreGame(puzzle, raw === null ? null : JSON.parse(raw)); } catch {}
    const changed = raw !== undefined && (acceptedSaves.has(key) ? raw !== acceptedSaves.get(key) : raw !== null);
    if (changed && persisted && !(mode === 'daily' && isTerminal(game) && !isTerminal(persisted))) {
      // Storage events can arrive late in suspended tabs. Check the accepted
      // snapshot again at the write boundary, including before practice resets.
      game = persisted;
      memory.set(key, game);
      acceptedSaves.set(key, raw);
      dirtyKeys.delete(key);
      storageWarning = dirtyKeys.size > 0;
      if (mode === 'daily') { mergeRecords(); recordTerminal(daily.dateKey, game); }
      return isTerminal(game) && mode === 'daily'
        ? 'This daily was already finished. Your saved result is restored.'
        : 'Progress changed in another window. Your saved board is restored; try your move again.';
    }
    let adopted = null;
    if (mode === 'daily') {
      // Consult persisted data even if this tab has dirty memory: the first
      // finished daily wins across sequential tab actions. localStorage does
      // not provide a transaction for literally simultaneous writes.
      const existing = persisted && isTerminal(persisted) ? persisted : isTerminal(game) ? game : null;
      if (existing) {
        if (JSON.stringify(existing) !== JSON.stringify(nextState)) adopted = 'This daily was already finished. Your saved result is restored.';
        nextState = existing;
      }
      mergeRecords();
    }
    game = nextState;
    write(key, game, raw !== undefined);
    if (mode === 'daily') recordTerminal(daily.dateKey, game);
    return adopted;
  }
  function commit(nextState, {message = '', tone = null, opts = {}} = {}) {
    const wasPlaying = game.status === 'playing';
    const adopted = save(nextState);
    if (adopted) {
      config.reset?.();
      feedback = adopted;
      feedbackTone = null;
      toast(feedback);
      if (dialog.open) closeDialog();
    } else if (message) {
      feedback = message;
      feedbackTone = tone === 'miss' || tone === 'error' ? 'error' : tone === 'win' || tone === 'fit' || tone === 'success' ? 'success' : null;
    }
    if (!adopted && tone) sound(tone);
    render(adopted ? {} : opts);
    if (feedback) announce(feedback);
    if (wasPlaying && isTerminal(game)) {
      clearTimeout(resultTimer);
      resultTimer = setTimeout(showResult, 650);
    }
    return game;
  }
  function announce(message) {
    $('announcer').textContent = '';
    requestAnimationFrame(() => { $('announcer').textContent = message; });
  }
  function notice(message) {
    feedback = message;
    feedbackTone = null;
    $('feedback').textContent = message;
    $('feedback').className = 'feedback';
    announce(message);
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3800);
  }
  function dateLabel(key) {
    return new Intl.DateTimeFormat('en-US', {weekday:'long', month:'long', day:'numeric', timeZone:'UTC'}).format(new Date(key + 'T12:00:00Z'));
  }
  function updateNewDay() { $('new-day').hidden = mode !== 'daily' || engine.getDateKey() === daily.dateKey; }
  function render(opts = {}) {
    const active = game.status === 'playing';
    const isSample = mode === 'practice' && puzzle.id === config.sample?.id;
    $('sample-button')?.setAttribute('aria-pressed', String(isSample));
    $('sample-button').textContent = isSample ? 'Bonus challenge selected' : 'Try the bonus challenge →';
    $('daily-tab').classList.toggle('active', mode === 'daily');
    $('daily-tab').setAttribute('aria-pressed', String(mode === 'daily'));
    $('practice-tab').classList.toggle('active', mode === 'practice');
    $('practice-tab').setAttribute('aria-pressed', String(mode === 'practice'));
    $('issue').textContent = mode === 'daily' ? `NO. ${String(daily.number).padStart(3, '0')}` : isSample ? 'BONUS' : `PRACTICE ${String(puzzles.indexOf(puzzle) + 1).padStart(2, '0')}`;
    $('puzzle-date').textContent = mode === 'daily' ? dateLabel(daily.dateKey) : puzzle.title;
    $('difficulty').textContent = puzzle.difficulty;
    $('game-controls').hidden = !active;
    $('finished-actions').hidden = active;
    $('next-button').textContent = mode === 'daily' ? 'Try a practice →' : 'Another puzzle →';
    $('results-button').textContent = game.status === 'won' ? 'Your result ↗' : 'See the result ↗';
    $('feedback').textContent = feedback || (active ? defaultFeedback : game.status === 'won' ? 'Nicely solved.' : game.status === 'lost' ? 'That was not the answer. There is another puzzle waiting.' : 'Answers revealed. Ready for another?');
    $('feedback').className = `feedback${feedbackTone ? ' ' + feedbackTone : game.status === 'won' ? ' success' : ''}`;
    $('board-note').textContent = storageWarning ? 'Progress could not be saved in this browser.' : isSample ? 'Bonus challenge · separate result, no daily streak impact.' : defaultNote;
    $('board-note').classList.toggle('warning', storageWarning);
    updateNewDay();
    config.render(api, opts);
    nativeMessage({type:'progress',name,mode,dateKey:daily.dateKey,status:game.status,
      stats:engine.getStats(records,engine.getDateKey())});
  }
  function openDialog(html) {
    clearTimeout(resultTimer);
    if (!dialog.open) lastFocus = document.activeElement;
    $('dialog-content').innerHTML = html;
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => ($('dialog-content').querySelector('[autofocus]') || $('dialog-close')).focus());
  }
  function closeDialog() {
    if (dialog.open) dialog.close();
    requestAnimationFrame(() => {
      if (lastFocus?.isConnected && !lastFocus.disabled && lastFocus.getClientRects().length) lastFocus.focus({preventScroll:true});
      else (isTerminal(game) ? $('results-button') : $('puzzle')).focus({preventScroll:true});
    });
  }
  function showResult() {
    if (!isTerminal(game)) return;
    const home = window.webkit?.messageHandlers?.alford ? 'alford://app/' : ($('family-link').href || '../daily/');
    openDialog(config.result(api) + `<a class="return-to-daily" href="${esc(home)}">Back to today’s set →</a>`);
  }
  function showHelp() {
    if (!config.lesson) { openDialog(config.help); return; }
    const lesson=config.lesson;
    const rules=config.help.replaceAll('id="dialog-title"','').replace(/<div class="dialog-actions">[\s\S]*?<\/div>/g,'');
    openDialog(`<p class="dialog-kicker">TRY THE RULE</p><h2 class="dialog-title" id="dialog-title">A small ${esc(name)} warm-up.</h2><p class="lesson-question">${esc(lesson.question)}</p><div class="lesson-choices">${lesson.choices.map((choice,index)=>`<button type="button" data-lesson-choice="${index}" aria-describedby="lesson-feedback">${esc(choice.label)}</button>`).join('')}</div><p id="lesson-feedback" class="lesson-feedback" role="status">Choose an answer. This example never changes your Daily or hints.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Play the puzzle →</button></div><details class="full-rules"><summary>Read all the rules</summary>${rules}</details>`);
  }
  function showStats() {
    reconcile();
    const stats = engine.getStats(records, engine.getDateKey());
    openDialog(`<p class="dialog-kicker">YOUR DAILY RITUAL</p><h2 class="dialog-title" id="dialog-title">Your ${esc(name)} record.</h2><div class="stats-grid"><div><div class="stat-number">${stats.played}</div><div class="stat-label">Completed</div></div><div><div class="stat-number">${stats.played ? Math.round(stats.won / stats.played * 100) : 0}%</div><div class="stat-label">Solved</div></div><div><div class="stat-number">${stats.streak}</div><div class="stat-label">Current streak</div></div><div><div class="stat-number">${stats.bestStreak}</div><div class="stat-label">Best streak</div></div></div>${config.statsExtra?.(stats) || ''}<p class="fineprint">Daily results are saved in this browser.<br>Only solved daily puzzles extend a streak.<br>Practice is separate. Clearing browser data removes progress.</p>`);
  }
  function savedPractice(index, acceptGame = false) {
    const candidate = puzzles[index];
    if (!candidate) return null;
    const raw = read('practice:' + candidate.id, null, acceptGame);
    if (raw?.puzzleId !== candidate.id) return null;
    const saved = engine.restoreGame(candidate, raw);
    // Validators return a fresh state for malformed saves; that fallback must
    // not count as an already-opened round that can bypass the reservation.
    if (JSON.stringify(saved) !== JSON.stringify(engine.createGame(candidate))) return saved;
    return Object.keys(saved).every(key => JSON.stringify(raw[key]) === JSON.stringify(saved[key])) ? saved : null;
  }
  function unfinishedPractice(index) {
    const saved = savedPractice(index);
    return saved?.status === 'playing';
  }
  function practiceIndices() {
    const current = engine.getDaily(puzzles), todayIndex = puzzles.findIndex(item => item.id === current.puzzle.id);
    const indices = practiceCandidates(slug, current.dateKey, puzzles.length, {excludeIndices:[todayIndex]});
    const saved = read('daily:' + current.dateKey, null);
    if (todayIndex >= 0 && saved?.puzzleId === current.puzzle.id && isTerminal(engine.restoreGame(current.puzzle, saved)) && !indices.includes(todayIndex)) indices.push(todayIndex);
    return indices;
  }
  function canPractice(index) {
    return Number.isInteger(index) && Boolean(puzzles[index]) && (practiceIndices().includes(index) || unfinishedPractice(index));
  }
  function showPractice() {
    const fresh = new Set(practiceIndices());
    const available = puzzles.map((_, index) => index).filter(index => fresh.has(index) || unfinishedPractice(index));
    openDialog(`<p class="dialog-kicker">ANOTHER GOOD CHALLENGE</p><h2 class="dialog-title" id="dialog-title">Pick your next puzzle.</h2><p class="result-copy">Practice at your own pace.<br>Your daily score stays separate.</p><button class="secondary-button sample-practice" data-action="sample">Try the tougher bonus →</button><button class="primary-button practice-random" data-action="random" autofocus>Find me a fresh one ↗</button><div class="practice-grid">${available.map(index => {
      const item = puzzles[index], saved = savedPractice(index), done = saved && isTerminal(saved), resume = unfinishedPractice(index);
      return `<button class="practice-choice${done ? ' done' : ''}" data-practice="${index}" aria-label="${resume ? 'Resume practice' : 'Practice'} ${index + 1}: ${esc(item.title)}${done ? ', completed' : ''}">${String(index + 1).padStart(2, '0')}</button>`;
    }).join('')}</div><p class="fineprint">${available.length} available now. Upcoming dailies stay fresh. Saved rounds can be resumed; finish today’s daily to replay it.</p>`);
  }
  function reducedMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function resetView() { config.reset?.(); feedback = ''; feedbackTone = null; clearTimeout(resultTimer); }
  function loadPractice(index) {
    if (!Number.isInteger(index) || !canPractice(index)) return;
    mode = 'practice'; puzzle = puzzles[index];
    game = savedPractice(index, true) || engine.createGame(puzzle);
    resetView(); render(); lastFocus = null; closeDialog();
    ($('game-topline') || document.querySelector('.game-topline'))?.scrollIntoView({block:'start', behavior:reducedMotion() ? 'instant' : 'smooth'});
    announce(`Practice ${index + 1}. ${puzzle.title}.`);
  }
  function loadSample() {
    if (!config.sample) return;
    mode = 'practice'; puzzle = config.sample;
    game = engine.restoreGame(puzzle, read('practice:' + puzzle.id, null, true));
    resetView(); render(); lastFocus = null; closeDialog();
    ($('game-topline') || document.querySelector('.game-topline'))?.scrollIntoView({block:'start', behavior:reducedMotion() ? 'instant' : 'smooth'});
    announce('Bonus challenge. Same four cuts and equal totals; a few more tempting paths. Practice score only.');
  }
  function randomPractice() {
    const available = practiceIndices().map(index => ({item:puzzles[index],index})).filter(({item}) => item.id !== puzzle.id);
    const fresh = available.filter(({index}) => {const saved = savedPractice(index); return !saved || !isTerminal(saved);});
    const choices = fresh.length ? fresh : available;
    if (choices.length) loadPractice(choices[Math.floor(Math.random() * choices.length)].index);
    else showPractice();
  }
  function loadDaily() {
    mode = 'daily'; daily = engine.getDaily(puzzles); puzzle = daily.puzzle;
    game = engine.restoreGame(puzzle, read('daily:' + daily.dateKey, null, true));
    resetView(); reconcile(); render();
    if (dialog.open) { lastFocus = null; closeDialog(); }
  }
  function showOptions() {
    openDialog(`<p class="dialog-kicker">MAKE IT YOUR MOMENT</p><h2 class="dialog-title" id="dialog-title">Your way to play.</h2><div class="option-list">${game.status === 'playing' ? '<button data-action="confirm-reveal">Reveal the answer →<small>Ends this board as revealed, not solved.</small></button>' : ''}${mode === 'practice' ? '<button data-action="confirm-restart">Start this practice over ↻<small>Resets this practice’s progress and score.</small></button>' : ''}<button data-action="practice">Choose a practice →<small>Your current progress stays saved.</small></button><button data-action="help">A refresher on the rules ↗</button></div>`);
  }
  function confirmReveal() {
    if (isTerminal(game)) return;
    openDialog('<p class="dialog-kicker">TAKE A CLOSER LOOK</p><h2 class="dialog-title" id="dialog-title">Show the answer?</h2><p class="confirm-copy">This ends the board as revealed. It will not count as a win or extend your streak.</p><div class="dialog-actions"><button class="secondary-button" data-action="close" autofocus>Keep thinking</button><button class="primary-button" data-action="reveal">Reveal this board</button></div>');
  }
  function reveal() {
    if (isTerminal(game)) return;
    config.reset?.();
    commit(engine.revealGame(puzzle, game), {message:'Answers revealed. This board does not count as a win.'});
    showResult();
  }
  function confirmRestart() {
    if (mode !== 'practice') return;
    openDialog('<p class="dialog-kicker">A FRESH START</p><h2 class="dialog-title" id="dialog-title">Start this practice over?</h2><p class="confirm-copy">This resets the current practice board and score. Your daily results stay saved.</p><div class="dialog-actions"><button class="secondary-button" data-action="close" autofocus>Keep this board</button><button class="primary-button" data-action="restart">Restart practice</button></div>');
  }
  function restart() {
    if (mode !== 'practice') return;
    const adopted = save(engine.createGame(puzzle));
    resetView(); render(); lastFocus = null; closeDialog();
    if (adopted) notice(adopted);
    else announce('Practice restarted. A fresh board is ready.');
  }
  async function share() {
    if (!isTerminal(game)) return;
    const value = engine.formatShare(puzzle, game, {number:mode === 'daily' ? daily.number : puzzles.indexOf(puzzle) + 1, mode, bonus:api.isBonus});
    if (nativeMessage({type:'share',text:value})) return;
    if (config.share) { config.share(api); return; }
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); toast('Result copied. No answers included.'); return; }
    } catch {}
    openDialog(`<p class="dialog-kicker">PASS IT ALONG</p><h2 class="dialog-title" id="dialog-title">Share your result.</h2><p class="result-copy">Copy the text below. No answers, just your score.</p><textarea class="share-fallback" id="share-text" readonly aria-label="Your spoiler-free result">${esc(value)}</textarea><div class="dialog-actions"><button class="primary-button" data-action="select-share" autofocus>Select result</button></div>`);
  }
  function showAbout() {
    openDialog(`<p class="dialog-kicker">AN ALFORD FAMILY GAME</p><h2 class="dialog-title" id="dialog-title">A little more ${esc(name)}.</h2><p class="dialog-body">${esc(config.about || '')}</p><p class="dialog-body">This edition has <strong>${puzzles.length} prepared puzzles</strong>. The daily rotates through the collection and eventually repeats. Everyone receives the same board at midnight Central.</p><p class="dialog-body">Progress stays in this browser. There is no account, tracking, or cross-device score sync.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Back to the puzzle →</button></div>`);
  }
  function updateSound() {
    $('sound-button').setAttribute('aria-label', soundOn ? 'Turn sound off' : 'Turn sound on');
    $('sound-button').setAttribute('aria-pressed', String(soundOn));
    $('sound-button').title = soundOn ? 'Turn sound off' : 'Turn sound on';
    $('sound-button').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4 6 8H3v8h3l5 4V4Z"/>${soundOn ? '<path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>' : '<path d="m16 9 6 6m0-6-6 6"/>'}</svg>`;
  }
  function sound(kind) {
    nativeMessage({type:'haptic',kind});
    if (!soundOn) return;
    try {
      audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      const notes = kind === 'win' ? [523.25,659.25,783.99,1046.5] : kind === 'fit' || kind === 'success' ? [523.25,783.99] : kind === 'miss' || kind === 'error' ? [233.08] : [440];
      notes.forEach((hz,index) => {
        const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
        const at = audioContext.currentTime + index * .09;
        oscillator.type = 'sine'; oscillator.frequency.value = hz;
        gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.035, at + .015); gain.gain.exponentialRampToValueAtTime(.001, at + .22);
        oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(at); oscillator.stop(at + .24);
      });
    } catch {}
  }
  function storageChanged(event) {
    if (event.key === prefix + 'records') { mergeRecords(); return; }
    if (event.key === prefix + 'settings') { soundOn = read('settings', {})?.sound === true; updateSound(); return; }
    if (event.key !== prefix + gameKey()) return;
    const key = gameKey();
    let raw, restored;
    try {
      raw = localStorage.getItem(prefix + key);
      if (acceptedSaves.has(key) && raw === acceptedSaves.get(key)) return;
      restored = engine.restoreGame(puzzle, raw === null ? null : JSON.parse(raw));
    } catch { return; }
    if (mode === 'daily' && isTerminal(game) && !isTerminal(restored)) return;
    game = restored;
    memory.set(key, game); acceptedSaves.set(key, raw); dirtyKeys.delete(key);
    storageWarning = dirtyKeys.size > 0;
    resetView(); reconcile(); notice('Progress updated from another tab.'); render();
    if (dialog.open) { lastFocus = null; closeDialog(); }
  }
  function start() {
    if (started) return api;
    started = true;
    if (window.webkit?.messageHandlers?.alford) document.body?.classList.add('native-app');
    defaultFeedback = $('feedback').textContent;
    defaultNote = $('board-note').textContent;
    const on = (id, fn) => $(id)?.addEventListener('click', fn);
    on('daily-tab', loadDaily); on('new-day-button', loadDaily);
    on('sample-button', loadSample); on('practice-tab', showPractice); on('next-button', randomPractice);
    on('results-button', showResult); on('stats-button', showStats);
    on('help-button', showHelp); on('quick-help', showHelp);
    on('about-button', showAbout); on('more-button', showOptions); on('finished-more-button', showOptions);
    on('dialog-close', closeDialog);
    on('sound-button', () => { soundOn = !soundOn; write('settings', {sound:soundOn}); updateSound(); if (soundOn) sound('fit'); });
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
    });
    $('dialog-content').addEventListener('click', event => {
      const answer=event.target.closest('[data-lesson-choice]');
      if(answer && config.lesson) {
        const choice=config.lesson.choices[Number(answer.dataset.lessonChoice)];
        if(choice) { const feedback=$('lesson-feedback');feedback.textContent=`${choice.correct?'Exactly':'Try again'} — ${choice.why} This warm-up never changes your Daily.`;feedback.dataset.tone=choice.correct?'correct':'retry'; }
        return;
      }
      const choice = event.target.closest('[data-practice]');
      if (choice) { loadPractice(Number(choice.dataset.practice)); return; }
      const action = event.target.closest('[data-action]')?.dataset.action;
      const actions = {close:closeDialog, share, practice:showPractice, random:randomPractice, sample:loadSample,
        help:showHelp, 'confirm-reveal':confirmReveal, reveal,
        'confirm-restart':confirmRestart, restart,
        'select-share':() => { $('share-text')?.focus(); $('share-text')?.select(); },
      };
      actions[action]?.();
    });
    window.addEventListener('storage', storageChanged);
    setInterval(updateNewDay, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateNewDay(); });
    const onPortal = new RegExp('/games/' + slug + '(?:/(?:index\\.html)?)?$').test(location.pathname);
    $('family-link').href = onPortal ? (document.documentElement?.dataset?.collectionHome || '../../') : '../daily/';
    if (config.sibling) {
      $('sibling-link').href = onPortal ? '../' + config.sibling.slug + '/' : config.sibling.url;
      $('sibling-link').textContent = 'Play ' + config.sibling.name + ' ↗';
    }
    reconcile(); updateSound(); render();
    if (new URLSearchParams(location.search).get('sample') === 'tougher') loadSample();
    return api;
  }
  return api;
}
