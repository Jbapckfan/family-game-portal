# Inbetween: eighth individual review (inline Opus)

**Scope.** I read only the pasted `engine.mjs`, `app.mjs`, `index.html` and `insertion-audit.json` text. Tools were disabled, so I opened no files, ran nothing and executed no tests. I saw no CSS or screenshots, so **I decline a visual UI score.** Everything below comes from static reading, not play.

## Provisional predictions (mine, not James's ratings)

| Axis | Score | Basis |
|---|---|---|
| Fun | **2** | The audit shows every row has exactly one correct placement (`"1":1260`). The bank never creates competition between rows, so there is little deduction. Previews are free, so a player can sweep gaps and read real words at no cost. The last row is forced: one pair, five free previews. Clues are mostly plain definitions ("Come back" → RETURN, "Sixty seconds" → MINUTE). By my rough count of the listed transformations, about 74 of 174 are prefix/suffix inserts (gap 0 or gap 4: RE-, UN-, IN-, -EN, -AL, -LE). This looks closer to the "too easy" risk than to Tradeoff. |
| Clarity | **4** | Rules, preview-then-place flow and help copy are clear. Two labels are untruthful: the static "/ 6 is perfect", and "hints" in the share text versus "nudges" in the UI. |
| UI (visual) | **declined** | No CSS or screenshots. `theme-color #f6f3ec` is cream, but I can't judge the palette, text size or blue/teal from markup. |
| Replay | **2** | 210 boards use only 174 distinct seed/answer/clue triples, 100 seeds and 96 pairs. There are 1260 row instances, so each triple appears about 7 times per cycle, at most 9. A daily player would likely see the same clue roughly monthly, and sooner in Practice. Seeds repeat heavily (DATE, FORM, PORT, REST, TIRE, SING). These are recurrence facts only, not measured difficulty. |
| Sharing | **2** | Text only. No date, no image, and only a binary green/yellow row. |

**Reveal-to-win:** not reachable through the UI.
- `restoreGame` keeps a `revealed` status.
- `saveGame` adopts a stored terminal daily.
- `recordDailyResult` is first-finished.
- `getStats` rejects wins under 6 attempts.

Editing localStorage by hand is self-cheating. Truly simultaneous terminal writes are the known localStorage architecture limit, and I am not recommending "win beats reveal."

## High-value fixes

**1. Nudge accounting** (`takeHint`, `useHint`, `clearSelection`, `chooseTile`, Escape handler). **High:** this breaks the integrity of the perfect score.
- A single press charges a nudge with no confirmation.
- Pressing again while the paid preview is visible charges again for the same advice.
- Escape, Clear or picking another tile discards the paid preview, and the next nudge re-charges. Reload also loses it.

Fixes:
- Add a confirmation dialog whose Cancel changes no state and returns focus.
- If `hinted` still equals `findHint(puzzle, game)`, re-show it without charging.
- Persist `{row, tileId, gap}` under a separate key such as `nudge:`+`keyForGame()`. Don't change the save schema or IDs. Restore it only if the row is still empty and it still matches the current `findHint` result.
- For legacy saves with `hints>0` and no stored nudge, show nothing rather than inventing advice.

**2. Side effects before adopting external progress** (`placePair`, `takeHint`, `saveGame`). **Medium.**
- `placePair` sets success feedback and calls `playTone` (sound plus native haptic, including `win`) before `saveGame`. `saveGame` may then replace `game` with another tab's progress, but `render({solved:row})` still animates `just-solved`, and the result timer and bank focus follow the new state.
- In the daily branch where another tab already finished, the "A good fit." feedback survives.
- In `takeHint`, after adoption, `announce(... result.hint.message)` reads out the exact placement even though the charge was discarded. That leaks free advice.

Fix: check staleness before `submitPlacement`/`useHint`, or have `saveGame` return `{adopted}` and gate the tone, feedback, animation, announcement and timer on it.

**3. Truthful labels and stats** (`render`, `formatShare`, `showStats`). **Medium-low.**
- `.par-label` "/ 6 is perfect" is static. It should change once `hints>0` or `attempts>6`.
- Share text says "hints"; it should say "nudges".
- `averageAttempts===null` is never true, so zero wins shows "0.0".

**4. Spoiler-free image sharing** (`share`, `showResult`). **Medium.**
- Keep the existing `nativeMessage({type:'share',text})` first, and make no native-image claims.
- In `showResult`, prepare portrait (1080×1350) and square (1080×1080) PNG blobs ahead of time, so a later click still has user activation.
- Content: Daily number plus date (or "Practice"); attempts, nudges, Perfect/Solved/Revealed; six identical abstract markers.
- Leave out letters, pairs, clues, gap/row positions, history and the URL. Keep `formatShare`'s `url` unused.
- Use `navigator.share({files})` when `canShare` allows it. Treat `AbortError` as inert, not a fall-through to clipboard. Otherwise offer a download link, a copyable caption, then the existing textarea fallback.

**5. Keyboard and phone gap controls** (`render`, `#puzzle` keydown). **Medium; layout unverified without CSS.**
- Every gap is a tab stop, about 30 at the start, after the six pairs. Gaps are disabled until a pair is selected.
- The "Place pair ↵" glyph suggests Enter places, but Enter on a gap only re-previews.
- `render` rebuilds `innerHTML`, so storage-event renders drop focus to the body.
- Fixes: roving `tabindex` per row; Enter on the active previewed gap focuses or triggers `placePair`; ≥44px gap targets with layout that won't wrap; restore focus after external updates.
- Visual work (larger clues and letters, high-contrast blue/teal, updating `theme-color`) is needed but I can't verify it here.

Minor: footer links default to `192.168.1.155:8080` and an external Tradeoff URL unless the path regex matches, which a native wrapper may not.

The bank's shallowness (single homes, affix-heavy, forced last row) is a content limit. Per this pass it is noted, not rewritten.
