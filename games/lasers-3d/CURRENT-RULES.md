# Lasers 3D: current rules and release workflow

This is the current implementation reference as of September 11, 2026. `DESIGN.md` and `MOTION-DIRECTION.md` preserve the original proposals and subsequent amendments; use this document when those historical sections conflict. The physics and the 23 authored level layouts are unchanged by the usability and cinematic releases.

## Puzzle rules

- Boards range from 12×12 to 24×24. Coordinates use x east and y north; terrain rows start at the south edge. Beam heights are integers 0–3, with pitch −1, 0, or +1.
- A mirror turns the horizontal direction and preserves pitch. WEDGE turns and adds +1 to pitch; DIP turns and adds −1. Pitch clamps to −1…+1. These pieces change pitch rather than setting it.
- FLOOR reflects a descending beam upward without changing its horizontal direction. Walls block unless an opening includes the beam's exact height. Arches and windows are openings in the column.
- A target lights only when the beam reaches its cell at the target's height. The beam continues through intermediate targets. Every target must light in the same shot to win.
- Repeated `(x,y,z,direction,pitch)` states terminate loops. The backup step cap is `max(400, width × depth × 4 × 4 × 3 + 1)`.
- Placement must use available inventory and a legal square. Fixed pieces cannot move. Undo/redo restores edits; RESET starts a fresh attempt while preserving earned stars and discovered cells.
- Dark levels show only discovered cells. A fired beam adds discovery along its route. Unknown-cell refusals and cursor descriptions must not disclose hidden pieces, terrain, or height.

## Learning, camera and awards

The opening uses a playable choose/place/rotate/fire lesson. Tray types appear after their introduction. Help remains available from More on portrait phones or the side panel on larger screens. VIEW provides pan/zoom buttons, a replayable lesson, and a step-through inspector of the last fired route; only discovered events are described on dark boards.

The separate 2D and 3D buttons switch directly to a centred view in 360 ms, with no preparation pause; reduced motion uses 140 ms. 3D fits the whole board even after manual pan or zoom. 2D restores a centred editing view. Another press can reverse a transition immediately; pressing the active centred view does not add a tilt. Working view keeps cells at least 34 CSS pixels. ALL shows the overview; tapping an overview region focuses it for editing. On touchscreens, drag one finger anywhere to pan; drag two fingers down/up to tilt toward the side/overhead or sideways to rotate; pinch to zoom. A pinch locks to zoom so midpoint drift cannot tilt the board. Lifting one finger continues panning from its current position without an edit. Hold a piece for 500 ms, then drag to move it. Mouse/pen piece drags remain direct; an empty-board mouse drag orbits. Middle-drag, Space-drag and VIEW arrows pan. Enter activates the keyboard cursor; Space only arms panning. Arrow keys keep the cursor visible. Selected pieces can be moved using the arrow button and then tapping a destination.

Campaign stars are independent flags: connect all targets; finish within par without an exact-answer hint; solve without an exact-answer hint. Tilting does not affect these stars. An unassisted solve with zero manual tilts also earns the optional FROM ABOVE badge. Old earned stars survive migration; the legacy internal `blind` flag now represents the unassisted campaign criterion.

Hints have three stages: explain the failed concept, focus the relevant region, reveal an exact placement. The first two are free. The third affects the par/unassisted criteria, stays visible for eight seconds, and focuses its cell before charging assistance. A currently working route receives confirmation without a penalty, whether it matches the stored solution or not.

## Saves and rendering

`lasers3d.v1` stores schema 3 progress. Explicit immutable level IDs are authoritative; numeric bags remain as a compatibility view. IDs must survive renames and reordering. Migration preserves awards and maps old indices to the historical campaign IDs. The layout fingerprint includes terrain, openings, emitter, targets, fixed optics, inventory, par and darkness. A changed fingerprint rejects stale discovery and unfinished placements.

