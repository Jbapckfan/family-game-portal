import {originalDailyIndex} from '../deepseek-runtime/daily-rotations.mjs';
/** Pure Shortlist rules and exact scan strategy. No browser or storage dependencies. */
export const EPOCH = '2026-10-20';
export const MAX_SCANS = 3;
const DAY_MS = 86_400_000;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PAIRS = [...ALPHABET].flatMap((first, index) => [...ALPHABET.slice(index + 1)].map(second => first + second));
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
  const index = originalDailyIndex('shortlist', dateKey, number - 1, puzzles.length);
  return { puzzle: puzzles[index], dateKey, number };
}

export function createGame(puzzle) {
  return { puzzleId: puzzle.id, scans: [], eliminated: [], pick: null, hints: 0, hint: null, status: 'playing' };
}

function normalizePair(value) {
  if (typeof value !== 'string' || !/^[a-z]{2}$/i.test(value)) return null;
  const letters = value.toUpperCase();
  return letters[0] !== letters[1] ? [...letters].sort().join('') : null;
}

export function countLetters(word, letters) {
  const pair = normalizePair(letters);
  if (typeof word !== 'string' || !/^[A-Z]{5}$/.test(word) || !pair) return null;
  return Number(word.includes(pair[0])) + Number(word.includes(pair[1]));
}

export function submitScan(puzzle, state, letters) {
  const reject = reason => ({ state, accepted: false, changed: false, reason, scan: null });
  if (state.status !== 'playing') return reject('finished');
  const pair = normalizePair(letters);
  if (!pair) return reject('invalid');
  if (state.scans.some(scan => scan.letters === pair)) return reject('repeated');
  if (state.scans.length >= MAX_SCANS) return reject('no-scans');
  const scan = { letters: pair, count: countLetters(puzzle.answer, pair) };
  return {
    state: { ...state, scans: [...state.scans, scan] },
    accepted: true, changed: true, reason: null, scan,
  };
}

export function submitPick(puzzle, state, word) {
  const reject = reason => ({ state, accepted: false, changed: false, reason });
  if (state.status !== 'playing') return reject('finished');
  const pick = typeof word === 'string' ? word.toUpperCase() : null;
  if (!puzzle.words.includes(pick)) return reject('invalid');
  const accepted = pick === puzzle.answer;
  return {
    state: { ...state, pick, status: accepted ? 'won' : 'lost' },
    accepted, changed: true, reason: accepted ? null : 'wrong',
  };
}

export function toggleElimination(puzzle, state, word) {
  if (state.status !== 'playing' || !puzzle.words.includes(word)) return state;
  const eliminated = state.eliminated.includes(word)
    ? state.eliminated.filter(item => item !== word) : [...state.eliminated, word];
  return { ...state, eliminated };
}

export function possibleWords(puzzle, state) {
  // Pencil marks are deliberately not evidence. Incorrect notes must never affect advice.
  return puzzle.words.filter(word => state.scans.every(scan => countLetters(word, scan.letters) === scan.count));
}

function rankedPartitions(words) {
  return PAIRS.map(letters => {
    const groups = [[], [], []];
    for (const word of words) groups[countLetters(word, letters)].push(word);
    return { letters, groups, largest: Math.max(...groups.map(group => group.length)),
      squared: groups.reduce((total, group) => total + group.length ** 2, 0) };
  }).filter(item => item.largest < words.length)
    .sort((a, b) => a.largest - b.largest || a.squared - b.squared || a.letters.localeCompare(b.letters));
}

/** Build a decision tree that identifies every supplied word, if one exists within the budget.
 * Used by the offline content validator and by the one optional strategy hint.
 * The function sees candidate words only; it never receives the hidden answer.
 */
