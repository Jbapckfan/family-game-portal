# Word edition and nine-board bonus · local release candidate

Branch: `codex/daily-product-2026-10-28`, based on preserved private-playtest commit `278cf35c5ccd71c5ee71150d74abceee1e693d6d`. This is substantive local product work, not a deployed release or a claim of parity with NYT Games.

The home now leads with Counterpart, Shortlist, Second Sense and Sideways. Today’s Three offers one next action and handles resumed games, wins, reveals and losses truthfully. Selections before October28 remain unchanged. All32 daily games remain available; collection records sit behind a disclosure. The new local-AI Tic-Tac-Toe bonus appears separately, with no daily credit, puzzle-count inflation or mandatory account.

The four word games each have a short, skippable interactive rule example in Help. Examples never touch daily state, attempts or hints. Shortlist shows candidates first, uses whole-word pencil targets and keeps the scan area close on phones. Counterpart explains an actually reversed answer pair and scrolls the next active row into view. Second Sense explains which submitted meaning fits without revealing an unseen answer. Sideways lets the player follow one clue/column through row moves. Existing palettes and game mechanics remain distinct within the shared paper/ink design.

The bonus is real nine-board play against deterministic Casual or Tactical AI. Opening/free-choice, forced routing, won/drawn mini boards, macro wins and exhaustion draws are engine rules. An overview and a larger selected mini board provide readable controls. The AI turn blocks player moves; reload resumes pending AI; restart invalidates old work. Replay-validated version1 saves, save-failure memory play and a newer-save guard prevent the reproduced stale-window overwrite. localStorage cannot provide an atomic transaction for literally simultaneous windows; this is a bounded stale-controller guard, not cross-device sync. Sharing contains only match outcome and level, with no move geometry.

## Shared web/app foundation

Both surfaces use identical bundled engines, authored banks, game UI and bonus logic. The website adds the standalone collection and an explicit byte-verified offline download. SwiftUI supplies native navigation, records, settings, haptics and the system share sheet; its exact allowlist includes33 game documents and two shared runtimes. Only32 daily identities enter the ledger. The iPhone app launches bundled games offline without a download. Web and native saves are separate local stores; no sign-in, telemetry, automatic feedback upload or score-sync service was introduced.

The prior private-playtest first-visit guide and voluntary copyable feedback remain. Use one stable origin for browser testing: changing domain/port/profile changes the browser’s save store. The local export includes only runtime assets; no surrounding Family Portal or private source/audit files.

## Content runway and editorial limits

`node scripts/audit-word-edition.mjs` checks the actual selectors for October28–November26 and solves/restores the four word games through their engines. Each has30 distinct selected puzzle IDs. Counterpart has150 analogy appearances/90 unique relationships; Shortlist360 candidate appearances/357 unique words; Second Sense150 answer appearances/75 unique words; Sideways120 answer appearances/120 unique words. Recombination and repeated vocabulary are explicit. The broader32-game selector audit covers960 game/date selections and30 distinct IDs per game. Prepared records are not30 days of independently reviewed new ideas.

`docs/word-edition-runway.json` records machine evidence and human review flags, including SCAB/WOUND wording and CALLUS/FRICTION ambiguity. An earlier independent automated UI-only probe solved Shortlist in two scans and reached3/5 Counterpart pairs before its action cap; it is not human testing or evidence of market competitiveness.

## Verification

Evidence directory: `output/playwright/product-20261028/`. Tests run serially around scarce browser/simulator work; no unrelated process was stopped.

