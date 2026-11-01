# November 1 integrated collection pass

The review build contains **32 Daily games and the nine-board Tic-Tac-Toe bonus**. Circuit is James's eleventh recorded keeper; no numeric score or relative position was inferred. Ten additional playable candidates remain separate from the production lineup until James chooses replacements.

The collection is prepared for the next individual reviews. This is not a claim that every clue is perfect or that the app is ready for commercial release.

## What changed

- Circuit now accepts all source-covered words meeting its actual letter/alternating-arc rules. MORN and NICE work on the reported ring. Four contiguous blue, green, gold and red arcs meet at the cardinal directions, with numbered membership labels. Published targets remain stable and are described as targets rather than mathematical minima.
- Cairn/Morph, Hunch, Kimi Tangle, Circuit, Twin Hive, Rung, Syntax Siege and the Claude construction games use broader, reproducible word acceptance under their own rules. Fixed clues and category answers retain their semantic constraints; a dictionary entry alone does not solve a clue.
- The twelve DeepSeek/Qwen games have larger text and controls, cool blue/teal frames and clearer game-specific panels. Cipher keeps the selected code and keyboard together on phones. Shared results disclose hints and Siege's untimed assistance.
- Dovetail accepts valid directed joins; Splice accepts safe alternate pairings; Sprout uses complete growth graphs; Claude Tangle accepts complete ordered partitions; Keystone accepts the stated either-order five-join alternatives; Tumbler has broader legal guesses with unchanged secrets and feedback.
- Claude Tangle gives a free retry when a valid word works with other available copies of its letters. Genuine word-level traps still cost a knot. Previously recorded knots still replay.
- Quartet has readable two-column phone cards, numbered tiers, more precise category labels and validated hint disclosure. Compact spacing is checked at the actual CSS breakpoints.
- Rung computes shortest routes from the current dictionary and explicitly rejects unreachable/unknown endpoints instead of reporting zero moves. Every published pair remains connected; valid identical endpoints still have distance zero.

The isolated [twelve-game report](../game-reviews/remaining-dq/MAKER-Codex__REPORT.md), [Claude/Quartet report](MAKER-Codex__remaining-cq.md), [Tangle repair report](MAKER-Codex__claude-review-fixes.md), [Kimi Tangle migration](MAKER-Codex__kimi-tangle-v3.md) and [Quartet follow-up](MAKER-Codex__quartet-static-review-20261101.md) retain detailed reproductions and earlier checkpoints. Their earlier word counts and pre-fix behavior are historical; this integrated report and current evidence take precedence.

## Dictionaries and saved rounds

The final finite source union has **410,592 spellings**: the existing dwyl/Wordnik/ENABLE inputs, six documented Zynga examples, official ESDB default size-60 US/GB/CA/AU selections, and nine individually verified modern spellings/inflections. Every input requires a matching SHA-256 pin. Parsing does not lowercase proper names, remove accents or split open compounds. Full source notices, including the exact ESDB notice, ship with the runtime.

Current checks independently enumerate the rule-filtered dictionaries rather than trusting generation output:

| Surface | Final verified coverage |
|---|---:|
| Cairn/Morph 3–7-letter shared set | 104,575 words; all previous 97,109 retained |
| Hunch | 17,991 guesses; 937 unchanged answers |
| Circuit | 950,900 board/word memberships; 149,412 distinct accepted words |
| Rung | 8,182 four-letter words |
| Claude Tumbler | 18,022 accepted guesses, each submitted and restored |
| Claude Tangle | 29,346 independently enumerated ordered bead paths |

Markerless Claude construction saves retain their earlier rules. New construction rounds use the frozen vocabulary-2 payload. Kimi Tangle keeps immutable vocabulary-2 data and uses vocabulary 3 for new rounds from November 1. Old Daily and 5×5 sample totals, scores, goals and assistance stay paired with their edition; unsupported versions preserve raw progress and show recovery guidance. A guard freezes ten replay-sensitive payloads. Future expansion requires another edition, not silently refreshing that guard.

Additive guess/word games intentionally broaden acceptance without changing prior feedback or rejecting earlier accepted words. This differs from replay-sensitive construction changes. Already running older clients cannot be retroactively repaired: arbitrary old/new simultaneous writers remain a known limitation. The tested offline updater waits for old tabs to close before activation.

