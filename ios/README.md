# Alford Daily for iOS

A dependency-free SwiftUI application for iPhone and iPad, targeting iOS 17 and later. The six game runtimes ship inside the app and load through a local `alford://app/` origin. Gameplay requires no server, account, sign-in session, or network connection.

The app adds native Today navigation, completion and streak summaries, a local Record screen, settings, haptic feedback, the system share sheet, and an optional local daily reminder. Ringcount and Switchpath lead the collection. Tradeoff and Inbetween remain in the web portal and are not bundled in this launch app.

## Build status and prerequisites

The checked-in project and resource graph have passed the portable structural validator. Swift compilation, XCTest execution, Simulator behavior, and device signing require Xcode on macOS; a structural pass does not prove those steps. The private repository's macOS workflow is the intended compilation and test gate. Consult its actual run result before treating the native app as verified.

Use Xcode 16 or later with an installed iOS Simulator runtime. The project sets Swift language mode to 5 and the deployment target to iOS 17. No CocoaPods, Carthage, Swift packages, XcodeGen, hosted backend, or runtime package installation is required. Python 3 runs the optional project validation and generation scripts. Node.js runs the repository's web-bundle sync check.

| Item | Value |
| --- | --- |
| Project | `ios/AlfordDaily.xcodeproj` |
| Normal shared scheme | `AlfordDaily` |
| XCTest target | `AlfordDailyTests` |
| Separate local commerce scheme | `AlfordDaily-StoreKit` |
| Default bundle identifier | `com.alfordfamily.daily` |
| Daily timezone | `America/Chicago` |
| Daily epoch | October 20, 2026 |
| Supported devices | iPhone and iPad, iOS 17+ |

### Run in Simulator

Open `ios/AlfordDaily.xcodeproj`, select the **AlfordDaily** scheme and an available iPhone Simulator, then Run. Simulator builds do not require a paid developer account or a provisioning profile.

From the repository root, these commands check the source and run the hosted XCTest suite:

```sh
python3 ios/scripts/validate_project.py
node scripts/sync-ios-web.mjs --check
xcodebuild -list -project ios/AlfordDaily.xcodeproj
xcrun simctl list devices available
xcodebuild test \
  -project ios/AlfordDaily.xcodeproj \
  -scheme AlfordDaily \
  -destination 'platform=iOS Simulator,id=REPLACE_WITH_AVAILABLE_SIMULATOR_UDID' \
  -resultBundlePath /tmp/AlfordDaily.xcresult \
  CODE_SIGNING_ALLOWED=NO
```

Choose a real available simulator identifier from `simctl`; do not pass the placeholder literally. Use a fresh result bundle path for each run. The repository's macOS workflow selects an available iPhone Simulator automatically and retains the result bundle and build log.

The test target includes 20 test methods covering Central-date boundaries and daylight-saving changes, native catalog membership, bridge input validation, terminal result preservation, stale-statistics recovery, local persistence and reset, resource traversal/symlink protection, disabled commerce, and the actual bundled WebKit runtime. The WebKit smoke test opens all six games through the production custom scheme handler, waits for a validated progress message, checks rendered puzzle content and native styling, and verifies that distinct game views share the persistent local origin. This tests module loading and storage behavior in WebKit; it does not replace a complete gameplay or accessibility review.

### Run on a device or archive

In the app target's **Signing & Capabilities**, select your development team and choose a bundle identifier registered to you. The checked-in identifier is a starting value, not a claim that an App Store record or signing entitlement exists. Apply your team to the test target if running device tests. Enable Developer Mode on the test device when Xcode requests it.

Use **Product → Archive** with a physical-device destination for a distribution build. App Store Connect configuration, certificates, screenshots, privacy disclosures, legal details, product metadata, review, and distribution are separate release steps. This source does not create an App Store listing or purchase product.

## The six games

| Game | Mechanic | Prepared collection |
| --- | --- | ---: |
| Ringcount | Place four cuts around a numbered ring so the four arcs meet the required totals. | 90 |
| Switchpath | Trace a route through a number grid using the alternating higher/lower rule. | 90 |
| Counterpart | Complete five directed analogies using one shared ten-word bank. | 30 |
| Shortlist | Identify a hidden word from twelve candidates using three letter-presence scans, then commit to an answer. | 90 |
| Second Sense | Match a noun definition and verb definition, then type the single word fitting both senses. | 30 |
| Sideways | Shift word rows horizontally so their selected letters satisfy the vertical clue. | 90 |

