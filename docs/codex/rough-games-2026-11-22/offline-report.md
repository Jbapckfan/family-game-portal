# Portal offline support — 2026-11-22

Implemented the portal worker, generated precache, resource checker, local font switches and Particle cache cleanup fix. No browser, app, server or window was opened. No git writes, downloads or package installs were performed. Concurrent game pages and their scripts were left untouched.

## Request strategies

| Request | Behavior |
| --- | --- |
| Pages, scripts, styles, JSON and other eligible GETs | Network first with `cache: 'no-store'`, bypassing the browser HTTP cache. Successful responses update this worker's cache. Only a rejected network request falls back to cache; an HTTP 404/500 is returned as received. |
| Fixed fonts and `games/vendor/` | Cache first; fetch and save on a miss. This includes the fixed local font stylesheet. |
| Images | Return a cached image when available and refresh it in the background using `event.waitUntil`. Fetch and save a missing image. |
| Cross-origin, non-GET, Range requests, URLs outside the portal's scope | Pass through without `respondWith`. |
| `games/reflex-riot/`, `games/particle-conquest/` | Pass through, including folder navigations and assets. Their existing workers retain ownership. |
| Offline, uncached navigation | Self-contained 503 HTML explaining that the game has not been saved, with a link to this deployment's portal folder. No external resources. |
| Offline, uncached non-page | `Response.error()`. |

All runtime reads use the current portal cache, rather than searching other sites' caches. Cache write failures do not break successful online responses. Directory and query-string navigations can fall back to precached `index.html` files. URLs resolve relative to the worker scope, so deployment in a GitHub Pages project folder is supported.

`index.html` alone registers the new worker, with the service-worker and secure-context guards and `updateViaCache: 'none'`. Both synchronous and asynchronous registration failures are ignored. Insecure `http://portal.test` skips registration. There are no new controls, banners, messages to clients, or automatic reloads.

The requested image strategy can display the previously cached image while its refresh completes. Fixed vendor/font files are also deliberately cache-first. Thus the strict newest-online guarantee applies to changing pages/code/styles/JSON; these explicit cache-first/background-refresh exceptions remain as specified. The two existing folder workers retain their previous cache-first fetch behavior.

## Generated precache

Final generation and `--check`: **375 files, 20,431,191 bytes**, below the conservative **25,000,000-byte** cutoff. Content version: `aa976ba35d5706209a6d0095`. No missing local files were reported.

Discovery covers 58 pages including the portal, the daily hub, its 32 catalog-generated game links, and the other portal links. The 56 pages outside the two self-managed folders are included. The list also contains the portal card images, manifest, all local font/vendor files, directly referenced local resources, recursive CSS imports and ES module dependencies, and literal local JSON fetches. Following module dependencies is necessary for the daily engines/puzzles and bundled chunks. Files loaded as art from JavaScript are excluded from precache and saved on first use.

The generator hashes sorted paths and their file contents and replaces only the marked block in `sw.js`. `--check` never writes. If the limit is exceeded it refuses to write and prints the twenty largest files. The threshold and refusal to write were exercised in a fixture test. No generated path begins with a Jekyll-hidden `_` segment.

Installation strictly requires fresh `index.html` and `manifest.json`. Remaining downloads run with six concurrent requests and tolerate individual missing or failed resources. Activation deletes only older `family-game-portal-` caches and claims clients without reloading them.

After the concurrent conversions/polish land, run:

```sh
node tools/offline/build-precache.mjs
node tools/offline/build-precache.mjs --check
node tools/offline/check-no-cdn.mjs
node --test tools/offline/test/*.test.mjs
```

## Offline availability

These are conclusions from the source and generated dependency graph, **not browser-certified results**. The first online portal visit must remain connected until the worker finishes installation. Optional download failures and later browser storage eviction can reduce what is available.

