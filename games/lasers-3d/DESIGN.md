# Lasers 3D (working slug `lasers-3d`, name NOT chosen) — design spec

Date: 2026-09-03. Author: Claude (Fable 5.1) from James's brief. Status: v1 rules FROZEN for the build; the "Uniqueness" section is appended after the prior-art research completes.

## 1. The brief, in James's words

"Build an iOS compatible lasers and mirrors game that has a unique twist... it is 3D. You get limited mirrors to place and have to go from starting laser to the target/goal. I already have a game like this in my Alford family game portal. Now add a twist that literally turns the game on its side, revealing hidden 3D elements. The wall that looks like a regular wall has parts that are actually higher or lower. The mirror piece that looks like a wedge is actually angled up also such that the laser beam goes 45 degrees right... but also goes 45 degrees up."

## 2. Concept in one paragraph

From straight above it is the family portal's Lasers & Mirrors: an emitter, a target, walls, a limited tray of 45-degree mirrors, tap to place, tap to rotate, fire. The board is secretly a voxel grid with heights. An orthographic camera pointed straight down genuinely cannot see height (block sides are edge-on), so the flat view is an honest lie. One drag, or the TILT button, rolls the camera to an isometric view and the truth appears: walls with low sections a beam can pass over, targets on plateaus, and "wedge" mirrors whose reflecting face is sloped, so the beam turns AND climbs one level per cell until something at the right height catches it.

## 3. Rules (FROZEN for v1; every builder implements exactly this)

### 3.1 Board
- Grid `W x D` cells (levels use 6x6 to 9x9). Heights `z` in `0..3` (`H_MAX = 4` levels).
- Terrain `t[x][y]` in `0..3`. A cell is solid for all levels below `t`. `t = 0` is the floor. Walls are simply terrain with `t >= 1`. There is no separate wall type.
- Axes: `x` east, `y` north, `z` up. Cell centers are integer coordinates.

### 3.2 Beam
- Beam state: cell `(x, y)`, level `z`, horizontal direction `d` in `{E, N, W, S}` = `(1,0), (0,1), (-1,0), (0,-1)`, pitch `v` in `{-1, 0, +1}`.
- A beam at level `z` travels at height `z + 0.5`. It is drawn from cell center to cell center; a pitched segment is a 45-degree diagonal.
- Step: the next cell is `(x+dx, y+dy)` at arrival level `z' = z + v`.
  - If the next cell is off the grid: beam LOST (exits the board).
  - If `z' < 0`: beam LOST (hits the floor). If `z' > 3`: beam LOST (into the sky).
  - If `t[next] > z'`: beam BLOCKED at the wall face. The visual stops at the cell boundary.
  - Otherwise the beam enters `next` at level `z'`.
- Interaction: on entering a cell that has a piece (fixed or placed) the piece acts only if `z' == t[cell]` (the piece sits on top of the terrain and is one level tall). If `z' > t[cell]` the beam passes over the piece; that is intentional and hidden from the flat view.
- Emitter: on its own cell at level `t[cell]`, emits with pitch `0` in its facing direction. The beam starts at the emitter's cell center.
- Target: an orb on a cell at level `t[cell]`. Lit when a beam enters the cell at level `t[cell]` from any direction. The beam stops at the target. Multi-target levels require all targets lit.
- Loop guard: stop after 400 steps or when a state `(x,y,z,d,v)` repeats.

