# Second Sense review (inline Opus, no tools)

**What I inspected:** only the text pasted into this message: `engine.mjs`, `app.mjs`, `shell.mjs`, `index.html` and `meaning-audit.json`. I did not see CSS, `puzzles.mjs`, the runtime modules, tests, contentnotes or any screenshots. I ran nothing. Because I have no CSS or images, I can't judge readability, colour (blue/teal), touch targets or scroll feel, and I'm not giving a visual score.

## Proven from the code

1. **The hint has no confirmation.** `hint()` (`app.mjs`) commits on the first click, and that permanently removes Perfect.
2. **Screen readers never hear the hint.** The card's `aria-label` overrides its content, so the `<small>✦ B · 4 letters</small>` text is not exposed.
3. **A correct move can wipe the draft when another tab wins the race.** `check()` clears `nounId`, `verbId` and `draft` and calls `rememberDraft()` before `app.commit()`. If `save()` then adopts a newer save from another tab, the move is discarded ("try your move again"), but the selections and typed word are already gone from sessionStorage. Wrong checks are unaffected.
4. **Share squares carry no information.** `share()` requires a finished board, so the ⬜ branch can never appear. A win always shows 🟩×5 and a reveal always shows 🟨×5.
5. **After a reveal, every word says "revealed".** `renderGame` labels all placements that way, including ones the player solved. The save format can't tell them apart.
6. **Probable focus loss after the result dialog.** On a win, the Check button is hidden, so focus likely falls to `<body>`. `openDialog` stores that as `lastFocus`, and `<body>` passes the guard in `closeDialog`, so the intended fallback to `#results-button` never runs. This should be confirmed in a browser.
7. **Enter does nothing until both clues are selected.** The submit button is disabled, which blocks implicit form submission, so pressing Enter after typing gives no feedback.

Things that look correct: normalization (trim, letters only, 2–18 characters, uppercase), free rejection of invalid input, `restoreGame` validation, a hint's first letter and length coming from the authored word, streaks resetting on reveal, and the share text containing no words or URL.

## Co-board ambiguity

I checked these overlaps by hand against `boardWords`. A dictionary or human tester needs to confirm each one.

- **CHECK and STEM (boards 027, 162, 207):** the STEM verb clue says "Stop or **check** the flow." CHECK is on the same board and genuinely fits "stop/restrain." The clue contains a valid co-board answer.
- **PORT and DOCK (board 012):** "Landing place for ships" plus the PORT verb clue is satisfied by PORT. The player gets "verb-only" for a dictionary-valid answer.
- **CONDUCT and LEAD (boards 070, 159):** "conduct" also means to guide someone ("conducted tour"), so it fits the LEAD verb clue.
- **MINE and QUARRY (boards 029, 146, 178):** "Extract ore" and "Extract building stone" are near-synonyms on the same board.
- **BOLT and SWALLOW (boards 048, 137):** I believe Merriam-Webster lists *bolt* as "swallow hastily."
- **BARK and HAWK (boards 077, 107, 197):** *bark* as "advertise by outcry," as a carnival barker does.
- **BAT and CLUB (boards 018, 109, 185):** the BAT verb clue says "with a **club**," and the two verb clues are interchangeable.
- **PITCH and FIELD (boards 089, 134):** PITCH means a playing field in British usage.
- **Weaker cases (misdirection, not valid alternatives):**
  - BOARD's verb clue mentions "bus" (boards 088, 116, 209).
  - BUS's verb clue mentions "tables" (board 014).
  - PLANT's noun clue mentions "roots, stems" (board 013).
  - OBJECT and CONTEST verbs overlap (boards 082, 115, 203).
- **US spelling dependence:** CHECK rather than cheque, DRAFT rather than draught.

The recovery feedback ("noun-only"/"verb-only") makes all of these survivable, but each one costs a check and therefore Perfect for an answer that is arguably correct. Adding alternate `answers` doesn't help, because it would lock the wrong pair. The only real fix is rewording the clue. **James needs to decide** whether clue text counts as part of the frozen bank. IDs and pair structure would not change.

## Recommended fixes

1. **Hint confirmation without touching the shell** (`hint()` and `select()`).
   - Add a `hintArmed` id. The first press changes the label to "Show hint? Ends Perfect."
   - A second press on the same noun commits the hint.
   - `select()`, input and `check()` disarm it.
   - Separately, add `, hint: starts with B, 4 letters` to the card's `aria-label`.

2. **Clear the draft only after the commit is confirmed** (`check()`).
   - Call `rememberDraft()` with the current values, then call `app.commit()`.
   - If `result.accepted && app.game === result.state`, clear the selections and draft, call `rememberDraft()`, then render again and move focus.
   - On adoption, the restored draft from sessionStorage survives.

3. **Clarify invalid input** (`check()`, `!changed` branch). Branch on `result.reason`: "Letters only, one word" versus "Pick a noun and a verb." Keep the button enabled when a word is typed but a clue is missing, so Enter explains what's needed.

4. **Fix focus after closing a dialog** (`closeDialog`). Treat `lastFocus === document.body` as missing, so focus goes to `#results-button` or `#puzzle`.

5. **Make sharing spoiler-proof by construction.**
   - Add `shareSummary({mode, number, dateKey, attempts, hints, outcome})` and derive both the text and the image from it.
   - It must take no `puzzle` argument. Use the played `daily.dateKey`/number, or "Practice" with no index (an index identifies the board).
   - Outcome is one of Perfect / Solved / Revealed, with checks and hints before the reveal.
   - Drop the squares, or replace them with a single outcome glyph.
   - Render a 1080×1350 or 1080×1080 canvas in the teal palette.
   - Share order:
     1. Native bridge first, text unchanged.
     2. `navigator.canShare({files})` and share the image.
     3. If the user cancels (`AbortError`), stop with no fallback.
     4. On any other error, copy the text.
     5. If copying fails, show the textarea plus a download link.

## Hypotheses that need devices or play

- **Phone scrolling:** a long scroll from the clue cards to the composer; selecting a clue never scrolls.
- **Focus after a correct check:** it moves to the first noun with `preventScroll`, which may leave the focused card off-screen on phones.
- **iOS zoom:** focusing the input may zoom if its font size is under 16px (CSS not seen).
- **Duplicate announcements:** `#feedback` (`role=status`) and `#announcer` may both speak.
- **Theme colour:** the `theme-color` value `#f6f3ec` is warm cream, which works against the blue/teal goal.

## Preferences

- The reveal title "Another meaning found." reads like a success; "Board revealed." would be more honest.
- After a hint, focusing the input may suit players better than focusing the clue.

## Replay reality

There are 75 pairs, each clue appears 14 times with identical wording, and each board draws from one of three 25-word themed groups. After a few weeks, play shifts from reasoning toward recall. Recombination doesn't change that.

## Predicted scores (my guesses, not James's ratings)

| Category | Score |
|---|---|
| Fun | 3.5 |
| Clarity | 3.5 (3 on the flagged boards) |
| UI | declined (no screenshots or CSS) |
| Replay | 2.5–3 |
| Sharing | 2.5 now, about 3.5 with fix 5 |
