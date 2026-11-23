# Rough games — arcade visual pass

Implementation is saved in the working tree. **No app, window, browser, server or capture was launched, and no git writes were made.** Claude's existing four-size play sheets in `output/screen-fit/final/` were inspected before editing. Post-change game screenshots and interaction checks remain for Claude.

## Nexus Defense

The six battlefields now use distinct original generated terrain: meadow, tundra, basalt, crystal cavern, industrial metal and alien mineral ground. A shared gravel material is composited through a mask stroked from the **existing game path**, at the unchanged `CFG.PATH_WIDTH`. Shoulders, contact shadows and restrained edge detail make the route read as a road. No painted/generated road is substituted for the authored centerline.

The complete terrain/road composition is cached by map, viewport, DPR and asset revision. Mission previews use the same material compositor. Towers now have shaded metal footings, bolts, bevels, turret housings and recessed muzzles. Enemy bodies use cached lit drone/armor sprites with ground shadows, while health and status indicators remain. Tier/goal labels have dark contrast backings over the detailed ground.

The source comparison preserved the original `MAPS`, `CFG`, tower/enemy definitions, path scaling, waves, combat, targeting, prices, progression and storage functions. Existing non-draw class methods are unchanged. Material loading is optional: the native scene/control flow still works before images arrive or if an image fails.

The play shot now makes three ordinary legal purchases/placements near the entrance and waits for combat. Its search uses the existing road clearance, tower spacing and weapon ranges. Data-only checks found valid in-range placements at four field sizes; this updated shot has not been executed in a browser.

**Next visual review:** all six terrain/road combinations at four sizes, enemy visibility on bright ice, material loading/fallbacks, tower range/status cues, and the new combat shot.

## Particle Conquest

An original quiet deep-space backdrop replaces the flat black field. Rock/crater and cloud-band albedo maps were projected into an eight-sphere atlas with spherical UV mapping, a lit upper-left hemisphere and a dark terminator. The production renderer crops these pre-baked sprites rather than projecting texture pixels during animation. Neutral surfaces remain believable; owner-colored atmospheres and the existing strong ownership rings make factions distinct.

The globe body still uses each planet's exact existing radius. The recently added spacing layout, uniform presentation scale, pointer mapping, ownership, size ratios, capacity, production, starting conditions, AI and difficulty definitions are unchanged. Selection, shield, EMP and wormhole cues remain. Type icons use small backed badges, and unit/rate readouts have contrast panels so bright mineral/cloud surfaces cannot wash them out.

Atmospheres and the space layer are cached. A single locally rasterized plain sphere is the optional fallback; textured spheres are already baked. No new per-frame texture projection or layout reads were added.

The worker is now `particle-conquest-v6-rendered-worlds-20261122`. Its seven precache entries include the backdrop, both source albedos and the production atlas, as well as the existing HTML/manifest targets. All paths exist. The play shot waits for the two production material images, then follows the existing attack and spacing checks.

**Next visual review:** cyan/red/neutral ownership at a glance, special types, fog/privacy, small/dense maps, atlas loading and returning-player service-worker updates. No new runtime/performance certification is claimed.

## Cube Jumper

All six authored worlds have distinct generated distant scenery: industrial city, foundry, glacier, jungle ruins, cosmic rift and mechanical core. Mirrored panorama tiles avoid hard repeat seams and move slowly behind the existing world motifs. Metro also has two cached near-city layers at different scroll rates, replacing its repeated per-frame window drawing.

The floor now has shaded slab faces, depth, inset panels and material details appropriate to the world. Cube skins retain their eight identities and printed patterns, with a lit face, grain and beveled edges. Spike faces have cached facets, highlights and a dark silhouette edge, with resolution chosen for the existing close/portrait camera. Block faces also have clearer edge depth.

Level coordinates, jump/collision physics, timing, camera/interpolation, adaptive DPR, music, controls, saved data, skins, practice and replay behavior are preserved. The original 1.55× base framing remains. Raster art loads lazily by world with the existing native background as fallback.

