# Alford Daily — full collection quality pass

October 28, 2026 · MAKER: Codex · local branch `codex/full-collection-elite-2026-10-28`.

All **32 daily games and the nine-board bonus** received an individual interaction, feedback, input or recovery improvement. This supersedes the narrower [continuity pass](MAKER-Codex__2026-10-28-continuity.md). The exact packaged source revision is in `SOURCE-COMMIT.txt` beside the web folder. No Site/NAS deployment, audience change, external review-provider transmission, dependency/model download or device installation was performed.

Original identities, creator credits, authored banks, existing daily assignments, scoring, penalties and separate daily/practice records are retained. Optional draft fields extend existing saves compatibly. Counterpart/Second Sense drafts use bounded session storage, separately from the scored game. This is a local candidate, not a commercial or physical-device certification.

## Every game

Each row below passed actual-control completion, one meaningful unfinished save/reload, completed save/reload, and a narrow 320px completed-page overflow check in **Chromium and WebKit**. The opening play viewport was 390×844. These are **source-assisted** solutions: the driver reads the authored answer outside the browser and operates real controls; it does not inject winning state. The bonus uses an actual human-move/AI-response match. Source-assisted completion does not measure human difficulty, memory, fairness or discoverability.

| Game | Individual improvement | Dated QA puzzle / match | Both engines |
| --- | --- | --- | --- |
| Ringcount | A skippable interactive rules exercise teaches equal-sum cuts without consuming hints or moves. | `ringcount-009` | Pass |
| Switchpath | A skippable interactive rules exercise teaches alternating higher/lower movement without changing the daily. | `switchpath-009` | Pass |
| Counterpart | Each analogy keeps its own unfinished pair; same-tab reload retains the unsent draft separately from scoring. | `counterpart-009` | Pass |
| Shortlist | After three scans, an enabled Back to the words action focuses candidates; guidance points to the recorded evidence. | `shortlist-009` | Pass |
| Second Sense | Chosen noun/verb clues and unfinished typing resume after same-tab reload without a submission or hint charge. | `second-sense-009` | Pass |
| Sideways | Left/right rotates the focused row; up/down moves row focus without counting a move. | `sideways-009` | Pass |
| Tradeoff | Hints focus the suggested letter. Stale-window guards and memory-only completion recovery protect progress and daily records. | `p009` | Pass |
| Inbetween | Arrow/Home/End navigation moves between insertion gaps without an attempt. Save recovery handles missed and delivered cross-window updates. | `inbetween-009` | Pass |
| Cairn · Kimi | Clear rack/slot names and live placed-letter count. Blocked storage retains the existing counted-played flag during the visit. | `619` | Pass |
| Morph · Kimi | Unsubmitted letter edits persist separately from confirmed ladder rungs; clearer tap-to-edit directions and position names. | `55` | Pass |
| Tangle · Kimi | The consumed two-letter clue stays visible and survives reload; route-order badges and pressed states; safe blocked-storage help. | `115` | Pass |
| Hunch · Kimi | Partial typing survives reload. A visible ✓/↔/· legend supplements color and existing accessible feedback. | `141` | Pass |
| Circuit · Kimi | The unfinished index path and auto-seeded chain letter survive reload; visible arc numbers/start guidance; safe blocked-storage help. | `163` | Pass |
| Quartet · Kimi | Saved pair clues appear as text and PAIR badges; live selection/group guidance; safe blocked-storage help. | `175` | Pass |
| Twin Hive · DeepSeek | Rack insertion/deletion respects the caret and selection. Required gold-letter feedback and hints retain unsubmitted text during the visit. | `twin-expanded-036` | Pass |
| Spare · DeepSeek | A persistent tried-pair history explains failed pairs and free repeats, including after reload. | `spare-036` | Pass |
| Rung · DeepSeek | Visible changed-position/letter feedback for each rung; hints retain an unfinished word during the visit. | `rung-036` | Pass |
| Cipher · DeepSeek | Word boundaries and assignment labels clarify the code. Long words wrap while retaining 44px code targets at 320px; completion keeps result focus. | `cipher-036` | Pass |
| Trail · DeepSeek | Spatial arrow navigation, Backspace undo and Escape clear; selected-tile and terminal focus survive rerenders. | `trail-036` | Pass |
| Split · DeepSeek | Up/down chooses the clued word without placing a tile; live row guidance; completion keeps result focus. | `split-036` | Pass |
| Quadra · Qwen | Interior typing, filtering and duplicate-letter selection retain the correct caret and selection positions. | `quadra-036` | Pass |
| Logic Lattice · Qwen | B/W/U directly marks an editable square in one undoable action. Visible ✓/! clue states supplement color. | `lattice-036` | Pass |
| Syntax Siege · Qwen | Clock expiry explicitly announces damage and restart. Ordered rack selections, clear damage versus score, and keyboard directions. | `siege-036` | Pass |
| Memory Maze · Qwen | Study-to-recall hands focus to the known starting cell; spatial arrows navigate without revealing the next route square. | `maze-036` | Pass |
| Pattern Prism · Qwen | A–D shortcuts ignore held-key repeats; rejected choices and the next numbered prompt receive useful focus. | `prism-036` | Pass |
| Territory Tactics · Qwen | Exhausted placement controls disable and focus Undo; Undo restores legal investigation without changing costs. | `territory-036` | Pass |
| Dovetail · Claude | Reselecting the active row returns focus without erasing its unfinished word; row pressed states are explicit. | `dovetail-83` | Pass |
| Splice · Claude | A third half explicitly names replacement of the second half while preserving the first; order guidance matches existing behavior. | `splice-79` | Pass |
| Sprout · Claude | Chosen soil letter has a distinct pressed state/name/outline; live arrangement and soil-choice guidance. | `sprout-18` | Pass |
| Tangle · Claude | Visible ordered bead numbers distinguish duplicate copies; Back names the last tapped bead that it actually removes. | `tangle-072` | Pass |
| Keystone · Claude | Sanitized paste maps both selection endpoints to retained letters, preserving the interior caret and saved draft. | `keystone-064` | Pass |
| Tumbler · Claude | Sanitized paste/typing retains the correct interior caret and selection; unfinished and terminal restores remain intact. | `tumbler-0390` | Pass |
| Tic-Tac-Toe · nine boards | The recent-square marker remains visible above a claimed-board overlay without displacing the actual 3×3 grid. | `local-ai-match` | Pass |

