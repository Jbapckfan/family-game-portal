# Card art, round 2: three cards

Claude captured the portal at four sizes (muted, headless): all 21 card images load, no errors, and
`index.html` changed only image `src`/`alt`. Compared side by side with the previous images
(`git show HEAD:games/<name>`), 17 new cards are clearly better or equal. Three are weaker and need one
more pass. Same rules as `card-art.md`. Do not open any app, window or browser. No git writes.

1. **Particle Conquest** — the current card (tablet play frame) is mostly empty space with small
   planets. Use `output/screen-fit/final2/particle-conquest/phone-play.png` instead: a 16:9 crop of the
   planet field that shows the big planets, the cyan **YOU** planet with its fleet and the red **AI**
   planet together. Keep the HUD and button rows out of the crop if possible.
2. **Reflex Riot** — the close-up of one purple stick under the "STICK SNATCH" badge does not say
   what the game is. Use the start menu instead (`laptop-start.png` or `tablet-start.png`, whichever
   crops better): the big **REFLEX RIOT!** logo with the mode buttons. That is the most inviting honest
   view here.
3. **Lasers 3D** — every captured frame is level 1 in 2D mode: an almost empty grid with one thin
   line. The previous card shows the game's 3D board with mirrors, emitters and beams. Restore the
   previous image exactly (`git show HEAD:games/lasers-3d-thumb.jpg` bytes; read-only git is fine) and
   its previous `alt` text. In the sources file, mark it as the restored earlier image, not a new crop.

Then rerun `node tools/offline/build-precache.mjs`, `--check`, `node --test tools/offline/test/*.test.mjs`
and scoped `git diff --check`. Keep the size rules (under 120 KB, all files unique). Update
`card-art-sources.json` and add a short **Round 2** section to `card-art-report.md` (the three changes,
new bytes, new precache count/bytes/version).
