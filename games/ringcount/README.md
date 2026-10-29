# Ringcount

A daily game of perfect balance from Alford Family Games. Place four cuts around a fixed ring of twelve numbers so all four arcs add up to the target. The arcs may have different lengths, and the ring wraps around.

## Play and scoring

- Tap a gap to place a cut; tap a selected gap to remove it. Four cuts may be placed at once.
- Arc totals update while you work. Press **Check the circle** to finish.
- A distinct complete arrangement costs one check. Rechecking the same arrangement is unscored.
- Every accepted cut change counts as a move. A hint places one correct cut, replacing an incorrect cut when needed, and records one hint and one move.
- One successful check without hints is a perfect circle. There is no timer or move limit.
- Reveal ends a board as revealed rather than won. Practice has separate saves and can be restarted; daily results cannot be reset through the UI.

## Collection and solvability

This edition contains **210 prepared boards**, with targets from 15 to 18 and numbers from 1 to 9. All rings differ under rotation and reflection. Each solution has at least two different arc lengths, and each board includes plausible partial arcs that do not form a complete solution.

An independent prefix-sum validator enumerates all **103,950 complete four-cut arrangements** across the collection. Every board has exactly one solution. The recovery test starts from each complete arrangement and confirms that at most four hints preserve already-correct cuts and produce a board that wins on an explicit check. These checks establish structural solvability; session length, difficulty, and enjoyment still require human playtesting.

Everyone receives the same daily at midnight in **America/Chicago**, beginning October 20, 2026. The finite collection repeats after 210 days. It is not an ongoing editorial feed.

## Run and verify

The app uses buildless HTML, CSS, and JavaScript modules, with bundled licensed fonts and no external runtime dependencies. Serve `./` using an ordinary static development server that serves `.mjs` as JavaScript. In the managed Sites environment, use the registered Alford Daily collection's supported preview workflow.

```sh
npm test
npm run check
node scripts/generate-puzzles.mjs
```

The generator is deterministic. Its output is also checked against the committed collection by the content tests. See [the engine contract](docs/engine-contract.md) for the state model and API.

## Progress and integration

The shared shell saves under `ringcount:v1:` in browser storage. It handles interrupted saves, restored terminal results, separate practice, and sequential cross-tab completion. Clearing site data removes browser progress; there is no account or cross-device sync.

The shell supports the bundled iOS app's optional native bridge for daily progress, haptics, and spoiler-free sharing. Browser play works without that bridge. The portable portal runtime lives at `games/ringcount/`; the native bundle uses `Web/games/ringcount/`.

The local game source contains its puzzle answers so it can work offline. This is a personal daily puzzle, not a tamper-resistant competitive scoring service.

## Expanded collection verification

Run `npm run verify:content` to reproduce the deterministic collection without writing files, or `npm run generate` to regenerate it. Run `npm test` for the game suite. For individual assertion output, use `node --test --test-isolation=none tests/*.test.mjs` with Node 24. The expansion tests verify an immutable SHA-256 of every published board in its original position, substantive uniqueness, and stable launch-date daily selection. Published IDs, save schemas, creator labels, and the October 20, 2026 Central daily epoch remain unchanged.
