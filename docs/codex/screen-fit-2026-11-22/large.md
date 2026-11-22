# Batch `large`: Socktopus, Reflex Riot, Lasers 3D

Files:
- `games/socktopus/index.html` (+ `assets/`)
- `games/reflex-riot/` (`index.html`, `game.js`, `styles.css`, `sw.js`, `manifest.webmanifest`).
  Baseline: the start screen is a small element in a large empty page on every size.
- `games/lasers-3d/` (multi-file 3D app with its own docs: read `VISUAL-DIRECTION.md`,
  `MOTION-DIRECTION.md` and `CURRENT-RULES.md` first). It already had a careful multi-device
  layout review and fills the screen reasonably in the baseline, so change it only where you see
  a real problem at one of the four sizes. Read the laser-board item in `do-not-repeat.md`.
  Checks: `cd games/lasers-3d && node --test test/*.test.mjs && node validate-levels.mjs`.
  Do not run `tools/verify.mjs` or `tools/serve.mjs` (they start servers and browsers). It also
  has an iOS wrapper under `ios/`; do not build it. Note in the report if the bundled iOS copy is
  now out of date.

Service workers: if a game you change has a service worker, bump its cache version and keep its
precache list in sync with the files it actually needs.

Capture with `--batch large`, writing to `output/screen-fit/large-after`. Report to
`docs/codex/screen-fit-2026-11-22/large-report.md`.
