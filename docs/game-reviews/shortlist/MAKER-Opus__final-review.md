# Shortlist final source review: inline-only scope

**Scope.** I read only the sources pasted in this message: `engine.mjs`, `app.mjs`, `shell.mjs`, `share-card.mjs`, `engine.test.mjs`, `share-card.test.mjs`, `scripts/review-shortlist.mjs`, and `DESIGN.md`. I did not see `index.html`, `styles.css`, `puzzles.mjs`, `deepseek-runtime/*`, or the iOS/sync scripts. I ran nothing and rendered nothing. The 44px/18px/17px sizes, blue/teal styling and the 210/2,520 validation are your supplied facts, not things I verified. My earlier report's CSS claims (terracotta palette, target sizes) had no source behind them. Please disregard them.

## Critical

None found.

## Important

**1. Backspace/Escape can drop focus when the focused control becomes disabled.** This contradicts the "Backspace/Escape retain focus" change.

- **Trigger:** use a scan hint. `applyHint` selects the suggested pair and focuses `#scan-button` (`app.mjs`, `applyHint`). Then press Backspace.
- `selected.pop()` leaves one letter. `render` then sets `#scan-button.disabled = true` because `selected.length !== 2`.
- The re-focus logic only handles letter or candidate targets. So focus is either lost to `<body>` or left on a disabled button, depending on the browser.
- The same happens with focus on `#clear-letters` when the last letter is removed.
- The browser script only tests Backspace with focus on a letter key, so it misses this.
- **Fix:** if `document.activeElement` is disabled after render, focus the last remaining selected letter key, or the first enabled one.

## Minor (concrete)

**2. Win copy makes unchecked claims.**
- "One word left standing." appears for every 3-scan win.
- "A few good questions." appears for every win with at least one scan.
- **Trigger:** spend three uninformative scans (pairs that put every word in the same count group), then guess right. The title claims uniqueness that was never established.
- **Fix:** base the copy on `possibleWords(puzzle, {scans}).length === 1`. The zero-scan copy is factual.

**3. Stale hint letters are pre-selected after reload.**
- **Trigger:** take a hint before scan 1 (say it suggests X+Y). Scan a different pair, then reload or switch Daily→Practice→Daily.
- `restoredHintKey` was reset, so `renderGame` re-selects X+Y and the button reads "Scan X + Y ↗".
- That advice was computed for zero scans and may no longer be useful. The preview text is honest ("before your first scan"), but the pre-selection presents the hint as current.
- **Fix:** only pre-select when `savedHint.scanCount === game.scans.length`.

**4. Typing a letter from outside the letter bank focuses "A", not the typed key.**
- `chooseLetter` renders and focuses the typed key.
- `showComposer()` then runs and focuses the first enabled letter button.
- **Trigger:** focus a candidate word and type `M`. Focus lands on `A`.

**5. A browser-script assertion is vacuous.**
- `(await saved())?.hints||1` equals 1 even if the save is null or has `hints: 0`.
- `saved()` also re-reads the bytes the test just wrote. Nothing commits after reload, so it never exercises `restoreGame`.
- The `#hint-preview` "original advice was not saved" assertion does cover the behavior. Replace the vacuous line with a check after a real commit.

## Narrow hypotheses (depend on files not supplied)

- **Hint focus override.** After "Use my hint", `closeDialog`'s rAF fallback runs `$('puzzle').focus()`, because the hint button is now disabled. If `#puzzle` has a `tabindex` in `index.html`, this would steal focus from the scan button that `applyHint` just focused. If it has no tabindex, the call does nothing.
- **Enter on a letter key.** Enter on a focused letter key with two letters already selected scans instead of toggling that letter. This looks intentional; noted only as a keyboard expectation question.

## Verified by reading (not by running)

- **Scans:** the count is presence of 0/1/2 distinct letters. Reversed duplicates are rejected without cost, and the budget is enforced.
- **No automatic elimination:**
  - `possibleWords` ignores `eliminated`.
  - Scans never touch `eliminated`.
  - Crossed-off words can't be picked in Pick mode.
- **Hints:**
  - `findHint` and `solveDecisionTree` receive candidate words and scans only, never `answer`.
  - The first hint requires confirmation.
  - With 3 scans used, the hint button opens a free reminder and never calls `useHint`.
- **Restore:**
  - Legacy saves keep `hints: 1` with `hint: null`.
  - Real hints are re-derived from `scanCount` and must match the saved `type`/`letters`. The message is normalized, so changed wording can't reset a finished game.
  - A forged `type`/`letters` or an out-of-range `scanCount` still resets the save.
- **Terminal keyboard:** the `keydown` handler exits when status isn't `playing`. Backspace/Escape with nothing selected is a no-op with no re-render.
- **Sharing:**
  - The native bridge is tried before `config.share`.
  - `buildShareResult` copies only status, mode, date/number, scan count and hints into a frozen object.
  - It uses the date/number of the daily that was played, which stays fixed past midnight until the user loads the new day.
  - The caption, image and native text include no secret, pick, word list, scan letters or per-scan counts.
  - No URL is passed.

## Verdict

From inline source review only, I found no Critical logic, save or sharing defects. There is one Important focus regression (#1) with a direct trigger, plus four minor copy, hint-UX and test-quality items. Rendered layout, CSS targets, physical-device and native sharing, and fun are all unverified here. James's preference is still pending.
