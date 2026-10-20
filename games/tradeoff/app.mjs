import { PUZZLES } from './puzzles.mjs';
import { getDateKey, getDaily, createGame, swapLetters, undoMove, useHint, revealGame, restoreGame, getStats, formatShare } from './engine.mjs';

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PREFIX = 'tradeoff:v1:';
const dialog = $('game-dialog');
let storageWarning = false;
let toastTimer;
let feedbackTimer;
let resultTimer;
let lastFocus;
let soundContext;
let selected = null;
let hinted = [];
let feedback = '';
let mode = 'daily';
let daily = getDaily(PUZZLES);
let puzzle = daily.puzzle;
let game = restoreGame(puzzle, readData(`daily:${daily.dateKey}`, null));
let records = readData('records', {});
if (!records || typeof records !== 'object' || Array.isArray(records)) records = {};
const settings = readData('settings', {});
let soundOn = settings?.sound === true;

function readData(key, fallback) {
  try {
    const value = localStorage.getItem(PREFIX + key);
    return value === null ? fallback : JSON.parse(value);
  } catch { return fallback; }
}

function writeData(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
  catch {
    if (!storageWarning) {
      storageWarning = true;
      toast('You can play, but this browser couldn’t save your progress.');
    }
    return false;
  }
}

function saveGame() {
  const key = mode === 'daily' ? `daily:${daily.dateKey}` : `practice:${puzzle.id}`;
  // The first completed daily is final, including when another tab gets there first.
  if (mode === 'daily') {
    const saved = restoreGame(puzzle, readData(key, null));
    if (saved.status !== 'playing') {
      if (game.status !== saved.status || game.moves !== saved.moves) toast('This daily was finished in another tab. Your saved result is restored.');
      game = saved;
    }
    const storedRecords = readData('records', {});
    if (storedRecords && typeof storedRecords === 'object' && !Array.isArray(storedRecords)) records = {...records, ...storedRecords};
  }
  writeData(key, game);
  if (mode === 'daily' && game.status !== 'playing') {
    const old = records[daily.dateKey];
    if (!old || old.status !== 'won') {
      records[daily.dateKey] = { status: game.status, moves: game.moves, hints: game.hints, undos: game.undos, par: puzzle.par };
      writeData('records', records);
    }
  }
}

function solvedRow(index) { return game.board[index] === puzzle.rows[index].answer; }
function sameCell(a, b) { return a && b && a.row === b.row && a.col === b.col; }
function cellFromButton(button) { return { row: Number(button.dataset.row), col: Number(button.dataset.col) }; }

