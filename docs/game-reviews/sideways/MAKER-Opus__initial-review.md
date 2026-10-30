# Sideways review (inline, text-only)

**What I inspected:** only the text supplied in this message: `engine.mjs`, `app.mjs`, `shell.mjs`, `index.html` and `orientation-audit.json`. I had no access to `styles.css`, `puzzles.mjs`, tests or screenshots. I executed nothing and played nothing. Colour and layout claims below are therefore preferences, not observations.

## Proven issues (from source)

1. **No nudge confirmation, and the nudge count is hidden.** `hint()` in `app.mjs` applies `useHint` immediately. The board footer shows only shifts and checks; nudges first appear in the result dialog.
2. **"1 is perfect" is incomplete.** The `board-bottom` label in `index.html` says `checks · 1 is perfect`, but `getStats` and `formatShare` also require zero nudges. `board-note` states the full rule, so the two messages conflict.
3. **"Check board ↵" promises a shortcut that doesn't exist.** Neither file has an Enter handler. On a focused arrow button, Enter rotates the row instead.
4. **Focus is lost after some redraws:**
   - After a non-winning `check()`, `renderGame` disables `#shift-check` while it still has focus.
   - Undo does the same to `#shift-undo` when `history` empties.
   - Keyboard focus falls to `<body>` in both cases. Rotate and clue-follow restore focus correctly.
5. **Terminology drift.**
   - The result dialog says "shifts" and "nudges".
   - `formatShare` says "moves" and "hints".
   - `moves` includes nudges, so "3 shifts · 1 nudge" means only two manual shifts.
6. **Following can't be turned off.** Clicking the followed clue again keeps it selected (`aria-pressed` stays true) until a mode reset.
7. **`#column-reader` is `role="status"` and rewrites on every shift.** This likely double-announces alongside `announce()`; that part depends on the screen reader.

**Verified correct:**
- `feedbackCurrent` compares row strings, so period-equivalent orientations reuse feedback.
- Undo back to the last-checked arrangement shows ✓ again without costing a check.
- `checkBoard` rejects re-checks of an unchanged board.
- Only an explicit check can win.
- Undo never refunds counters.
- `restoreGame` re-derives `correct` and rejects `hints > moves`.
- Cross-tab saves adopt the first terminal daily result.
- `share()` blocks non-terminal states.

## Hypotheses / editorial

- **Difficulty risk, similar to Ringcount.** Clues are plain dictionary definitions of common five-letter words. Moves are free and current column words are always visible, so trial shifting may make the game easy. Boards with near-twins (149 PITCH/PINCH, 173 TRUCK/TRICK) are likely the most engaging. The audit proves encoded uniqueness only.
- **Unreachable spoiler path.** `formatShare`'s in-progress branch emits per-column ⬜/🟩. The UI can't reach it, but it contradicts the sharing policy.
- **Cross-tab edge case.** If another tab writes a malformed save, `storageChanged` would replace an in-progress board with a fresh one.

## Recommendations

1. **Nudge confirmation and a visible nudge count.**
   - `hint()` should open a dialog: "Nudge a row? Costs 1 move and 1 nudge. This board can no longer be Perfect. You still need to check."
   - The shell's `data-action` map is fixed, so this needs a small `config.actions` hook.
   - Add `<strong id="shift-nudges">` to `board-bottom` and change the label to "1 check + 0 nudges = perfect."
2. **Label current vs checked.**
   - Title the `#column-status` row "Current words".
   - Show visible "✓ matched at last check" (today it exists only in `aria-label`).
   - When `feedbackCurrent`, the disabled button should read "Checked · 2 of 4 match".
   - After a shift, add one line: "Last check expired — undo to see it again."
   - Keep `.following` a blue outline with no fill, and `.correct` a teal fill, so following never looks like correctness.
3. **Focus and keys.**
   - In `check()`, after `commit`, if `#shift-check` is disabled, focus `#puzzle` (it has `tabindex=-1`). Do the same for undo when history empties.
   - Remove the "↵" glyph rather than overriding Enter on arrow buttons.
   - Make the clue button toggle following off.
   - Drop `role="status"` from `#column-reader`.
4. **Readability (needs CSS and screenshots to confirm).** Use larger clue text and `.column-word` strings, a tight equal-width letter grid, and a blue/teal palette. `theme-color #f6f3ec` suggests a cream/paper base, which I couldn't verify.
5. **Sharing.**
   - Make `formatShare` use "checks · moves · nudges" and add the frozen `daily.dateKey` label.
   - Delete the in-progress branch and the decorative square row.
   - Generate a portrait/square PNG on a canvas from the same aggregate fields only: no letters, clues, words, rotations, history or URL.
   - Keep the native text bridge, then clipboard, then manual-copy textarea, and add a Blob download fallback.
   - "Perfect" stays exactly `checks===1 && hints===0`, with no move-based par claims.

## Provisional predictions (not James's ratings)

| Area | Score | Note |
|---|---|---|
| Fun | 3/5 | Risk of feeling easy |
| Clarity | 3/5 | 4 after recs 1–2 |
| UI | declined | No screenshots supplied |
| Replay | 3/5 | Depends on near-twin density |
| Sharing | 3/5 | Honest but plain text |

## Needs human playtesting

- Whether James solves typical boards by idle shifting (the Ringcount risk).
- Whether the expired-vs-current check state is understood without reading the help.
- Whether players notice the nudge costs.
- Phone tap-target size on the arrows.
- Whether following and checked highlights are distinguishable at a glance.
