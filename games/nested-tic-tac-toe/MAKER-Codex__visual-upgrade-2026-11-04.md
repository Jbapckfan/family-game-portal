# Tic-Tac-Toe visual upgrade — November 4, 2026

Approved scoped visual iteration for Alford Daily. Source only; no public deployment or native bundle copy performed in this worktree.

- Charcoal surfaces, blue human marks, teal AI marks, white text. Updated matching icon and browser theme. Removed visible developer credits; Alford Daily branding remains.
- Claimed mini boards resolve into large geometric X/O marks. Closed grids disappear from the macro board while remaining inspectable in the detail view. Draws use neutral hatching and an equals symbol; winning macro lines receive white borders.
- Each newly closed board receives one 620 ms scale/opacity animation. Restored games and board inspection do not replay it; reduced motion omits it. AI/human turn scheduling and available input do not wait for presentation. If the macro board is offscreen after mobile play, it is revealed before the transition. No animated scrolling.
- Selected and forced boards, the next-destination hover/focus outline, detail-panel heading, score counters, and recent-claim announcement reinforce the move flow. Rule engine, AI, save format, difficulty selection and routing rules remain unchanged.

## Verification

`node --test games/nested-tic-tac-toe/tests/*.test.mjs`: 46 passed, zero failures. Includes exhaustive independent mini/macro board oracles and full matches for both AI levels.

`PLAYWRIGHT_BROWSERS_PATH=/private/tmp/alford-word-controls-browsers node games/nested-tic-tac-toe/tests/MAKER-Codex__visual.playwright.mjs`: all six browser/layout combinations passed (Chromium and WebKit, 1280, 390, and 320 px). Browser tests use filesystem-backed HTTPS routing and isolated headless profiles; no listener or personal profile. The sandbox initially prevented Chrome launching; the authorized unsandboxed isolated run succeeded.

Legal replay fixtures exercise a human mini win, actual AI mini win, drawn board, terminal macro win, resumed next-turn input while the claim transition runs, reduced motion, no animation replay on restore, claim visibility, 44 px detail controls, no horizontal overflow, and native presentation. No page exceptions. Screenshots inspected for desktop start, phone finish, narrow claimed macro, phone draw and native presentation.

Evidence: `/private/tmp/MAKER-Codex__ttt-ui-20261104/` (screenshots and `results.json`; local-only). Native presentation uses the page's native bridge flag in WebKit; this is not physical iPhone certification. No simulator, installed app, device audio/haptics or production build was tested here.
