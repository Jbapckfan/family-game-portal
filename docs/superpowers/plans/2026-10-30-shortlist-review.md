# Shortlist Review Implementation Plan

> Use superpowers:executing-plans task by task in the existing isolated checkout.

**Goal:** Review and improve Shortlist logic, readability, gameplay navigation and spoiler-free sharing.
**Architecture:** Keep pure engine, bank, calendar and save contracts; adapt app/shell/rendering and add a score-only share adapter.
**Tech Stack:** Browser modules, Canvas, Node, Playwright, existing subscription reviewer CLIs.
**Spec:** `docs/game-reviews/shortlist/DESIGN.md`

## Constraints and review focus

No automatic elimination or candidate highlighting, no hint access to the secret, no new scoring/difficulty mode. Guard the single final pick. Preserve all 33 catalog entries and exact saved-game/daily identities. Keep preview to one reused window, at most two tabs. No new paid API, dependencies, public deployment or social sends.

- [x] Record Counterpart as a keeper; keep relative keeper order unknown.
- [x] Baseline59 tests, phone/desktop snapshots and independent 2520-leaf strategy audit.
- [x] Dispatch requested Kimi/Gemini/Opus panel with scoped evidence.
- [x] Reproduce material UI/control issues, implement readable targets and clear scan/evidence navigation.
- [x] Confirm hint consequences, preserve final-pick/pencil/scan semantics and terminal keyboard behavior.
- [x] Add honest frozen sharing, privacy/outcome tests and bundle/harness updates.
- [x] Adjudicate reviews, check final source and full browser flows; test catalog/offline/native resources.
- [x] Reuse visible preview and prepare the complete all-games stage and review handoff; leave James's enjoyment verdict pending.

Delivery uses a feature-branch commit/push with remote SHA verification, then `scripts/package-six-months.py` against the committed source and final verified stage. The generated ZIP receipt records the exact commit and build ID.
