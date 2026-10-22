# Prompt for Codex in the Mac terminal

Open Codex in the extracted package's `source/` directory, or in a clean checkout of the authoritative repository. Paste the complete prompt below. The package's `RELEASE-COMMIT.txt` identifies the verified source commit. Do not treat a downloaded source directory as a complete replacement for the existing family portal: unrelated portal games remain in the authoritative GitHub repository.

---

You are continuing James's **Alford Daily** release for **Cursed Toaster Studios**. Complete this existing project and its deployment; do not start a replacement app. Read this repository's instructions, `docs/RELEASE-STATE.md`, `docs/NAS-AND-DOMAIN-DEPLOYMENT.md`, `docs/BRAND-AND-MONETIZATION-STRATEGY.md`, `docs/COMMERCIAL-LAUNCH-PLAN.md`, the three `docs/astra-review-*-2026-10-22.md` reports, and `docs/verification-puzzles-2026-10-22.md` before changes.

## Goal and scope

Deliver a working friends-testing build of all 32 games, with distinctive but cohesive interfaces and at least 30 days of puzzles per game. Finish the pending independent Opus 5.5 review, fix evidence-backed fairness/difficulty problems, publish the verified build on my NAS, and establish a usable HTTPS friends link using my studio domain when the required accounts are available. Prepare and verify any blocked step as far as possible, then report the exact missing access. Do not pretend that a source push, local preview or successful HTTP homepage alone proves deployment.

The already-expanded banks contain **8,001 prepared records**, minimum **120 per game**. Many records recombine curated content, and all banks are finite. Do not inflate counts with duplicate IDs, rotations, cosmetic reshuffles or merely relabelled puzzles. Keep the existing creator credits and distinguish original concepts from completion/integration work.

The requested brand strategy recommends retaining Alford Daily, endorsed by Cursed Toaster Studios, with a free friends beta and a later $19.99 Collection One price experiment. The strategy is advisory: finish this free beta deployment without activating payments, imposing a new paywall, renaming games or promising unbuilt membership benefits. Display-name and commercial-offer implementation is a separate product decision.

## Authoritative locations

- GitHub: `https://github.com/Jbapckfan/family-game-portal` (private), branch `main`.
- My Mac checkout may be `~/Projects/AlfordDaily` or `~/Projects/nas-game-server`; inspect before assuming.
- NAS SSH: `Jbapckfan@192.168.1.155`.
- NAS checkout: `/volume1/docker/family-game-portal`.
- Existing Compose service: `game-portal`.
- Household URL: `http://192.168.1.155:8080/games/daily/`.
- Dedicated beta configuration: `deploy/nas-beta.compose.yml` and `deploy/Caddyfile.beta`; proposed NAS deployment root `/volume1/docker/alford-daily-beta`, port 8082.
- Existing studio: `https://www.cursedtoasterstudios.com`, currently public ChatGPT Sites hosting; authoritative DNS is Porkbun.
- Studio Site ID: `appgprj_6ac5d1526b7c8191899fe361c8d70d91`.
- Separate Alford Daily Site ID: `appgprj_6ad77f0216348191a061da38c4a431c4`; existing owner-private address `https://alford-daily.jbapckfan.chatgpt.site`.
- Preferred friends hostname: `play.cursedtoasterstudios.com`. Treat it as proposed until DNS, access and live content are verified.

## Preserve existing work

Inspect status, remotes, branch and current history. Preserve local changes and unrelated portal games. Use a separate checkout/worktree when needed; never run a blind hard reset, force push, bulk deletion, or the old broad `sync-to-nas.sh` import process. Preserve puzzle IDs, historical daily selection and stored progress. The first published records have preservation tests; newly corrected unpublished Territory additions are part of this release.

Use the existing GitHub repository as the integration target. This download contains all Alford Daily components but intentionally excludes unrelated family-portal games. Do not mirror its file set over the whole NAS checkout. Check the release commit and any newer work before merging. Do not commit credentials, local runtime state, dependency directories or scratch builds.

## Independent review and play

GPT-6 Astra has already played all 32 through the UI, with assistance and limitations recorded in the reports. Recheck any affected games after subsequent changes. If a fresh Astra pass is requested or required by new changes, use the actual GPT-6 Astra model available to this account, state the model used, and do not silently substitute another model.

The Opus pass is **pending**, because the handoff environment had no Claude tool, CLI or configured Anthropic authentication. Check whether Claude Code is already installed and authenticated on this Mac. If available, run the actual `claude-opus-5-5` model with `docs/OPUS-5.5-REVIEW-PROMPT.md`. Claude's documented model name was verified on October 22, 2026; verify current availability before invocation. Use an independent review context. Do not claim that Codex itself is Opus, and do not substitute an older Claude model without saying so.

