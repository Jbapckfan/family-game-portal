## Inbetween drag-and-drop review (Opus, inline)

**Scope:** I read the source text only: engine, app, placement-drag, CSS, HTML, and the two test scripts. I saw no screenshots, executed nothing, and did not play or emulate anything. Because I saw no screenshots, I'm not giving visual scores. James's **6/10, KEEP IT** stands, and I'm not rescoring fun. The clue bank, scoring, calendar and schema are out of scope.

**Critical:** None found. The controller's only route into game state is `selectPair` and `previewDrop`→`chooseGap`. Hover, drop and cancel never reach `submitPlacement`.

### Important

1. **A repeat confirm on a known-wrong preview charges again.**
   - Trigger: drop on a wrong gap, then double-click Place pair, double-tap it, or hold Enter. The first activation rejects the fit and re-renders a focused Place pair button in the same spot. The second activation hits that new button, so the same word costs +2 attempts and loses Perfect.
   - Expected: one charge per distinct preview.
   - Fix: add `if(!preview||rejected)return;` to `placePair`, and render the fit button disabled (e.g. "Try another gap") while `rejected` is true. `chooseGap` and `chooseTile` already reset `rejected`.

2. **Escape during a drag also clears the whole choice, including a paid nudge.**
   - Cause: app.mjs registers its document `keydown` listener before `installPlacementDrag`, so it runs first and calls `clearSelection()`. That sets `hinted` and `preview` to null and removes the saved hint view. The controller's own handler then finds nothing active.
   - Trigger: take a nudge, drag the hinted pair, press Escape.
   - Expected: only the drag cancels; the selection, preview and nudge remain.
   - Fix: register the controller's keydown in the capture phase and call `stopImmediatePropagation` when it handled an active or pending drag. Alternatively, have the app check a `placementDrag.busy()`.

3. **A cancelled drag of a different pair irreversibly discards the nudge or preview.**
   - Cause: `selectPair` commits once the pointer moves 8px, and `chooseTile` nulls `hinted` and `preview`.
   - Trigger: with a nudge shown, slip a different pair past 8px, then release outside or get a pointercancel. The advice is gone and the nudge button re-enables, so getting it back costs a second nudge.
   - Expected: a cancelled drag changes nothing. The dialog copy ("choose another pair") shouldn't cover an abandoned gesture.
   - Fix: snapshot `{selectedTile, preview, hinted}` in `selectPair` and restore it on cancel or outside drop through an `api.restore()`. Or defer `selectPair` until the first valid gap hover.

4. **`scrollBy({behavior:'instant'})` may throw.**
   - If an engine's ScrollBehavior enum lacks `'instant'`, the call throws a TypeError inside `tick`. That kills the RAF loop, which carries both edge scrolling and the per-frame revision guard. Touch edge scrolling is only exercised in Chromium.
   - Fix: use `'auto'` (no smooth `scroll-behavior` is set anywhere) or wrap the call so the loop continues.

5. **The phone top edge zone sits inside the sticky bank.**
   - The bank card is sticky at `top:8px`, so first-row pair centres land around y≈70–80, inside the 76px zone.
   - Trigger: press the upper half of a first-row pair and drag sideways. The board creeps upward before you aim.
   - Scrolling up also requires dragging back over the bank.
   - Expected: on phone, the top zone starts at the sticky bank-card's bottom edge. Compute it once at `begin`.

### Minor

- **`suppressed` can outlive its gesture.** It survives when no trailing click fires, e.g. after a moved touch, or when Safari's down target was detached. Clear it on the next `pointerdown` (capture phase). That guarantees a quick deliberate Place pair tap is never swallowed, and keyboard `detail:0` handling stays untouched.
- **A drag can stay live after the button is released.** If `setPointerCapture` silently failed and the mouse is released outside the window, the drag remains active. Cancel in `move` when `pointerType==='mouse' && buttons===0`.

### Narrow interaction/visual improvements

- **Ghost offset by pointer type.** `y−120` keeps the ghost clear of a finger. For a mouse or pen it puts the ghost about two rows above the gap actually targeted, inviting mis-aim. Keep −120 for touch and use about −56 for mouse and pen, which still clears the forming word.
- **Hover neutrality looks correct in source.** `locate` accepts any 6-letter build, every gap gets the same halo and word formation, and the burst only renders on an accepted, saved placement. Keep the `hinted` outline as the only differentiator during a drag, since it's paid information.

### Test gaps worth adding

- Escape with the real app listener present (the jsdom fixture has none, so issue 2 is invisible).
- Dragging a different pair while a nudge is shown, then cancelling.
- Double-confirm on a wrong preview.
- WebKit edge scroll.