- **Saved by that portal install:** portal and daily hub; all 32 daily games; ERS, Speed, Socktopus, Nexus Defense, Velocity Marble Run, Dots & Boxes 3D, Shut the Box, Cube Jumper, Lasers 3D, and the mini-game Lasers & Mirrors. Their discovered local code, data, styles, fonts and directly declared art are listed. This establishes their local startup dependencies without opening each game first.
- **Full code-loaded scenery needs an online play first:** Cube Jumper requests the current world's backdrop when used, so visit each desired world online; Nexus Defense requests terrain/road artwork on its page; Socktopus requests its portrait battlefield only in portrait layout. Other code-selected art follows the same first-use policy. Cube and Nexus retain their existing procedural rendering fallbacks. Each orientation/world/skin's unrequested art is not implicitly downloaded by opening the portal.
- **Reflex Riot and Particle Conquest need their own online visit:** the root worker deliberately does not save those folders. Their own installation must finish. Particle's existing precache includes its space backdrop and planet atlas/albedo assets. Online multiplayer/signaling remains a network feature.
- **Twelve React games are pending the other session:** Zoo Conquest, Snowman Siege, and mini-games 2048, 2D Tic-Tac-Toe, Code Breaker, Connect Four, Lights Out, Memory Match, Minesweeper, Peg Jumper, Snake and Spelling Bee. Their current pages still load React/Babel externally. A prior online play cannot guarantee those foreign dependencies offline through this worker. Once the local precompiled pages land and the generator is rerun, their local dependencies will be included without editing the tooling.
- **Optional foreign features remain online-only:** Zoo's generated QR image, Spelling Bee's dictionary definitions, and Particle's PeerJS loader/signaling. Cross-origin requests are passed through and not cached by this worker. These features and their owning pages were not changed.

Dots & Boxes already referenced the local font stylesheet and three.js when inspected during this task; it has no checker findings in the current tree. I did not edit it.

## Other source changes

- Cube Jumper now imports `fonts/fonts.css`; Nexus Defense imports `../fonts/fonts.css`. Font-family names and game code are unchanged. No Google preconnects remained in these two pages.
- Particle Conquest's cache is now `particle-conquest-v7-scoped-cache-20261122`. Its activation filter only removes older `particle-conquest-` caches. The VM test demonstrates that the portal, Reflex Riot and unrelated origin caches survive. Particle's fetch policy and precache assets are unchanged.
- The no-CDN checker follows the portal/daily page graph and local script/style/module dependencies. It recognizes resource `src`, relevant link `href`, CSS imports/URLs, ES imports, literal fetch/importScripts calls and literal script-created resource URLs. It ignores ordinary navigation links, inline data/blob resources and comments. Computed resource destinations cannot be exhaustively proven by a static scanner.

## Checks

- `node --test tools/offline/test/sw.test.mjs tools/offline/test/resources.test.mjs`: **16 passed, 0 failed**. Tests cover fresh online code and cache updates, offline reuse and misses, folder/query aliases, HTTP errors, cache write failure, all required bypasses, fonts/vendor, image refresh, tolerant optional install/strict shell, both workers' cleanup isolation, silent secure registration, dependency discovery, content-hash changes, read-only check mode and size cutoff.
- `node tools/offline/build-precache.mjs --check`: **pass**, count and hash above.
- `node tools/offline/check-no-cdn.mjs`: **exit 1 as expected**; 58 pages checked, **50 distinct cross-origin resource references on 13 pages**. Those are the twelve concurrent React pages plus Particle's optional PeerJS script. The three optional features above are included in these findings. No missing local resources.
- `node --check`: **pass** for the seven new/changed standalone scripts and all four inline script blocks in the three changed HTML pages.
- `node games/validate-cube-jumper.mjs`: **pass**.
- Scoped `git diff --check`: **pass**, including separate checks for newly added files.

