# Arcade-table screen-fit pass — 2026-11-22

**Status: implementation and static checks finished; post-change browser/visual verification is blocked in this sandbox.** Changes are left in the working tree for Claude. No git writes, publication, visible app/window, local server, port binding, downloads, or installs were performed. Other batches and `tools/screen-fit/games.json` were not edited.

## Browser evidence and blocker

I personally inspected all eight baseline `sheet-start.png` images. Each contains phone 393×852, iPad landscape 1180×820, laptop 1440×900, and iPad portrait 820×1180. These baseline shots show setup/initial state; they do not establish baseline gameplay behavior.

I attempted exactly the permitted command:

```sh
node tools/screen-fit/capture.mjs --out output/screen-fit/arcade-table-after --batch arcade-table
```

Chromium headless shell exited before creating a page. Its fatal error was `bootstrap_check_in ... MachPortRendezvousServer.18804: Permission denied (1100)`; the log reported SIGTRAP, process exit, and temporary-directory cleanup. No alternate browser or escalation was attempted. The blocker is recorded at `output/screen-fit/arcade-table-after/browser-blocker.txt`.

**There are no after screenshots or after viewport measurements.** Phone, both iPad orientations, and laptop all still need capture, visual inspection, and any resulting iteration outside the sandbox. Menu hit tests in the shot files are prepared but have not executed. Do not treat this report as full visual acceptance, refresh-rate equivalence measurement, touch certification, or sustained performance evidence.

## Changes and observations by game

### ERS

- **Before:** phone setup occupied the narrow screen but covered the home link; iPad landscape setup reached the bottom of its capture; laptop setup remained a centered narrow card; portrait iPad had substantial surrounding empty space. Slap-pattern labels were exceptionally dark. No baseline play shot was available.
- **Changed:** a full viewport table with card/deck sizes constrained by viewport width and height, larger slap surface and readable side panels; two-column setup on wide screens; safe-area-aware Menu above dialogs; all buttons at least 44px. Defined the missing mint color used by selected slap patterns. Hover is gated; existing reduced-motion and hidden-tab timer handling remain.
- **After:** unobserved at all four sizes because Chromium could not launch. In particular, verify table row heights and bottom controls on iPad landscape and phone.
- **Gameplay shot:** deal, allow countdown, play a card with Enter. Rules validator passed.

### Speed

- **Before:** phone setup filled a narrow column and covered home navigation; landscape iPad setup reached below its capture; laptop and portrait iPad showed a small centered panel with large margins. No baseline play shot was available.
- **Changed:** full-width table with viewport-sized human, bot, and center cards; explicitly proportionate bot-card heights; a smaller center-card constraint for the three-pile variant; wide setup split into introduction/settings; safe Menu above dialogs; minimum touch targets; hover gating. Existing hidden-tab pause remains.
- **Preserved:** no legal-card highlighting, dimming, playable/blocked classes, or advance hints were added. Deadlock scheduling, Chill timing, adaptive behavior, rules, and saved formats are unchanged.
- **After:** unobserved at all four sizes. Verify ordinary, three-pile, and local two-player layouts, especially the landscape iPad vertical budget.
- **Gameplay shot:** choose Chill, deal, then use actual keyboard selection/pile events for legal cards, with an assertion that a human card was played. Rules validator passed.

### Zoo Conquest

- **Before:** setup was narrow and cut off on phone, both iPads, and laptop. Baseline document scroll was 783px phone, 565px landscape iPad, 205px portrait iPad, and 485px laptop. The screenshots show the start button/instructions below the visible area on several sizes.
- **Changed:** embedded locally compiled utility CSS replaces the runtime Tailwind script; React UMD and Babel are retained. Setup uses a broad grid, with unchanged How-to-Play and dice rules in an accessible disclosure. Active play uses the available viewport, a framed SVG map, and the existing mobile info drawer. Portrait presentation rotates the same map into the tall axis while counter-rotating territories so their labels remain upright; territory identity, positions relative to each other, connections, armies, content, and rules are preserved. Touch hit circles are enlarged in portrait. Menu remains outside the React root above overlays.
- **After:** unobserved at all four sizes. Priority checks: portrait territory names and hit regions, open drawer/control access, expanded help, and setup height on landscape iPad. No claim of eliminating the measured baseline scroll is made.
- **Gameplay shot:** explicitly choose Turtles, start, then click a Turtle-owned territory through its existing click handler. JSX and transpiled JavaScript syntax passed; no dedicated batch validator was specified.

