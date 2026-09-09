# Lasers 3D cinematic pass — September 8, 2026

The approved visual pass brings the miniature optics-instrument direction into the playable game. It includes all six requested areas below. The earlier generated image was an art-direction concept; the screenshots listed here are captures of the implemented browser renderer. This is stylized real-time WebGL rendering, with bounded local lighting and procedural studio reflections.

| Area | Implemented behavior |
|---|---|
| Laser illumination | A moving cyan head light follows the traced route; three reached-route anchors illuminate nearby surfaces. The source charges pink and up to two actually hit targets cast mint light. Seven unshadowed lamps remain allocated, independent of board size or route length. |
| Materials and hardware | Real metal bevels on block caps, enamel shading toward the base of walls, glass-panel thickness, sculpted emitter and chassis, collar bands, screws, mirror hinges and target cradles. Geometry is merged and shared. Local studio reflections require no downloads. |
| Tilt reveal | The existing camera choreography reveals the new material response, bevels, side shading, local lights and soft chassis shadow. Lamps fade in with the square of the reveal blend. The beam stays anchored to its actual route. |
| Charge and contact | Stronger charge contraction, brighter moving head and contacts, short sharper scatter, stronger target arrival rings and a growing internal target core. Existing ordered event timing and skip behavior remain authoritative. |
| Chapter atmosphere | Sapphire (1–3), Obsidian (4–9), Glacier (10–13), Amethyst (14–20), Midnight (21–23). Each changes terrain, trim, studio-light colors and the surrounding panels/background. Piece identities and beam altitude colors stay consistent. |
| Completion | One pulse follows the winning route, then an illumination wave spreads from the final reached target over known surfaces. The perimeter briefly lights. The sequence lasts 1,200 ms; the modal begins at 1,280 ms. It ends completely. |

## Information and motion boundaries

All seven decorative lamps are exactly off in FLAT. Floor, lids and bevels resolve to the existing uniform flat color. Upright optics still share the common flat glyph. The shader’s existing discovery mask runs after the new material treatment, so unknown terrain stays hidden. The chassis, perimeter markings and soft grounding shadow depend only on public board dimensions.

The wave uses the existing motion registry, with no new timer, RAF loop or continuously running shader clock. Its final, cancel and fallback actions all reset the beam sweep, wave phase and rim gain. Reset, level navigation, backgrounding, reduced motion and the decorative-ring quality cut cancel it. Reduced motion retains the short existing victory fade and omits the sweeping celebration. Stationary scenes remain stationary.

This approval supersedes the historical motion ledger’s weaker effect values and blanket ban on a finite ground wave. It does not authorize repeating ambient waves or hidden-height hints. Key tuning now lives in `theme.motion` and `theme.art`: head length/gain 0.38/1.0; contact diameter/peak 0.20/0.84; charge filament multiplier 2.6, halo scale/opacity 0.72/0.48; target-ring opacity 0.46; whole-route seal gain 0.12. Charge duration, event ordering, core altitude widths/colors and puzzle physics are unchanged.

## Verification

- 419 unit/DOM tests passed, including 507 embedded DOM assertions.
- All 23 authored solutions and par values independently validated.
- Rendering/picking suite passed: flat pixel identity, opening geometry, dark/fully-known equality, hidden-column concealment and camera framing.
- 211 WebKit UI checks and 69 Chromium release checks passed across phone, tablet and desktop layouts.
- 131 motion checks passed, including zero application frames after settling.
- 54 optical-art checks passed: illuminated framebuffer comparisons, targets lighting only after real hits, all five chapter profiles, and exact celebration cancellation/rest states.
- The representative solved level used 63 draw calls. The synthetic 24×24 tilted stress board used 65 calls and 18,152 triangles, with about 2.4 ms CPU submission per frame in the desktop WebKit harness. This is not a measured iPad GPU frame rate or sustained thermal result.

The unknown-terrain pixel test now compares the same scene with voxel surfaces removed, instead of assuming the public reflective chassis must be nearly black. Opening geometry checks account for the 0.036-cell cap bevel while still requiring the correct solid and empty altitude bands. No gameplay assertion was removed.

## Delivery

The signed offline `Lasers3D.app` builds successfully. Its 26 bundled game files match the source. The new native installation remains pending: James’s iPad Pro 13-inch M4 reports unavailable to CoreDevice. The previous installed release remains on it; this report does not claim the cinematic version is installed or physically profiled. Existing permission to install remains valid when it reconnects.

Actual browser captures and logs are in local `output/playwright/laser-cinematic/`, with WebKit art screenshots in `games/lasers-3d/output/screenshots/art-*.png`. The live local preview is served on port 8795. No NAS publication or Simulator run was performed.
