# Alford Daily: six-game iOS launch and monetization

Research date: October 20, 2026. This is a product and implementation plan, not a claim of App Store approval or a revenue forecast. No paid service, store product, ad account, or developer membership is created by this document.

## Launch scope

The iOS launch contains the six new games. Ringcount and Switchpath are the flagship pair: their rules are short, the actions are tactile, and neither requires English vocabulary. The other four add word deduction, meanings, and spatial word reasoning. The web collection can continue to show all eight games, with Tradeoff and Inbetween presented as family classics.

| iOS game | Role | Core action | Current boards |
| --- | --- | --- | ---: |
| Ringcount | Flagship | Partition a fixed number ring into four equal sums | 90 |
| Switchpath | Flagship | Trace a complete route with alternating higher/lower values | 90 |
| Counterpart | Semantic challenge | Match ordered word relationships | 30 |
| Shortlist | Fast deduction | Choose letter scans before one final word pick | 90 |
| Second Sense | Meaning challenge | Pair two senses and retrieve their shared word | 30 |
| Sideways | Spatial word puzzle | Rotate rows to satisfy four vertical word clues | 90 |
| **iOS collection** | | | **420** |

Tradeoff's 90 boards and Inbetween's 60 boards remain available through the family portal. The full web collection therefore has 570 boards. These counts describe the checked-in collections, not days of unique content across every game. The two 30-board semantic libraries begin repeating on their 31st daily selection. A 90-day reserve for all six launch games requires 120 additional authored semantic boards.

## App experience and implementation direction

Lead the Today screen with Ringcount and Switchpath, followed by the four companion games. Let players enjoy one daily or several; do not turn six games into an obligation. Keep a consistent place for practice, results, accessibility settings, help, and ad removal.

A practical first iOS implementation can retain the tested JavaScript engines and bundle the game files locally, with native navigation, durable storage integration, StoreKit, and a native share sheet. Bundle the initial puzzle reserve for offline use. A later content feed should deliver versioned puzzle data, while rule changes go through normal app updates. Treat content IDs, saved-state schemas, and daily dates as stable contracts so an update cannot alter a started board.

Apple's [minimum functionality guideline](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality) requires an experience beyond a repackaged website; a collection of links is insufficient. Our design response is a complete offline-capable puzzle product with reliable progress, accessible controls, and integrated purchases. That is a product direction, not an assurance that a particular wrapper will pass review.

The native build needs its own device verification. Browser tests do not establish VoiceOver behavior, interrupted purchase handling, background/foreground recovery, safe-area layout, or persistence after an iOS update. Keep purchase entitlement separate from game progress: clearing puzzle history must never remove a paid entitlement, and a purchase failure must never erase a game.

## Recommended commercial model

Offer all six daily games free, supported by restrained ads, with one permanent **Remove Ads** purchase covering the collection. Start without a subscription. A continuing subscription would create an editorial commitment before the content operation has been established, whereas permanent ad removal is a clear, narrow benefit.

An initial US price test can compare a small number of options, such as $4.99 and $6.99. These are proposed experiments, not established optimal prices or configured products. Use the localized price returned by StoreKit in the app. Do not advertise a lifetime supply of new puzzles: the purchased benefit is permanent ad removal for this app, with the included content and future content policy described accurately.

For the first ad experiment, give the first session without interstitials, require several completed rounds before an ad becomes eligible, and impose a time-based frequency cap. A starting product hypothesis is no more than one interstitial after three completed games and no more than one per five minutes. Those limits are our proposed restraint, not platform rules. Measure whether they damage return visits before increasing frequency.