function render(options = {}) {
  const focused = document.activeElement?.closest?.('[data-row][data-col]');
  const focusCell = options.focusCell || (focused ? cellFromButton(focused) : null);
  const solved = game.board.reduce((count, word, i) => count + Number(word === puzzle.rows[i].answer), 0);
  $('board').innerHTML = puzzle.rows.map((row, r) => {
    const isSolved = solvedRow(r);
    const fresh = options.newlySolved?.includes(r);
    return `<div class="word-row${isSolved ? ' solved' : ''}${fresh ? ' just-solved' : ''}" role="group" aria-label="Word ${r + 1}: ${esc(row.clue)}${isSolved ? ', solved' : ''}">
      <div class="clue-block"><span class="row-number${isSolved ? ' check' : ''}" aria-hidden="true">${isSolved ? '✓' : String(r + 1).padStart(2, '0')}</span><div class="clue-text">${esc(row.clue)}${isSolved ? `<span class="row-transform">${esc(row.start)} → ${esc(row.answer)}</span>` : ''}</div></div>
      <div class="tiles" role="group" aria-label="${esc(game.board[r])}">${[...game.board[r]].map((letter, c) => {
        const coordinate = {row:r,col:c};
        const isSelected = sameCell(selected, coordinate);
        const isHinted = hinted.some((h) => sameCell(h, coordinate));
        const wasSwapped = options.swapped?.some((h) => sameCell(h, coordinate));
        return `<button class="tile${isSelected ? ' selected' : ''}${isHinted ? ' hinted' : ''}${wasSwapped && !isSolved ? ' just-swapped' : ''}" data-row="${r}" data-col="${c}" aria-label="${letter}, letter ${c + 1} of ${esc(game.board[r])}. Clue: ${esc(row.clue)}${isSolved ? '. Solved' : ''}${isHinted ? '. Suggested trade' : ''}" aria-pressed="${Boolean(isSelected)}" ${isSolved || game.status !== 'playing' ? 'disabled' : ''}>${letter}</button>`;
      }).join('')}</div></div>`;
  }).join('');

  $('progress-dots').innerHTML = Array.from({length:6}, (_, i) => `<span class="progress-dot${i < solved ? ' filled' : ''}"></span>`).join('');
  $('progress-label').textContent = game.status === 'revealed' ? 'Answers revealed' : `${solved} of 6 solved`;
  $('move-count').textContent = game.moves;
  $('move-word').textContent = game.moves === 1 ? 'swap' : 'swaps';
  $('daily-tab').classList.toggle('active', mode === 'daily');
  $('practice-tab').classList.toggle('active', mode === 'practice');
  $('daily-tab').setAttribute('aria-pressed', String(mode === 'daily'));
  $('practice-tab').setAttribute('aria-pressed', String(mode === 'practice'));
  $('issue').textContent = mode === 'daily' ? `NO. ${String(daily.number).padStart(3, '0')}` : `PRACTICE ${String(PUZZLES.indexOf(puzzle) + 1).padStart(2, '0')}`;
  $('puzzle-date').textContent = mode === 'daily' ? formatDate(daily.dateKey) : puzzle.title;
  $('difficulty').textContent = puzzle.difficulty;
  $('undo-button').disabled = !game.history.length || game.status !== 'playing';
  $('hint-button').disabled = game.status !== 'playing';
  $('hint-button').title = 'Highlight a useful trade. This counts as a nudge.';
  $('undo-button').title = 'Undo the last trade. Swaps already made still count.';
  $('game-controls').hidden = game.status !== 'playing';
  $('finished-actions').hidden = game.status === 'playing';
  $('results-button').textContent = game.status === 'revealed' ? 'See the result ↗' : 'See your result ↗';
  $('next-practice-button').textContent = mode === 'daily' ? 'Try a practice →' : 'Another trade →';
  $('finished-more-button').hidden = mode !== 'practice';
  const info = $('interaction-note');
  info.className = `interaction-note${selected ? ' has-selection' : ''}${game.status === 'won' ? ' success' : ''}`;
  info.textContent = selected ? `${game.board[selected.row][selected.col]} is ready to move. Pick its trading partner.` : feedback || (game.status === 'won' ? 'Every letter, right where it belongs.' : game.status === 'revealed' ? 'Answers shown. A fresh start is always a trade away.' : 'Tap a letter, then another to trade them.');
  const support = [];
  if (game.hints) support.push(`${game.hints} ${game.hints === 1 ? 'nudge' : 'nudges'}`);
  if (game.undos) support.push(`${game.undos} ${game.undos === 1 ? 'undo' : 'undos'}`);
  $('board-footnote').textContent = storageWarning ? 'Progress could not be saved in this browser.' : support.length ? `${support.join(' · ')} · Every completed trade stays in your swap count.` : 'No rush. No lost lives. Just a good trade.';
  $('board-footnote').classList.toggle('save-warning', storageWarning);
  $('new-day').hidden = getDateKey() === daily.dateKey || mode !== 'daily';
  if (focusCell) {
    let next = $('board').querySelector(`[data-row="${focusCell.row}"][data-col="${focusCell.col}"]:not(:disabled)`);
    if (!next) next = $('board').querySelector('.tile:not(:disabled)');
    next?.focus({preventScroll:true});
  }
}

function formatDate(key) {
  return new Intl.DateTimeFormat('en-US', {month:'long',day:'numeric',weekday:'long',timeZone:'UTC'}).format(new Date(`${key}T12:00:00Z`));
}

function announce(message) { $('announcer').textContent = ''; requestAnimationFrame(() => { $('announcer').textContent = message; }); }
function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3200);
}

function setFeedback(message) {
  clearTimeout(feedbackTimer);
  feedback = message;
  feedbackTimer = setTimeout(() => { feedback = ''; if (!selected && game.status === 'playing') render(); }, 3600);
}