### Particle Conquest

- **Before:** the canvas was already viewport-sized, but menu content was small and centered on larger screens. The phone title was cut off at the top, and its lower menu content reached the capture edge. Landscape iPad/laptop left large margins; portrait iPad had a small central settings cluster.
- **Changed:** a cohesive two-column wide setup, stacked phone setup, readable help disclosure, stronger panel contrast, safe HUD/navigation spacing, and framed bottom ability controls. Kept full-viewport rendering and the existing capped DPR. Resize now rescales active scene positions into the new viewport. Main rendering and the music-filter animation stop scheduling while hidden; the multiplayer AI tick skips hidden documents. Integer unit totals only update DOM text when changed. Simulation remains delta-based.
- **Service worker:** cache bumped to `particle-conquest-v3-screen-fit-20261122`. The precache remains `./`, `./index.html`, and `./manifest.json`; each exists. Removed manifest icon references to `icon-192.png`/`icon-512.png`, which do not exist in this game directory; the existing generated iOS icon code remains.
- **After:** unobserved at all four sizes. Verify HUD/planet clearance, resize during active play, first-run help, and returning-player service-worker behavior. Multiplayer behavior was not runtime-tested.
- **Gameplay shot:** launch Easy, dismiss the first-run tutorial through its existing Skip control, and send from a player planet to a neutral planet using canvas mouse events. JavaScript syntax and precache existence checks passed.

### Nexus / Tower Defense

- **Before:** phone title conflicted with the fixed Menu, and the one-column map list ran down beyond the viewport. Landscape iPad/laptop had small dark thumbnails and open space; portrait iPad showed the six maps with very small metadata. No baseline play shot was available.
- **Changed:** brighter, broader mission selection; three-column wide/two-column phone map layout; safe Menu clearance; HUD resource/action grids with 44px buttons; a canvas fitted to the remaining dynamic viewport. A HUD ResizeObserver refits the canvas when HUD height changes. Rendering stops while hidden, play pauses, and spawning skips hidden documents. Decorative star movement is time-based. Existing fixed-step combat and DPR cap remain.
- **After:** unobserved at all four sizes. Verify phone HUD, Build placement/confirmation, tower panel, pause/help overlays, and orientation changes during combat. Phone setup may scroll.
- **Gameplay shot:** select the unlocked map, open Build, choose a tower, click a location satisfying existing path/tower-clearance rules, start the wave, and wait for combat. JavaScript syntax passed; no dedicated batch validator was specified.

### Dots & Boxes 3D

- **Before:** the cube was tiny at all four sizes. Phone side panels occupied much of the space around it; landscape iPad and laptop showed a small cube in an otherwise enormous stage; portrait iPad similarly underused the available board space.
- **Changed:** dedicated board viewport that excludes HUD controls; bounding-sphere camera fit based on grid size, stage aspect, and field of view; resize/DPR refit. Compact top scoreboard and bottom action grids on narrow/portrait layouts. The persistent Menu link is now a direct body child so body-level tactical/tutorial overlays cannot cover it. Auto-rotation, pulse, and decorative particle motion are time-normalized. Main render scheduling stops while hidden. Help, layers, camera controls, themes, sound, and existing rules remain.
- **After:** unobserved at all four sizes. Verify camera fit through every rotation and grid size; phone action/layer/timer spacing; raycasting; tactical/tutorial overlays; and long labels. CSS geometry alone is not runtime proof.
- **Gameplay shot:** project an existing edge to its screen coordinate and dispatch canvas down/up events, then allow the AI response. JavaScript syntax passed; no dedicated batch validator was specified.

### Snowman Siege

