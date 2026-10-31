# Circuit (game 13) review: Alford Daily

**Basis:** This is a static reading of the supplied Circuit source, the shared helpers and the audit aggregates. I modified nothing and ran nothing (no scripts, tests, builds or network). No screenshots were supplied, so I decline to give a visual UI score. The puzzle-integrity numbers are the supplied audit's, and I did not re-execute them. Common-list membership says nothing about whether humans know the words or enjoy them. Nothing below reveals a current-board solution.

---

## 1. Static predictions (1–5), from code only, not measured

| Axis | Prediction | Basis and limitations |
|---|---|---|
| Fun | **3** | The coverage-in-fewest-words structure is solid. Par is 3 on 230 of 286 boards and 2 on 56, and the audit says par is proven minimal, so gold is fair. Fun is held back by a single clue that mostly acts as a spoiler and by the unconfirmed failure paths. No playtest data exists. |
| Clarity | **3** | The help modal explains the rules clearly. Arc identity relies on color plus a 9px numeral. "Beat par for gold" is wrong: gold is *at* par, and beating par is impossible. The 3+-letter rule and the no-repeat-word rule are only discovered through error toasts. |
| Visual UI | **Declined** | No image was viewed. The geometry notes below are computed from CSS, not observed. |
| Replay | **3** | 286 practice boards and 182 distinct dated layouts. The same practice board can come up twice in a row. Each board has one fixed canonical route, so the post-game "best route" teaches less on repeats. |
| Share | **2** | The share is a static text string. It carries the puzzle ID and no date, ignores hints, shows the same emoji bar for every completion, and has no Practice share and no image. |

**Input for the verdict, not a verdict:** The rules described in `CircuitHelpModal.tsx` match the NYT's *Letter Boxed* almost one-for-one, with a ring in place of a square:
- 12 letters on four sides of three
- consecutive letters must come from different sides
- each word starts with the previous word's last letter
- cover all letters in the fewest words

Many players will recognize it. That matters for how distinctive the 32-game collection feels. I am not proposing rule changes, as you asked, and this is not a legal opinion. Since every fix below assumes Circuit stays, I'd settle this question before an implementation pass.

---

## 2. Your supplied claims, checked against the code

| Claim | Status | Evidence |
|---|---|---|
| Clue, reveal and restart have no confirmation | **Confirmed** | `useCircuit` `hint`, `giveUp` and `restartChain` act immediately. The buttons in `CircuitBoard` call them directly. |
| Restoring a won game re-celebrates and re-opens the popup | **Confirmed** | `CircuitPage.tsx:32-35` fires confetti whenever `finished && !gaveUp` changes, including restore after a reload. `useGameOverlays(roundKey, state.finished)` schedules the results popup after 900 ms. This also fires on Back-to-daily and after adopting a save from another tab. One nuance: going from a finished practice round back to a finished daily leaves `finished` and `gaveUp` unchanged, so confetti does *not* fire but the popup does. The behavior is inconsistent. |
| Date uses live `dateLabel()` | **Confirmed** | `CircuitPage.tsx:45` calls `dateLabel()` with "now", not `state.dayNumber`. |
| Practice can repeat immediately | **Confirmed at the wrapper level** | `startPractice` only excludes a board when leaving daily mode (`cur.mode === 'daily' ? puzzleNo-1 : -1`). Practice → new practice excludes nothing. `practice-calendar.mjs` was not supplied, so I can't rule out that it filters internally. |
| Share copy ignores the real result, has no Practice share or PNG, and no date | **Mostly confirmed** | `buildCircuitShare` (`engine.ts:53-57`) does use the real word count, par and `gaveUp`. It ignores hints, mode, date and actual coverage on reveal: the bar is always 12 colored cells, or 12 ⬛ on reveal. Copy is offered only for daily. There is no image path. |
| Premium is disabled | **Confirmed** | `premium.ts` returns `false`. The clue label reads "1 free" / "used". |

---

## 3. Findings

### Critical

**C1. One tap on "Reveal route" permanently forfeits the Daily and the streak.**
- **Trigger:** Any tap, click, or Enter on a focused "Reveal route" button during a Daily.
- **Evidence:** `giveUp` → `finish(..., true)` sets `currentStreak: 0` and persists `finished: true, gaveUp: true`. `makeProgress` then writes `records[dateKey] = 'revealed'`, and the first non-playing status is never overwritten. Nothing can undo it.
- **Aggravating factor:** It sits right next to "Route clue", in the same `btn3d-soft` style and size, in the same row.
- **Fix:** Add a confirm step on Daily that states the consequences: "Ends today's Circuit, records it as revealed, resets your streak." Move Reveal visually away from Clue. Practice can use a lighter confirm.

