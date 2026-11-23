# Offline play for the whole portal

James approved this. Goal: once the portal has been opened online, the portal and its games keep
working with no network (car, plane, bad Wi-Fi). **Online behaviour must not change: when online,
players always get the newest version of every page and file.** No new buttons, banners, pop-ups or
automatic reloads; nothing visible changes.

Do not open any app, window or browser; save files only. No git writes. Shared rules in `shared.md`
still apply. Report to `offline-report.md` in this folder.

**Another Sol session is converting the twelve React pages at the same time** (`zoo-conquest.html`,
`snowman-siege.html` and the ten React pages in `games/mini-games/`; see `precompile-react.md`), and
other sessions are still polishing the mini-games and the card/dots pages. Do not edit those pages
or their `.jsx`/`.js` files, and do not edit any game page this brief does not name. Everything
below is disjoint from that work.

## Facts already checked

- Local copies are committed: `games/fonts/fonts.css` (+ WOFF2 files, Latin subset, every family the
  portal games use, including Exo 2), `games/vendor/react-18.3.1/`, `games/vendor/three-r128/`.
- Outside the twelve React pages, the only CDN loads in portal-linked games are: Google Fonts in
  `games/cube-jumper.html`, `games/dots-and-boxes-3d.html` and `games/tower-defense/index.html`
  (`@import`, Orbitron + Exo 2), and three.js r128 from cdnjs in `games/dots-and-boxes-3d.html`.
- No game loads audio files; sound is synthesised.
- `games/reflex-riot/` and `games/particle-conquest/` have their own service workers. A page is
  controlled by the registration with the most specific scope, so those two folders stay with
  their own workers.
- **Bug to fix:** `games/particle-conquest/sw.js` deletes *every* cache whose name is not its own
  on activate. Cache Storage is shared by the whole origin, and on GitHub Pages that origin is
  shared with the owner's other Pages sites. Limit its cleanup to its own name prefix (as Reflex
  Riot's worker already does) and bump its cache version.
- The site is served by GitHub Pages with Jekyll (no `.nojekyll`): avoid paths starting with `_`.
- The capture harness serves pages from `http://portal.test`, which is not a secure context, so the
  worker cannot register there. Registration must be skipped silently in that case (no console
  error).

## What to build

1. **Point `games/cube-jumper.html` and `games/tower-defense/index.html` at the local fonts**
   (`fonts.css` with correct relative paths, same `font-family` names). Remove unused Google
   preconnects. **Do not edit `games/dots-and-boxes-3d.html`:** a third Sol session is changing it
   right now. Claude will send its font and three.js switch as a follow-up once that work lands;
   until then the no-CDN checker will list it, which is expected.
2. **A portal-wide service worker** at the repo root (`sw.js`, scope = the portal folder), registered
   from `index.html` only, guarded by `'serviceWorker' in navigator && isSecureContext`, failures
   ignored silently.
   - Same-origin GET requests only. Pass through: cross-origin, non-GET, requests with a `Range`
     header, and anything under the two folders with their own workers.
   - Pages, scripts, styles and JSON: network first; use the cache only when the network fails.
     Store successful (`ok`) responses so the newest copy is what is used offline.
   - Fonts and `games/vendor/` files: cache first (their paths are fixed copies).
   - Images: serve from cache if present, refresh in the background; otherwise network, then store.
   - Offline and not cached: for a page, return a small self-contained "This game has not been saved
     for offline play yet" page with a link back to the portal; for other requests, a normal error.
   - Cache names start with `family-game-portal-`. On activate delete only older caches with that
     prefix. `skipWaiting` + `clients.claim` are fine because the strategy never serves stale code
     online; never reload or message open pages.
3. **Precache list, generated.** Add `tools/offline/build-precache.mjs` (Node, no new packages). It
   writes the list into a marked block in `sw.js`, plus a version string that is a hash of the
   listed files' contents, so any change to a listed file changes `sw.js` and triggers an update.
   List: `index.html`, `manifest.json`, the card images the portal shows, `games/fonts/**`,
   `games/vendor/**`, every page the portal links to (outside the two self-managed folders), and the
   local scripts and stylesheets those pages load directly (parse `src`/`href`/`@import`). Art that
   games load from code is cached on first use, not precached. Install must not fail as a whole
   because one listed file is missing: cache the core shell strictly, the rest tolerantly. A
   `--check` flag exits non-zero when the block in `sw.js` is out of date. Print the file count and
   total bytes. If the total is over 25 MB, stop and list the twenty largest files in the report
   instead of shipping the list. Other pages will keep changing after you finish; Claude reruns the
   script once they land, so `--check` only has to pass against the tree as you leave it.
4. **A no-CDN checker,** `tools/offline/check-no-cdn.mjs`: for every page the portal links to, list
   any resource loaded from another origin (`src`, stylesheet `href`, `@import`, CSS `url()`, ES
   `import`, `fetch(`, `importScripts`). Ordinary `<a href>` links do not count. It will still
   report the twelve React pages until the other session lands; say so rather than editing them.

## Checks

- `node --test` for a new `tools/offline/test/sw.test.mjs` that loads `sw.js` in a VM with stubbed
  `caches`, `fetch`, `self` and `clients`: online returns the network copy and updates the cache;
  offline returns the cached copy; offline + uncached page returns the offline page; Range,
  cross-origin and self-managed-folder requests are passed through; install survives one missing
  optional file; activate deletes only older `family-game-portal-` caches (put a `reflex-riot-` and
  an unrelated cache in the stub and show they survive).
- The same kind of test, or a source check, for the Particle Conquest cleanup fix.
- `build-precache.mjs --check` passes; `node --check` on every new or changed script.
- `node games/validate-cube-jumper.mjs` passes. Scoped `git diff --check`.

I will run the real-browser offline test myself (local server, muted headless Chromium, go offline,
open the portal and games) and the four-size captures of the three changed pages. Do not try the
browser.

## Report

Files changed; strategy per request type; precache file count and bytes; which games work offline
right after one online portal visit and which need one online play first (art loaded from code);
the Particle Conquest fix; anything you could not verify.