- **Before:** phone setup used a narrow full-height panel. Landscape iPad and laptop had broad black side bars around the constrained stage; portrait iPad had empty space around all sides. The underlying authored battlefield is 600×800 (3:4).
- **Changed:** embedded local utility CSS replaces runtime Tailwind; React/Babel remain. Setup fills the page with broader cards, clearer type, and an atmospheric winter background. Active play fits the actual 3:4 battlefield by both viewport axes, keeping an intentional surrounding frame rather than stretching gameplay. Backing-store resolution follows displayed size and capped DPR via ResizeObserver/resize. Hidden play stops its rAF loop, releases held firing, and uses the existing pause/timestamp correction. Removed an unused per-frame canvas bounds read in combo display. Menu remains above overlays; reduced-motion and hover rules added.
- **After:** unobserved at all four sizes. Verify the intentional frame, complete HUD, pointer-to-world mapping, combo labels, pause/resume, and resize. The fixed battlefield aspect remains; wide screens will still have side framing.
- **Gameplay shot:** start Campaign, hold a pointer in the battlefield to fire, then release to reload. JSX and transpiled JavaScript syntax passed; no dedicated batch validator was specified.

### Cube Jumper / Geometry Dash

- **Before:** phone title and skin row were visibly cut off sideways and the bottom hints conflicted with actions; baseline document overflow measured 1px but does not describe all internal clipping. Larger screens had a compact menu grid; portrait iPad had substantial margins.
- **Changed:** responsive title/letter spacing, contained and wider level selection, wrapping skin choices, in-flow control hints, safe-area-aware buttons, higher HUD contrast, and a persistent top-level Menu. Rendering stops while hidden and resumes with a fresh time origin.
- **Preserved:** authored levels/distances, close 1.55× framing, smooth camera, render interpolation, cached lighting, adaptive DPR, exact-state practice, replay behavior, progression, scoring, difficulty, and saved data.
- **After:** unobserved at all four sizes. Verify phone menu scrolling/skin selection, HUD labels, and play/death/coach/pause overlays. No claim of measured overflow elimination is made.
- **Gameplay shot:** Begin, wait for movement, jump using Space. Existing comprehensive validator passed.

## Checks actually run

- `node games/validate-ers.mjs` — passed: 52 unique cards, six slap patterns, face challenges, 240 simulated complete matches, card conservation and navigation.
- `node games/validate-speed-card-game.mjs` — passed: 300 simulated races, 43 recycling races, three AI speeds, navigation, and the validator's timing/no-hint regressions.
- `node games/validate-cube-jumper.mjs` — passed: 18 levels, six authored worlds, replay/focus practice, eight skins, authored speed/gap checks, and 1.55× framing.
- Eight inline game scripts parsed with the installed Babel parser. The two JSX scripts were transformed with already-installed local TypeScript solely for `node --check`; all eight extracted scripts passed. Particle `sw.js` also passed `node --check`. This does not replace browser execution.
- All eight shot JSON files and their eval expressions parsed. Shot actions remain unexecuted because browser startup failed.
- Embedded/original CSS parsed with local PostCSS; hover rules checked for hover-capable media gating. Selected/focus styles remain available on touch.
- Particle precache paths were checked on disk. No missing precache targets.
- Scoped `git diff --check` passed.

The utility CSS was compiled from the existing game classes using an already-installed Tailwind 4.2.1 package and embedded in the two HTML files. No runtime Tailwind, compiler, install, or build step is required by players. Existing optional Google Fonts and the existing React, Babel, and Three.js CDN scripts remain. Browser regression review of the compiled utility styling is pending.

Static results and extracted syntax-check inputs are under `output/screen-fit/arcade-table-after/static-checks/`. No processes started by this batch remain running.

## Remaining handoff

Claude should run the exact capture command outside the sandbox, inspect every start/play contact sheet, resolve any shot/runtime/layout errors, and iterate before claiming that all eight games pass the four-size visual gate. Check returning-player caches, touch-only flows, hidden-tab/resume, reduced motion, rotation during play, and Speed's three-pile/local variants. Physical audio, touch, 120-Hz behavior, thermal performance, and sustained frame pacing were not measured here.

## Files changed

