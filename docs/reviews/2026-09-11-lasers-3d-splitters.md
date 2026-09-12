# Lasers 3D: Splitters chapter

Implemented improvement 9: a beam splitter sends one branch straight ahead and reflects another along its diagonal. Both preserve the incoming pitch, travel simultaneously and obey the existing terrain, opening and height rules. Every receiver must light in one shot. A failed branch does not stop its siblings.

Four bonus puzzles are available immediately from **Levels → NEW: Play the Splitters chapter**:

| Level | Puzzle | Receivers | Proven par | Lesson |
| --- | --- | --- | --- | --- |
| 24 | TWO WAYS | 2 | 1 | Straight and reflected branches |
| 25 | THREE LIGHTS | 3 | 2 | Cascaded splitters |
| 26 | RISING FORK | 2 | 2 | Climbing one branch |
| 27 | PRISM BRIDGE | 2 | 3 | Split, climb, level and cross a window |

Each stored solution was replayed, each par was proven by exhaustive search below par, and every puzzle was proved unsolvable without its splitter inventory. The original 23 level definitions compare exactly with the previous commit and retain all existing difficulty and 3D-necessity validation. Regenerating that campaign preserves the authored bonus chapter.

## Implementation

- Branching uses a min-heap of arrivals ordered by distance from the emitter. Identical outgoing `(x,y,z,direction,pitch)` states share their continuation, bounding loops and repeated splitting by the finite state space. Original non-split trace shapes and rules remain unchanged.
- Branch segments carry their own start/arrival distances and parent segment. The merged beam geometry, audio, fog and receiver callbacks use those distances, so equal-length branches arrive together. Geometry merges only contiguous segments; separate paths never gain connecting tubes. Individual failed branches retain their endpoint indicators.
- The splitter has a lavender glass crystal, an upright optical panel, a diamond rim and a distinct flat diamond/diagonal glyph. It has its own tray/help entry, rotation, touch placement, undo/redo and saved-attempt support.
- Bonus levels preserve their own awards and attempts without unlocking the original campaign. The shortcut is available immediately, and reload returns to an unfinished bonus puzzle. Only relevant tray pieces are shown on splitter boards. Landscape labels fit without clipping.
- Existing centred 2D/3D controls, pitch rules, discovery boundaries and zero-idle rendering remain in place.

## Verification

Passed:

- 437 unit/DOM tests, including 507 DOM/layout assertions. Final stylesheet recheck: 507/507.
- All 27 level validations; bonus lower-bound proofs used 1, 20, 38 and 603 search nodes.
- 300 generated flat splitter networks matched an independent reachability oracle, including crossings and cycles.
- 56 new integration checks across WebKit and Chromium: touch placement, rotation, undo/redo, victory, save/reload, simultaneous receiver callbacks, all four real FIRE flows, 320×568 / 393×852 / 844×390 / 1376×1032 layouts, reduced motion and zero idle frames.
- 243 render/picking checks; 131 motion checks; 69 release checks including WebGL context restoration.
- New chapter scenes used 51–68 draw calls in the browser. These are browser measurements, not sustained iPad thermal measurements.
- The exact native verification script passed all 22 checks in a WebKit preflight. This is **not** a physical-device result.
- Signed offline Xcode build succeeded; strict codesign verification passed. All 26 bundled game files and the native verification script match source.

Logs: `output/laser-splitter-{unit,levels,browser,render,motion,release,dom-final,ios-build}.log`. WebKit preflight: `output/laser-splitter-native-preflight.json`. Actual game screenshot: `output/playwright/laser-splitters-three-lights.png`.

## iPad delivery

Installed successfully on James’s iPad Pro M4, CoreDevice `7E3FC665-983C-58B6-AE5E-3B63C4C717FD`, bundle `com.jamesalford.lasers3d`. Evidence: `output/laser-splitter-install.json`; application container `39CFFBAD-E493-4072-8D86-9A81D0EE1F40`.

The iPad reports `passcodeRequired:true`. The final physical launch and 22-check verification are pending unlock; an asynchronous request has been sent to James. Once unlocked, launch `--verify-game`, copy a fresh `Documents/verification.json`, inspect its timestamp and all 22 results, then always relaunch normally. This installed revision includes the prior centred-camera change whose physical verification was also pending. Do not substitute the browser preflight for physical evidence.

No Simulator or NAS deployment. Existing unrelated root edits were preserved.
