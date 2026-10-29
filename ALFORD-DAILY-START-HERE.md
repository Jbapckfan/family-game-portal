> **October29,2026 verified build:** all32 daily games + nine-board bonus; six-month calendar through April28,2027. Start with [the current verification report](docs/SIX-MONTH-VERIFICATION.md). Older release notes below describe earlier checkpoints.

# Alford Daily — start here

## Local full-collection candidate — October 28, 2026

All 32 daily games and the nine-board bonus received individual input, feedback, keyboard or save-recovery refinements. The [33-game change and verification report](docs/reviews/MAKER-Codex__2026-10-28-full-collection.md) records 66 completed browser cases with unfinished/completed reloads, 617 JavaScript tests, real offline lifecycle checks and the matching unsigned iPhone bundle. The exact packaged source revision is in `SOURCE-COMMIT.txt` inside the new local ZIP.

This candidate has not been deployed or installed on a device. Human puzzle review and physical-device/assistive-technology comfort checks remain open. The report also records the known Minor practice-draft restart issue. The October 22 release history below remains historical.

## Current collection — October 22, 2026

Alford Daily now includes **32 games and 8,001 prepared puzzles**, with **at least 120 in every game**. The individual game designs from the completed UI release are retained. Puzzle counts appear on the collection cards; Practice makes the full banks available immediately. Existing boards and IDs are preserved, and the shared runtime keeps saved daily boards attached to their original puzzle when a bank grows.

The small imported banks enter their expanded daily rotation on October 23 at midnight in America/Chicago. Earlier daily assignments remain unchanged. The [full inventory](docs/puzzle-inventory.json) and [content and verification record](docs/verification-puzzles-2026-10-22.md) describe the finite curated pools and meaningful combinations.

The current [reviewed release state](docs/RELEASE-STATE.md) records actual GPT-6 Astra play of all 32 games, targeted balance fixes, 509 passing automated tests and the executed 30-day daily schedule. The independent Opus 5.5 review remains pending. Use the [complete Codex terminal prompt](docs/CODEX-TERMINAL-PROMPT.md), [NAS/domain guide](docs/NAS-AND-DOMAIN-DEPLOYMENT.md) and [commercial launch plan](docs/COMMERCIAL-LAUNCH-PLAN.md) to continue from this release.

The [brand and monetization strategy](docs/BRAND-AND-MONETIZATION-STRATEGY.md) recommends Alford Daily as the product, Cursed Toaster Studios as publisher, and a free beta followed by a defined Collection One purchase. Naming alternatives were screened for obvious conflicts; no legal clearance or paid-feature implementation is claimed.

