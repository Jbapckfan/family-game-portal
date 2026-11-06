# Public release — November 6, 2026

Public URL: https://pal-hand-strategic-competitions.trycloudflare.com/alford-daily/
Build: `4595a32fef4e4e27`. Previous: `7bfb59353568b04a`.

The public baseline’s 359 files matched the retained player-enabled candidate exactly. Completed private-site fixes were applied only where the public file still matched its original private v9 base. The public profile/feedback additions were retained. New Territory code adds 37 hexes, exactly achievable capture goals, three placements, 240 symmetry-distinct boards, and separate exact-v2 state. Half the boards require combining groups; every board has smaller-capture and overshoot traps, and all wins require three placements. Practice excludes the next 186 daily dates. Legacy saved keys are unchanged.

Validation: independent exhaustive oracle across 240 boards; engine, edition, statistics and calendar tests; six Chrome/WebKit gameplay scenarios at 320/393/1280; public Chrome/WebKit rendering at 393/1280; all 360 public HTTPS asset hashes; same-origin root index; no public feedback read; all six API routes return their expected unauthenticated/method-restricted responses. 288 broader regressions passed in the earlier core pass; one existing jsdom harness could not start because jsdom is absent. The follow-up calendar/edition suite passed 77 tests and all six real-browser scenarios. Native resource parity is 309 files and the project structural validator passes; no native binary installation is claimed.

The first read-only feedback check found a 404 caused by a default Caddyfile left after a pre-existing web-container recreation. Static deployment did not introduce that issue. The previous approved six-route block was restored and validated, with graceful reload and unchanged container IDs/start times. Profiles/database contents were not accessed or changed. No new feedback or player sessions were posted.

Static rollback: `/volume2/docker/caddy/alford-daily-feedback/releases/public-fixes-20261106-4595a32fef4e4e27/previous-live`. Promotion metadata is beside it. Deployment package and prior/restored Caddyfiles: `/volume2/docker/caddy/alford-daily-feedback/packages/MAKER-codex__public-sync-20261106/`. Do not overwrite private feedback data during any rollback.

The receipt inventories exact served bytes. Preserve all public-specific additions when preparing another release. The attached scripts are evidence for this guarded release; their dated baseline and package paths must not be reused blindly.