These are finite, prepared collections. The daily index is deterministic and repeats after each game's collection length. The app does not promise an infinite supply of unseen puzzles. Practice remains separate from daily results. Game-specific rules, explanations, score sharing, and saved-state validation remain in each bundled JavaScript engine.

## Native structure and local progress

`AlfordDaily/AlfordDailyApp.swift` owns the services and three native tabs. Feature views live in `Features/`; date, catalog, bridge, and progress models live in `Core/`. `Web/` contains the resource resolver, scheme handler, and `WKWebView` adapter. `Services/` contains reminders, haptics, and the gated StoreKit manager.

The Today summary shows how many of the six daily games are finished and how many are solved. A reveal or loss counts as finished and never as a solve. The native daily streak counts consecutive Central dates with at least one daily solve across the six games. Yesterday's streak remains available while today is unfinished; completing all six without a solve ends it. Per-game streaks use the same daily result ledger.

The first terminal result for a game and date is preserved. Later reloads, practice messages, and queued messages from a game view predating a user reset cannot replace it. Cumulative played/won/best counters cannot shrink because of a stale web save; the current streak may decrease as days pass. The app writes its ledger and preferences to `UserDefaults`. Game engines retain their detailed daily/practice state in WebKit local storage through `WKWebsiteDataStore.default()`.

The Record tab displays the local native ledger and the cumulative daily statistics sent by the bundled engines. The native ledger begins with games observed by this app installation; it does not import the remote web portal's browser storage. No account or cross-device score-sync service is configured. Standard operating-system backup behavior may apply to local app data.

Settings offers an explicit, confirmed **Clear all local game progress** action. It clears the default WebKit data store and the native results. Haptic and reminder preferences remain as chosen. Deleting the app can also remove its local saves.

## Offline host and bridge

The app registers its `WKURLSchemeHandler` before constructing each web view. `Web` is a folder resource, preserving the complete directory layout:

```text
Web/games/<slug>/index.html
Web/games/<slug>/app.mjs
Web/games/<slug>/engine.mjs
Web/games/<slug>/puzzles.mjs
Web/games/<slug>/shell.mjs
Web/games/<slug>/styles.css
Web/games/<slug>/fonts/...
```

All games share `alford://app/`. The resolver accepts only the six whitelisted game directories, rejects path traversal and encoded separators, resolves symlinks, and checks containment within the bundle. HTML receives `text/html`; `.mjs` and `.js` receive `text/javascript`. The response adds a restrictive Content Security Policy and forbids network connections, frames, objects, and forms. The navigation delegate permits only bundled game documents and translates local home/game navigation to the native navigation stack.

The JavaScript shell uses `window.webkit.messageHandlers.alford.postMessage(...)`. The native receiver accepts only messages from the main frame, the local origin, and the active game's exact document route. Payloads are bounded and type-checked; date keys, count relationships, known modes, statuses, and game names are validated. The bridge cannot evaluate arbitrary scripts, open arbitrary URLs, request notification permission, or initiate purchases.

| Message | Validated body |
| --- | --- |
| Progress | `{ type: 'progress', slug, name, mode, dateKey, status, stats: { played, won, streak, bestStreak, ... } }` |
| Share | `{ type: 'share', slug, text }` |
| Haptic | `{ type: 'haptic', slug, kind: 'select' | 'fit' | 'miss' | 'win' }` |

The shell's progress message includes full daily statistics even while playing practice. Native practice messages update that statistics snapshot without creating a daily ledger result. The native wrapper presents shared score text with `UIActivityViewController`; the user chooses the destination and completes any sharing action. Game engines generate the spoiler-free text. Haptic messages respect the native Settings toggle.

## Optional reminder

The app never requests notification permission on launch. The user must explicitly enable **Daily reminder** in Settings. Only then does it ask for authorization and schedule one repeating local notification at the chosen Central time. Disabling the setting removes that request. If permission is denied or later revoked in iOS Settings, the app reflects that state and offers an explicit Settings link.

There is no push token, notification server, marketing audience, or remote scheduling service. The reminder is a generic invitation to the daily six; it does not contain puzzle answers or personal data. iOS notification-delivery settings still control whether and when the alert is visible.

## StoreKit preparation: disabled in the normal app

