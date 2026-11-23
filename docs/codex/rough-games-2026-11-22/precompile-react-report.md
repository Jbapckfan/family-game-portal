# Precompiled React games — 2026-11-22

Implemented the twelve-page migration from committed `435022a` using the existing local React 18.3.1 production UMD files. No browser, app, window, server, network download, dependency installation or Git write was used. Claude's real-browser start/play comparisons remain pending.

## Build and loading

- Added `tools/build-react-games.mjs`, using only Node built-ins. It runs the CLI named by `ESBUILD`, or `esbuild` on `PATH` when the variable is absent. Both discovery paths and both missing-compiler messages were checked in scratch fixtures. This run used esbuild **0.28.2** via the supplied `ESBUILD`.
- Target: **ES2020**. The committed non-React `games/cube-jumper.html:1811` and `games/tower-defense/index.html:2202` already use optional chaining. No older-browser compatibility claim is made.
- The compiler uses classic `React.createElement` / `React.Fragment`, UTF-8, no bundling, no module format/IIFE, no minification and no tree shaking. Outputs retain the source's global declarations and begin with the requested generated-file comment, then an explicit `"use strict"` directive matching Babel's default module transform. There are no imports, exports, class fields or top-level `this` dependencies in these sources.
- React and ReactDOM are plain blocking local scripts in the head, in that order. The generated game scripts use **`defer`**, in their original document order. The DOM is parsed before they execute. They now execute before `DOMContentLoaded`, rather than being compiled by Babel after that event; the audit below found no listeners or startup dependencies that require the old side of that boundary.
- Ten `ReactDOM.render` mounts remain legacy roots. Zoo Conquest and Peg Jumper retain `createRoot`. No StrictMode wrapper, batching API, mount callback or component code was added or changed.
- `--check` rebuilds all thirteen scripts under a temporary directory, compares them with the files on disk and cleans up its own directory. Missing/stale output produces exit 1; this was verified on scratch copies without corrupting worktree outputs.

Commands:

```sh
node tools/build-react-games.mjs
node tools/build-react-games.mjs --check
```

Edit `.jsx` sources and rebuild; do not edit generated `.js` files. The existing `Minesweeper-pro.jsx` remains unchanged. Minesweeper also had an older inline definitions block: that block is now `Minesweeper.jsx`, loaded first, because the active enhanced game still uses its `HowToPlayModal`. Both blocks are retained, not consolidated or deleted.

## Per-page scope, timing and files

Every row uses ES2020. For all twelve pages: no HTML `on*=` attributes outside the moved JSX; no other inline script references to names declared by that JSX; no `DOMContentLoaded`/`load` listeners inside it; no top-level `this`, module syntax or strict-mode parsing violations. The global binding sets before/after compilation match. All existing ordinary inline scripts are byte-for-byte unchanged.

Here, **legacy risk** means the explicitly approved React 17 → 18.3.1 legacy-root library change still needs browser/play verification; preserving `ReactDOM.render` keeps synchronous mounting and legacy batching, but source checks cannot certify every React-internal or effect-timing difference. **font risk** means the mandated local Latin font files still need visual comparison with the formerly unpinned Google response; family names and page CSS were preserved. The supplied shared font stylesheet was not modified. Its face-weight declarations do not enumerate every formerly requested weight (for example Orbitron/Inter 900 and Rajdhani 700), so weight matching/synthesis merits inspection in captures.

