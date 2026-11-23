# Batch `mini`: the 11 small games

Files (one self-contained HTML each, under `games/mini-games/`):
2DTicTacToe.html, CodeBreakerV4.html, lasers_mirrors_game.html, LightsOut.html, PegJumper.html,
SpellingBee.html, 2048.html, ConnectFour.html, Snake.html, Minesweeper.html, MemoryMatch.html.

House pattern: React 17 UMD + Babel standalone + Tailwind CDN, Orbitron font, fixed "🏠 Menu"
link top-left (z-index 9999), How-to-Play modal with focus trap.

Baseline: on iPad and laptop most of these sit in a column about a third of the screen wide,
with the board small in the middle. Boards (2048, Minesweeper, Connect Four, Lights Out, Peg
Jumper, Memory Match, Snake, Tic Tac Toe, Code Breaker, Spelling Bee, Lasers & Mirrors) should
grow to fill the space sensibly at every size, with controls and status arranged around them
(for example beside the board in landscape, above and below it in portrait).

Validators: after any change to `lasers_mirrors_game.html`, run
`node games/mini-games/validate-laser-levels.mjs` and keep every level passing at every board
size it checks.

Capture with `--batch mini`, writing to `output/screen-fit/mini-after`. Report to
`docs/codex/screen-fit-2026-11-22/mini-report.md`.