export function solveDecisionTree(words, budget = MAX_SCANS) {
  if (!Array.isArray(words) || !words.length || words.length > 12
    || words.some(word => typeof word !== 'string' || !/^[A-Z]{5}$/.test(word))
    || new Set(words).size !== words.length || !Number.isInteger(budget) || budget < 0 || budget > MAX_SCANS) return null;
  const cache = new Map();
  function search(candidates, left) {
    if (candidates.length === 1) return { word: candidates[0], worstCase: 0, expectedScans: 0 };
    if (left === 0 || candidates.length > 3 ** left) return null;
    const key = `${left}:${candidates.join(',')}`;
    if (cache.has(key)) return cache.get(key);
    for (const choice of rankedPartitions(candidates)) {
      if (choice.largest > 3 ** (left - 1)) continue;
      const branches = {};
      let complete = true;
      for (let count = 0; count < 3; count++) {
        if (choice.groups[count].length === 0) continue;
        const branch = search(choice.groups[count], left - 1);
        if (!branch) { complete = false; break; }
        branches[count] = branch;
      }
      if (complete) {
        const result = {
          letters: choice.letters, branches,
          worstCase: 1 + Math.max(...Object.values(branches).map(branch => branch.worstCase)),
          expectedScans: 1 + Object.entries(branches).reduce((sum, [count, branch]) => sum
            + choice.groups[Number(count)].length / candidates.length * branch.expectedScans, 0),
        };
        cache.set(key, result);
        return result;
      }
    }
    cache.set(key, null);
    return null;
  }
  return search(words, budget);
}

export function findHint(puzzle, state) {
  if (state.status !== 'playing' || state.hints >= 1) return null;
  const candidates = possibleWords(puzzle, state);
  if (candidates.length === 1) return {
    type: 'deduction', letters: null,
    message: 'Your scans already isolate one word. Find the word that matches every count, then make your final pick.',
  };
  if (state.scans.length >= MAX_SCANS) return {
    type: 'deduction', letters: null,
    message: 'Check every scan against each word. A 1 means exactly one of the two letters; a 2 means both. More than one word may still fit, so your final pick may be a calculated guess.',
  };
  const remaining = MAX_SCANS - state.scans.length;
  const strategy = solveDecisionTree(candidates, remaining);
  const letters = strategy?.letters ?? rankedPartitions(candidates)[0]?.letters;
  return letters ? {
    type: 'scan', letters,
    message: `Try scanning ${letters[0]} + ${letters[1]}. That pair separates the words still consistent with your results.`,
  } : {
    type: 'deduction', letters: null,
    message: 'Compare every remaining word with the exact count in each scan before making your final pick.',
  };
}

export function useHint(puzzle, state) {
  const hint = findHint(puzzle, state);
  return { state: hint ? { ...state, hints: 1, hint: { ...hint, scanCount: state.scans.length } } : state, hint };
}

export function revealGame(puzzle, state) {
  return state.status === 'playing' ? { ...state, status: 'revealed' } : state;
}

function validHintCount(value) { return value === 0 || value === 1; }
function validScanCount(value) { return Number.isInteger(value) && value >= 0 && value <= MAX_SCANS; }

