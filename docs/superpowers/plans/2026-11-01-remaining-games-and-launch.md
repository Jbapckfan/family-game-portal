# Remaining games and launch preparation implementation plan

> **For agentic workers:** Use executing-plans for root work and the explicitly requested isolated agent assignments below. Steps use checkboxes to retain progress across sessions.

**Goal:** Improve every remaining game's fairness, clarity and presentation, preserve James's existing games and ranking, prepare a concrete commercial launch, and supply ten separate replacement candidates for human playtesting.

**Architecture:** Keep published puzzle IDs and progress contracts stable. Independent agents work in separate checkouts; root reviews and integrates source changes, then rebuilds the shared web/native payload once. Candidate games remain outside the production catalog. Launch materials remain drafts until actual distribution, privacy, commercial and device requirements are satisfied.

**Tech stack:** Existing browser modules, React/TypeScript Kimi package, bundled SwiftUI/WKWebView iOS app, existing Node/Python/Playwright tools. No new services or paid dependencies.

**Spec:** James's November 1 request to finish remaining games before individual review, verify acceptable words and six months of fresh puzzles, prepare website/app monetization and marketing, and delegate ten fun/shareable candidates. His October review preferences remain authoritative.

## Global constraints

- Main collection remains 32 daily games plus the existing bonus pending James's replacement decisions.
- James supplies enjoyment rankings; model suggestions never become his ratings.
- Cool blue/teal presentation, readable words, no brown/purple, obvious next action and useful feedback.
- Preserve authored puzzle layouts, historical IDs, valid progress and terminal-result semantics. Document any dictionary edition migration.
- Open-word validation covers the pinned source union subject to each game's actual rules. Fixed clues/categories retain their semantic constraints. Do not advertise exact commercial-dictionary equivalence.
- Reuse one owned visible browser window and no more than two tabs. Headless QA uses separate storage.
- No public launch, account creation, paid services, ad spend, DNS changes or production ad/purchase activation in preparation work.

## Review focus

- Ordinary legal words missing from small prepared lists: independent source-coverage checks and regression submissions.
- Dictionary expansion changing paths, target difficulty or saved replay: retain original witnesses, compare distance and replay legacy/new saves.
- Distinct record IDs disguising repeated challenges: canonical content signatures across all banks and the next 182 Central dates.
- Ambiguous fixed clues/categories: precise labels and explicit unresolved editorial cases, without claiming automated semantic perfection.
- Small screens and assisted/revealed results: visible readable state, honest spoiler-free sharing, no double-counting after restore.

## Tasks

- [x] Delegate ten candidates into `MAKER-codex__ten-game-candidates-20261101`; no production edits. Require ten playable mechanisms, deterministic challenges, real solve checks, sharing and a selection report.
- [x] Delegate DeepSeek/Qwen twelve-game audit into `MAKER-codex__remaining-dq-20261101`; own source/tests only.
- [x] Delegate Claude six plus Quartet audit into `MAKER-codex__remaining-cq-20261101`; no shared build output.
- [x] Fix Circuit full-source coverage; independently check all 286 rings, save restoration and real MORN/NICE submission. Keep targets honest.
- [x] Add four arc bands and explicit letter membership. After James's spacing feedback, make the sections join with consistent narrow dividers. Verify geometry, phone layout and real tap input.
- [x] Review and integrate each agent's source patch; preserve both failed and successful verification evidence and static review findings.
- [x] Rebuild Kimi runtime, sync native web payload with recovery copy, stage a fresh portable website and verify hashes/file sets.
- [x] Run affected engine suites, whole-catalog checks, six-month freshness checks, Chrome/WebKit flows and offline boot/restore checks. Record physical-device and editorial limits separately.
- [x] Obtain actual Kimi, Gemini and Opus static reviews of the final scoped changes using existing subscription CLIs; adjudicate concrete findings. Free DeepSeek only if an already authorized working route is available; never substitute a model and label it DeepSeek.
- [x] Complete `docs/launch/2026-11-01/` with a current monetization comparison, editable economics, store copy, screenshot briefs, social/editorial calendar, support/privacy preparation and release gates.
- [x] Open a finished launch preview in the owned browser after review, without disturbing James's active Circuit progress. Candidate gallery uses the second tab only when ready.
- [x] Update ranking with James's exact Circuit feedback with its explicit keeper verdict. Preserve candidate evaluations outside the production ranking.
- [ ] Commit/push the feature branch, verify remote SHA, package verified build and receipts, then report concrete artifacts and remaining release decisions.

## Verification commands

Use `npm test` and `npx tsc -b` in `packages/kimi-pebbles`; the existing root `node --test` suites for game banks/calendars/sharing; the checked-in runtime sync/staging tools; isolated Chrome/WebKit harnesses; generator `--check` modes for corpus artifacts. Run the exact appropriate subset before integration and one final affected/full pass after integration. Record exit codes and computed totals, rather than pre-filling expected counts.
