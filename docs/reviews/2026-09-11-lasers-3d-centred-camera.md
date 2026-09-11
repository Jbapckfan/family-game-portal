# Lasers 3D centred view switching — September 11, 2026

The old TILT/FLAT toggle kept manual pan and zoom when changing perspective. Its look-at point included the pan vector, so the board appeared to swing around an off-centre point. The 720 ms outward transition also included a preparation pause.

Separate, always-visible **2D** and **3D** buttons now choose a view directly. Both centre the board; 3D fits the entire board, while 2D restores the editing view and its minimum cell size. Normal switches take 360 ms with no preparation pause; reduced motion retains the 140 ms transition. The selected button reflects the requested destination immediately. Another press can reverse an unfinished switch, and selecting the current centred mode does not add a tilt.

The camera's position and rotation axis now use the geometric board centre at floor height. Panning shifts the orthographic projection instead of moving the orbit pivot. Rotation rebases this offset to keep the board centre at the same screen position, including while automatic fitting settles. View buttons interpolate the screen offset back to zero, avoiding a curved sweep from a previously panned view. Existing one-finger pan, two-finger orbit, pinch zoom and piece editing remain supported.

The browser tests check the actual projection matrices during touch gestures, both button states, rapid reversals, centring after manual pan/zoom, whole-board 3D framing and 44-point controls from a 320-pixel phone to iPad. The independent exhaustive reference picker now uses Three.js box intersections: triangle intersections missed exact shared corners under the new projection and incorrectly labelled a hidden cell as visible. A regression verifies that these rays select the foreground column. Production picking was unchanged.

## Verification

- 423 unit/DOM tests passed, including 507 embedded DOM assertions.
- 54 camera integration checks passed across Chromium native touch dispatch and WebKit Pointer Events.
- 243 rendering/picking checks passed, including exact hidden-height pixel comparisons.
- 211 WebKit UI checks, 131 motion checks and 69 Chromium release checks passed. Settled scenes schedule zero application frames; context restoration and saved camera framing still work.
- Signed offline iPad build succeeded; code signature and all 26 bundled game files plus the native verification script match source.
- Installed on the user's iPad Pro M4. The first physical verification stopped at the two-finger gesture check, and the subsequent normal launch was rejected because the iPad had locked. The user was asked to unlock it again. The verification-only native session now disables auto-lock until results are recorded; the updated verifier also records the camera state on a failed gesture check. Final physical verification is pending an unlocked device.

Browser preview: `output/playwright/laser-centred-views.png`. Logs are local under `output/laser-centre-*.log`. No Simulator or NAS deployment was performed.
