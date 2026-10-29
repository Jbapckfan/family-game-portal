# Alford Daily — reviewed release state

## Local full-collection candidate — October 28, 2026

The [full 33-game quality pass](reviews/MAKER-Codex__2026-10-28-full-collection.md) supersedes earlier local-only follow-ups for this candidate. Each daily game and the nine-board bonus has an individual change and real Chromium/WebKit play-and-reload evidence. Final results: 617 JavaScript tests, 66 full browser cases, 11 offline lifecycle checks, an unsigned iPhone build and 270 matching bundled runtime files. Source-assisted QA does not replace human editorial, device or assistive-technology review. One Minor practice-draft restart issue remains documented.

No publication, provider review transmission, audience change or device installation occurred. Published-release and earlier reviewer statements below are historical, not fresh evidence for this local candidate.

Prepared October 22, 2026. This is the source and local-verification record for the downloadable launch handoff. The package's `RELEASE-COMMIT.txt` identifies its exact published GitHub revision.

## Local Mac reliability follow-up

The isolated October 22 Mac review starts from revision `6b5a09b4896aa606e6b668aaab2f917786d81911`. It adds completion/save regressions and verifies the rebuilt 32-game app with Xcode and an isolated iOS simulator. See [the reliability review](reviews/2026-10-22-alford-daily-reliability.md) for exact test counts, launch instructions, local artifacts, and remaining commercial gates. This follow-up is local and does not change the published release or deployment status recorded below.

The subsequent local [dialog and input polish review](reviews/2026-10-22-alford-daily-overlay-polish.md) resolves competing delayed results/Statistics dialogs in the six Kimi games, restores keyboard focus, and checks the Morph picker at phone widths. It has a separate local patch/package and exact final-build verification. The first local review ZIP remains unchanged; neither follow-up changes published deployment status.

## Outcome

**32 playable games, 8,001 prepared puzzle or daily-set records, at least 120 in every game.** All 32 real daily selectors were executed for **October 23 through November 21, 2026**. Each selected 30 different puzzle IDs: **960 daily selections** in total. The generators preserve published puzzle prefixes and historical assignments. Practice exposes the full banks immediately.

These counts describe finite prepared records. Some games combine a smaller approved vocabulary or clue pool into different sets. They do not establish 8,001 wholly independent authored ideas, and the daily schedules eventually repeat. The detailed count and novelty qualifications are in [puzzle-inventory.json](puzzle-inventory.json), [daily-runway.json](daily-runway.json), and the [expansion checkpoint](verification-puzzles-2026-10-22.md).

## Requested model reviews

**GPT-6 Astra: performed.** Three explicitly selected `gpt-6-astra` reviewers divided the collection and played every game through actual browser controls to a visible win. Twenty-nine games have an unhinted, source-unassisted completed play in that pass; three cases require qualification:

- Dovetail used one in-game letter hint after an incorrect guess.
- Circuit used a first-word hint and then a source-assisted route. Its win proves the UI flow, not an independent blind solve.
- Memory Maze used the visible UI transcript to retain the route. It is not evidence of a human memory performance or a fair six-second study duration.

Kimi Tangle's initial attempt stopped below the old goal; a fresh practice board was then completed blind under the revised goal. Reports preserve both attempts. Original game and puzzle IDs, moves, outcomes, assistance and limits are recorded individually:

- [Eight originals plus four Qwen games](astra-review-originals-qwen-2026-10-22.md).
- [Six Kimi games plus Quadra and Syntax Siege](astra-review-kimi-qwen-2026-10-22.md).
- [Six DeepSeek games plus six Claude games](astra-review-deepseek-claude-2026-10-22.md).

**Claude Opus 5.5: not performed.** No authenticated Opus invocation tool, Claude CLI session, or Anthropic credential was available in this workspace. No other model's report is labelled Opus. The complete [Opus review prompt](OPUS-5.5-REVIEW-PROMPT.md) is ready for an authenticated terminal session. Source groups named Claude are creator attributions, not evidence that Opus reviewed this release.

## Changes from the gameplay review

| Area | Implemented change and reason |
| --- | --- |
| Territory Tactics | Replaced only 90 unpublished additions with two-group positions. A smaller legal capture is insufficient; players must choose a target of three or four. All require two moves, preserve the original 30 published boards, and are distinct under hex symmetries. Three new boards were won blind through the UI. |
| Territory feedback/help | Reports actual partial captures versus the goal, and instructions use the displayed goal. Deliberate decoy play showed “1 stone captured; 3 needed,” followed by successful restart. |
| Kimi Tangle | Gold now uses `min(18, max(8, round(maximumScore * 0.2)))`, with coherent bronze/silver thresholds. The old goal demanded too much of an unrestricted dictionary. Saved qualifying rounds reconcile completion once; word scores, grids, IDs and word banks are preserved. Fresh blind play reached 15 points with no hints or misses. |
| Twin Hive | Accepts the ordinary word EARS when its rack and both gold-letter constraints are satisfied. Submission, hints, revealed words and save restoration share the rule. The corrected UI accepted EARS and retained it after reload. |
| Circuit | Accepts PLUM on matching racks only when its alternating-arc rules are satisfied. Full-bank acceptance and restoration tests cover the change; par remains unchanged. Final UI practice #97 accepted PLUM, lit four letters and seeded M for the next word. |
| Accessible controls | Hunch exposes letter/key results in text; Tangle cells have row/column names and keyboard activation; Circuit identifies the arc in each tile's accessible name. Final browser checks verified Hunch's feedback labels, Circuit's arc labels and Tangle keyboard word entry. |
| Memory Maze | Study guidance remains truthful after the route disappears; both study and recall phases were checked. |
| Downloaded preview | Starts local HTTP at the stable origin `http://127.0.0.1:8765/`. Occupied ports fail clearly without killing a process or silently changing the save origin. |
| Public staging | Publishes only Alford Daily's runtime to a new/empty directory, with strict native-bundle parity and symlink checks. It cannot carry leftover private files or unrelated portal games into a new public deployment. |

