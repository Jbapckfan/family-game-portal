# Hunch (game 12) static review

**Model:** Opus 5.5 (`claude-opus-5-5`).

**Inspected:** the source you pasted:
- `HunchBoard.tsx`, `HunchHelpModal.tsx`, `HunchPage.tsx`, `HunchWinModal.tsx`
- `engine.ts`, `progress.ts`, `useHunch.ts`
- `shared/{dict,integration,keyboard,stats,useDailySession,useGameOverlays}.ts`
- `index.css`
- the audit aggregates

**Not inspected (not supplied):** `shared/share.ts` (`copyText`, `dateLabel`, `todayDayNumber`, `useCountdown`), `daily.ts`, `practice.ts`, `effects`, `GameHeader`, `SimpleStatsModal`, `premium.ts`, `useUnifiedProgress`, `dialog.tsx`, `answers.json`, `dict.txt`, and the Tangle/Cairn/Morph share code.

**Not done:** I made no edits, ran nothing, played nothing and viewed no screenshots. Nothing left the provider.

I'm declining a visual UI score. The CSS findings below are about sizes and values only.

---

## 1. Verified vs. hypothesis

**Verified by reading the code:**
- **Duplicate-letter logic.** `evaluate` is a correct two-pass evaluation. Exact matches are taken first, then "present" is assigned left to right from the pool of unmatched answer letters.
- **Keyboard colors.** The best-known state per key can never show gray for a letter that is in the answer.
- **Restore rules.** `restoreHunchProgress` recomputes evals from the saved guesses and does **not** reject duplicate historical guesses. Any guess missing from the dictionary invalidates the whole save.
- **Practice stats.** Practice never touches stats. `markPlayed` returns early and `finish` only changes stats when the mode is daily.
- **Answer order is load-bearing.** The daily index is `publishedDailyIndex(day, ANSWERS.length, 937)`. If `answers.json` changes order or length, the calendar changes.

**Supplied claims I did not re-verify:**
- 937 unique answers
- 182 distinct dated selectors
- 59,049-pair oracle match
- 15,921 → 17,946 guesses

15,921 + 2,025 = 17,946 is consistent with a strict superset, but I have not seen proof that set containment holds.

**Hypotheses that need runtime tests:** marked **(H)** below.

---

## 2. Five highest-value changes

**1. Freeze finished rounds.**
- Add an ephemeral, never-persisted `freshFinish` flag. Set it only in `finish()`. Clear it on `startDaily`, on `startPractice`, and on cross-tab adoption.
- Gate confetti and the results auto-popup on that flag. Today both fire on every reload (`HunchPage.tsx:31-34`, `:18-20`).
- Mount the results modal only when it's opened, rendering from a cloned snapshot `{mode, dayNumber, puzzleNo, guesses, evals, won, hintsUsed}`.
- Derive the subtitle date from `dayNumber`, not `dateLabel()` (`HunchPage.tsx:44`).
- In the stats display, show the current streak as 0 when `lastCompletedDay < today − 1`. This is display only; stored stats are not rewritten.

**2. Input integrity.**
- **Blocked repeats:** a repeated word gets "Already guessed" and a shake, and costs nothing. Check this before `markPlayed`. Keep restore accepting historical duplicates.
- **Focus trap:** stop pointer clicks from leaving focus on on-screen keys (`preventDefault` on `pointerdown`). Tab focus keeps native behavior.
- **New practice round:** exclude today's daily index and the current practice index.

**3. Hint.**
- Two-step inline confirmation: "Reveal a letter?" → **Reveal** / **Cancel**. Cancel is free and is purely UI state.
- The confirm step calls the already-wrapped `actions.hint`, so DailySession guards still apply.
- Candidates should exclude letters already shown green **or gold**, de-duplicated.
- If nothing new remains, show "No new letter to reveal" and don't consume the hint.
- Copy: "Contains E — position not shown."

**4. Readability and palette (blue/teal, large type).**
- **Identity:** move it off mustard `#94701c` to teal/blue.
- **Status colors, separated by lightness:** correct = dark teal with white text; present = light sky blue with navy text and a strong border; absent = slate.
- **One palette everywhere:** grid, keyboard, help, results and PNG all use it.
- **Status marks:** show ✓ ↔ · on keyboard keys and result tiles too, not just grid tiles.
- **Minimum sizes:**

