# Alford Daily — Mac reliability review, October 22, 2026

The current standalone Word Games product is **Alford Daily**. Its source is still in the historically named `Jbapckfan/family-game-portal` repository; its staged web and native runtimes are separate products from Family Portal and SpellSpark. This review improves the current 32-game collection without moving repositories, changing its visual identities, or removing creator credits.

## Source and isolation

- Exact starting revision: `6b5a09b4896aa606e6b668aaab2f917786d81911`.
- Local review branch: `review/alford-daily-reliability-2026-10-22`.
- Checkout: `/Users/jamesalford/Documents/Codex/2026-10-22/task-3/alford-daily-review`.
- This is an isolated clone. No existing project checkout, original source archive, user save, published branch, NAS, or domain was replaced. No push, merge, deployment, payment activation, signing change, or security configuration change occurred.
- The exact starting revision was independently compiled and passed 29 XCTest methods before editing. The final rebuilt bundle also passed all 29; an older GitHub workflow result is not used as evidence for this review.
- GPT-6 Astra reviewed gameplay/progression code, implemented the bounded Kimi fixes, and independently reviewed the shared save-runtime diff. This is additional to the previous recorded gameplay reviews, not a new claim that every game was manually solved in this session. No Opus run was performed.

## Fixed behavior

| Problem | Corrected behavior | Regression evidence |
| --- | --- | --- |
| Morph counted Give up as a daily completion, extended the streak, and played the victory sound. | Give up records no completion, clears the current daily streak, and does not play the victory sound. A genuine solve still extends the streak. | Actual hook callbacks, daily/practice isolation, prior statistics, repeat action, and genuine solve tests. |
| Cairn counted a finished five-level tower as a summit even when levels were skipped. | All five levels must be solved for completion credit. Skips clear the current daily streak and do not trigger the victory sound. Played/miss information remains recorded. | All-skipped, mixed, genuine summit, repeat callback, and practice tests. |
| Circuit retained yesterday's current streak after daily give-up. | Giving up clears only the current streak; real completion still advances it. | Seeded two-day streak becomes zero on give-up and three on a genuine solve; practice remains isolated. |
| A stale tab could overwrite another tab's completed board when that tab's board save succeeded but its ledger write failed. Even with a ledger, an old tab could show a terminal result beside an obsolete board. | Before mutations and when rendering/resuming, the shared runtime adopts a validated matching terminal save. It repairs a missing ledger through the existing persistence path and refuses conflicting recorded outcomes. | Partial-write failure, stale move/hint/reveal, malformed state, practice, storage event, visibility, back/forward cache, and listener cleanup tests. |
| Public staging's test fixture failed on this Mac because `/var` resolves through `/private/var`. | The fixture uses its real temporary path. The production symlink protections are unchanged. | Full staging regression now passes with the existing rejection checks. |
| The collection README described 5,842 records and did not clearly distinguish the standalone launch path. | Documents 8,001 records, finite/recombined content limitations, product separation, and the standalone staging/preview command. | Inventory tests, staged HTTP verification, and review against the current launch scripts. |

The shared runtime serves the six Claude, six DeepSeek, and six Qwen games. This change does not merge unfinished moves across tabs or provide cloud sync. It prevents a validated completed daily board from being replaced by stale actions. The visible timer's unchanged-state fast path avoids repeated writes; Astra checked 200 terminal refreshes and 100 practice refreshes.

Save namespaces, puzzle IDs, daily schedules, original source archives, attribution, prior best streaks, and historical completion data remain intact. Existing historical statistics are not retroactively rewritten: the fixes govern new result events. Previously completed or revealed games remain terminal. Browser UI testing used a separate loopback origin and simulator testing used a new dedicated simulator.

## Final verification

