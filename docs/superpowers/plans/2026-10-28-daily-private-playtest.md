# Daily private playtest implementation plan

> **For agentic workers:** Use superpowers:executing-plans. The delegated request authorizes local implementation and testing; no publication or audience changes.

**Goal:** Give friends a clear first puzzle, trustworthy offline preparation and a useful feedback loop in the existing product.

**Architecture:** Retain the paper/ink home and each game's established identity. Add a small home playtest module; keep all progress read-only. Generate a content-addressed offline worker only in the standalone export, so the source portal and native wrappers acquire no worker or new storage namespace.

**Tech Stack:** Existing HTML/CSS/ES modules, Node tests, Cache API/service worker, browser automation. No new dependencies.

**Spec:** The October 28 delegation in this task: improve the actual product and tester onboarding, preserve data and unrelated games, verify featured gameplay and at least 30 days, prepare distribution without deploying.

## Global constraints

- Preserve 32 games, puzzle assignments, app identities, saves, scores and creator attribution.
- No public deployment, new paid services, altered sharing permissions, external messages, phone installs or benchmark interference.
- No invented human editorial review or content-rights clearance.
- Existing isolated clone is clean at 64c0d715d974b0e3830306f9cced765735de2482; continue on codex/daily-private-playtest-2026-10-28.

## Review focus

- Offline preparation interrupted or denied storage: never claim readiness; keep any previously active cache usable.
- New content while old tabs remain open: no forced activation or mixed game assets; preserve all localStorage.
- Reports after date rollover or containing hostile note text: current date, allowlisted game/status metadata and text-only rendering.
- Standalone root and directory-prefix links: remain inside collection; no navigation to an unrelated/public origin.
- First visit at 320px, keyboard, reduced motion: play immediately without a mandatory modal; full collection remains available.

## Tasks

- [x] 1. RED→GREEN: add optional first-visit guidance and prepare/copy playtest notes. Test real home interaction, save-write failure, hostile text, allowlisted status and current Central date. Files: games/daily/{index.html,app.mjs,styles.css,playtest.mjs,playtest.test.mjs}.
- [x] 2. RED→GREEN: standalone-only content-addressed offline worker and readiness UI. Test complete cache, byte mismatch, interrupted install, scope/prefix routing, unrelated URLs and update lifecycle. Files: games/daily/offline-worker.js, scripts/stage-site.mjs, scripts/offline-worker.test.mjs, scripts/stage-site.test.mjs.
- [x] 3. Exercise featured games through actual controls, solve with source-assisted QA inputs, reload unfinished/finished games, check all entries and both home/share regressions. Run suites serially with single low-resource browser and no Simulator/GPU-heavy build. Record any unavailable infrastructure.
- [x] 4. Refresh the 30-day scheduling evidence and private test guide; inspect existing Site/NAS read-only; prepare a fresh standalone export and distribution decision. One bounded final review/fix pass, local commit, screenshots and exact test report.

## Progress and decisions

- Baseline: clean checkout; six home/selection/share tests passed. 32 selectors executed for 2026-10-28 through 2026-11-26 (960 selections, 30 distinct IDs each).
- Existing Site metadata: active, owner role, custom audience with one allowed user, zero groups/external visitors; invitations supported. Unauthenticated HTTP returns 401. No audience change.
- Hosting limits: both documented NAS endpoints time out; Mini registry DNS fails outside the sandbox too. New port allocation correctly fails closed. Do not bypass it or reuse another project's listener.
- Scope decision: no redesign or new content expansion. Source-assisted UI wins establish mechanics and persistence, not blind difficulty or human editorial approval.

- Task 1 complete: real home guide/form, metadata allowlist and failed clipboard fallback tests RED→GREEN; no save writes.
- Task 2 complete: byte-verified worker, interrupted install, scope/prefix and cache checks RED→GREEN. Final review found two Important cache-loss/readiness issues, both fixed in one RED→GREEN pass. No Critical or deferred Minor findings.
- Task 3 complete: main JavaScript suite 494/494, Kimi 56/56; both browser engines won all four featured games through source-assisted controls and preserved unfinished/finished saves. Both engines passed rollover/share/write-failure/320px/reduced-motion regressions. Chromium real worker passed ten lifecycle/cache checks, including all32 populated offline boards with every test route removed.
- Task 4 complete: actual 32 selectors ×30 days; Swift Foundation models compiled/executed for parity; native264-file bundle parity and project validation passed. Fresh standalone298-file export prepared. Private screenshots saved; local commit/package recorded in delivery.
- Ruling: retain existing game designs and content — the observed blockers were onboarding, feedback, offline readiness and prefix navigation. Cost if wrong: the human cohort may still identify nonfeatured UI/difficulty work.
- Ruling: new first-visit and prepared-note tools are web-only; native keeps existing result sharing and manual beta report — avoid duplicating UI before a first cohort. Cost if wrong: native testers need the guide template for detailed feedback.
- Ruling: use real routed HTTPS browser origins while the mandatory port authority is unavailable; do not open a competing listener. The synthetic worker update uses a query version because identical-script update fetches bypass this harness route. Cost if wrong: real-host MIME, authentication and update delivery remain an explicit deployment gate.
- Ruling: no Simulator or full native build in this pass while the benchmark waits. Actual Swift core parity compiles without a Simulator, and bundled JavaScript matches source. Cost if wrong: new native wrapping/device issues remain untested until the device acceptance pass.
- Verification limit: five existing socket-serving HTTP-verifier cases could not initialize because binding was denied; their separate static-inventory case passed. No listener was started and no bypass was attempted.
