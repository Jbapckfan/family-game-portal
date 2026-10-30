# Tradeoff: seventh individual review (Opus, inline)

**Scope.** I read only the text supplied in this prompt: `engine.mjs`, `app.mjs`, `index.html` and `cycle-audit.json`. I did not see `styles.css`, `puzzles.mjs`, the runtime helpers, the manifest, the tests or any screenshots. I ran nothing. The 26 passing baseline tests and the seeded trade and recovery tests are reported results, not runs of mine. The audit totals (210 sets, 252 answer words, 498 clue pairs, max 23 appearances) are the audit's own numbers; I did not recount them. This is static inspection, not play. Without screenshots I can't give a visual score.

## Depth: honest read

The six-cycle construction makes 5 swaps the true minimum, so "perfect" really means optimal. But reaching it is mechanical. Once you know the answers, any swap that fixes one cell shortens the cycle, and the greedy rule "never make a swap that fixes nothing" always reaches 5.

The answers themselves come easily:
- Each start word is one letter from its answer.
- The clues are direct, dictionary-style definitions.
- 252 answer words fill 1,260 row slots, so words repeat often. STINT→SAINT and HOUSE/HORSE appear constantly with identical clue text.

I expect James to put this in the same "too easy" bucket as Sideways. The ceiling comes from the content, not the code, and the brief keeps the published content. Code fixes won't add depth.

**Content flag for James to decide (I would not edit it unilaterally).** The CLANK clue, "A heavier cousin of a metallic chink," uses a word commonly read as a slur.

## `saveGame()` adoption: real static defects

`saveGame()` checks for outside changes only *after* `handleTile`, `takeHint` or `takeUndo` has already prepared its feedback. When stored data differs from `acceptedSaves`, it adopts the saved game and clears `selected`/`hinted`. The caller then carries on with values from the move it just discarded:

- **`handleTile`:**
  - `render({newlySolved})` adds `just-solved` to rows by index even when the adopted row isn't solved; the `fresh` class doesn't check `isSolved`.
  - `announce(message)` reads out the discarded "WORD is home."
  - `playTone(count ? 'solve' …)` sends a false solve haptic. That haptic fires even with sound off.
  - If the adopted state is a win from another tab, it celebrates and the result timer opens the result. That is acceptable but misattributed.
- **`takeHint`:** The highlight is cleared and the hint is correctly not charged. But `announce` still reads the stale cell coordinates against the adopted board's letters, so stale advice reaches screen-reader users.
- **`takeUndo`:** It announces "Last trade undone" even though no undo happened.
- **Feedback timer:** The adoption message is set without clearing the timer from `setFeedback`, so it disappears after 3.6 s.
- **Records:** The adoption path returns before the daily records are reconciled. A terminal state adopted mid-session is only reconciled at the next load.

These paths are reachable only when `storage` events are missed (a frozen or bfcache tab, or a key removed elsewhere; `newValue === null` is ignored, so a later move resets the board to fresh). They are rare but legitimate defects.

**Malicious saves are a separate, lower-priority question.** Hand-edited saves could lower hints/undos or inflate history; `restoreGame` checks the letter signature, not whether the move count matches history. That's a local-only anti-cheat concern, not a defect to prioritise.

## What works

- Same-letter and same-cell attempts give a toast or deselect without charging a swap, and the selection persists after a same-letter toast.
- Locked rows are disabled and same-row trades are allowed.
- `findHint` can never come up empty while a mismatch exists.
- Undo never refunds swaps.
- Reveal stays revealed and is not a win.
- Streaks reset correctly on reveals and gaps.
- Storage failure falls back to memory with dirty-key retries.
- The share text is spoiler-free.

## Recommended fixes

1. **`syncExternal()` before acting.** Call it at the start of `handleTile`, `takeHint`, `takeUndo` and reveal. If storage changed, adopt, clear timers, run `recordDailyResult()`, show one message and abort. Remove adoption from `saveGame()`, or have it return `{adopted}` so callers can bail out.
2. **Hint economy.** Persist `activeHint {boardSig, a, b}` in the game state.
   - Asking again while the board is unchanged re-shows the same hint for free, and it survives a reload or mode switch. Today, re-pressing spends another hint and a reload loses the paid highlight.
   - Confirm the *first* scored nudge: "Counts against Perfect."
   - Keep the rule that no correct letter is highlighted outside a requested hint or a solved word.
3. **Make the perfect rule truthful everywhere.**
   - The hero, sidebar, `/ 5 is perfect` label and help say "5 swaps"; they should say "5 swaps, no nudges or undos."
   - Use one word throughout: the UI says "nudge" but the share says "hint."
   - Ctrl/⌘Z is a global shortcut for a *scored* undo. Confirm the first undo, or drop the shortcut.
4. **Readability pass (needs CSS and screenshots to verify).**
   - Tiles at least 44 px; larger clue text.
   - Blue/teal colour tokens. The confetti currently uses lime, sage and peach, and `theme-color` is cream.
   - A roving `tabindex` instead of 30 separate Tab stops.
   - Drop the clue from each tile's `aria-label`; it repeats on every tile now.
5. **`buildShareCard({mode, number, dateKey, moves, hints, undos, status, par})`.**
   - Frozen played Daily number and date, or "Practice."
   - Honest Perfect / Solved / Revealed status.
   - No words, cells, board, history or URL.
   - Order: native text bridge, then a real PNG via `canShare({files})`, then download, copy, or a manual textarea. Treat a cancelled share as a no-op. No claims about native image sharing.
   - Add the date to the text share as well.

## Provisional predictions (mine, separate from James's view)

| Area | Score |
|---|---|
| Fun | 2 |
| Clarity | 3 |
| UI (visual) | declined, no images |
| Interaction/a11y code | 3 |
| Replay | 2 |
| Sharing | 3 |
