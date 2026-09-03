# Lasers 3D, INSIDE mode (working label only, name NOT chosen) — design spec

Date: 2026-09-03. Status: spec only, nothing built. Sequenced AFTER the top-down game ships.
Parent spec: `2026-09-03-lasers-3d-design.md`. Sections 3 (rules) and 12 (pitch is a delta) of that spec are inherited unchanged; the simulation does not change at all for this mode.

## 1. The idea, in James's words

"What if we made an advanced level where you're inside the level and have to walk down hallways of blocks and look around to follow the laser beam and jump on top of blocks to place the mirrors."

## 2. Why this earns its place (and is not a slow tilt)

The flat view hides height for one specific geometric reason: an orthographic camera pointed straight down sees every block's sides edge-on, so they are invisible. Standing inside the level, block sides are the ONLY thing you see. That asymmetry is the whole design.

Two things follow, and together they are the mode:

**2.1 Wall faces carry information no other view can show.** Anything painted on the side of a block is invisible from above by construction and invisible in the tilted view at any useful size. So the inside view gets exclusive readable content (section 5). Without this, walking in is just a slower tilt and should not be built.

**2.2 Reach replaces free placement.** In the top-down game you may place a piece on any legal cell. Inside, you may only place a piece you can physically reach, which means you must route YOURSELF through the level as well as the beam. That is a second, movement-shaped puzzle layered on the same board, and it is what makes an inside level a different puzzle rather than the same puzzle seen differently.

## 3. Movement (FROZEN for v1)

Grid movement, not a shooter. No free-running, no jump button, no physics.

- **Standing.** The player occupies one cell and stands on that cell's terrain top, height `h = t[cell]`.
- **Walk.** Tap a cell to walk there. The game paths with a breadth-first search over walkable steps and the avatar tweens cell to cell. Tap a far cell and the avatar walks the whole path.
- **A step is walkable** from height `h` to an orthogonally adjacent cell of height `h2` when `|h2 - h| <= 1`, and the destination holds no piece, no emitter and no target. Diagonal steps are not allowed.
- **Step up and step down are automatic.** Walking into a block exactly one level higher climbs it. A drop of one level is taken automatically. A difference of two or more is simply not walkable, so the player is never asked to time a jump and can never fall.
- **Look.** Drag anywhere to look around freely: yaw unlimited, pitch clamped to plus or minus 80 degrees. Looking is free and continuous even though movement is grid-locked, because following the beam by eye is the point of the mode.
- **Turn shortcut.** A swipe left or right snaps the yaw 90 degrees for players who would rather not free-look.
- **No soft-lock, ever.** A RETURN button teleports the player to the emitter cell. It costs nothing. This exists because a player can otherwise strand themselves below a ledge.
- **The player is not an obstacle.** The simulation never learns the avatar exists; a beam passes through the player's cell unchanged. Standing in a beam glows the screen edges and is purely feedback.

## 4. Placement by reach (FROZEN for v1)

- A reticle sits at the centre of the screen. The cell under the reticle is the **focus cell** and is outlined.
- **A focus cell is placeable** when it is orthogonally adjacent to the player's cell AND its terrain top is within one level of the player's standing height (`|t[focus] - h| <= 1`) AND the cell is otherwise legal by the parent spec's rule 3.4 (not the emitter, not a target, not a fixed piece, not already occupied).
- Tap with a tray piece selected to place it. Tap a placed piece in reach to rotate it. Hold to remove it back to the tray.
- **You cannot place on the cell you stand on.** Pieces block movement, so a piece may wall off a route; that is legal and is part of the puzzle. Removal is always possible because a piece you placed is by definition adjacent to somewhere you could stand.
- **Consequence, and the reason this mode exists:** a solution piece on a cell three levels up cannot be placed until the player has climbed a staircase of blocks to reach it. Some chambers are built so the only staircase is itself only reachable after an earlier piece is placed.

## 5. What is written on the walls (the exclusive content)

Each is a decal on a vertical block face, authored per level, legible from about three cells away, and colour-independent.

