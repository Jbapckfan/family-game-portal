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

## Optional tougher bonus — November 4, 2026

Open `games/ringcount/?sample=tougher`, or select **Try the bonus challenge** above the ring. The practice picker also offers **Try the tougher bonus**. This is an optional practice board with the stable ID `ringcount-tougher-v1`; its save uses `ringcount:v1:practice:ringcount-tougher-v1`. Existing daily puzzles, selection, records, and streaks are unchanged. Bonus captions/cards identify the result as **BONUS CHALLENGE**. Restart is available through the existing practice options.

Ringcount suits a bonus because the existing rule can produce a slightly more demanding board without new controls: the target is 17, the four section lengths are 2/2/3/5, and four additional arcs match the target but cannot all complete a solution. Today's November 4 daily has two such decoy arcs. The independent prefix-sum test enumerates all 495 placements, proves exactly one solution, and confirms a wrong placement with two correct totals and the other two within two of the target. This supports the design intent; human difficulty/enjoyment still need James's assessment. No new content bank was added.

The Ringcount screen, icon and result card use blue/teal accents. User-facing creator/host branding is Alford Daily with relative collection links.

Verification:

- `node --test games/ringcount/tests/*.test.mjs`: 30 passing tests, including preservation of all 210 published boards and the bonus’s uniqueness, result identity and restore rules.
- `node --check games/ringcount/{app,shell,engine,samples,share-card}.mjs` (one file per invocation).
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/alford-word-controls-browsers PLAYWRIGHT_MODULE=/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs node games/ringcount/tests/browser/tougher-bonus.mjs`: Chromium and WebKit pass entry, near miss, reload, solving, image/caption generation, reveal, preserved daily save/record bytes, and no horizontal overflow at 320/390/1280 widths. These tests use intercepted local files with temporary profiles and no server listener.
- Screenshots inspected at `/private/tmp/MAKER-codex__ringcount-bonus/`; no deployment, push, physical-device or human difficulty claim.
