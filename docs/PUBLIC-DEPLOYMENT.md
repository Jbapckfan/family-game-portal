# Alford Daily: primary public deployment

James explicitly confirmed that fixes must reach the non-ChatGPT website he shares with friends. The primary player destination verified November 6, 2026 is:

https://pal-hand-strategic-competitions.trycloudflare.com/alford-daily/

The owner-private Sites publication is a separate mirror and does not constitute delivery to friends. Do not send James to that mirror as the default player website. Verify the actual public destination after each release. The Quick Tunnel URL is existing and ephemeral; discover its current address from `docker logs --tail 120 reflex-riot-public-tunnel` without restarting it.

## Current origin and scope

- NAS alias `nas`, hostname `DXP6800PRO`; static root `/volume2/docker/caddy/sites/games/alford-daily`.
- Parent static portal `/volume2/docker/caddy/sites/games` is mounted by `reflex-riot-public-web`; preserve unrelated games and its root index.
- Existing feedback/profile receiver `alford-daily-feedback`; private data outside public root at `/volume2/docker/caddy/alford-daily-feedback/data`. Do not read or overwrite user records for a static deployment.
- Preserve public-specific profile, consent, activity and scoped feedback client modules. Do not overwrite them with the private Sites variants.
- Publish via guarded staging and atomic directory exchange. Preserve the previous full static tree. Verify all public file hashes and real browser rendering; a Git push alone does not deploy.
- Existing offline editions deliberately wait until all Alford Daily tabs close. The hub’s Check for an offline update flow can download the new edition; then close/reopen tabs. Do not clear site data, saves or profiles to refresh.

## November 6 release

Public build `4595a32fef4e4e27`, 360 files; all public HTTPS hashes verified. Twelve previously completed private-site game/UI changes were merged into the exact public baseline, then the expanded exact-goal Territory edition and edition-aware home reader were added. The 37-hex edition has 240 boards and three-placement exact solutions. A 186-day inclusive daily reservation keeps 54 boards available for fresh Practice. Old Territory saves and results remain intact; aggregate stats count each date once.

The static promotion preserved all service containers, existing profile/feedback client assets and private data. Verification then found that the public Caddy container, recreated before this update, had lost the previously approved six API routes. The exact approved route block was restored with Caddy validation and graceful reload; no container restart, tunnel change, new endpoint or data mutation occurred. GET checks now return 405 for feedback/write-only routes and 401 for unauthenticated own-state read. No test profiles or feedback notes were submitted.

The restored Caddyfile still lives in the existing container’s writable layer, with a host backup in the deployment package. Do not recreate that web container from the old definition; it can discard routing again. A persistent mount/definition change is separate infrastructure work, not part of this static update.

Evidence and guarded scripts: [November 6 public release](deployments/2026-11-06-public/REPORT.md).
