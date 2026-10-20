# Ringcount engine contract

Ringcount is a daily arithmetic partition puzzle. Twelve numbers stay fixed around a circle. Place four cuts in the gaps so each contiguous arc sums to the shown target, then press Check. Gaps are numbered after their number, clockwise; internal indices are zero-based.

## Puzzle data

```js
{
  id: 'ringcount-001',
  title: 'Circle 001',
  difficulty: 'Sharp',
  numbers: [5, 4, 6, 9, 6, 7, 2, 5, 1, 8, 3, 4],
  target: 15,
  sections: 4,
  solution: [2, 4, 8, 11],
  decoyArcs: 2
}
```

`puzzles.mjs` exports `PUZZLES`, a frozen array of 90 frozen boards. Targets range from 15 to 18 and every number is 1–9. Each solution has at least two arc lengths, so no puzzle is simply four consecutive triples. At least two other contiguous runs sum to the target but cannot form a full solution. `decoyArcs` counts those runs; the difficulty label is a structural estimate pending human playtesting.

## State

```js
{
  puzzleId: 'ringcount-001',
  cuts: [],             // Sorted zero-based gap indices, at most four.
  moves: 0,             // Every accepted cut toggle or hint adds one.
  checks: 0,            // Distinct complete arrangements checked.
  hints: 0,
  checkedSets: [],      // Canonical strings such as '2,4,8,11'.
  status: 'playing'     // 'playing', 'won', or 'revealed'.
}
```

Functions return new states and do not mutate the supplied state or puzzle. Revealing is distinct from winning. Every terminal state rejects further edits.

## Actions and helpers

- `createGame(puzzle)` returns a fresh state.
- `toggleCut(puzzle, state, gap)` returns `{state, changed, reason}`. Reasons are `finished`, `invalid`, or `full`; success uses `null`. A fifth cut is refused. Removing a cut is one additional move, not a refunded move.
- `getSegments(puzzle, cuts)` returns `[{start, end, indices, values, sum}]`. It starts with the arc immediately after the smallest selected cut, continues clockwise, and includes the wrapping arc once. With no cuts it returns one whole-ring segment; invalid cut arrays return `[]`.
- `checkBoard(puzzle, state)` returns `{state, changed, accepted, reason, segments}`. Incomplete arrangements do not score. Any arrangement already present in `checkedSets` is unscored, even if other arrangements were checked in between. A new complete arrangement scores one check. A wrong check leaves every cut editable; a correct check sets `status: 'won'`. Reasons are `finished`, `incomplete`, `repeated`, `wrong`, or `null` for a win.
- `useHint(puzzle, state)` returns `{state, changed, hint}`. When a solution cut is missing, it adds one. If all four positions are occupied, it replaces one incorrect cut and preserves all correct cuts. A successful hint adds one hint and one move. `hint` is `{gap, removedGap, message}`, with `removedGap: null` when nothing was removed. When all correct cuts are already present, `hint` is `null`. Hints never win automatically; Check is still required.
- `revealGame(puzzle, state)` sets `status: 'revealed'` without changing the player's cuts. The UI should render `puzzle.solution` as the revealed answer while retaining the original state for honest statistics.
- `restoreGame(puzzle, raw)` returns canonical valid progress or a fresh game. It validates counters, cut bounds, distinct check history, terminal status, and the final winning check. A successful check cannot be followed by more history.
- `solvePuzzle(puzzle)` enumerates all 495 possible four-cut sets and returns every valid solution. It does not consult `puzzle.solution`.

## Shared shell

The engine exports `getDateKey`, `getDayNumber`, `getDaily`, `getStats`, and `formatShare`, compatible with the shared shell. The daily calendar uses America/Chicago and starts October 20, 2026. The finite collection repeats after 90 days.

Use this record adapter:

```js
record: state => ({
  status: state.status,
  checks: state.checks,
  moves: state.moves,
  hints: state.hints
})
```

Stats include `played`, `won`, `streak`, `bestStreak`, `perfect`, `unassisted`, and `averageChecks`. A perfect round is a win with one check and no hints. Share text includes the result, check count, and hint count; it excludes the ring and cut positions.

## Validation and regeneration

```sh
node tests/engine.test.mjs
node tests/puzzles.test.mjs
node scripts/generate-puzzles.mjs
```

Twelve engine tests cover daily boundaries, segments, scoring, repeated checks, hints, restoration, terminal immutability, stats, future-date exclusion, and sharing. Four collection tests cover content invariants, all 44,550 cut sets, recovery from every complete placement, and deterministic regeneration. The independent reference validator uses prefix sums, rather than the engine's segment-building code.

All 90 rings are distinct under rotation and reflection. Every board has exactly one solution. From every complete placement, at most four hints preserve existing correct cuts and reach a board that wins on Check. This verifies structural solvability and recovery; the 30–90 second session length remains a playtesting target, not a measured guarantee.
