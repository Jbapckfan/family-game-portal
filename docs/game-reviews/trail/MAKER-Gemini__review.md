### Review Summary: Harder Trail Sample (4×4 Preview)

**Verdict:** **No blockers.** The engine, validation rules, interaction flow, and preview isolation are robust and ready for evaluation.

---

### Critical & Important Issues
* **Critical Issues:** None.
* **Important Issues:** None. Edge cases (duplicate check submissions, corrupted `localStorage`, array length bounds up to 1,000, 64 KB storage caps, and clipboard write rejections) are cleanly handled with safe fallbacks.

---

### Clue, Word, and Route Analysis
* **Fairness of Clue/Answer:** Highly fair. The clue (*"The moment ends. Something stays."*) offers an evocative, bipartite hint pointing toward both compound stems (*AFTER* + *GLOW*) and the overall sensation of a lingering sunset or experience. The optional definition provides an exact, accessible safety net.
* **Plausible False Routes:** Structurally deceptive. The top row explicitly spells `A(0) -> F(1) -> T(2) -> E(3) -> R(7)`. Players following this perimeter route reach an immediate dead end at step 5 because `R(7)` has no adjacent `G`. Other tempting branches (e.g., `A(5) -> F(10) -> T(13) -> E(8) -> R(12) -> G(9) -> L(6)`) also lure the player away before finding the true sequence `[5, 10, 13, 8, 12, 9, 14, 15, 11]`.
* **Alternative 9-Letter Words:** None found. Available letters `[A, F, T, E, O, A, L, R, E, G, F, W, R, T, L, O]` contain only single instances of `G` and `W`. No other traceable 9-letter English words match the clue; `AFTERGLOW` is unique on this board.

---

### Interaction & Engine Validation
* **Save Validation:** `restorePreview` enforces strict invariants: sample ID matching, path validity under 4×4 Chebyshev adjacency, attempt deduplication, payload length caps, and consistency between `revealed`, `attempts`, and `path`. Stored separately under `deepseek-trail:4x4-preview:v1`, preventing collision with daily saves.
* **Tap / Backtrack / Keyboard / Focus:** 4×4 Chebyshev distance correctly prevents horizontal row wrapping (`Math.abs(rowA - rowB) <= 1 && Math.abs(colA - colB) <= 1`). Backtracking to an earlier step via tile tap or Backspace works reliably. Arrow-key grid navigation and Space/Enter selections preserve active tile focus across DOM re-renders.
* **Checks & Reveal Distinction:** Unchecked paths do not count as attempts. Repeating a previously checked trail is caught without incrementing attempts or polluting history. Revealing requires confirmation via `<dialog>`, is permanently flagged in state, and displays distinct copy from a solve.
* **Spoiler-Free Sharing:** `previewShare` outputs only puzzle ID, dimension, solve/reveal status, check count, and definition usage. The clue, answer, and letter paths remain concealed.

---

### Semantic & Difficulty Assessment (Prediction)
In the 3×3 game, every tile was used, making it an exhaustive Hamiltonian path problem solvable by letter elimination. The 4×4 grid with 7 decoys breaks this: players can no longer rely on tile exhaustion. Combined with a subtle clue and multiple false prefixes, cognitive load shifts from mechanical path tracing to spatial-lexical hypothesis testing. This represents a substantial, satisfying increase in difficulty over the daily.

---

### Useful Changes (At Most Two)
1. **Preserve History Toggle State Across Renders:** In [app.mjs](file:///private/tmp/MAKER-Gemini__trail-4x4-20261103/games/deepseek-trail/app.mjs#L112), `render()` re-creates `<details class="preview-history">`, which collapses an expanded history list whenever the user interacts with the board. Capturing `$('preview-history details')?.open` before rendering and re-applying it preserves player context.
2. **Focus Handoff on Button Disablement:** When Backspace or `Undo`/`Clear` empties the trail, `#preview-undo` and `#preview-clear` become disabled. Because the focused element is disabled, focus drops to `document.body`. Explicitly shifting focus to the grid or the last selected tile maintains smooth keyboard and screen-reader flow.
