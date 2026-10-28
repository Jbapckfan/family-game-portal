# Alford Daily private-playtest verification

Branch: `codex/daily-private-playtest-2026-10-28`, based on `64c0d715d974b0e3830306f9cced765735de2482`. Final commit is the commit containing this report; the delivery package records its full SHA separately. No push, deployment, permission change or physical-device installation occurred.

## Product changes

The existing collection now has an optional first-visit guide with direct first-game links, and a prepare/review/copy playtest-note flow with current date, game/creator, public result, content fingerprint and deliberate tester text. No automatic analytics, accounts, network feedback service or save migration were added. Existing game identities and all32 entries remain.

The standalone export adds an opt-in offline download. Every asset is SHA-256 verified; readiness checks the actual active cache, and repair accepts only matching bytes from that edition. A failed fresh install removes its partial cache. Missing cached assets cannot silently consume changed server code. A waiting update leaves open games on their current edition. The worker touches only its collection cache namespace, never localStorage, other caches or unrelated applications.

Six matching game shells now recognize a directory prefix, preserving collection/sibling links and origin-local saves. Their generated iOS copies match. No Swift UI, game rules, puzzle assignments, score/reward or commerce code changed.

## Final passed evidence

Evidence directory: `output/playwright/playtest-20261028/` (ignored local artifacts).

| Check | Result | Evidence |
| --- | --- | --- |
| Full JavaScript game/content/shell/home/staging suite | **494 passed, 0 failed** | `full-js-reviewed.log` |
| Pinned Kimi tests | **56 passed, 0 failed** | `kimi-tests.log`; existing experimental Node localStorage warning only |
| Featured real gameplay | **4/4 wins in Chromium and 4/4 in WebKit**, each with unfinished and finished reload checks | `gameplay-results.json`, `gameplay-final-verified.log`; QA uses authored source answers through actual controls, not blind editorial/difficulty evidence |
| Home/share regression flows | Both engines passed distinct3, featured4, all32, filters, Central midnight/DST/rollback, share cancellation, failed writes, reload,320px and reduced motion | `rollover/browser-results.json`, `rollover-share-final.log` |
| Real Chromium worker/cache lifecycle | **10 passed checks**, including interrupted first install, cache loss, mismatched network bytes rejected, exact-edition repair, cold offline home, all32 **populated boards**, unfinished scan reload, offline rollover, waiting update and safe activation/cache cleanup | `offline-browser-results.json`, `offline-reviewed.log` |
| Thirty-day content scheduling | **32 selectors,960 selections,30 distinct IDs/game**, October28–November26 | `runway-final.log`, `docs/daily-runway.json` |
| Actual native/web model parity | Swift Foundation models compiled/executed: all32 names/creators/counts, featured4,30 Today’s Three selections/share summaries, Central midnight/DST/rollback | `surface-parity-final.log`; `scripts/check-surface-parity.mjs` |
| Native resource parity | **264 files,32 entries,two runtimes**, SHA/file-set match | `node scripts/sync-ios-web.mjs --check` |
| Native project graph |24 Swift files,two targets,two schemes,32 XCTest methods,264 resources structurally valid | `python3 ios/scripts/validate_project.py`; structural validation is not a fresh native app build/test |
| Standalone export | **298 files**,32 games,8,001 finite prepared records; edition **ca80190ab706cd48**,9,086,458 asset bytes before generated worker/manifest | `dist/private-playtest-reviewed-20261028/`; staging guards exclude portal/source/tests/internal editorial evidence |
| HTTP static inventory test | **1 passed** | `http-static-check.log` |
| Syntax/diff whitespace | Passed | Node syntax checks and `git diff --check` |

Chromium runs used GPU-disabled launch flags. Browsers ran serially; no Simulator was acquired, no other listener was stopped, and benchmark processes were not interrupted. The missing global WebKit executable was recovered by downloading the matching runtime into this checkout’s ignored output folder. Final WebKit gameplay and regressions use that matching runtime, not the incomplete older global cache.

## Review and recoveries

One independent GPT-6 Astra reviewer inspected the whole change read-only. No Critical or Minor findings; two Important findings concerned false readiness after cache loss and mixing versions on a missing-asset network fallback. Both have failing-before/fixed-after regressions and are fixed in the one bounded pass. Final full suite and real Chromium cache-loss/repair checks passed; no recursive review.

Earlier tests exposed and resolved the prefix link bug, first-install activation/readiness race and redundant explicit worker-update request. Browser update QA uses a distinguishable synthetic script query and real lifecycle/cache logic; Node-side polling avoids premature async assertions under the page’s simulated clock. No service worker skips waiting or clears user saves.

## Blocked or not run

- Five existing socket-based HTTP-verifier cases **not run**: their class setup failed with `PermissionError: [Errno 1] Operation not permitted` on `ThreadingHTTPServer(('127.0.0.1',0))`. Its separate static-inventory test passed. The Mini-owned port authority’s DNS failure also prevents a compliant new server reservation; no listener workaround was used. `http-verifier-tests.log` preserves the failed setup.
- Fresh full native build, Simulator XCTest/UI, physical iPhone/iPad, human VoiceOver/large-text acceptance and Safari device offline behavior **not run this pass**. This work verifies actual Swift core models, JavaScript game flows and generated resource parity; it does not claim device certification or a newly built native binary.
- Live HTTP/HTTPS asset/MIME/authentication/update checks **not run**: no deployment is authorized. Both documented NAS routes time out. Existing Site metadata confirms owner-private access, not current gameplay. No public/friends URL is newly ready.
- Opening the screenshot in a Codex file panel returned **“The source chat’s file executor is unavailable.”** No panel opening is claimed. Local image inspection rendered the screenshots; four supported private Library uploads succeeded with identity receipts in delivery. The prepared-upload helper failed at DNS before creating any item; the supported host-file create route then saved the four files once.

## Distribution and content gates

See [the current private-testing plan](../PRIVATE-PLAYTEST-2026-10-28.md) for the exact owner-private Site decision and subsequent audience approval. It documents website/app shared code, independent storage, web-only prepared feedback, default-disabled native commerce scaffolding and offline access-retention limits. The historical NAS commands are explicitly superseded pending target reconciliation.

Human editorial review and dictionary/content distribution rights remain unresolved as documented in the opening-month audit. Source-assisted automation does not establish fun, fair difficulty, audience suitability or legal permission. No paid service, public route, new account requirement or commerce activation was introduced.
