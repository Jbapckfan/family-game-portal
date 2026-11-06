# Design studio preview — public release

[Open the comparison studio](https://pal-hand-strategic-competitions.trycloudflare.com/alford-daily/previews/design-studio/).

91 concepts from actual Claude Opus 5.5: four site directions, four for each of 18 confirmed keepers, and one for each of the other 15 games. The comparison UI and browser QA are by Codex. Model receipts, review notes, prompts and limits are in `docs/game-reviews/opus-design-studio-2026-11-06/`.

132 published files all match HTTPS SHA-256 checks. All 91 original mockups rendered at 393 and 1440 pixels with no page overflow, missing images, script errors or request failures. The published gallery was checked after its iframe content, styles and images loaded; the site alternatives and Sprout phone modal were visually inspected. It passed catalogue coverage, every subject navigation, filters/search, persistent local choice, modal A–D switching, phone width and Escape checks. Zero script errors or network writes occurred. 92 pending requests were cancelled by intentional rapid navigation; zero unexpected request failures. This is a layout/interaction smoke test, not full game-engine or physical-device certification.

The new preview directory was staged privately, hash-checked and atomically renamed into place. The 368 existing production files, parent portal and three service containers remain unchanged. No game or player record was changed; no private feedback was accessed. Existing offline editions were not rebuilt for this separate review gallery. Review choices use a separate browser-local key.

The first SFTP transfer failed because the NAS exposes a different SFTP path view. The existing SSH file route delivered the same package, then all guard checks passed. No service, permission or configuration workaround was applied.

The Quick Tunnel URL is the existing ephemeral friend-facing address. No new hosting service or domain was created. No production redesign has been selected or applied.
