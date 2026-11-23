# Mini batch, round 4 (small, from Claude's real-browser captures)

Round 3 is committed on the branch as 443ecc6 after my capture
(`output/screen-fit/mini-verify3/<id>/sheet-start.png`, `sheet-play.png`, per-size PNGs,
`report.json`). No page or step errors, audio muted at all four sizes, and the polish reads well:
Peg Jumper's ebony board and glossy pegs, Connect Four discs, Memory Match card stock, Lights Out
cells, 2048 chips wrapping instead of clipping, Code Breaker's single "Good Guess!", and bigger
iPad-portrait boards for Peg Jumper, 2048 and Minesweeper. All 20 laser levels pass. Keep all of
that.

Do not open any app, window or browser; save files only. No git writes. Touch only the files
named below and your report.

1. **Tic-Tac-Toe regression.** The start screen now scrolls 62 px on iPad landscape (1180x820):
   the Rules button is cut off at the bottom. The play screen scrolls 2 px on iPad landscape,
   laptop and iPad portrait. Bring both to 0 at every size without shrinking tap targets below
   44 px or text below 14 px. While there: the iPad-portrait start card fills only the top third
   of the screen; centre it vertically or let it use more of the height.
2. **Lasers & Mirrors play shot.** The shot in `tools/screen-fit/games.json` double-clicks a fixed
   point (40% across, 48% down), which is not level 1's solution cell, so every capture shows the
   beam turning one cell short of the target, and on iPad portrait the mirror lands a row above
   the beam. Write `tools/screen-fit/shots/lasers_mirrors_game.json` (the harness prefers it over
   games.json) that places the mirror on level 1's real solution cell by computing its screen
   position from the game's own board geometry at the current size, then fires, and waits for
   the beam to finish so the capture shows a solved level. Confirm, from the code, that a
   placed mirror's drawn position and its logical cell agree at every board size.
3. **Snake play shot.** The shot pauses the game, so the capture shows a blurred board under
   "PAUSED". Write `tools/screen-fit/shots/Snake.json` that starts a game and lets the snake run
   briefly without pausing, so the capture shows the snake, food and board.
4. **Tidy.** `2048-assets/classic-wood-r3.jpg` and `PegJumper-assets/ebony-board-r3.jpg` are the
   same file with the same ebony prompt. Keep one copy (for example the Peg Jumper one) and point
   2048 at it with the right relative path, or rename the 2048 copy and its prompt so the name
   matches what it is.

Append a "Round 4" section to `mini-report.md`. Do not try the browser capture; I will run it.