## Executed verification

- **966/966 root Node tests and 244/244 Kimi package tests passed**, with zero skips. TypeScript and the production Vite build passed.
- **66 actual browser completions passed:** every one of the 33 entries in both Chrome and WebKit, using real controls with unfinished and finished save reloads and 320px width checks. Final Quartet/Rung runs supersede their earlier rows. Six additional real Claude hint/reload/reveal/share flows verify that actual app callbacks retain and disclose assistance. [Per-game results](remaining-games-20261101/evidence/browser-completions.json).
- **182 distinct actual Daily selections per game**, November 1–May 1 inclusive: **5,824 selections** across all 32 games. Historical assignments are preserved. Practice protection is checked at every date, not just the beginning. Different configurations can reuse words, clues or other ingredients. [Current runway](../six-month-runway-2026-11-01.json).
- All 2,425 DeepSeek/Qwen records completed through normal engine actions with 34,960 restorable transitions. Independent Claude graph/matching/partition oracles and all seven Claude/Quartet dated calendars passed against the current source union.
- **11 real offline/update checks passed**, including all 32 cold game boots, bonus AI/save restoration, missing/corrupt cache recovery, interrupted download, Central date rollover and close-tab update activation. [Results](remaining-games-20261101/evidence/offline-browser-results.json).
- The website and native bundles match across **304 game/runtime files**. The standalone website contains **338 runtime files** and all **9,541 prepared records**. Structural native validation and a fresh **unsigned generic-iPhone Release build passed**. No device was installed or launched. [Build receipt](remaining-games-20261101/evidence/ios-build-receipt.json).

Earlier failed verification is retained honestly. One old Tangle test expected the new default dictionary for a markerless older save; its expectation now explicitly uses frozen v2. Browser instructions were updated from obsolete button/result labels to the actual UI, with screenshots checked. A whole-suite staging failure captured a rebuild before native synchronization; after synchronization the stable full run passed. These failures were not hidden or counted as passing runs.

## Actual independent reviews

Kimi K3.1 Pro, Opus 5.5 and Gemini 3.8 Flash High were invoked through the existing authenticated CLIs. Reports, exact input manifests, model arguments and receipts are retained. These were static reviews, not model-played matches or device tests. The initial Gemini batch timed out; its smaller follow-up completed. The follow-up reported no concrete defect in its supplied modules, but did not inspect omitted payloads or certify the whole collection. [Finding-by-finding adjudication](remaining-games-20261101/ADJUDICATION.md).

There was no verified free DeepSeek route, so no DeepSeek review or endorsement is claimed. No metered model route or new subscription was enabled.

## Ten separate candidates and commercial preparation

The [candidate gallery](../../experiments/MAKER-Codex__ten-candidates-20261101/index.html) is a self-contained offline HTML file with ten mechanisms, 1,820 Daily boards and 1,820 separate Practice boards. Version 2.1 preserves v2 saves and the recorded first result while making later practice/replay outcomes clear. It includes fixes prompted by the three baseline reviews and a focused Opus follow-up. Its final HTML hash is `82921f0aca70c227afa327a41d6e2fef3d1194e75079ed073e8b4a6b8560e08e`.

The candidate audit passed **358,153 Node assertions**; the eleven focused repair groups also passed in root. Retained agent evidence additionally covers eighteen prior regression groups, twenty desktop/phone completions and all 182 packing boards through the DOM. Reviewer predictions are not James's ratings; no candidate has been promoted automatically.

The [launch pack](../launch/2026-11-01/README.md) contains website/store copy, social drafts, demonstration scripts, screenshot briefs, support/privacy preparation, release gates and an interactive revenue calculator. Its proposed first offer is free Daily/Practice with restrained ads and optional one-time ad removal; **$6.99 is an unvalidated research hypothesis**, not an activated product. No forecast is prefilled. The calculator's seven verification groups passed at phone and desktop sizes, and it was visibly opened.

No public deployment, live ads, purchases, paid acquisition, outreach, account creation or infrastructure change was performed. Physical iPhone interaction/accessibility/performance, long sessions, human clue/category/difficulty review, publisher contact details, commercial content rights and actual consent/purchase implementation remain release gates. Broad spelling coverage is not exact Words With Friends/NASPA parity, universal English completeness or human suitability certification.