Reviewers must play at least one complete practice attempt in **every** game using visible browser controls, inspect failures/recovery/hints, and distinguish blind play, hint-assisted play, source-assisted solutions, code analysis and untested behavior. For any changed or suspicious game, try additional representative boards. Record the game slug, puzzle ID or visible practice number, outcome, hints, wrong attempts, device/viewport and evidence. Do not count running engine tests as UI play. Do not claim AI timings establish human difficulty.

Use evidence for difficulty changes. Keep intentional easy warmups. Improve unclear clues, rejected valid words, excessive required obscure vocabulary, unhelpful feedback or trivial repeated structures. Preserve meaningful challenge and accessibility. Maintain finite-bank novelty and future daily scheduling. Verify fixes through the actual UI and targeted engine/persistence tests.

## Verify the release

Inspect existing test commands and pinned dependencies. Relevant commands include:

```bash
npm --prefix packages/kimi-pebbles ci
npm --prefix packages/kimi-pebbles test
node scripts/puzzle-inventory.mjs
node scripts/expand-imported-puzzles.mjs --check
node scripts/expand-claude-puzzles.mjs --check
node scripts/verify-30-days.mjs --write
node scripts/sync-ios-web.mjs
node scripts/sync-ios-web.mjs --check
python3 ios/scripts/validate_project.py
python3 scripts/verify-nas.test.py
node --test --test-isolation=none scripts/stage-site.test.mjs
```

Run the original-game and imported engine suites described in the release verification record. Rebuild Kimi with its pinned build script only if its source changed. That build replaces hashed assets; include required old-asset deletions and new files, then sync iOS. Do not leave stale wrappers referencing missing chunks. Run the 30-day audit again from the actual planned public launch date and document the date range. It must report 30 distinct daily IDs for each of 32 games.

Stage the public build with `scripts/stage-site.mjs` into an absolute, separate output directory. It verifies native/canonical runtime parity and excludes unrelated portal content. Check all 32 launch links and runtime assets. Use local HTTP rather than opening JavaScript modules with `file://`.

## Deploy on my NAS

Use the Mac's existing SSH authentication. Inspect reachability, current repository changes, Docker and port availability first. Update the existing portal using `scripts/deploy-nas.sh` with the full verified commit SHA, following the deployment document. The helper must pass its HTTP verification before reporting the LAN build live.

For external friends, stage a **dedicated Alford Daily web build** into a new versioned directory under `/volume1/docker/alford-daily-beta`. Validate the supplied Compose/Caddy files on the NAS, serve only that directory, and preserve the previous release for rollback. Do not expose the full portal root, NAS administration, SSH, or private files to create a game link. The template has no directory listing and no homepage fallback for missing JavaScript.

Verify the isolated LAN URL with:

```bash
python3 scripts/verify-nas.py http://192.168.1.155:8082 \
  --static-directory /ABSOLUTE/PATH/TO/THE/STAGED/WEB
```

## Establish the friends URL

Prefer keeping the existing studio homepage and publishing Alford Daily separately at `play.cursedtoasterstudios.com`. If the authenticated Sites tools are available, reuse the existing Alford Daily Site ID, deploy the exact verified source and configure the intended friends audience/custom domain. Its current owner-only preview must not be presented as publicly shareable.

For a terminal-managed static host, the guide includes Cloudflare Pages commands and Porkbun subdomain setup. Register the custom hostname in the hosting service before adding the exact returned CNAME/verification records. Inspect existing DNS records and preserve the studio's apex, `www`, email and verification records. Do not invent verification values. Do not move the entire domain's nameservers merely to create a beta link; if NAS tunnelling requires that broader migration, prepare the record-preservation plan and obtain a specific decision before changing it. A managed static subdomain avoids that migration.

A NAS tunnel is an alternative when its account/zone are configured. Route it only to the dedicated game service. Store its credentials outside Git. For a restricted beta, use an explicit friends allowlist; a noindex header is not access control. Never ask me to paste credentials into this prompt or a source file.

Verify the final HTTPS collection against the staged files, then use a real browser and a phone on cellular data to confirm opening, gameplay, reload/resume and navigation. If an access policy intentionally blocks command-line fetching, distinguish that boundary from a content failure and verify in an authenticated session. Do not send invitations or messages to friends automatically.

## Commercial work and final handoff

Use the supplied commercial plan as a proposal. Keep this beta free. Do not activate payments, advertising, subscriptions, analytics or App Store publication as an incidental deployment step. Complete concrete bug fixes and produce an honest commercial-readiness list, including imported-content rights/editorial review, accessibility, human difficulty testing and purchase work still required.

Return the exact source commit, actual model review status, per-game puzzle counts, dated 30-day scheduling result, test results, live LAN/public URLs and where each was verified. If access is missing, say precisely which step remains blocked and provide the ready command/configuration. Finish with the three shortest steps James needs to take next; do not label pending deployment or pending Opus play as complete.

---

Claude references: [model ID](https://platform.claude.com/docs/en/models/opus-5-5/overview), [model selection](https://code.claude.com/docs/en/model-config), [CLI reference](https://code.claude.com/docs/en/cli-reference).
