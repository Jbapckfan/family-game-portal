# Sideways engine and puzzle contract

Five horizontal strips of four letters can each rotate left or right. The player uses four clues to make four five-letter words read down the columns. Every row is shared by all four words, so a rotation can help one column while disrupting another.

The board does not judge continuously. `Check board` reports which columns are correct and wins only when all four answers are simultaneously correct. Feedback becomes stale after a rotation. Rows and columns never lock. A repeated check of the same visible arrangement spends nothing, including when the player rotates away and returns to the last checked arrangement.

## Puzzle and state

```js
const puzzle = {
  id: 'sideways-001', title: 'Read between the rows', difficulty: 'Tricky',
  strips: ['PCBS', 'TLRR', 'AAEO', 'ARNN', 'ETED'],
  columns: [
    { answer: 'CRANE', clue: 'Wading bird with a long neck' },
    { answer: 'BREAD', clue: 'Dough after baking' },
    { answer: 'STORE', clue: 'Put away for later' },
    { answer: 'PLANT', clue: 'Living thing with roots' },
  ],
};
const state = {
  puzzleId: 'sideways-001', rotations: [0, 0, 0, 0, 0],
  checks: 0, moves: 0, hints: 0, history: [], lastCheck: null, status: 'playing',
};
```

Rotations are **rightward** shifts relative to the initial strips. The right arrow calls `rotateRow(puzzle,state,row,+1)`; left uses `-1`. Periodic strips canonicalize equivalent rotations, although the published boards all have four distinct orientations per strip.

`lastCheck` is either `null` or `{rotations:[...], correct:[boolean,boolean,boolean,boolean]}`. Call `feedbackCurrent(puzzle,state)` before displaying its correctness as current feedback. The current column strings are always safe to display; fresh correctness is disclosed only by an explicit check.

## Exports

| Export | Result |
| --- | --- |
| `EPOCH` | `2026-10-20` |
| `HISTORY_LIMIT` | `64` prior orientations |
| `getDateKey(now?)` | Calendar date in `America/Chicago` |
| `getDayNumber(dateKey)` | Daily number from the epoch |
| `getDaily(puzzles,now?)` | `{puzzle,dateKey,number}` |
| `createGame(puzzle)` | New independent game state |
| `rotateStrip(strip,steps)` | Right rotation; negative steps rotate left |
| `getRows(puzzle,state)` | Five current four-letter strings |
| `getColumns(puzzle,state)` | Four current five-letter strings |
| `rotateRow(puzzle,state,row,direction)` | Updated state, or original for invalid/terminal/no-change action |
| `undoMove(puzzle,state)` | Restored previous orientation without refunding counters |
| `checkBoard(puzzle,state)` | `{state,accepted,changed,reason,correct}` |
| `feedbackCurrent(puzzle,state)` | Whether last checked feedback belongs to the current visible board |
| `findHint(puzzle,state)` | `{row,rotation,message}`, or `null` |
| `useHint(puzzle,state)` | `{state,hint}`; turns one incorrect row to the answer orientation |
| `revealGame(puzzle,state)` | All answers arranged, terminal `revealed`, never a win |
| `restoreGame(puzzle,raw)` | Validated and normalized saved state |
| `getStats(records,todayKey)` | `{played,won,streak,bestStreak,perfect,averageChecks}` |
| `formatShare(puzzle,state,options?)` | Spoiler-free result |

Every accepted arrow rotation costs one move. An optional hint costs one move and one hint, and places exactly one incorrect row; hints do not lock anything and do not win automatically. Undo restores a prior orientation but never refunds moves, checks, or hints. A later hint can correct a row the player moved again. These choices keep assistance and exploration honest while leaving every arrangement recoverable.

`checkBoard` accepts valid checks with `accepted:true`, even when some columns are wrong. A rejected check has `reason:'unchanged'` or `'finished'`. Winning requires an explicit successful check. A solved-but-unchecked save remains playing. Invalid feedback or impossible counters reset the save.

Statistics records are `{status,checks,moves,hints}`. Perfect means `status==='won' && checks===1 && hints===0`. Undo does not disqualify a perfect result because checks measure submitted certainty, while the move count separately records exploration. Reveals count as plays and break winning streaks.

## Content and guarantees

The collection contains 90 distinct puzzles and 360 distinct answers. No answer repeats within this collection. The offline generator contains 548 original clues. Every board has:

- Four or five rows shifted away from the answer.
- No correct column at the start.
- Four distinct orientations for every strip.
- At least three rows with repeated letters.
- Multiple possible row arrangements for each single column answer, so one clue alone does not fix the entire board.
- Exactly one full solution among all 4⁵ = 1,024 orientations.

The tests independently enumerate all 92,160 orientations. A separate recovery check starts the actual engine at each of those 92,160 states, returns every row to its solution using actual rotation actions, then wins with an explicit check. Thus every reachable orientation remains solvable; there is no dead-end state, timer, life limit, or irreversible wrong choice.

The first board's right-rotation solution is `[3,2,3,1,2]`. Keep live daily answers out of onboarding.

The daily collection repeats after 90 days. Difficulty labels refer to four versus five initially shifted rows and have not been calibrated with player data.

## Verification

```bash
node tests/engine.test.mjs
node tests/puzzles.test.mjs
node scripts/generate-puzzles.mjs --check
```

There are 21 engine tests and six content tests, in addition to the app shell's separate persistence tests. All pass. The generator check reproduces the checked-in collection exactly.

Sideways is an authored cyclic-strip puzzle, not a claim of an unprecedented genre. A name/mechanic check found related row-and-column rotation play in [mojicu](https://apps.apple.com/pl/app/mojicu/id6792293184), while the four-clue horizontal-strip configuration here has its own implementation and content.