This edition has no advertising SDK and shows no ads. The **AlfordDaily** scheme and release configuration hide all monetization UI and perform no product lookup or automatic purchase restoration. No live product identifier or billing configuration is provided.

`PurchaseManager` implements the future non-consumable entitlement path using verified StoreKit 2 transactions. It observes transaction updates, rebuilds ownership from current verified entitlements, excludes revoked/refunded grants, finishes processed transactions, and handles pending and canceled purchases. The Restore button calls `AppStore.sync()` only after an explicit user action. The app never grants ownership from a local preference or an unverified transaction.

The separate **AlfordDaily-StoreKit** shared scheme combines a Debug-only `-StoreKitTesting` launch argument with `Config/LocalPurchases.storekit`. This exposes a development-only local product, `com.alfordfamily.daily.removeads.localtest`, so the entitlement behavior can be exercised with Xcode's StoreKit transaction tools. That configuration is not an App Store product and its local transactions do not charge an account.

The local StoreKit scheme has been structurally checked; product loading, purchase approval, pending flows, refunds, revocations, and restoration still need an actual Xcode StoreKit test run. The normal automated suite only asserts that disabled commerce stays inactive. The scheme does not affect ordinary gameplay or the normal CI test action.

Before enabling real monetization in a future release, configure and review the actual product and ad integration, update privacy disclosures and the manifest for the APIs introduced, implement the intended ad presentation, and validate the complete purchase/refund/restore path on device. Keep the normal build disabled until those steps are complete.

## Privacy and included resources

The app does not collect or transmit scores, names, device identifiers, analytics, or advertising identifiers. It requests no tracking permission. The shipped privacy manifest declares no tracking or collected data and declares the app-only `UserDefaults` required-reason API use with `CA92.1`. A system share sheet or a developer's explicitly enabled StoreKit test remains a separate, user-directed action.

There are no App Transport Security exceptions. The app icon and named colors are local assets. Web fonts are bundled with their original license files. The privacy manifest describes the APIs in this source; it is not a blanket disclosure for future SDKs.

## Updating source and bundled games

Edit the canonical portable game source under the repository's `games/<slug>/` directories, then synchronize and check the iOS runtime from the repository root:

```sh
node scripts/sync-ios-web.mjs
node scripts/sync-ios-web.mjs --check
python3 ios/scripts/validate_project.py
```

The sync script accepts only the fixed six game runtime allowlists and preserves font-license files. It verifies exact file sets and SHA-256 parity. Do not use the bundle as a separate editable fork of a game's source.

After adding or removing a Swift source file, regenerate the dependency-free project and validate it:

```sh
python3 ios/scripts/generate_project.py
python3 ios/scripts/validate_project.py
```

The generator uses deterministic identifiers. The validator independently parses the project graph, checks all object/file/target references, verifies each Swift file belongs to a Sources phase, checks both shared schemes, validates Info/privacy/resource metadata, and confirms the six bundled runtimes. It deliberately prints that Swift compilation and WebKit execution require Xcode.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the source contract and [TESTING.md](docs/TESTING.md) for the device and release checks.

## Apple documentation

The implementation follows these primary references:

- [WKURLSchemeHandler](https://developer.apple.com/documentation/webkit/wkurlschemehandler) and [registering a scheme handler](https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/seturlschemehandler(_:forurlscheme:)).
- [WKFrameInfo.securityOrigin](https://developer.apple.com/documentation/webkit/wkframeinfo/securityorigin), [WKSecurityOrigin](https://developer.apple.com/documentation/webkit/wksecurityorigin), and [persistent default website data store](https://developer.apple.com/documentation/webkit/wkwebsitedatastore/default()).
- [Asking permission to use notifications](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications) and [calendar notification triggers](https://developer.apple.com/documentation/usernotifications/uncalendarnotificationtrigger).
- [Current StoreKit entitlements](https://developer.apple.com/documentation/storekit/transaction/currententitlements), [transaction updates](https://developer.apple.com/documentation/storekit/transaction/updates), and [explicit App Store synchronization](https://developer.apple.com/documentation/storekit/appstore/sync()).
- [Setting up local StoreKit testing](https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode).
- [Required-reason API declarations](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitypereasons) and [adding them to a privacy manifest](https://developer.apple.com/documentation/technotes/tn3183-adding-required-reason-api-entries-to-your-privacy-manifest).
