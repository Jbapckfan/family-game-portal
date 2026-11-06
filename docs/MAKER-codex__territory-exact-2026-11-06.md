# Territory Tactics: expanded exact-capture edition

James reported an old round that asked for three stones and accepted four, then requested a larger, more challenging board with exact goals. The existing light/pale-blue presentation and illustrated capture guide are retained. No timer was added.

The default app now uses a separate 240-board edition: radius three, 37 hexes, and at most three placements. Every exact win requires all three placements. Every board has a legally reachable smaller capture and overshoot trap. On 120 boards the target requires combining multiple groups; the other 120 require choosing the correct group. Goals range from three to six amber stones. Every enemy arrangement is distinct under all six rotations and both reflections, even ignoring friendly stones. Each board has at least eight initially empty hexes and six legal first choices; initial groups have liberties.

The engine uses equality for `captureRule: 'exact'`. Capturing too many stays unsolved, stops additional placements, and points to Undo. Hints undo dead ends and then follow an exact route. Reveal remains distinct from a win. The objective says “EXACTLY”; notes report the actual shortfall or overshoot. At narrow widths only the board scrolls horizontally, with an explicit swipe instruction and keyboard instructions. Tab/Enter/Space, Undo, Restart, and the before/after lesson remain available.

## Content and storage compatibility

- `puzzles.mjs` is unchanged, including all 200 legacy IDs/content and the original thirty-record hash. Legacy puzzles retain their original at-least rule when restored by the engine. No old four-for-three result is relabeled as an exact win.
- `exact-puzzles.mjs` contains `territory-exact-001` through `territory-exact-240`. The app imports this bank exclusively. Do not run the authoring generator over a released bank to replace established IDs.
- Game identity remains `qwen-territory-tactics` for collection, analytics, native messages, and feedback.
- The opt-in `stateEdition: 'exact-v2'` in shared `core.mjs` scopes saves, daily ledger, practice cursor, and status keys under `qwen-territory-tactics:v1:edition:exact-v2:`. Games without this option retain their previous behavior. Storage events still match the existing `qwen-territory-tactics:v1:` prefix.
- Every legacy key remains byte-for-byte untouched. A current legacy completion therefore opens a fresh expanded round instead of freezing the new board or transferring its win. Legacy in-progress data remains stored under its old key; the new app does not replay it on a changed board.
- Statistics combine the original and exact-edition daily ledgers by calendar date, preserving an earned legacy win and counting a date at most once. Current outcome uses only the current edition's ledger/state. Native progress payloads keep the original slug and use current outcome plus combined statistics.
- The edition gets its own daily scheduling identity, bypassing the legacy 19-cell reservations. Actual session creation was checked from November 6, 2026 through May 5, 2027: 181 different expanded daily boards. The full 240-board bank cycles before repeating. Fresh Practice excludes the rolling 186-date window from today through day +185, inclusive, leaving 54 boards available. The app opts into `practiceReservedDays: 186`; `core.mjs` feeds those actual scheduled daily indices to the existing Practice exclusion hook. UTC calendar ordinals avoid DST-hour shifts. Valid unfinished saved Practice still resumes without losing progress; Next selects from the protected pool. Existing static reservations and legacy calendars are unchanged.
- A collection/home reader that only reads original `v1:status` or `v1:records` needs an edition-aware reader if it should display the fresh edition outcome. Do not overwrite old keys just to satisfy that reader. Parent integration owns shared collection/public adapters.
- New module `exact-puzzles.mjs` must be included by static/native bundle allowlists. Existing `CONTENT_INFO` in legacy `puzzles.mjs` still accurately describes its preserved 200-board bank; the app reports 240 active puzzles. Parent integration owns packaging/catalog copies.

Shared-core base before this task: Git blob `3d272c3`; SHA-256 `03b2d6c1eaa944c731d7ebd338b4c9f19cc646faece20433aeb26e62d244ad3f`. The diff is limited to optional edition keys/scheduling, combined statistics, and opt-in rolling Practice exclusions in `createSession`.

## Reproducibility and verification

Authoring: `node scripts/MAKER-codex__build-territory-exact.mjs`. Deterministic seed `0x06112026`; 5,373 candidates yielded the 240 accepted boards. The retained content-proof file lists representative exact, smaller, and overshoot paths. The generated content is static; generation never runs in the player.

- Exact engine/migration and existing legacy/runtime focused checks: 36 passed.
- Separate exhaustive flood-fill oracle checks the complete legal search tree on every new board and agrees with every engine winning path. New content suite: four passed, covering geometry uniqueness, all exact wins, undershoots, overshoots, hints/reveal/restore, and six-month daily selection.
- Broader modular-engine/shared-runtime/calendar/collection regression: 288 passed. `games/deepseek-runtime/elite-ui.test.mjs` could not start because its `jsdom` dependency was unavailable. No assertion failure was observed in that run; see the captured log. This is not a claim that the entire wider suite passed.
- Real isolated Chrome and WebKit at 320, 393, and 1280 CSS pixels: six scenarios passed. They cover actual tap/click/keyboard moves, under/over states, Undo/Restart, hint recovery, partial and terminal reload, daily/practice, and byte-preserved legacy saves/results. No page errors or horizontal document overflow. Minimum measured cell target was 46.234375 by 53.671875 CSS pixels. Initial phone and desktop screenshots were inspected.
- Rolling Practice follow-up: 77 tests passed across exact-edition/migration, the new reservation suite, core, and existing calendars. This covers all 54 available boards, day +185 protected/day +186 available, Central midnight, both DST transitions, legacy behavior, and saved-practice retention. Real Chrome/WebKit flows also check the actual app's protected Practice choices.
- No local server, personal browser profile, actual player round, native simulator, deployment, push, or commit was used by this task. Parent handles publication and native copies. These are source-assisted checks, not blind human difficulty testing or physical-device certification.

Local evidence: `output/MAKER-codex__territory-exact-20261106/` (ignored), including red/green test outputs, content proof, browser results, and six screenshots. Browser reproduction:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/alford-word-controls-browsers node scripts/MAKER-codex__territory-exact.playwright.mjs
```

All changes are left uncommitted for parent integration. Unrelated pre-existing shared/native/daily edits were not modified.