| Page | Files added / changed | Mount kept | Specific timing / scope findings | Remaining risk |
| --- | --- | --- | --- | --- |
| Zoo Conquest | Changed `games/zoo-conquest.html`; added adjacent `zoo-conquest.jsx`, `zoo-conquest.js` | `ReactDOM.createRoot(...).render(...)` with the same ErrorBoundary | No other inline scripts. Top-level `matchMedia` remains; the only direct top-level DOM lookup is the existing root lookup at mount. No DOM reads after mount. Instance `this` in ErrorBoundary is preserved. | Existing React 18 concurrent mount retained; pinned patch/runtime and font comparison pending. |
| Snowman Siege | Changed `games/snowman-siege.html`; added adjacent `snowman-siege.jsx`, `snowman-siege.js` | `ReactDOM.render(<App />, ...)` | No other inline scripts. Existing DPR initialization remains; only the root is queried at top level. Canvas setup remains inside component lifecycle code. No reads after mount. This page already uses system fonts and had no Google font resource to replace. | Legacy risk; real canvas/sound comparison pending. |
| Code Breaker | Changed `games/mini-games/CodeBreakerV4.html`; added adjacent `CodeBreakerV4.jsx`, `CodeBreakerV4.js` | `ReactDOM.render(<MastermindGame />, ...)` | Its existing visibility listener references document state only. No outside dependency on AudioSystem or game declarations. Only root lookup at top level; no reads after mount. | Legacy + font risk. |
| Connect Four | Changed `games/mini-games/ConnectFour.html`; added adjacent `ConnectFour.jsx`, `ConnectFour.js` | `ReactDOM.render(<ConnectFourGame />, ...)` | Visibility listener and resize/MutationObserver fitter are independent of game globals. They still install before mount, and observe the resulting DOM. No reads after mount in the game script. | Legacy + font risk; responsive fitter remains capture-dependent. |
| 2048 | Changed `games/mini-games/2048.html`; added adjacent `2048.jsx`, `2048.js` | `ReactDOM.render(<Game2048 />, ...)` | Independent visibility/fitter scripts still install before mount and use selectors/observers rather than game globals. No reads after mount in the game script. | Legacy + font risk; responsive fitter remains capture-dependent. |
| Memory Match | Changed `games/mini-games/MemoryMatch.html`; added adjacent `MemoryMatch.jsx`, `MemoryMatch.js` | `ReactDOM.render(<MemoryMatchGame />, ...)` | Same independent visibility/fitter pattern; no outside references to game declarations and no reads after mount in the game script. | Legacy + font risk. |
| Tic-Tac-Toe | Changed `games/mini-games/2DTicTacToe.html`; added adjacent `2DTicTacToe.jsx`, `2DTicTacToe.js` | `ReactDOM.render(<TicTacToeGame />, ...)` | Visibility/fitter scripts do not use game declarations. Mount is the last statement; no immediate post-mount DOM read was moved across an asynchronous boundary. | Legacy + font risk; advanced modes and board sizing need captures. |
| Minesweeper | Changed `games/mini-games/Minesweeper.html`; added adjacent `Minesweeper.jsx`, `Minesweeper.js`, `Minesweeper-pro.js`; existing `Minesweeper-pro.jsx` unchanged | `ReactDOM.render(<MineQuestGame />, ...)` in pro source; old definitions still do not mount | **Two ordered deferred scripts**. The second uses the first's global `HowToPlayModal`. Their combined scripts parse without duplicate-declaration conflicts. The pro source's immediate fitter IIFE remains after its synchronous legacy mount, and keeps its root MutationObserver, initial `connect()` and font-ready retry. Visibility listener is independent. | Legacy + font risk; this is the only generated script with an immediate post-mount DOM fitter, so verify sizing in captures. |
| Spelling Bee | Changed `games/mini-games/SpellingBee.html`; added adjacent `SpellingBee.jsx`, `SpellingBee.js` | `ReactDOM.render(<App />, ...)` | Existing ordinary data and sound scripts remain before the deferred game. Its references to `PUZZLES`, `loadPuzzles`, `puzzlesLoadError` and `SoundManager` retain access to those globals. The visibility/fitter scripts need no game globals and install before mount. No reads after mount in the game script. | Legacy + font risk; local puzzle fetching/audio behavior needs browser verification. |
| Lights Out | Changed `games/mini-games/LightsOut.html`; added adjacent `LightsOut.jsx`, `LightsOut.js` | `ReactDOM.render(<LightsOutGame />, ...)` | Visibility/fitter scripts remain independent. CSS color reads are inside the existing helper/component paths; root lookup is the only direct top-level query. No reads after mount. | Legacy + font risk. |
| Snake | Changed `games/mini-games/Snake.html`; added adjacent `Snake.jsx`, `Snake.js` | `ReactDOM.render(<SnakeGame />, ...)` | Independent visibility/fitter scripts retain their pre-mount installation. SVG/material rendering, tick handlers and sound code were moved unchanged. No reads after mount. | Legacy + font risk; motion/skins require browser comparison. |
| Peg Jumper | Changed `games/mini-games/PegJumper.html`; added adjacent `PegJumper.jsx`, `PegJumper.js` | `const root = ReactDOM.createRoot(container); root.render(...)` | Container/root declarations remain global lexical declarations. Fitter installs before the asynchronous mount and already watches root mutations. No synchronous DOM query follows `root.render`. | Existing React 18 concurrent mount retained; pinned patch/runtime and font comparison pending. |

## Source-to-output evidence

For each script, compiled the committed original inline block (or committed `Minesweeper-pro.jsx`) and the moved source independently with the exact build options. Both results equal the generated file byte-for-byte. No gameplay statements, JSX, comments, constants, timing values, sound logic or saved-data keys were edited. The only extraction whitespace omitted was **46 bytes of whitespace-only closing-HTML-tag indentation** across the twelve inline blocks; original and extracted compilations still match exactly. Global binding names, ordinary inline scripts and non-dependency HTML/CSS were also compared; only loader/font tags and their obsolete comments changed outside the extracted code.

