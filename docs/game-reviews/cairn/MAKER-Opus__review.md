# Cairn review (Opus): source-only, provisional

**Scope.** I read only the text supplied inline: `CairnPage`, `CairnTower`, `GameBoard`, `HelpModal`, `StatsModal`, `WinModal`, `engine.ts`, `progress.ts`, `storage.ts`, `useGame.ts`, the shared `dict`/`integration`/`share`/`useDailySession`/`useGameOverlays` files, `index.css` and `anagram-audit.json`. I ran nothing, wrote nothing, used no tools and saw no screenshots.

This is source inspection, not play. The 153 passing tests and the audit figures are reported results that I did not re-run. Kimi remains the author; these notes are for the Alford integration only.

## Provisional predictions

These are my estimates, not James's ratings.

| | 1–5 | Basis |
|---|---|---|
| Fun | 3 | A solid build-up anagram ladder. Any valid word counting removes most frustration. |
| Clarity | 3 | Rules are clear. Give-up cost, hint meaning and the previous word are not. |
| UI | **declined** | No images were supplied. The width findings below come from CSS arithmetic only. |
| Replay | 3 | 839 chains and 553 canonical words cover six months. Three-letter starters recur. |
| Sharing | 2 | Text only, no date, no native bridge, a false "Copied!", and no Practice share. |

## Findings (verified in source)

**1. The result illustration and its effects.** I agree with James's "really dumb" verdict; the source explains it.
- **Colours:**
  - `CairnTower` stones include khaki `#9a8762`, mauve-brown `#927b73` and purple-grey `#7b7d94`.
  - The flag pole is `hsl(340 28% 30%)` (maroon) and the flag is orange.
  - The ghost stone border is pink, and the empty pebble is pink.
  - The loading stack uses bright blue, green, orange and pink.
- **Duplication:** `WinModal` shows the status three ways: the tower, an emoji column beside each word, and a second `text-2xl` emoji row.
- **Repeated effects:** `CairnPage.tsx` calls `fireConfetti()` whenever `state.finished` becomes true. That includes restoring an already-finished daily (every revisit), returning from Practice, and "Stack finished" results with skipped levels.
- **Unverified:** `anim-sway` is not defined in the supplied `index.css`, so I can't tell whether it moves anything.
- **Proposed fix (Cairn files plus `.kimi-cairn` CSS only):**
  - Use one static five-stone mark on a teal/blue ramp (`--identity` `#39766f` stepping toward `--sky-face`).
  - Clean levels are solid stones, assisted levels are lighter teal with an outline, and skipped levels are a dashed hollow outline (no brown-grey).
  - Delete the flag SVG and the sway. Drop the big emoji row and replace the per-word emoji with short labels.
  - Fire confetti only on a fresh, unskipped daily finish, and never on restore.
  - Recolour the board pebbles and legend to the same stone language. Right now the board uses three vocabularies: emoji, pebbles and stones.

**2. Destructive daily inputs have no confirmation.**
- "Give up" sits next to "Hint" with identical `btn3d-soft` styling. One tap forfeits the summit and streak after 1.3 seconds.
- Hint silently removes Perfect.
- The help text says "finish it to grow your streak", but finishing with a skip resets the streak.
- **Fix:**
  - Use a two-step Give up for daily play ("Reveal the word? This ends today's summit and streak").
  - Show a first-hint notice that Perfect will be lost.
  - Correct the help copy.
- Also, the premium path (`isPremium()`) allows `len−2` hints but displays "∞". That contradicts the stated rules and the no-paid-routes requirement, so remove it from Cairn.

**3. The previous word and the added letter disappear.**
- No accepted word is shown during play.
- A give-up reveal lives only in a 1.9-second toast.
- After a reload, `startDaily` sets `newLetterIdx: null`, so the new-letter highlight is lost. It can be recomputed: use `addedLetter(words[level-1], words[level])` and find that letter's first free rack index.
- **Fix:** show a quiet line above the slots ("Last: RATE + **S**").
- The canonical words include names and abbreviations (`angeles`, `charles`, `claire`, `maine`, `nam`, `nat`, `cal`, `col`, `sen`, `les`). Revealing "The word was NAM" is jarring. If James approves, display a bundled common-list alternative instead. Every level has one, per the audit, and the multiset is unchanged.

**4. Statistics.**
- `StatsModal` shows the stored `currentStreak`, which only resets when the next game finishes. After a missed day it shows a stale streak.
- The hub's `recordStatistics` decays correctly, so the two can disagree.
- `totalMisses` is stored but never shown.
- **Fix:** derive the displayed streak with the same decay rule, `lastCompletedDay >= today-1`.

**5. Sharing correctness.**
- `WinModal.copy` bypasses `copyText`/`nativeMessage`.
- It ignores `execCommand` failure and still shows "Copied!".
- It has no date and emits the per-level emoji pattern the brief excludes.
- **Fix:**
  - Freeze a snapshot at the moment of finishing: `{kind, dateKey, puzzleNo}` or Practice, plus solved/assisted/revealed counts, total misses/hints, and an honest outcome.
  - Use a Cairn-local helper: native text first, then clipboard with a checked fallback, and show "Copied" only on real success.
  - Offer portrait and square PNGs of the abstract mark via `navigator.share({files})`. Treat a cancel (AbortError) as silent, and fall back to download plus a manual caption.
  - Add Practice share.
  - A skipped finish should read "Stack finished · 3 of 5 solved".
  - The 30-second rollover can close an open result and change `puzzleNo`, so the snapshot must keep the finished day's identity.

## Notes

- **320 px phone (arithmetic only):**
  - The board's inner width is about 264 px.
  - The rack is 7×44 px plus gaps, about 356 px, so a 7-letter rack wraps 5+2 under a single slot row. Use `flex: 0 1 44px; min-width: 0` like the slots.
  - The progress row totals about 263 px, which is right at the edge.
  - The legend is 10 px.
- **Rust new-letter tile:** `#a85439` may read as brown to James. A cream tile with a heavy sky-blue border would avoid that.
- **Stale-session guard:** this is reachable as written. `advance` calls `before()` itself, the actions are wrapped, and `markCountedPlayed`'s commit throws inside the action depth. I found no ordinary-UI path around it. `restoreCairnProgress` rejects tampered saves.
