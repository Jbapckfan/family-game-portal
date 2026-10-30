Scope: static, read-only review of the supplied controller, app, CSS/HTML, engine, seven controller tests, browser-check script, and four screenshots. I did not execute tests or physically play the game; no physical-iPhone certification is implied.

## Critical / Important

**No concrete Critical or Important bugs found by inspection.**

The implementation preserves the key interaction boundaries:

- Hover previews use `buildWord` without checking correctness; every legal unsolved gap receives the same treatment (`placement-drag.mjs:35-53`, `app.mjs:404`).
- Dropping only creates a free preview. Attempts and saved placements remain behind explicit **Place pair** activation (`placement-drag.mjs:88-100`, `app.mjs:187-201`).
- Pointer capture moves to the stable bank before tile selection rerenders its children (`placement-drag.mjs:63-75`).
- Session revision, pair availability, modal opening, external progress, Escape, cancellation, page hiding, and lost capture guard stale drops.
- `touch-action:none` is confined to pair tiles; hit testing uses `elementFromPoint`, so gaps hidden beneath the sticky bank are not falsely targeted.
- Success effects occur only after accepted confirmation, not during hover or preview.

## Narrow improvements

1. **Avoid competing previews while redragging an existing choice.**  
   Dragging a pair that already has a preview leaves its preview panel visible while another row shows the live hover word. Temporarily dimming the old panel during the drag—and restoring it on cancellation—would make the prospective destination unambiguous without changing state.

2. **Harden suppression against a genuine rapid second tap.**  
   Suppression currently depends only on pointer identity/coordinates/time (`placement-drag.mjs:103-108`). Clear an unused suppression record on a new primary `pointerdown`, so a genuinely new nearby tap cannot be mistaken for the prior drag’s trailing click. Preserve the existing `detail===0` keyboard exemption.

3. **Add integration coverage for the remaining high-risk states.**  
   The supplied tests are strong on basic dragging, but the browser script does not cover dragging the current paid-hint pair to another gap, dragging a different pair away from paid advice, or hit testing immediately beside/beneath the sticky phone bank. These would verify behavior that currently looks correct but relies on app/controller interaction.

The screenshots show clear neutral hover wording, readable large clues, distinct insertion targets, and a contained confirmed-placement flourish.
