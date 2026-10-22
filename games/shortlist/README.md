# Shortlist

A compact deduction game: twelve visible words, three two-letter scans, and one final pick.

## Mechanics

One of twelve visible five-letter words is the secret. A scan asks about **two different letters** and returns how many appear anywhere in that word: zero, one, or two. Repeated occurrences count once. A result of one does not identify which letter appears or where it belongs.

The player can use at most three scans, make reversible pencil marks, and confirm one final word. A correct pick wins; a wrong pick loses. Using the third scan does not automatically end the round. One optional hint suggests an informative scan using only visible candidates and earlier scan evidence. It marks the result as assisted without spending a scan. Revealing ends the board separately from a loss.

The exact hint and its original scan context are saved with the round, so the suggestion survives refresh. Older assisted saves recover useful advice from their visible evidence without consuming another hint. After a round finishes, scan history remains visible while the active scanning and crossing-off controls are hidden.

## Prepared collection and solvability

There are **180 boards**, **180 distinct designated answers**, and **1,051 distinct displayed words** across 2,160 candidate slots. A displayed word appears no more than three times. The daily collection repeats after 180 days.

Every starting board has an exact decision tree that identifies **any of its twelve candidate words within three scans**. Tests follow all 2,160 certified answer paths through actual engine actions. The guarantee applies to an informative strategy; arbitrary or uninformative scans can leave several candidates and force a final guess. Pencil marks do not influence the engine's hint evidence.

The vocabulary and deterministic construction live in `scripts/generate-puzzles.mjs`. Check that the committed collection reproduces exactly with:

```bash
node scripts/generate-puzzles.mjs --check
```

Difficulty labels use the expected depth of a certified decision tree and have not been calibrated with players. The detailed API and certification notes are in [docs/engine-contract.md](docs/engine-contract.md).

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

The app saves in `localStorage` under `shortlist:v1:`:

- `daily:YYYY-MM-DD` stores a daily board state.
- `practice:<puzzleId>` stores progress for each practice board.
- `records` stores completed daily results for statistics and streaks.
- `settings` stores the optional sound preference.

Only solved daily puzzles extend the winning streak. Losses and reveals count as completed boards without counting as wins. Practice results stay separate, can be restarted, and do not change the daily record. Today's unfinished puzzle is reserved from the practice picker. Clearing browser data removes local progress; there is no account or cross-device synchronization.

The shared shell repairs a missing or malformed result record from a valid terminal save. It preserves the first finished daily when a stale tab later acts, and listens for progress updates from other tabs. If storage fails, the current tab retains progress in memory and shows a save warning. `localStorage` is not transactional for literally simultaneous writes from multiple tabs.

## Files and portal integration

- `engine.mjs` contains pure game rules, restoration, dates, statistics, and spoiler-free sharing.
- `puzzles.mjs` contains the prepared collection and its metadata.
- `app.mjs` connects the game-specific UI to the engine.
- `shell.mjs` supplies daily/practice navigation, storage, dialogs, statistics, and sharing.
- `index.html`, `styles.css`, `fonts/`, the icon, and the web manifest are self-contained presentation assets.
- `tests/` exercises actual production modules.

This portable project lives at `games/shortlist/`. Serve this directory at `/games/shortlist/` in the Alford Family Games portal. Keep the files together: module, stylesheet, font, and icon paths are relative. At that route, the shared shell makes the family link point two levels up and the companion-game link point to its sibling directory. The standalone shell uses configured hosted links.

There is no application server, database, API key, or runtime network scoring. Access restrictions belong to the serving host; this static app does not implement authentication. This README describes the source and integration path, not a claim that this copy has already been published.

Preserve published puzzle IDs and the daily epoch when extending the collection so existing saves remain meaningful. Changes to scoring or save schema should have an explicit migration or storage-version change.

## Expanded collection verification

Run `npm run verify:content` to reproduce the deterministic collection without writing files, or `npm run generate` to regenerate it. Run `npm test` for the game suite. For individual assertion output, use `node --test --test-isolation=none tests/*.test.mjs` with Node 24. The expansion tests verify an immutable SHA-256 of every published board in its original position, substantive uniqueness, and stable launch-date daily selection. Published IDs, save schemas, creator labels, and the October 20, 2026 Central daily epoch remain unchanged.
