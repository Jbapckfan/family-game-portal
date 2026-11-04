# Tradeoff

A daily word game of give and take. Six real words each hold one letter that belongs elsewhere. Trade any two unlocked letters until the six clues are satisfied. Every supplied board can be solved in five swaps.

## Play

- Tap a letter, then a second letter to trade them. Same-word swaps are allowed.
- Correct words lock. Temporary nonsense strings are allowed.
- Undo restores the previous board. Swaps already made remain in the score.
- A nudge highlights a useful pair. Hints and undos are included in results.
- Five swaps, no nudges, and no undo earns a perfect trade.
- Revealing a board ends it as revealed, not won.

The daily date uses America/Chicago and begins at number 1 on October 20, 2026. The first edition contains 210 static boards; the schedule repeats after the collection is exhausted. Practice uses the same collection and has its own saved progress. Today's daily remains reserved from practice until it is completed.

## Development

This is buildless HTML/CSS/JavaScript, packaged directly in `games/tradeoff/` for the Alford Family Game Portal. Open `/games/tradeoff/` on the portal. The HTML, module imports, local fonts, icon, and web manifest all use paths relative to this folder, so the same files can also be served as a standalone static site.

From this directory, with Node.js installed:

```sh
npm test
npm run check
```

No dependency installation or build step is required. `engine.mjs` contains the pure game, date, statistics, persistence validation, and share-text logic. `app.mjs` handles the DOM, browser storage, focus, optional sound, and sharing. `puzzles.mjs` contains the static collection. The footer links back to the portal and to the companion game, Inbetween.

To regenerate the collection from the authored vocabulary and clue bank:

```sh
npm run generate
npm test
```

Content checks prove letter conservation, exactly one initial mismatch per row, one six-letter cycle, and an executable five-swap solution for all 210 boards. Difficulty estimates are editorial, not calibrated against player data. Human clue review and playtesting remain useful before a broad public launch.

## Persistence and access

Progress and records use localStorage under `tradeoff:v1:`. There is no account, server database, or cross-device synchronization. A first completed daily result is retained across competing tabs. Browser storage failures do not prevent play, but progress cannot persist in that case.

Fonts are served locally, with their SIL Open Font License files in `fonts/`. Game logic, vocabulary, and typography need no third-party runtime requests. Sound uses the browser Web Audio API and starts muted.

The game is backed up inside the private `family-game-portal` GitHub repository. Publishing a commit does not automatically update the NAS. Follow the portal README's `git pull --ff-only` procedure from the home network to update its mounted files. This package does not include the standalone Alford Daily site's hosting identity or credentials.

`docs/verification.md` records checks performed on the original standalone game. Design and planning notes under `docs/superpowers/` retain their original context and `dist/` paths. This portal copy flattens the runtime files into this directory; its tests and generator use the flattened layout.

## Product positioning

This is a first playable candidate for a daily habit. Letter-swapping and circular word-repair mechanics have established neighbors, including Waffle and Borrowed Letters. Tradeoff emphasizes intact starting words, semantic clues, unrestricted trades, and a short optimization target. It does not claim an unprecedented mechanic or proven audience retention.

## Expanded collection verification

Run `npm run verify:content` to reproduce the deterministic collection without writing files, or `npm run generate` to regenerate it. Run `npm test` for the game suite. For individual assertion output, use `node --test --test-isolation=none tests/*.test.mjs` with Node 24. The expansion tests verify an immutable SHA-256 of every published board in its original position, substantive uniqueness, and stable launch-date daily selection. Published IDs, save schemas, creator labels, and the October 20, 2026 Central daily epoch remain unchanged.
