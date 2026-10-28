# Original word-game product iteration

> Use superpowers:executing-plans with test-driven changes and one bounded final code review. Local development/testing is explicitly authorized; publishing, audience changes, paid services and tester contact are not.

**Goal:** Make the original word games easier to learn, more readable on a phone and more satisfying to revisit; add the separately requested nine-board local-AI tic-tac-toe bonus without changing daily records.

**Base:** `278cf35c5ccd71c5ee71150d74abceee1e693d6d`, preserved; new branch `codex/daily-product-2026-10-28` in the existing isolated clone. No unrelated user changes were present.

**Design:** Retain the established paper/ink system and each game's palette, emblem and board mechanic. Focus the home on Counterpart, Shortlist, Second Sense and Sideways. Keep historical Today’s Three selections before October28; the word edition starts October28 without changing any game’s puzzle assignment. Both web and SwiftUI homes show a useful next daily, favoring unfinished play, and a truthful completed set. Broader32-game records remain available without being the first goal. No new identity, mandatory account, automatic analytics or cloud sync.

**Game changes:** A skippable interactive rule example inside existing Help for four word games; no daily save or score writes. Shortlist puts candidate words before the scan controls, replaces tiny pencil controls with an explicit pencil mode and removes unused-scan coaching after completion. Counterpart gives precise reversed-pair feedback and keeps the next active row in view. Second Sense distinguishes a submitted word fitting only the chosen noun/verb or a correct clue pair with the wrong spelling, without naming unseen answers. Sideways adds a chosen-column reading aid with shape/text cues, not answer highlighting. Improve real mobile type/target sizes within existing layouts.

**Bonus:** Generic Tic-Tac-Toe / Nine boards, local deterministic Casual/Tactical AI, routing/win/draw rules per the user. Separate match storage, no daily progress or prepared-puzzle claims. Overview plus selected mini-board keeps touch controls readable. All32 daily games remain accessible; native catalog and runtime export include the bonus separately.

## Tasks and verification

- [x] 1. Daily word edition: RED→GREEN pure curation/history/next-action tests, mirrored Swift models and UI; retain32 daily identities and add separate bonus descriptor. Verify cross-surface parity, old records, all terminal outcomes and unavailable statuses.
- [x] 2. Four original word games: RED→GREEN judged-feedback tests, real Help/pencil/column/mobile-flow regressions; shared shell changes stay identical across six original shell copies and native resources. Preserve records, hints and practice separation.
- [x] 3. Independent bonus worker owns only games/nested-tic-tac-toe: pure engine/AI/state/app tests. Root integrates strict export, native catalog/bridge and menu. Test all routing/draw/win/legal AI, cancellation/restart/save failures,33 entries offline while only32 count daily.
- [x] 4. Validate thirty-day original word content structurally/with existing solvers; record repetition and editorial limits. Full JS/Kimi tests, real Chromium/WebKit flows, worker integrity/offline/update regressions; actual native build/tests as resources permit without interrupting the benchmark/other processes.
- [x] 5. One final independent code review, bounded Important fix pass, screenshots, fresh package and local commit. No claim of NYT parity, human editorial approval or content rights clearance.

## Review focus

- Tutorials, pencil/column aids and wrong-answer explanations must not mutate wins/hints/saves or expose an unchosen solution.
- Old saves, historical selections and reloaded terminal states must retain scores and exact daily credit.
- Web/native next-action labels must handle revealed/lost/perfect/incomplete data and date rollback without impossible goals.
- Bonus matches must never inflate daily counts, streaks, content inventory or native records; stale AI work cannot affect a new match.
- Phone layout, native WebView, keyboard, screen reader names and reduced motion must preserve usable controls and correct state.

## Evidence and rulings

- Independent UI-only probe, no hints/source answers: Shortlist solved in two scans; Counterpart reached3/5 before action cap. Verified frictions: candidates below scan controls, unused scan copy after completion, next Counterpart row below completed explanations. SCAB/WOUND wording flagged for human review, not silently changed. Probe browser closed before root browser work.
- Ruling: the user asked for ownership of local implementation; retain the existing art direction and proceed without another design approval cycle. Cost if wrong: visual preferences remain correctable in the local candidate.
- Ruling: fixed Help exercises are onboarding, not new scoring modes; no save schema or authored puzzle bank changes. Cost if wrong: a cohort may still need longer learning support.

Completed verification:538 JS tests;56 pinned Kimi tests;33 final native XCTest passes; unsigned iPhone Release build;270 exact source/runtime hashes in both native products; four word-game UI completions in each browser; two full AI matches;33 cold offline launches. One bounded final reviewer found no Critical/Important issues; both Minor findings fixed test-first/with browser regressions. See docs/reviews/2026-10-28-daily-product.md. Simulator released and shut down; no deployment or audience changes.