## Verification

- **617/617** JavaScript tests passed across 66 test files in `games` and `scripts`, excluding the unrelated `lasers-3d` game. No failures or skips.
- Kimi package: **71/71**, with **23/23** additional cases asserted by its nested React/Radix runner. Pinned TypeScript/Vite build succeeded; all 19 generated assets match the existing package output. The existing large dictionary chunk advisory and Node test notices remain visible.
- **66/66** full-collection browser cases passed: 33 games × 2 engines, zero page errors, 66 unfinished reloads and 66 completed reloads. [Machine-readable results](MAKER-Codex__full-collection-results.json).
- **18/18** focused original/bonus browser cases passed. The bonus asserts exactly three grid rows and hit-tests the last-square marker above the claimed-board overlay.
- **4/4** normal delivered cross-window save cases and **4/4** missed-event/blocked-read/completion-recovery cases passed across the two classics and two engines. These are bounded sequential save guards; localStorage is not an atomic multi-writer database.
- Actual 12-code Cipher practice word checked at 320px in both engines: no document overflow and all code tiles at least 44px wide. The 33-page initial phone inventory also loaded without page errors or 320/390px document overflow. Selected final screenshots were visually inspected, including Shortlist, the bonus, Cipher and Hunch. The final bonus screenshot was opened and verified visibly in Preview.
- **11/11** real Chromium service-worker checks passed on the staged final build: interrupted/corrupt downloads refuse readiness, exact-byte repair works, a cold offline home and every daily game load with all test routing removed, the bonus plays/restores offline, an unfinished scan survives reload, Central date advances without deleting prior saves, and a waiting update preserves active games and unrelated caches.
- Native resource sync verified **270 files**, matching SHA-256 hashes and file sets. A fresh unsigned generic iPhone Release build succeeded. Its actual `.app/Web` file set and all SHA-256 values equal `ios/Web`; combined resource digest `7ff257bc7b27e565a60e96523fec2daa0ace991827a419eba81af43d9cf614cd`.
- Actual Foundation models compiled for web/native catalog, featured games, Today’s Three, read-only summaries, Central midnight/DST/rollback parity. **32 selectors / 960 selections** produced 30 distinct IDs per game for October 23–November 21. Structural validation found 24 Swift files, 2 targets, 2 schemes and 33 XCTest methods; no fresh Simulator/XCTest execution is implied.
- Final web export: **304 runtime files**, **302 hashed manifest assets**, build ID `55e0a3359cd76ed5`. All manifest hashes were verified. [Verification receipt](MAKER-Codex__full-collection-verification.json).

