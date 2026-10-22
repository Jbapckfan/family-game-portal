# Switchpath

**Higher. Lower. Find your flow.** A daily path puzzle from Alford Family Games, designed for a short, thoughtful play session on a phone or computer.

The player connects sixteen numbered cells in a 4 × 4 grid. Start at S and move to an orthogonal neighbor with a higher value. The next move must be lower, then higher, alternating until every cell has been visited exactly once and the route ends at E. Values do not need to be consecutive. Each prepared board has exactly one complete solution.

## Play and scoring

- Tap or click a cell to extend the route. The next higher/lower comparison stays visible above the board.
- Tap an earlier visited cell to rewind to that step. Undo removes one step. Reset path returns to S while preserving the move and hint totals.
- Each accepted extension or rewind costs one move. An invalid tap costs nothing and explains the relevant rule.
- E is available only as the sixteenth and final cell. Completing a valid full route wins automatically.
- A hint adds one correct step. If needed, it first rewinds the earliest wrong branch, then explains the correction. It counts as one move and one hint.
- A perfect route takes fifteen moves and no hints. Rewinds never refund moves.
- Revealing displays the complete numbered route and records the round as revealed, with no win or streak credit.

There is no timer or life limit. Every reachable unfinished route can recover by rewinding, even when no next extension is available.

## Interface

The cream and indigo interface includes a connecting route, numbered path steps, the current position, start/end labels, progress, an up/down rhythm indicator, and a brief finish animation. Motion honors `prefers-reduced-motion`.

All gameplay controls are native buttons. Arrow keys move focus around the grid; Enter or Space selects a focused cell; Backspace undoes a step. Home and End move focus to S and E. Screen-reader labels include coordinates, path order, current position, and the full route after completion or reveal.

The shared daily shell supplies rules, daily/practice selection, separate practice saves, result sharing, statistics, optional sound, and one-button practice replay. It preserves the first completed daily across sequential tab actions and retains in-memory progress if browser storage becomes unavailable. The optional iOS bridge reports progress, share requests, and haptic events when the native host supplies it; browser play needs no bridge.

Daily puzzles change at midnight in `America/Chicago`. Progress and records use local browser storage under `switchpath:v1:`. There are no runtime API calls, accounts, analytics, or external assets. Clearing browser data removes progress, and scores do not sync across devices.

## Puzzle collection

The current edition has **187 prepared puzzles** and repeats after 187 days. The deterministic generator enumerates all 552 directed Hamiltonian routes on the 4 × 4 grid, assigns alternating ranked values, and retains only boards with a unique complete solution and at least four locally branching choices.

The collection contains 60 route shapes after accounting for rotations and reflections. All 187 numbered layouts remain distinct under those symmetries, and starting cells cover all sixteen grid positions. Difficulty labels reflect branching counts; they are not based on measured human solving times.

Independent exhaustive verification checks all **52,258 legal partial or complete paths** in the collection. Every partial state is restored through the actual engine, rewound, and solved. Hints are separately checked from all **52,071 unfinished paths**.

## Run locally

Serve `./` with a static HTTP server. For example, from this directory:

```bash
python3 -m http.server 8080 --directory .
```

Then open `http://localhost:8080`. No package installation or build step is required. The same directory works at a site root or under `/games/switchpath/` in the Alford portal.

## Verify

```bash
npm test
npm run check
npm run verify:content
```

For individual test output in environments that summarize isolated test files:

```bash
node --test --test-isolation=none tests/*.test.mjs
```

The tests cover the engine, exhaustive content validation, immutable published puzzle content, distinct comparison challenges, and application adapters. The adapter tests execute the real application, shared shell, and engine with stand-ins for DOM, timers, and browser storage. They cover refresh persistence, unscored invalid actions, hints and rewind counters, a perfect daily followed by practice, reveal rendering, and keyboard focus/undo behavior. They do not replace visual browser testing.

## Files

| Path | Purpose |
| --- | --- |
| `index.html`, `styles.css`, `app.mjs` | Accessible static interface and game adapter |
| `engine.mjs` | Pure game rules, restoration, date selection, statistics, and sharing |
| `puzzles.mjs` | Prepared puzzle collection and collection metadata |
| `shell.mjs` | Shared daily/practice shell, copied unchanged from Counterpart |
| `icon.svg`, `manifest.webmanifest` | Local game icon and standalone web manifest |
| `fonts/` | Bundled DM Sans and DM Serif Display with license files |
| `scripts/generate-puzzles.mjs` | Reproducible offline construction and certification |
| `tests/` | Rules, exhaustive content, and adapter regression coverage |
| `docs/engine-contract.md` | State schema and complete engine API |

This is an authored puzzle variant, without a claim that the title or broad genre has never appeared elsewhere.

The bank contains **180 distinct comparison challenges** after considering only rule-relevant neighboring inequalities and allowing rotations/reflections. Seven equivalent challenges in the original 90 boards remain in place to preserve existing saved games. Every appended board has a new comparison challenge; renumberings of an existing challenge are rejected.

## Expanded collection verification

Run `npm run verify:content` to reproduce the deterministic collection without writing files, or `npm run generate` to regenerate it. Run `npm test` for the game suite. For individual assertion output, use `node --test --test-isolation=none tests/*.test.mjs` with Node 24. The expansion tests verify an immutable SHA-256 of every published board in its original position, substantive uniqueness, and stable launch-date daily selection. Published IDs, save schemas, creator labels, and the October 20, 2026 Central daily epoch remain unchanged.