| Decal | Where | What it tells you | Ships in v1 |
|---|---|---|---|
| Target plaque | the block face directly below a target orb | the height the beam must arrive at, as a numeral | yes |
| Ramp mark | the housing side of a fixed piece | whether that piece is really a wedge or a dip, which the top view disguises | yes |
| Beam scar | the wall face of any cell a beam has crossed | a scorch line drawn at the beam's height in that cell, so a previous shot leaves a readable trace | yes |
| Depth ticks | tall block faces | notches marking each level, so heights can be counted by eye | stretch |

The beam scar is the one that pays for the mode: after a failed shot the player can walk the route and see, at body scale, exactly how high the beam was where it went wrong.

## 6. Chambers, not boards

- Inside levels are a SEPARATE set from the 20 top-down levels. Nothing is retrofitted.
- Size 8x8 to 10x10, heights 0 to 3. Walking across 24 cells is tedious; walking across 8 is not.
- 8 to 10 chambers in v1, with their own progression.
- Structure should read as architecture: corridors between block walls, a staircase, a raised gallery. Not the open plateaus of the top-down levels.

## 7. The peek view, and stars

- A PEEK button shows the familiar top-down or tilted camera for planning. Peek is **read-only**: no placement, no rotation. Placement happens only from inside.
- Stars for a chamber are its own set, because tilt-avoidance makes no sense in a mode whose premise is looking around:
  1. Solve it.
  2. Solve it at par pieces.
  3. Solve it without using PEEK.
- The third star is the direct analogue of the top-down game's blind star: it rewards reading the walls instead of consulting the map.

## 8. What the generator and solver must gain

The simulation is untouched, but level generation gains a constraint that does not exist today.

- **Reachability.** A chamber is valid only if its intended solution can be BUILT: for each solution piece, in placement order, there must exist a standing cell satisfying section 4, reachable by the walk rules of section 3 from the player's position after the previous placement. Placement order matters, because an early piece can block a corridor.
- The solver therefore searches over (placement, standing position) rather than placement alone, and its minimality proof must respect reach. Expect this to be more expensive than the top-down solver; chambers are small to compensate.
- **Anti-tedium check.** Report the total walking distance of the intended build order and reject chambers above a threshold.
- **No-soft-lock check.** Assert that from every reachable state the RETURN button restores a solvable position, which is trivially true given section 3 but must be asserted rather than assumed.

## 9. Rendering and performance

- A perspective camera is added alongside the existing orthographic rig. Field of view 70 degrees, near 0.05, far 60.
- Eye height 0.75 of a cell above the standing surface. A beam at the player's own level travels at 0.5 and so passes just below eye line, which is deliberate: you can always see a same-level beam without looking down.
- Block side faces need real texture detail and decals, which the top-down game never required because sides were invisible. This is the bulk of the new art.
- Occlusion culling is worth having at 100 cells with tall walls; the existing merged terrain geometry must be split enough for it to matter.

## 10. Accessibility and comfort (binding, not optional)

- No head bob, ever.
- Movement between cells is a short eased tween, roughly 180 ms per cell. Under `prefers-reduced-motion` the avatar cuts instantly from cell to cell with a brief fade.
- A vignette during motion is available in settings for motion-sensitive players, off by default.
- Free-look is drag-only; there is no auto-turn and no camera the player did not ask for.
- The turn-by-swipe shortcut exists so the mode is playable without continuous dragging.

## 11. Risks, stated plainly

1. **This may be a different game.** A first-person voxel puzzle shares a simulation with the top-down game but almost nothing else in feel. If the chambers turn out to be more compelling than the boards, that is a finding, not a failure, and the right response is to split them rather than force one product.
2. **Cost is comparable to the work already done,** not an increment: movement, pathfinding, a perspective rig, decal art on block sides, reach-aware generation, and a new level set.
3. **Walking is the tedium risk.** Small chambers, tap-to-path and the anti-tedium check are the mitigations, and a playtest with an actual child is the only real verdict.
4. **Two control schemes in one product** raises the teaching burden. The mode needs its own short tutorial chamber that teaches walk, look, climb and reach in that order, with no beam puzzle at all.

## 12. Open questions for James

1. Does the avatar have a visible body and shadow, or is it a disembodied camera?
2. Should a chamber's beam run while you walk, so you can watch it live, or only on FIRE as in the top-down game?
3. Is PEEK worth having at all, or is being denied the map the point?