### 3.3 Pieces (the tray)
All three pieces turn the beam 90 degrees exactly like a classic 45-degree mirror, are double-sided, and have two orientations, `/` and `\`. What differs is the pitch they give the outgoing beam.

| Piece  | Turn | Outgoing pitch | Top view | Tilted view |
|--------|------|----------------|----------|-------------|
| MIRROR | `/` or `\` | `0` (levels the beam) | diagonal line | vertical panel |
| WEDGE  | `/` or `\` | `+1` (climbs)         | identical diagonal to MIRROR | sloped panel, face tilted up |
| DIP    | `/` or `\` | `-1` (descends)       | identical diagonal to MIRROR | sloped panel, face tilted down |

- Turn table for `/`: `E -> N`, `N -> E`, `W -> S`, `S -> W`. For `\`: `E -> S`, `S -> E`, `W -> N`, `N -> W`.
- Fixed pieces in a level are pre-placed, cannot be moved, and are unlabeled in the top view (a fixed WEDGE looks like a fixed MIRROR from above; this is the "looks like a wedge, actually angled up" twist). Tray pieces are labeled in the tray, so the player knows what they are placing.
- The piece registry is data (`{turn, pitch}`) so twist pieces can be added later without touching the stepper.

### 3.4 Placement
- One piece per cell. Cannot place on the emitter, a target, a fixed piece, or another placed piece. CAN place on raised terrain; the piece then sits at that level.
- Tap an empty cell with a tray piece selected: place it in orientation `/`. Tap a placed piece: rotate (`/` to `\` to `/`). A floating X (touch) or Delete (keyboard) returns it to the tray. Drag a placed piece to move it.
- FIRE traces the beam with a travel animation. The beam stays visible after firing; changing any piece re-traces immediately (live beam, like the existing game's feel) but the FIRE count only increments on FIRE.

### 3.5 Camera and the reveal
- Orthographic camera. FLAT = azimuth north-up, elevation 90 degrees, unlit flat shading: every block top is the same color as the floor plus a thin outline, so heights are invisible. Sides are edge-on and thus invisible. Placed pieces show their `/` or `\` line.
- TILT = elevation ~35 degrees, azimuth -45 degrees, lit with a directional light and soft shadows. Drag on empty board space (one finger or mouse) orbits azimuth and elevation freely; pinch zooms. A FLAT button snaps back with an eased animation. Shading intensity is a function of elevation so the lie dissolves continuously as the board tilts.
- Fair tells in FLAT (required): the drawn beam gets brighter and wider per level, and a small altitude badge (for example `^2`) sits at each pitch change and at the beam's end; the badge only appears after a FIRE.
- The first time a level contains hidden height the game plays the reveal once for free after the first failed FIRE (auto tilt, then auto flat). Only levels 4 and 5 do this; after that the player owns the camera.

### 3.6 Stars and progression
- 1 star: all targets lit.
- 2 stars: solved using at most `par` pieces. Levels hand the player a tray with slack (`tray >= par`); `par` is the minimum the solver proves.
- 3 stars: solved with zero tilts on that attempt (a "blind" solve). Any camera drag or TILT press clears it for the current attempt; RESET restores eligibility.
- Progress in `localStorage` under one key `lasers3d.v1` = `{currentLevel, highestUnlocked, stars: {index: 0..3}, muted}`. Corrupt or missing storage must never throw.
- Hint: highlights one solution piece's cell and orientation as a ghost for 2 seconds. Using a hint forfeits the 2-star (par) condition for that attempt.

### 3.7 Level set
- ~20 levels, curated from a generator and validated. Levels 1 to 3 are pure 2D (no height, MIRROR only) so the game reads as the sibling of the existing one. Level 4 introduces a hidden low wall. Level 5 introduces the WEDGE. Level 7 introduces the DIP. Level 9 introduces a fixed secret WEDGE. Level 12 introduces two targets. Later levels combine.
- Every level from 4 on must be **3D-necessary**: solving it under the classic flat rules (all `t >= 1` treated as full walls, every piece behaves like MIRROR) is either impossible with the tray, or every such flat solution fails when replayed in true 3D.
- Board sizes follow the curve in section 11 (12x12 up to 24x24). Cells are NOT shrunk to fit; see section 11 for the camera rule.

## 4. Non-functional requirements
- iOS Safari first (iPhone and iPad, portrait and landscape), then desktop. Touch, mouse, and keyboard all work.
- Zero network dependencies at startup: Three.js r160 UMD is vendored at `games/lasers-3d/vendor/three.min.js` (sha256 starts `170c6789`). System fonts only. No Tailwind, no Google Fonts, no CDN.
- Portal house pattern: fixed `Menu` link top-left at `z-index: 9999` that nothing may cover; How-to-Play modal with a focus trap; `apple-mobile-web-app-capable`; theme-color meta.
- Known portal bug classes to avoid, each with a test or a check: delta-time for all animation (no per-frame constants), `devicePixelRatio` scaling capped at 2 for GPU sanity, viewport fitting from the minimum of `#stage` client size, `visualViewport`, and `documentElement` client size with re-fit on `resize`, `orientationchange`, `visualViewport.resize`, and a `ResizeObserver`; no sticky hover states on touch; overlays never share or beat the Menu link's z-index.
- Performance target: 60 fps on an iPad Air, 30 fps floor on an iPhone 11 (max ~600 draw calls; blocks are merged into one geometry per material; the beam is a single tube or line mesh rebuilt on trace).
- Accessibility: buttons have `aria-label`s, the board has a keyboard mode (arrow keys move a cursor, Enter places or rotates, Delete removes, F fires, T tilts), `prefers-reduced-motion` shortens the animations.

## 5. Architecture (`games/lasers-3d/`)

