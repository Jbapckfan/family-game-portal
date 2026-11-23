# Rough games: small games (report: mini-report.md)

Read `docs/codex/rough-games-2026-11-22/shared.md` first. Your games, in priority order:

1. **Snake** (`games/mini-games/Snake.html`). Today: flat green squares on dark tiles, a flat red
   dot for food. Give the snake a real body (one continuous rounded body with a head, eyes and
   smooth corners, light and shadow along it) and food that looks like real fruit; the board a
   believable surface (for example a lit garden bed or polished slate, your call). Keep the grid
   readable and every skin option working.
2. **Tic-Tac-Toe** (`games/mini-games/2DTicTacToe.html`). Today: flat dark squares with a neon X.
   Make it a physical board with real pieces (for example carved wood or stone tiles with
   inlaid or placed X and O pieces). Keep Neon Pink / Classic / Retro Green working as options;
   the default should be the richest.
3. **Minesweeper** (`games/mini-games/Minesweeper.html` + `Minesweeper-pro.css`). Today: plain
   grey grid. Raised, lit unopened tiles; recessed opened cells; clear number colors; real-looking
   flags and mines; a frame that fits the page.
4. **Lasers & Mirrors** (`games/mini-games/lasers_mirrors_game.html`). Today: a big empty dark
   grid. Make it an optics bench: a real laser emitter, a receptor target that lights up, mirrors
   that look like framed glass, a subtle table surface. Levels untouched; run
   `node games/mini-games/validate-laser-levels.mjs` (all 20 must pass).
5. **Code Breaker** (`games/mini-games/CodeBreakerV4.html`). Today: flat circles in a dark panel.
   Make it a physical code-breaking board with real pegs in holes and small key pegs for feedback.