| Check | Result | Evidence |
| --- | --- | --- |
| Full JS engines, storage, catalog, validators and export tooling | **538 passed, 0 failed** | `full-js-final.log` |
| Pinned Kimi suite | **56 passed, 0 failed** | `kimi-tests-final.log`; existing experimental Node localStorage warning |
| Bonus engine/AI/controller/route subset | **41 passed, 0 failed** (included above) | `bonus-unit-final.log` |
| Four word games, actual Chromium + WebKit | **8 completed UI flows**, all won through real controls, rule exercises/state invariance, precise errors, pencil/column controls, reload, 320px/reduced motion, result-to-today navigation | `word-product-results.json` |
| Bonus actual Chromium + WebKit | **2 full matches**, forced routing, AI-turn guard, pending-AI reload, restart cancellation, quota fallback, 320px/44px cells, phone selected-board visibility, overlays, canceled spoiler-free share and daily-save isolation | `bonus-browser-results.json` |
| Collection actual Chromium + WebKit | **2 passed**, cardinality/filters, Central midnight/rollback, saved status, share cancellation/manual fallback, save failures and reload | `home/browser-results.json`, `home-browser-final.log` |
| Actual Chromium worker lifecycle | **11 passed**, failed first download, exact-byte verification, repair, all33 cold offline launches, bonus human/AI play and restore, old scan/marker preservation, date rollover and waiting-worker activation/cache ownership | `offline-browser-results.json` |
| Actual Foundation Swift/web parity | **Passed**,32 daily entries/counts, four featured,30 selections/share texts, bonus bridge rejection and Central/DST keys | `surface-parity-final.log` |
| Runtime source/bundle parity and native structure | **Passed**,33 entries,270 exact runtime files,24 Swift files, two targets/two schemes,33 XCTest methods | `sync-final.log`, `native-structure-final.log` |
| Final native hosted XCTest | **33 passed, 0 failed/0 skipped**, including actual offline WKWebView initialization of33 documents and bonus control selection, persistent origin and bonus-credit rejection | `/tmp/AlfordDailyProductFinal.xcresult`, `native-final-result.json`, `native-final.log` |
| Final generic iPhone Release build | **Passed unsigned**, all270 bundled hashes match source in both simulator and Release app | `unsigned-build-final.log`, `final-bundle-parity.json` |
| Thirty-day content | **Passed machine checks**,120 featured selections/solves/restores plus960 broader selections; editorial limits above | `docs/word-edition-runway.json`, `all-daily-runway.log` |

One independent final reviewer found **no Critical/Important issues**;46 focused tests passed independently. Its two Minor findings were fixed: hypothetical route previews now reflect self-closing/terminal moves (two RED→GREEN regressions), and game-specific CSS now applies the intended mobile type/target sizes. No recursive review followed. The original30-day audit script was rerun with unchanged content; no puzzle bank or published ID was rewritten.

Recovered intermediate failures are retained: one native smoke readiness probe initially ran before async ES modules were ready; bounded test polling fixed that test race and the subsequent full33 tests passed. A phone layout assertion reproduced six candidate rows and was fixed to four; its initial230px threshold was corrected to250px for four53px tiles. WebKit’s fractional scrolling needed a one-pixel bound tolerance. The collection harness initially lacked its existing Playwright module environment path, then passed when supplied. No product failure is being hidden behind these earlier RED/setup logs.

## Distribution decision and release gates

No site/NAS deployment, audience change, public link, push or tester contact occurred. The existing Alford Daily Site was owner-only when read; its active version is not this candidate. The two documented NAS addresses timed out, and the shared project-port registry was unavailable, so no listener was started or borrowed. A local staged bundle and ZIP can be reviewed safely.

The next distribution decision is whether to deploy this exact verified candidate to the existing owner-only Site, then explicitly choose named friends/audience, or first repair/verify the NAS route. Deployment and audience changes need James’s authorization. Test the actual stable HTTPS origin, cache/update behavior and save continuity after that decision; local routed-browser evidence cannot certify the eventual host.

Commercial gates remain: human editorial approval of the opening month and ambiguous alternatives; dictionary/content permission review (especially `sources/kimi/README.md` and `sources/claude/README.md`); physical iPhone/iPad and VoiceOver testing; signing/TestFlight/App Store configuration and privacy declarations; independent player feedback on comprehension, fun, difficulty and replay; and a separate pricing/monetization decision. No rights clearance, human editorial sign-off, physical-device evidence or live payment activation is claimed.


## Screenshots and practical limits

Actual final screenshots were visually inspected: `home/chromium-today-desktop.png`, `chromium-shortlist-playing.png`, `chromium-nine-board-opening.png`, `chromium-nine-board-phone.png`, `native-home-final.png`, `native-shortlist-final.png`, and `native-nine-board-final.png`. Six selected deliverables were saved privately to Library; the ordered IDs and local metadata receipts live outside source in `../deliverables/daily-product-20261028/private-screenshot-receipt.json`. Screenshot delivery changes no Site audience.

The browser AI matches use Casual and complete22 legal moves through real controls in each engine. Tactical win/block/free-choice/legal-search behavior is covered by the pure AI suite. Native evidence is Simulator build, actual33-game offline launch and bonus board selection/native navigation; a full touch-driven native AI match, physical-device play and VoiceOver audit are **not** claimed. The semantic native UI tool did not expose the WebView’s HTML controls, so no coordinates were guessed to manufacture native play evidence. Browser HTML labels, keyboard controls, reduced motion and small-screen bounds were exercised; this is not a full accessibility certification.

The one leased Simulator was released and shut down after screenshots. Web test browsers were closed. No unrelated app/process, shared port or benchmark was stopped. Source contains no active commerce changes. Five loopback HTTP socket checks remain unrun here because the shared port registry failed closed; the real browser harness uses routed HTTPS and then removes all routes for offline assertions.
