# Shortlist engine and content contract

Shortlist is a short deduction game: twelve five-letter words are visible, one is hidden, and the player has up to three scans before one final pick. A scan contains two different letters and reports how many of those two letters occur anywhere in the hidden word. Repeated occurrences count once. A result of `1` does not identify which letter is present.

The interface should confirm final picks explicitly. Selecting a word or marking it as ruled out must not accidentally end the round. A wrong final pick is a loss; revealing is a separate terminal result. Using all three scans does not end the round. The player may pick earlier.

## Data

```js
const puzzle = {
  id: 'shortlist-001',
  title: 'Small signals. Big deductions.',
  difficulty: 'Sharp',
  words: ['CRANE', 'BRICK', 'GHOST', 'PLUMB', 'FJORD', 'WATCH',
    'SILKY', 'DROWN', 'MAPLE', 'SCOUT', 'FLING', 'QUEST'],
  answer: 'MAPLE',
};

const state = {
  puzzleId: 'shortlist-001',
  scans: [{ letters: 'CR', count: 0 }],
  eliminated: ['CRANE', 'BRICK'],
  pick: null,
  hints: 0,
  hint: null, // once used: {type, letters, message, scanCount}
  status: 'playing', // or won, lost, revealed
};
```

`puzzles.mjs` exports `PUZZLES` and `COLLECTION`. There are 90 distinct boards, 90 distinct designated answers, and 1,035 distinct displayed words. No displayed word is used more than twice. The authored vocabulary and deterministic construction are in `scripts/generate-puzzles.mjs`; no dictionary or network call is required at runtime. The collection repeats after 90 calendar days.

## Engine exports

| Export | Behavior |
| --- | --- |
| `EPOCH` | `2026-10-20` |
| `MAX_SCANS` | `3` |
| `getDateKey(now?)` | Calendar date in `America/Chicago` |
| `getDayNumber(dateKey)` | Epoch-based daily number; invalid keys produce `NaN` |
| `getDaily(puzzles, now?)` | `{ puzzle, dateKey, number }` |
| `createGame(puzzle)` | Fresh, independent state |
| `countLetters(word, letters)` | `0`, `1`, `2`, or `null` for invalid input |
| `submitScan(puzzle, state, letters)` | `{state, accepted, changed, reason, scan}` |
| `submitPick(puzzle, state, word)` | `{state, accepted, changed, reason}`; wrong picks change state but have `accepted:false` |
| `toggleElimination(puzzle, state, word)` | Reversible, unscored pencil mark |
| `possibleWords(puzzle, state)` | Words consistent with scan evidence, ignoring pencil marks |
| `findHint(puzzle, state)` | Pure strategy advice, or `null` after using the single hint or finishing |
| `useHint(puzzle, state)` | `{state, hint}`; counts assistance but does not spend a scan |
| `revealGame(puzzle, state)` | Terminal `revealed`, preserving history and a null final pick |
| `restoreGame(puzzle, raw)` | Validates saved counts against the puzzle and derives win/loss from the actual pick |
| `getStats(records, todayKey)` | `{played, won, streak, bestStreak, unassisted, averageScans}` |
| `formatShare(puzzle, state, options?)` | Spoiler-free daily/practice result with scans, hint count, and terminal outcome |
| `solveDecisionTree(words, budget = 3)` | Exact certification utility; returns a strategy tree or `null` |

Rejected scan reasons: `finished`, `invalid`, `repeated`, `no-scans`. Repeated scans include the reversed pair and do not spend a scan. Final-pick reasons: `finished`, `invalid`, `wrong`, or `null` on a win. All rejected invalid actions return the original state. Lowercase scan letters and final word picks normalize to uppercase; pair order normalizes alphabetically.

A hint is `{type:'scan', letters:'CR', message}` or `{type:'deduction', letters:null, message}`. It depends only on the visible board and previous scan results, never on the hidden answer. Pencil marks are deliberately ignored by the hint so a mistaken note cannot produce false advice. Do not automatically rule out candidates using `possibleWords`; the deduction belongs to the player.

The state saves the exact paid hint in `hint`, adding `scanCount` to identify the original prefix of scan evidence. Restoration recomputes and validates that advice against the same prefix. The UI displays the saved message after refresh and restores an unused suggested pair. Legacy assisted saves without the payload recover advice from their current visible evidence without consuming another hint.

Statistics records use `{status, scans: state.scans.length, hints: state.hints}`. Terminal win, loss, and reveal each count as a play. Only wins extend streaks. Average scans includes wins only. An unassisted win is a win with zero hints; this does not pretend that an early lucky pick is a provably optimal solve.

## Solvability guarantee

Every board has a verified strategy that identifies **any** of its twelve candidate words within three scans. This is stronger than verifying only the designated answer. The test suite traverses all 90 × 12 = 1,080 answer paths with independent scan-count calculations, actual engine actions, restoration checks, and a final correct pick.

The guarantee applies to a suitable sequence of scans. Spending scans on uninformative pairs can leave several possibilities, and a wrong final pick can lose. The finite scan budget is the challenge. The UI should not promise that every arbitrary scan sequence guarantees a unique answer.

Difficulty labels are based on the expected scan depth of a certified decision tree, not on player testing. The labels do not claim an optimal human solving time.

Opening demonstration: scan `C + R` → `0`; scan `I + L` → `1`; scan `A + C` → `1`. Only MAPLE fits all three counts. Keep this answer out of onboarding for the live first daily puzzle; use a separate fictional example there.

## Verification

```bash
node tests/engine.test.mjs
node tests/puzzles.test.mjs
node scripts/generate-puzzles.mjs --check
```

The engine suite has 26 tests, and the content suite has four tests including the 1,080 certified answer paths. Ten shared shell tests cover persistence and daily/practice separation. Future-dated records are excluded from statistics when a valid current date is supplied.

## Design precedent

Shortlist is an authored deduction variant, not a claim of a newly invented genre. Initial research checked existing games, including [Bonds](https://www.fiveletterwords.io/bonds), which uses letter and adjacent-pair feedback, and [Diffle](https://diffle.com/), which uses word-order feedback. Shortlist instead asks players to choose two-letter questions over an explicit candidate board, followed by one final selection.