| Source | Output bytes | Matching original/moved/output SHA-256 prefix |
| --- | ---: | --- |
| `games/zoo-conquest.jsx` | 143592 | `21571f8751027d89` |
| `games/snowman-siege.jsx` | 78951 | `9892e07e796024d5` |
| `games/mini-games/CodeBreakerV4.jsx` | 71059 | `36b65b822a03a7a4` |
| `games/mini-games/ConnectFour.jsx` | 30496 | `fe3008a31f7ff294` |
| `games/mini-games/2048.jsx` | 29691 | `9e1d682cfc639d44` |
| `games/mini-games/MemoryMatch.jsx` | 22218 | `e9a3265a3373f92c` |
| `games/mini-games/2DTicTacToe.jsx` | 65447 | `28378459794b83c1` |
| `games/mini-games/Minesweeper.jsx` | 23398 | `5548cfcedc0d0fce` |
| `games/mini-games/Minesweeper-pro.jsx` | 36615 | `4acc6e1025b599e9` |
| `games/mini-games/SpellingBee.jsx` | 67959 | `5884ee011201f6ff` |
| `games/mini-games/LightsOut.jsx` | 43351 | `ecaaab35eec9c489` |
| `games/mini-games/Snake.jsx` | 37090 | `195cf44516cfd4f6` |
| `games/mini-games/PegJumper.jsx` | 48819 | `a31f7d223c625f0e` |

Totals: **13 generated scripts**, **698686 output bytes** on disk. The thirteen source files total **850075 bytes**. These are local file sizes, not compressed network transfer sizes or performance measurements.

## Legacy-root warning and dependency bytes

Searched the complete vendored `react-dom.production.min.js` for `ReactDOM.render is no longer supported`, `no longer supported in React 18` and `createRoot instead`: **zero matches**. Its production `render` export validates the container and calls `Wd(null,a,b,!1,c)` directly, with no legacy-root warning call. Thus the development warning is absent from the supplied production build; keeping the legacy mount will not emit that warning from this file. Both vendored files remain byte-for-byte unchanged.

The local files measure **10751 bytes** (React) and **131835 bytes** (ReactDOM), **142586 bytes** combined, uncompressed. These are still loaded locally; moving React into the repo does not eliminate its code bytes. The former unpinned CDN React 17/18 responses and Babel standalone response are not available as measured disk files in this task. **The total removed CDN download bytes per first visit was not measured and is not claimed.** Twelve Babel requests and twenty-four React/ReactDOM CDN references were removed across the twelve pages. Babel's runtime compilation is gone; no startup-time speedup number is claimed.

Eleven pages now use the existing shared local font stylesheet; Snowman Siege needed no font resource replacement. Font-family declarations and all other styles remain unchanged. Unused Google preconnect hints were removed.

## Checks and boundaries

Passed:

- `node tools/build-react-games.mjs` and `node tools/build-react-games.mjs --check`.
- `node --check` on all **13 outputs** and the build script.
- Original/moved/output comparison for all thirteen blocks, global-binding comparison, and combined parsing of Minesweeper's ordered scripts.
- Local React/script/font paths resolve; React tags are blocking, output tags are deferred and ordered. No home-directory path appears in generated files. No new served path begins with `_`.
- Scratch CLI checks: ESBUILD discovery, PATH fallback, unavailable compiler errors, stale output and missing output failures. Scratch build folders were cleaned up.
- `node games/mini-games/validate-laser-levels.mjs`: **all 20 levels pass** on its desktop/tablet/phone checks. Lasers source was not edited.
- Scoped `git diff --check`; additional no-index whitespace checks covered newly added source/output/build files.
- Vendored React, shared fonts, `Minesweeper-pro.jsx`, `Minesweeper-pro.css`, Lasers and `games/zoo-conquest/index.html` remain unchanged.

Requested grep (ran with `rg`, exit **1**, no matches):

```sh
rg -n 'type="text/babel"|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com' \
  games/zoo-conquest.html games/snowman-siege.html \
  games/mini-games/{CodeBreakerV4,ConnectFour,2048,MemoryMatch,2DTicTacToe,Minesweeper,SpellingBee,LightsOut,Snake,PegJumper}.html
```

No browser capture, audible playback, timing benchmark, physical iPad check or full game-session test was performed. Source equivalence and static checks passed; Claude should compare start/play at all four sizes, including help, sound, restored records, themes and variants. React 18 legacy-root compatibility and local font rendering remain the material runtime risks above.

The concurrent offline-play files (`index.html`, `sw.js`, `tools/offline/`, Cube Jumper, Tower Defense and Particle Conquest) were not edited. No service worker, capture harness, shot or portal registry was changed by this task. No process was left running.

## Files changed

- The twelve HTML pages listed in the per-page table.
- Twelve new adjacent `.jsx` sources, plus thirteen new adjacent `.js` outputs listed above (the pre-existing `Minesweeper-pro.jsx` is unchanged).
- `tools/build-react-games.mjs`.
- `docs/codex/rough-games-2026-11-22/precompile-react-report.md`.
