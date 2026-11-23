# Offline play, round 2: save the art the games use

Your offline work was accepted and committed (`c7489d4`). Claude made one change: the worker's
network fetches now use `cache: 'no-cache'` instead of `'no-store'` (see the note at the end of
`offline-report.md`). The React build landed (`5cf48cd`) and the precache block was regenerated
(387 files, 20,276,265 bytes).

Claude then ran a real offline test: local server, muted headless Chromium, one online portal visit,
then the server stopped and the browser set offline. Results: the worker installed and controlled the
page; an online revisit made 23 requests, all `304`; offline, 58 of 59 pages opened (the 59th is the
unlinked `games/zoo-conquest/index.html`, which correctly showed the offline page). Reflex Riot and
Particle Conquest activated their own workers.

**The problem:** art a page loads from its CSS or code was not saved, so games look broken offline
after a portal visit. Failed requests seen offline:

- `games/mini-games/Snake-assets/scale-grain-r1.jpg`, `food-atlas-r1.webp` (food shows as a grey
  square)
- `games/shut-the-box-assets/felt.jpg`, `ivory.jpg`
- `games/tower-defense/art/*-terrain.webp`
- `games/cube-jumper/art/metro-distance.webp`
- every daily game's `icon.svg` (the daily hub's tiles and each page's icon link)

Expect others of the same kind on pages that were not driven past their start screen.

## What to do

Change `tools/offline/resources.mjs` / `build-precache.mjs` so the precache also includes local
images (and any other local files) that the precached pages actually use:

- `<img src>`, `srcset`, `<link rel="icon">`/`apple-touch-icon`, `poster`, inline `style` and
  `<style>` `url()`, `url()` in local stylesheets (resolved relative to the stylesheet).
- Literal local paths in page scripts and local scripts. Resolve them relative to the **page**
  that runs the script, not the script file. For paths built at runtime (for example a world or
  terrain name in a template string), handle the cases the games really use: show each one and
  how you resolved it. Do not guess or add whole folders blindly.
- Never include files no page uses: `games/lasers-3d/assets/review/`, source PNGs such as
  `thumb-source.png` / `app-icon-source.png`, anything under `ios/`.
- Keep the two self-managed folders excluded. Keep the 25,000,000-byte limit: if it would be
  exceeded, do not write; report the total and the twenty largest files instead.

Do not edit any game page, `.jsx`/`.js` game file or image. Only `tools/offline/`, `sw.js` (the
generated block, plus code changes only if needed) and the report.

Do not open any app, window or browser; save files only. No git writes. Shared rules in `shared.md`
still apply.

## Checks

- A test in `tools/offline/test/` that the discovery finds each failing file listed above, and does
  not include `games/lasers-3d/assets/review/` files.
- `node tools/offline/build-precache.mjs`, then `--check`; `node tools/offline/check-no-cdn.mjs`
  (still 3 expected optional cross-origin features); `node --test tools/offline/test/*.test.mjs`;
  `node --check` on changed scripts; scoped `git diff --check`.

Append a **Round 2** section to `offline-report.md`: what is now discovered, new file count and
bytes, the runtime-built paths and how each was resolved, and any art you know is still loaded only
on first use. Claude reruns the real offline test afterwards.