export function restoreGame(puzzle, raw) {
  const fresh = () => createGame(puzzle);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.puzzleId !== puzzle.id
    || !['playing', 'won', 'lost', 'revealed'].includes(raw.status) || !validHintCount(raw.hints)
    || !Array.isArray(raw.scans) || raw.scans.length > MAX_SCANS
    || !Array.isArray(raw.eliminated) || new Set(raw.eliminated).size !== raw.eliminated.length
    || raw.eliminated.some(word => !puzzle.words.includes(word))
    || (raw.pick !== null && !puzzle.words.includes(raw.pick))) return fresh();
  const seen = new Set();
  const scans = [];
  for (const scan of raw.scans) {
    if (!scan || typeof scan !== 'object' || Array.isArray(scan)) return fresh();
    const letters = normalizePair(scan.letters);
    if (!letters || seen.has(letters) || scan.count !== countLetters(puzzle.answer, letters)) return fresh();
    seen.add(letters);
    scans.push({ letters, count: scan.count });
  }
  if (raw.status === 'revealed' && raw.pick !== null) return fresh();
  const status = raw.status === 'revealed' ? 'revealed'
    : raw.pick === null ? 'playing' : raw.pick === puzzle.answer ? 'won' : 'lost';
  let hint = null;
  if (raw.hints === 0 && raw.hint != null) return fresh();
  if (raw.hints === 1) {
    // Older saves retained only the assistance count. Preserve it without
    // inventing advice or a time at which that advice was originally received.
    const legacy = raw.hint == null;
    if (!legacy && (typeof raw.hint !== 'object' || Array.isArray(raw.hint)
      || !Number.isInteger(raw.hint.scanCount) || raw.hint.scanCount < 0 || raw.hint.scanCount > scans.length)) return fresh();
    if (!legacy) {
      const scanCount = raw.hint.scanCount;
      const expected = findHint(puzzle, { ...createGame(puzzle), scans: scans.slice(0, scanCount) });
      if (raw.hint.type !== expected.type || raw.hint.letters !== expected.letters) return fresh();
      // Wording is derived display text, not game integrity. Normalize it while
      // preserving the original evidence context and valid completed results.
      hint = { ...expected, scanCount };
    }
  }
  return { puzzleId: puzzle.id, scans, eliminated: [...raw.eliminated], pick: raw.pick, hints: raw.hints, hint, status };
}

export function getStats(records, todayKey) {
  const stats = { played: 0, won: 0, streak: 0, bestStreak: 0, unassisted: 0, averageScans: 0 };
  if (!records || typeof records !== 'object' || Array.isArray(records)) return stats;
  const todayTime = calendarTime(todayKey);
  const entries = Object.entries(records).filter(([key, record]) => Number.isFinite(calendarTime(key))
    && (!Number.isFinite(todayTime) || calendarTime(key) <= todayTime)
    && record && ['won', 'lost', 'revealed'].includes(record.status)
    && validScanCount(record.scans) && validHintCount(record.hints))
    .sort(([a], [b]) => a.localeCompare(b));
  stats.played = entries.length;
  const wins = new Set();
  let totalScans = 0;
  let previousWin = NaN;
  let run = 0;
  for (const [date, record] of entries) {
    if (record.status !== 'won') { run = 0; previousWin = NaN; continue; }
    stats.won++;
    totalScans += record.scans;
    if (record.hints === 0) stats.unassisted++;
    const time = calendarTime(date);
    run = time - previousWin === DAY_MS ? run + 1 : 1;
    stats.bestStreak = Math.max(stats.bestStreak, run);
    previousWin = time;
    wins.add(date);
  }
  stats.averageScans = stats.won ? Math.round(totalScans / stats.won * 10) / 10 : 0;
  let cursor = todayTime;
  if (!Number.isFinite(cursor)) return stats;
  const today = entries.find(([key]) => key === todayKey)?.[1];
  if (today && today.status !== 'won') return stats;
  const dateAt = time => new Date(time).toISOString().slice(0, 10);
  if (!wins.has(dateAt(cursor))) cursor -= DAY_MS;
  while (wins.has(dateAt(cursor))) { stats.streak++; cursor -= DAY_MS; }
  return stats;
}

export function formatShare(puzzle, state, { number = 1, mode = 'daily', url } = {}) {
  const label = mode === 'practice' ? 'SHORTLIST Practice' : `SHORTLIST #${String(number).padStart(3, '0')}`;
  const result = { won: ['🟩', 'Solved'], lost: ['🟥', 'Missed'], revealed: ['🟨', 'Revealed'], playing: ['⬜', 'In progress'] }[state.status];
  const squares = `${'🔎'.repeat(state.scans.length)}${'◻️'.repeat(MAX_SCANS - state.scans.length)} ${result[0]}`;
  const details = `${state.scans.length} ${state.scans.length === 1 ? 'scan' : 'scans'} · ${state.hints} ${state.hints === 1 ? 'hint' : 'hints'} · ${result[1]}`;
  return [label, squares, details, ...(typeof url === 'string' && url ? [url] : [])].join('\n');
}
