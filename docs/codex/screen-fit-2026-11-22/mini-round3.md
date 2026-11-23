# Mini batch, round 3: visual polish

Round 2 checked out in my real-browser captures (`output/screen-fit/mini-verify2/`): no page
errors or step failures at any size, Peg Jumper loads and its jump animates, 2048 and
Minesweeper phone boards are near full width again, and Code Breaker's submitted guess shows in
its history. Round 1 and 2 are committed on the branch (e51d161), so your diffs from here are
small and reviewable.

James now wants every game to get a solid visual polish. Apply `polish.md` (the next section of
this brief) to all 11 mini games. Specific things I saw in the round-2 sheets:

- **Phone:** most games leave an empty band of about 90 px between the Menu link and the title
  (Peg Jumper, 2048, Minesweeper are the clearest). Tighten it so the board gets the height.
- **iPad portrait (820x1180):** Peg Jumper, 2048 and Code Breaker leave a large empty area below
  the board, and the board is smaller than the width allows. Use the height.
- **2048 iPad landscape and laptop:** the game-mode chips row is cut off at the right
  ("Fibonacci", "Threes St..."); wrap them or make them a compact selector, without clipping.
- **Code Breaker:** on phone the Duplicates "Off" label wraps below its toggle; the "Good Guess!"
  message appears twice side by side; on iPad portrait the guess history panel is tall and empty
  while the input row is pushed to the bottom.
- **Physical pieces:** pegs and holes (Peg Jumper), discs and the frame (Connect Four), tiles
  (2048), cards (Memory Match) and the Lights Out cells should read as real objects with material,
  edge light and contact shadow, within each game's existing style.

Keep everything that round 2 fixed. Lasers & Mirrors: polish its chrome and HUD only, not the
level layouts, and rerun the laser validator if you touch it.

Append a "Round 3" section to `mini-report.md` listing per game what you polished and what you
would still change. Do not try the browser capture; I will run it.
