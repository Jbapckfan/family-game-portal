# Both Sides: a shared floor with an upside-down board

Implemented September 15–16, 2026 in `games/lasers-3d`.

The game now supports two copies of its existing terrain joined at their bases: one grows above a single opaque floor, the other grows below it. The familiar 2D bird’s-eye view hides the heights until the player tilts. Above/Below flips around the floor’s centre, keeping the chosen 2D or 3D mode; continuous two-finger tilt can also pass underneath. Actual apertures cut both faces. A laser crossing solid floor stops at the intersection.

Underside mirrors, emitters and receivers are physically upside down. The rules apply existing optics in each face’s local outward direction, so DIP bends toward the shared floor and WEDGE away from it. Underside columns are solid toward the floor, and optional underside arches/windows retain the original opening rules. Placement, picking, dragging, keyboard control, hints, undo and saves preserve the edited face. The top remains opaque while viewing the underside; there is no separate lower deck or transparent cutaway.

Four immediately accessible puzzles in **Levels → NEW: Play Both Sides** teach passing through a hole, returning through another hole, a deeper underside route, and split beams reaching receivers on both faces. There are now 31 levels. The original 27 retain their layouts, simulation traces, saved identities and controls.

Camera pan stays screen-relative through zero elevation and from beneath the board. Edge-on views have bounded zoom; the board centre remains stationary through manual rotation after panning. Rapid face changes finish in the last requested mode. Reflected surface normals retain correct lighting. Beam-height labels respect the opaque floor. Reduced motion shortens camera moves, and settled scenes have no application frames.

## Design correction

James rejected the first stacked-platform implementation on September 15. On September 16 he clarified that both terrain bases should touch one shared floor, with geometry radiating outward. He then described the corrected actual-game profile capture as “much closer to what I was thinking.” That shared-floor structure is the direction to preserve. The rejected prototype is archived locally as `output/laser-stacked-prototype-before-underside.zip`; do not restore its separate lower platform, support posts or cutaway transparency.

Actual game captures are `output/playwright/laser-underside-flat.png`, `laser-underside-profile.png`, and `laser-underside-below.png`. These are running-game screenshots, not generated concepts.

## Verification

- 476 unit/DOM tests pass, including 507 DOM assertions.
- All 31 authored solutions and minimum piece counts validate.
- The underside rules suite reflects all 27 existing puzzles and checks matching routes, including splitters, FLOOR plates, arches and windows. It also tests solid-floor blocking from both directions, clearance at hole edges, solid underside columns and independent occupancy.
- Full `npm run verify` passes: UI 211/211, renderer smoke, motion 131/131, optical art 54/54, camera gestures 54/54, release flows 69/69, splitters 56, and Both Sides 87 WebKit/Chromium checks. The latter covers the opaque shared floor, upside-down models, flat startup, bounded flip zoom, centred edge-on orbit, underside pan, rapid flips, touch placement/drag/rotation, hints, undo, reload, four viewports, reduced motion and zero idle frames.
- The bundled native verifier has passed 29 checks in WebKit preflight. This is browser evidence, not a physical iPad run.
- Generic-device iOS build and code-signature verification pass. All 27 game assets and the native verifier match the signed bundle byte-for-byte.

## iPad delivery

James’s iPad Pro 13-inch M4 (`7E3FC665-983C-58B6-AE5E-3B63C4C717FD`) reports unavailable to CoreDevice. The installation attempt failed with CoreDevice error 4016 (no trusted device connectivity). The new build has not been installed. The bundle is `com.jamesalford.lasers3d`, built at `games/lasers-3d/ios/.build/Build/Products/Debug-iphoneos/Lasers3D.app`.

When reachable, install, launch with `--verify-game`, retrieve a fresh `Documents/verification.json`, and relaunch normally. Installation is already authorized. No Simulator or NAS deployment was used.

Evidence: `output/laser-underside-verify.log`, `output/laser-underside-ios-build.log`, and `output/laser-underside-install.json`. The device verifier runs in isolated storage; always inspect a fresh physical report before claiming device verification.