| Check | Result | Evidence beside the checkout |
| --- | --- | --- |
| Word Games JavaScript suite | **479 passed, zero failed** | `web-final-tests.log` |
| Kimi hook/package suite | **39 passed, zero failed** | `kimi-final-tests.log` |
| Launcher Python tests | **15 passed** | `launcher-tests.log` |
| HTTP verifier Python tests | **6 passed** | `http-verifier-tests.log` |
| Native Debug build and XCTest | **29 passed, zero failed**; includes offline WebKit launch of all 32 games | `native-final.log`, `AlfordDaily-final.xcresult` |
| Kimi production build | TypeScript, Vite and six-game staging succeeded | `kimi-final-build.log` |
| Native web parity | **263 files**, 32 entries and two shared runtimes, identical SHA-256/file sets | `bundle-sync-final.log` |
| Native project structure | 24 Swift files, two targets, two schemes, 29 XCTest methods | `native-structure-final.log` |
| Standalone build | **293 files**, only Alford Daily runtime | `standalone-stage-final.log` |
| HTTP asset/route verification | All 32 games, 8,001 records and **292 exact assets/launch routes** verified on loopback | `local-http-final.log` |
| Daily scheduling | **960 actual selections**, 30 distinct IDs per game, October 23–November 21 | `daily-schedule.log` |
| Deterministic content checks | All eight original content generators/syntax checks and both imported expansion generators passed | `original-content-checks.log`, `imported-content-check.log`, `claude-content-check.log` |

The 119 engine tests run separately by Astra and the 24 shared-runtime tests are subsets of the 479; they are not added again. The schedule and generator checks are separate checks, not extra unit-test counts. Red/green regression logs are preserved beside the checkout.

Native execution used Xcode 27.1, iOS 27.0, and the dedicated iPhone 18 Pro simulator `18B4613E-5670-4E23-810A-3F88FD501EC0`, named `Alford Daily Review 2026-10-22`. Derived data is in `../AlfordDailyDerivedData`. `CODE_SIGNING_ALLOWED=NO` was a command-line test setting. No global Xcode selection or shared simulator service was changed. Other projects' running simulators were left alone.

The Kimi build retains the existing large dictionary-chunk size advisory. Dependency installation reported nine advisories (two moderate, seven high); their relevance/exposure was not assessed in this task and no dependency/security upgrades were applied. This is a separate release-review item, not a claim of nine exploitable production defects.

### Reproduction commands

Run from the checkout root:

```sh
node --test --test-isolation=none games/*/tests/*.test.mjs games/*/*.test.mjs scripts/*.test.mjs
npm --prefix packages/kimi-pebbles test
npm --prefix packages/kimi-pebbles run build
node scripts/sync-ios-web.mjs
node scripts/sync-ios-web.mjs --check
python3 ios/scripts/validate_project.py
python3 -m unittest discover -s tests -p 'test_launch_ios.py'
python3 scripts/verify-nas.test.py
node scripts/verify-30-days.mjs
```

Native verification, with the review simulator available and a new result-bundle path:

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild test \
  -project ios/AlfordDaily.xcodeproj -scheme AlfordDaily -configuration Debug \
  -destination 'platform=iOS Simulator,id=18B4613E-5670-4E23-810A-3F88FD501EC0' \
  -destination-timeout 120 -derivedDataPath ../AlfordDailyDerivedData \
  -resultBundlePath ../AlfordDaily-next-review.xcresult CODE_SIGNING_ALLOWED=NO