- `games/ers.html`
- `games/speed-card-game.html`
- `games/zoo-conquest.html`
- `games/particle-conquest/index.html`
- `games/particle-conquest/sw.js`
- `games/particle-conquest/manifest.json`
- `games/tower-defense/index.html`
- `games/dots-and-boxes-3d.html`
- `games/snowman-siege.html`
- `games/cube-jumper.html`
- `tools/screen-fit/shots/ers.json`
- `tools/screen-fit/shots/speed-card-game.json`
- `tools/screen-fit/shots/zoo-conquest.json`
- `tools/screen-fit/shots/particle-conquest.json`
- `tools/screen-fit/shots/tower-defense.json`
- `tools/screen-fit/shots/dots-and-boxes-3d.json`
- `tools/screen-fit/shots/snowman-siege.json`
- `tools/screen-fit/shots/cube-jumper.json`
- `docs/codex/screen-fit-2026-11-22/arcade-table-report.md`
- Generated evidence only: `output/screen-fit/arcade-table-after/browser-blocker.txt` and `output/screen-fit/arcade-table-after/static-checks/`.

## Round 2 — fixes and material polish

Claude supplied real-browser evidence at `output/screen-fit/arcade-verify/`. I inspected every `sheet-start.png` and `sheet-play.png` for this batch and read `report.json`. Its successful page metrics have zero horizontal overflow, zero document scroll, no page errors, muted audio, and visible Menu. Those metrics did not catch the internal overlaps visible in the images. Zoo's four “play” shots still show setup because the step timed out; Speed's landscape iPad step failed its human-move assertion. These are round-1 observations, not evidence of this round's results.

**No browser, capture, server, app, or window was launched in round 2.** The changes below need Claude's next captures before visual acceptance. Rules, scoring, difficulty settings, authored levels, and saved-data formats were preserved. Particle's randomly generated placement region now excludes the measured HUD bands; production game/AI parameters were not changed.

### ERS

- **Fixed:** `#pile-cards` is now a real card-sized positioning container, and every face-up layer is anchored to it. This corrects the absolute-position origin that put cards over SLAP. Table rows reserve space separately for opponents, pile, and human controls. Phone side panels sit above the pile in their own two-column row; the card cannot intrude into the radar column. Card dimensions account for available viewport height.
- **Polished:** generated baize texture, realistic paper edges/contact shadows, serif printed indices, actual 2–10 pip layouts, Ace emblem, decorative court faces, and traditional patterned backs. Kept the purple/neon identity. Labels are larger and clearer; press states are brief; readiness/slap effects are finite rather than continuous idle pulses.
- **Still change/check:** inspect multiple face-up layers, long challenge/radar messages, and three-player mode in all sizes. Confirm SLAP's complete hit rectangle is clear of the pile after the new camera-free layout.

### Speed

- **Fixed:** the app and table use bounded grid tracks rather than intrinsic minimum widths. Phone branding contracts to “Speed,” keeping all three header buttons visible. All five human cards share a single explicit five-column hand. The reserve and “First to ZERO” labels occupy a separate row above the larger center cards. The three-pile variant gets its own width constraint.
- **Polished:** the same photographic baize and physical card-print treatment as ERS, with Speed's cool neon palette. Larger indices, hand-slot numbers and status labels; consistent control depth, corners and press motion. No playable-card hints, dimming, legal-card classes or advance highlighting were introduced.
- **Shot fixed:** a shot-only LCG shuffle seed of **1** was found and checked against the existing pure engine: it allows two consecutive legal opening human moves. The shot temporarily supplies that RNG for the ordinary Deal action, restores `Math.random`, then sends the existing keyboard selection/pile events and asserts both moves. It no longer depends on a lucky natural draw/retry window. Production source randomness and rules are unchanged.
- **Still change/check:** inspect phone indices/pips at actual size, all five cards, all header actions, three-pile play, and face-to-face mode. Court faces are crisp vector ornamentation; more elaborate engraved court illustrations would be a later art improvement.

### Zoo Conquest

- **Shot fixed:** army buttons now have stable `data-army` attributes and descriptive ARIA labels. The play shot uses `button[data-army="turtles"]` rather than matching emoji/text split across child elements. It then starts the existing game and reinforces a Turtle-owned territory through the actual click handler.
- **Polished:** a light board-game setup card with physical edge/shadow, stronger action/army-button treatment, readable secondary text and disabled states, consistent system typography, richer map lighting/frame, clearer sidebar/phase labels, and finite victory motion. Kept the animal-board identity and help disclosure.
- **Still change/check:** an actual play capture is the first priority. Inspect the upright portrait territory names, touch-hit spacing, open sidebar, battle dialogs and dice. Do not infer those passed from the previous setup-only shots.

### Particle Conquest

