# Lasers 3D art polish — September 7, 2026

The board now reads as a miniature optics instrument: a dark chassis with metal rails and calibration marks, restrained navy surroundings, clearer steel terrain edges, warm target optics, and a prominent pink FIRE control. This pass builds on the cyan/amber app icon and preserves the hidden-height puzzle.

## Professional design approach

| Priority | Implemented change | Player benefit |
|---|---|---|
| Direct attention | Quieter background and panels; stronger FIRE fill; larger amber target reticle | Source, route, destination and next action are easier to find. |
| Establish one material language | Metal chassis, perimeter markings, warm key light, cool rim light, cleaner environment reflections | The board and interface feel like parts of the same optical instrument. |
| Reveal useful shape | Fine terrain edge lighting in tilt, an emitter collar and source glyph, target crown ring | Depth and optical hardware read more clearly at gameplay scale. |
| Compose for the device | Compact floating side controls, existing 44px touch targets retained, saved automatic camera now fits on tilt | More attention stays on the board; returning phone players retain a useful overview. |
| Protect the puzzle and pacing | Edge lighting obeys reveal/discovery; common flat glyphs and uniform tops retained; no new continuous animation | Art does not disclose hidden structure or keep the renderer awake. |

This application of lighting and contrast is an art-direction judgment for this game. It follows the general principle of making style support scene readability described in Valve’s [Illustrative Rendering in Team Fortress 2](https://steamcdn-a.akamaihd.net/apps/valve/2007/NPAR07_IllustrativeRenderingInTeamFortress2.pdf). Device composition and control sizing follow Apple’s emphasis on legibility, reachable controls and adaptable aspect ratios in [Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games).

## Implementation boundaries

- Shipping colors and light/material settings are in `src/theme.js`; this document supersedes the old palette tables in `VISUAL-DIRECTION.md`.
- The flat floor and every raised top still resolve to `#172544`. Upright optic identity remains hidden by the common flat glyph. New terrain edges are invisible at the flat reveal boundary.
- The chassis depends only on board dimensions. Its markings sit outside playable cells; it cannot encode terrain, openings or undiscovered optics.
- Dormant targets use amber and energized targets use mint. Their ring/core silhouettes remain visible cues alongside color.
- Three merged chassis meshes and one merged terrain-edge mesh add static detail. The larger representative tilted board used 62 draw calls and 10,276 triangles in the desktop WebKit smoke run. Its measured CPU submission time is not an iPad frame-rate or battery claim.
- Camera restore now preserves an explicit automatic framing flag. Manual framing and legacy saves remain supported.

## Validation and delivery

- Unit/DOM suite: 419 tests passed, including 507 embedded DOM assertions.
- Render/picking suite: all passed, including flat pixel uniformity, dark/known equality and hidden-terrain checks.
- Release regressions: 69/69, including automatic camera restore and whole-board tilt fitting at six viewport sizes, plus preservation of manual framing.
- WebKit UI: 211/211; motion scheduling: 131/131, including zero application frames when settled.
- Signed offline iOS build succeeded; all 25 bundled game files match the final source. Installation of this visual revision is pending because James’s iPad Pro is currently unavailable to CoreDevice. The previous release remains installed.

Before/after iPad-size browser images, phone views and complete logs are local artifacts in `output/playwright/laser-art/`. These previews are browser captures, not captures of this revision running on the physical iPad. No live NAS deployment is claimed.

## Next design decisions to validate with players

Watch a first-time player find the source, identify the target and make their first bounce without prompting. Test the amber target and raised edges on the actual iPad at comfortable and dim brightness, including grayscale. Then observe whether tilt helps them understand a failed shot and whether they return naturally to editing. These observations should drive further contrast and feedback tuning. Sustained device performance and comfort still need a physical play session.
