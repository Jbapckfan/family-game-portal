# Cairn final source review (uncommitted changes after `5c79484`)

**Scope:** I read only the inline source you supplied. I used no tools and executed nothing. **Every finding below is a prediction from reading the source. None is reproduced.** The passing results for the 7 unit tests, typecheck and build are as you reported them; I did not run them. There is no UI visual score because no images were supplied, and no fun or replay verdict, as you asked.

## Verdict: 0 Critical · 1 Important · 4 Minor (one of the Minors is baseline)

Fix the skip-dialog copy, then run the pending browser checks below. Otherwise the change set is ready to ship.

## Findings

**1. Important (predicted): the skip confirmation understates the streak consequence**
- **Source:** `GameBoard.tsx`, DialogDescription: *"This daily round will not earn a summit or extend your streak."*
- **What actually happens:** `useGame.ts` `advance` sets `currentStreak: summit ? streak : 0`. `integration.ts` `recordStatistics` also does `else run = 0`.
- **Why it matters:** A skip *ends* the streak, in both stored stats and unified progress. The dialog exists to get informed consent before an irreversible action, so "will not extend" is materially misleading.
- **Fix:** Use wording like *"…will not earn a summit and will end your current streak."* You could show it conditionally when `stats.currentStreak > 0`.

**2. Minor (predicted, needs a browser check): keyboard focus can be lost after confirming**
- **Source:** `GameBoard.tsx` `confirm()` with the Radix `Dialog`.
- **Mechanism:** On close, Radix restores focus to whatever was focused before the dialog opened.
  - After "Show and skip", `phase` becomes `'advancing'`, so `locked` disables the Skip button.
  - After the last hint, `hints >= maxHints` disables the Hint button.
  - Focus can't land on a disabled button, so it falls to `body`.
- **Fix:** In `onCloseAutoFocus`, call `preventDefault()` and focus the ENTER button or `[data-game-focus]`.

**3. Minor (predicted): level status during play is conveyed only by color, and the legend doesn't match the pebbles**
- **Sources:**
  - The `Pebble` fills: clean `#315dc2`, assisted `#368786`, skipped solid `#a8b8c5`.
  - The legend draws "Shown" as a dashed outline, which no pebble uses. The solid gray is also low-contrast against the empty pebble `#dce5ef`.
  - The progress row is a plain `div` with an `aria-label`. On a generic role the label is unreliable, and it only says the level number, not prior statuses.
  - `CairnTower` is `aria-hidden`.
- **Impact:** Clean versus assisted is distinguishable only by a blue/teal hue mid-round (WCAG 1.4.1, 1.4.11).
- **Fix:**
  - Add `role="img"` with a summary label (e.g. "Level 3 of 5. 1 clean, 1 assisted"), or per-pebble sr-only text.
  - Match the skipped pebble to the dashed legend.

**4. Minor (predicted, cosmetic, depends on the dialog exit animation): dialog text flips while closing**
- **Sources:**
  - `GameBoard.tsx`: the title, description and button text all branch on `confirmation?.kind === 'hint'`. `confirm()` and Cancel set `confirmation` to `null` before the exit animation finishes, so a closing *hint* dialog briefly shows the *skip* copy.
  - `WinModal.tsx`: the effect `setShareResult(null)` on `props.open` swaps the share panel back to the results view during close.
- **Fix:** Keep the last `kind` (and the share view) in state that isn't cleared until after close.

**5. Minor (baseline, not introduced by this change): stale `currentStreak` display**
- **Source:** `StatsModal.tsx` `<Big value={stats.currentStreak} …/>`.
- **What happens:** After a missed day with no play, the stored `currentStreak` is never decayed, so the Stats modal shows the old run.
- **Narrow scope:**
  - It is display-only.
  - The next summit recomputes correctly, because `lastCompletedDay === day - 1` fails and the streak becomes `1`.
  - `maxStreak` and the other stored counters are unaffected.
  - The unified `recordStatistics` streak is already correct (`last >= todayNumber - 1`).
- **Fix:** Derive the displayed value: `lastCompletedDay >= today - 1 ? currentStreak : 0`.

## Checked and looks correct (from source)

**Privacy**
- The caption and card contain no letters, words or per-level pattern.
- The card marks are colored only by `solved === 5`; all totals are aggregates.
- Filenames contain only mode and date.
- The Daily date and number are frozen when Share is clicked (the `shareResult` snapshot).
- On iOS native, text is sent first and short-circuits the panel.

**Gestures and clipboard**
- `navigator.share` and `clipboard.writeText` are called with no `await` before them, so user activation is preserved.
- `canShare` is wrapped in try/catch.
- An `AbortError` gets its own message.
- The manual fallback focuses and selects the textarea after rAF, with an `isConnected` guard.

**PNG generation**
- The `current` guard drops stale async preparations.
- Changing format clears `prepared` first.
- `toBlob` failure, a missing `roundRect`, or a missing `document.fonts` all throw inside the try block and fall back to the caption path.

**Session and cleanup**
- Confirm has a double-fire ref guard and revalidates identity, puzzle and `'playing'` phase.
- The confirm dialog is reset when the level, puzzle or phase changes.
- The countdown interval, rollover interval, `later` timers and `mounted` guards are all cleaned up.
- The overlay `reset()` handles repeated practice rounds.

## Non-material notes (not counted)

- `WinModal`'s `.cairn-finish-mark` always renders five identical blue marks, even for "Stack finished, 0 of 5". The card uses gray when fewer than 5 are solved, so the modal's meaning is inconsistent with it.
- The canvas `aria-label` says "1 nudges" and "1 misses"; the caption pluralizes correctly.
- `buildCairnShareResult` can throw during render. Restore validation makes this unlikely, but a try/catch fallback would be cheap.
- The download path calls `revokeObjectURL` after 1 s, which may be tight on slow Safari.
- The button and dialog say "Hint" while the results and card say "nudge". The terminology is mixed.
- The slots `aria-live` region plus the `role="status"` counter may double-announce each tap.
- `GameBoard`'s `maxHints` ignores `isPremium()`, unlike `useGame.hint`. This predates the change.
- The share caption and card credit "Alford Daily" but not Kimi. Whether to add a credit is your call.

## Pending real-browser checks

1. Focus return after skip and after the last hint.
2. Share and Download on iOS Safari and Android Chrome.
3. The clipboard-denied fallback.
4. Font readiness on the first card draw.
5. The text flip during the dialog close animation.