```

### Browser observations

The standalone home showed the 32 games, five creator groups and current content count. Morph Give up showed one played, zero completed and zero streak. In two Rung tabs, revealing the daily in one restored the same revealed board and a clear status message in the older tab without a reload. Rung practice accepted `SAFE → SALE`, retained the move after reload/reopening Practice, and did not alter the revealed daily result. The final Cairn build was exercised by giving up across all five levels; it showed “Stack finished,” followed by Statistics with one played, zero summits, zero percent summit rate and zero streak.

Desktop browser screenshots were visually inspected. A viewport override did not produce a verifiable mobile-sized screenshot, so no mobile layout certification is claimed. No physical-device or VoiceOver run was performed. During Morph review, the generated reveal route included `SEAN`; this is a concrete editorial item to assess against the intended word policy, not a reason to silently replace the unresolved dictionary. The delayed result modal can also overlap an already-open statistics modal; modal coordination is a follow-up polish item.

## Launch the reviewed standalone build

The final staged artifact is `../preview-final`. From the checkout root:

```sh
python3 scripts/open-preview.py ../preview-final --port 18765
```

Use the same origin on later visits to retain browser-local saves. Port 18765 was chosen solely for this isolated review because the usual 8765 was already occupied; the pre-existing service was not stopped. A separate domain, port, browser, or native app has separate progress. `file:` loading is not supported. No new live friends URL has been established by this review.

To create another standalone build, choose a new or empty absolute workspace path:

```sh
node scripts/stage-site.mjs "$PWD/dist/alford-daily-next-preview"
python3 scripts/open-preview.py "$PWD/dist/alford-daily-next-preview"
```

The native entry is `ios/AlfordDaily.xcodeproj`, scheme `AlfordDaily`. The simulator product is runnable locally; this is not a signed device/App Store release.

## Commercial-readiness priorities

These are recommendations and release gates, not newly implemented product behavior or promises of revenue. The existing [brand/monetization strategy](../BRAND-AND-MONETIZATION-STRATEGY.md) remains the planning reference.

1. **Establish one standalone release and save origin.** Choose a dedicated Alford Daily endpoint and verify the exact staged bytes there. Keep Family Portal and SpellSpark separate. Specify how existing testers retain/export progress before changing their origin. Hosting, domain configuration, deployment and signing remain outside this task.
2. **Resolve content rights and editorial quality before commercial distribution.** Kimi's [provenance note](../../sources/kimi/README.md) explicitly leaves dictionary distribution permission unresolved; Claude's [note](../../sources/claude/README.md) also calls for imported-list and semantic-content review. Preserve original attributions and notices. If a cleared replacement dictionary is required, revalidate every affected bank/solution path and preserve published puzzle/save identity deliberately. Review proper names, obscure mandatory words, ambiguous clue alternatives and unacceptable entries. A machine-solvable board is not automatically a fair human puzzle.
3. **Finish trust and access checks.** Test real phones, touch targets, VoiceOver, keyboard-only play, zoom, reduced motion and interrupted/reopened sessions. Extend the save-race strategy to the separate Kimi/original runtimes if reproductions warrant it; this patch only changes terminal synchronization for the shared 18-game runtime. Triage dependency advisories in a separately scoped security maintenance pass. Resolve the overlapping statistics/result modal before polishing animations.
4. **Measure a free beta with the full collection available.** Use the existing tester guide to record first-play comprehension, completion time, hint/reveal rate, common-word rejections, repeat visits and favorite games. Track these with voluntary feedback before adding analytics. Select the strongest introduction from human results. A curated three-game daily ritual is a reasonable experiment to discuss, not an approved default added here.
5. **Define the paid product before implementing it.** The existing Collection One proposal needs explicit included games, archive/content period, update promise, support and refund/restore expectations. Validate willingness to pay for that concrete offer; current pricing documents are hypotheses. `PurchaseManager.current` remains disabled. The existing debug Remove Ads nonconsumable is not a Collection One unlock and must not be presented as one. No billing or entitlement work was activated.
6. **Operate a repeatable editorial release process.** Keep deterministic content generation, whole-bank solvability tests, actual selector checks from the planned launch date, bundle parity and native/WebKit tests as release gates. Add human approval for the next content window and track reused words/clues, since 8,001 prepared records include recombinations. Re-run against the exact release revision; old green native CI does not certify a new catalog.

No authorized implementation action remains blocked. Public hosting, commercial clearance, actual-device accessibility, purchase design and any independent Opus review remain uncompleted release work. They are not implied by this local code/test handoff.