function handleTile(cell) {
  if (game.status !== 'playing' || solvedRow(cell.row)) return;
  clearTimeout(feedbackTimer);
  if (!selected) {
    selected = cell;
    playTone('select');
    render({focusCell:cell});
    return;
  }
  if (sameCell(selected, cell)) {
    selected = null;
    render({focusCell:cell});
    return;
  }
  const from = selected;
  const outcome = swapLetters(puzzle, game, from, cell);
  if (!outcome.changed) {
    toast(outcome.reason === 'same-letter' ? 'Same letter. Choose a different trading partner.' : 'Choose two unlocked letters to trade.');
    return;
  }
  game = outcome.state;
  selected = null;
  hinted = [];
  const count = outcome.newlySolved.length;
  const message = count === 2 ? 'Two words home. That’s a good trade.' : count === 1 ? `${puzzle.rows[outcome.newlySolved[0]].answer} is home. Keep the letters moving.` : 'Trade made. Temporary nonsense is welcome.';
  setFeedback(game.status === 'won' ? 'Every letter, right where it belongs.' : message);
  saveGame();
  render({newlySolved:outcome.newlySolved,swapped:[from,cell],focusCell:cell});
  announce(`${message} ${game.moves} swaps.`);
  playTone(game.status === 'won' ? 'win' : count ? 'solve' : 'swap');
  if (game.status === 'won') {
    celebrate();
    clearTimeout(resultTimer);
    resultTimer = setTimeout(showResult, 750);
  }
}

function takeHint() {
  const outcome = useHint(puzzle, game);
  if (!outcome.hint) { toast('All the letters are already home.'); return; }
  game = outcome.state;
  selected = null;
  hinted = [outcome.hint.a, outcome.hint.b];
  setFeedback('Trade the two glowing letters. You’ve got this.');
  saveGame();
  render();
  announce(`Nudge ${game.hints}: trade ${game.board[outcome.hint.a.row][outcome.hint.a.col]}, letter ${outcome.hint.a.col + 1} in word ${outcome.hint.a.row + 1}, with ${game.board[outcome.hint.b.row][outcome.hint.b.col]}, letter ${outcome.hint.b.col + 1} in word ${outcome.hint.b.row + 1}.`);
}

function takeUndo() {
  if (!game.history.length || game.status !== 'playing') return;
  game = undoMove(puzzle, game);
  selected = null;
  hinted = [];
  setFeedback('Trade undone. Your swap count keeps the full story.');
  saveGame();
  render();
  announce('Last trade undone. Earlier solved words are restored.');
}

function openModal(html) {
  if (!dialog.open) lastFocus = document.activeElement;
  $('dialog-content').innerHTML = html;
  if (!dialog.open) dialog.showModal();
  const first = $('dialog-content').querySelector('button:not(:disabled), textarea');
  (first || $('dialog-close')).focus({preventScroll:true});
}
function closeModal() { if (dialog.open) dialog.close(); }

function showHelp() {
  openModal(`<p class="dialog-eyebrow">A DAILY GAME OF GIVE & TAKE</p><h2 class="dialog-title" id="dialog-title">Here’s the deal.</h2><div class="dialog-body"><p>Six real words. Six clues. Each word starts <strong>one letter away</strong> from its answer. Every letter you need is already on the board.</p><ol><li><strong>Tap two letters</strong> to trade them.</li><li>Match a clue and the word <strong>locks in</strong>.</li><li>Solve all six. <strong>Five swaps is perfect.</strong></li></ol><div class="help-demo"><div class="help-pair"><span class="help-clue">A vehicle</span><span>C</span><span>A</span><span class="marked">T</span></div><div class="help-pair"><span class="help-clue">A feline</span><span>C</span><span>A</span><span class="marked">R</span></div><p class="help-demo-caption">Trade T and R. CAT → CAR. CAR → CAT.</p></div><p><strong>Temporary nonsense is welcome.</strong> A trade can set up your next move. Letters can also trade within an unsolved word.</p><p class="help-note">Take as many swaps as you need. Undo restores the board, but swaps already made still count. Nudges and undos appear in your result; a perfect trade uses neither.</p><p>Keyboard: Tab to a letter, arrow keys to move, Enter or Space to select, Escape to cancel. Ctrl/⌘ Z undoes a trade.</p></div><div class="dialog-action"><button class="primary-button" data-action="close">Let’s trade <span aria-hidden="true">↗</span></button></div>`);
}

