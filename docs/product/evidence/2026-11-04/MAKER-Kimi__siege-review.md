Static source-review findings:

1. **Keyboard shortcuts do not activate keyboard pace.** In `games/qwen-syntax-siege/app.mjs` (`root.onkeydown`), Backspace calls `act(E.undo)` and Enter calls `act(E.submit)` without `'keyboard'`. After tile entry, these typed actions leave the 30-second tile pace active and fail to record mixed input. Letter typing correctly passes `'keyboard'`.

2. **Tile-mode clock ticks can rebuild the entire board.** The render stamp zeroes `remainingMs` but still includes `paceCarry`. Tile pacing frequently changes that carry value, so supposedly clock-only ticks replace `root.innerHTML`. This can destroy descendant focus and restart enemy rendering instead of preserving controls and smooth movement as the comment claims. Exclude internal fractional timing from the board stamp.

3. **Untimed assist incorrectly adopts practice motion and resets approach.** Both `tick` and `updateClock` treat `s.untimed` identically to practice. Activating assist midway through a wave switches the approach ratio from normalized `remainingMs` to `practicePhase`, initially zero, sending the enemy back to its starting position and then looping it. Practice-only cosmetic movement should not reset an assisted daily wave’s existing approach.

4. **`eventMode` is an unreliable actual-input heuristic.** In `app.mjs`, clicks lacking `pointerType` and with `detail === 0` become keyboard input. Assistive-technology or synthetic pointer activation can therefore receive the faster 20-second pace despite no typed entry. Conversely, nonzero-detail keyboard-generated clicks would be classified as tiles.

5. **Keyboard focus is deliberately invisible.** `act` repeatedly focuses the puzzle root for typed controls, while `styles.css` contains `#puzzle:focus{outline:none}`. The element receiving Backspace/Enter consequently has no visible focus indicator.

The normalized base-time calculation, legacy defaults in `restoreState`, practice timeout suppression, and shared runtime tick path otherwise appear consistent. No source-level defect was found in the six-wave damage, scoring, dictionary, or subscription logic; no playtesting was performed.