- **Fixed:** top navigation, unit status, speed/level metadata, the battlefield, and bottom command dock have distinct bands. Sound explicitly resets the old left offset that jammed it against Menu. Abilities, percentages, minimap and guide occupy separate dock cells. The legend is behind a native “Planet guide” disclosure; rally help is omitted from the narrow dock while the full guide remains available. The ad-free badge is now setup metadata rather than a fixed caption under the minimap. Planet generation and resize map positions into the unobscured vertical field, based on band bounds measured only during resize.
- **Polished:** a cohesive command-deck material, legible opaque panels, restrained cyan accents, tactile ability/percentage buttons, improved label contrast and finite result glow. Menu rendering sleeps; result rendering stops after its brief finish. Active simulation remains delta-based.
- **Cache:** bumped to `particle-conquest-v4-polish-20261122`; all existing precache targets exist. No new asset dependency in this game.
- **Still change/check:** inspect the phone/portrait dock, expanded guide, HUD-clear planet placement on later levels, resize mid-flight, first-run tutorial, and multiplayer. Higher-density random fields deserve an explicit later-level capture; this round did not change their counts or AI settings.

### Cube Jumper

- **Fixed:** score/attempt readouts reserve the right-hand pause/sound hit areas. Phone metadata uses separate vertical slots, with the temporary level-intro plaque below them. The progress percentage is now a prominent contrast-backed chip. Portrait rendering adds a height-aware presentation zoom and lowers the displayed floor, reducing the unused region below the run. This affects drawing only: the original `GAMEPLAY_ZOOM = 1.55`, physics, coordinates, interpolation, adaptive DPR and authored camera follow remain in place.
- **Polished:** larger, brighter HUD/menu labels, compact contrast-backed metadata, a lit intro plaque, readable skin/level labels, unclipped wrapping skin choices, consistent press states and static menu presentation. The canvas loop sleeps on the menu and wakes for play/resize.
- **Still change/check:** inspect portrait ceiling/floor framing across ship, wave and flipped-gravity sections, plus longer level/music names. Confirm that closer visual framing still provides comfortable obstacle preview. Physical timing/difficulty was not retuned.

### Snowman Siege

- **Fixed:** the canvas and winter scene fill the entire viewport; the authored 600×800 battlefield is uniformly scaled into the space clear of HUD panels. On narrow screens it anchors immediately above the bottom command panel, with the winter scene continuing behind the whole frame instead of empty bars. On landscape iPad/laptop the HUD uses the scenic left side, leaving the central field its full height. Wide side areas are part of the generated moonlit forest panorama. The same explicit transform drives drawing, aiming and combo placement; 16 forward/inverse coordinate checks across the four requested viewport sizes passed. Collision geometry, enemy timing, weapon behavior and travel distances remain unchanged.
- **Polished:** photographic snowy pines/mountains/aurora, transparent full-frame canvas, subtle biome tint and translucent snow ground, readable contrast-backed score/objective/ammo panels, stronger setup cards/disabled states, and consistent press transitions. The full-frame background is a CSS image rather than a per-frame image allocation. No physics stretching or extra offscreen enemies were added.
- **Still change/check:** review the phone's expanded sky/active-field composition, the central field's blend with the wide scenery, pointer targeting, combo locations, reload text, HP/ammo panels and pause. This deliberately preserves a uniform battlefield scale rather than stretching snowmen/collision shapes to fill a different aspect ratio.

### Dots & Boxes 3D

- **Fixed:** Sound used `.mute-btn`, so it missed the original `.action-button` grid sizing. It now shares the bounded width/minimum-size rules. All action-grid children can shrink within their tracks; labels wrap at spaces, and additional bottom space is reserved for the taller readable rows.
- **Polished:** one consistent illuminated control family, clearer type, improved cyan-button contrast, a richer lit board stage, and no continuously floating background orbs. The renderer now runs in short bursts for interactions/effects and sleeps when the board is still; explicit Auto Rotate still animates. Move celebrations and queued camera fly-to sequences request enough rendering time to finish.
- **Still change/check:** inspect the complete Sound label, timer/player rows, all ten controls, themes, layers, long tactical/tutorial panels, and the demand-render wakeups after AI moves, resize and camera interactions.

### Nexus Defense

