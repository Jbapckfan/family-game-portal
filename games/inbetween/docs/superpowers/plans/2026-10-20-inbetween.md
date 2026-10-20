# Inbetween Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement the assigned tasks. Steps use checkbox syntax for tracking.

**Goal:** Build a polished second daily game and save both games in the private family portal repository.

**Architecture:** Independent pure game engine, deterministic content module, and browser UI. Buildless portable assets support both standalone Sites hosting and the NAS portal's nested game paths.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node test runner, localStorage.

**Spec:** docs/superpowers/specs/2026-10-20-inbetween-design.md

## Global Constraints

- Six four-letter seeds, six ordered two-letter tiles, five insertion gaps per seed.
- Keep seed and tile letters in their original order; every tile used once.
- America/Chicago daily dates; epoch 2026-10-20.
- Wrong confirmed fits count; preview changes and invalid actions do not.
- Owner-private standalone Site; existing private GitHub repository; preserve portal audience.
- Relative asset URLs and local fonts; no external runtime dependencies.

## Review Focus

- Invalid or duplicate tile placements cannot consume tiles or inflate valid state.
- Corrupt local saves and denied storage cannot prevent playing.
- A stale tab cannot overwrite the first finished daily result.
- Nested portal paths must resolve every script, stylesheet, font and icon.
- Revealing or replaying practice must never improve daily win statistics.

## Task 1: Engine and content

**Files:** dist/engine.mjs, dist/puzzles.mjs, tests/engine.test.mjs, tests/puzzles.test.mjs, scripts/generate-puzzles.mjs.

**Interfaces:** createGame(puzzle), submitPlacement(puzzle,state,{row,tileId,gap}), useHint(puzzle,state), revealGame(puzzle,state), restoreGame(puzzle,state), getDaily(puzzles,now), getStats(records,todayKey), formatShare(puzzle,state,options). Content exports PUZZLES with rows {seed,answer,clue} and tiles {id,letters}.

- [ ] Add tests for the opening board, accepted/wrong/invalid placement, locks, terminal state, corrupt saves, daily boundaries, hints and sharing.
- [ ] Implement engine and author varied validated boards; require exact six-tile completion.
- [ ] Run both test files and verify every board has an executable completion.

## Task 2: Playable interface

**Files:** dist/index.html, dist/styles.css, dist/app.mjs, icon.svg, manifest.webmanifest, fonts, package.json, README.md.

- [ ] Build the select–preview–place interaction with accessible buttons and explicit confirmation.
- [ ] Add daily/practice persistence, first-finished protection, statistics, share fallback, hints, reveal and optional sound.
- [ ] Verify a complete daily, a wrong placement, hint, practice restart, refresh restore, cross-tab state, and small-phone layout in the browser.

## Task 3: Portal integration and publishing

**Files:** family-game-portal/index.html, games/index.html, games/tradeoff/**, games/inbetween/**, README.md, sync-to-nas.sh.

- [ ] Copy all source and runtime assets with relative URLs; adapt test and generator paths.
- [ ] Add both cards without disturbing existing game entries; include root catalog in NAS sync.
- [ ] Independently review code, run relevant checks, then commit new tree against the existing GitHub head and verify private repo commit.
- [ ] Publish the standalone Inbetween Site, preserve its private audience, and report verified deployment.
- [ ] Deploy the NAS if an authorized connected device is available; otherwise provide the exact remaining pull command and state the limit.