### Important

**I1. Restart chain wipes every played word with no confirm and no undo.**
- **Trigger:** A mis-tap with at least one word played.
- **Evidence:** `restartCircuitChain()` returns empty `played` and `current`. "Undo word" is disabled afterward because `played.length === 0`.
- **Fix:** Either confirm, or keep a one-step snapshot and show an "Undo restart" toast. The second option is less friction.

**I2. Route clue spends the only clue instantly, partly spoils the board, and may not fit the player's position.**
- **Trigger:** Tapping Route clue.
- **Evidence:**
  - `hint` increments `hintsUsed` with no confirm.
  - It reveals `sol[0]`, the first word of the canonical route, whatever the player has already built. If their chain diverges, the clue is useless until they restart, and the UI never says so.
  - The persistent clue renders at **10px** inside the dial (`.circuit-readout .text-muted-foreground`).
- **What is already right:** The count persists for Daily and survives undo and restart, so it can't be farmed.
- **Fix:**
  - Confirm on Daily ("Use your one clue?").
  - If `played` isn't a prefix of `sol`, add the line "This route starts fresh. Restart chain to follow it."
  - Render the clue below the ring at 15px or larger.

**I3. Reloading a finished game re-celebrates it.** This is C-adjacent in feel but not destructive.
- **Trigger:** Reload, Back-to-daily, or cross-tab adoption of a finished Daily.
- **Evidence:** See §2. `sfx.win()` correctly fires only inside `finish()`, but confetti and the popup don't follow the same rule.
- **Fix:** Set a `freshFinish` ref inside `finish()`. Fire confetti and auto-open the popup only when it is set, then clear it. Restored rounds should show "See results" silently.

**I4. The share text is dishonest and leaks the puzzle ID.**
- **Evidence:** `CIRCUIT No.${puzzleNo}` is a board index, which your requirements exclude. The text has:
  - no date
  - no Daily/Practice label
  - no hint count
  - a revealed share showing `⬛ 0 words` and 12 ⬛ whatever was actually lit
  - 🟧 and 🟪 emoji
- **Fix:** See improvement 3.

**I5. The copy feedback claims "Copied!" even when nothing was copied.**
- **Evidence:**
  - `copyText` resolves the same way on native share, clipboard success, and fallback failure. The return value of `execCommand` is never checked.
  - On iOS, `nativeMessage` returns true as soon as the message is posted. The share sheet may then be cancelled, yet the UI still says "Copied!".
  - The fallback textarea isn't `readonly` or positioned off-screen, which can cause a scroll jump or keyboard flash on iOS. That last point is a hypothesis.
  - The native payload reads the slug from `dataset.gameId` rather than a canonical `'kimi-circuit'`.

**I6. The palette breaks your color preferences.**
- **Evidence:**
  - `CircuitBoard.tsx:6-7` uses `#a65d37` (rust/brown), `#737a42` (olive), and `#8a587a` (plum/purple), plus one teal.
  - The unlit coverage track is pinkish `hsl(340 18% 82%)`.
  - `engine.ts:38-39` exports a *second*, conflicting orange/green/blue/purple palette. It isn't used by the supplied board; other importers are unknown.
  - The share emoji include 🟪.

**I7. There is no physical-keyboard input.**
- **Evidence:** None of the supplied Circuit files register a `keydown` handler, and `shared/keyboard.ts` `isNativeEnter` is unused here. A desktop player must Tab through 12 nodes per letter or use the mouse.

**I8. Several elements are too small for large-text readability.**
- **Evidence:**
  - Arc numerals are 9px.
  - The route clue is 10px.
  - The footer is 10px (`.kimi-page>footer`).
  - Board buttons are 12px, or 11px under 380px wide.
  - Chain pills are 14px.
- Hunch already overrides some of these sizes and Circuit does not.

**I9. Erase and Delete controls are icon-only, and Erase also removes the auto-seed.**
- **Evidence:** They are `Eraser` and `Delete` icons with labels only in `aria-label`. `clearWord` empties `current` including the seeded letter, so the player must find and re-tap it.

### Minor

