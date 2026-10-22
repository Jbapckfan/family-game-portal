# Counterpart

A daily analogy game: five relationships, ten shared words, and one direction that matters.

## Mechanics

Each row shows two words connected by a specific relationship. Choose two words from the shared bank to reproduce that relationship **in the same direction**. Each of the ten bank words belongs to one row. A correct pair locks and reveals an original explanation; a wrong check leaves the board recoverable. Draft changes are free, and there is no check limit.

A hint exposes a row's relationship label and is counted once for that row. A perfect result means **five correct checks and no hints**. Revealing fills the remaining rows and ends the board as revealed rather than solved. Matching uses the curated answer table, not AI or approximate semantic scoring.

## Prepared collection

There are **180 distinct five-analogy combinations**, with **90 original curated analogies** across **900 row appearances**. The same relationships recur with different word banks; this is not 900 newly written analogies. Every added board differs in at least three of its five analogies from every earlier board. Repeated analogies are separated by at least six board positions, including the cycle boundary. The daily collection repeats after 180 days. Difficulty labels are editorial judgments rather than measured player ratings.

Content tests cover all 5,760 board/solved-row subsets and all 13,500 ordered pair checks. Those checks establish the encoded solution and guarantee that correct partial progress does not block completion. Editorial review is still necessary for semantic ambiguity; mechanical uniqueness alone cannot prove every possible interpretation of English.

The detailed schema, API, editorial notes, and related-mechanic research are in [contentnotes/ENGINE.md](contentnotes/ENGINE.md).

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

The app saves in `localStorage` under `counterpart:v1:`:

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

This portable project lives at `games/counterpart/`. Serve this directory at `/games/counterpart/` in the Alford Family Games portal. Keep the files together: module, stylesheet, font, and icon paths are relative. At that route, the shared shell makes the family link point two levels up and the companion-game link point to its sibling directory. The standalone shell uses configured hosted links.

There is no application server, database, API key, or runtime network scoring. Access restrictions belong to the serving host; this static app does not implement authentication. This README describes the source and integration path, not a claim that this copy has already been published.

Preserve published puzzle IDs and the daily epoch when extending the collection so existing saves remain meaningful. Changes to scoring or save schema should have an explicit migration or storage-version change.

## Expanded collection verification

Run `npm run verify:content` to reproduce the deterministic collection without writing files, or `npm run generate` to regenerate it. Run `npm test` for the game suite. For individual assertion output, use `node --test --test-isolation=none tests/*.test.mjs` with Node 24. The expansion tests verify an immutable SHA-256 of every published board in its original position, substantive uniqueness, and stable launch-date daily selection. Published IDs, save schemas, creator labels, and the October 20, 2026 Central daily epoch remain unchanged.
