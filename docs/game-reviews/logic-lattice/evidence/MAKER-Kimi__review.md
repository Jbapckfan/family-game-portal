Static source review only.

The teaching is substantially clearer: instructions explicitly reject Minesweeper-style adjacency, demonstrate a five-square line, explain both diagonals and their shared center, and distinguish white from undecided. All 12 clues highlight the correct five cells. Paint-tool mappings, keyboard shortcuts, and the inspector’s forced-white inference are correct.

**Concrete defects and fixes**

- **Focused cells can lose their visible focus indicator.** In `styles.css`, `.lattice-cell.in-line` follows `.lattice-cell:focus-visible` with equal specificity, replacing its outline. A focused highlighted cell therefore looks like every other highlighted cell. Add a later, distinct `:focus-visible` rule with an outer outline; use background or box-shadow for line highlighting.
- **Focus is not restored after every render.** `renderBoard()` replaces `root.innerHTML`. Clue, tool, and ordinary cell handlers restore focus, but Undo/Restart do not. On a winning move, the attempted cell focus targets a now-disabled button. Explicitly move focus to the relevant action or completion status, and otherwise preserve the originating control.
- **The black symbol is invisible.** `.lattice-cell.black` sets `color` equal to its background color, hiding `●`; the legend also omits black. Use a contrasting symbol or explicitly document a solid-black square, and add it to the legend. Retain non-color distinctions among black, white, and undecided.
- **Fixed and completed cells are difficult to inspect by keyboard.** Disabled buttons leave the tab order, and arrow navigation skips givens. Consider focusable read-only cells using `aria-disabled="true"` with activation guards—the engine already prevents edits—preferably with roving tabindex.
- **Status announcements are fragile.** The entire `role="status"` guidance node is recreated, which is less reliable than updating a persistent live region. Also, ✓/! are `aria-hidden`, while `clueLabel()` never states “complete” or “contradiction.” Include those states in accessible descriptions and announce only the changed guidance.
- **The axis caption remains cryptic.** Replace `↓ Column totals · row totals →` with “Column totals above · row totals at left.”
- **Small-screen target width is not guaranteed.** Cells have `min-height:44px` but no minimum width. Adjust narrow-layout columns/gaps so touch targets remain approximately 44×44 CSS pixels.

No inspector answer leak was found: guidance derives only from targets and current marks; `p.solution` is used by explicit Hint/Reveal operations. These UI fixes require no engine or puzzle-bank changes.