**Next visual review:** all world backdrops and skin choices, image repeat/scrolling, foreground hazard separation on ice/bright scenery, portrait framing, and warm/cold image loading. The existing play shot remains unchanged.

## Assets and prompts

Sixteen original images were generated with the **built-in image_gen tool**. The seventeenth image is the deterministic sphere atlas derived from the two albedos using the renderer's projection/lighting functions and data-only Node/Sharp rasterization. Each asset has a sibling `.prompt.txt` containing its exact prompt and processing notes. No source image was downloaded; no package was installed.

All 17 WebP images have distinct hashes. Total compressed image bytes: **2,279,402**. Every image is under 300,000 bytes, below the 600 KB hard cap.

| Asset | Dimensions | Bytes |
| --- | --- | ---: |
| `games/cube-jumper/art/engine-distance.webp` | 1536×768 | 98,852 |
| `games/cube-jumper/art/foundry-distance.webp` | 1536×768 | 72,634 |
| `games/cube-jumper/art/glacier-distance.webp` | 1536×768 | 115,018 |
| `games/cube-jumper/art/jungle-distance.webp` | 1536×768 | 143,862 |
| `games/cube-jumper/art/metro-distance.webp` | 1536×768 | 50,400 |
| `games/cube-jumper/art/rift-distance.webp` | 1536×768 | 75,222 |
| `games/particle-conquest/art/cloud-albedo.webp` | 1536×768 | 109,068 |
| `games/particle-conquest/art/deep-space.webp` | 1536×1024 | 29,062 |
| `games/particle-conquest/art/planet-atlas.webp` | 1024×512 | 82,724 |
| `games/particle-conquest/art/rock-albedo.webp` | 1536×768 | 266,894 |
| `games/tower-defense/art/crystal-terrain.webp` | 1024×1024 | 182,272 |
| `games/tower-defense/art/emerald-terrain.webp` | 1024×1024 | 264,188 |
| `games/tower-defense/art/frozen-terrain.webp` | 1024×1024 | 177,210 |
| `games/tower-defense/art/grid-terrain.webp` | 1024×1024 | 95,522 |
| `games/tower-defense/art/rift-terrain.webp` | 1024×1024 | 187,108 |
| `games/tower-defense/art/road-material.webp` | 512×512 | 103,096 |
| `games/tower-defense/art/volcanic-terrain.webp` | 1024×1024 | 226,270 |

The generated art and the baked sphere atlas were inspected directly as image files. Those inspections are asset QA, not post-change game captures.

## Checks actually run

- `node games/validate-cube-jumper.mjs` passed: 18 levels, six authored worlds, eight skins, replay/practice, timing/gap checks and 1.55× framing.
- All three inline scripts passed parser and `node --check` checks. Their CSS parsed. All three shot specs/eval programs parsed.
- Source comparison against the committed checkout verified unchanged pre-existing initializers and protected functions/methods. Nexus: 77 functions, 14 methods and 62 initializers; Particle: 140 functions, 27 methods and 105 initializers; Cube: 57 functions, 32 methods and 98 initializers. Only the explicit rendering functions differed.
- The Nexus material tracer reproduced all road points in 24 map/field-size cases. Twelve capture placements met the unchanged clearance, spacing and entry-range conditions.
- Data-only repeated-access checks found no new canvases/gradients for warm Nexus scene/platform/turret/enemy caches, and the cube-face cache reused its result.
- Twenty-four floor/ceiling spike cases preserved width, height, base and tip placement.
- 1,764 sphere-projection samples passed UV, alpha and lighting bounds; the upper-left light value exceeded the opposed-side value by more than three times. Atlas transparency was checked.
- Image dimensions, caps, unique hashes, prompt receipts, all seven service-worker targets and worker syntax passed.
- Scoped `git diff --check` passed.

Data-only render stand-ins and asset inspection do not establish browser rendering, controls, frame pacing or physical iPad performance. No new “after” measurements or browser success claims are made. No process started by this task remains running.

## Files changed