**NAS publishing is pending a working connection.** The connected Mac was offline during this handoff; a direct request from the workspace returned a gateway error. The private Site and GitHub source do not establish a live NAS deployment. Use the [reviewed NAS deployment procedure](docs/integration.md#nas-deployment) from a connected Mac; its HTTP checks verify all game assets before it reports success.

## Archived October 20 launch handoff

The following six-game launch record is historical. Current game counts and release status are in the section above.

Release handoff: October 20, 2026.

**Status: six playable games and a successfully compiled iOS development app. Not yet a signed device build, TestFlight release, App Store release, or revenue-generating product.**

## Play and source

- Private playable collection: https://alford-daily.jbapckfan.chatgpt.site
- Private source repository: https://github.com/Jbapckfan/family-game-portal
- Native project: `ios/AlfordDaily.xcodeproj`; shared scheme: `AlfordDaily`.
- The web collection retains Tradeoff and Inbetween as classics. The iOS launch contains the six newer games below.

## The six launch games

| Game | Rules in one sentence | Prepared boards |
| --- | --- | ---: |
| Ringcount — flagship | Cut a fixed ring of twelve numbers into four arcs with the same target sum; arc lengths may differ. | 90 |
| Switchpath — flagship | Visit all sixteen grid cells once, moving orthogonally and alternating higher/lower values from S to E. | 90 |
| Shortlist | Use up to three two-letter presence scans to identify one secret among twelve candidate words, then make a final pick. | 90 |
| Sideways | Rotate five four-letter strips until four clued words read vertically. | 90 |
| Counterpart | Complete five directed analogies from a shared ten-word bank. | 30 |
| Second Sense | Pair noun and verb definitions and type the single word satisfying both meanings. | 30 |

Total: 420 prepared boards in the iOS app, not 420 fresh days for each game. The two semantic collections repeat after 30 daily selections; the others after 90. A 90-day reserve for every game requires 60 more Counterpart boards and 60 more Second Sense boards. Preserve existing puzzle IDs and daily mappings when extending content.

The daily timezone is America/Chicago. These are short-session puzzles, not forced countdown games. Practice remains separate from daily scores; a reveal is never counted as a solve.

## What is implemented in the app

The SwiftUI app has native Today, Record and Settings screens, local results and streaks, native share sheets, haptics, and an opt-in local reminder. All six game runtimes and their prepared data are bundled locally. The game boards retain their JavaScript engines and render in WKWebView through a restricted `alford://app/` origin; this is not a rewrite of every game board in SwiftUI.

There is no gameplay server, account requirement, analytics SDK, ad SDK, live ad serving, or live purchase product. StoreKit 2 entitlement support and a separate local-testing scheme are present, but commerce is disabled in the normal app. No physical phone installation or Apple account change was performed by this release handoff.

## Build evidence

The existing macOS workflow was rechecked during this handoff:

- [Successful Xcode build and native/WebKit tests](https://github.com/Jbapckfan/family-game-portal/actions/runs/39465807033).
- Tested runtime commit: `7e96eeec194bedd17b3cf13ffbbfd09a7f7f15cb`.
- Twenty native tests completed with zero failures, including loading all six bundled games through the production WebKit host.
- Snapshot `7a8309fe6abf66df818e6262f2e01cdcf7ba0bfb` differs from that tested commit only in verification documentation. This handoff adds launch tooling and documentation, not game or native runtime changes.
- [Simulator build artifact](https://github.com/Jbapckfan/family-game-portal/actions/runs/39465807033/artifacts/12284723940).
- [Test results and build log](https://github.com/Jbapckfan/family-game-portal/actions/runs/39465807033/artifacts/12285028563).

Both artifacts were available when checked and expire November 3, 2026. The simulator build is Intel/x86_64, not an iPhone IPA and not the right binary for an Apple-silicon simulator. Rebuild the source in Xcode on the target Mac. The private source remains after temporary artifacts expire.

The prior release verification records 207 web engine/content/interface tests and four bundle-sync regression tests. See [the complete verification report](docs/verification-2026-10-20.md). This handoff does not relabel those earlier tests as a fresh local run.

## Open the app on your Mac

With this repository already checked out, run:

```bash
bash scripts/launch-ios.command "$PWD"
```

The same launcher can be downloaded separately and run without a checkout:

```bash
bash ~/Downloads/Open-Alford-Daily.command
```

It defaults to `~/Projects/AlfordDaily`, uses your existing GitHub authentication, and opens the exact Xcode project. It checks for macOS and usable Xcode, validates the project, and runs the bundle parity check when Node is available. It does not install tools, accept licenses, change signing settings, reset Git history, stash work, upload a build, or enable monetization.

Existing destinations must be the correct repository root, clean, on main, and eligible for a fast-forward. Local work, untracked files, other repositories, detached/feature branches, local-only commits, and symlink destinations are refused rather than overwritten. Choose a new destination or resolve the reported condition yourself.

In Xcode, choose **AlfordDaily**, select an installed iPhone Simulator, and Run. For an actual phone, choose your Apple development team and a valid bundle identifier under Signing & Capabilities, select the connected phone, and Run. Distribution signing and App Store Connect are separate steps.

Launcher verification: 15 regression tests were first observed failing because the launcher was absent, then passing after implementation. The tests use real isolated Git repositories and stub Apple tools; they prove the launcher's safety/control flow, not an additional native build or installation. Run them with:

```bash
python3 -m unittest discover -s tests -p 'test_launch_ios.py'
bash -n scripts/launch-ios.command
```

## Fairness and solvability

Ringcount has one valid cut set per supplied board, checked against all 495 possible four-cut sets. Sideways has one intended answer arrangement among all 1,024 row orientations per board. Switchpath has one complete route per supplied board and tested recovery from every legal unfinished route. Reversible moves prevent an ordinary wrong move from permanently breaking these puzzles.

Every Shortlist secret has a winning information-gathering strategy within three scans. A poor choice of scans can still lose; solvable does not mean automatically won. Counterpart and Second Sense have validated authored mappings, but natural-language ambiguity cannot be eliminated by asserting that an answer key exists. Independent editorial review and blind playtests remain necessary.

## Commercial recommendation

Launch the private beta without ads. For a commercial launch, keep all six daily games free and test a single permanent **Remove Ads** non-consumable, starting at **US $6.99** against **$4.99**. These are proposed tests, not configured prices or proven optima. Display the localized StoreKit price and provide Restore Purchases. Do not promise unlimited future editorial content as part of ad removal.

Test ads only at a natural transition after the player leaves the result screen: no first-session interstitial, no mid-puzzle ads, no ad between a move and its feedback, and no pay-to-save-a-streak mechanic. A conservative initial cap is one ad after three completed games, at least five minutes apart, and no more than two daily. Keep useful hints free. Treat these caps as product hypotheses to measure, not platform requirements.

Do not start with a subscription. Establish voluntary return visits, completion/solve-time distributions, and editorial capacity first. Later sell clearly defined additional puzzle packs only if players ask for more; do not remove previously promised features from existing purchasers.

Illustrative economics, not a forecast: 10,000 average daily users x 30 days x 85% free active-player share x 1.2 eligible ad opportunities per free player-day x 90% displayed-impression rate x $5 realized publisher eCPM / 1,000 = $1,377 monthly ad revenue. Separately, 1,000 new $6.99 purchases x 85% after an assumed 15% store commission = $5,941.50. Combined: $7,318.50 before taxes, refunds, content, support, acquisition and other costs. Existing paid users do not buy again each month. None of the traffic, conversion, display rate or eCPM assumptions has been measured for this app.

[Apple's non-consumable definition](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-types) fits permanent ad removal. [Small Business Program](https://developer.apple.com/app-store/small-business-program/) participation and the applicable storefront agreement determine actual commissions; 15% is not automatic. [AdMob's interstitial guidance](https://developers.google.com/admob/ios/interstitial) favors natural breaks. [Apple review requirements](https://developer.apple.com/app-store/review/guidelines/) require appropriate ads, clear dismissal/reporting and an app experience beyond a collection of website links.

## NYT portfolio fit, without copying

The current [NYT Games listing](https://apps.apple.com/us/app/nyt-games-wordle-crossword/id307569751) describes Crossword, Mini, Midi, Wordle, Connections, Spelling Bee, Sudoku, Strands, Pips, Tiles and Letter Boxed. Its mixture of word knowledge, deduction, numbers and tactile pattern play supports a similar breadth of experiences here, not copied rules, assets or branding. The six-game collection adds directed analogies, dual meanings, information scans, cyclic row alignment, ring partitioning and alternating-value pathfinding. Originality of each broad genre, trademark clearance, commercial enjoyment and publisher interest are not established by a working build.

## Remaining release gates

1. Select the owner's signing team and app identity, run on physical iPhone/iPad, and test VoiceOver, interruption/recovery, safe areas and supported OS versions.
2. Create/configure the App Store Connect app; complete owner-controlled agreements and account requirements, upload a signed build, and satisfy TestFlight review where applicable.
3. Blind-test the games, especially semantic alternatives and first-time rule comprehension. Add the 120 semantic boards needed for the proposed 90-day reserve.
4. Before enabling revenue, integrate the chosen ad provider and real StoreKit product; test cancellation, pending approval, restoration, refunds/revocation and offline behavior. Update privacy disclosures for the actual SDK behavior.
5. Complete support/privacy URLs, screenshots, age rating, store copy and review notes. No App Store approval is claimed.

The connected Mac was offline when checked during this handoff. That also prevents updating the home NAS from this session. From the home network, review local changes and then use the existing deployment process:

```bash
ssh Jbapckfan@192.168.1.155
cd /volume1/docker/family-game-portal
git status --short
# Continue only after reviewing and preserving any local changes.
git pull --ff-only
docker compose restart game-portal
```

The portal catalog and source are already committed. A GitHub push alone is not a NAS deployment.

For details, see [iOS architecture and build instructions](ios/README.md), [monetization strategy](docs/ios-launch-and-monetization.md), and [portal integration](docs/integration.md).
