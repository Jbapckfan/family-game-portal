**Verdict: not ready yet.** There's one tile-mode blocker, and the pause and practice behavior can't be confirmed because `common.mjs` and `puzzles.mjs` weren't supplied. This is source review only, with nothing run or playtested.

## Blocker
1. **Tile mode can rebuild the board on most ticks:** the `render` stamp includes `paceCarry`, which changes unless `delta` is divisible by 3. If the runtime re-renders on tick results, this can drop taps, lose button focus, and defeat the enemy and meter transitions. Fix: `{...s,remainingMs:0,paceCarry:0}`.

## Input and timing
2. **False "Mixed" summary:** clicking Start and then typing the whole game reports Mixed, as does typing a rack letter before Start and then clicking it. Fix: Start sets `inputMode` only, and only successful letter picks update `inputHistory`.
3. **Assistive input can get the wrong pace:** synthesized tile clicks can have `detail=0` and no `pointerType`, so they would count as keyboard (20s). Fix: always treat tile-button picks as `tiles`.
4. **Typing can stop working while the clock runs:** `keydown` is bound to `root`, which is only focused by `act()`. After a reload, or if Help returns focus outside `root`, letters are ignored. Fix: use a document listener during play, ignoring open dialogs.
5. **Misleading ready screen:** touch players see "Keyboard · 20s" and `20s` before Start. Fix: show "30s tiles / 20s typed" until started.
6. **Untimed assist resets the approach:** `practicePhase` starts at 0, so the enemy jumps back to 86%. Fix: seed it with `20000-remainingMs`.
7. **Inaccurate results text:** untimed and practice summaries still claim a 20s or 30s pace. A reveal with `inputHistory=0` claims keyboard entry.

## Saved state
8. **Legacy saves:** missing fields restore safely, but in-progress touch players get 20s pace until their next tap.
9. **Inconsistent state:** `restoreState` accepts combinations such as `inputMode:'tiles'` with `inputHistory:1`. Fix: reject or normalize them.
10. **Possible duration mismatch:** `submit`, `tick`, and `restoreState` hard-code 20000, while the meter and `createState` use `durationMs`. Confirm every wave uses 20000.

## UI and readability
11. **Enemy hidden behind the tower:** at about 286px wide, the 14% end position is 40px, inside the tower's 12–72px span. The tower's z-index covers the HP badge. Fix: position the enemy within the lane using `calc()`.
12. **Breach animation is backwards:** the fatal timeout resets `remainingMs`, so the enemy retreats to 86%. Fix: hold it at the core when lost.
13. **Small text regression:** the final CSS pass undoes the earlier 13px sizing, leaving 10–12px labels, pace text, key hints, and word details. Fix: use at least 12–13px.
14. **Weak danger states:** the breached tower stays blue, and the health bar stays cyan at low HP.
15. **Hidden credit:** `.game-credit{display:none}` removes the Qwen and ChatGPT credit. Confirm that's intended.

## Verify in `common.mjs`
- **Practice damage:** `tick` must receive `mode`, because it defaults to `'daily'` and practice would otherwise take timeout damage.
- **Enemy movement:** `tick` must keep running for practice and untimed play, or the enemy won't move.
- **Pausing:** Help and hidden tabs must stop ticks, with no large catch-up `delta` on resume.
- **Valid deltas:** `delta` must be finite, because the app wrapper has no guard and `NaN` would permanently break `practicePhase`.

## Looks correct
- **Pace:** normalized time gives 30s for tiles and 20s for keyboard, and switching input preserves `remainingMs` and the approach position.
- **Practice:** the engine returns no timeout damage, and the movement is cosmetic.
- **Core rules:** none of these fixes change the six waves, damage, scoring, or dictionary.
