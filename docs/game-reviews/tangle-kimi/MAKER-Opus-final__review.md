# Tangle final source review

**Scope:** I read only the inline source: TangleBoard, Page, WinModal, SharePanel, HelpModal, engine, progress, reviewed-words, share-card, useTangle, integration, useGameOverlays, useDailySession, stats, dialog and index.css. I ran nothing. The author-reported results (172 baseline, 9 new cases, 23 focused tests, typecheck/build) are your claims; I did not check them. I did not assess editorial or difficulty questions, the published bank, or scoring.

## Findings

**1. Important: a stale path between the last pointermove and pointerup can submit the wrong word**
*Source: `TangleBoard.tsx` `handleMove`/`handleUp`, plus the unchanged `useTangle.ts` `submitPath`*

This is the race you raised, and the code permits it in ordinary play:

- `handleMove` calls `actions.setPath(next)`. In React 18 that is a continuous-lane update, which is scheduled rather than flushed synchronously.
- `pathRef.current` (board) and `ref.current` (hook) are only refreshed on render.
- If `pointerup` is dispatched before that render, `handleUp` checks a stale `pathRef.current.length`. `submitPath()` then builds the word from stale `ref.current.path` and calls `setS({...prev, ...})` with an object. That overwrites the queued `setPath`.
- Result: the last letter is silently dropped. The player sees ROUTE highlighted but ROUT is checked. That can count a miss and mark the day played.

Browsers can run input tasks ahead of React's scheduler task, so fast flicks on slow devices are the likely trigger.

A milder version affects two moves before a commit. `p` is stale, so the second move can replace rather than extend: `[0,1]` becomes `[0,5]`. This one is visible before release.

**Fix (board only, useTangle untouched):** wrap path writes from pointer handlers in `flushSync(() => actions.setPath(next))`. Do this in `handleMove` and `selectCell`. Both refs are then current before the next event. Sixteen tiles make a sync render cheap. Add a test that dispatches move→up with no `act` flush between them.

**2. Minor (verify): Space activation on a focused tile may double-select**
*Source: `TangleBoard.tsx` tile `onKeyDown` + `onClick(detail===0)`*

The tile calls `selectCell` on Space keydown and relies on `preventDefault` to suppress the keyup click. If any engine still activates the button on keyup, `onClick` (detail 0) runs `selectCell(i)` again on the same, now-last cell. With three or more letters, that submits immediately. Firefox has historically needed keyup prevention here.

**Fix:** drop the custom `onKeyDown` and let native Enter/Space activation reach `onClick` (detail 0). Your global handler already skips via `isNativeEnter`. This also unifies the keyboard and assistive-click paths. If you'd rather not change it, run a quick Firefox check.

**3. Minor: the saved clue goes stale during continued play**
*Source: `TangleBoard.tsx` `data-tangle-clue`*

"Saved clue: a word starts with XX" persists after the player finds every word with that prefix. That is likely, since the clue named one specific word. The sentence then points at nothing unfound and can send someone searching fruitlessly after Gold.

**Fix (display only, no scoring or persistence change):** when `!puzzle.words.some(w => w.length >= 4 && w.startsWith(prefix) && !found.includes(w))`, render "Clue used: XX (found)".

**4. Minor: the live region is mounted conditionally and is noisy**
*Source: `TangleBoard.tsx` current-word `<span aria-live>`*

The `aria-live` span is created when the first letter appears. Many screen readers don't announce content inserted together with its live region, so the first letter is missed. During drags it then announces every intermediate letter.

**Fix:** keep a persistent visually-hidden `role="status"` sibling. Update it on tap/keyboard selection and on submit outcome, not per drag step. Tile `aria-label`s already carry per-cell order.

**5. Minor (data assertion): `buildTangleShareResult` can throw during render**
*Source: `TangleWinModal.tsx` → `share-card.ts`, `progress.ts` `medalTargets`*

The function throws if any target exceeds `maxScore`. `medalTargets` floors Gold at 8, so any original or reviewed grid with `max < 8` would crash the page when "See results" opens, since no boundary is visible. It would also make Gold unreachable. Most likely no grid has `max` under 8, but nothing shown proves it.

**Fix:** add one bank-wide test asserting `targets[2] <= max` for every original grid and for `reviewTanglePuzzle(grid)`, including the reviewed-day path.

## Checked, no issue found

- **Pointer gestures:** primary/button guard, capture/release, multitouch rejection, outside-release preview, `lostpointercapture` re-entry, blur and identity/found/phase gesture invalidation all hold.
- **Clue dialog:** round/puzzle/found approval identity and the double-confirm guard are correct. Escape closing the dialog doesn't also clear the path.
- **Confetti:** fires only on a fresh crossing, since `startDaily` resets `winShownOnce`. This matches your note.
- **Win modal snapshot:** keyed mount/unmount is fine, Radix FocusScope unmount still restores focus, and the frozen share snapshot means live score updates can't redraw the image (`[format, result]` uses the frozen object).
- **Share panel:** cancellation via the `current` flag across format switches, AbortError messaging, and URL revocation on unmount are correct.
- **Share privacy:** the caption and canvas carry no grid, words, path, best word, clue prefix or URL.
- **Legacy edition:** retention only when saved `found` contains an excluded word is consistent with `restoreTangleProgress` and cross-tab validation through `dailyTangle(day, raw)`.
- **Stats:** the streak display decay is computed render-side only; nothing is persisted.

## Counts

| Severity | Count |
|---|---|
| Critical | 0 |
| Important | 1 |
| Minor | 4 |

## Verdict

**Approve conditional on fixing #1 in the single author fix pass.** Use `flushSync` plus a move→up test; this should also settle the pending browser rapid-trace check. #2–#5 are low-risk hardening that can go in the same pass. #2 and #5 are verify-first.