| Element | Now | Proposed |
|---|---|---|
| Tile letters | 25px | ≥28px |
| Keys | 16px | ≥20px |
| Enter | 10px | ≥14px |
| Tile marks | 10px | ≥14px |
| Legend | 12px | ≥15px |
| Footer | 10px | ≥13px |

- **Help:** label the example "Example — not today's word." Add a duplicate-gray row and make the gray copy match the legend ("absent / no extra copy").

**5. Sharing.**
- Use a frozen-snapshot share panel for both Daily and Practice, in portrait and square PNG.
- **Text share:** native text share first.
- **File share:** a separate button that shares a PNG pre-rendered when the panel opens, so the user-gesture activation isn't lost.
- **Copy:** download, plus copy that reports the real outcome, plus a selectable textarea fallback.
- **Content:** caption, frozen date, `No. N` or `Practice`, n/6 or X/6, clue use, and a status-only grid with marks.
- **Excluded:** answer, guess letters, hint letters, URL.

**Required lexicon change (your decision; implementation notes only):**
- Add a Hunch-only module such as `hunch/lexicon.ts`. Use it in `submit`, in `restoreHunchProgress`, **and** in the `dailySession.configure` validator.
- Leave `shared/dict.ts` untouched.

---

## 3. Risks of the proposals

- **Lexicon that isn't a superset is a critical risk.** If any old saved guess is missing from the new lexicon:
  - restore returns null and a fresh round loads;
  - the commit guard treats the invalid save as unfinished and overwrites it;
  - replaying a win then sets the streak to 1, because `lastCompletedDay === day`, not `day − 1`.

  Assert containment of all 15,921 old guesses in a test. The same failure can already happen today if anyone edits Cairn's `dict.txt`.
- **Lexicon content:** offensive words from ENABLE/Wordnik become valid guesses, so filtering is your call. Bundle size is roughly 100 KB raw (estimate). WWF/NASPA parity remains unverified.
- **Palette:** moving away from the genre's green/yellow convention costs familiarity. Teal vs. blue is a weak hue contrast for some color-vision types, so the lightness difference and marks must carry the meaning. Measure contrast; don't assume it.
- **Larger type:** six rows plus the keyboard may overflow 320×568 and 375×667 screens. Test those viewports.
- **`freshFinish`:**
  - It must not persist.
  - Adopting another tab's finish must not fire confetti.
  - Returning from Practice to a won Daily must not re-fire it (it does today).
- **Hint confirmation:** the confirm state must close on round change or tab adoption. Excluding gold letters can leave zero candidates, which needs the "No new letter to reveal" path.
- **Native shell (iOS WKWebView):** `navigator.share` with files and `<a download>` may not work. Without new infrastructure, the copy/textarea fallback is the safety net. Canvas rendering needs `document.fonts.ready` first.

---

## 4. Defects

### Critical

- **C1 (H, high likelihood) — answer flash on round switch.**
  - **Trigger:** the results modal is open and the user taps Practice while you wait, New practice round, or Back to today's puzzle, with motion enabled.
  - **Mechanism:**
    - The modal stays mounted while `answer` is set.
    - During the Radix exit animation, the content re-renders with the **new** round's props: `won=false`.
    - Because `won` is false, the modal shows `props.answer` (`HunchWinModal.tsx:56-58`).
    - That answer is the new practice word, or today's unfinished daily answer.
  - **Fix:** change 1.
  - **Test:** confirm with headless frame capture.

### Important

- **I1 — repeat guess costs a turn.** Trigger: submit a word you already guessed (`useHunch.ts` `submit`).
- **I2 — Enter retypes instead of submitting.**
  - **Trigger:** mouse-click an on-screen key, then press physical Enter.
  - **Mechanism:** focus stays on the clicked key. `isNativeEnter` returns early (`HunchBoard.tsx:51`), and the browser re-clicks the focused key. Space does the same.
- **I3 — confetti and results popup replay.**
  - **Triggers:** every reload of a won day; Practice → Daily; cross-tab adoption.
  - **Locations:** `HunchPage.tsx:31-34`, plus `resultReady = state.finished`.
- **I4 — wasted and accidental hints.**
  - **Wasted:** a hint can name a letter already shown gold, which gives zero information. Letters that appear twice are weighted double.
  - **Accidental:** there's no confirmation step, and the button sits just under the keyboard.
