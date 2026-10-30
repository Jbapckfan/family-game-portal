# Inbetween review implementation plan

> Use superpowers:executing-plans inline in the existing isolated review checkout, following the established workflow.

**Goal:** Verify and improve Inbetween's gameplay, readable UI and spoiler-free sharing, then show James the result for his preference verdict.
**Architecture:** Keep the pure engine and immutable bank. Correct standalone app action/persistence boundaries and optional paid-advice UI snapshots; add an aggregate-only share adapter using the established pattern.
**Tech stack:** Browser modules/Canvas, Node, existing JSDOM and Chromium/task-local WebKit; existing subscription review CLIs.
**Spec:** `docs/game-reviews/inbetween/DESIGN.md`

Constraints: no new rules/scoring/bank/calendar/schema, dependencies, paid APIs, social posts, deployment, main push or destructive cleanup. Reuse one preview window, at most two task tabs. No James verdict or relative ranking inferred.

Review focus: free previews/clears and wrong-fit attempt count; nudge approval/reload/repeat; stale-placement/hint success side effects and terminal repair; storage failure/recovery; useful keyboard/dialog focus and gap meaning at320px; actual PNG privacy/midnight/cancel/manual fallback.

- [x] Baseline suite, insertion/subset audit and scoped Kimi/Gemini/Opus requests.
- [x] Reproduce app failures, implement boundary/hint/focus fixes and readable controls.
- [x] Add failing share privacy/outcome tests, implement adapter and bundle/harness integration.
- [x] Adjudicate reviews and obtain final source review; verify material findings.
- [x] Run final focused/catalog/browser/offline and unsigned-native/resource checks, inspect screenshots and reuse visible preview.
- [x] Record reports/evidence and leave James's preference verdict pending.

After implementation: commit/push the existing feature branch, verify its remote SHA and package the final all-games stage. Preserve the reviewer receipts and known limits.

Rulings: retain paid advice after a wrong placement while placements are unchanged; guard the complete records object whenever any daily game key is dirty; scroll focused pair/gap controls into view. Final Opus Important findings were reproduced and corrected. Literal simultaneous-terminal atomicity remains outside this schema-preserving pass.
