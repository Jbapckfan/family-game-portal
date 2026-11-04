### Concrete Defects

1. **Incorrect Inference in Inspector (No Answer Leak):**
   - **No answer leak:** The inspector evaluates user marks against line totals without querying `p.solution`.
   - **False deduction:** When `line.black === line.target`, the guide asserts: *"The black total is reached. Mark the N undecided squares white."* This treats unverified user placements as ground truth, misleading players into committing false white marks when existing black marks violate crossing lines.

2. **Whole-Line & Diagonal Teaching:**
   - Diagonals are placed as detached cards beneath the board instead of anchoring to grid corners (where `.lattice-corner` sits unused). Players miss that diagonals are continuous 5-square transversals.
   - Selecting or focusing a cell does not highlight its intersecting row, column, or diagonal lines, obscuring the core mechanic that every square simultaneously belongs to multiple whole lines.

3. **Cell State & Legend Confusion:**
   - On black cells, text color equals background color (`#173b51`), making `●` invisible.
   - White squares (`○`) visually resemble unrevealed Minesweeper tiles rather than committed decisions.
   - The legend HTML completely omits Black, and uses plain `<span>`s that fail to render the swatch styles defined in `.lattice-legend i.*`.

4. **Paint Tool Ergonomics:**
   - Marking with Black or White is idempotent: clicking a black square with the Black tool is a no-op rather than clearing or toggling it.
   - Naming is inconsistent: the UI mixes "Clear" (tool button), "Undecided" (legend/aria), "unknown" (CSS class), and "U" (keyboard shortcut).

5. **Focus & Accessibility:**
   - Givens use native `disabled`. They are excluded from the Tab order and arrow navigation (`while` loop skips them), making them uninspectable for keyboard and screen-reader users.
   - `aria-label` on clue buttons omits line status, silencing `✓` (satisfied) and `!` (contradiction) from assistive tech.
   - Full-board `root.innerHTML` replacement on every commit destroys `#lattice-guidance[role="status"]` before screen readers can queue announcements, and drops focus when the game concludes.

---

### Concise Advice

- **De-escalate Guidance:** Make inspector text conditional: *"Target met by current marks. If correct, remaining squares must be white."*
- **Anchor Diagonals & Crosshairs:** Place diagonal buttons at grid corners (↘ at top-left, ↙ at top-right). When a cell is selected, softly highlight its intersecting row, column, and diagonal.
- **Clarify States & Restore Legend:** Give Black cells high-contrast glyphs, style White as an active positive fill, and add Black to the legend with valid swatch markup.
- **Refine Tools:** Allow re-clicking an active tool to unmark a cell back to undecided. Standardize on the term "Undecided".
- **Fix Accessibility:** Replace `disabled` on givens with `aria-disabled="true"`. Append clue status (`satisfied` / `contradiction`) to clue `aria-label`s. Keep the live region persistent in the container, updating only `textContent`.