- **I5 — practice can serve today's daily answer.**
  - **Trigger:** New practice round from inside Practice passes exclude `-1` (`startPractice`), so today's daily answer (and the current word) can come up.
  - **Caveat:** the outcome depends on `practice.ts`, which I haven't seen.
  - **Separately (design risk):** practice draws from the daily bank, so it can spoil future dailies.
- **I6 — Copy feedback isn't truthful.**
  - The return value of `copyText` is ignored, so "Copied!" shows regardless of outcome (`HunchWinModal.tsx:31-35`).
  - If `copyText` rejects, the rejection is unhandled and the user gets no message.
  - Practice has no share option, the share has no date, and there's no PNG.
- **I7 — three inconsistent status palettes, one of them mauve.**
  - The grid, the help/keyboard root variables, and the results preview all use different colors. The results "gray" is `hsl(340 14% 60%)`, which reads as mauve/purple (`:72`).
  - Help text color contrast on the cream background (my estimate): gold ≈ 2.7:1, green ≈ 2.6:1. Both fail at 15px.
  - Result tiles, help tiles and keyboard keys carry no marks, so color is the only signal.
- **I8 — expired streak still displayed.** `loadGameStats` never expires `currentStreak`. Trigger: win, skip a day, open Stats. (Depends on whether `SimpleStatsModal` derives it, which I haven't seen.)
- **I9 — small type and brown chrome.**
  - **Type:** Enter label 10px, tile marks 10px, keys 16px, legend 12px, footer 10px.
  - **Colors:** the identity, stage and typecase colors are mustard/beige/brown, which you dislike.
- **I10 (H) — possible timezone mismatch.**
  - `todayDayNumber` may differ from `centralDayNumber`.
  - If it does, between local midnight and Chicago midnight (for players east of Chicago), `makeProgress` rejects the day and records nothing.
  - I need `share.ts` to confirm.
- **I11 — save validity is coupled to Cairn's dictionary.**
  - Today, Hunch saves are only valid while every saved guess stays in Cairn's dictionary (the latent risk in §3).
  - The Hunch-only lexicon removes that coupling.

### Minor

- **M1:** for up to about 30s after midnight, or longer if timers are throttled, the subtitle shows the new date over the old day's board, and that old round is still playable.
- **M2:** `actions` is a new object every render, so the keydown listener re-subscribes every render.
- **M3 (H):** `aria-live` on the whole grid likely announces every keystroke. Use a single status live region instead.
- **M4:** "Better luck tomorrow" appears on practice losses.
- **M5:** the keyboard's absent label says "or no additional copy". On the keyboard it just means absent.
- **M6:** help says "Gray = not in the word", which contradicts the duplicate rule in the legend.
- **M7 (H):** handlers read the render-time `ref` and set state from that snapshot, not via functional updates. Two inputs in the same task could drop a letter or submit twice.
- **M8:** an invalid save is silently replaced by a fresh round and then overwritten.

---

## 5. Test plan

Run headless with separate browser contexts; don't touch the one visible tab. Cover:

- **Restore:** reloading a won day and a lost day gives no confetti and no popup. A fresh finish still celebrates.
- **Lexicon migration:** all 15,921 old guesses restore. Historical duplicate guesses load. A blocked repeat changes neither guess count nor `played`.
- **Keyboard:** mouse click then Enter submits; Space does not retype; rapid double Enter submits once.
- **Hint:** cancel is free. Hints never name a gold or green letter. Two-tab race on the hint.
- **Round switching:** capture frames with animations on during Practice ↔ Daily switches and check for answer flash.
- **Two tabs:** guess in tab A, type in tab B; finish in A while B is mid-row.
- **Midnight:** rollover mid-round.
- **Sharing:**
  - Copy-failure path shows the textarea.
  - Share text and PNG contain no letters and no URL.
  - The date stays frozen across midnight.
- **Viewports:** 320×568 and 375×667 with no overflow.

---

## 6. Subjective predictions (mine, not James's)

These are 1–5 guesses from reading code, not player data.

| Dimension | Current code | If the five changes land |
|---|---|---|
| Fun | 3 | 3.5 |
| Clarity | 3 | 4 |
| UI (visual) | declined — no images viewed | declined |
| Replay | 3 | 3 |
| Shareability | 2 | 4 |

Replay stays flat because the mechanics are deliberately unchanged until James playtests.
