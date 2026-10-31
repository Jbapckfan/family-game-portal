# Tangle individual review implementation plan

Use the established autonomous inline design/TDD/review workflow in this isolated checkout. Morph is now a keeper (“keeper, next”), with no score/relative rank supplied. Eleventh game: Kimi’s Tangle; verdict pending. Hunch follows.

**Goal / scope:** Improve the existing untimed4x4 eight-way word hunt’s clarity, safe drag/tap/keyboard interaction and sharing, verify its complete bank/legacy persistence/continued post-gold play, and present it for James. React19/TypeScript/Vite/Radix, Morph/Cairn style blue/teal/readable typography. Maintain original Kimi authorship. Existing one-tab preview, at most one labelled sample tab; no server/listener, dependencies/downloads, paid route, public deployment, social post or Canon/infrastructure edit.

**Constraints:** Preserve points, medal thresholds, engine/hook semantics,430rawbank, exact12 reviewed-word policy, original/legacy edition restoration, day/practice selectors and storage IDs/schema unless an ordinary-UI defect requires a targeted repair. Gold completes daily once but never locks continued hunting. A clue consumes the one allowance and gives two letters for an unfound4+word, with saved prefix. Label assistance honestly without adding a scoring penalty. Do not pretend the broad vocabulary is human-reviewed.

**Design / code:** Scope `games/tangle/TangleBoard.tsx`, `TanglePage.tsx`, `TangleWinModal.tsx`, `TangleHelpModal.tsx`, new `share-card.ts`/`TangleSharePanel.tsx`, Tangle CSS/icon and focused tests. Teal/blue ordered trace, readable selected/current word and found chips; gold-target progress with explicit thresholds/availablemax; accessible labels and sticky selection controls. One primary pointer per gesture, reject secondary/mismatched pointers, end outside/cancel/stale board without charging; preserve the free preview for Check/Clear. Keep genuine tap/keyboard submits and add semantic assistive click support. Confirm first clue and freeze its board/found identity; cancellation/duplicates/stale state cannot spend it. Remove automatic unearned hidden-gem spoiler. Retain fresh earned celebration only if proven current code already suppresses restore replay. Freeze header date; expire displayed stale streak only in Tangle.

**Sharing:** Snapshot any nonempty ongoing progress or Gold, including continuing aftergold. Frozen Daily#playeddate orPractice, score/max/goldgoal/foundcount/total/misses/clueassistance. Never export grid, words, bestfind, clueprefix, path/order/wordlengthpattern orURL. Native text first; browser portrait/square aggregate PNG, gesture share/cancel, download, truthful copy/manualcaption. No physical/nativeimage certification.

**Baseline:**172package tests and actual keyboard-path Daily gold passed. Independent430distinct D4grids;30688raw /30599reviewed valid paths;9155acceptedwords,maxrecurrence60;28–80words,35–119maxpts,Gold8–18. All scores and gold reachable. Only14boards have supplied-common-list points forGold; this is incomplete-list evidence and an editorial concern, not proof of human unplayability. Do not silently lower medals or rewrite published vocabularies.

**Review focus:** duplicate/secondary/stale drag submissions, outside/cancel/no-score previews, tap/assistive/keyboard and focus behavior; clue consent/reload/legacy edition; progress snapshot identity while score continues; goldthreshold versus max and spoilers; six shared-runtime/offline/native byte parity.

- [x] Record Morph keeper, reuse preview, audit/capture baseline and request actual Kimi/Gemini/Opus reviews.
- [x] Failing pointer/clue tests and pure share outcome/privacy tests; implement scoped safe interaction and share adapter/panel.
- [x] Scope UI/layout/help/results/date/stats; adjudicate baseline reviewers and one final Opus source review. Verify material findings before fixes; ledger minor limitations.
- [x] Typecheck/build/recoverable asset stage/sync; package/catalog suites; actual Chrome/WebKit tap/drag/gold/continued play/clue/restore/legacy/sharedruntime/sharing; offlineworker and unsignediPhone build/byte parity.
- [x] Inspect final visuals, save evidence/ranking pending Tangle feedback, commit/push feature branch/verify remoteSHA/package32daily+bonus.

Existing autonomous go/next authorization covers this inline review/improvement pass. Pointer interaction may change; score rules/banks remain. Prior compiled/iOS directories move to recoverable ignored backups. No additional design approval round is introduced.

Final: Pointer move/up burst reproduced RED→GREEN with synchronous UI path commits. Native activation replaces custom Space handling; clue-found text verified. WebKit context-menu interception reproduced with a no-menu control, then fixed on the grid with RED→GREEN and complete browser coverage. Final184package/899catalog/32focused/42browser/11offline passed. Screen-reader live-region polish remains deferred; no scoring, dictionary, calendar or hook rewrite.
