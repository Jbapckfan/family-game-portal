# Switchpath engine and puzzle contract

The board is a 4 × 4 grid containing each number from 1 through 16 once. Begin at S, move only up/down/left/right, visit every cell once, and finish at E. The first step must go to a higher number, the next to a lower one, then higher, then lower, alternating throughout the route.

Players can freely recover from a wrong branch by tapping an earlier cell in their route. This rewinds to that point. E cannot be used until the sixteenth and final cell. There is no timer or life limit. Completing a valid full route wins automatically.

## Puzzle and state

```js
const puzzle = {
  id: 'switchpath-001', title: 'Change your direction', difficulty: 'Sharp',
  values: [1, 11, 6, 15, 5, 10, 8, 4, 2, 13, 3, 12, 16, 7, 14, 9],
  start: 0, end: 12,
  solution: [0, 4, 8, 9, 5, 1, 2, 3, 7, 6, 10, 11, 15, 14, 13, 12],
  branchPoints: 5,
};
const state = {
  puzzleId: 'switchpath-001', path: [0], moves: 0, hints: 0, status: 'playing',
};
```

Cells use indices 0–15 in row-major order. `values[cell]` is the displayed number. S and E are fixed for each puzzle but vary between puzzles. Do not assume S is always the top-left cell or that the smallest/largest number marks an endpoint.

## Engine exports

| Export | Result |
| --- | --- |
| `EPOCH` | `2026-10-20` |
| `getDateKey(now?)` | Calendar date in `America/Chicago` |
| `getDayNumber(dateKey)` | Epoch-based daily number |
| `getDaily(puzzles,now?)` | `{puzzle,dateKey,number}` |
| `createGame(puzzle)` | State whose path initially contains only S |
| `nextDirection(state)` | `'higher'` or `'lower'` for the next extension |
| `legalNextCells(puzzle,state)` | Locally legal unused adjacent cells, excluding E until the last step |
| `selectCell(puzzle,state,cell)` | `{state,accepted,changed,reason,action}` |
| `findHint(puzzle,state)` | `{path,cell,rewound,message}`, or `null` after finishing |
| `useHint(puzzle,state)` | `{state,hint}`, with one assistance and one move added |
| `revealGame(puzzle,state)` | Full route with terminal `revealed`, preserving counters |
| `restoreGame(puzzle,raw)` | Strictly validates adjacency, uniqueness, alternating comparisons, endpoints, and counters |
| `getStats(records,todayKey)` | `{played,won,streak,bestStreak,perfect,averageMoves}` |
| `formatShare(puzzle,state,options?)` | Spoiler-free progress/result, without route coordinates or board numbers |

An accepted extension has `action:'extend'`; tapping an earlier visited cell has `action:'rewind'`. Each costs one move. Rewinding multiple steps is one action and does not refund previous moves. Tapping the current tip is an unscored `reason:'unchanged'`. Other unscored reasons are `invalid`, `not-adjacent`, `end-too-early`, `direction`, and `finished`.

An undo button can call `selectCell(puzzle,state,state.path.at(-2))` when the path has more than one cell. A start-over button can select `puzzle.start`; this preserves honest move and hint counts. Practice restart, if offered, creates a separate fresh attempt through the shared app shell.

A hint finds the longest correct prefix of the current route, removes an incorrect branch if necessary, and adds exactly one next correct cell. It can therefore rewind several steps and extend one step in a single assisted action. The message explains that correction. A hint can make the final step and win, but that win is assisted. It never dumps the whole remaining route.

Statistics records are `{status,moves,hints}`. A perfect win uses exactly 15 moves and zero hints. Revealing fills the route but never awards a win or a winning streak. A full valid saved route derives a win even if its raw status label says playing; a partial route cannot become won from a forged label alone.

## Puzzle collection and solvability

There are 90 puzzles. They use 48 different route shapes after identifying rotations and reflections, and all 90 numbered layouts remain distinct under those symmetries. Starting cells cover all 16 positions. Every board has at least four locally branching choices along its unique correct route. These are real decisions: both options obey the immediate numerical and adjacency rules, but only one can lead to the complete solution.

The deterministic generator enumerates all 552 directed Hamiltonian routes on the 4 × 4 grid, assigns alternating ranked values, and retains only boards with exactly one valid route. It does not merely rotate one numbered layout. The collection repeats after 90 days.

An independent test search visits **25,319 legal partial or complete paths** across the collection and verifies exactly one complete solution for each board. A second test restores every such state, rewinds it using an actual game action, and completes the route through actual engine moves. A third test checks hint recovery from all **25,229 nonterminal partial paths**. Thus every reachable unfinished state remains solvable by rewinding, even if it has no legal next extension.

The difficulty labels reflect the number of locally branching choices and have not been calibrated using player timing data.

## Verification

```bash
node tests/engine.test.mjs
node tests/puzzles.test.mjs
node scripts/generate-puzzles.mjs --check
```

The engine has 20 tests and the content has five tests, including the exhaustive state recovery checks. Six application adapter tests run the real UI adapter, shared shell, and engine together with browser-facility stand-ins. They verify persistence, scoring, result/reveal rendering, practice replay, and keyboard interaction. Future-dated records cannot affect statistics before their date arrives.

The name/mechanic check found no obvious exact-title daily game. This is not a claim of trademark clearance or an unprecedented puzzle genre; alternate numerical path rules also appear in other puzzle collections.
