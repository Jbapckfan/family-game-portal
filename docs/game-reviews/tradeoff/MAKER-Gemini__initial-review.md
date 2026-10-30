### Scope & Disclosures
- **Model:** Gemini 3.8 Flash.
- **Scope:** Scoped static code and asset inspection within `/private/tmp/MAKER-Gemini__tradeoff-review-20261030` only. No code execution, file writes, directory modifications, web queries, or subagent delegations performed.
- **Files Inspected:** [app.mjs](file:///private/tmp/MAKER-Gemini__tradeoff-review-20261030/games/tradeoff/app.mjs), [engine.mjs](file:///private/tmp/MAKER-Gemini__tradeoff-review-20261030/games/tradeoff/engine.mjs), [content-identity.mjs](file:///private/tmp/MAKER-Gemini__tradeoff-review-20261030/games/tradeoff/content-identity.mjs), [index.html](file:///private/tmp/MAKER-Gemini__tradeoff-review-20261030/games/tradeoff/index.html), [styles.css](file:///private/tmp/MAKER-Gemini__tradeoff-review-20261030/games/tradeoff/styles.css), tests (`engine.test.mjs`, `puzzles.test.mjs`, `expansion.test.mjs`, `content-identity.test.mjs`), [cycle-audit.json](file:///private/tmp/MAKER-Gemini__tradeoff-review-20261030/output/tradeoff-review-20261030/cycle-audit.json), and [baseline-browser.json](file:///private/tmp/MAKER-Gemini__tradeoff-review-20261030/output/tradeoff-review-20261030/baseline-browser.json).
- **Screenshots Rendered & Inspected:** [before-1440.png](file:///private/tmp/MAKER-Gemini__tradeoff-review-20261030/output/tradeoff-review-20261030/before-1440.png) (desktop layout) and [before-390.png](file:///private/tmp/MAKER-Gemini__tradeoff-review-20261030/output/tradeoff-review-20261030/before-390.png) (mobile layout).
- **Caveats:** `puzzles.mjs` is absent from this workspace; bank solvability and distribution were verified via `cycle-audit.json` (210 boards, 210 distinct answer sets, 252 unique answer words, 498 clue pairs, 210 verified 5-swap cycles). Static inspection is not live play; baseline passing suites and exploratory test runs are noted from repository evidence without execution.

---

### Core Mechanics & Depth Assessment
Tradeoff avoids the structural flaws that damaged *Sideways* (forced last-column locks, two-clue redundancy) and *Ringcount* (trivial constraint satisfaction). The board presents six five-letter words forming a single directed 6-cycle ($L_1 \to L_2 \to \dots \to L_6 \to L_1$). Because every board starts exactly one mismatch away per row, 5 swaps is the exact theoretical and executable optimum.

However, starting just one letter away from the target answer substantially eases the crossword layer: players can frequently deduce the intended target word in isolation from the clue alone (e.g., `CRANE` + *"A box with a shipping label"* $\to$ `CRATE`). Once all six targets are mentally identified, finding the donor cycle becomes direct bookkeeping rather than combinatorial discovery. To ensure lasting depth, clue phrasing must avoid near-synonyms that make the missing letter trivial to guess.

---

### Static Defects & `saveGame()` Analysis

1. **`saveGame()` Adoption Race & Feedback Decoupling:**
   When `saveGame()` detects a newer external save (`raw !== acceptedSaves.get(key)` or terminal daily in another tab), it restores `game`, clears `selected`/`hinted`, and returns `undefined`. But calling callers (`handleTile`, `takeHint`, `takeUndo`) ignore adoption and proceed unconditionally:
   - In `handleTile`: If adoption occurs during a move, the stale `outcome.newlySolved` and `swapped` coordinates are passed to `render()`, producing false `just-solved` row flashes, misleading screen-reader announcements (`announce()`), solve audio/haptics (`playTone`), and even triggering confetti celebration (`celebrate()`) and `resultTimer` for a solve that was overwritten.
   - In `takeHint`: `takeHint()` sets `hinted` before `saveGame()`; when adoption clears `hinted`, `takeHint` continues and invokes screen-reader `announce()` with stale tile coordinates from the discarded board.

2. **First-Terminal Reconciliation Flaw in `recordDailyResult()`:**
   Line 59 checks `if (!old || old.status !== 'won')`. If a player reveals the board (`status: 'revealed'`), `old.status !== 'won'` evaluates to true. If another tab or background retry subsequently reaches `won`, it overwrites the revealed daily record with a win. Terminal outcomes (`won` or `revealed`) must be immutable once finalized.

3. **Unconfirmed & Non-Idempotent Hint Spending:**
   `takeHint()` immediately increments `game.hints` without confirmation. Furthermore, clicking *"A little nudge"* while a hint is already active (`hinted.length > 0`) charges additional scored hints without offering new information.

4. **Visual & Readability Constraints:**
   - **Color Palette:** [styles.css](file:///private/tmp/MAKER-Gemini__tradeoff-review-20261030/games/tradeoff/styles.css#L103) currently applies a mauve/burgundy theme (`--accent: #a44957`, `--wash: #f7e4e7`) rather than the preferred calming blue/teal palette.
   - **Mobile Typography:** At 390px, clues shrink to `10px`–`11px` across narrow widths, making them hard to parse next to the 44px letter tiles.

---

### Concrete Recommendations

1. **Gate Adoption in `saveGame()`:**
   Have `saveGame()` return a boolean indicating whether external state was adopted. If `true`, abort `handleTile`, `takeHint`, and `takeUndo` immediately before firing animations, sound/haptics, speech announcements, or result modals.
2. **Enforce Terminal Record Immutability:**
   Update `recordDailyResult()` to lock existing terminal records:
   `if (old && (old.status === 'won' || old.status === 'revealed')) return;`
3. **Idempotent Hinting & Confirmation:**
   Make `takeHint()` a no-op (or toast notice) if `hinted.length > 0` to prevent duplicate billing. Add a lightweight confirmation prompt before deducting the first scored nudge.
4. **Shift Palette to Blue/Teal & Enlarge Mobile Clues:**
   Update `body.tradeoff` theme tokens to crisp teal/slate (e.g., `--accent: #1e6b7b`, `--wash: #e6f3f5`, `--accent-dark: #144954`). On mobile viewports, increase clue font size to 13px with adjusted line-height.
5. **Spoiler-Free Canvas Image Share:**
   Implement offscreen `<canvas>` rendering exporting a clean PNG containing exclusively: puzzle number/date (or Practice), aggregate swaps/nudges/undos, honest status badge (`Perfect`, `Solved`, or `Revealed`), and par. Strictly omit letters, clues, grids, and URLs. Support native text bridge first, with PNG download/clipboard fallback.

---

### Provisional Ratings (1–5 Model Estimate, Separate from James)
- **Fun:** **3.5 / 5** — Satisfying click when the six-cycle unspools; tempered by one-letter proximity simplifying clue deductions.
- **Clarity:** **4.5 / 5** — Elegant core premise: tap two letters, matching clues auto-lock.
- **UI:** **3.5 / 5** — Solid grid and responsive controls; reduced by mauve palette and cramped mobile clue text.
- **Replay:** **4.0 / 5** — 210 audited boards with stable daily rotation and practice replayability.
- **Sharing:** **4.0 / 5** — Honest par evaluation (5 swaps, 0 hints, 0 undos) makes results compelling without spoiling answers.