function showStats() {
  const stats = getStats(records, getDateKey());
  openModal(`<p class="dialog-eyebrow">YOUR DAILY RITUAL</p><h2 class="dialog-title" id="dialog-title">The trading record.</h2><div class="stats-grid"><div><div class="stat-number">${stats.played}</div><div class="stat-label">Completed</div></div><div><div class="stat-number">${stats.played ? Math.round(stats.won / stats.played * 100) : 0}<small style="font:13px var(--sans)">%</small></div><div class="stat-label">Solved</div></div><div><div class="stat-number">${stats.streak}</div><div class="stat-label">Current streak</div></div><div><div class="stat-number">${stats.bestStreak}</div><div class="stat-label">Best streak</div></div></div><div class="stats-details"><div class="stats-detail"><span>Perfect trades</span><strong>${stats.perfect}</strong></div><div class="stats-detail"><span>Average swaps on wins</span><strong>${stats.won ? Number(stats.averageSwaps).toFixed(1) : '—'}</strong></div><div class="stats-detail"><span>Daily puzzles solved</span><strong>${stats.won}</strong></div></div><p class="stats-fineprint">Daily results live in this browser. Practice doesn’t affect your record. Revealed puzzles count as completed, but never as wins or streaks.</p><div class="dialog-action"><button class="primary-button" data-action="close">Back to the letters</button></div>`);
}

function showResult() {
  if (game.status === 'playing') return;
  const revealed = game.status === 'revealed';
  const perfect = !revealed && game.moves <= puzzle.par && game.hints === 0 && game.undos === 0;
  const label = mode === 'daily' ? `THE DAILY · NO. ${String(daily.number).padStart(3,'0')}` : `PRACTICE · ${String(PUZZLES.indexOf(puzzle) + 1).padStart(2,'0')}`;
  const title = revealed ? 'The whole picture.' : perfect ? 'A perfect trade.' : 'Everything in its place.';
  const message = revealed ? 'Answers revealed. This one won’t count as a win.' : perfect ? 'Six words. Five swaps. Not a letter out of place.' : game.moves <= 7 ? 'A few good trades, and every word found its way home.' : 'You followed the clues and brought every word home.';
  openModal(`<p class="dialog-eyebrow">${label}</p><div class="result-icon${revealed ? ' revealed' : ''}" aria-hidden="true">${revealed ? '↗' : perfect ? '✳' : '✓'}</div><h2 class="dialog-title" id="dialog-title">${title}</h2><p class="result-message">${message}</p><div class="result-squares${revealed ? ' revealed' : ''}" aria-hidden="true">${'<span></span>'.repeat(6)}</div><div class="result-metrics"><div><strong>${game.moves}</strong><span>${game.moves === 1 ? 'swap' : 'swaps'}</span></div><div><strong>${game.hints}</strong><span>${game.hints === 1 ? 'nudge' : 'nudges'}</span></div><div><strong>${game.undos}</strong><span>${game.undos === 1 ? 'undo' : 'undos'}</span></div></div><button class="primary-button share-button" data-action="share"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3M7 8l5-5 5 5M5 13v7h14v-7"/></svg>Share your trade</button><div class="result-bottom"><button class="text-button" data-action="next">${mode === 'daily' ? 'Can’t wait? Make a practice trade →' : 'One more? Another practice →'}</button><button class="text-button" data-action="close">Look at the finished board</button></div><p class="stats-fineprint">${mode === 'daily' ? 'A fresh daily arrives at midnight Central.' : 'Just for the joy of it. Your daily record stays separate.'}</p>`);
}

function isDailyLocked(candidate) {
  const today = getDaily(PUZZLES);
  if (candidate.id !== today.puzzle.id) return false;
  const saved = candidate.id === puzzle.id && mode === 'daily' ? game : restoreGame(candidate, readData(`daily:${today.dateKey}`, null));
  return saved.status === 'playing';
}