```
index.html          shell: meta, styles (design tokens as CSS custom properties), house-pattern Menu link, HUD, tray, modals, script tags in order
vendor/three.min.js r160 UMD (vendored)
src/sim.js          pure rules engine, UMD (browser global LaserSim + CommonJS). NO DOM, NO Three.
src/pieces.js       piece registry + turn tables (loaded by sim.js; kept separate for twist pieces)
src/levels.js       LEVELS array (data only) + level schema doc comment
src/theme.js        visual tokens: palette, material params, light rig, beam colors per level, camera presets. Authored by Codex.
src/render.js       Three.js scene: terrain, pieces, emitter, targets, beam, camera rig, tilt animation, picking (raycast to cell)
src/input.js        gesture arbitration: tap vs drag-orbit vs drag-piece vs pinch; keyboard; emits semantic events
src/ui.js           HUD, tray, stars, level select, victory modal, how-to-play, hints, progress storage, audio toggle
src/audio.js        WebAudio blips (place, rotate, fire travel, hit, lost, win); mute; unlocked on first touch
src/main.js         wiring: creates sim state, render, input, ui; runs the loop with delta-time
solver.mjs          node: DFS solver over placements with beam-intersection pruning; exports solve(level, opts)
gen.mjs             node: random level generator -> solver -> filters (solvable, par, 3D-necessary, touch-fit) -> candidates JSON
validate-levels.mjs node: re-solves every LEVEL, asserts par, tray >= par, 3D-necessity from level 4, touch fit, unique names
test/sim.test.mjs   node:test unit tests for the stepper, pieces, terrain, targets, loops
test/solver.test.mjs
test/ui.playwright.mjs  Playwright WebKit: iPhone + iPad viewports, place/rotate/fire/solve level 1 by taps, console must be clean
```

Data flow: `ui/input -> main -> sim.trace(levelState) -> render.setBeam(path) + ui.setStatus(result)`. `sim.trace` returns `{segments: [{from:{x,y,z}, to:{x,y,z}, d, v}], hits: [...targetIds], end: 'target'|'blocked'|'lost-edge'|'lost-floor'|'lost-sky'|'loop', altitudeMarks: [{x,y,z}]}` and is pure.

Error handling: WebGL unavailable -> a visible message with a link back to the 2D game. Storage failures are swallowed. A level that fails to load skips to the next with a console warning (validate-levels guarantees this never ships).

## 6. Level pipeline
1. `gen.mjs` proposes: random `t` (0..3 with a bias to 0 and 1), emitter on an edge, 1 to 2 targets, 0 to 2 fixed pieces (some secret wedges), a tray drawn from `{MIRROR, WEDGE, DIP}`.
2. `solver.mjs` finds the minimum piece count (`par`) by iterative deepening. Pruning: a new piece is only tried on cells the current beam passes through at the piece's level (any other placement cannot change the beam).
3. Filters: solvable; `par` in the wanted band; 3D-necessary (rule 3.7); no trivial straight shot; the tray = `par + slack` where slack is 0 or 1.
4. Curation (an agent): pick ~20 with a difficulty curve, name them (level names are fine to author; the GAME name is not), write `levels.js`.
5. `validate-levels.mjs` runs on every change and in the Playwright test.

## 7. Testing
- Unit: stepper (each rule in 3.2 has a test), piece tables, over-flight of low walls and of pieces, wedge climb and sky loss, dip descent and floor loss, target on a plateau, loop guard.
- Solver: known tiny levels with known par; the pruning never loses a solution (compare with brute force on 4x4).
- Levels: `validate-levels.mjs` green.
- UI: Playwright WebKit at 393x852 DPR 3 (iPhone), 820x1180 DPR 2 (iPad), 844x390 (iPhone landscape); screenshots reviewed for the house checklist; interaction solves level 1 and level 5 (a wedge level) by taps; no console errors; the Menu link is the top hit-target at its position with every overlay open.
- Manual: iOS Simulator Safari pass when a device is free (sim-guardian).

## 8. Delivery
- Files under `games/lasers-3d/`; portal cards added to `index.html` and `games/index.html` next to the existing Lasers & Mirrors card; thumbnail `games/lasers-3d-thumb.jpg` (640x397, generated by Codex image_gen).
- Commit and push to `main` (GitHub Pages is a live surface). NAS deploy follows the Canon safe-deploy runbook as a separate step.
- Name: placeholder only. Options are offered to James at the end; the slug is renamed after he picks.

## 9. Decisions taken without asking (James is not watching; flagged here)
- Builder split follows the Squish Shot precedent: Claude subagents for code under ultracode, Codex for the theme tokens and the thumbnail.
- Camera rotation is free (drag) rather than a limited resource; the blind-solve star supplies the pressure without frustrating younger kids.
- All three pieces set the outgoing pitch (MIRROR levels, WEDGE climbs, DIP descends) instead of preserving it. A physically strict vertical mirror would preserve pitch, but that needs a fourth "leveling" piece and makes the tray harder to read. The renderer shows a physically plausible sloped face, so the rule reads as natural.
- Pieces are one level tall, so beams can fly over them. That is deliberate hidden information.
- Splitters, prisms, and portals from the 2D game are NOT in v1; the research step decides which twist pieces come next.

