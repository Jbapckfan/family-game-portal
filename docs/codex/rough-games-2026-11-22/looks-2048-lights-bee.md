# Looks pass: 2048, Lights Out, Spelling Bee (report: looks-2048-lights-bee-report.md)

James approved this from a list of improvements. Read `docs/codex/rough-games-2026-11-22/shared.md`
first (it points to `docs/codex/screen-fit-2026-11-22/common.md` and `polish.md`); all of it
applies. You are on branch `codex/rough-games-2026-11-22` (main = 5ef8b7a, live). Current
captures of these games: `output/screen-fit/final/<id>/` (2048, LightsOut, SpellingBee).

Other Sol sessions are editing other files in this worktree at the same time. Touch ONLY
`games/mini-games/2048.html`, `games/mini-games/LightsOut.html`, `games/mini-games/SpellingBee.html`,
new asset folders `games/mini-games/{2048,LightsOut,SpellingBee}-assets/`, their shot files in
`tools/screen-fit/shots/`, and your report. Do not edit `PegJumper-assets/` (2048 reads its ebony
board from there; leave that file as is). Do not change the React/Babel `<script>` tags or the
Google Fonts links: a later pass converts those for every page.

1. **2048: tiles that change colour as the numbers grow.** Today a 2 tile is dark navy on the
   dark ebony board and hard to read. Give tiles a physical material ladder that climbs with the
   value (for example ivory, then warm amber, copper, gold, with the biggest values a rich
   glowing gold or deep enamel), raised with light and shadow, numbers always high contrast. Keep
   the existing themes working; the default should be the richest. Keep slide/merge/spawn
   behaviour and timing as they are (you may add a short merge pop only if it does not change
   input timing).
2. **Lights Out: backlit glass buttons.** Today flat cyan squares. On = glowing backlit glass
   with light spilling onto the panel; off = dark smoked glass that still reads as a button. Set
   in a believable housing. On and off must be unmistakable at a glance, including for
   colour-blind players (brightness difference, not hue alone).
3. **Spelling Bee: a real honeycomb.** Today flat purple hexagons on dark. Make the letter cells
   real wax honeycomb (the centre letter a richer honey/amber cell, outer cells pale wax), letters
   crisp and high contrast, set on a warm surface. Keep buttons (Delete, Shuffle, Enter, Hint),
   word list, modes and scoring unchanged.

Do not open any app, window or browser; save files only. No git writes. Write
`docs/codex/rough-games-2026-11-22/looks-2048-lights-bee-report.md` (what changed, assets with
sizes and prompts, checks run). Do not try the browser capture; I will run it.
