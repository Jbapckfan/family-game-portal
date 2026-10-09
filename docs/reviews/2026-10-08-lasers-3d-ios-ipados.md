# Lasers 3D iOS and iPadOS review

## Completed fixes

- Phone portrait now keeps the full longest shipped title, **THROUGH THE BOARD**, visible at 390 px and 320 px. The 320 px HUD keeps a compact level number rather than dropping level identity.
- Short iPhone landscape cards put their remaining-piece count in a corner pill, clear of the piece label.
- iPad portrait now uses a full-width bottom tray. The stage expands to the tablet width, while the landscape sidebar remains unchanged.

## Verification

- `npm test` passed: 485 tests, including 513 DOM/layout checks.
- The targeted iPad Both Sides check showed the deck controls in their own row above the board: controls end at y=130.7 and the stage begins at y=136.7 in an 820×1180 WebKit context.
- The broad WebKit UI suite timed out once waiting for a camera resize transition at `test/ui.playwright.mjs:234`. The identical level-20 placement, reset, tilt, and resize sequence then completed on both baseline and changed builds: camera animation stopped, document remained visible, and render geometry and draw statistics matched.
- A signed generic iOS build succeeded. `codesign --verify --deep --strict` passed for the version 1.0 (build 1) app, which bundles 27 game files.

## Physical-device gate

The authorized iPhone and iPad were unavailable to CoreDevice during this review. No physical installation or touch-play claim is made.
