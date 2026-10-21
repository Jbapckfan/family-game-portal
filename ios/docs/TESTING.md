# Native verification and release checks

## Automated gate

Run the repository's iOS macOS workflow, or the `xcodebuild test` command in the iOS README. The shared `AlfordDaily` scheme builds the app and runs the hosted `AlfordDailyTests` target on an iPhone Simulator. Keep the `.xcresult` and full build log when diagnosing a failure.

The 29 XCTest methods cover:

- Central midnight, calendar validity, daylight-saving transitions, daily numbering, the 32-game catalog, creator filtering, original Claude collection counts, distinct IDs for both Tangle games, and separate concept/implementation credits.
- Bridge rejection of untrusted frames/origins/ports, another game's document, malformed dates, future dates, Boolean/string/fractional counters, inconsistent totals, unknown actions, and oversized share text.
- First-terminal-result preservation, practice separation, global/per-game streak rules, stale-statistics regression, UserDefaults restoration, migration of existing six- and fourteen-game results, and clearing progress while retaining preferences.
- Bundle document resolution, constrained shared Kimi resources, the exact three-file shared module namespace, JavaScript/font MIME types, path traversal/encoded separator rejection, and symlink escape rejection.
- An explicitly disabled commerce configuration remaining inactive.
- All 32 actual bundled games loading through the production custom scheme handler with HTTP(S) blocked, posting trusted progress, displaying their game titles and developer labels, rendering the puzzle, activating native layout, and sharing a persistent same-origin localStorage value across distinct web views.

These are the suite's coverage requirements, not a claim that a particular revision has passed. Consult the actual workflow for that revision and the current [expanded verification report](../../docs/verification-expanded-2026-10-20.md). The portable Python validator checks source/project/resource structure. It cannot replace Swift compilation or simulator execution. The smoke test does not prove process-relaunch persistence, a full native gameplay session, StoreKit behavior, or accessibility quality; use the checks below for those remaining behaviors.

## Device and Simulator checks

| Area | Procedure | Expected result |
| --- | --- | --- |
| First launch | Install a clean normal build and open it. | Today shows all 32 games and All / ChatGPT / Kimi / DeepSeek / Qwen / Claude filters. Eight are developed by ChatGPT, six by Kimi, six by Claude, six are DeepSeek concepts built by ChatGPT, Quadra is developed by Qwen, and the other five Qwen concepts are built by ChatGPT; no account, network, notification, tracking, or purchase prompt appears. |
| Offline gameplay | Enable Airplane Mode on a device, launch each game, make several moves, and finish a puzzle. | All rules, fonts, content, explanations, and game controls work without a remote origin. |
| Process persistence | Make a partial move in each game, terminate the app, and reopen it. | Each game resumes its own daily/practice state; a terminal daily result remains terminal. |
| Daily results | Solve one daily, reveal another, finish unsuccessful daily rounds in Shortlist, Hunch, Quartet, Spare, Quadra, Syntax Siege, and the six Claude games, and play practice. | Today counts only daily terminal results as completed; only daily wins as solved; practice leaves the daily ledger unchanged. Claude's Tangle result does not change Kimi's Tangle result. |
| Midnight | Test the Central date boundary, including a daylight-saving boundary, using a disposable Simulator. | Home date and daily numbering agree with the engines; no future record inflates today's count. Restore the correct clock after testing. |
| Native navigation | Open each game, use its local home link if visible, use the native Back button, and switch tabs. | Navigation stays in the bundled collection; Record and Settings remain native. |
| Native share | Finish a puzzle and tap Share; cancel once, then choose an available destination. | System share sheet contains the spoiler-free score; canceling does not change the result. |
| Haptics | Toggle native haptics off/on and trigger selection, fit, miss, and win on a physical device. | Haptic setting is respected and retained. Simulator absence of vibration is expected. |
| Notification permission | On a fresh install, visit Settings, then explicitly enable the reminder. | No permission prompt occurs until enable. Denial is reflected; the Settings link is user initiated. |
| Reminder time | Enable at a near-future Central time, then disable after observing delivery. | One repeating local request uses the chosen time; disabling removes it. Delivery is subject to iOS notification/Focus settings. |
| Clear data | Start several games, confirm Clear all progress, then reopen them and relaunch. | All game/native results are reset; no queued old result reappears; haptic/reminder preferences remain. |
| Compact layout | Test a small iPhone in portrait/landscape and an iPad, including an open software keyboard. | Controls remain reachable, text does not cause horizontal scrolling, and the native navigation bar does not cover game actions. |
| Accessibility | Use VoiceOver, large Dynamic Type, Reduce Motion, external keyboard, and Switch Control where available. | Native cards and settings have useful labels; Web content remains operable; focus reaches the answer/check actions without traps. Record any remaining web accessibility issues before release. |
| Network boundary | Inspect development network activity during ordinary gameplay and try a nonlocal navigation in a debug test. | Games need only bundled assets and cannot navigate to arbitrary remote documents. |

## Local StoreKit testing

Select the separate **AlfordDaily-StoreKit** scheme and Run a Debug build in Xcode. Confirm its Run options select `Config/LocalPurchases.storekit` and pass `-StoreKitTesting`. If the development product does not load, check the scheme's StoreKit configuration selection before changing production gates.

Use Xcode's StoreKit transaction manager to exercise this matrix. These cases require real StoreKit testing and are not claimed as already passed by the portable validator or disabled-commerce test.

| Case | Expected behavior |
| --- | --- |
| Local verified purchase | The debug entitlement becomes active after verification; a relaunch rebuilds it from current verified entitlements. |
| Cancel purchase | No entitlement is granted and no failure alert is required. |
| Pending / Ask to Buy | The UI explains the pending state; approval is received through transaction updates and then refreshes ownership. |
| Unverified or failed purchase | No entitlement is granted; an understandable message appears. |
| Refund or revoke transaction | The update refreshes current entitlements and removes ownership. |
| Explicit Restore | The user taps Restore; synchronization completes and the UI reports whether an eligible entitlement exists. |
| Normal scheme / Release | Commerce UI and product requests are absent, even if a local debug entitlement was previously exercised. |

Do not treat a local StoreKit transaction as proof that App Store Connect, server billing, Family Sharing, or a real advertising integration has been configured.

## Before distribution

Record the Xcode version, Simulator/device OS version, source commit, automated result bundle, and manual test outcomes. Review the actual archive's privacy manifest and included licenses. Set the registered bundle identifier and signing team, and prepare truthful App Store privacy information and metadata. The current edition contains no ads and no live purchase product; preserve that behavior unless a separately reviewed monetization change is ready.