function showPractice() {
  const cards = PUZZLES.map((candidate, index) => {
    const saved = readData(`practice:${candidate.id}`, null);
    const done = saved?.status === 'won';
    const locked = isDailyLocked(candidate);
    return `<button class="practice-choice${mode === 'practice' && puzzle.id === candidate.id ? ' current' : ''}${done ? ' done' : ''}${locked ? ' daily-locked' : ''}" data-action="practice" data-index="${index}" aria-label="${locked ? 'Today’s daily, play it in The daily tab' : `Practice ${index + 1}, ${esc(candidate.title)}, ${esc(candidate.difficulty)}${done ? ', solved' : ''}`}" ${locked ? 'disabled title="Today’s daily is waiting in The daily tab"' : ''}>${locked ? '☀' : String(index + 1).padStart(2,'0')}</button>`;
  }).join('');
  openModal(`<p class="dialog-eyebrow">FOR THE ONE-MORE-PUZZLE PEOPLE</p><h2 class="dialog-title" id="dialog-title">Keep the letters moving.</h2><p class="practice-heading">${PUZZLES.length} boards. All the time you need.</p><button class="primary-button practice-random" data-action="next">Pick one for me <span aria-hidden="true">↗</span></button><div class="practice-grid">${cards}</div><p class="puzzle-preview-label">✓ = solved · ☀ = today’s daily · Your progress saves as you go.</p>`);
}

function loadPractice(index) {
  const candidate = PUZZLES[index];
  if (!candidate || isDailyLocked(candidate)) return;
  clearTimeout(resultTimer);
  clearTimeout(feedbackTimer);
  mode = 'practice';
  puzzle = candidate;
  game = restoreGame(puzzle, readData(`practice:${puzzle.id}`, null));
  selected = null; hinted = []; feedback = '';
  closeModal();
  render();
  announce(`Practice ${index + 1}. ${puzzle.title}. ${puzzle.difficulty}.`);
  $('board').focus({preventScroll:true});
}

function nextPractice() {
  let candidates = PUZZLES.map((p,i) => ({p,i})).filter(({p}) => p.id !== puzzle.id && !isDailyLocked(p));
  const unseen = candidates.filter(({p}) => readData(`practice:${p.id}`, null)?.status !== 'won');
  if (unseen.length) candidates = unseen;
  if (!candidates.length) return;
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  loadPractice(choice.i);
}

function loadDaily() {
  clearTimeout(resultTimer);
  clearTimeout(feedbackTimer);
  mode = 'daily'; daily = getDaily(PUZZLES); puzzle = daily.puzzle;
  game = restoreGame(puzzle, readData(`daily:${daily.dateKey}`, null));
  selected = null; hinted = []; feedback = '';
  closeModal(); render();
  announce(`The daily, number ${daily.number}. ${formatDate(daily.dateKey)}.`);
}

function showOptions() {
  openModal(`<p class="dialog-eyebrow">A LITTLE ROOM TO THINK</p><h2 class="dialog-title" id="dialog-title">Your next move.</h2><div class="option-list"><button data-action="help"><span>How to play<small>The rules, the swaps, and the perfect trade.</small></span><span>↗</span></button><button data-action="browse"><span>Explore practice<small>${PUZZLES.length} boards to get your letters around.</small></span><span>↗</span></button>${mode === 'practice' ? '<button data-action="restart"><span>Restart this practice<small>Clear this board’s moves and progress.</small></span><span>↺</span></button>' : ''}${game.status === 'playing' ? '<button data-action="confirm-reveal" class="danger-option"><span>Reveal the answers<small>This puzzle will be marked as revealed.</small></span><span>↗</span></button>' : ''}</div><div class="dialog-action"><button class="secondary-button" data-action="close">Back to the board</button></div>`);
}

function confirmReveal() {
  openModal(`<p class="dialog-eyebrow">EVERY PUZZLE HAS ITS DAY</p><h2 class="dialog-title" id="dialog-title">Ready for the answers?</h2><p class="confirm-copy">We’ll put every letter in its place. This puzzle will be marked as <strong>revealed</strong> and won’t count as a win${mode === 'daily' ? ' or earn a streak' : ''}.</p><div class="dialog-action"><button class="secondary-button" data-action="close">I’ll keep trading</button><button class="primary-button" data-action="reveal">Show me the answers</button></div>`);
}