Real service-worker installation, airplane-mode navigation, browser storage behavior, audio and the four-size captures remain for Claude's muted browser run. No browser verification is claimed. Regenerate the precache after other sessions' changes before deployment.

## Files changed

- `index.html`
- `sw.js`
- `games/cube-jumper.html`
- `games/tower-defense/index.html`
- `games/particle-conquest/sw.js`
- `tools/offline/resources.mjs`
- `tools/offline/build-precache.mjs`
- `tools/offline/check-no-cdn.mjs`
- `tools/offline/test/sw.test.mjs`
- `tools/offline/test/resources.test.mjs`
- `docs/codex/rough-games-2026-11-22/offline-report.md`

## Claude's change after review

The worker's network fetches (`fresh()` and install-time `precacheFile()`) now use `cache: 'no-cache'`
instead of `'no-store'`. Both always ask the server, so players still get the newest file online, but
`no-store` downloaded every page, script, style and image in full on every visit, while `no-cache`
lets an unchanged file come back as a small 304. The matching assertion in `sw.test.mjs` was updated.

## Round 2 — precache the artwork games actually request

Expanded discovery and regenerated only the worker's marked precache block. The worker's runtime code and Claude's `cache: 'no-cache'` change are preserved. No game page, game script, image or self-managed worker was edited. No app/browser/server was opened and no git writes were made.

### Result

**423 files, 23,259,305 bytes**, version `5eb6bd6d6963362872ca6635`. This adds **36 files / 2,983,040 bytes** to the incoming 387-file / 20,276,265-byte list. There are no missing local files. The total is **1,740,695 bytes below** the unchanged 25,000,000-byte cutoff; the over-limit refusal and no-write behavior remain tested.

The additional files are 18 daily icons and 18 raster assets: Snake's two textures, Shut the Box's felt/ivory, seven Nexus materials, six Cube backdrops and Socktopus's portrait battlefield. The earlier list already contained the other daily icons; the regression now checks **all 32**. These additions replace the first-use art limitations described in the original report.

### What discovery now follows

- Existing markup handling covers `img src`, `srcset`, icon/apple-touch-icon links, video posters and SVG image hrefs. Inline styles now decode HTML entities before parsing `url()`, including quoted URLs written as `&quot;…&quot;`.
- Stylesheet URLs and recursive imports remain relative to the **stylesheet**. Inline CSS is relative to its page.
- JavaScript resource assignments, CSS URLs in script strings and existing local file literals are included. This covers React-created SVG image `href` values, texture-loader arguments and local data/model files beyond JSON. Ordinary file literals are resolved against the **executing page**, including when shared code lives in a different folder. Local ES imports keep their module-relative resolution.
- Literal paths must resolve to existing files; incomplete prefixes such as `art/` and suffixes such as `.webp` do not become cache entries. The finite computed requests below are expanded separately from their actual source tables and loader expressions. A changed known loader shape produces a discovery error for review, rather than silently globbing its folder.
- `ios/`, `games/lasers-3d/assets/review/` and all `*-source.png` files are excluded, as are both self-managed game folders. No artwork directory is swept. Fixtures include undeclared images beside real art and verify they stay out.

### Runtime-built paths, resolved from the source

| Builder | Resolution and resulting files |
| --- | --- |
| Cube Jumper: `'cube-jumper/art/' + RUN_ART_FILES[worldId] + '.webp'` | Read the six values in `RUN_ART_FILES`, plus the prefix/suffix from the loader. Relative to `games/cube-jumper.html`, this yields `games/cube-jumper/art/{metro-distance,foundry-distance,glacier-distance,jungle-distance,rift-distance,engine-distance}.webp`. All six are included before visiting a world. |
| Nexus: `'art/' + name + '.webp'` | Read `NEXUS_TERRAIN_FILES` and the loop's explicit `road-material` extra. Relative to `games/tower-defense/index.html`, this yields `games/tower-defense/art/{emerald-terrain,frozen-terrain,volcanic-terrain,crystal-terrain,grid-terrain,rift-terrain,road-material}.webp`. |
| Shut the Box: `asset + name + '.jpg'` | Read `asset = 'shut-the-box-assets/'` and the actual `['wood','felt','ivory'].forEach` loader. Resolve against `games/shut-the-box.html`, not the `table.js` directory: `games/shut-the-box-assets/{wood,felt,ivory}.jpg`. Wood was already listed through CSS. |
| Daily hub: `new URL('icon.svg', url)` | Read the hub document's `data-game-base="../"`, the source's icon leaf and all 32 slugs from `games/daily/catalog.mjs`. The result is `games/<slug>/icon.svg` for every slug below. No enumeration of unrelated game directories. |

