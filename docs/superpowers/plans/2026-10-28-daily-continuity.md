# Alford Daily continuity implementation plan

> **For agentic workers:** Use superpowers:executing-plans with test-driven fixes and one independent final review. Continue the previously delegated local implementation method.

**Goal:** Protect unfinished word play and make the nine-board AI's last move easy to follow.

**Architecture:** Extend the existing shared shell's persistence boundary. Derive bonus feedback from its replay-validated history; keep engines and save schemas unchanged.

**Tech Stack:** Buildless JavaScript modules, Node tests, Playwright, bundled WKWebView resources.

**Spec:** `docs/superpowers/specs/2026-10-28-daily-continuity-design.md`

## Global Constraints

- Preserve all 32 daily identities, existing version-1 saves, puzzle assignments, scores and bonus isolation.
- Preserve the established design and creator labels.
- Work locally on a new feature branch; do not publish, contact testers or transmit source to external reviewers.
- No dependency downloads, new services or changes to shared infrastructure.

## Review Focus

- A missed/delayed storage event must not permit an unfinished overwrite.
- Failed reads/writes and later recovery must preserve playable memory and persisted saves.
- Practice restart is deliberate; a stale restart must not discard another window's progress.
- Recent move controls must not play a move or misidentify the player after reload/terminal moves.
- Native copies and standalone exports must contain exactly the final runtime bytes.

### Task 1: Preserve unfinished word-game saves

**Files:** six `games/{counterpart,shortlist,second-sense,sideways,ringcount,switchpath}/shell.mjs` copies; shared-shell tests; generated native copies.

**Interfaces:** Consumes `engine.restoreGame(puzzle,value)` and existing game keys; produces unchanged shell API and save schema with pre-write conflict protection.

- [ ] Add real-shell regressions for missed events, dirty memory, practice conflicts/restart, blocked reads, recovery and unchanged storage after a rejected stale action.
- [ ] Run `node --test games/{counterpart,shortlist,second-sense,sideways}/tests/shell.test.mjs`; expect new cases to fail because the current save boundary overwrites progress.
- [ ] Track the accepted persisted snapshot per game key. Compare a successful read before writing; adopt valid changed state, reset transient selections and give a clear notice. Skip unverified writes when reads fail. Keep failed-write memory and terminal daily precedence.
- [ ] Run the same tests; expect all passing. Synchronize the six shared shell copies and iOS resources.
- [ ] Commit the verified fix.

### Task 2: Explain and inspect the last nine-board move

**Files:** `games/nested-tic-tac-toe/{app.mjs,index.html,styles.css}`, a focused real-browser continuity harness, native runtime copies and verification report.

**Interfaces:** Consumes the existing `state.history`, `state.cells`, and selected-board view; produces a recent-move summary/inspection control without new match state.

- [ ] Add browser assertions for the move's actor/location, overview marker, inspect action, forced-board return, reload, restart and no save changes on inspection.
- [ ] Run the focused harness; expect absent recent-move feedback to fail.
- [ ] Add a textual last-move summary and explicit inspection/return controls; mark the last square in the overview using shape as well as color. Preserve routing, AI and sharing.
- [ ] Run focused and existing bonus/word browser flows in Chromium and WebKit, including small phone widths; expect passing and no page errors.
- [ ] Synchronize native resources, run the full daily JS suite, bundle parity, native structural validation and a fresh standalone export. Inspect screenshots, write exact evidence and package the local candidate.
- [ ] Commit and perform one independent final review; fix Important findings in one test-first pass.
