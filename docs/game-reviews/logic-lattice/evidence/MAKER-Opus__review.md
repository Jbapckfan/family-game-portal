# Logic Lattice static review

**Verdict:** the copy now teaches whole-line counting, and the inspector doesn't leak answers because it uses only the clue target and player marks. The defects below still undermine it. I didn't have `common.mjs` or `puzzles.mjs`, so runtime focus and announcement behaviour is unconfirmed.

## Fix first
1. **Incorrect inference:** when `black + unknown === target`, guidance says "Find 2 more black among the 2 undecided. The rest must be white", but there is no rest. Add a branch before the generic message: "All N undecided squares must be black."
2. **Focus is hidden:** `.lattice-cell.in-line` comes after `.lattice-cell:focus-visible` with equal specificity, so it overrides the focus outline. Focus is therefore invisible within the highlighted line, which is Row 1 by default. Move the focus rule last.
3. **Help snaps shut:** each render replaces `root.innerHTML`, so selecting a clue or tool closes "How the clues work". Marking a square likely does too. Store the `<details>` open state.
4. **Mobile guide is out of view:** at 700px and below, the guide sits below the board, legend and diagonals, and `preventScroll` keeps it there. Put a one-line line summary directly above the board.
5. **Restart can't be undone:** it clears history without confirmation, yet the help says "All moves can be undone." Add a confirmation and correct the copy.

## Minesweeper confusion and teaching
- **Undecided squares:** grey `?` tiles resemble unrevealed Minesweeper cells. Use a blank dashed square, and standardize on "undecided" instead of mixing it with "unknown" and "clear".
- **Clue numbers:** bare numbers share the grid and look like cells, with no button affordance until selected. Give them a distinct gutter style and show progress, such as `1/2 black`.
- **Heading:** "Every square has a place" teaches nothing. Use "Each number counts black squares in its whole line."
- **Diagonals:** the legend separates these clues from the board. Move them to the corners or directly under it, and draw a continuous band for the selected line.

## Black, white and undecided
- **Legend:** it omits Black and doesn't explain ✓ or `!`, which are only 10px on the clues.
- **Selected clue state:** `.active-clue` uses `!important`, which hides the red and green status colours on the selected clue.
- **Givens:** these differ from player marks mainly by a 9px ◆. Use a heavier border or a tinted corner.
- **Contrast and size:** `?` is only about 3:1, and the tally labels are 10px. Raise both.
- **Paint tools:** painting the same value is silently ignored, so add brief feedback.

## Keyboard and screen readers
- **Status:** `clueLabel` omits satisfied and contradiction states, and those marks are `aria-hidden`.
- **Guidance:** `role="status"` is recreated on each render, so announcements are unreliable. Keep one persistent live region outside the replaced markup.
- **Example:** `aria-label` on a plain `span` is unreliable. Add `role="img"`.
- **Givens:** `disabled` removes them from keyboard focus, as it does all squares after finishing. Use `aria-disabled` and block edits in the handler.
- **Lost focus:** Undo and Restart don't restore focus. A winning move also disables the square that the code tries to refocus.
- **Arrow keys:** `event.repeat` returns before `preventDefault`, so holding an arrow can scroll the page.
- **Tab order:** every clue and editable square is a tab stop. Use a roving tabindex for squares, plus `R` and `C` to inspect the focused square's row or column.

## Inspector and hint wording
- **"Mark the N undecided squares white":** this assumes the player's black marks are right. Use "If these black marks stand, the undecided squares are white."
- **✓:** this only means the count is met. Say so, so it doesn't read as "these squares are correct."
- **Hint text:** "corrected" is false when the square was undecided. Use "set to black/white".
