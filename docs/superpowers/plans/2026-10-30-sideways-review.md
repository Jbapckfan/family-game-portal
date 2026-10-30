# Sideways Review Implementation Plan

> Use superpowers:executing-plans in the existing isolated checkout; retain the established inline execution method.

**Goal:** Complete Sideways's gameplay/UI/sharing review and prepare the next playtest.
**Architecture:** Retain pure engine/content/save contracts. Refine app/CSS/focus and add a score-only share adapter using the existing export pattern.
**Tech Stack:** Browser modules, Canvas, Node, existing Chromium/task-local WebKit and subscription reviewer CLIs.
**Spec:** `docs/game-reviews/sideways/DESIGN.md`

## Constraints and review focus

No automatic answer highlighting, permanent locks, new mode or scoring changes. All 33 entries retained; one window/two task tabs maximum. No paid API, product dependencies, deployment or social sends.

- Feedback disappears on a changed arrangement and returns only for the last checked layout without another charge.
- Nudge confirmation/cancellation, undo and reload preserve moves/checks/hints accurately; alignment alone never wins.
- Followed-column colour is not correctness; letter and clue text stay readable at 320–1440px.
- Pointer/arrow keyboard focus survives redraws and disabled controls; terminal actions are inert.
- Frozen Daily/Practice share identity, real PNGs, truthful counters and cancel/manual-copy fallbacks exclude all puzzle data.

- [x] Record Second Sense as a keeper; baseline tests, independent exhaustive orientation audit and screenshots.
- [x] Dispatch scoped Kimi/Gemini/Opus panel.
- [x] Add failing share privacy/outcome tests and nudge browser regression, then implement adapter and UI changes.
- [x] Verify panel findings; preserve exact check/feedback/nudge/undo semantics and obtain updated source review.
- [x] Run actual Chromium/WebKit flows, catalog suite, final offline lifecycle and unsigned native resource checks; inspect final visuals.
- [x] Reuse preview and prepare the all-games stage/review handoff, recording James's replacement-candidate verdict.

Commit/push the feature branch and verify remote SHA, then package the committed source and final byte-verified stage. Record exact QA counts/build ID in evidence.
