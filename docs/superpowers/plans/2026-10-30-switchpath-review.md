# Switchpath Review Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans task by task.

**Goal:** Deliver Switchpath's gameplay/UI/social-sharing review and record James's Ringcount feedback.

**Architecture:** Keep the pure engine and calendar unchanged. Add a game-specific share adapter using the proven result-snapshot approach. Change only Switchpath's shell/UI and required bundle/test allowlists.

**Tech Stack:** Existing browser modules, Canvas PNG, Node, Playwright and subscription reviewer CLIs.

**Spec:** `docs/game-reviews/switchpath/DESIGN.md`

## Global Constraints

- Preserve all 33 entries, all published boards, scoring and saves.
- Never equate model predictions or structural metrics with James's enjoyment.
- Share no board values, route positions, answer geometry or private URL.
- No new spending, dependencies, public deployment or social posts.

## Review Focus

- A stalled saved route should remain obviously stalled after reload.
- Hint cancel must leave moves, path and hints unchanged; confirmed help discloses possible rewind.
- Rewind/invalid-move/terminal state must preserve scores and keyboard behavior.
- Image/caption must label revealed, assisted and practice correctly, including after midnight.
- Real file export, unavailable/cancelled share, and narrow-phone access must work without spoilers.

### Task 1: Player feedback and independent review

**Files:** `docs/game-reviews/ranking.json`, `RANKING.md`, `switchpath/*`; `scripts/audit-switchpath-challenge.mjs`.
**Interface:** Existing catalog slugs identify entries; direct quote is stored independently of reviewer scores.

- [x] Record James's Ringcount reaction; suggest replacement candidate without removal.
- [x] Baseline tests, phone/desktop captures and independent branching audit.
- [x] Dispatch the requested three reviewers with the same scoped evidence.
- [x] Preserve reports and adjudicate concrete findings.

### Task 2: Controls and spoiler-free sharing

**Files:** Switchpath app, shell, HTML, CSS; new `share-card.mjs` and `tests/share-card.test.mjs`; bundle allowlists and DOM harness.
**Interfaces:** `buildShareResult({game,mode,number,dateKey})` returns a frozen allowlisted snapshot; `openResultShare(api)` renders/exports it. Existing engine actions remain unchanged.

- [x] Write/run failing result tests for perfect/hinted/revealed/practice and answer-data exclusion.
- [x] Implement the result adapter, PNG artwork and browser share/download/copy flow.
- [x] Reproduce UI failures in adapter tests; browser-check fixes for implement hint confirmation, reload-safe dead-end feedback, compact phone controls and single move-announcement region.
- [x] Test all new behavior and bundle integration.

### Task 3: Verify, present and save

**Files:** `scripts/review-switchpath.mjs`, review evidence/report, updated ranking ledger.

- [x] Complete correct, wrong, rewind, hint, reveal, practice and saved-route flows in Chromium/WebKit.
- [x] Obtain a final review of changed source; resolve demonstrated important findings.
- [x] Run catalog tests and offline/build checks appropriate to the changed resources.
- [x] Show the revised game visibly, package all games, commit/push feature branch and verify remote SHA.
- [x] Leave Switchpath's player rating pending for James; no invented rank.
