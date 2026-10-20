/** Pure Counterpart rules. No browser, storage, network, or fuzzy scoring. */
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
  return { puzzleId: puzzle.id, placements: puzzle.rows.map(() => null), attempts: 0, hintedRows: [], status: 'playing' };
}

export function submitPair(puzzle, state, selection) {
  const reject = reason => ({ state, accepted: false, changed: false, reason });
  if (state.status !== 'playing') return reject('finished');
  if (!selection || typeof selection !== 'object' || Array.isArray(selection)
    || !Number.isInteger(selection.row) || selection.row < 0 || selection.row >= puzzle.rows.length
    || !Array.isArray(selection.tileIds) || selection.tileIds.length !== 2
    || selection.tileIds[0] === selection.tileIds[1]
    || selection.tileIds.some(id => typeof id !== 'string' || !puzzle.tiles.some(tile => tile.id === id))) return reject('invalid');
  const { row, tileIds } = selection;
  if (state.placements[row] !== null) return reject('locked');
  const used = new Set(state.placements.filter(Boolean).flat());
  if (tileIds.some(id => used.has(id))) return reject('used');
  const attempts = Math.min(Number.MAX_SAFE_INTEGER, state.attempts + 1);
  if (!tileIds.every((id, index) => id === puzzle.rows[row].answer[index])) {
    return { state: { ...state, attempts }, accepted: false, changed: true, reason: 'no-match' };
  }
  const placements = state.placements.map((pair, index) => index === row ? [...tileIds] : pair);
  return {
    state: { ...state, placements, attempts, status: placements.every(Boolean) ? 'won' : 'playing' },
    accepted: true, changed: true, reason: null,
  };
}

export function useHint(puzzle, state, row) {
  if (state.status !== 'playing' || !Number.isInteger(row) || row < 0 || row >= puzzle.rows.length
    || state.placements[row] !== null) return { state, hint: null, changed: false };
  const hint = { row, relationship: puzzle.rows[row].relationship };
  if (state.hintedRows.includes(row)) return { state, hint, changed: false };
  return { state: { ...state, hintedRows: [...state.hintedRows, row] }, hint, changed: true };
}

export function revealGame(puzzle, state) {
  if (state.status !== 'playing') return state;
  return { ...state, placements: puzzle.rows.map(row => [...row.answer]), status: 'revealed' };
}

function nonnegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

export function restoreGame(puzzle, raw) {
  const fresh = () => createGame(puzzle);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.puzzleId !== puzzle.id
    || !['playing', 'won', 'revealed'].includes(raw.status)
    || !nonnegativeInteger(raw.attempts)
    || !Array.isArray(raw.placements) || raw.placements.length !== puzzle.rows.length
    || !Array.isArray(raw.hintedRows) || new Set(raw.hintedRows).size !== raw.hintedRows.length
    || raw.hintedRows.some(row => !Number.isInteger(row) || row < 0 || row >= puzzle.rows.length)) return fresh();
  const placements = [];
  const used = new Set();
  for (let row = 0; row < puzzle.rows.length; row++) {
    const pair = raw.placements[row];
    if (pair === null) { placements.push(null); continue; }
    if (!Array.isArray(pair) || pair.length !== 2
      || pair.some((id, index) => typeof id !== 'string' || used.has(id) || id !== puzzle.rows[row].answer[index])
      || pair[0] === pair[1]) return fresh();
    placements.push([...pair]);
    pair.forEach(id => used.add(id));
  }
  const solved = placements.filter(Boolean).length;
  const complete = solved === puzzle.rows.length;
  if (raw.status === 'revealed' ? !complete : raw.attempts < solved) return fresh();
  const status = raw.status === 'revealed' ? 'revealed' : complete ? 'won' : 'playing';
  return { puzzleId: puzzle.id, placements, attempts: raw.attempts, hintedRows: [...raw.hintedRows], status };
}

export function isPerfect(state) {
  return state.status === 'won' && state.attempts === 5 && state.hintedRows.length === 0;
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
  const label = mode === 'practice' ? 'COUNTERPART Practice' : `COUNTERPART #${String(number).padStart(3, '0')}`;
  const squares = puzzle.rows.map((_, row) => state.status === 'revealed' ? '🟨'
    : state.placements[row] ? '🟩' : '⬜').join('');
  const hints = state.hintedRows.length;
  const details = [`${state.attempts} ${state.attempts === 1 ? 'check' : 'checks'}`, `${hints} ${hints === 1 ? 'hint' : 'hints'}`];
  if (isPerfect(state)) details.push('Perfect');
  if (state.status === 'revealed') details.push('Revealed');
  return [label, squares, details.join(' · '), ...(typeof url === 'string' && url ? [url] : [])].join('\n');
}
