# Ringcount Review Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver Ringcount's first complete gameplay/UI/sharing pass and a durable preference ledger for every game.

**Architecture:** Keep the existing engine and calendar intact. Add a Ringcount-only result-card module and a small shell adapter hook; all other games remain on their existing shells. Track reviews separately from actual player preferences.

**Tech Stack:** Browser modules, Canvas PNG, Node tests, Playwright, existing subscription reviewer CLIs.

**Spec:** `docs/game-reviews/ringcount/DESIGN.md`

## Global Constraints

- No timer, new currency, difficulty claims or social leaderboard.
- Preserve daily selection, 210 boards, scoring, historical saves and all 33 game entries.
- No new spending, downloads, public deployment or external social posts.
- Share only date/mode/result and actual checks/hints. No answer geometry or private URL.
- Reviewer scores are predictions; James's enjoyment rating and rank remain unset until he supplies evidence.

## Review Focus

- Revealed and hinted results must never appear unassisted/perfect.
- Changing mode or receiving a storage event while generating a card must not attach the wrong result.
- Share cancellation must not copy, download or report success.
- Blocked clipboard and unavailable Web Share must leave a usable manual caption and PNG download.
- Narrow phone, reduced motion, keyboard and non-color cues must remain usable.

### Task 1: Evidence and review ledger

**Files:** `docs/game-reviews/{README.md,ranking.json}`, `docs/game-reviews/ringcount/*`
**Interfaces:** Catalog `GAMES` + `BONUS_GAMES` supply unique slugs/names; ledger stores nullable `james` fields and separate `reviews`.

- [x] Establish isolated feature branch and baseline tests.
- [x] Capture baseline desktop/phone and send identical scoped evidence to Kimi, Opus and Gemini.
- [x] Initialize all 33 ledger entries with no invented ratings. Validate unique slugs and exact catalog membership.
- [x] Preserve model reviews, exact identities and adjudication.

### Task 2: Result image and share flow

**Files:** Create `games/ringcount/share-card.mjs`, `games/ringcount/tests/share-card.test.mjs`; modify Ringcount `app.mjs`, `shell.mjs`, `styles.css` and bundle allowlist/tests.
**Interfaces:** `buildShareResult({game,mode,number,dateKey})` produces an allowlisted immutable result; `openResultShare(api)` opens a preview and prepares a PNG from that snapshot.

- [x] Add failing tests for solved/hinted/revealed/practice/date identity and answer-data exclusion.
- [x] Implement pure result data, Canvas PNG, square/portrait preview, image-share/download/caption/manual fallback.
- [x] Add browser checks for complete result flow, PNG dimensions, cancellation, and snapshot identity.
- [x] Run Ringcount suite and bundle staging tests. Expected: zero failures.

### Task 3: Gameplay clarity, final review and playable build

**Files:** Ringcount `app.mjs`, `index.html`, `styles.css`; browser test script and review report.
**Interfaces:** Keep `engine.toggleCut`, `useHint`, `checkBoard` unchanged; accessible arc focus is visual only.

- [x] Apply verified review recommendations, pin behavioral changes with failing browser checks first.
- [x] Make hint use explicit; compact phone header/board controls; link totals and number groups with text and focus.
- [x] Play actual correct, wrong, hinted, revealed and practice rounds in Chromium/WebKit; test keyboard, narrow and reduced-motion layouts.
- [x] Have a requested reviewer inspect the final change and test evidence, resolve demonstrated important findings.
- [x] Sync bundled web resources, stage all games, verify current build, show Ringcount visibly and preserve original all-games access.
- [x] Update ledger, commit and push feature branch; verify remote SHA. Ask James for his first enjoyment reaction.

Execution complete October 30, 2026; see `docs/game-reviews/ringcount/REPORT.md`. James’s preference rating remains pending and is not implied by implementation completion.
