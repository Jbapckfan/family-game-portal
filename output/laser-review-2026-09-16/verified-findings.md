# Lasers 3D — verified gameplay findings

Reviewed build: `426a8fd` (September 16, 2026). These are Codex's independent runtime checks supporting the requested Claude/Kimi review. No game code was changed.

## Confirmed: a hint endorses a broken route when an extra piece interferes

**Priority: P2.** `src/main.js:843–848` checks whether every authored solution piece is present, then says “That is the answer. Press FIRE!” even when the existing live trace says the route fails. The initial success guard does not prevent the later false-success message.

Reproduction in level 1, FIRST BOUNCE: place a `MIRROR` facing backslash at zero-based `(2,3)`, plus a `MIRROR` facing `/` at `(3,3)`. Both placements are legal and within the two-mirror inventory. FIRE ends `lost-edge`. Press HINT twice: the second hint says the broken arrangement is the answer. Confirmed in the actual WebKit game; captured in `screenshots/hint-extra-piece-bug.png`.

A bounded simulation search found the same condition possible in **22 levels**: 1–16, 18–23. These are 22 affected boards, not 22 separate bugs. Level 17 and the eight bonus boards did not produce this fixture in that search.

Improvement: keep the existing trace-based success guard. If all authored pieces are present and the trace still fails, identify interfering extras or offer an honest removal hint. Do not claim a route works without a successful trace. Preserve the current distinction between a free regional hint and a charged exact answer.

## Confirmed: the route inspector follows an upward crossing on the wrong face

**Priority: P2.** `src/learning.js:40–42` derives a cell's face from `ev.z < 0`. Every shared-floor crossing has `z: -0.5`, including crossings whose explicit `side` is `above` (`src/sim.js:467,530`).

Reproduction: solve level 29, RETURN TO LIGHT; open VIEW; advance Next event to event 19, the upward crossing. The trace says `side: "above"`; the inspector keeps the active editing face `below`. It also describes the opening as “column 8, row 4.5, height -0.5,” exposing internal coordinates instead of a useful crossing explanation. The downward crossing correctly selects below by coincidence.

Improvement: honor `ev.side` when provided and describe crossings as movement through an opening to Above/Below. Keep hole-centre world coordinates for rendering; use player-facing descriptions in the inspector.

## Verification evidence

- `validation.log`: all 31 authored solutions and minimum par values pass the existing exhaustive validator.
- `runtime.json`: fresh isolated WebKit context; loaded all 31 levels, fired empty boards, injected each stored solution, fired and confirmed the winning state and every receiver lit. No JavaScript errors. This does not measure how readily a person discovers a solution.
- `gallery.html`: actual initial and solved 3D captures for all 31 levels, plus underside captures for levels 28–31. There are 66 level captures and one bug capture.
- `confirmed-probes.json`: actual rendered hint text, failed trace, crossing destinations, inspector text and active faces.
- `extra-piece-hint-fixtures.json`: the 22 legal failing arrangements used to assess the hint issue's reach.

No physical iPad, audio listening, VoiceOver, human difficulty study, or sustained thermal test was performed in this review.
