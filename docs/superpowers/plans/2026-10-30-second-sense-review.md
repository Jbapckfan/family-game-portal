# Second Sense Review Implementation Plan

> Use superpowers:executing-plans in the existing isolated checkout; retain the established inline execution method.

**Goal:** Complete Second Sense's gameplay/UI/sharing review and prepare the next playtest.
**Architecture:** Preserve pure engine/content/save contracts. Refine app controls and CSS; add the existing score-only share adapter pattern.
**Tech Stack:** Browser modules, Canvas, Node, existing Playwright browsers and subscription reviewer CLIs.
**Spec:** `docs/game-reviews/second-sense/DESIGN.md`

## Global constraints and review focus

Keep published banks/calendar/save IDs/scoring, no new bank or automatic solve. All 33 catalog entries retained. One reused preview window, two tabs maximum; no paid APIs, deployment, dependencies or social sends.

- Drafts survive free clue changes/reload and cannot leak solved/terminal selections.
- Scored hints are confirmed, cancelled hints are inert and repeated hints never double count.
- Long definitions stay readable at 320–1440px, with reachable input/check and useful focus after a correct check.
- Results distinguish perfect goal, assistance, extra checks and reveal.
- Sharing retains the played date across midnight, excludes answers/clues and supports actual PNG/cancel/manual-copy paths.

- [x] Record Shortlist as a keeper; baseline tests, meaning/co-board audit and phone/desktop screenshots.
- [x] Dispatch requested scoped Kimi/Gemini/Opus reviews.
- [x] Add a failing score-only sharing/outcome regression, then implement adapter and bundle/harness integration.
- [x] Reproduce relevant UI issues; improve type/palette, clue-to-input flow, hint safety and result status.
- [x] Adjudicate the panel, verify material semantic claims and obtain updated source review.
- [x] Run real Chromium/WebKit flows, catalog suite, offline lifecycle and unsigned native resource checks; inspect images.
- [x] Reuse preview and prepare complete staged build/review handoff; leave James's preference pending.

Save with feature commit/push and remote SHA verification, then package committed source with the final byte-verified stage. Capture exact counts/build ID in the evidence summary.
