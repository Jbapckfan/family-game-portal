# Counterpart Review Implementation Plan

> Use superpowers:executing-plans task by task in the existing isolated checkout.

**Goal:** Review and improve Counterpart gameplay, UI and social sharing, then present it for James's preference ranking.
**Architecture:** Keep pure engine/bank/calendar stable. Fix app interaction state, add an allowlisted sharing adapter and update bundle/harness allowlists.
**Tech Stack:** Existing browser modules, Canvas, Node, Playwright, subscription reviewer CLIs.
**Spec:** `docs/game-reviews/counterpart/DESIGN.md`

## Constraints and review focus

Preserve all 33 game entries and historical save identities. Check ambiguous-answer allegations against co-board membership. Test saved partial drafts during row auto-advance, invalid/reversed checks, one-time hints, terminal Escape, and frozen result identity after midnight. No paid API, new dependency, social post or public deployment.

- [x] Baseline 66 tests, source/90-analogy audit, phone/desktop screenshots, visible playable preview.
- [x] Dispatch Kimi K3.1 Pro, Gemini 3.8 Flash High and Opus 5.5 with scoped evidence.
- [x] Reproduce draft-overwrite and hint/terminal issues; fix state and keyboard flow.
- [x] Compact phone bank/current row, clear status and hint disclosure.
- [x] Add frozen share result/PNG flow; test privacy, outcomes and bundle inclusion.
- [x] Adjudicate all reviews and preserve reports/receipts; verify final changes.
- [x] Run catalog/bundle/offline/native checks appropriate to changed resources; inspect final visuals.
- [x] Show final Counterpart, stage all games for feature-branch save/package, and leave player preference pending. Git/zip manifests record the final commit and release actions.
