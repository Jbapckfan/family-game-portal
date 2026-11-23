# Looks pass: Speed + ERS card table, Dots & Boxes phone controls (report: table-and-dots-report.md)

James approved this from a list of improvements. Read `docs/codex/rough-games-2026-11-22/shared.md`
first (it points to `docs/codex/screen-fit-2026-11-22/common.md` and `polish.md`); all of it
applies. You are on branch `codex/rough-games-2026-11-22` (main = 5ef8b7a, live). You built Shut
the Box's walnut box and felt; that physical bar is the target here. Current captures:
`output/screen-fit/final/{ers,speed-card-game,dots-and-boxes-3d}/`.

Other Sol sessions are editing other files in this worktree at the same time. Touch ONLY
`games/ers.html`, `games/ers/*`, `games/speed-card-game.html`, `games/speed-card-game/*`,
`games/dots-and-boxes-3d.html` (+ a new `games/dots-and-boxes-3d-assets/` if needed), their shot
files in `tools/screen-fit/shots/`, and your report. Do not change the three.js or Google Fonts
`<script>`/`<link>` tags: a later pass handles every page's outside dependencies.

1. **Speed and ERS: a real card table.** The cards are now realistic, but they sit on a very dark
   purple (ERS) or navy (Speed) surface where the existing `felt.jpg` barely reads. Put them on a
   lit card table: visible felt with a soft pool of light, a wood or leather rail framing the play
   area, and card contact shadows. HUD chips (Face Challenge, Slap Radar, Flip, First to Zero,
   counts) should look like they belong on that table. Keep the SLAP button big and obvious. Keep
   layout fit, card sizes, timing, bot behaviour and rules unchanged. Run
   `node games/validate-ers.mjs` and `node games/validate-speed-card-game.mjs`.
2. **Dots & Boxes 3D on phone: controls drawer.** On phone (393x852) the board sits above a wall
   of about a dozen small buttons (New Game, Hint, Undo, AI vs AI, Auto Rotate, Danger Colors,
   Guided 2x2, Tactics, Theme, Sound, and more icons). Keep the few you use every turn (New Game,
   Undo, Hint) visible and move the rest into a settings drawer or sheet, so the board gets the
   space. All settings must still work and persist. Tap targets at least 44 px, text at least
   14 px, scroll 0. Check iPad portrait too; larger sizes may keep their current layout if it
   already fits well.

Do not open any app, window or browser; save files only. No git writes. Write
`docs/codex/rough-games-2026-11-22/table-and-dots-report.md` (what changed, assets with sizes and
prompts, checks run). Do not try the browser capture; I will run it.
