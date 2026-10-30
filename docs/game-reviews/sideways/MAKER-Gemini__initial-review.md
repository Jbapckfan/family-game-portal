### Sideways: Individual Game Review

**Inspection Disclosure**: Actual static source code (`app.mjs`, `engine.mjs`, `shell.mjs`, `styles.css`, `index.html`, test suites) and supplied artifacts (`before-1440.png`, `before-390.png`, `baseline-browser.json`, `orientation-audit.json`) were directly inspected. In accordance with read-only review rules, no code was executed or interactively played.

---

#### 1. Baseline Verification & Engine Rules
- **Solvability & Mathematical Uniqueness**: `orientation-audit.json` independently verifies that across all 210 authored boards and 215,040 raw orientations ($210 \times 1024$), each board contains exactly one valid 4-word vertical solution across 546 distinct words (max 2 appearances). A single clue never resolves all rows.
- **Rule Verification**: Cyclic shifts wrap without reversal; undo retains up to 64 orientations without counter refunds; checks evaluate the exact active arrangement; feedback expires upon shift and reuses cached evaluation upon returning to that orientation; nudges cost 1 move and 1 hint leaving the row movable.

---

#### 2. Visual & Screenshot Assessment (Desktop & Mobile)
- **Palette**: The interface is rendered in muddy terracotta/brown (`--accent: #b75c36`, `--wash: #f8e6d7`, `#d9bd9e`). This clashes with the collection preference for blue/teal tones.
- **Mobile Alignment Disconnect**: On desktop (`before-1440.png`), four clues align directly over four columns. On mobile (`before-390.png`, `styles.css:102`), clues collapse into a $2 \times 2$ grid (`repeat(2, minmax(0, 1fr))`). Clue C sits beneath Clue A, severing the vertical correspondence with Column C below.
- **Typography & Proportions**: Clue text is small (`11px`–`12px`) and current vertical readings (`.column-status`) are cramped. Arrow buttons are bulky (`44px`), and column follow outlines lack crisp distinction.

---

#### 3. Proven Bugs vs. Editorial Hypotheses
- **Proven Bug 1 (Column Deselection)**: In `app.mjs:51`, clicking a clue sets `followedColumn = column`. Clicking it again does not toggle it off (`followedColumn = followedColumn === column ? null : column`), locking the player into follow mode.
- **Proven Bug 2 (Dropped Focus on Check & Undo)**: In `app.mjs:28-29, 44`, checking a non-winning board disables `#shift-check`, dropping browser focus to `document.body`. When `#shift-undo` exhausts history, it disables without re-routing focus.
- **Proven Bug 3 (Sharing Violations in Engine)**: In `engine.mjs:220-233`, `formatShare` outputs per-column correctness squares (`🟩/⬜`) and permits URLs, violating the spoiler-free sharing specification.
- **Editorial Hypothesis (Nudge Warning)**: In `app.mjs:64`, `#shift-hint` immediately shifts a row without confirmation. Because nudging consumes 1 move and 1 hint—permanently disqualifying a "Perfect" score—a confirmation modal disclosing both costs is necessary.

---

#### 4. Concrete Recommended Changes
1. **Nudge Cost Confirmation**:
   - *Trigger*: User clicks `#shift-hint` (`✦ Nudge a row`).
   - *Function*: Intercept in `app.mjs:64` to call `openDialog()`. Disclose that a nudge costs 1 move and 1 hint and forfeits a Perfect game (1 check, 0 nudges). Execute `engine.useHint()` only upon confirmation.
2. **Blue/Teal Palette & 4-Column Mobile Alignment**:
   - *Trigger*: CSS styling in `styles.css`.
   - *Function*: Switch `--accent` to deep teal (`#1b4d5c` / `#2d7086`) and `--wash` to pale blue-slate (`#e2eff3`). On `<520px` viewports, keep clues in 4 vertical columns aligned directly above the board strips. Increase clue font size to `13px` and current column readings to `14px` bold.
3. **Toggle Column Follow & Distinct Feedback States**:
   - *Trigger*: Click on `[data-follow-column]` and `renderGame()` in `app.mjs`.
   - *Function*: Allow deselecting the active column. Label `.column-status` explicitly as "Current Reading" (neutral) versus "Verified Matches" (accent/checkmark), ensuring expired feedback cannot be mistaken for verified state.
4. **Accessible Focus Routing**:
   - *Trigger*: Execution of `check()` and `undoMove()` in `app.mjs`.
   - *Function*: When `#shift-check` disables post-check, programmatically shift focus to `#shift-undo` or the first movable row arrow. When history empties on undo, shift focus to `#shift-check`.

---

#### 5. Honest Spoiler-Free Sharing Proposal
- **Data Included**: Frozen Daily number/date (or "Practice"), aggregate counts (checks, shifts, nudges), and honest outcome (`Perfect` [1 check, 0 nudges], `Solved`, or `Revealed`).
- **Strict Omissions**: No letters, answer words, clues, row positions/rotations, partial per-column correctness (`🟩/⬜`), or URLs. No claims of par or optimal moves.
- **Delivery**: Plain text clipboard string and an auto-generated square/portrait PNG summary card via HTML5 canvas.
- **Fallbacks**: Native `window.webkit.messageHandlers.alford` bridge with fallbacks for manual text copy, canvas PNG download, and dialog cancel.

---

#### 6. Provisional Ratings & Human Playtesting
- **Predictions (1–5)**:
  - **Fun: 4/5** — Tangible tactile mechanics and satisfying spatial deduction.
  - **Clarity: 3/5** — Hindered by the mobile $2 \times 2$ clue split, inability to un-follow clues, and unannounced nudge penalties.
  - **UI: 3/5** — Muddy brown palette; small clue typography; focus drops to body on check/undo.
  - **Replay: 4/5** — 210 uniquely verified puzzles; clean Daily/Practice isolation.
  - **Sharing: 3/5** (Engine leaks partial correctness; rises to 5/5 with clean PNG card and spoiler-free text).
- **What Needs Human Playtesting**:
  - Perceptual difficulty across the 210 boards (anagram interference vs clue directness).
  - Mobile touch ergonomics: whether row wrapping arrows cause accidental repeated shifts.
  - Cognitive load of 4 simultaneous cyclic strips: whether column following clarifies or clutters.

