# Inbetween final source review: inline files only, nothing executed

**Verdict:** No Critical defects. I found one Important persistence regression and one Important focus issue. The scoring path, stale-write adoption, nudge charging and the share allowlist hold up in source. There is no fun score; James's verdict is still pending.

## Critical

None found.

## Important

**1. A record can reach disk while the game save fails.** This path goes around the "failed game persistence prevents record-only disk success" guard.
- **Trigger:**
  1. Play the daily where `setItem` throws for `inbetween:v1:daily:…` but accepts `records`. This is the selective-block pattern your own test uses; in real browsers it is a quota edge case.
  2. Finish the board. `saveGame` handles this correctly: the game write fails, `recordDailyResult(…,false)` runs, and both keys are marked dirty.
  3. Open Stats, or tap the Daily tab.
  4. `flushPendingGame` retries and fails again.
  5. `reconcileDailyResult()` then calls `recordDailyResult(daily.dateKey, game)` with the default `readable=true`. The record is unchanged but dirty, so `write('records', records, true)` succeeds.
- **Result:** Disk holds a `won` record and an unfinished or missing daily save. After reload, the board is playable but already counts toward stats and streak.
- **Expected:** Write the local-game record only when the game key is not dirty, e.g. `recordDailyResult(daily.dateKey, game, !dirtyKeys.has(keyForGame()))`.
- **Note:** The `adoptedFeedback` and storage-event paths are fine, because there `game` comes from disk.

**2. New post-placement focus can land off-screen.** `placePair` focuses the first enabled `.pair` with `preventScroll:true`. Above 800px the bank is not sticky.
- **Trigger:**
  1. Use a 1366×768 window and the keyboard.
  2. Scroll so rows 5–6 are visible.
  3. Confirm a correct fit.
- **Result:** Focus moves to a bank button above the viewport. The next Space or Tab acts on a control the user cannot see.
- **Related:** Arrow Up/Down to a row below the fold has the same `preventScroll` behavior. That part is older, but it now matters more because rows are taller.
- **Expected:** Keep focus visible: either drop `preventScroll` or follow the focus call with `scrollIntoView({block:'nearest'})`.
- **Caveat:** At phone widths the sticky bank hides this. I derived the trigger from the CSS, not from a render, so please confirm it in a real browser.

## Minor

- **Goal label lags.** After one wrong fit on an empty board (1 attempt, 0 solved), the label still reads "Goal: 6 attempts · 0 nudges", though a perfect round is no longer possible. "· extra attempts" only appears once attempts exceed 6. Switch when `game.attempts > solvedCount()`.
- **Font preparation is not enforced in source.**
  - `prepare` awaits `document.fonts.load(...)` but never checks the result.
  - An empty resolution, such as when the stylesheet hasn't applied, silently draws in fallback fonts.
  - A rejection, such as a missing `.ttf`, blocks the PNG entirely.
  - Fix: check `faces.length` or `document.fonts.check(font)` for all four fonts before drawing, and pick one fallback policy.
  - The `fonts/` files and the iOS sync output weren't supplied, so I can't confirm they ship.
- **`roundRect` support.** Safari before 16 lacks `roundRect`. On those browsers the card fails with "Image unavailable" and only the caption fallback remains. A path-based rounded square would remove that dependency. The native app is unaffected because the text bridge goes first.
- **Native text says "hints".** The native text share comes from `formatShare` and says "hints", while the UI and card say "nudges". The engine is frozen, so this is a known inconsistency rather than something to fix here.
- **Hint-view tests are thin.** No test checks that the session snapshot is removed on clear, Escape or selecting another pair. Nothing covers retained highlighting after a free gap change, a missing legacy snapshot, or the Important #1 path.
- **Wrong-gap advice policy.** A wrong-gap placement while advice is visible keeps the advice and the snapshot. That's defensible, because placements are unchanged and the advice is still valid, but it should be stated as policy and tested. As written, "placement discards it" only applies to correct placements.

## Confirmed in source

- `saveGame(previous)` adopts external changes and returns `false` before any tone, haptic, `just-solved`, announcement or result timer. `adoptedFeedback` clears the timer and selection, removes the snapshot and repairs the record.
- An own-terminal daily survives an unfinished storage event, and storage events read storage directly rather than dirty memory.
- An already-revealed daily stays final against a stale winning placement. Your simultaneous-write limit is correctly left as acknowledged.
- `restoreGame` rejects wins under 6 attempts. `getStats` and `buildShareResult` both enforce the same rule.
- Nudges are confirmed, with cancel as the default and no attempt cost. The button is disabled while advice is visible, and the use-hint button disables itself immediately.
- `restoreHintView` restores only on matching placements, matching hint count and the exact deterministic advice. A missing snapshot invents nothing.
- `closeDialog` skips body/html, detached, disabled and hidden elements. The body-focus regression after a win now resolves to `#results-button`.
- The gap grid's `translateX(50%)` seed letters land on the gap boundaries. The minimum width is 228px at 320px wide, so the five 44px targets fit.
- The share card draws six identical markers and carries the frozen edition/date, attempts, nudges and outcome only. Sharing keeps the played date after midnight. File share runs directly in the click gesture, and the generation guard, AbortError handling and manual-select fallback are all present.

## Limits

I reviewed the inline source only. No tests, harness, renders or images were run or viewed, and I make no native-image or physical-device claims.