Gentle warmups were preserved. Fast AI solves do not establish that a game is too easy for its intended human audience. The adjustments address observed unfairness or repeated trivial structure; broad difficulty calibration remains a task for the friends cohort.

## Fresh automated verification

- **475 passing tests across 55 JavaScript test files**, covering engines, content, saved state, common runtimes, collection counts, expansion, native bundle checks and public staging.
- **28 passing Kimi package tests**, including the new target, save migration, accepted-word and accessible-feedback regressions.
- **Six passing HTTP-verifier tests**, covering exact bytes, incorrect MIME types, stale success responses, redirects, directory routes and standalone inventory selection.
- **Total: 509 automated tests, zero failures.** Content certification and the 960 daily selections below are additional checks, not inflated into that total.
- All eight original generators and both imported-bank generators passed deterministic `--check` runs.
- The actual 32 daily selectors passed the 30-day uniqueness check.
- Kimi's TypeScript/Vite production build passed and reproduced the staged entry `index-HWQChMyM.js`. The existing large dictionary chunk produces a size advisory, not a build failure.
- Canonical and iOS runtime bundles match by SHA-256 and file set: **263 files, 32 game entries, two shared runtimes**.
- Native project structural validation passed: **24 Swift source files, two targets, two shared schemes, 29 XCTest methods**. Linux does not compile the Swift app or execute XCTest/WebKit. Check the exact release commit's macOS workflow result separately; those native checks are not counted in the 509 tests above.
- The standalone web build contains **293 files** and only the intended collection/runtime directories. Public staging's regression checks reject occupied outputs, linked output files, protected source destinations and stale native copies before changing an existing build.
- The deployment helper passed shell syntax validation. The Python tools compile. The proposed dedicated NAS Compose/Caddy configuration still needs execution and HTTP verification on the NAS.

All 32 pages opened with controls and Practice in the managed preview. Final changed-game retests used the rebuilt preview. Static directory promotion alone left the preview supervisor serving an earlier build; restarting the managed preview service resolved that environment issue. The direct command-line request to the cloud-only preview hostname timed out; no hosted byte-for-byte verification is claimed on that basis. The supplied verifier must still be run against the real deployment endpoint.

## Deployment status

**GitHub source publication and NAS deployment are separate actions.** Use the package's full release commit, not an old six-game handoff or an inferred branch SHA.

The authorized remote Mac, `MacBook-Pro-5.local`, was offline at the latest check. The private NAS address is not directly reachable from this cloud workspace as a verified game endpoint. No NAS files, containers, router settings, tunnel, or domain DNS records were changed here. No Internet-ready friends URL has been verified for the new release.

The existing studio website is live at `https://www.cursedtoasterstudios.com`, hosted through its public Cursed Toaster Studios Site. Its current `www` CNAME points to `custom-domains.chatgpt.site` and its authoritative DNS is at Porkbun. The proposed `https://play.cursedtoasterstudios.com/` is a deployment destination, **not yet a live game URL**. The separate existing Alford Daily Site was owner-private when inspected.

The handoff includes a reviewed existing-portal updater and a dedicated static-only NAS beta container. For public hosting, the deployment guide covers the existing Alford Site, a Porkbun-compatible static-hosting subdomain, and a NAS tunnel. It preserves the studio homepage and unrelated family-portal content.

## Remaining release work

1. Run the independent Opus review using the provided prompt and record the exact model and assistance.
2. Connect the Mac to the home network, deploy the selected revision and verify the NAS endpoint.
3. Configure the chosen friends hostname/access policy and verify it from outside the home network.
4. Test actual phones, touch behavior, VoiceOver/screen readers and key mobile layouts. Desktop browser checks and semantic labels are not a physical-device accessibility certification.
5. Run the 30-day human beta to measure difficulty, repeat interest, common-word omissions and content fatigue. AI play is a technical review, not a retention or demand study.
6. Before charging, finish editorial/rights review, support and privacy details, a defined content offer, and real entitlement/purchase/restore testing. Payments, subscriptions, ads, cross-device accounts and central analytics are not active in this build.

See the complete [terminal assignment](CODEX-TERMINAL-PROMPT.md), [deployment guide](NAS-AND-DOMAIN-DEPLOYMENT.md), [brand and monetization strategy](BRAND-AND-MONETIZATION-STRATEGY.md), [commercial plan](COMMERCIAL-LAUNCH-PLAN.md) and [tester guide](TESTER-GUIDE.md).
