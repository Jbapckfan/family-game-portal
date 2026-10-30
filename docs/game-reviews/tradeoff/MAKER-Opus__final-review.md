# Tradeoff final source review

**Scope.** This is a read-only review of the inline files. I ran nothing: no JSDOM, no browser harness, no rendering. Fonts, CSS and PNG output are judged from source only. There is no fun rescore. James's verdict stands as given: a keeper, a bit too easy.

**Verdict.** Ship-ready with one Important fix. I found no Critical regressions. The rules engine, scoring, bank and IDs are untouched. The hint, undo and sharing changes do what the brief says. Save reconciliation is sound for the paths the tests cover: stale swap, stale hint, terminal adoption, and terminal-versus-unfinished rollback. The remaining gap is terminal versus a *different* terminal.

## Important

**1. A later terminal from another tab overwrites your own terminal, and the record now follows it.**

- **Where:** the `storage` handler, `games/tradeoff/app.mjs`. It only protects `game.status!=='playing' && restored.status==='playing'`. Any other terminal is adopted, and then `recordDailyResult()` rewrites today's record to match.
- **Why it matters:** the new "reconcile record to the authoritative game" change means this race now also downgrades stats. Before, it only affected the board.
- **Trigger in real browsers:** Tab B's localStorage cache is stale for a moment (Chromium's per-renderer cache is eventually consistent). B reveals, or wins with more swaps, after A has already won. B's `saveGame` sees `raw === acceptedSaves` and writes. A then receives the event and adopts B's result.
- **Minimal JSDOM trigger:** use test 5's setup. Win in `g`. Then `setItem` the daily key to `{...won, status:'revealed', moves:0, history:[]}` and dispatch the `storage` event.
- **Expected:** the game stays `won`, the disk is rewritten to `won`, and `records['2026-10-30'].status === 'won'`.
- **Actual:** the game and the record become `revealed`, so the perfect result and the streak are lost.
- **Fix caution:** a naive "own terminal always wins" rule ping-pongs. A rewrites its result, B rewrites its own, and so on. Use a tiebreak that both tabs compute the same way, for example keep own only if own is `won` and the incoming result is not. That converges because B then adopts A's win. It also needs no save-schema change.

## Minor (narrow)

1. **The protect path ignores write failure.** The same handler calls `writeData(key,game)` and then `recordDailyResult()` with the default `readable=true`. If the rollback write fails, the records write can still succeed. That is the record-only disk success the brief says is prevented. Pass the `writeData` result through, as `saveGame` does.

2. **The adoption message is wrong for terminal states and never clears.** `adoptedFeedback` sets `feedback` with no timer. After adopting a *terminal* game, the interaction note on a finished board keeps saying "try your move again" until reload. Pick the message by `game.status`, or clear it on a timer.

3. **Focus is invisible on hinted tiles.** `.tradeoff .tile.hinted{outline:2px solid …}` has specificity (0,3,0), which beats `button:focus-visible` (0,1,1). The tile that receives focus after a nudge looks identical to its partner. Add `.tradeoff .tile.hinted:focus-visible{outline:3px solid var(--accent);outline-offset:3px}`.

4. **Storage events are misread when this tab has a dirty key.** In the handler, `readData(key,null,true)` returns the dirty `memory` copy when this tab has a failed write. It does not set `acceptedSaves`. The result is a false "updated from another tab" toast that re-adopts your own state, and the real change is only adopted on the next save. This only happens after a storage failure.

5. **Share fails silently on a tampered save.** If `restoreGame` accepts a forged `won` with `moves < par`, the UI and `getStats` show it as perfect. But `buildShareResult` throws inside the async `shareResult`, so the Share button does nothing and shows no message. This is the pre-existing local-tampering class, not a regression. Catch the error and fall back to the caption.

6. **The font guarantee is weaker than stated.** `document.fonts.load()` resolves `[]` when a face is missing; it does not reject. "Actual DM Serif Display loaded before PNG" therefore holds only when the TTFs are served. Check the length of the result if that claim is going to be recorded.

7. **The nudge icon is dropped.** `hint-button.textContent=…` removes the SVG after the first render. This is cosmetic; keep it if intentional.

## Checked and found sound

- **Write-boundary adoption:** `saveGame(before)` returns `false`. Every caller that matters (swap, hint, undo) then skips the animation, haptics, `celebrate`, the result timer and its own announcement. `adoptedFeedback` clears the feedback and result timers.
- **Reveal and restart:** both ignore the return value. This is harmless. After a terminal adoption, `showResult` shows the adopted result; after a playing adoption, it returns early.
- **Storage failure:** `writeData(key,…)`'s result flows into `recordDailyResult(saved)`. The `raw===undefined` path writes both with `readable=false`.
- **Corrupt JSON:** it never enters `acceptedSaves`. The first save's parse throws and falls through to an overwrite, which is correct.
- **First terminal:**
  - On startup, `saveGame()` on a terminal state repairs a missing or stale record.
  - A stale tab that sees a changed `raw` adopts the stored terminal (first one wins).
  - An unfinished event against your own terminal is rolled back and rewritten. The tab that wrote the unfinished state then adopts the terminal, so it converges.
- **Hint snapshot:**
  - It requires the same hint count and board, plus a matching `findHint` result. Missing or legacy snapshots produce no advice.
  - Trading, Undo and adoption all clear it.
  - The confirmation dialog defaults to "Keep thinking". The `use-hint` button disables itself before closing. Focus lands on `hint.a` via `render({focusCell})`.
- **Score rules:** Undo increments `undos` and never decrements `moves`. "Perfect" uses `<=par` in the UI and stats but `===par` on the card. These agree for every reachable win, since a six-cycle needs at least five swaps.
- **Sharing:**
  - The card is a frozen snapshot of aggregate scores with no board, history or URL.
  - A Daily card uses the played `daily.number` and `dateKey`, so it stays correct after midnight.
  - Generation guards and `isConnected` checks cover format switches made while an image is still preparing.
  - The native text share path still goes first.
- **CSS (source reading only):**
  - The later `.tradeoff` rules (clue 16px, tile 44px minimum, `.par-label{display:inline}`) override the earlier ruby and ≤360px rules on specificity and order.
  - The tile widths add up at 320px.
