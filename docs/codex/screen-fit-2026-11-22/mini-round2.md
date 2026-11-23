# Mini batch, round 2 (from Claude's real-browser captures)

I ran your capture command outside the sandbox: `output/screen-fit/mini-verify/` (per-game
`sheet-start.png` / `sheet-play.png` and `report.json`). Look at the sheets yourself. Same rules as
before; other Sol jobs are still editing other games in this folder, so touch only the files
named here, and do not edit `tools/screen-fit/capture.mjs`.

Good: tablet and laptop now give the board most of the screen in every game except Peg Jumper;
no horizontal overflow; page scroll went to 0 at every size except Spelling Bee phone (18px) and
Lasers (2px, unchanged); no page errors except Peg Jumper; audio stayed muted.

Fix:

1. **Peg Jumper is broken at every size** (blank page). Page error on load:
   `TypeError: Cannot read properties of undefined (reading 'length') at PegJumperGame
   (<anonymous>:1320:30)`. The play step then times out. Fix it and make sure every board shape
   still loads.
2. **2048 phone got worse**: the board's share of the screen fell from 0.389 to 0.246 of the
   area. On phone the board should be close to full width with the variant/theme rows tucked
   into a compact row or disclosure, like your other portrait layouts.
3. **Minesweeper phone**: the field is only about 60% of the width, below a tall stack of title,
   options and stats. Give the field the width on phone.
4. **Minesweeper source**: you inlined `Minesweeper-pro.jsx` and `Minesweeper-pro.css` into the
   HTML, leaving two stale copies. Put the changes back in those two files (you may edit them)
   and have the HTML load them as it did before, so there is one copy of the game.
5. Smaller, phone only: Tic Tac Toe and Connect Four leave empty space above and below the
   board; let the board grow into it where the controls still fit without scrolling. Spelling
   Bee phone scrolls 18px; remove that.

Leave the Lasers & Mirrors level layout alone (its puzzle content sits in the upper-left part of
the field exactly as in the baseline; that is level design, not this pass).

When done, rerun the laser validator if you touched that game (you should not need to), run the
syntax checks again, and append a "Round 2" section to `mini-report.md`. Do not attempt the
browser capture again; I will run it.
