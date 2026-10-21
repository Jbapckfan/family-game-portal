# Alford Daily: monetization for the unified collection

## Recommendation

Launch one free daily-puzzle app with one permanent **Remove Ads** purchase covering every creator and every game. Start with a **$5.99 US price hypothesis**, then test $4.99 and $6.99 after enough real usage exists to compare conversion and retained revenue. These are proposed prices, not configured products or evidence of willingness to pay.

Keep all creator credits visible after purchase. The paid version should never imply that it changes who made a game. The separate Pebbles and Foreword demo purchase systems are not active in Alford Daily. Advertising, tracking, and production purchases remain disabled in the current build.

The collection now offers 32 games, but its public introduction should feature a small, memorable selection. Test four to six favorites on the opening screen, with the complete collection available behind it. This is a future presentation experiment; the current app shows the complete attributed collection and creator filters. Quantity alone does not establish demand or publisher interest.

## What free and paid players receive

| Experience | Free daily app | Permanent Remove Ads |
|---|---|---|
| Daily puzzles across the collection | Included | Included |
| Original creator and completion credits | Visible | Visible |
| Local records, streaks, sharing and offline play | Included | Included |
| Built-in help and a route to a solution | Included | Included |
| Ads | Limited placements between completed games | Removed throughout the app |
| Practice | Generous included access at launch | Included |
| Future premium collections or archives | Decide after testing ongoing demand | Define separately before selling them |

Do not sell a promise of unlimited new puzzles while banks still repeat. Twelve new DeepSeek/Qwen games currently rotate through thirty prepared records each. The full collection contains 5,842 prepared daily records, counting Keystone's three arches as one daily set, but that aggregate does not mean years of unique daily content in each game. A recurring subscription would need a dependable continuing editorial service and a clearly described additional benefit.

Apple provides non-consumable purchases for durable unlocks and StoreKit for purchase/entitlement handling. Use one app-wide product and a visible Restore Purchases action. The actual App Store product, signing, transaction verification, refunds/revocations, interrupted purchases, family-sharing choice, and device testing remain release work. [Apple In-App Purchase](https://developer.apple.com/in-app-purchase/)

## Advertising design

The proposed first experiment is a small ad placement after a completed game, with a conservative session cap. A reasonable starting policy to test is no full-screen ad before the first completed puzzle, at most one after the second completion, and no more than two full-screen ads in a visit. Do not interrupt an active timer, hide a clue, move a tile, or place a close button beside a game control.

Use contextual advertising first and assess what the chosen SDK actually collects. An ad SDK can introduce tracking even when the app developer does not directly use that capability. Apple requires permission for tracking under its definition, and privacy disclosures must include third-party partners' data collection. Select and configure the SDK before updating the app's privacy disclosures; the current no-ad build does not establish the disclosures for an ad-supported release. [User privacy and data use](https://developer.apple.com/app-store/user-privacy-and-data-use/) · [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)

Optional rewarded ads could later unlock an extra practice puzzle. Do not make an ad the only way to understand a rule, recover a dead end, or see a solution. All game logic should work when an ad cannot load or the device is offline. The permanent entitlement must suppress ad requests as well as visible placements.

## Economics: explicit scenarios, not forecasts

Model advertising with measured inputs:

`monthly ad revenue = daily active players × free-player share × ad opportunities per free player per day × fill rate × 30 ÷ 1,000 × effective CPM`

For illustration only, assume 95% of daily players use the free version, two eligible ad opportunities per free player per day, 80% fill, and an effective CPM of $4:

| Daily active players | Served impressions/month | Illustrative monthly ad revenue |
|---:|---:|---:|
| 1,000 | 45,600 | $182.40 |
| 10,000 | 456,000 | $1,824.00 |
| 50,000 | 2,280,000 | $9,120.00 |

The assumed CPM is an input for sensitivity analysis, not a current market quote. At 10,000 daily players, changing that assumption to $1 or $8 changes the result to $456 or $3,648 per month. Geography, ad format, season, advertiser demand, consent, fill, and actual session behavior can materially change outcomes.

For the permanent purchase, an illustrative 10,000 new users in a month at a 2% purchase conversion produces 200 purchases. At $5.99, that is $1,198 in gross purchase revenue. A hypothetical 15% store commission leaves $1,018.30 before applicable taxes, refunds, acquisition, editorial work, support, and other expenses. This is one-time sales revenue; the same customers do not pay again next month.

Apple's Small Business Program advertises a reduced 15% commission for qualifying paid apps and in-app purchases. Eligibility, enrollment, storefront, and other applicable commercial terms must be checked for the actual account; this illustrative calculation does not assert that every sale uses that rate. [Small Business Program](https://developer.apple.com/app-store/small-business-program/)

## What to measure first

Run an ad-free family/TestFlight pilot before tuning prices. Measure whether players understand the rules, finish a first puzzle, return the next day and following week, choose another game, use a hint, and abandon a specific mechanic. Separate puzzle difficulty from interface confusion. An unsolved daily may be fair; a legal move that silently strands a supposedly recoverable game is a defect.

App Store Connect provides engagement, retention, sales, and proceeds measurements. Supplement only what is needed to compare games and completion flows, with an explicit privacy design. The current app does not send custom gameplay analytics. [App Store Connect analytics](https://developer.apple.com/app-store-connect/analytics/)

Advance the monetization experiment only when users return without being prompted. Compare retention as well as immediate ad income: an aggressive placement can raise revenue per session while reducing the number of future sessions. Preserve a no-ad comparison cohort when testing placements. Avoid announcing a universal conversion or retention target before there is a usable pilot baseline.

## Release sequence

1. Complete family testing, human editorial review, and imported dictionary/content distribution-rights checks. The Kimi and Claude banks contain generated or broad dictionary material; machine solvability is not semantic or audience approval.
2. Select the public-facing featured games from observed use, improve their instructions, and prepare a nonrepeating editorial calendar. Keep all creator labels and the full collection available.
3. Configure the Apple developer account, signed device build, TestFlight distribution, support/privacy pages, and App Store metadata. The current simulator artifact is not an installable signed iPhone release.
4. Configure one StoreKit non-consumable and verify purchase, restoration, offline entitlement, cancellation, refund/revocation, and reinstall behavior on real devices.
5. Add the chosen advertising SDK behind the verified app-wide entitlement. Re-test privacy behavior, failure/offline paths, and the native app's game resource restrictions.
6. Introduce the limited ad experiment and evaluate return rates before increasing exposure or considering an archive subscription.

Apple assesses app completeness, accurate metadata, useful native functionality, and copycat concerns under its review guidelines. The unified app already includes offline play, native navigation and records, sharing, haptics, and optional reminders; those features still require device review and do not guarantee approval. Hunch and Quartet use familiar existing formats, so marketing should emphasize the collection's actual distinctive experiences without claiming every mechanic is new. [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

Sources checked during this integration on October 20–21, 2026. Product choices, price experiments, and economic scenarios above are recommendations and assumptions, not Apple requirements or revenue projections.
