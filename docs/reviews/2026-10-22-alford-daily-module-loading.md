# Alford Daily module-loading investigation — October 22, 2026

## Outcome

The previously intermittent failure was **not reproduced with a stable, complete delivered bundle**. No application-code fix is justified by the evidence from this bounded pass. A deliberately missing lazy module did reproduce the identical message and recovery screen; restoring that module and pressing the existing Reload game control recovered correctly.

This does not establish that the in-app browser caused the original failure. It narrows the unresolved question to the actual response/connection/cache/navigation state at the time of a failing request. The previous server's HTTP 200 log alone did not prove complete body delivery.

Source baseline: `5a9d9a92eec33a7ff8256091544c8c89c7dd415b`. Separate local branch: `review/alford-daily-module-load-2026-10-22`. The branch changes only this report. No rules, puzzle data, attribution, saves, payments, production hosting, NAS configuration or deployed code changed. Both earlier delivered ZIPs remain byte-for-byte intact. No shared Chrome window, new tooling installation, simulator or external service was used.

## Experiments and results

| Experiment | Observation |
| --- | --- |
| Complete final bundle on isolated port 18766, no-store responses, HTML-only diagnostic event listener | Cold visit and four reloads reached the ready game. Module responses recorded exact source SHA-256, JavaScript MIME, byte counts and completed server writes. |
| Same fixed bundle with Last-Modified validation and conditional responses | Three consecutive reloads reached the ready game. The trace includes successful HTTP 304 revalidation; no spontaneous error was observed. |
| One deliberate 404 for `MorphPage-DrE1E-bX.js` | The app displayed “This game needs a fresh start.” The browser emitted `vite:preloadError` and `TypeError: Failed to fetch dynamically imported module`, naming that exact local URL. |
| Remove the deliberate fault; press visible Reload game | The game returned to ready state without clearing browser storage or modifying game state. |
| Unmodified final files, standard `python3 -m http.server`, fresh isolated port 18767 | Cold visit and three consecutive reloads reached ready state. No console errors. This comparison omitted the diagnostic HTML listener and custom response logic. |
| Static delivered-module reference audit | All 14 JavaScript modules had their directly referenced local JS/CSS files present. No missing references. |
| Compare first-pass and second-pass hashed asset sets | 13 old-only and 14 new-only filenames. A cached old entry requesting an uncached old chunk after that asset set is removed could receive 404. This is a constructed mixed-version hosting risk, **not evidence that it caused the original incident**. |

Final instrumented trace: **90 HTTP 200, 46 HTTP 304, one intentional HTTP 404; zero recorded failed writes**. The only captured browser diagnostic error corresponds to the intentional 404. Successful server writes still do not independently prove browser-side acceptance or evaluation; browser ready-state checks supply that additional evidence for successful visits.

The original intermittent failure remains unresolved. Passing a small reload sample does not prove it cannot recur. No automatic-retry loop, cache-busting query, service worker, changed cache policy, or production telemetry was added speculatively.

## Evidence handoff

The separate `Alford-Daily-Module-Load-Investigation-2026-10-22.zip` contains:

- This report and a documentation-only patch.
- `trace_server.py`: Python-standard-library local diagnostic server, binding only loopback and reading the provided site without modifying it.
- `requests.jsonl`: response metadata, exact hashes/lengths, completed-write markers and the intentional failure event.
- `browser-checks.json`: three no-store reload checks, three conditional-cache checks, plain-server cold/three reload checks, and fault console output. The initial cold/no-store reload was separately observed before the three-repeat check.
- `plain-server.log`, `asset-audit.json` and `summary.json`.

Screenshots are not needed to establish the failed-resource identity; the text trace records it directly. The previous full suites were not rerun because no application/build assets changed. This pass verified diagnostic-script compilation, ten controlled reloads, two cold visits, the injected failure/recovery, and static module references; it does not claim new native or whole-suite coverage.

## Deterministic reproduction and next investigation

1. Extract the existing second-pass review ZIP. In a separate directory beside `trace_server.py`, run `python3 trace_server.py --site /absolute/path/to/extracted/web --port 18766`. Keep the port consistent during the test. Do not point this at a live deployment or change the packaged web files.
2. Open `http://127.0.0.1:18766/games/kimi-morph/` in an isolated browser context. With no `cache.txt` beside the script, responses use no-store. Record a cold load and reloads. The injected HTML event listener logs errors; it neither prevents them nor changes the game code.
3. Create an empty `cache.txt` beside the script, reload once to establish Last-Modified headers, then repeat. The server returns 304 when the exact last-modified value matches. Compare outcomes and response hashes with the no-store run.
4. Write the exact current Morph lazy filename into `fault.txt` beside the script. Reload to force a 404. Confirm the error screen and matching `vite:preloadError`. Remove `fault.txt`, then use Reload game and confirm the ready board. This fault applies only to the diagnostic server; source files are never removed.
5. Compare unchanged files with `python3 -m http.server 18767 --bind 127.0.0.1 --directory /absolute/path/to/extracted/web`. Keep browser logs and the terminal response log. This distinguishes custom instrumentation from the ordinary local server.
6. For the next naturally failing run, capture the **whole failed module dependency chain**: requested URL, initiator/importing module, HTTP status, content type, full response length/hash, cancellation/network error, request cache headers, active document URL and exact release manifest. Record whether the navigation replaced an existing document while its modules were still loading. Collect this before retrying so recovery cannot erase the failure context.
7. Then change one variable at a time: fixed bundle versus controlled version switch; cold versus warm cache; standard server versus traced server; API reload versus the page's visible reload; separate ordinary Safari/Chrome context versus the in-app browser. Do not use a shared signed-in browser reserved for other work. An actual mixed-version reproduction must log the old entry and missing old chunk together; the filename-set comparison alone is insufficient.

If missing old chunks are demonstrated at a real release boundary, evaluate atomic release directories and retaining prior hashed assets for active sessions before touching application retry behavior. If complete correct bytes reach the browser but loading fails, use the captured network/cancellation details to isolate the browser, navigation or module graph. Neither remedy is authorized or implemented by this report.

No operation was denied or left pending. The remaining blocker to a code fix is **lack of a naturally reproduced defect with an established root cause**, not missing permission. The investigation stopped within the requested time window rather than making speculative edits.
