# Sideways review

**Verdict: promising, but not yet a confident keeper.** The cyclic-row mechanic is distinctive and the implementation closely follows the rules. The main weaknesses are presentation and feedback clarity rather than proven game-logic defects.

I inspected all supplied source and test files, the complete orientation audit, and the actual 390px and 1440px screenshots. I did **not** execute tests or play the game. The reported 57 passing tests and error-free browser baseline are supplied evidence, not independently verified here.

## What is proven

The engine correctly implements wrapping without reversal, exact-arrangement feedback expiry/reuse, movable checked columns, explicit-check wins, 64-orientation undo without refunds, and nudges costing one move plus one hint (`games/sideways/engine.mjs:66`, `games/sideways/engine.mjs:87`, `games/sideways/engine.mjs:96`, `games/sideways/engine.mjs:136`). Save restoration and cross-tab adoption are unusually thorough in source and tests; I found no proven rules, persistence, or terminal-state bug.

The audit establishes 210 distinct answer sets, 546 answer words, and exactly one encoded solution across each board’s 1,024 orientations. That does **not** establish semantic uniqueness, calibrated difficulty, or fun. The clues are generally direct and readable, although broad clues such as ATLAS’s “Book that helps you find your place” and COVER’s “Put something over the top” still need human semantic review.

Two UX gaps are source-visible:

- **Nudge fires immediately**, without confirmation or disclosure of its costs (`games/sideways/app.mjs:46`).
- **“Check board ↵” implies an Enter shortcut**, but only focused native buttons respond to Enter; the sole custom keyboard handler covers arrows (`games/sideways/app.mjs:53`).

## Five high-value changes

1. **Prioritize clue and current-word readability.** In the final Sideways overrides (`games/sideways/styles.css:99`), replace the brown/rust rails and accents with blue/teal. Increase `.column-clue p` and especially phone `.column-word strong`—currently 10px—to comfortable reading sizes. Tighten rail padding, shadows, and gaps instead of shrinking the words further. The screenshots confirm that decorative letters dominate while the actual deduction targets are tiny.

2. **Label current versus checked information explicitly.** Use `checked` in `renderGame()` (`games/sideways/app.mjs:20`) to switch between “Current words — not checked” and “Last check — N/4 matched.” Keep following highlights neutral and current-only; checked coloring should appear only while `feedbackCurrent()` is true. Do not add candidate highlighting or solved-column locking.

3. **Confirm every nudge.** Route `#shift-hint` through a dialog before calling `engine.useHint()`: “This costs **1 move and 1 nudge**. Undo will not refund either. The row remains movable, and you must still check the board.” Preserve the existing accounting exactly.

4. **Repair focus and keyboard expectations.** After an unsuccessful check disables `#shift-check`, focus Undo or a row arrow. After cross-tab adoption redraws the board (`games/sideways/shell.mjs:360`), restore focus to a surviving useful control. Either implement guarded global Enter handling or remove the ↵ affordance.

5. **Implement the proposed honest image share.** Extend `formatShare()`/`share()` (`games/sideways/engine.mjs:220`, `games/sideways/shell.mjs:326`) with the loaded daily’s frozen number **and date**, or Practice, plus aggregate checks/moves/nudges and Perfect/Solved/Revealed. Generate a portrait/square PNG containing no letters, clues, orientations, history, partial correctness, or URL. Preserve the native text bridge and provide cancel, manual-copy, and download fallbacks without claiming unsupported native image sharing.

## Provisional predictions

- **Fun: 3/5** — appealing interdependence, but possibly repetitive trial-and-error.
- **Clarity: 3/5** — good lesson and column following; feedback and nudge costs need work.
- **UI: 3/5** — polished and responsive, but brown-heavy with undersized deduction text.
- **Replay: 4/5** — substantial bank and vocabulary variety; long-term novelty remains uncertain.
- **Sharing: 3/5** — honest terminal text today, but missing date and the proposed image.

Human playtesting must establish actual difficulty, satisfaction, semantic ambiguity, phone readability, keyboard/screen-reader focus behavior, and real-browser storage/cross-tab reliability. Test the rendered share image separately for spoilers and working cancellation/fallbacks.
