# Alford Daily private playtest — October 28, 2026

This candidate builds on `64c0d715d974b0e3830306f9cced765735de2482`. Its final commit and test evidence are recorded in the accompanying review. Nothing in this handoff authorizes deployment, invitations or audience changes.

## What friends can try

- Today’s Three rotates through Ringcount, Switchpath, Counterpart and Shortlist. All 32 games remain accessible. Existing game-specific palettes, typography, board interactions, rules and creator credits are retained.
- A collapsible first-visit guide points directly to a word game or number game. It does not block play or require an account.
- A home playtest form prepares a text note with the chosen game/creator, current Central date, edition fingerprint, public Daily status and the tester’s deliberate reaction/note. The tester reviews and copies it into their existing conversation with James. Nothing is sent or tracked automatically. Unsent notes disappear on navigation; no game saves are copied into reports.
- The standalone web export can optionally download all game/runtime assets. Each response must match its expected SHA-256 before the worker installs. A failed download removes only its partial new cache. A new edition waits for old tabs to close, avoiding forced changes during a puzzle. Saves remain owned by the existing engines and are never cleared by the worker.

Offline preparation needs HTTPS or localhost and a supporting browser. Browser storage can be denied or evicted; the UI reports failures and warns that downloads can be cleared. Use one stable browser/device/address. Download on a trusted personal device: hosting access removal cannot revoke files already downloaded for offline play. A private hosting login may be needed to reach an invitation-only Site; the game itself has no account requirement.

## Website and iPhone app: the actual architecture

| Concern | Shared foundation and current difference |
| --- | --- |
| Game rules, content and UI | The same 32 HTML/JS game runtimes and prepared puzzle banks are copied by a strict allowlist into the iOS bundle and the standalone website. Source/bundle parity is checked before staging. There are 8,001 finite prepared records, at least 120 per game; these counts do not prove editorial uniqueness. |
| Home/navigation | Web home is HTML/CSS; app home is SwiftUI. Catalog metadata, featured order and Today’s Three logic are separate implementations. `scripts/check-surface-parity.mjs` executes the actual Swift Foundation models and compares all 32 entries/counts, 30 daily selections, date boundaries and share summaries against JavaScript. This guards drift without rewriting either home. |
| Offline | Native games use the bundled `alford://app` resource scheme and need no network download. The standalone website now uses an opt-in, content-addressed service worker. No worker is installed by the source portal or the native app. |
| Saves | Web localStorage belongs to its website origin. App games use a persistent WKWebsiteDataStore under the app’s own origin; a validated bridge feeds the native progress ledger. Browser and app saves do not sync. Changing website addresses also creates separate browser histories. No migration, cloud identity or sync service was added. |
| Sharing/feedback | Both surfaces have spoiler-free Today’s Three result sharing. The new prepared playtest-note form and first-visit guide are web-only in this pass. App testers use the tester-guide template or normal result share. There is no automatic event analytics on either surface. |
| Commerce/distribution | Existing native StoreKit scaffolding defaults to disabled and only supports the existing explicit local testing argument. This work changes no commerce policy or entitlements. Native distribution still requires the separately authorized signing/TestFlight/device process; no device was installed or agreement accepted here. |

This is a useful website-plus-app foundation: share the mobile web link for the first visit, offer the app later for persistent bundled offline use. Optional cross-device sync would be a separate product decision and data design. Do not promise that feature today.

## Thirty-day availability and review limits

All 32 real daily selectors were executed for **October 28–November 26, 2026**: 960 selections, 30 distinct puzzle IDs per game. See `daily-runway.json`. Existing engine/content tests verify structural and solvability constraints. Source-assisted browser wins of all four featured games test controls and persistence; they are not blind human difficulty ratings.

The earlier opening-month audit remains an internal machine/source review, not human editorial approval. Its ambiguity, vocabulary and repetition notes still apply. Content/dictionary distribution rights remain unresolved where documented in `opening-month-editorial-review.md`. Attribution, archive history and a working game do not establish permission. No content clearance is asserted for this private candidate or commercial release.

## Hosting evidence and the exact next decision

Read-only checks on October 28:

- Existing Site `appgprj_6ad77f0216348191a061da38c4a431c4`, **Alford Daily — A little challenge, every day.**, is active at `https://alford-daily.jbapckfan.chatgpt.site`, version 5. Its current custom policy allows one user, zero groups and zero external visitors; caller is owner. External invitations are supported. Unauthenticated HTTP returned 401. This confirms an access boundary, not a playable friends link or the contents of the current hosted build.
- The historically documented NAS routes `192.168.100.35:8880/games/` and `192.168.1.155:8080/games/daily/` both timed out outside the sandbox. The documentation conflicts on NAS path/container ownership. No NAS path, container, tunnel, DNS or route was changed; no target is safe to assume.
- The mandatory Mini-owned preview registry could not resolve its authority hostnames, including outside the sandbox. New allocation failed closed. Browser QA uses a private routed HTTPS test origin with local files; it opens no listening server and does not reuse another project’s port.

**Recommended next decision:** authorize updating the existing **owner-private Alford Daily Site** from this exact tested standalone candidate for James’s own preview, while preserving its current audience. This is preparation only; that authorization has not been given. After owner acceptance, separately approve the intended friend identities/audience before any invitation or permission change. No new domain or paid service is needed for that route.

Before that deployment: open the Site’s source through its supported workflow, inspect and preserve any newer hosted changes, transfer only the standalone runtime, save/deploy a matching verified version and keep the prior version for rollback. After deployment verify authenticated real gameplay, asset MIME/404 behavior, worker/download availability, interrupted play/reload and an actual phone. The proposed `play.cursedtoasterstudios.com` name is not a live test link.

NAS is an alternative only after James reconnects the correct home route and its actual serving root is inspected read-only. Do not execute the historical whole-portal deploy script, replace a shared index, open router ports or expose NAS administration for this test.

## Feedback loop

Start with a small explicitly invited cohort after distribution approval. Ask each person to try one featured game, return the next day, and copy a note for any favorite/confusing/broken experience. Count voluntary reports of completion and desire to replay; lack of a report is not abandonment data. Use a shared spoiler-free discussion only if James chooses it later; do not create a channel or send invitations now.

Before a broader/commercial launch: human puzzle review, dictionary/content rights documentation, physical iPhone/iPad and VoiceOver/large-text acceptance, and explicit distribution/commerce approval remain open gates.