Show an eligible ad only after the player has finished reviewing the result screen, at a natural transition back to the collection. Never insert it between a move and its feedback, while a player is reading a clue, or while opening the next puzzle. [AdMob recommends natural breaks](https://developers.google.com/admob/ios/interstitial). Apple's [advertising guideline](https://developer.apple.com/app-store/review/guidelines/#software-requirements) requires clear ad identification, accessible close/skip controls, age-appropriate ads, and a way to report inappropriate ads. Keep useful hints available without creating an artificial obstacle to sell relief.

## StoreKit purchase contract

Configure Remove Ads as a **non-consumable**. Apple's [purchase-type reference](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-types) defines that as a one-time purchase without expiry or depletion. Use a stable product identifier and one entitlement for all six games.

On launch, observe verified transactions and read [`Transaction.currentEntitlements`](https://developer.apple.com/documentation/storekit/transaction/currententitlements). That sequence includes owned non-consumables and excludes refunded or revoked products. Handle success, cancellation, and pending purchases distinctly; a pending result is not an unlock. Finish a verified successful transaction after enabling its benefit. See Apple's [`Product.PurchaseResult`](https://developer.apple.com/documentation/storekit/product/purchaseresult) and [`Transaction.finish()`](https://developer.apple.com/documentation/storekit/transaction/finish()).

Provide Restore Purchases in settings. Normal entitlement refresh should work without prompting. [`AppStore.sync()`](https://developer.apple.com/documentation/storekit/appstore/sync()) is the explicit recovery path; Apple says it can request authentication and should be called only after a user action. A failed network refresh should not be treated as evidence that a previously verified purchase was revoked. The implementation must distinguish unavailable verification from an authoritative revocation.

Test purchase success, user cancellation, pending approval, reinstall/new-device restoration, refund/revocation, and offline launch. Apple supports optional [Family Sharing for non-consumables](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/turn-on-family-sharing-for-in-app-purchases/); decide that product promise before release rather than implying that every family member automatically receives the purchase.

The Apple account holder must accept the Paid Apps agreement and supply banking/tax information before offering purchases. Those are actual account setup steps described in Apple's [configuration overview](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/), not tasks to simulate inside the prototype.

## Privacy, tracking, and the ad SDK

Prefer a launch design that does not track people across companies. Contextual ads can fit that direction, but the SDK's actual behavior determines whether the app tracks. Apple requires [App Tracking Transparency permission](https://developer.apple.com/app-store/user-privacy-and-data-use/) before cross-company tracking or access to the advertising identifier. The developer remains responsible for included SDKs, including tracking they perform themselves; refusing permission cannot block game access. A web view used for app functionality follows the same rule.

Before adding an SDK, document what it transmits, which consent controls it needs, and whether it shares identifiers. Do not declare “no data collected” merely because game progress is local. Apple's [privacy disclosure guidance](https://developer.apple.com/app-store/app-privacy-details/) includes third-party practices and requires a publicly accessible privacy policy. Its [SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/) identify SDKs that need privacy manifests and, for applicable binary dependencies, signatures. Recheck the chosen SDK and version when integrating it.

Decide the app's actual intended age audience before selecting ad settings or a Kids Category listing. A family brand alone does not answer that question. Preserve an ad-free paid path, and disable ad loading and display whenever the verified Remove Ads entitlement is active.

## Costs and useful economics

Apple currently lists [Developer Program membership](https://developer.apple.com/programs/whats-included/) at $99 USD per membership year, or local currency where available, and publishes a standard 30% App Store commission with 15% for approved Small Business Program participants. Regional business terms can differ; the release storefronts and signed agreement determine the applicable rate.

The [Small Business Program](https://developer.apple.com/app-store/small-business-program/) can cover new developers and eligible existing developers with no more than $1 million in proceeds, aggregating associated accounts. Enrollment is required. If a participant exceeds the threshold during a year, the standard rate applies to subsequent sales. Eligibility is not established by this plan.

The following are simple commission-only illustrations, before taxes, refunds, adjustments, or operating costs:

| Hypothetical purchase price | After 15% commission | After 30% commission |
| ---: | ---: | ---: |
| $4.99 | $4.24 | $3.49 |
| $6.99 | $5.94 | $4.89 |

Actual profitability depends on conversion, retention, editorial cost, support, engineering, and acquisition cost. Ad income should be modeled from measured served impressions and realized net revenue per thousand impressions, rather than an assumed industry payout. Permanent ad removal also exchanges future ad revenue for a one-time receipt; evaluate that tradeoff using observed behavior.

## Release order

1. **Private iOS build:** package the six games, persistent progress, accessibility, offline content, and native navigation. Keep the two flagships prominent.
2. **TestFlight product test:** measure whether new players understand the rules, finish a first round, and return. Record solve-time distributions and ambiguous clues; the desired short session is a target, not a guaranteed duration.
3. **Editorial reserve:** expand the two semantic libraries and establish immutable release dates, validation, and correction procedures. Do not sell 420 boards as 420 fresh days for every game.
4. **Purchase and ad test:** use StoreKit test environments and test ad units; validate restoration, consent, refunds, frequency limits, and the paid ad-free state on devices.
5. **Store submission:** finish account setup, privacy policy, age rating, screenshots, review notes, support contact, and the selected price. Submit a complete product with the actual purchase and ad behavior described accurately.

The commercial test is whether people return for enjoyable, fair puzzles and find ad removal worth buying. Acquisition interest from NYT or another publisher is not a release requirement or a promised outcome.