function confirmRestart() {
  openModal(`<p class="dialog-eyebrow">FRESH LETTERS, FRESH EYES</p><h2 class="dialog-title" id="dialog-title">Start this one again?</h2><p class="confirm-copy">Your progress and score for this practice board will be cleared. Your daily record stays as it is.</p><div class="dialog-action"><button class="secondary-button" data-action="close">Keep my progress</button><button class="primary-button" data-action="do-restart">Start over</button></div>`);
}

function showAbout() {
  openModal(`<p class="dialog-eyebrow">A SMALL NEW DAILY RITUAL</p><h2 class="dialog-title" id="dialog-title">A game of give & take.</h2><div class="dialog-body"><p><strong>Tradeoff</strong> is a daily word puzzle about finding the right word and making room for it. Each board begins with six real words. Every one is holding a letter that belongs somewhere else.</p><p>This first edition contains <strong>${PUZZLES.length} prepared boards</strong>, all checked for a five-swap solution. Daily play advances through the collection, then repeats. Practice lets you explore the collection at your own pace.</p><p>The daily changes at <strong>midnight in America/Chicago</strong>, so everyone gets the same numbered puzzle. Difficulty labels are editorial estimates.</p><p>Progress, sound preference, and statistics are saved in this browser. There’s no account or cross-device sync. If browser storage is cleared, that record is cleared too.</p><p>Made for a few quiet minutes and the moment the last two words click.</p></div><div class="dialog-action"><button class="primary-button" data-action="close">Back to my trade</button></div>`);
}

async function shareResult() {
  const text = formatShare(puzzle, game, {number: mode === 'daily' ? daily.number : PUZZLES.indexOf(puzzle) + 1, mode, url:''});
  if (navigator.share) {
    try { await navigator.share({title:'My Tradeoff',text}); return; }
    catch (error) { if (error?.name === 'AbortError') return; }
  }
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    toast('Copied. Your clues and answers stay secret.');
  } catch {
    openModal(`<p class="dialog-eyebrow">A GOOD TRADE IS WORTH SHARING</p><h2 class="dialog-title" id="dialog-title">Take your result.</h2><p class="confirm-copy">Select and copy the text below. No answers, no spoilers.</p><textarea class="share-fallback" id="share-text" readonly aria-label="Your spoiler-free result">${esc(text)}</textarea><div class="dialog-action"><button class="primary-button" data-action="select-share">Select result text</button><button class="secondary-button" data-action="result">Back to result</button></div>`);
    $('share-text').focus(); $('share-text').select();
  }
}

function updateSoundButton() {
  $('sound-button').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-5v16l-5-5H4Z"/>${soundOn ? '<path d="M16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>' : '<path d="m17 9 5 6m0-6-5 6"/>'}</svg>`;
  $('sound-button').setAttribute('aria-label', `Turn sound ${soundOn ? 'off' : 'on'}`);
  $('sound-button').setAttribute('aria-pressed', String(soundOn));
  $('sound-button').title = `Sound ${soundOn ? 'on' : 'off'}`;
}

function playTone(kind) {
  if (!soundOn) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    soundContext ||= new Audio();
    if (soundContext.state === 'suspended') soundContext.resume().catch(() => {});
    const notes = kind === 'win' ? [523.25,659.25,783.99,1046.5] : kind === 'solve' ? [523.25,783.99] : kind === 'swap' ? [392,523.25] : [330];
    notes.forEach((hz, i) => {
      const oscillator = soundContext.createOscillator();
      const gain = soundContext.createGain();
      const start = soundContext.currentTime + i * .09;
      oscillator.type = 'sine'; oscillator.frequency.value = hz;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.035, start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .25);
      oscillator.connect(gain); gain.connect(soundContext.destination);
      oscillator.start(start); oscillator.stop(start + .26);
    });
  } catch { /* Sound is optional; the puzzle is always playable without it. */ }
}

function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div'); layer.className = 'completion-confetti'; layer.setAttribute('aria-hidden','true');
  const colors = ['#deed91','#a8c28b','#ffd0ae','#d1deba','#b7c0a7'];
  layer.innerHTML = Array.from({length:28},(_,i) => `<span class="confetti-piece" style="left:${10 + Math.random() * 80}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * .35}s;rotate:${Math.random() * 180}deg"></span>`).join('');
  document.body.append(layer); setTimeout(() => layer.remove(),2300);
}