| ID | Issue | Trigger / evidence |
|---|---|---|
| M1 | Header date can disagree with the board | After Central midnight and before rollover (≤30s on a visible page, longer if the page was hidden), any re-render shows the new date next to the old "No." |
| M2 | Long words break mid-word in the dial | The readout has `overflow-wrap:anywhere` at 22px with `max-width:46%`, about 9 characters per line on a 360px phone (computed). |
| M3 | Nodes crowd together on ≤340px screens | Computed at 320px viewport: dial 240px, node centers 96px from center, center-to-center about 50px for 48px nodes, leaving a ~2px gap. Mis-taps are a hypothesis. |
| M4 | Arc numeral sits on the circle's edge | The `bottom-1 right-1.5` corner on a 48px circle lands about 27px from center, past the 24px radius. Partly off the fill (computed; not seen). |
| M5 | Help copy is inaccurate in places | "Beat par for gold" (gold is at par); "midnight" is Central time; the 3+-letter and no-repeat rules are never stated. |
| M6 | Local streak can go stale | `kimi:circuit:v1:stats` `currentStreak` isn't decayed after a missed day. Integration `recordStatistics` is correct, so the two can disagree. `SimpleStatsModal` wasn't supplied, so what it actually shows is unverified. |
| M7 | Two counting systems disagree on "played" | Local stats count a day at the first word. Records count it only at finish. |
| M8 | Shake doesn't repeat on a second error | A second error during the 500 ms shake leaves `shaking` true, so the animation doesn't restart. |
| M9 | Accessibility gaps | `aria-description` has patchy support. `aria-live` on the readout announces every letter. |
| M10 | Results columns can overflow | Results words use `tracking-widest` with no wrap, so very long words may overflow the half-width column. Hypothesis. |
| M11 | `submit` doesn't re-check the chain-start rule | Not reachable today because `tapLetter` enforces it at `cur.length===0`. Worth adding as defense in depth. |
| M12 | Code tidiness | `onPractice` and `onNewPractice` are identical. The `ARC_*` constants are declared between imports. |

**Stale-commit guard and rapid input:** I traced this and found no concrete bug. Every action goes through `DailySession.actions` → `before()`. A `commit` interrupted inside `markPlayed` aborts the action before `setS`. Actions read `ref.current`, which is refreshed on each render. React 18 flushes discrete-event updates before the next event, so consecutive taps should see fresh state. That last point is a **hypothesis, not tested**. Any new keyboard handler must use the same wrapped actions.

---

## 4. Evidence versus hypotheses

**Verified from code:** C1, I1–I7, I9, M1, M5, M7, M8, M11, M12, and every row in §2 except the practice-calendar internals.

**Computed from CSS, not observed:** I8 sizes, M2–M4, and contrast estimates. White on the current arc colors works out to roughly 4.6–5.5:1, which is borderline on olive and rust. Dimmed nodes at 0.58 opacity come out around 4.3:1.

**Hypotheses needing a device or other files:**
- iOS clipboard fallback behavior
- mis-tap rates on narrow phones
- what `SimpleStatsModal` displays
- whether `practiceCandidates` excludes future dailies
- behavior of `publishedDailyIndex` beyond the 182 dated days
- React flush timing under rapid input

---

## 5. Five worthwhile improvements, in priority order

1. **Make the destructive actions safe.**
   - Daily Reveal: a consequence-stating confirm dialog.
   - Daily Clue: a confirm.
   - Restart: an "Undo restart" snapshot toast.
   - Separate Reveal from Clue: put it in its own row with a muted outline style.
   - Route the confirm through `useGameOverlays` (one modal at a time), or make it an inline two-step control so it can't collide with a pending results popup.

2. **Restore silently and celebrate only fresh finishes.**
   - Add a `freshFinish` ref, set in `finish()` and cleared after it is used.
   - Gate confetti and the auto-open popup on it.
   - Restored, back-to-daily and adopted rounds show only the "See results" button.

