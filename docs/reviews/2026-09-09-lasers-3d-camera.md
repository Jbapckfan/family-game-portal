# Lasers 3D camera controls — September 9, 2026

Touch camera movement now follows the user's preferred mapping. One finger pans anywhere on the board, including over placed pieces. Two fingers dragged vertically tilt toward the side or overhead; sideways movement rotates the board. Pinching zooms. Taps still place/rotate pieces; holding a piece for 500 ms before dragging deliberately moves it. FLAT remains the quick overhead reset. Mouse and pen editing remain supported.

The two-finger recognizer ignores placement jitter and distinguishes a spread from a drag. It locks that pair to zoom or orbit so a drifting pinch does not accidentally reveal heights or consume FROM ABOVE eligibility. Both pointers are sampled once by the existing host frame scheduler, preventing the intermediate spread changes from alternating pointer events from wobbling the zoom. There is no extra animation loop or post-release inertia.

Lifting one finger ends the orbit and rebases the remaining finger into a pan at its current position. A third finger cannot perturb the active pair; replacing a pair member establishes a fresh origin. Cancel, lost capture, blur and disabled input discard pending motion and cannot turn it into a puzzle edit. Manual pan, zoom and orbit cancel unfinished fit tweens so the next animation frame cannot undo the user's movement. A gesture clamped at overhead that never changes the angle no longer counts as a tilt.

The in-game Help, VIEW panel and board accessibility description explain the controls. `CURRENT-RULES.md` supersedes the original gesture mapping in the historical frontend contract.

## Verification and delivery

- 423 unit/DOM tests passed, including 50 input tests and 507 embedded DOM assertions.
- 34 camera integration checks passed using native Chromium touch dispatch and WebKit Pointer Events: exact pan displacement, preserved pieces, stable pinch/tilt separation, finger handoffs, orbit counting, fit interruption, reduced motion and zero idle frames.
- All rendering/picking checks, 211 WebKit UI checks, 131 motion checks and 69 Chromium release checks passed.
- The signed offline iPad build succeeded. All 26 bundled game files and the device verification script match the final source; code signature verification passed.
- The optional native `--verify-game` runner now uses a nonpersistent WKWebView, protecting normal web storage as well as native preferences. It includes five additional camera checks, for 13 total; these physical checks have not run yet.
- Installation was attempted on the attached iPad Pro M4, but iOS rejected it because the device had not been unlocked recently. The user was asked to unlock it. The signed build is ready; installation and physical verification remain pending.

Logs and screenshots are local artifacts under `output/playwright/laser-camera/`. No Simulator or NAS deployment was performed. Physical finger feel still needs a play session on the updated iPad.
