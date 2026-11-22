# Screen-fit and polish pass: rules for every batch

James asked: "review all alford portal games, make sure they are all fully optimized, look
beautiful, and take up the screen appropriately." He noticed Shut the Box sits small in the
middle of the screen. The baseline captures confirm most games do the same on iPad and laptop:
a narrow column or a small board surrounded by empty space. The games are played by kids and
family on iPhones, iPads (both orientations) and laptops.

You own the visual and layout decisions. Claude handles git, verification and reporting.

## Where you are

- Repo: static HTML/CSS/JS games, no build step. You are in a git worktree on branch
  `codex/screen-fit-2026-11-22`. The portal home is `index.html`; games are under `games/`.
- Baseline screenshots (before any change): `output/screen-fit/baseline/<game-id>/sheet-start.png`
  (all four sizes side by side) and `report.json`. Shut the Box also has `sheet-play.png`.
- Known pitfalls for this repo: read `docs/codex/screen-fit-2026-11-22/do-not-repeat.md`.

## Hard rules

1. **Do not open any app, window or browser. Save files only.** No headed browsers, no Preview,
   no `open` command.
2. **Silence.** For any browser check use only `node tools/screen-fit/capture.mjs` (headless
   Chromium with --mute-audio plus page-level muting). Never launch WebKit, Firefox or a headed
   browser. Never start a local server or bind a port; the tool serves the repo from disk.
3. **No git writes.** Do not run git add, commit, stash, checkout, reset, push or merge. Leave
   your changes in the working tree; Claude reviews and commits them. Read-only git (diff, log,
   show, status) is fine.
4. Only touch the games in your batch, plus their entries in `tools/screen-fit/games.json`.
   Do not touch `index.html`, other games, `output/screen-fit/baseline/`, or anything outside
   this worktree. No network installs or downloads.
5. Run long commands in the foreground. Leave nothing running when you finish; stop only
   processes you started.
6. Do not change game rules, scoring, difficulty, level content or saved-data formats. Layout,
   rendering, performance and visual polish only.
7. Report only what you measured or observed. Never invent numbers.

## What "done" means for each game

**Fills the screen appropriately** at phone 393x852, iPad landscape 1180x820, iPad portrait
820x1180 and laptop 1440x900:
- During play, the play area (board, tiles, cards, canvas) is the dominant element and scales up
  to use the available space while keeping its aspect ratio. Use the viewport (`dvh`/`dvw`,
  `min()`/`clamp()`, container queries or a fit-to-screen scale) rather than fixed pixel caps
  like `max-width: 480px` that leave iPads and laptops mostly empty.
- All controls needed during play stay on screen without page scrolling, including on the phone.
  Setup menus may scroll on a phone only if there is no reasonable alternative.
- No horizontal overflow, clipped labels or overlapping UI. Touch targets at least 44px.
- Respect safe areas (`env(safe-area-inset-*)`) and `viewport-fit=cover` where relevant.
- Text stays readable at every size; do not just scale tiny text up into blur.

**Optimized:**
- Animation speed is time-based (delta time), not tied to the display's refresh rate. 120 Hz
  iPads must not run games at double speed.
- Canvases are scaled by `devicePixelRatio` (cap it, e.g. at 2-3) so they are sharp, and are
  re-fitted on resize and orientation change.
- Animation loops pause when the tab is hidden; no per-frame layout thrash or allocation storms.
- A game's basic layout must not depend on `cdn.tailwindcss.com` loading at runtime (it failed
  in a mobile in-app browser before and collapsed a game). Replace runtime Tailwind with local CSS
  in the file. Leave other CDN scripts (React UMD, Babel) alone unless a change is mechanical and
  verified, and say in the report what you did.

**Beautiful:** polished, cohesive and premium-looking, keeping each game's identity. Consistent
type, spacing, depth, contrast and motion; tasteful transitions; `prefers-reduced-motion`
respected. Hover effects only under `@media (hover: hover)` so touch devices do not get stuck
hover states.

**House rules that must survive:** the fixed top-left "Menu" home link stays visible and
tappable above every overlay, panel and modal (overlays covering it has been the most common bug
here). Keep the How-to-Play help. Keep sound toggles working.

## Evidence

1. In `tools/screen-fit/games.json`, give each game in your batch a `play` shot whose steps reach
   real gameplay (start the game, make a move or two), so captures show play, not only the menu.
   Step forms are documented at the top of `tools/screen-fit/capture.mjs`.
2. Capture after your changes:
   `node tools/screen-fit/capture.mjs --out output/screen-fit/<batch>-after --batch <batch>`
   (all four sizes by default). Look at every `sheet-*.png` yourself and iterate until each game
   looks right at every size. If the headless browser cannot start inside your sandbox, say so
   in the report and carry on with the code; Claude will run the captures outside it.
3. Run each relevant validator named in your batch brief and `node --check` on any JS you edit.
4. Write `docs/codex/screen-fit-2026-11-22/<batch>-report.md`. For each game: what you changed
   and why, what you saw before and after at each size, validators and results, anything left
   undone and why. End with a list of the files you changed.
