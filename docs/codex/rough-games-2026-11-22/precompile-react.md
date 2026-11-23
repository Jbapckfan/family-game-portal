# Build the React games ahead of time (no Babel or React from a CDN)

James approved this. Twelve pages fetch React and Babel from unpkg and compile their JSX in the
browser on every visit. That is slow on the iPads and fails with no network. Build them once, ahead
of time, and load React from the repo. **Gameplay, looks, sound and saved data must not change.**

Do not open any app, window or browser; save files only. No git writes. Shared rules in `shared.md`
still apply. Report to `precompile-react-report.md` in this folder.

Your small-games pass (Snake, Tic-Tac-Toe, Minesweeper, Lasers, Code Breaker) was accepted and
committed as it stands; build from the committed versions. **Another Sol session is building offline
play right now** (`index.html`, `sw.js`, `tools/offline/`, `games/cube-jumper.html`,
`games/tower-defense/index.html`, `games/particle-conquest/`). Do not edit any of those.

## Pages (all twelve)

- `games/zoo-conquest.html` (React 18, `createRoot`)
- `games/snowman-siege.html` (React 17, `ReactDOM.render`)
- `games/mini-games/`: `CodeBreakerV4`, `ConnectFour`, `2048`, `MemoryMatch`, `2DTicTacToe`,
  `Minesweeper` (its JSX is the separate `Minesweeper-pro.jsx`), `SpellingBee`, `LightsOut`, `Snake`
  (React 17, `ReactDOM.render`), and `PegJumper` (React 18, `createRoot`).

Leave `games/zoo-conquest/index.html` alone (an unlinked copy; James decides its fate).

## What to do

1. **React from the repo.** Use `games/vendor/react-18.3.1/` (already committed, unmodified UMD
   production builds). Replace every unpkg React/ReactDOM tag with plain blocking `<script src>`
   tags to those files (correct relative path per page). Remove the Babel standalone tag.
2. **React 17 pages keep their `ReactDOM.render` call.** React 18 runs it as a legacy root, which
   keeps React 17 behaviour (no automatic batching outside events, synchronous first render). Do
   not switch them to `createRoot`. Confirm from the vendored production file that the legacy-root
   warning is development-only (search it for the warning text) and say what you found.
3. **Sources and output.** Move each page's `type="text/babel"` code, unchanged, into a source file
   beside the page (`X.jsx`; Minesweeper already has `Minesweeper-pro.jsx`). Compile each to a
   plain script beside it (`X.js`) and load that instead. Start each output with a one-line comment
   saying it is generated from `X.jsx` by the build script and should not be edited. Keep outputs
   readable (no minify). Do not use paths starting with `_` (GitHub Pages runs Jekyll; no
   `.nojekyll`).
4. **Build script.** Add `tools/build-react-games.mjs` (Node, no new npm packages). It finds
   esbuild from the `ESBUILD` environment variable (set for you in this run), else `esbuild` on
   `PATH`, and says so clearly if neither exists. JSX → `React.createElement` / `React.Fragment`,
   no bundling, no module wrapper. Pick a `--target` no lower than what the portal's non-React games
   already need (they already use modern syntax; check) and state it. A `--check` flag rebuilds
   into a temp folder and exits non-zero if any committed output differs. Never write a full home
   path into any committed file.
5. **Keep scoping and timing identical.** Babel standalone ran these scripts after
   `DOMContentLoaded`, as classic scripts, with top-level names global. Check each page for: other
   inline scripts or `on*=` attributes that use names declared in the Babel code; `DOMContentLoaded`
   / `load` listeners inside it (these behave differently once it runs earlier); code that reads the
   DOM straight after mounting; and anything Babel's default presets allowed that the new target
   changes (strict mode, `this` at top level). Load each output with `defer` (or at the end of
   `<body>`) and keep top-level declarations global (no IIFE) unless you have shown nothing outside
   needs them. List what you checked per page.
6. **Fonts on these twelve pages.** Replace the Google Fonts `<link>` / `@import` with
   `games/fonts/fonts.css` (already committed: local Latin copies of every family these pages use).
   Keep the same `font-family` names. Remove now-unused `preconnect` hints to Google/unpkg.

## Checks

- `node tools/build-react-games.mjs` then `--check` passes.
- `node --check` on every output; no `type="text/babel"`, `unpkg.com`, `fonts.googleapis.com` or
  `fonts.gstatic.com` left in the twelve pages (show the grep).
- For each page: a source-to-output comparison showing only JSX was transformed (for example,
  compile the original inline code and the moved `.jsx` and compare the outputs).
- `node games/mini-games/validate-laser-levels.mjs` still passes (sanity; not one of these pages).
- Scoped `git diff --check`.

I will run the real-browser captures of all twelve pages (start and play, four sizes, muted) and
compare them with the last committed captures. Do not try the browser.

## Report

Per page: files added/changed, mount call kept, timing/scope findings, target, any behaviour risk
you could not rule out. Total bytes the browser no longer downloads per first visit (Babel
standalone and the CDN React builds are no longer fetched; give the sizes of the files you replaced
only if you can measure them from files on disk, otherwise say they were not measured).
