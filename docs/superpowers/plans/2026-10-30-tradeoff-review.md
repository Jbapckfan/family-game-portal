# Tradeoff Review Implementation Plan

> Use superpowers:executing-plans in the existing isolated checkout with the established inline method.

**Goal:** Finish Tradeoff's logic/UI/sharing review and save James's keeper verdict.
**Architecture:** Preserve the pure engine and published bank. Repair the standalone app's save-boundary result handling and view state; add an aggregate-only share adapter.
**Tech Stack:** Browser modules, Canvas, Node, existing JSDOM/Chromium/task-local WebKit and subscription reviewer CLIs.
**Spec:** `docs/game-reviews/tradeoff/DESIGN.md`

## Constraints and review focus

No new difficulty mode, bank rewrite, scoring change or schema migration. All33catalog entries retained. No paid APIs/product dependencies/deployment/social sends; reuse one preview window/two tabs maximum.

- Confirmed hint cancel/approval and same-board paid-advice restoration never spend an extra hint.
- Real bad trades, row locking, same-row recovery and Undo keep counters/keyboard truthful.
- Newer saved progress cancels stale actions and their success feedback; terminal records and completed daily state survive reconciliation.
- Readable clues/44px controls at320–1440px; focus survives newly locked rows and dialog close.
- Daily/Practice frozen sharing, real PNGs, midnight identity, cancellation/manual-copy exclude every puzzle detail.

- [x] Baseline tests/screenshots and full cycle/content audit; dispatch scoped Kimi/Gemini/Opus panel.
- [x] Record James's keeper verdict and ease concern.
- [x] Reproduce app save/hint issues in focused tests; fix adoption, records, confirmation/view state and readable controls.
- [x] Add failing share privacy/outcome tests, implement adapter and bundle/harness integration.
- [x] Adjudicate panel; obtain final source review, verify minor findings and document the open Important simultaneous-terminal concurrency concern.
- [x] Run targeted/catalog and real browser/offline/native resource checks; inspect final images.
- [x] Reuse preview and prepare the complete stage/review handoff.

Save sequence after this implementation record: commit to the existing feature branch, push it, verify the remote SHA, then package `dist/tradeoff-review-20261030-final-v2/web` with that commit. Git and the ZIP receipt record the resulting revision; no main-branch push or deployment.