- `games/tower-defense/index.html`
- `games/tower-defense/art/*.webp` and matching `*.prompt.txt` (seven material assets)
- `games/particle-conquest/index.html`
- `games/particle-conquest/sw.js`
- `games/particle-conquest/art/*.webp` and matching `*.prompt.txt` (four material assets)
- `games/cube-jumper.html`
- `games/cube-jumper/art/*.webp` and matching `*.prompt.txt` (six world assets)
- `tools/screen-fit/shots/tower-defense.json`
- `tools/screen-fit/shots/particle-conquest.json`
- `docs/codex/rough-games-2026-11-22/arcade-report.md`

## Round 2 — Nexus callout placement and contrast

Reviewed Claude's `output/screen-fit/rough-r1/tower-defense/` contact sheet and all four per-size play PNGs. The phone/portrait combo sits over the HUD, and the unbacked yellow synergy names cross towers/road or disappear into grass. The tundra material was also inspected directly. The supplied report's zero-error, muted, zero-scroll results are pre-change evidence; no new browser capture was attempted.

### Changes

- Combo and damage notices now live in a non-interactive layer fitted to the existing canvas rectangle during resize. It is clipped to the field and stacked below the unchanged HUD, so it cannot paint over HUD numbers or buttons. Canvas size, path geometry and input coordinates are unchanged. The resize code reuses its existing cached rectangle; no per-frame DOM bounds reads were added.
- The combo gets a dark, gold-edged backing and chooses a clear field location rather than using the old fixed `top:80px`. Placement avoids the tower/caption footprints and road. A fixed left anchor was also checked and rejected because it could touch a tower on phone tundra. Existing opacity/scale transition timing is retained; relocation itself does not animate through actors.
- The “★ Cryo Boost” text was a persistent canvas synergy caption, not a damage float. It now uses the existing backed-caption renderer and a cached clear-space layout, avoiding towers, road and other callouts. The same first active synergy name is shown at the same times; no grouping or new values were introduced. Very dense late-game fields retain an in-field backed fallback if no clear location exists; the HUD stays protected.
- Damage/reward/upgrade floats now use field-local coordinates rather than accidentally treating them as page coordinates. They have dark backings and bounds that account for their complete upward travel and peak critical scale. Long multi-word notices wrap without truncating their values. Normal text remains at least 14px. The 100ms normal throttle, crit bypass, 1000ms lifetime, easing and original float/crit keyframes are unchanged.
- The Nexus shot now checks the actual field/visible combo/damage bounds, HUD-number/button separation and buff-caption placement. These new page assertions are prepared for Claude and have not run here.

### Checks run

- JavaScript parser, `node --check` via stdin, CSS parsing and shot/eval syntax passed.
- Data-only geometry checks passed for 24 map/field cases: all six map shapes at the four target widths with representative field heights. All 72 combo/buff boxes were in bounds, mutually separate, and clear of tower footprints and road. This includes Frozen Wastes/tundra geometry.
- 240 floating-label envelope cases passed, covering normal/crit notices, short and multi-word values, center/corner origins, and all four field sizes. These are mathematical layout checks, not browser/font screenshots.
- Fully visible contrast calculations passed: combo 15.03:1; backed buff text 14.26:1 even composited over pure white (more demanding than the tundra image); red damage text 4.63:1. Fade-out opacity is unchanged.
- Data-only callback tests preserved text/color values, the 100ms throttle, crit bypass and 1000ms removal.
- Source comparison preserved 90 existing protected functions, 15 class methods and 71 original initializers. Combo threshold/value code matches the committed version apart from the presentation refresh. Combat, buffs, map/path data, scoring, clocks, assets, sound and saved-data logic are unchanged. Both floating-animation keyframe blocks match exactly.
- Scoped `git diff --check` passed.

No app, window, browser, server or capture was launched; no git writes were made. The terrain, road, tower/enemy art and all other games were left alone. Claude should inspect the next four-size capture and a real tundra run for final rendered acceptance. No new visual or performance certification is claimed.

### Round-2 files changed

- `games/tower-defense/index.html`
- `tools/screen-fit/shots/tower-defense.json`
- `docs/codex/rough-games-2026-11-22/arcade-report.md`
