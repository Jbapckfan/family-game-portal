# Alford Daily commercial launch preparation

Prepare a free daily puzzle collection for the website and iPhone, with restrained advertising and an optional one-time ad-free purchase. Keep the complete beta available while James identifies the games he most wants to play again. This updates the earlier paid-collection strategy for his November 1 request; the prices and offers below are proposals to test.

The current production lineup has 32 daily games. Ten new prototypes are being developed separately as replacement candidates. James's keeper list and exact comments remain in [the ranking](../../game-reviews/RANKING.md); only he assigns enjoyment ratings.

## Recommended offer

| Offer | Player value | Commercial tradeoff | Decision |
|---|---|---|---|
| Free daily games with restrained ads, optional one-time ad removal | Easy to try, share and return; payment buys a clear permanent benefit | Advertising needs scale; one-time receipts do not fund unlimited future editorial work by themselves | Recommended first commercial experiment |
| Paid finite collection with free sampler | Clear content boundary and fewer ad dependencies | More friction before people discover their favorites; dependable web entitlements still needed | Keep as a fallback after price testing |
| Subscription | Can support continued editing and fresh content | Needs a credible ongoing service, proven repeat use and regular delivery | Revisit after retention and editorial capacity are demonstrated |
| Direct sponsorship | A publisher can buy a clearly labeled collection placement | Requires actual audience evidence and a sales/support process | Later option; no assumed sponsor revenue |

Use **$6.99 once** as the initial ad-removal price hypothesis for research, with $4.99 and $9.99 as comparison offers. These are unvalidated prices, not configured products or promises. Localize the actual price in each store. Do not activate a subscription for a finite prepared bank alone.

Keep Daily and the included Practice collections free, along with fair dictionaries, useful rules, progress and result sharing. Avoid ad interruptions during a word, clue, move or result reveal. Start the website experiment with a clearly labeled placement below the collection or after results, away from controls. Begin with no full-screen website ads. In the app, if interstitials are eventually tested, make them eligible only at a deliberate return to the collection, after the first session, after three completed games and at least five minutes since the previous one. These are proposed product limits; Google's guidance is to use natural breaks and avoid excessive interstitials. Always use test ad units during development. [Google interstitial guidance](https://developers.google.com/admob/ios/interstitial)

Ad removal must suppress ad requests as well as display. On iOS use a non-consumable StoreKit entitlement with restore and revocation handling. The present `PurchaseManager` is disabled in normal builds; it does not configure a real product or ad SDK. For web purchases, plan verified account/entitlement recovery before charging; a browser flag is insufficient. Cross-platform ownership would require a separately designed account and reconciliation service, so do not promise one purchase covers both platforms yet.

## Platform preparation

Google requires control of a site's HTML to verify AdSense ownership. Use an owned public HTTPS game destination whose deployment supports that code and required policy pages; application and approval remain separate steps. [AdSense ownership](https://support.google.com/adsense/answer/91205?hl=en)

Apple expects lasting value beyond a repackaged website, accurate metadata and restoration for restorable purchases. The existing app has native navigation, records, offline content, reminders and sharing; verify those on devices before submission. Use StoreKit as the default digital-purchase route and recheck storefront-specific terms before adding external purchasing links. [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

Apple's Developer Program lists $99 USD per year where applicable. Small Business Program participation can reduce commission to 15% for eligible developers; enrollment and associated-account rules apply. Confirm the actual agreement/storefront instead of applying one rate globally. [Membership](https://developer.apple.com/programs/enroll/), [Small Business Program](https://developer.apple.com/app-store/small-business-program/)

The ad SDK changes the privacy contract. ATT is required when the app tracks activity across other companies' apps/sites; contextual advertising alone is not proof the chosen SDK avoids tracking. [Apple privacy guidance](https://developer.apple.com/app-store/user-privacy-and-data-use/). Google's UMP flow refreshes consent information at app launch and gates requests on `canRequestAds`; required privacy options must remain reachable. [UMP setup](https://developers.google.com/admob/ios/privacy). Personalized Google ads in the EEA, UK and Switzerland require a certified CMP integrated with TCF. Regional law and non-personalized/limited-ad requirements also need review for the actual implementation. [Google CMP requirements](https://support.google.com/adsense/answer/13554020?hl=en)

## Launch materials

- [Store and website copy](store-and-website-copy.json): editable, current-build claims with character counts checked separately.
- [Social content and demonstrations](social-and-screenshots.md): launch posts, six short demonstration scripts and screenshot briefs.
- [Release gates and beta measurement](release-gates.md): concrete evidence required before launch and an editorial correction workflow.
- [Privacy and support preparation](privacy-and-support-draft.md): operational facts and fields that must be completed for the final host/SDK.
- [Revenue calculator](revenue-calculator.html): local interactive assumptions, separate recurring ad revenue and new one-time purchases, with costs and commission exposed. No forecast is prefilled.

No public deployment, purchase activation, ad request, account signup, outreach or paid acquisition is part of these draft materials.
