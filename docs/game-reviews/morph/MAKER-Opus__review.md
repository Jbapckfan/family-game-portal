# Morph review (Opus 5.5): source inspection only

**Scope.** I read only the inline source and the audit aggregates. I had no screenshots and did not execute or play anything, so this is not a play test. Morph's original authorship remains Kimi (`integration.ts`).

**Provisional predictions.** These are my guesses, not James ratings.
- **Fun: 3.** The core ladder is sound, but the benchmark rarely bites.
- **Clarity: 2.** The help text, labels and colors contradict each other (see 1 and 2).
- **UI: declined.** I had no screenshots.
- **Replay: 3.** 450 distinct pairs cover six months without exhausting the bank, but 79% of boards have a shorter route than the benchmark.
- **Sharing: 2.**

I found no new stale-session defect. The `useDailySession` guards wrap every action and commit, and I am not repeating older claims.

## Material findings

**1. The help modal teaches the wrong thing.**
- `MorphHelpModal.tsx` wraps the **`c`** of `cord` in the highlight span. The change from `cold` is the `l→r` swap at position 3, so the example marks the wrong letter.
- It then highlights whole words (`card`, `ward`), which is inconsistent with the first rung.
- The help colors "start" blue (`hsl(205…)`) and "target" pink (`hsl(340…)`). The board renders start as lilac `#e9e1f1` and the goal as a white tile with a purple outline (`index.css`, MORPH block). The legend does not match what the player sees.
- It also promises "gold 🥇", which adds to the childish result tone noted in 5.

**2. "Target" means two things, and the medals rest on a non-shortest benchmark.**
- "target" labels the goal-word row (`MorphBoard.tsx`).
- It also labels the benchmark: the meta row reads `Moves N · target {par}`, the help says "Match or beat the target for gold", and the share text says `target N`.
- The audit shows a shorter route than the benchmark on 357 of 450 boards. 71 boards solve in 2–3 moves against benchmarks of 4–7.
- Gold (`moves <= par` in `medalFor`) will therefore be routine for capable players, and a "beat the target" result means less than it sounds.
- This can be fixed with wording only, with no bank change: call the end word "Goal" and the benchmark "Suggested route: N moves".

**3. Layout and input hierarchy work against large, clear placement.**
- **The goal word moves.** The goal row renders after the confirmed rungs and the editing row. It shifts down every rung, and on phones LOCK IN RUNG ends up below the fold after about 5–6 rungs. Nothing caps or pins it.
- **The editing row has no changed-letter marker.** You cannot see which position differs from the previous rung until you submit. The confirmed-rung dot is 6 px and recolored by `.morph-letter.tile-ok>span`.
- **The keyboard path is implicit.** `keyboardLetter` writes to `focusCell ?? 0` and then wraps silently. There is no Backspace or arrow handling, and nothing is visible until the first keystroke sets the ring.
- **Letters are smaller than they appear in the markup.** `index.css` sets `.morph-letter` to 38–50 px wide and the side labels to 8 px, overriding `h-14 w-12 text-2xl`.
- **The purple is easy to remove, but not with one variable.** The `html[data-game-id='kimi-morph']` override plus the hard-coded MORPH hexes are the only source. Deleting both falls back to the teal `:root` identity (`#39766f`). Changing variables alone will leave purple in the hard-coded values.

**4. Three one-tap actions can't be taken back, and they sit together.**
- **Show a route:** `hint()` sets `hintsUsed ≥ 1` and the round is marked Assisted for good.
- **Give up:** `giveUp()` ends the round, reveals the route and sets `currentStreak: 0`.
- **Restart ladder:** clears all rungs.
- All three are adjacent `btn3d-soft` buttons with no confirmation step. A single mis-tap on a phone costs the streak or the clean result.
- Recommendation: confirm the first hint, Give up and Restart only. Leave "View saved route" free.

**5. Results and sharing**
- **Confetti repeats.** `MorphPage.tsx` fires `fireConfetti()` whenever `state.finished` turns true. `startDaily()` restoring a finished Daily counts as that transition. Confetti therefore replays on every reload, every Practice→Daily return, and rollover into a finished day. The result modal also auto-reopens, because `reset()` bumps `roundRevision`.
- **Challenging the brief's assumption:** `copyText` *does* try `nativeMessage({type:'share'…})` first, so it does not bypass the native bridge entirely.
- **"Copied!" is unconditional.** The button shows it after a native share-sheet hand-off and after a failed `execCommand('copy')`, whose return value is ignored. `copy()` has no error handling.
- **The share number is a bank index, not a date.** `MORPH No.{puzzleNo}` comes from `idx + 1` of `publishedDailyIndex`, so it jumps around from day to day and won't mean anything to recipients. Daily shares should carry the date.
- **What the share leaves out:** misses, any Practice share and any image. The share text is emoji-led (`🥇`, `⬛`, `💡`), as are the modal titles.
- **The proposed frozen aggregate snapshot fits this code.** It needs no start, goal, route or positions, and the existing share text already leaks none of them.

**Smaller notes.**
- A repeated word is free but triggers the shake. Back-to-back errors within 500 ms won't re-shake, because `shaking` is already true.
- `aria-live` on the whole ladder will likely re-announce on every edit.