3. **Build an honest share pipeline from a frozen result** (a new function, so other games' `copyText` is untouched).
   - Freeze the result at finish. Never include letters, words, route, puzzle ID or URL. Example output:
     ```
     Circuit · Daily · Sat, Oct 31
     🥇 3 words · par 3 · no clue
     Lit 12/12 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦
     ```
     Practice uses the "Practice" label with no date or ID. A revealed game reads "Route revealed · 2 words · par 3 · 1 clue · Lit 9/12" with 9 🟦 and 3 ⬜.
   - Take the date from `dateForDayNumber(state.dayNumber)`, formatted with `timeZone:'UTC'`. The day number is the UTC midnight of the Central date, so formatting in Chicago time would show the previous day.
   - Try native first via `nativeMessage({type:'share', slug:'kimi-circuit', text})` and report "Opened share sheet", not "Copied".
   - Otherwise use the clipboard and say "Copied" only when it succeeds.
   - On failure, say "Couldn't copy" and show a selectable read-only textarea.
   - Optionally add a PNG that follows the existing share-panel pattern: large teal text, the same fields.
     - Pre-render the blob when the modal opens so `navigator.share({files})` runs inside the user gesture.
     - Use `canShare` before sharing files.
     - Treat `AbortError` as a neutral cancel.
     - Fall back to downloading through a blob URL, then revoke it.

4. **Fix readability and palette while keeping four numbered arc identities.**
   - Use four cool, luminance-separated arc colors, for example deep cyan `#1d6f8a`, blue `#2f5fb3`, sea green `#23806b`, and slate `#4a5f78`. Verify each with a contrast tool before shipping.
   - Draw a tinted arc segment behind each group of three nodes.
   - Make the arc numerals 12–13px badges inside the circle.
   - Use a cool gray for the unlit coverage track.
   - Replace the share emoji.
   - Move the route clue below the ring at 15px or larger.
   - Shrink the readout font for long words instead of breaking mid-word.
   - Give Erase and Delete visible text labels.
   - Set the footer and buttons to at least 13–14px.
   - Enlarge the dial or shrink the nodes slightly at ≤340px.
   - Remove or reconcile the dead `engine.ts` palette after checking its importers.

5. **Add keyboard input.**
   - Letter keys pick the matching ring letter. Backspace deletes, Enter plays the word, and Escape erases.
   - Ignore keys while a dialog is open, when modifiers are held, during IME composition (`isComposing`), on Enter auto-repeat, and when `isNativeEnter` applies.
   - Dispatch only through the wrapped `actions`, so the stale-commit guard still applies.
   - Letters not on the ring give the normal error feedback.

**Smaller targeted fixes:**
- Freeze the header date from `dayNumber`.
- Exclude the last practice board as well as today's daily. `practiceCandidates` already accepts `excludeIndices[]`, so add an optional extra parameter to the wrapper without breaking other callers.
- Correct the help copy.
- Show "1 clue used" in the results.
- Add a chain-start check in `submit`.

---

## 6. Risks of these changes and what to preserve

- **Saves (highest risk).** `restoreCircuitProgress` rebuilds only known fields, so any new persisted field is dropped on restore. If a field becomes *required*, old saves fail validation and return `null`. The persist effect then overwrites the finished save with a fresh round, which allows replaying and double-counting `completed` and the streak. New fields must be optional and ignored when absent.
- **Puzzles and dictionary.** Don't touch `puzzles.json` ordering, `withReviewedWords`/`SUPPLEMENTAL_WORDS`, or the `publishedDailyIndex(day, len, 286)` arguments without independent proof. Changing them shifts the dated selections and can invalidate saved `played` words, which triggers the overwrite above.
- **Storage keys and scoring.** Keep these unchanged:
  - storage keys `kimi:circuit:v1:day:N`, `kimi:circuit:v1:stats`, `kimi-circuit:v1:records`, `kimi:circuit:seen-help`
  - medal thresholds
  - the arc and chain rules
  - the rule that the first recorded status wins
  - the 286-board count and the 32 dailies plus bonus

  Changing them breaks history or comparisons between players.
- **Shared helpers.** `copyText`, `useGameOverlays` and `choosePracticeIndex` serve other games. Add new functions or optional parameters instead of changing existing signatures.
- **Confirms and overlays.** A confirm dialog has to cooperate with the one-overlay rule and the pending-results cancellation. A badly wired one could swallow the results popup.
- **Palette.** Four cool colors are easier to confuse, including under color-vision deficiency, than the current hues. The numbers and arc segments have to carry the identity. Re-check contrast for lit, unlit and dimmed (0.58) states.
- **Keyboard.** It can conflict with header shortcuts, focused buttons and mobile soft keyboards.
- **Share format.** Dropping "No." changes how players compare results, though the date-based label is the intended replacement. A native share can't report its outcome, so never claim it succeeded.
- **Out of scope.** No paid API, dependency, model, deploy or infrastructure changes are needed for any of the above.

**Limitations of this review:** Static reading of the supplied files only. No screenshots, playtesting, population data or execution. `GameHeader`, `SimpleStatsModal`, `ToastHost`, `practice-calendar.mjs`, `daily.ts` and `puzzles.json` were not supplied, and the claims that depend on them are marked as hypotheses.