Unfinished attempts persist placements, fire/tilt counts, hint use, and camera framing. Level navigation, edits, camera changes, and backgrounding save progress. A completed attempt is removed while its awards persist. Undo history is session-local. The native app mirrors progress into app preferences and recovers the web content process if it terminates.

Restoring an automatic camera preserves automatic framing: TILT still fits the whole board. A manually panned or zoomed camera keeps its chosen framing until the player explicitly selects 2D or 3D. Legacy saves without a manual flag retain their framing.

The camera always rotates around the geometric board centre at floor height. Pan shifts the orthographic framing, not that pivot. During a rotation and its fit easing, the board centre stays at the same screen position; view buttons smoothly bring it back to the canvas centre. Multi-touch input samples both pointers once per host frame, avoiding intermediate spread/zoom wobble. It adds no scheduler. Finger changes rebase the gesture; lost capture, cancellation, disabled input and blur release it. Manual pan/zoom/orbit interrupts a fit animation. A clamped gesture that never changes the angle does not count as a tilt.

Motion uses one on-demand registry and frame scheduler. Settled scenes produce no application frames. Backgrounding commits active shot results and cancels decoration. WebGL loss saves the puzzle; restoration invalidates shadows and redraws the scene.

The [current cinematic art direction](../../docs/reviews/2026-09-08-lasers-3d-cinematic.md) adds sculpted enamel blocks, metal bevels and hardware, glass optics, local laser illumination, and five chapter palettes. All seven decorative lamps are off in FLAT. Terrain shading and bevels obey discovery and the flat floor/top pixel identity; common upright-piece glyphs remain intact. Chassis markings and its grounding shadow depend only on public board dimensions.

A winning shot sends one pulse along its actual route, then a surface illumination wave expands from the final reached target. This decoration lasts 1,200 ms and the victory modal starts at 1,280 ms; every gain returns exactly to rest. Reset, level change, backgrounding, reduced motion and the decorative-ring quality cut cancel the wave. Reduced motion omits it and retains the existing short victory fade. This finite celebration supersedes the historical prohibition on all ground waves; ambient/repeating waves remain disabled.

## Verification and iPad installation

From `games/lasers-3d`:

```sh
npm ci
npx playwright install webkit chromium
npm run verify
```

The release regression script uses Chromium (or installed Google Chrome as a fallback); the main UI, DOM, render, motion and optical-art scripts use WebKit. The camera suite covers native Chromium touch dispatch and WebKit Pointer Events, including gesture handoffs and zero idle frames. The art checks compare actual illuminated framebuffers and exercise celebration cancellation and zero idle frames. Screenshot artifacts go into the ignored `output/` directory. `npm test` runs unit/DOM checks; `npm run validate` proves all 23 solutions and par values independently.

The iOS app is an offline WKWebView bundle. Its icon source is in `assets/app-icon-source.png`, with the opaque 1024px shipping asset in the iOS asset catalog. Build with XcodeGen and the configured Apple development team:

```sh
python3 tools/package-ios.py
xcodegen generate --spec ios/project.yml
xcodebuild -project ios/Lasers3D.xcodeproj -scheme Lasers3D -configuration Debug -destination 'generic/platform=iOS' -derivedDataPath ios/.build -allowProvisioningUpdates build
```

Install the resulting `Lasers3D.app` with Xcode or `xcrun devicectl device install app --device DEVICE_ID ...`. The debug launch argument `--verify-game` runs a physical-device smoke check in an isolated, nonpersistent WKWebView and writes `Documents/verification.json`; its test progress does not overwrite native saved progress. Relaunch normally afterwards. Simulator use requires an exact `sim-guardian` lease under the home agent instructions.

Human playtesting, VoiceOver playability, listening checks and sustained thermal/battery profiling remain separate validation activities. Automated solvability and browser tests do not establish those outcomes. New modes, extra mechanics and online features remain future product work.
