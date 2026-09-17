# Lasers 3D — verified gameplay fixes

Implemented September 16, 2026, following the [Claude/Gemini gameplay review](2026-09-16-lasers-gameplay-review.md).

- Hints confirm success only when the current trace connects every receiver. If all authored pieces are present but a spare intercepts the beam, the regional hint focuses an extra piece and the exact hint names the piece to remove. Concept and regional hints remain free; exact removal advice records assistance.
- FLOOR orientations compare as equivalent. Hints point to missing optics instead of asking for an ineffective rotation, and FLOOR placement advice omits orientation.
- The route inspector uses a crossing's destination face. Both forward and backward inspection follow upward and downward crossings correctly; labels say “Through the opening to Above/Below” instead of showing internal fractional coordinates.
- OVER THE WALL now encourages 2D/3D exploration and correctly separates unassisted campaign stars from optional FROM ABOVE mastery. THE LONG WAY ROUND introduces darkness, firing to discover terrain, and discovery surviving RESET. The level generator preserves both revised intros.
- Deliberate stationary touches on empty cells place on release, including beyond 500 ms. Piece taps remain available until the 500 ms hold-to-move threshold. Cancelled touches, pans and pinch handoffs cannot become placements; holding a piece still selects it for moving.

## Verification

- `npm test`: 478 tests passed, including 507 DOM/layout assertions.
- `npm run validate`: all 31 solutions and minimum pars passed. Layouts and physics are unchanged.
- `node test/review.playwright.mjs`: 116 checks passed across WebKit and Chromium. Reproduced all 22 interfering-extra fixtures, verified actionable removal advice, FLOOR equivalence, upward/downward inspection in both navigation directions, deliberate touch release and cancellation. No JavaScript exceptions. The script is included in `npm run verify`.
- Release suite: 69 checks passed, including saved assistance, responsive hints and WebGL recovery.
- Camera suite: 54 checks passed, including gesture handoffs, view changes and zero idle frames.
- Both Sides suite: 87 checks passed across WebKit and Chromium, including all four bonus solves, underside touch editing and the 29-check native-verifier preflight in WebKit. The preflight is browser evidence, not a physical-device run.
- Signed generic-device iOS build succeeded. Codesign verification passed; all 27 bundled game assets and the native verifier match source.

Logs are in `output/laser-review-fixes-{units,validation,browser,release,camera,duplex,ios-build}.log`.

## iPad installation

The updated app is ready at `games/lasers-3d/ios/.build/Build/Products/Debug-iphoneos/Lasers3D.app`, bundle ID `com.jamesalford.lasers3d`.

Installation was attempted on James’ iPad Pro 13-inch M4 (`7E3FC665-983C-58B6-AE5E-3B63C4C717FD`). CoreDevice lists it as unavailable and rejected installation with error 4016 because trusted connectivity was unavailable. **This build is not installed.** Evidence: `output/laser-review-fixes-install.{log,json}`. Reconnect/unlock the iPad, install this bundle, run `--verify-game`, retrieve a fresh verification report, and relaunch normally. No Simulator was used.

These checks establish automated behavior, not physical touch playtesting. The shared opaque floor, true holes, all-level testing access, reset assistance policy and free second hint remain as agreed. Kimi has not supplied a review; this implementation does not claim otherwise.