The daily slugs expanded are:

```text
ringcount, switchpath, counterpart, shortlist, second-sense, sideways,
tradeoff, inbetween,
kimi-cairn, kimi-morph, kimi-tangle, kimi-hunch, kimi-circuit, kimi-quartet,
deepseek-twin-hive, deepseek-spare, deepseek-rung, deepseek-cipher,
deepseek-trail, deepseek-split,
qwen-quadra, qwen-logic-lattice, qwen-syntax-siege, qwen-memory-maze,
qwen-pattern-prism, qwen-territory-tactics,
claude-dovetail, claude-splice, claude-sprout, claude-tangle,
claude-keystone, claude-tumbler
```

Snake's `./Snake-assets/scale-grain-r1.jpg` and `./Snake-assets/food-atlas-r1.webp` are literal SVG image hrefs in `Snake.js`; they now resolve against `games/mini-games/Snake.html`. Socktopus's conditional `./assets/battlefield-portrait.jpg` is also a literal and is saved without first entering portrait play. The shared daily runtime's literal `./icon.svg` resolves separately for each executing game page.

`buildPrecache()` also returns the expanded source/page/path records as `runtimeBuilt`, making the finite expansions available for inspection without running game code.

### Checks and remaining verification

- `node tools/offline/build-precache.mjs`, then `--check`: **pass**, with the count, bytes and hash above.
- `node tools/offline/check-no-cdn.mjs`: **expected exit 1**, exactly **3 optional cross-origin features** across 58 pages: Spelling Bee's dictionary fetch, Particle's PeerJS loader and Zoo's QR image. No missing local resources reported.
- `node --test tools/offline/test/*.test.mjs`: **20 passed, 0 failed**. The new repository-level regression initially reproduced every reported missing asset family. It now checks all those files, all six Cube worlds, all Nexus maps/road, all daily icons, exclusion of review/source/native files, and continued exclusion of the unlinked `games/zoo-conquest/index.html`. Fixtures check page-relative script paths versus stylesheet-relative URLs, entities, srcset/poster/icon links, data/model files, finite expansions without folder sweeps, and hub-only icon discovery.
- `node --check` on all changed scripts, including `sw.js`: **pass**.
- Scoped `git diff --check`, including the new test file: **pass**.

No known local image used by the audited precached pages remains intentionally first-use-only. Reflex Riot and Particle Conquest still need their own online visit/install and retain their own asset policies. The three optional foreign features remain network-dependent. Future computed loaders require discovery support; this is static source inspection, not proof from driving every game state.

Real offline rendering remains for Claude's rerun. Under the unchanged image strategy, a cached image can still trigger a failed **background refresh** while offline; a failed network-request log alone does not establish that its cached image failed to display. Image responses/rendered results should distinguish that case from an actual cache miss.

Round 2 files changed:

- `tools/offline/resources.mjs`
- `tools/offline/build-precache.mjs`
- `tools/offline/test/resources.test.mjs`
- `tools/offline/test/art-discovery.test.mjs` (new)
- `sw.js` (generated block only; retained the incoming React dependency entries)
- `docs/codex/rough-games-2026-11-22/offline-report.md`
