# Counterpart implementation plan

**Goal:** Deliver a complete meaning-based daily analogy game, its private Site and its portal integration.

**Architecture:** Pure engine and authored data are independent of UI. A shared shell handles daily lifecycle, persistence and dialogs; a game-specific adapter handles drafts and directed pair checks.

**Tech stack:** Buildless HTML, CSS, browser ES modules, Node's built-in test runner.

**Spec:** `../specs/2026-10-20-counterpart-design.md`

## Global constraints

- Five directed analogies and ten unique bank words; five perfect checks without hints.
- Midnight America/Chicago, epoch 2026-10-20; finite 30-board collection.
- Keep private access and all existing portal content.
- No runtime API, tracking or new account requirement.

## Tasks

- [ ] Implement and test pure pair submission, hints, reveal, state restoration, daily selection, statistics and share API in `engine.mjs` and `tests/engine.test.mjs`.
- [ ] Author and human-review content in `puzzles.mjs`; validate uniqueness and completion from every solved subset in `tests/puzzles.test.mjs`.
- [ ] Build `index.html`, `styles.css`, `app.mjs` and shared `shell.mjs`. Preview selections freely and score only explicit checks.
- [ ] Exercise storage denied/quota cases, terminal restoration and sequential stale tabs with actual shell tests. Test no answer leakage through hints or sharing.
- [ ] Browser-check complete play, wrong checks, practice and mobile. Review semantic ambiguity and small-screen focus separately from engine correctness.
- [ ] Copy portable assets/tests/docs into the portal, verify prior cards unchanged, push a non-force private GitHub commit, package exact source and publish the private Site.

## Review focus

Semantic alternatives require human review. Corrupt stored state must not manufacture wins. Storage denial must not reset on navigation. Daily reservation must be recalculated across midnight. Focus must stay useful after render and modal close. Source integration must not be reported as NAS deployment.