$('board').addEventListener('click', (event) => {
  const tile = event.target.closest('[data-row][data-col]');
  if (tile && !tile.disabled) handleTile(cellFromButton(tile));
});
$('board').addEventListener('keydown', (event) => {
  const tile = event.target.closest('[data-row][data-col]');
  if (!tile || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const cell = cellFromButton(tile);
  const delta = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-5,ArrowDown:5}[event.key];
  let index = cell.row * 5 + cell.col;
  if (event.key === 'Home') index = cell.row * 5;
  else if (event.key === 'End') index = cell.row * 5 + 4;
  else index += delta;
  while (index >= 0 && index < 30) {
    const candidate = $('board').querySelector(`[data-row="${Math.floor(index / 5)}"][data-col="${index % 5}"]`);
    if (candidate && !candidate.disabled) { candidate.focus(); return; }
    index += delta || 1;
  }
});
document.addEventListener('keydown', (event) => {
  if (dialog.open) return;
  if (event.key === 'Escape' && selected) { selected = null; render(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); takeUndo(); }
});
$('dialog-close').addEventListener('click',closeModal);
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeModal(); });
dialog.addEventListener('close', () => {
  if (lastFocus?.isConnected && lastFocus !== document.body && lastFocus.getClientRects().length && !lastFocus.disabled) {
    lastFocus.focus({preventScroll:true});
  } else if (game.status !== 'playing') {
    $('results-button').focus({preventScroll:true});
  } else {
    $('board').focus({preventScroll:true});
  }
});
$('dialog-content').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'close') closeModal();
  else if (action === 'help') showHelp();
  else if (action === 'browse') showPractice();
  else if (action === 'practice') loadPractice(Number(button.dataset.index));
  else if (action === 'next') nextPractice();
  else if (action === 'share') shareResult();
  else if (action === 'result') showResult();
  else if (action === 'confirm-reveal') confirmReveal();
  else if (action === 'restart') confirmRestart();
  else if (action === 'do-restart' && mode === 'practice') { game = createGame(puzzle); selected = null; hinted = []; feedback = ''; saveGame(); render(); closeModal(); $('board').focus({preventScroll:true}); }
  else if (action === 'reveal') { game = revealGame(puzzle,game); selected = null; hinted = []; feedback = ''; saveGame(); render(); showResult(); }
  else if (action === 'select-share') { $('share-text').focus(); $('share-text').select(); }
});
$('help-button').addEventListener('click',showHelp);
$('quick-help').addEventListener('click',showHelp);
$('stats-button').addEventListener('click',showStats);
$('about-button').addEventListener('click',showAbout);
$('hint-button').addEventListener('click',takeHint);
$('undo-button').addEventListener('click',takeUndo);
$('more-button').addEventListener('click',showOptions);
$('finished-more-button').addEventListener('click',showOptions);
$('daily-tab').addEventListener('click',loadDaily);
$('practice-tab').addEventListener('click',showPractice);
$('results-button').addEventListener('click',showResult);
$('next-practice-button').addEventListener('click',nextPractice);
$('new-day-button').addEventListener('click',loadDaily);
$('sound-button').addEventListener('click', () => { soundOn = !soundOn; writeData('settings',{sound:soundOn}); updateSoundButton(); if (soundOn) playTone('solve'); toast(`Sound ${soundOn ? 'on' : 'off'}.`); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) $('new-day').hidden = getDateKey() === daily.dateKey || mode !== 'daily'; });
setInterval(() => { $('new-day').hidden = getDateKey() === daily.dateKey || mode !== 'daily'; }, 30000);
window.addEventListener('storage', (event) => {
  if (event.key === PREFIX + 'records') {
    const fresh = readData('records',{});
    if (fresh && typeof fresh === 'object' && !Array.isArray(fresh)) records = fresh;
  }
  const currentKey = PREFIX + (mode === 'daily' ? `daily:${daily.dateKey}` : `practice:${puzzle.id}`);
  if (event.key === currentKey && event.newValue) {
    const restored = restoreGame(puzzle, readData(currentKey.slice(PREFIX.length), null));
    game = restored; selected = null; hinted = []; feedback = '';
    render();
    toast('Your progress was updated from another tab.');
  }
});

updateSoundButton();
render();
if (game.status !== 'playing') saveGame();
