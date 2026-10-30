# Sideways final source review (inline sources only)

**Scope:** I read the supplied engine, app, shell, share-card, unit test, HTML, CSS, browser script and DESIGN.md. I executed nothing and viewed no images. Reading the CSS is not rendering or device verification. The baseline 57 tests, the 215,040-orientation audit and the browser script were run by the author, not by me. I gave no fun rescore.

## Verdict

**I found no Critical or Important source regression that I can reproduce from these files.** The preserved invariants hold in source:

- **Only Check wins.** `rotateRow`, `useHint` and `undoMove` never change `status`. `checkBoard` is the only path to `won`. `restoreGame` reaches `won` only when the last check was all-correct and the board is complete.
- **Feedback expiry.** `feedbackCurrent` compares the row strings, so feedback expires on a shift. It returns on undo or on an equivalent period-2 layout. `checkBoard` rejects `unchanged` without charging.
- **Undo** restores the rotations and never decrements `moves` or `hints`. History is capped at 64. `restoreGame` keeps `hints ≤ moves` and `history ≤ moves`, so more than five nudges is valid.
- **Perfect** means `checks===1 && hints===0`. This is consistent across `result()`, `getStats`, `formatShare` and `buildShareResult`, with no move threshold.
- **Nudge approval:**
  - The button is disabled synchronously.
  - `HTMLElement.click()` on a disabled button is a no-op, so the double-click test would catch the regression it describes.
  - Approval runs `closeDialog` and then a rAF guarded by puzzle, mode and date.
  - At the write boundary, `save()` detects a changed raw value and adopts it. `config.reset` clears `hintMessage` and the stale `result.state` is discarded.
  - The `app.game!==result.state` branch then focuses row 0.
- **Sharing:**
  - `share()` returns unless the result is terminal, and tries native text before the card.
  - `buildShareResult` copies only `checks`, `moves`, `hints` and `status`, plus the identity, and returns it frozen.
  - The canvas draws 20 identical squares.
  - The four requested font faces cover every face the canvas uses.
  - A generation counter and `isConnected` checks guard stale renders.
  - `api.daily` only changes in `loadDaily`, so a share after midnight keeps the date that was played.
- **Legacy engine vs reachable UI:**
  - `formatShare` can produce "In progress" with per-column ⬜/🟩 squares and a `url`. The UI cannot reach this: `share()` returns early for non-terminal games and passes no `url`.
  - `findHint`'s row-letter message is reachable, but only after a confirmed, charged nudge.

## Minor fixes (source-evident, low severity)

1. **The nudge rAF guard does not check the game object** (`app.mjs`, dialog-content handler). If a delayed `storage` event lands between the click and the rAF:
   - `storageChanged` replaces `app.game` with a still-playing board.
   - The puzzle, mode and date guard still passes.
   - `applyHint` then charges a nudge against a board the player never confirmed.

   The write-boundary guarantee only covers the case where the event has not been delivered yet. **Fix:** capture `const before=app.game` on click and require `app.game===before` in the rAF.
2. **"One live announcer" is not strictly true.** On adoption, `commit` calls both `toast(feedback)` (a `role="status"` region) and `announce(feedback)`, so screen readers may announce it twice. Either drop the toast's role or skip `announce` when toasting.
3. **Some `aria-label`s sit on generic `<div>`s:** `.strip-letters` ("Row N: …"), `#column-status` (the checked/unchecked distinction) and `#puzzle`. ARIA prohibits naming generic elements, so these labels are often not exposed. Add `role="group"`.
4. **Native text differs from the card caption.** It says "hints" where the card says "nudges", and it has the Daily number but no date. This is not a leak, but the wording is inconsistent.
5. **The clue badge may overflow when correct.** `.sideways .column-clue>span` is fixed at `width:32px` but holds "A", a 6px-margined "↓" and "✓", roughly 35px. Use `min-width` instead of `width`.
6. **After a win with more than one check, `#perfect-note` reads "· first check used".** That is accurate but odd on a finished board; "· solved" would be clearer.
7. **`share-card.mjs` has a stray comment.** "Five identical abstract pairs" contradicts the drawing (5×4 identical squares).

## Hypotheses (need render, bank or device verification)

- **Clue wrapping at 320px.** The `.sideways` rule sets `overflow-wrap:normal; hyphens:none` at 16px in about 113px of content width. A single word longer than about 12 characters would overflow. The browser assertion only measures the 2026-10-30 Daily's clues, not all 210 boards. Scanning the longest token in each bank against that width would close this gap.
- **Focus moves to row 0 after Check and Undo** via `focusRow(0)` and `scrollIntoView({block:'nearest'})`:
  - On short viewports this may scroll `#check-status` and `#feedback` out of view right after a check.
  - Keyboard users pressing Undo repeatedly must tab back each time.
  - Consider keeping focus on Undo while it stays enabled.
- **A render triggered by another tab's `storage` event rebuilds `#puzzle`.** Focus inside the grid would drop to `body` (the dialog-close path is handled; this one is not).
- **Strips with period 1 (e.g. AAAA)** would leave the arrows enabled but silently do nothing. This only matters if any bank contains such a strip, which I cannot see.
- **The `#toast` hidden-to-shown change** may not announce reliably on all screen readers. That behaviour is not visible in source.

## Not verified by me

I did not verify any test result, screenshot, rendered layout, contrast in situ, PNG output, native bridge behaviour, physical sharing or the solvability audit. All of these are author-reported.
