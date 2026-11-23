# Rough games — small games

Source pass on `codex/rough-games-2026-11-22`, based on `5ef8b7a`. Read the shared brief and reviewed the five games' play sheets from `output/screen-fit/final/`. No app, window, browser, local server or capture command was opened. No Git write or network dependency installation was performed. New viewport layout, browser performance and physical-device results await Claude's captures.

## Snake — priority 1

Replaced the separate green squares with a continuous rounded SVG body, graded cylindrical lighting, a shaded head, eyes, pupils, nostrils, highlights, contact shadow and photographic scale grain. The path rounds corners and splits at wraparound edges, so it does not draw a false diagonal across the field. The head follows the actual head/neck direction, including wrapped positions.

The board now has a photographed slate surface, readable cell boundaries and raised stone obstacles. Food uses a transparent photographic atlas: red apple for Neon, silver-blue fish for Ocean, ember/flame for Lava and starfruit for Golden. Every original skin color, unlock value, stored selection and food identity is retained. Skin colors also tint the body and surround.

Rendering remains on the existing game ticks; no animation loop or layout measurement was added. The static floor is memoized, body paths are memoized by snake positions and surface colors by skin. SVG keeps the body sharp on resize and Retina displays. The ready presentation lets more of the artwork show; the same start, pause, gesture and keyboard controls remain.

The shot keeps real unpaused play and now turns shortly before the screenshot so a body corner can be seen. No growth or score was fabricated.

## Tic-Tac-Toe — priority 2

The default is a walnut chassis with fitted stone squares and raised pink/cyan resin X/O pieces. Pieces have thickness, a shaded face, edge light and contact shadow. Stone squares use different regions of the same material texture. The same piece renderer is used in the advanced boards and completed mini-boards; existing cell handlers, winning logic and board indices remain.

Neon Pink retains the richest warm-wood/stone/resin combination. Classic uses a quieter stone and ivory/silver treatment; Retro Green uses dark green-tinted walnut and green pieces. Theme IDs, persistence and the screen-fit calculations are unchanged. SVG pieces do not intercept pointer input, and cell labels still announce X/O values. Added descriptive labels to the previously unnamed Ultimate squares.

The play shot now makes two real moves so both X and O pieces appear.

## Minesweeper — priority 3

Added a stone instrument tray, raised brushed-metal caps, corner fasteners, edge light and contact shadows. Opened cells are recessed dark pockets, keeping the original number colors clear. Classic flags and mines use a photographic miniature-object atlas, with actual cloth, metal, poles and bases. Other theme choices retain their original rocket/sock/dinosaur imagery and get matching cap colors.

This is a CSS-only change to the game. The HTML loader and `Minesweeper-pro.jsx` are unchanged, including generation, solver, input, scoring, timing and profile formats. The marker artwork stays inside the existing cell boxes; the frame keeps its original border width. Number text is unchanged and flag/mine glyphs are replaced visually only in Classic; accessible labels remain.

Added an in-play shot that opens a tile, then marks an enabled hidden cell through the existing Mark Mode control. It does not inspect mine data. A naturally completed first-click board is left alone instead of producing a disabled-cell timeout.

## Lasers & Mirrors — priority 4

The field is now an optics bench over the shared slate surface, with subtle mounting holes aligned to the existing visual grid. Added a finned metal laser housing and glass aperture, a metal receptor with a lens and indicator lights, and framed reflective-glass mirrors. The receptor visibly illuminates when the original hit flag becomes true. Freeform laser/mirror parts reuse the same hardware treatment; other lab parts retain their existing artwork.

Hardware is painted to cached offscreen canvases by kind, size, selection/hit state, color and capped DPR. Main rendering uses those images instead of allocating hardware gradients every frame. Static grid caching remains and now uses the same DPR cap of 2. Mirror centers, endpoints, reflection lines, hit radii and beam-emission origin stay registered to the original geometry. Static idle beams no longer emit decorative moving sparks; firing/impact effects remain.

No level definition, mirror budget, obstacle, source/target position, interaction handler, reflection calculation, score or animation clock was changed. All 20 levels pass the existing validator.

## Code Breaker — priority 5

Added a walnut instrument-board frame, inset dark sockets and photographic plastic pegs with visible domed caps, stems and contact shadows. The same atlas supplies all six existing palette colors and the small black/white key pegs. Current guesses, history, palette, maker mode and secret reveal use the physical pieces. Empty slots remain recessed holes, with the existing next-slot/selection cues retained.

Color strings and feedback still come from the original data; the atlas index is presentation metadata. Click/key handlers, duplicate handling, hints, AI/secret generation, feedback order, scoring, tutorial and saved data are unchanged. Added artwork is absolutely positioned. Phone subpanels retain zero added padding/border height, so the material treatment does not consume the board's height budget.

## Original assets and provenance

