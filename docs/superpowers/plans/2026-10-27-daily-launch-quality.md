# Alford Daily Launch Quality Implementation Plan

> Execute inline with test-driven changes and one bounded independent review. Implementation is already approved by James; no new approval gate.

**Goal:** Give the independent Daily collection a manageable daily ritual and a curated entry point without hiding any of its 32 games.
**Architecture:** Pure catalog-based selection and share summaries drive the existing web home and SwiftUI home. Date selection stays on America/Chicago and the existing 2026-10-20 epoch. No new progress, reward, or purchase writes.
**Tech stack:** Existing vanilla module home, 32 bundled game runtimes, SwiftUI/WKWebView wrapper, Node tests and XCTest.
**Spec:** Parent delegation and acceptance details, 2026-10-27; narrowed resume scope excludes Lasers.

## Global constraints
- Base db8c554 retains the newer documentation-only investigation. Branch codex/daily-launch-quality-2026-10-27.
- Do not modify the shared portal index or Lasers. Daily remains a standalone staged export and native application.
- Keep all 32 identities, scores, saves, offline resources, Central dates, practice and existing disabled commerce.
- Four featured games: Ringcount, Switchpath, Counterpart, Shortlist. Today’s Three rotates three distinct available games through this pool; if a bundled game is absent, fill from remaining available catalog entries.
- Sharing contains only date, game names and allowlisted result labels. Cancellation never writes progress.
- Audit the opening 30 Central dates (2026-10-20 through 2026-11-18): execute all 32 selectors, run content invariants, inspect featured word content and report repetition/ambiguity. Separate machine verification, editorial assessment, human playtesting and legal permission.

## Review focus
- Midnight/DST/clock rollback and reload select the same daily set for a date, with web/native parity and no duplicate credit.
- Creator filtering never empties Today’s Three or featured cards; the collection keeps all 32 games accessible.
- Slow refresh and sharing at rollover cannot publish a stale date or solution data.
- Existing terminal saves and blocked writes remain unchanged by home selection and canceled sharing.
- Native offline navigation, Dynamic Type, small screens, keyboard and reduced motion remain usable.

### Task 1: Pure curation and safe sharing
- [x] Add failing Node tests for four featured games, distinct/available rotating triples, epoch/DST/rollback fixtures, and allowlisted share text that ignores answers, grids and arbitrary status strings.
- [x] Add catalog selection helpers and share builder without changing game engines, save keys or daily selectors. Mirror those helpers inside existing Swift catalog/calendar files; add XCTest fixtures before implementation.

### Task 2: Web and native home
- [x] Add failing real-DOM/browser tests for three/shelf counts, creator filtering, all-32 access, shared status refresh, cancellation, blocked saves and rollover.
- [x] Add a compact Today’s Three list, four featured cards, and explicit collection navigation to the existing home style. Update duplicate status badges consistently. Add home sharing with a manual-copy fallback and native ShareLink. Preserve independent export behavior.

### Task 3: Editorial and release verification
- [x] Audit the actual opening-month selectors/content; save structured evidence and a concise quality/provenance assessment. No invented clearance or content expansion.
- [x] Run all game and integration tests, Kimi build/test, bundle/staging checks, full unsigned native tests/build, real browser flows including cold offline bundled runtime, and screenshot inspection.
- [x] One independent reviewer; one bounded fix pass. Save release checklist, local commit and requested private screenshot deliverables only.

## Ledger
- Reconciled clean Daily clone at db8c554; no newer local gameplay changes. Chroma has its own branch and review. Lasers belongs to recovery task 01a17daa-c2bf-7387-8e4e-128607eee031 and is excluded.
- No new reward subsystem is needed. Selection and share functions are read-only views of existing date-keyed terminal results.

- Bounded independent review: two Important rollover findings, no Critical/minor findings. Web late share/clipboard rejection is guarded by captured Central date and request generation; native share payload is built at button activation. Both failures reproduced before fixes (JSDOM integration and Swift/XCTest fixture). No second review requested.

- Final native verification:32/32 tests, including all32 bundled runtimes with HTTP(S) blocked. Final unsigned iPhone Release build succeeds;264 bundled files match source byte-for-byte. FullJS485/485, Kimi56/56/build and both browser engines pass. Physical devices, manual VoiceOver and commercial rights remain separate release gates.