- **Fixed:** portrait iPad mission selection uses a two-column, three-row grid that grows into the remaining screen height. Preview canvases follow their actual card boxes and use capped DPR. Mission labels are readable rather than dark path-color text.
- **Polished:** brighter previews, consistent mission-card surfaces/edges, larger type, quieter locked-card styling without unreadable opacity, clearer HUD/Build controls, short press states, and a cached map-colored lighting gradient behind the battlefield. The covered selection-screen star loop and repeated resource shine are disabled while idle.
- **Still change/check:** inspect portrait mission cards at all progression states, full phone labels, long commander names, Build/tower panels, and selected-card/locked-card distinction. Verify the resize-observed previews and normal gameplay loop after selecting a mission.

### Generated art and validation

The built-in image generator produced a dark macro baize material and a moonlit winter forest panorama. Both outputs and the compressed JPEGs were inspected directly as images, without opening an app/browser. Exact prompts and processing notes are beside the assets:

- `games/ers/felt.jpg` and `games/ers/PROMPTS.json` — 114,935 bytes.
- `games/speed-card-game/felt.jpg` and `games/speed-card-game/PROMPTS.json` — 114,935 bytes; same generated material.
- `games/snowman-siege/winter-panorama.jpg` and `games/snowman-siege/PROMPTS.json` — 496,813 bytes.

Compression used built-in `sips`; no downloads, new libraries or installs were used. Raster assets are entirely local to their games.

Checks run after the round-2 edits:

- All three named validators passed again: ERS, Speed, Cube Jumper.
- Eight inline scripts parsed; JSX transformed only for `node --check`; all extracted game scripts and Particle's service worker passed syntax checks.
- All stylesheets parsed, hover media gating checked, and all eight shot specs/eval programs parsed.
- Printed-face checks passed for pip counts 2–10, Ace and all three court ranks in both card games.
- Speed's seeded deal was checked with the existing engine for two legal opening human moves.
- Snowman's shared uniform transform passed 16 forward/inverse aiming checks at the four target viewport dimensions.
- Selected specified opaque foreground/background pairs computed between 6.21:1 and 13.93:1. This is a color-pair calculation, not a claim that every composited pixel/state has passed browser contrast inspection.
- Particle precache path existence checked; scoped whitespace check passed.

No new screenshots, runtime interaction results, frame-rate measurements, physical-device results or screenshot-derived “after” dimensions are claimed for this round. Claude should capture the same eight games again and inspect every sheet, including the now-repaired Zoo/Speed steps. All changes remain in the working tree; no git writes were made.

### Round-2 files changed

- `games/ers.html`
- `games/speed-card-game.html`
- `games/zoo-conquest.html`
- `games/particle-conquest/index.html`
- `games/particle-conquest/sw.js`
- `games/tower-defense/index.html`
- `games/dots-and-boxes-3d.html`
- `games/snowman-siege.html`
- `games/cube-jumper.html`
- `tools/screen-fit/shots/zoo-conquest.json`
- `tools/screen-fit/shots/speed-card-game.json`
- `games/ers/felt.jpg`
- `games/ers/PROMPTS.json`
- `games/speed-card-game/felt.jpg`
- `games/speed-card-game/PROMPTS.json`
- `games/snowman-siege/winter-panorama.jpg`
- `games/snowman-siege/PROMPTS.json`
- `docs/codex/screen-fit-2026-11-22/arcade-table-report.md`
- Static verification evidence refreshed in `output/screen-fit/arcade-table-after/static-checks/round-2-results.json` and its extracted syntax-check inputs.

## Round 3 — continuous scene, clear labels and planet spacing

Input: Claude's captures in `output/screen-fit/arcade-verify2/` and checkpoint `6dec559`. I inspected the three play contact sheets, Zoo's laptop play image, and Particle's phone play image, and read the corresponding report entries. They confirm clean page/step errors, document bounds and audio muting before this round, while the images expose the remaining internal presentation issues.

**No app, window, browser or capture was launched. No git writes were made.** Only the three requested games, their relevant shot definitions and this report changed. The other five arcade-table games were left alone.

### Snowman Siege