Generated with the built-in `image_gen` tool. No stock downloads, logos, real brands or API-key fallback were used. Each image is stored once; shared consumers reference that one file rather than making aliases. Exact generation prompts and conversion settings are in adjacent `.prompt.txt` files.

| Asset | Dimensions | Bytes | Consumers |
| --- | --- | ---: | --- |
| `games/mini-games/Snake-assets/slate-surface-r1.jpg` | 1024×1024 | 260837 | Snake floor, Tic-Tac-Toe stone, Minesweeper tray/caps, optics bench |
| `games/mini-games/Snake-assets/food-atlas-r1.webp` | 512×512 | 65288 | Four Snake skins' food |
| `games/mini-games/Snake-assets/scale-grain-r1.jpg` | 512×512 | 81387 | Snake body and head surface |
| `games/mini-games/2DTicTacToe-assets/walnut-surface-r1.jpg` | 1024×1024 | 259428 | Tic-Tac-Toe chassis, Code Breaker board |
| `games/mini-games/CodeBreakerV4-assets/peg-atlas-r1.webp` | 1024×512 | 78184 | Palette/code pegs and black/white feedback keys |
| `games/mini-games/Minesweeper-assets/markers-r1.webp` | 768×384 | 37184 | Classic flag and mine pieces |

Total runtime image bytes: **782308**. Every image is below 300000 bytes, and thus below the 600 KB hard cap. JPEGs use native `sips` resizing/quality 72; WebPs use the already-installed Sharp encoder at quality 84 with alpha quality 100. Dimensions, image existence, unique hashes, prompt files and transparent pixels were verified. No runtime library was added.

## Checks run

- Local JSX conversion where needed plus `node --check`: **13 scripts passed** across these games and the unchanged active MineQuest JSX.
- CSS source checks: **43 style sources parsed without warnings; all 68 hover rules are scoped**. Five capture evaluation programs parsed; per-game shot JSONs parse.
- AST comparison against HEAD: **22 authored configuration arrays/objects, 194 named non-rendering functions and 27 non-drawing class methods remain unchanged**. MineQuest HTML/JSX match HEAD.
- React server-render checks passed for Snake, Tic-Tac-Toe and Code Breaker. Renderer checks covered a continuous corner, both wrap axes, all four skin/food views, 289 floor cells, both physical X/O pieces with their original labels, six peg colors, and black/white/empty feedback.
- Full laser startup/geometry fixtures passed at six board sizes, including all four capture board sizes. The actual optics solved level 1 and completed its animation; the rendered mirror origin matched its logical center. After warmup, 100 repeated draws of emitter, target and mirror created no additional canvases. Cache DPR stayed at or below 2. Fixtures use canvas/DOM stubs, not a browser or GPU performance measurement.
- `node games/mini-games/validate-laser-levels.mjs`: **all 20 levels passed** at all sizes it checks.
- The eight original mine-number colors pass 4.5:1 against the declared opened-cell fill, with a minimum calculated ratio of **5.96:1**. This is a color calculation, not a complete composited screenshot contrast audit.
- All six local image paths resolve, sprite alpha was checked, and targeted `git diff --check` passed. Global capture files, other games and sound code were left alone.

## Renderer studies and remaining browser QA

Inspected renderer-only PNG material studies under `output/screen-fit/mini-after/rough-render-studies/`, including `snake-lit-material-study.png` and `tic-physical-material-study.png`. They exercise the artwork in isolation, using a sample shape; they are not gameplay screenshots, records, viewport-fit measurements or browser captures.

Claude's next capture should check: all four sizes; active Snake with a turn, all four skins and wrap edges; X/O pieces plus all Tic themes and advanced modes; one marked cell and a loss in Minesweeper; the solved level-1 optics bench and later obstacles/splitters; and Code Breaker history, maker and secret-reveal states. Check that 14px text and control targets still fit, that Menu stays above overlays, and that body/bench rendering remains smooth on an actual iPad.

No new page-scroll, FPS, thermal or physical touch measurements were possible here. The pre-existing dense-grid phone touch-target exception remains: the fixed rules/grid sizes cannot provide 44px cells at every phone difficulty without a separate precision-input design. This visual pass did not add new controls or reduce existing control target sizes.

## Files changed

- `games/mini-games/Snake.html`
- `games/mini-games/2DTicTacToe.html`
- `games/mini-games/Minesweeper-pro.css`
- `games/mini-games/lasers_mirrors_game.html`
- `games/mini-games/CodeBreakerV4.html`
- The six assets listed above and their six adjacent `.prompt.txt` files.
- `tools/screen-fit/shots/Snake.json`
- `tools/screen-fit/shots/2DTicTacToe.json`
- `tools/screen-fit/shots/Minesweeper.json`
- `docs/codex/rough-games-2026-11-22/mini-report.md`
