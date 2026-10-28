# Alford Daily continuity follow-up · Codex

Local candidate based on today's preserved `b8336ac667d40b27626ef5c7cb14bd9bdba3bb7f` word-edition/nine-board build. Worktree: `/Users/jamesalford/Projects/MAKER-codex__alford-daily-continuity`; branch: `codex/daily-continuity-2026-10-28`. The delivery ZIP records the final source commit separately.

## What improved

- All six original shared-shell games now check their accepted persisted snapshot before a move or practice reset can write. A window with delayed storage events adopts the newer saved board, clears its obsolete selections, explains what happened and lets the player repeat the action. It cannot turn an unseen unfinished daily into a stale finished result.
- Failed reads never establish that a save is empty. This includes a single intermittent failure followed by working reads. The current action remains in memory; later verified storage access can recover. Existing quota fallback, first-finished daily precedence, scores and version-1 saves remain.
- Nine-board play describes the latest human/AI move by board and square, marks the overview and offers **Inspect last move** and **Back to your move**. Inspection changes no match save and moves keyboard focus into the board it shows. Existing history supplies the feedback after reload. A new match clears it. Small overview rows now retain equal geometry.

All 32 daily games, today's authored content/rules/assignments, separate bonus credit, creator labels and paper/ink design remain. No dependency/model download, new account, analytics, commerce, deployment or audience change was introduced.

## Fresh verification

Evidence: `output/continuity-20261028/` (ignored local files).

| Check | Verified result |
| --- | --- |
| Full daily JavaScript suite | **582 passed, 0 failed**, 64 files; `full-js-reviewed.log` |
| Focused real-shell regressions | **86 passed**, including missed events, dirty memory, practice resets, blocked/intermittent reads, recovery, terminal precedence and Stats/practice-picker bypasses |
| Bonus pure engine/AI/controller suite | **41 passed**; `bonus-unit-final.log` |
| Focused actual Chromium and WebKit | Both passed delayed-tab protection after opening Stats, continued word play/reload, actor/location feedback, inspection without save mutation, forced-board return, keyboard focus, version-1 restore, 320px bounds/44px controls and restart; `browser-reviewed.log` |
| Four featured word-game flows | **8 passing UI flows** across Chromium/WebKit, including rules, existing help/input controls, real play and reload; `word-browser-reviewed.log` |
| Complete actual AI matches | **2 matches**, one per browser, **22 legal moves each**, plus routing/input/reload/restart/share/daily-isolation checks; `bonus-browser.log` |
| Actual Chromium offline/update lifecycle | **11 passed checks**, including all 32 daily documents plus bonus launching offline, human/AI move and restore, exact-byte cache repair, pending update and preserved saves; `offline-browser-reviewed.log` |
| Web/native models | Actual Swift Foundation models compiled/executed: 32 catalog entries, featured four, 30 daily selections, Central/DST/rollback and spoiler-free summaries; no Simulator |
| Runtime parity | **270 native runtime files**, exact SHA-256 and file-set parity against source and the built unsigned app; `unsigned-bundle-parity-reviewed.json` |
| Native build | Fresh generic iPhone Release **BUILD SUCCEEDED**, unsigned; `unsigned-build-reviewed.log` |
| Native structure | 24 Swift files, two targets, two schemes, 33 XCTest methods and 270 resources structurally valid; these are inventory counts, not a fresh Simulator XCTest result |
| Standalone export | **304 runtime files**, only the daily collection and bonus; the ZIP includes verification/readme material outside `web/` |
| Formatting | `git diff --check` passed |

Final phone/desktop Chromium screenshots rendered and were visually inspected. The final desktop image was also opened in Preview and its visible window/screenshot verified. These captures are automated local game positions, not a physical-device playtest.

## Independent review and bounded fix pass

One independent same-model reviewer read the committed change locally; no source was sent to external Kimi/Claude review services. It found no Critical issues and one Important save-boundary bypass: generic inspection reads in Statistics and the practice picker acknowledged newer bytes without loading them into the active game. Eight regressions (two per featured game) failed before the fix. Only actual board loads now acknowledge those snapshots; all eight and the full 582-test suite passed. The actual two-browser regression also opens Stats before attempting its stale move. No recursive review was requested.

**Deferred minor:** A claimed/drawn-board overlay can obscure the latest-square outline in the overview, especially under forced colors. The board-level marker, written actor/location summary and enlarged inspected square remain available. This is recorded as a minor visual follow-up, not a rule/save defect.

## Decisions and remaining limits

- Retain localStorage and the existing save schema. The guard protects sequential stale actions; literally simultaneous writers are not an atomic transaction. The cost of retaining this architecture is a narrow simultaneous-write race; cloud sync/atomic storage was outside this local polish pass.
- Hardware behavior remains unverified: no physical iPhone/iPad installation, human VoiceOver/large-text acceptance or full native touch match was performed. Browser/WebKit coverage and a compiled unsigned app do not certify hardware behavior.
- The reviewer performed static inspection. Execution evidence above was produced and checked by the implementing agent; it is not independently rerun by that reviewer.
- The existing local-only distribution scope remains: no Site/NAS update, GitHub push, friend invitation or public access change. This branch and package preserve a reviewable candidate. Human puzzle/editorial/content-rights gates from today's product report remain unresolved.

## Setup recoveries retained in evidence

The new worktree initially lacked the ignored jsdom dependency path: 532 tests passed and two files failed to load it. Pointing `NODE_PATH` at the existing pinned package tree resolved both without downloading anything. The initial sandboxed browser launch and native Swift macro process were denied by OS sandboxing; approved isolated browser/build invocations then succeeded. This is distinct from an automatic approval-review rejection; none occurred in this pass.

Initial failing save tests, terminal-precedence and intermittent-read tests, the absent last-move UI regression, keyboard-focus regression, and review-bypass regressions are kept alongside their passing results. No existing game/browser/service or benchmark was stopped. No local listening server was started or borrowed.