The field-only translucent sky and ground rectangles caused the visible column. The biome/night tint now covers the complete viewport before the uniform battlefield transform is applied. Freeze tint also covers the complete viewport. The extra field-width snow rectangle is removed; the existing panorama supplies one continuous ground surface across the center and sides. The danger line and actual game objects remain in their established positions.

Compared with `6dec559`, the field-fitting helper, inverse pointer mapping and simulation/update callback are byte-for-byte unchanged. Thus the playable width, field transform, aim, enemy/weapon timing and difficulty are preserved. Sixteen forward/inverse aiming checks across the four requested sizes passed. New screenshots are still needed to confirm the visual seam is gone, including during night/freeze effects.

### Zoo Conquest

Territory names now occupy a separate foreground layer, above every node and badge. A cached label layout finds clear backed rectangles around the unchanged node graph, with short leader lines. It explicitly excludes both the node's outer ring and the offset troop-count badge, and separates labels from one another. Leader lines are painted before all label backings so they cannot cross printed names. The top and bottom region titles moved into clear outer gutters and have dark halos.

Every label remains selectable through the existing territory action; portrait node hit areas account for the additional label gutters. A persistent, readable territory-name bar shows the full name after any tap, including reinforcement taps and inspection during an AI turn. It also displays restored selections. This is transient presentation state and adds nothing to the saved-data format.

All 42 canonical node coordinates, names, regions and adjacency records match `6dec559` exactly. Both orientation layouts passed checks for all 42 labels: no label/node, label/badge or label/label collisions in the calculated map geometry, with at least three map units of clearance. These are geometry checks, not new raster/font measurements. The next capture should confirm actual typography, the five named problem areas, region-title gutters and the phone name bar. The Zoo play shot now asserts that the tapped name appears in full and stays inside the viewport.

### Particle Conquest

The old center-distance search could accept an invalid position after exhausting its attempts, and did not account for actual radii. Final layout now uses the generated planets' real radii, ring buffers, balanced rows and a minimum display-space gap. Rows span the available field, rather than leaving an accidental narrow central cluster. A uniformly scaled view is used only when necessary to fit a dense field; every planet keeps its raw size, size ratios, capacity, production, units, type and starting owner. Mouse, touch, long-press/rally, floating text and the play shot use the same forward/inverse scale. Main unit counts retain their minimum screen type size. The canvas backing store remains bounded by the native viewport and capped device DPR.

Layout is applied after the existing generation, boss setup and starting-owner/upgrade assignment, and on resize. It does not consume RNG. Source comparisons with `6dec559` passed for the Planet constructor, production/defense/capacity getters, simulation update and hit testing, AI logic and difficulty settings. Generation/owner/RNG source also matches except for the added final layout calls. Authored moving-boss behavior is retained; the geometry tests cover generated/resized layouts, not every later boss trajectory.

Checks covered 1,200 layouts over all four viewport field sizes, counts 6/8/10/12/18/24, generated radius sets and worst-case large radii. All 116,600 pair checks passed, with a minimum 16 CSS-pixel gap between the buffered planet footprints and no field-boundary violations. Data-only tests of the actual resize function preserved all non-position attributes for 48 planets, passed 48 pointer round trips, and retained the capped native pixel budget at all four sizes. The play shot now asserts bounds and the minimum gap in the real page. Its new assertions have not run here.

Particle's cache is bumped to `particle-conquest-v5-clear-map-20261122`; all precache paths still exist. New captures should check phone and portrait distribution, input after scaling/rotation, higher-density maps and the unchanged HUD bands.

### Checks and remaining verification

- All three game scripts parsed; JSX was transformed only for `node --check`, and all three passed. CSS parsing passed.
- Particle's service worker passed `node --check`, and its precache targets exist.
- All three relevant shot specs/eval programs parsed.
- The source-invariant and geometry checks above passed against `6dec559`.
- Scoped `git diff --check` passed.

No rendered after-results, physical-device results or performance measurements are claimed for this round. Claude will run the browser captures. No process started by this round remains running.

### Round-3 files changed

- `games/snowman-siege.html`
- `games/zoo-conquest.html`
- `games/particle-conquest/index.html`
- `games/particle-conquest/sw.js`
- `tools/screen-fit/shots/zoo-conquest.json`
- `tools/screen-fit/shots/particle-conquest.json`
- `docs/codex/screen-fit-2026-11-22/arcade-table-report.md`
