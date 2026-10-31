# Hunch final static review (claude-opus-5-5)

This is a source-only review. I executed nothing, played nothing, and did not render anything. `GameHeader`, `effects`, `integration`, `practice`, `daily`, `stats` and the dialog primitives were not included, so findings that touch them are marked as conditional.

## Important

### 1. Enter does the wrong action when a pointer-clicked button still has focus

**Trigger (desktop Chrome, and Firefox on Windows/Linux, where a mouse click focuses the button):**

- **Delete key (fully in the supplied source):**
  1. Type `CRANX` on the physical keyboard.
  2. Mouse-click the on-screen ⌫. Only letter keys blur on pointer click, so focus stays on Delete.
  3. Type `E`, then press Enter.
  4. The keydown target is the Delete button, so `isNativeEnter` returns true and the handler exits (`HunchBoard.tsx`, keydown effect). The native button activation then runs `backspace`. Result: `crane` becomes `cran` and nothing is submitted.
- **Reveal letter (fully in the supplied source):**
  1. Mouse-click "Reveal letter", then choose "Keep guessing".
  2. The dialog returns focus to the element that was focused when it opened, which is the still-enabled Reveal button.
  3. Type a word and press Enter. The clue confirmation reopens instead of submitting.
- **Header controls (conditional, assuming `GameHeader` renders native buttons):**
  - Help or Stats: mouse-click, close, type a guess, press Enter. The modal reopens.
  - Practice: same sequence starts a new practice round. Practice progress is not persisted, so the typed word and any earlier guesses in that round are lost.

The help notes say pointer clicks are handled via `detail>0` blur. That covers only the 26 letter keys. Enter, Delete, Reveal and any focus the dialog restores to its opener are not covered.

**Minimal fix:** in the keydown handler, when a letter or Backspace is handled while `document.activeElement` is a control outside a dialog, move focus to the existing `[data-game-focus]` main element with `focus({preventScroll:true})` before `flushSync`. A later Enter then targets `main` and submits.

This keeps the behaviours you want to preserve:
- A keyboard user who tabs to a key and presses Enter or Space without typing still activates that control natively.
- The letter-key blur stays as it is.

Optionally, also add `if(event.detail>0)event.currentTarget.blur()` to Enter, Delete and Reveal for consistency. That alone does not cover header buttons or dialog focus restore, so the handler change is the actual fix.

**Regression test (real Page harness):**
1. Focus the Delete button.
2. Dispatch `keydown` for `e` with the button as target.
3. Assert `document.activeElement` is `main[data-game-focus]`.
4. Dispatch Enter from there and assert `guesses.length===1`.

jsdom does not synthesize a click from Enter on a button, so assert the focus move rather than the native activation.

## No other Critical/Important defects found

I checked these paths and found them consistent:

- **Restore:** `restoreHunchProgress` recomputes `finished`/`won` and requires the answer only in the last row. Its output always satisfies `buildHunchShareResult`'s consistency checks: a win ends on an all-green row, a loss has 6 rows, and `hintsUsed` is at most 5 because hint letters are unique answer letters. This holds for historical duplicate rows too.
- **Clue gating:** a stale approval cannot confirm, because the identity, answer and `guesses` reference are captured and `consumed` is a ref. The empty-candidate path leaves the clue unused.
- **Fresh finish and overlays:** `freshFinish` is ephemeral, so restore produces no confetti and no popup. The modal is keyed and mounted only when open.
- **Storage writes:** `markPlayed` and the persist effect go through `commit`, and writes after a finished round are refused.
- **Practice exclusion:** `practiceHunch(cur.puzzleNo-1)` excludes the current index, including today's daily index when starting from Daily.
- **Share export:** the result contains only statuses, score, edition/date and clue usage. Rows are deep-frozen. No answer, guess letters or URL are exported.

## Minor notes

- `dailySession.actions(...)` builds a new object every render. The `[actions]` dependency therefore re-registers the window keydown listener on every keystroke. It works, but memoizing the wrapped actions object would stop the churn.
- Keydown does not check `e.isComposing`. IME users could inject letters mid-composition.
- A repeated invalid or duplicate submit within 500 ms sets `shaking:true` while it is already true, so the shake does not replay. Feedback is the toast only.
- Key `aria-label` for absent keys reads "not in the word, or no additional copy". With max-rank aggregation, an absent key always means truly absent, so the board-tile wording is misleading on keys.
- `engine.ts` still exports `buildHunchShare` with emoji rows, a "HUNCH No." format and no date. It is unused here but contradicts the canonical caption. Remove it to prevent accidental use.
- `drawHunchShareCard` draws `✓`/`↔` in DM Sans, which may lack `↔`, causing a fallback glyph in the PNG. Verify this in the browser pass.
- `download()` clicks a detached `<a>`. This is fine in current Chromium, Safari and Firefox. Append it if older Firefox matters.
- `document.fonts` is not guarded, but a missing API falls into the catch and shows "Image unavailable". That is acceptable.
- Help auto-opens only when `phase==='playing'`. A first visit on an already-finished daily (for example after a storage import) shows no help until a later playing round. This is rare.
- The footer says "every midnight" while the help says "midnight in Central Time". Consider matching them.
- `hintTaken`'s parameter is named `greens` but receives green and gold letters. Renaming it to `known` would avoid confusion.

## Verdict

After Important #1 is fixed and its regression test added, this is **ready for browser verification**. Browser checks should include:
- Chrome mouse+keyboard mixing: Delete, Reveal→Keep guessing, and header Help/Practice, each followed by physical Enter.
- Share-card glyph rendering.
- Native file share on real hardware.
