# Second Sense: final inline source review

**Scope:** I only read the pasted sources. I ran nothing, inspected no CSS, viewed no screenshots, and tested no native or physical devices. No scores are given.

## Verdict

I found **no Critical or Important bugs** in the save, typing, keyboard, hint or sharing logic. There are two Minor issues, both in `check()`, plus a few hypotheses that need a real run.

## Minor findings

**M1. A rejected (adopted) correct check still jumps focus to the clues.** `app.mjs` `check()`:
```js
if(result.accepted&&app.game.status==='playing')showClues();
```
- **Trigger:** A correct check is overridden by newer progress from another tab, and the merged game is still playing.
- **What happens:** `app.game` is the other tab's state, not `result.state`. The draft is correctly kept, and the feedback says "try your move again." But `showClues()` still moves focus to the first noun clue and scrolls the board to the top. A keyboard or screen-reader user then has to tab back to the input to retry.
- **Why tests miss it:** The browser script retries with `#sense-check.click()`, which works regardless of focus.
- **Fix:** Change the guard to `result.accepted&&app.game===result.state&&app.game.status==='playing'`, or move the call into the draft-clearing branch above it.
- **Severity:** Minor. Focus and scroll only; no data loss.

**M2. The kept draft can be a word the other tab already solved.**
- **Trigger:** Same race as M1, where the other tab solved the same pair.
- **What happens:** `renderGame` clears `nounId`/`verbId` because they are now used. The `draft` still holds that word, so it stays in the input box for the next pairing.
- **Severity:** Minor and cosmetic. A wrong reuse costs one check, but only if the player submits it unchanged.

## Claims I could confirm by reading

- **Draft ordering:** `rememberDraft()` runs before `commit`. The draft is cleared only when `app.game===result.state`. On adoption, `config.reset()` sets `draftKey=null`, so the next render reloads the saved draft. The terminal-daily adoption path also behaves correctly: `!active` clears the draft and no clue jump happens.
- **Hints:**
  - Opening the dialog changes no state.
  - Cancel or Escape goes through `closeDialog`.
  - Approval is guarded twice, by `applyHint`'s `includes` check and by `useHint`.
  - The persistent `aria-label` and `<small>` hint text render for any hinted noun, selected or not.
  - The `rAF` order is correct: `closeDialog`'s focus restore runs before `applyHint`'s clue focus.
- **Free inputs:** An invalid or empty word returns `changed:false`. Implicit form submission is blocked while the submit button is disabled. Editing a word clears both `error` and `#sense-error`.
- **Outcome labels:** `perfect-note` clearly separates revealed, perfect, assisted, extra-check and goal states.
- **Return focus:** `closeDialog` excludes `document.body` and disabled or detached targets.
- **Share snapshot:** `buildShareResult` returns a frozen allowlist of edition/date, checks, hints and status. The daily identity comes from `api.daily`, which only `loadDaily` refreshes, so it stays fixed after midnight.
  - The native bridge receives `formatShare` text first: squares and totals, with no words or URL.
  - The PNG `File` is built before the share gesture, and the `generation` counter prevents format-switch races.
- **Reveal timing:** `reveal()` → `showResult()` → `openDialog` clears the pending `resultTimer`, so the result dialog does not open twice.
- **Test fixture:** `emit` now loops over all listeners. This matters because the app's and the shell's `dialog-content` handlers both fire.

## Hypotheses that need a real run, not source reading

1. **Second tab clock in the browser script.** The `other` page relies on the context-level fake clock from `page.clock.install`. If Playwright does not apply it to that page, `other` writes to the real Chicago date's key. The race step would then fail or pass for the wrong reason whenever the real date isn't 2026-10-30. This needs one run that confirms `other` writes `daily:2026-10-30`.
2. **Older WebKit.** If `CanvasRenderingContext2D.roundRect` is missing (before iOS/Safari 16), drawing throws. The status falls back to "Image unavailable," and copying the caption still works. Only a device check can confirm.
3. **`canShare` throwing.** If it throws after `download.disabled=false`, the status says "unavailable" even though Download works. This is browser-specific and should be rare.
4. **Fonts.** The `"DM Serif"`/`"DM Sans"` faces must actually be declared for `fonts.load` to matter. Otherwise the canvas silently uses fallback fonts. This needs `styles.css` or a run.
5. **Native image sharing** is not covered, as you stated.

## Editorial notes (not bugs; human review)

- **Wrong-check feedback reveals information.** `'pair-only'` confirms the two clues belong together, and `'noun-only'`/`'verb-only'` confirm the word fits one side. Each costs a check and ends perfect eligibility, so scoring stays honest. Whether this hint-like feedback should exist outside the counted hint system is a design call.
- **Semantics:** Exact-table matching does not show that clues are semantically unambiguous. Co-board overlap claims still need checking against actual board membership.
- **Enjoyment** is still pending human play.
