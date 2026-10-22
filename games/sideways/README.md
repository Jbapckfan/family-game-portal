# Sideways

A spatial word puzzle: rotate five horizontal strips until four clued answers read down.

## Mechanics

The board has five rows of four letters. Rotating a row left or right wraps its edge letter to the other side. All four vertical words depend on the shared rows; the horizontal strings do not need to be words.

Read the four clues and arrange four five-letter answers from top to bottom. An explicit check reports which columns match. Feedback applies only to the arrangement that was checked; returning to that same arrangement can reuse its feedback without spending another check. Correct columns do not lock, and every row remains movable until a final successful check.

Shifts and undo are available while playing. Each shift stays in the move total, and undo does not refund moves, checks, or hints. Undo retains the last 64 prior orientations. A nudge places one incorrect row in its answer position, counts as one move and one hint, and leaves it movable. A correct arrangement still needs an explicit check to win. **One check without nudges is perfect.** Revealing ends as revealed rather than won.

## Prepared collection and solvability

There are **180 boards** with **543 distinct answer words**; each answer appears at most twice in this collection. The generator contains 548 original clues from which the collection is constructed. The daily collection repeats after 180 days.

Every board has exactly one arrangement for its four answers among all **4⁵ = 1,024 row orientations**. Tests enumerate all 184,320 collection orientations. A separate recovery check starts the real engine at every orientation, rotates to the solution, and wins through an explicit check. Every reachable arrangement remains solvable; there are no lives, timer, or irreversible wrong shifts.

Every starting board has four or five shifted rows, no correct starting column, and at least three rows with repeated letters. One clue alone leaves multiple row arrangements. Difficulty labels describe the initial scramble and are not player-calibrated ratings.

Check that the deterministic generator reproduces the committed content exactly:

```bash
node scripts/generate-puzzles.mjs --check
```

The detailed API, scoring contract, and construction guarantees are in [docs/engine-contract.md](docs/engine-contract.md).

## Run locally

The app is plain HTML, CSS, and browser JavaScript modules. `./` is the complete deployable app; there is no build step and no npm dependency installation is needed.

From this project directory, start a static server with Python 3:

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory .
```

Open <http://127.0.0.1:4173/>. Use an HTTP server rather than opening `index.html` as a file so the browser can load its ES modules.

With a current Node.js version, run the checks:

```bash
npm test
npm run check
```

`npm test` runs the real rules, content guarantees, and shared-shell persistence regressions. `npm run check` checks JavaScript syntax. The shell tests use a small DOM/storage stand-in; visual layout and native browser behavior require a browser review.

## Daily puzzles and saved state

The daily calendar uses **America/Chicago** and starts at puzzle 1 on **October 20, 2026**. Everyone receives the same collection entry for a given Central calendar date. An open board remains playable across midnight; the new-day control loads the next daily. This is a finite prepared collection, not an unlimited puzzle-generation service.

The app saves in `localStorage` under `sideways:v1:`:

- `daily:YYYY-MM-DD` stores a daily board state.
- `practice:<puzzleId>` stores progress for each practice board.
- `records` stores completed daily results for statistics and streaks.
- `settings` stores the optional sound preference.

Only solved daily puzzles extend the winning streak. Reveals count as completed boards without counting as wins. Practice results stay separate, can be restarted, and do not change the daily record. Today's unfinished puzzle is reserved from the practice picker. Clearing browser data removes local progress; there is no account or cross-device synchronization.

The shared shell repairs a missing or malformed result record from a valid terminal save. It preserves the first finished daily when a stale tab later acts, and listens for progress updates from other tabs. If storage fails, the current tab retains progress in memory and shows a save warning. `localStorage` is not transactional for literally simultaneous writes from multiple tabs.

## Files and portal integration

- `engine.mjs` contains pure game rules, restoration, dates, statistics, and spoiler-free sharing.
- `puzzles.mjs` contains the prepared collection and its metadata.
- `app.mjs` connects the game-specific UI to the engine.
- `shell.mjs` supplies daily/practice navigation, storage, dialogs, statistics, and sharing.
- `index.html`, `styles.css`, `fonts/`, the icon, and the web manifest are self-contained presentation assets.
- `tests/` exercises actual production modules.

This portable project lives at `games/sideways/`. Serve this directory at `/games/sideways/` in the Alford Family Games portal. Keep the files together: module, stylesheet, font, and icon paths are relative. At that route, the shared shell makes the family link point two levels up and the companion-game link point to its sibling directory. The standalone shell uses configured hosted links.

There is no application server, database, API key, or runtime network scoring. Access restrictions belong to the serving host; this static app does not implement authentication. This README describes the source and integration path, not a claim that this copy has already been published.

Preserve published puzzle IDs and the daily epoch when extending the collection so existing saves remain meaningful. Changes to scoring or save schema should have an explicit migration or storage-version change.

## Expanded collection verification

Run `npm run verify:content` to reproduce the deterministic collection without writing files, or `npm run generate` to regenerate it. Run `npm test` for the game suite. For individual assertion output, use `node --test --test-isolation=none tests/*.test.mjs` with Node 24. The expansion tests verify an immutable SHA-256 of every published board in its original position, substantive uniqueness, and stable launch-date daily selection. Published IDs, save schemas, creator labels, and the October 20, 2026 Central daily epoch remain unchanged.
