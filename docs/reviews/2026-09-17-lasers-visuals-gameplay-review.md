# Lasers 3D — Full Deep Dive Review: Visuals, Gameplay & Mobile/Tablet Layouts

Comprehensive review completed September 17, 2026 across game code revision `a7e6249` in `/Users/jamesalford/family-game-portal/games/lasers-3d`.

## 1. Executive Summary & Design Core

**Lasers 3D** combines a deceptive 2D optical puzzle presentation with a tactile 3D diorama reveal. In 2D, the board appears as a flat, uniform grid (`#172544`); tilting or switching to 3D reveals tall enamel blocks, windows, and physical elevation changes. The recently implemented shared opaque floor with mirrored terrain (*Both Sides*, levels 28–31) firmly grounds the multi-deck mechanic without floating platforms or cutaway artifacts.

### Key Metrics
- **Engineering Baseline:** 478 unit/DOM tests passing (507 DOM assertions). All 31 level solutions and minimum pars proven independently via exhaustive search in `validate-levels.mjs`.
- **Render Budget:** 51–68 draw calls in typical scenes; 67 calls / 27,184 triangles in 24×24 stress tests.
- **Idle Frame Policy:** Strict zero idle frames. CPU/GPU loops return to 0 scheduled frames when settled.
- **Asset Overhead:** Zero external texture downloads; 100% procedural materials and grain textures.

---

## 2. Visuals & Art Direction

1. **The 2D Flat Lie vs. 3D Tilt Reveal:**
   - Managed via `uReveal` in `src/render-terrain.js` and `src/theme.js`. At elevation $\ge 88^\circ$, block tops resolve identically to the floor with zero shadows or specular highlights.
   - The *light leak* (`lightLeak`, 4-point tapered gleam) under columns with arches or windows provides a subtle fairness clue in 2D without revealing the exact hole elevation.
2. **Materiality & Hardware:**
   - Piece housings use $0.72 \times 0.72$ chamfered square bases with procedural brushed metal ($64 \times 2$ canvas texture) and corner micro-screws.
   - In 2D, all upright pieces collapse to the common grey slot glyph (`commonFlatPiece` `#B7CEDB`). In 3D, their silhouettes diverge cleanly: Mirror (vertical sheet), Wedge ($45^\circ$ ramp), Dip (inverse ramp), Floor (silver disc), Splitter (lavender crystal).
   - *Observation:* Wedge accent (`#FFC857` amber) and dormant target orbs (`#FFC875` amber) share a warm hue. In dense 3D puzzles (levels 12 and 20), scanning players can momentarily confuse an angled wedge with a dormant target socket.
3. **Laser Beam Dynamics:**
   - 6-sided extruded tube with altitude-based coloring and thickness: Z0 (Teal), Z1 (Bright Teal), Z2 (Vivid Aqua), Z3 (Electric Mint/White).
   - Analytical traveling head and pulse train in GLSL (`PULSE_GLSL`) eliminate CPU particle churn.
   - Physical departure tails (`lostEdge`, `lostFloor`, `lostSky`) prevent beams from ending abruptly in mid-air.
   - Finite victory pulse: one $1,200\text{ ms}$ energy wave across the route plus an expanding ground ripple, settling before the victory modal opens.
4. **Studio Palettes:**
   - Five distinct chapter themes: Sapphire (1–3), Obsidian (4–9), Glacier (10–12), Amethyst (13–19, 24–31), Midnight (20–23).

---

## 3. Gameplay & Puzzle Arc (31 Levels)

1. **The Learning Arc:**
   - **Levels 1–3 (2D Baseline):** Clean introductory reflection puzzles on $12 \times 12$ grids.
   - **Levels 4–9 (3D Verticality):** Teaches flying over low walls, Wedge ramps, Dip leveling, and plateau stilts. Level 7 (*Level Off*) is the pivotal teaching moment where DIP flattens a climbing beam.
   - **Levels 10–13 (Openings & Rebounds):** Arches (Z0 clearance), Windows (mid-height clearance), and Floor Plate bouncing.
   - **Levels 14–20 (Complex Routing):** Multi-tier height management, dual targets, and precision window threading.