## 10. Uniqueness (appended 2026-09-03 after the research workflow)

Prior-art result (full report: `2026-09-03-lasers-3d-prior-art.md`): 79 distinct products swept across six modalities; the 12 that scored 45+ were each checked by two adversarial verifiers. **Nothing combines the disguised-3D reveal with a climbing mirror.** Best corrected similarity is 44 (Laser Quest!, Infinity Games: openly 3D, pre-placed pieces, no inventory) and 42 (Circuit: Laser Maze, Steam: free 3D camera, colour-mixing modules). The concept's two halves exist separately (rotate-to-reveal walking puzzles without lasers; openly 3D laser routers where vertical travel is a 90-degree shaft, never a per-cell climb), never together, and no product has a placed-mirror inventory with par plus a no-tilt star.

### Twist additions adopted for v1 (small, do not change the frozen stepper)
- **Altitude is a colour.** The beam's hue encodes its level: level 0, 1, 2, 3 each get a distinct colour from `theme.js` (Codex picks the hues). This is the primary fair tell in the flat view, on top of the width ramp. Targets are NOT tinted (their level stays hidden). Rationale: cheapest high-impact tell; "my laser changed colour" lands with a six-year-old.
- **Stilt mirrors as a taught beat.** Rule 3.4 already lets a tray piece sit on a raised block and catch only beams at that level. Level 8 is built so the only solution puts a MIRROR on top of a wall to snatch a climbing beam out of the air. The level intro says so once.

### Roadmap after v1 ships (each is a data or small-rule extension; judged scores in the report)
1. Arches and windows: terrain cells with a per-level pass mask, identical from above (small).
2. Skipping-stone floor mirrors: a flat floor mirror that flips pitch -1 to +1 and keeps heading (medium; needs DIP levels first).
3. Tide dial: a water plane at height h that swallows beams and reveals contours (medium).
4. Architect vs Solver pass-and-play: one kid builds heights in the tilted view, the other solves flat with limited tilts; needs the solver in the browser (medium-large).
5. Shade targets: targets lit by the beam's shadow (medium).


## 11. Board size and camera (amended 2026-09-03, James's call)

James reviewed the first tilted screenshot and ruled the 6x6 board too small: "The game board will need to be much bigger than 6x6. Something like 20x20 or bigger probably."

### 11.1 Size curve (replaces the sizes implied in 3.7)
| Levels | Size | Par |
|---|---|---|
| 1-3 (pure 2D) | 12x12 | 1-2 |
| 4-6 (low wall, first WEDGE) | 14x14 | 1-2 |
| 7-9 (first DIP, stilt beat, secret WEDGE) | 16x16 | 2-3 |
| 10-12 (mixed, first two-target) | 18x18 | 2-3 |
| 13-16 | 20x20 | 3-4 |
| 17-20 | 22x22 and 24x24 (at least two at 24x24) | 4-5 |

Teaching beats and the 3D-necessity rule from 3.7 are unchanged.

### 11.2 The camera rule (measured problem, then the fix)
Measured on the 6x6 build at 393x852 with a 393x614 canvas: the board projected to 269x269 px in FLAT (68% of canvas width) and 260x195 px in TILT (66% width, 32% height). Too much margin, and isometric foreshortening shrinks it further.

- The orthographic frustum is fitted to the board's projected bounding box in the CURRENT camera orientation, not to a fixed padding on board width. Target: at least 92% of the limiting canvas dimension in FLAT, at least 88% in TILT.
- Cells are never shrunk below `theme.camera.minCellPx` (34 CSS px). When a fit would go below it, the camera zooms so cells are exactly 34 px and the board overflows the viewport instead.
- Consequence, and it is intended: on a phone a 20x20 or larger board starts zoomed showing part of the board. The player pans to see the rest.
- Pan and zoom: two-finger drag pans, pinch and wheel zoom. A ONE-finger drag still orbits the camera, because orbiting is the game's signature move and must stay the cheapest gesture. Panning is clamped so at least 25% of the board stays on screen; zoom is clamped between fit-to-board and 3x the minimum-cell zoom.
- A FIT button (and the `0` key) returns to the framed view and clears pan.

### 11.3 Generation had to change with the size
Generate-then-solve does not scale to 20x20 (the 9x9 par-4 level already cost 345,693 solver nodes). Level generation is now CONSTRUCTIVE: walk a beam path first, place the target at its end, then paint terrain around the path (raising blocks the beam flies over, walling off alternative routes) re-tracing after every edit. The solver is then used only to prove MINIMALITY by an exhaustive search bounded to depth par-1, which is far cheaper than searching at depth par, plus the existing 3D-necessity test. A level whose par cannot be proven within budget does not ship.
