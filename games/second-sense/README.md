# Second Sense

A double-meaning word game: match a noun clue with a verb clue, then retrieve their shared word.

## Mechanics

Five noun definitions and five verb definitions are independently shuffled. Select one from each side and **type the single word that fits both**. There is no word bank. The spelling must match; pronunciation may change, as it does between the two senses of WIND.

A correct word and pairing locks both clues and reveals an original explanation. Wrong checks leave all unsolved clues available. Editing the word or selecting different clues is free, and checks are unlimited. A once-per-noun hint supplies the first letter and word length without identifying its matching verb. **Five checks with no hints is perfect.** Revealing ends the board as revealed, not won.

Answers use established English senses and an explicit acceptance table. Input is case-insensitive, trims surrounding spaces, and accepts single ASCII-letter words. The engine supports curated alternate answers when definitions allow them; this first collection uses tightened clues and one canonical answer per pair. There is no fuzzy AI scoring or online dictionary dependency.

## Prepared collection

There are **180 distinct five-word combinations** drawn from **75 original noun/verb pairs**, for **900 pair appearances**. Familiar meanings return beside different clues; this is not 900 newly authored meanings. Every pair appears exactly twelve times, 11–19 board positions apart including the collection boundary. Every added board differs in at least three of its five words from every earlier board. The daily collection repeats after 180 days. Clues identify U.S. usage when needed, and explanations note relevant pronunciation changes.

Tests cover all 5,760 board/solved-pair subsets and 337,500 combinations of noun card, verb card, and collection word. They verify the accepted table, recoverability, hints, restoration, and alias handling. Human editorial review remains necessary for the quality and ambiguity of definitions. Difficulty labels are editorial rather than measured player ratings.

The detailed schema, engine API, lexical review, and content decisions are in [contentnotes/ENGINE.md](contentnotes/ENGINE.md).

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

The app saves in `localStorage` under `second-sense:v1:`:

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

This portable project lives at `games/second-sense/`. Serve this directory at `/games/second-sense/` in the Alford Family Games portal. Keep the files together: module, stylesheet, font, and icon paths are relative. At that route, the shared shell makes the family link point two levels up and the companion-game link point to its sibling directory. The standalone shell uses configured hosted links.

There is no application server, database, API key, or runtime network scoring. Access restrictions belong to the serving host; this static app does not implement authentication. This README describes the source and integration path, not a claim that this copy has already been published.

Preserve published puzzle IDs and the daily epoch when extending the collection so existing saves remain meaningful. Changes to scoring or save schema should have an explicit migration or storage-version change.

## Expanded collection verification

Run `npm run verify:content` to reproduce the deterministic collection without writing files, or `npm run generate` to regenerate it. Run `npm test` for the game suite. For individual assertion output, use `node --test --test-isolation=none tests/*.test.mjs` with Node 24. The expansion tests verify an immutable SHA-256 of every published board in its original position, substantive uniqueness, and stable launch-date daily selection. Published IDs, save schemas, creator labels, and the October 20, 2026 Central daily epoch remain unchanged.
