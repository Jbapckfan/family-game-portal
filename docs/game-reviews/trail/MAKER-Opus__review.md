# Review: Trail `PREVIEW` (static only, not played)

**No blocker and no Critical issues.** I found one content issue worth fixing before James plays, and the code is otherwise sound. I hand-traced the routes without a dictionary sweep, so "no other word" isn't exhaustive. CSS and `common.mjs` weren't supplied.

## Important
1. **`AFTERFLOW` is traceable and rejected.**
   - **Trigger:** `[0,1,2,3,7,10,14,15,11]`, which is the top-row AFTER, then down through F-L-O-W.
   - **Impact:** As far as I recall, it's a real technical term (well testing, rheology), though I haven't checked a dictionary. It fits "something stays" weakly, so rejecting it is defensible. However, this is the most natural route, and "That word does not fit this clue" reads as a flat no and adds a check.
   - **Test gap:** The tests only count routes that spell the answer, so they can't catch competing words.

2. **Keyboard focus is lost after Clear or the last Undo.**
   - **Trigger:** Activating Clear, or Undo on a one-letter trail, disables the focused button, so `render` skips restoring focus and it drops to `body`.
   - **Impact:** Arrows, Backspace and Escape stop working because the handler is on `preview-board`. Focus should move to a tile, such as the first one.

3. **Checked words collapses on every update.**
   - **Trigger:** Open the list, then tap a tile. `preview-history` is rebuilt and the `<details>` closes.
   - **Impact:** This undercuts unlimited retries, where the history is most useful. Rebuild it only when `attempts` changes.

**Minor:**
- Tapping the last tile says "Trail shortened" but changes nothing.
- The trail slots use `aria-label` with no role or live region, so screen readers may not hear the word so far.
- Any nine-letter gibberish is called a "word" and adds a check.

**Check in the CSS:** `.trail-grid` must have four columns in the preview, and `.button` must not override `[hidden]`.

## Behaviours checked, no defects
- **Route:** The authored path spells AFTERGLOW and is the only route. G needs R12, which forces the chain back to A5, and GLOW must use L14-O15-W11.
- **Save validation:** It rejects malformed paths, duplicate words, a win that isn't the last attempt, a win combined with reveal, and a reveal without the answer path. The largest legitimate save fits under the 64 KB limit. A rejected save is only overwritten on the next update, and the preview key is separate from the daily saves.
- **Tap and backtrack:** Backtracking still works at nine letters, and row wrap is rejected.
- **Checks:** Wrong checks can be retried, and repeats cost nothing. At 1,000 attempts even the correct word can't be checked, but that's not a realistic case.
- **Reveal vs win:** Status, result text and share text all stay distinct, and focus moves to the result in both cases.
- **Sharing:** The text contains no clue, answer or grid, including when the clipboard fails and it falls back to showing the text on the page.

## Semantic and difficulty assessment (prediction, not measured fun)
- **Clue:** It's fair and satisfying in hindsight. It also suggests AFTERTASTE, AFTERMATH and MEMORY, but none of them is traceable at nine letters. WATERFALL can be built from the letters but isn't traceable, because W has no neighbouring A.
- **Main weakness:** The top row reads `AFTE`, which gives away the prefix almost at once. With GLOW and FLOW both visible at the bottom, the meaning may fall quickly, leaving little for the clue to do.
- **False routes:** They're good but narrow. All three AFTER routes spell the same word, and the top-row route's R has no G next to it. The real challenge is finding the winding second AFTER, plus the FLOW/GLOW fork.
- **Likely result:** It should be noticeably harder than the 3×3 game, but mostly as a routing puzzle rather than a word puzzle. It could still feel easy to a strong solver, so James's own reaction is the real test.

## Two changes
1. **Keep the `AFTERFLOW` trap, but acknowledge it.** It's the only false route I found that ends in a real word, so it's worth keeping. Return the state unchanged, with no check counted, and a message like "AFTERFLOW is a real word, but not this clue's. Try another ending."

2. **Hide the prefix by using grid `FTEOAALREGFWRTLO`:**
   ```
   F T E O
   A A L R
   E G F W
   R T L O
   ```
   By hand, this keeps the authored path as the only route, seven decoys, three AFTER routes and the AFTERFLOW fork, while the decoy AFTER becomes a hook instead of a straight read. Run it through the existing enumeration test before relying on that, and add `AFTERFLOW` as an explicit test case.