Browser tests use isolated profiles and a routed HTTPS test origin, with no local listener. Existing browser runtimes/dependencies were reused. The first final unsigned compile failed because the restricted sandbox prevented Xcode’s macro service from responding; the authorized normal Xcode run then succeeded. No signing settings, global developer directory, Simulator runtime or installed app changed.

## Final independent review and bounded fixes

One independent Codex reviewer inspected the integrated diff without editing or executing it. The Kimi/Qwen/DeepSeek/Claude family names above are creator attributions, not claims that those providers performed this review. No Critical finding was reported. Three Important findings were reproduced before the single fix wave:
1. The shared imported shell overrode Memory Maze’s intended recall focus. A new shell regression first failed, then passed when deliberate renderer focus took precedence. The actual Memory Maze starting-cell focus assertion now passes in both engines.
2. Classic games displayed a delivered storage update without acknowledging its snapshot, discarding the next legitimate move. Both real-browser cases first failed, then passed after acknowledging only an adopted game read.
3. Blocked reads retained a completed board but skipped its daily ledger, and returning to Daily could leave that completion unpersisted. Browser regressions first reproduced the missing count/recovery. Completion now updates the in-memory record without an unverified write; Stats/Daily retries the pending game after readable storage returns. Both engines pass.

**Known Minor retained:** Restarting an unfinished Counterpart or Second Sense practice resets the scored board but can restore its previous unsent session draft. This was recorded by final review and deferred under the agreed single Important-fix wave. It does not count that draft as a submission.

Physical iPhone touch comfort, VoiceOver/screen-reader behavior, haptics/audio, long-session performance, human editorial/difficulty review and content rights remain unverified. Dense boards and small on-screen text still need a real-device comfort pass. The prepared pools repeat; counts are not a claim of 8,001 independently authored ideas. Earlier review/deployment statements in historical documents are not fresh certification of this candidate.

## Reproduce and inspect

- Full collection: `PLAYWRIGHT_BROWSERS_PATH=<existing-browser-cache> DAILY_ELITE_OUTPUT=output/elite-20261028/full-collection node scripts/elite-collection.playwright.mjs`.
- Originals: `ENGINES=chromium,webkit node scripts/elite-originals.playwright.mjs`. Classics: the same engine setting with `scripts/elite-classic-live.playwright.mjs` and `scripts/elite-classic-saves.playwright.mjs`.
- Offline final export: `DAILY_STAGE=dist/full-collection-elite-20261028-final/web DAILY_OFFLINE_OUTPUT=output/elite-20261028/offline-final node scripts/offline-browser.playwright.mjs`.
- Native: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project ios/AlfordDaily.xcodeproj -scheme AlfordDaily -configuration Release -destination generic/platform=iOS -derivedDataPath output/elite-20261028/DerivedData CODE_SIGNING_ALLOWED=NO build`.

Browser cache/module overrides are documented inside the scripts; no install is needed in this workspace. Raw red/green logs, screenshots, native products and the clickable 33-game gallery are preserved locally under `output/elite-20261028`. The deliverable includes the report, verification results and screenshot gallery separately from its runtime-only web folder. Serve that web folder over HTTP/HTTPS; direct `file://` opening is not a supported game launch. No server is left running by this pass.

Family details: [Kimi six](MAKER-Codex__elite-kimi.md), [DeepSeek/Claude twelve](MAKER-Codex__elite-deepseek-claude.md), [Qwen six](MAKER-Codex__elite-qwen.md). Their worker-era pending root checks are resolved by the executed evidence above.
