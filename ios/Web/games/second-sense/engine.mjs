/** Pure Second Sense rules. No browser, storage, network, or fuzzy semantic scoring. */
export const EPOCH = '2026-10-20';
const DAY_MS = 86_400_000;
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function getDateKey(now = new Date()) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function calendarTime(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return NaN;
  const time = Date.parse(`${key}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === key ? time : NaN;
}

export function getDayNumber(dateKey) {
  return Math.floor((calendarTime(dateKey) - calendarTime(EPOCH)) / DAY_MS) + 1;
}

export function getDaily(puzzles, now = new Date()) {
  if (!Array.isArray(puzzles) || puzzles.length === 0) throw new RangeError('A daily puzzle collection is required.');
  const dateKey = getDateKey(now);
  const number = getDayNumber(dateKey);
  const index = ((number - 1) % puzzles.length + puzzles.length) % puzzles.length;
  return { puzzle: puzzles[index], dateKey, number };
}

export function createGame(puzzle) {
  return { puzzleId: puzzle.id, placements: [], attempts: 0, hintedNouns: [], status: 'playing' };
}

export function normalizeWord(value) {
  if (typeof value !== 'string') return null;
  const word = value.trim();
  return /^[A-Za-z]{2,18}$/.test(word) ? word.toUpperCase() : null;
}

function validPair(puzzle, nounId, verbId, word) {
  return puzzle.pairs.find(pair => pair.nounId === nounId && pair.verbId === verbId
    && (pair.answers || [pair.word]).includes(word));
}

export function submitPair(puzzle, state, selection) {
  const reject = reason => ({ state, accepted: false, changed: false, reason, word: null });
  if (state.status !== 'playing') return reject('finished');
  if (!selection || typeof selection !== 'object' || Array.isArray(selection)
    || typeof selection.nounId !== 'string' || typeof selection.verbId !== 'string'
    || !puzzle.nouns.some(noun => noun.id === selection.nounId)
    || !puzzle.verbs.some(verb => verb.id === selection.verbId)) return reject('invalid');
  const word = normalizeWord(selection.word);
  if (!word) return reject('invalid');
  const { nounId, verbId } = selection;
  if (state.placements.some(pair => pair.nounId === nounId || pair.verbId === verbId)) return reject('used');
  const attempts = Math.min(Number.MAX_SAFE_INTEGER, state.attempts + 1);
  if (!validPair(puzzle, nounId, verbId, word)) {
    const accepts=pair=>(pair.answers||[pair.word]).includes(word);
    const noun=puzzle.pairs.some(pair=>pair.nounId===nounId&&accepts(pair));
    const verb=puzzle.pairs.some(pair=>pair.verbId===verbId&&accepts(pair));
    const paired=puzzle.pairs.some(pair=>pair.nounId===nounId&&pair.verbId===verbId);
    return { state: { ...state, attempts }, accepted: false, changed: true, reason: 'no-match', word,
      feedback:noun&&!verb?'noun-only':verb&&!noun?'verb-only':paired?'pair-only':'mismatch' };
  }
  const placements = [...state.placements, { nounId, verbId, word }];
  return {
    state: { ...state, placements, attempts, status: placements.length === puzzle.nouns.length ? 'won' : 'playing' },
    accepted: true, changed: true, reason: null, word,
  };
}

export function useHint(puzzle, state, nounId) {
  const answer = puzzle.pairs.find(pair => pair.nounId === nounId);
  if (state.status !== 'playing' || !answer || state.placements.some(pair => pair.nounId === nounId)) {
    return { state, hint: null, changed: false };
  }
  const hint = { nounId, firstLetter: answer.word[0], length: answer.word.length };
  if (state.hintedNouns.includes(nounId)) return { state, hint, changed: false };
  return { state: { ...state, hintedNouns: [...state.hintedNouns, nounId] }, hint, changed: true };
}

export function revealGame(puzzle, state) {
  if (state.status !== 'playing') return state;
  const solved = new Set(state.placements.map(pair => pair.nounId));
  const remaining = puzzle.pairs.filter(pair => !solved.has(pair.nounId))
    .map(({ nounId, verbId, word }) => ({ nounId, verbId, word }));
  return { ...state, placements: [...state.placements.map(pair => ({ ...pair })), ...remaining], status: 'revealed' };
}

function nonnegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

export function restoreGame(puzzle, raw) {
  const fresh = () => createGame(puzzle);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.puzzleId !== puzzle.id
    || !['playing', 'won', 'revealed'].includes(raw.status) || !nonnegativeInteger(raw.attempts)
    || !Array.isArray(raw.placements) || raw.placements.length > puzzle.nouns.length
    || !Array.isArray(raw.hintedNouns) || new Set(raw.hintedNouns).size !== raw.hintedNouns.length
    || raw.hintedNouns.some(id => typeof id !== 'string' || !puzzle.nouns.some(noun => noun.id === id))) return fresh();
  const placements = [];
  const usedNouns = new Set();
  const usedVerbs = new Set();
  for (const pair of raw.placements) {
    if (!pair || typeof pair !== 'object' || Array.isArray(pair)
      || typeof pair.nounId !== 'string' || typeof pair.verbId !== 'string'
      || normalizeWord(pair.word) !== pair.word || usedNouns.has(pair.nounId) || usedVerbs.has(pair.verbId)
      || !validPair(puzzle, pair.nounId, pair.verbId, pair.word)) return fresh();
    placements.push({ nounId: pair.nounId, verbId: pair.verbId, word: pair.word });
    usedNouns.add(pair.nounId);
    usedVerbs.add(pair.verbId);
  }
  const complete = placements.length === puzzle.nouns.length;
  if (raw.status === 'revealed' ? !complete : raw.attempts < placements.length) return fresh();
  const status = raw.status === 'revealed' ? 'revealed' : complete ? 'won' : 'playing';
  return { puzzleId: puzzle.id, placements, attempts: raw.attempts, hintedNouns: [...raw.hintedNouns], status };
}

export function isPerfect(state) {
  return state.status === 'won' && state.attempts === 5 && state.hintedNouns.length === 0;
}

export function getStats(records, todayKey) {
  const stats = { played: 0, won: 0, streak: 0, bestStreak: 0, perfect: 0, averageAttempts: 0 };
  if (!records || typeof records !== 'object' || Array.isArray(records)) return stats;
  const today = calendarTime(todayKey);
  const entries = Object.entries(records).filter(([key, record]) => Number.isFinite(calendarTime(key))
    && (!Number.isFinite(today) || calendarTime(key) <= today)
    && record && (record.status === 'won' || record.status === 'revealed')
    && nonnegativeInteger(record.attempts) && nonnegativeInteger(record.hints) && record.hints <= 5
    && (record.status !== 'won' || record.attempts >= 5))
    .sort(([a], [b]) => a.localeCompare(b));
  stats.played = entries.length;
  const wins = new Set();
  let totalAttempts = 0;
  let previousWin = NaN;
  let run = 0;
  for (const [date, record] of entries) {
    if (record.status === 'revealed') { run = 0; previousWin = NaN; continue; }
    stats.won++;
    totalAttempts += record.attempts;
    if (record.attempts === 5 && record.hints === 0) stats.perfect++;
    const time = calendarTime(date);
    run = time - previousWin === DAY_MS ? run + 1 : 1;
    stats.bestStreak = Math.max(stats.bestStreak, run);
    previousWin = time;
    wins.add(date);
  }
  stats.averageAttempts = stats.won ? Math.round(totalAttempts / stats.won * 10) / 10 : 0;
  if (!Number.isFinite(today) || entries.find(([key]) => key === todayKey)?.[1].status === 'revealed') return stats;
  const dateAt = time => new Date(time).toISOString().slice(0, 10);
  let cursor = today;
  if (!wins.has(dateAt(cursor))) cursor -= DAY_MS;
  while (wins.has(dateAt(cursor))) { stats.streak++; cursor -= DAY_MS; }
  return stats;
}

export function formatShare(puzzle, state, { number = 1, mode = 'daily', url } = {}) {
  const label = mode === 'practice' ? 'SECOND SENSE Practice' : `SECOND SENSE #${String(number).padStart(3, '0')}`;
  const squares = puzzle.nouns.map(noun => state.status === 'revealed' ? '🟨'
    : state.placements.some(pair => pair.nounId === noun.id) ? '🟩' : '⬜').join('');
  const hints = state.hintedNouns.length;
  const details = [`${state.attempts} ${state.attempts === 1 ? 'check' : 'checks'}`, `${hints} ${hints === 1 ? 'hint' : 'hints'}`];
  if (isPerfect(state)) details.push('Perfect');
  if (state.status === 'revealed') details.push('Revealed');
  return [label, squares, details.join(' · '), ...(typeof url === 'string' && url ? [url] : [])].join('\n');
}