2. **The Level 21 Friction Point:**
   - Level 21 (*The Long Way Round*) introduces Darkness (`dark: true`), expands the board to $24 \times 24$ (576 cells), and demands a 5-piece chain.
   - Solver node exhaustion explodes to **42,945 nodes** (compared to 1,596 on Level 19 and 2,502 on Level 20).
   - *Recommendation:* Level 22 (*Stone Skipping*, 64 nodes, pre-placed floor plates) is much gentler. Swapping Levels 21 and 22 or inserting a compact $14 \times 14$ darkness teaching board would smooth the late-campaign difficulty cliff.
3. **Bonus Chapters:**
   - **Splitters (24–27):** Fast multi-receiver synchronization. Level 27 (*Prism Bridge*, par 3, 603 nodes) offers a satisfying puzzle payoff.
   - **Both Sides (28–31):** Four brain-bending puzzles traversing the single shared floor into the inverted underside. True floor holes and real depth occlusion keep the spatial logic coherent.

---

## 4. iPhone vs. iPad Layout Deep Dive

Fresh high-resolution captures were executed across iPhone (portrait, landscape, SE) and iPad Pro 13" (portrait, landscape) in `output/layout-review/` and compiled in `output/layout-review/layouts.html`.

### 4.1 iPhone Portrait (393 × 852 & 375 × 667)
- **Ergonomics:** One-thumb reachability of all primary actions (`FIRE`, `2D/3D`, `RESET`, `HINT`). Touch targets adhere to the $\ge 44\text{px}$ standard.
- **Flaws Identified:**
  - *Title Truncation:* Level 28 (*THROUGH THE BOARD*) truncates to `THROUGH THE BOA...` on standard 393px viewports due to fixed left/right header widths.
  - *Vertical Stage Compression:* The 210px bottom tray compresses the stage; on $24 \times 24$ boards, cells hit the 34px touch floor, enforcing mandatory pan/zoom.
  - *Deck Toggle Crowding:* In Both Sides levels, the `BOARD SIDE: Above | Below` pill floats directly below the HUD, crowding the board on compact screens.

### 4.2 iPhone Landscape (852 × 393)
- **Ergonomics:** Uses the 2-column sidebar layout. Action buttons smartly reconfigure into 3 columns (`min-width: 640px and max-height: 480px`).
- **Visual Bug Identified:**
  - *Tray Card Text Collision:* Shrinking `.tray-card` to 54px causes the piece label and count badge to overlap (e.g. `MIRROF 3` / `MIRRO...3`). Count badges should stack vertically or overlay as a corner pill in short landscape.

### 4.3 iPad Landscape (1366 × 1024) — The Flagship Experience
- **Golden 1:1 Aspect Ratio:** The active canvas area is $1102 \times 1024\text{ px}$, nearly a perfect square that matches the bounding diamond of isometric boards.
- **Ergonomics:** Right-thumb actuation of the entire right command sidebar while holding the tablet with both hands. Full 4-card tray grids fit without scrolling. Chapter logos, chips, and text breathe comfortably.

### 4.4 iPad Portrait (1024 × 1366) — The Sidebar Paradox
- **Layout Tension:** Because width ($1024\text{px}$) exceeds the $700\text{px}$ breakpoint, iPad portrait is forced into the right sidebar layout.
- **Flaws Identified:**
  - Horizontal squeeze: The 3D stage is constrained to $760\text{px}$ width despite having $1366\text{px}$ of vertical height.
  - Large dark voids sit above and below the board, while the right sidebar stretches down $1366\text{px}$ with substantial empty space.
  - *Recommendation:* Gate the sidebar layout behind `(orientation: landscape)` for tablets under 1100px width, allowing iPad portrait to use a full-width bottom tray so the board expands to the full 1024px width (a 35% size increase).

---

## 5. Prioritized Recommendations Summary

1. **Priority 1 (Visual & Layout Bugs):**
   - Fix landscape iPhone tray card overlap (`.tray-card` label/count collision).
   - Adjust `#hud-name` text sizing on portrait phones to eliminate ellipsis truncation on longer level names.
   - Differentiate dormant target glass from Wedge amber filaments.
2. **Priority 2 (Pacing & Progression):**
   - Smooth the Level 21 darkness difficulty spike by swapping Levels 21 and 22 or adding a compact darkness tutorial.
   - Add a dedicated "Campaign Complete" celebration after Level 23 before unlocking bonus chapters.
   - Display `FROM ABOVE` mastery badges prominently in the level select menu.
3. **Priority 3 (Tablet Layout Refinement):**
   - Refactor iPad portrait to use a wide bottom drawer rather than an awkward 760px squeezed sidebar.
