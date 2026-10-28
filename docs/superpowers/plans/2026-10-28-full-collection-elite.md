# Full collection elite implementation plan

> Use isolated parallel family workers under dispatching-parallel-agents; root implements originals and owns integration. Test behavior changes before implementation. Perform one independent whole-collection review after integration and one bounded test-first Important fix pass. James's “full pass, go” delegates execution.

**Goal:** A deliberate, verifiable quality pass over all 32 daily games and the nine-board bonus.

**Spec:** `docs/superpowers/specs/2026-10-28-full-collection-elite-design.md`

**Architecture:** Retain original engines, shared shells, creator identities, authored banks and persisted formats. Work in disjoint runtime families and integrate once; no global rewrite.

## Global Constraints

- Preserve daily IDs/assignments/scoring, practice separation, saves and creator attribution.
- No publishing, audience change, external review-provider calls, downloads or shared infrastructure changes.
- Root alone changes `ios/Web`, global catalog/export tools and final reports.
- Workers must not dispatch agents; browser processes run serially under root to avoid contention.
- Report each game individually; do not infer full quality from unit-test counts or startup.

## Review Focus

- Interrupted/failed storage must preserve playable state and first terminal results.
- Re-rendered controls and modal closure must retain useful keyboard focus and input values.
- Feedback/assistance must not reveal unseen solutions or change published scoring/difficulty arbitrarily.
- All 33 phone layouts must fit, with usable controls and non-color labels.
- Final generated Kimi runtime, web export and native resource bytes must match their sources.

### Task 1: Kimi six-game quality pass

Own only `packages/kimi-pebbles`, `games/kimi-{cairn,morph,tangle,hunch,circuit,quartet}`, `games/kimi-runtime`, and `docs/reviews/MAKER-Codex__elite-kimi.md`. Inspect and improve all six mechanics/flows, with targeted behavior tests, pinned existing build and per-game evidence/QA recipes. No native sync or common runtime changes. Commit and return exact SHAs.

### Task 2: DeepSeek and Claude twelve-game quality pass

Own only `games/deepseek-*`, `games/claude-*`, and `docs/reviews/MAKER-Codex__elite-deepseek-claude.md`. This worker owns the shared `deepseek-runtime` consumed by the Qwen games too; coordinate any API changes through root, and preserve its API. Inspect all twelve, improve concrete per-game feedback/control/accessibility/resume weaknesses, test real behavior and supply real-control QA recipes. Commit and return exact SHAs.

### Task 3: Qwen six-game quality pass

Own only `games/qwen-*` and `docs/reviews/MAKER-Codex__elite-qwen.md`. Preserve shared `deepseek-runtime` API; do not edit it. Inspect/improve each game, including timed interruption behavior, memory study truthfulness, phone controls and duplicate-letter input. Meaningful regressions and per-game real-control QA recipes. Commit and return exact SHAs.

### Task 4: Original eight and bonus quality pass

Root owns `games/{ringcount,switchpath,counterpart,shortlist,second-sense,sideways,tradeoff,inbetween,nested-tic-tac-toe}` and shared original-shell copies. Inspect each, use real UI to identify frictions, fix and test. Resolve the prior closed-board recent-square marker issue as part of the bonus's own polish. Preserve published puzzles and records.

### Task 5: Full integration and acceptance

Root reads every worker diff/report, resolves interface risks, cherry-picks verified commits, synchronizes native runtime, and runs all-game phone/browser QA with a 33-row evidence ledger. Add a reusable browser harness for every actual game, preserving source-assisted qualifications. Run full suites, native model/hash/build checks, actual offline/update checks, one independent final review and one bounded Important fix wave. Inspect final visible previews and package exact committed bytes with source SHA and checksum. Preserve all worktrees and existing services; do not publish.
