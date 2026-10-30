# Counterpart final review: supplied inline source only

I read the source only. I did not run, render, play or test anything. I did not see `puzzles.mjs`, `index.html`, `styles.css`, the runtime helpers or the PNGs.

## Critical or important issues

**None found in the supplied source.**

### Draft-overwrite fix (`app.mjs` `renderGame`)
I traced the original trigger, and the fix holds:
1. A correct check sets row 0 to `[null,null]` with slot 0.
2. `commit` re-renders, and `rowIndex` advances cyclically to row 1.
3. Drafts are sanitized against `used`, and `draft` binds to row 1's saved `[X,null]`.
4. Because `rowIndex !== priorRow`, `slotIndex` becomes 1.
5. The next tile fills the empty second slot.

Reload replays the same path, because the stored `row:0` is placed and advances again.

### Sharing (`share-card.mjs`)
- **No puzzle content reaches the image or caption.** `buildShareResult` reads only status, attempts, the hint count, mode, number and date, and returns a frozen object.
- **The share dialog stays text-free in the iOS app.** In `shell.mjs`, `share()` sends the native text bridge first and returns before `config.share`.
- **The share menu opens reliably.** `navigator.share` is called before any `await` in the click handler, so the user's tap still counts.
- **Old work cannot leak into a new dialog.** `generation` and `isConnected` checks stop stale work after a format switch or dialog swap.
- **Mode and storage changes close the dialog.** `loadDaily`, `loadPractice` and `storageChanged` all do this.
- **The share keeps the played date after midnight.** `api.daily` stays at the loaded day until `loadDaily` runs.

### Help, labels and counts
I found no real contradictions:
- The perfect rule (five checks, no hints) matches across help, board note, `isPerfect`, `getStats`, the caption and the card.
- "Wrong checks leave every word available" matches the rejection path, which keeps the draft and has no tile lock.
- The hint dialog's "1 hint / assisted" matches `perfect-note`, which shows assisted before extra checks.
- The revealed state is labelled as not solved everywhere.

## Minor issues and residual edge cases

1. **The fixed bug class can still occur through one other trigger** (`renderGame`). `slotIndex` is only recalculated when the row changes.
   - **Trigger:** the active row's draft is full and saved with slot 0. Another tab places its second word in a different row. A storage event reloads and sanitizes the draft to `[A,null]` while slot 0 is kept.
   - **Effect:** the bank note says "Choose the first word", and the next tap replaces A.
   - **Impact:** low. It needs cross-tab play, and the lost draft was already wrong.
   - **Suggested fix:** recalculate the slot only when sanitizing actually changed the active row. Always recalculating would break an explicit slot-0 choice made through `chooseRow`.

2. **Revealed results read like celebrations.** The share dialog says "A connection worth sharing." / "SHARE THE CONNECTION" even for revealed results. The revealed card also says "Revealed", "ANSWERS SHOWN" and "Answers revealed." together, which is redundant. This is tone, not a contradiction.

3. **The canvas `aria-label` is always plural** (`openResultShare`): it reads "1 hints". The caption and card handle singulars correctly.

4. **The opening status can be misread** (`renderGame`). At start, `perfect-note` reads "· 5 checks, no hints" next to an attempt count of 0. It could look like a used count rather than the goal. I can't judge this without the HTML.

5. **The square card is slightly off-centre** (`drawShareCard`). The pair boxes stay at x=420/608 while their size shrinks to 42, so the group sits 5px left of the centred arrow. Portrait is centred.

6. **Focus after auto-advance ignores a full draft** (`checkPair`). Focus always goes to the first bank tile, even if the advanced row already holds a complete saved draft. Focusing Check would match the stated rule that a full pair focuses Check.

7. **Escape always announces "Draft cleared."**, even when the draft was already empty.

8. **Test gap:** in-play Escape clearing is covered by neither the Node harness (`document.addEventListener` is stubbed) nor the browser script, which only tests terminal Escape.

## Unverified hypotheses (need a device or CSS to confirm)

- **Font name:** `document.fonts.load('… "DM Serif"')` must match the `@font-face` family names. If they differ, the card silently falls back to system serif or sans fonts.
- **Font loading could stall:** if loading never settles in some WebKit builds, the status stays "Preparing…" with Download disabled. Copy caption still works. A short timeout race would close this.
- **iOS file sharing:** passing `text`/`title` alongside `files` is known to make some iOS share targets drop either the file or the text. Desktop Chromium and WebKit runs do not certify this.
- **Older Safari:** without `roundRect`, the code throws into the catch. The fallback message is correct, but no image is produced.
- **Download on Firefox:** `a.click()` on an anchor that isn't in the document is unverified there.
- **Phone layout:** "bank plus active row visible together" was only asserted at 844px height. It predates the 12px three-column tile change, which likely makes the bank taller. Shorter visible viewports, such as SE-class phones with browser chrome, are untested, and the rerun is still pending.
- **Live regions:** "one polite announcer" holds for the board. The share and lesson dialogs add their own `role=status` regions, and whether `#feedback` is also live depends on HTML I didn't see.

## Final verdict

Within the supplied source, I found no critical or important defects. The draft-overwrite fix is correct for its reported trigger. Sharing meets the allowlist and no-content constraints, and the native text bridge still takes priority.

What remains is minor copy and polish, the narrow cross-tab slot edge case, and device-dependent hypotheses. Passing tests, rendered images and the post-CSS layout are all the author's claims, which I have not verified. Semantic uniqueness of the boards is not established by anything I reviewed.
