# Batch `arcade-table`: card, board and arcade games

Files:
- `games/ers.html` (Egyptian Rat Screw): validator `node games/validate-ers.mjs`
- `games/speed-card-game.html` (Speed): validator `node games/validate-speed-card-game.mjs`.
  Read the Speed items in `do-not-repeat.md`. In particular, never add playable-card highlighting.
- `games/zoo-conquest.html`
- `games/particle-conquest/index.html` (has `sw.js` and `manifest.json`)
- `games/tower-defense/index.html`
- `games/dots-and-boxes-3d.html` (3D)
- `games/snowman-siege.html`
- `games/cube-jumper.html`: validator `node games/validate-cube-jumper.mjs`. Read the cube-jumper
  items in `do-not-repeat.md` (framing, interpolation, adaptive DPR) and keep them.

Baseline: on iPad and laptop most of these play in a small fixed-size area or a narrow column.
Dots & Boxes 3D and Particle Conquest are especially small; Cube Jumper overflows sideways on the
phone. Card tables should use the whole screen like a real table; arcade canvases should fill
the screen (letterbox only when the game's aspect ratio truly requires it, and then make the
letterbox look intentional).

Service workers: if a game you change has a service worker, bump its cache version and keep its
precache list in sync with the files it actually needs, so returning players get the new build.

Capture with `--batch arcade-table`, writing to `output/screen-fit/arcade-table-after`. Report to
`docs/codex/screen-fit-2026-11-22/arcade-table-report.md`.
