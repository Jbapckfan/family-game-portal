# Native app implementation contract

The iOS 17+ app launches six bundled games: Ringcount and Switchpath lead the native home, followed by Counterpart, Shortlist, Second Sense, and Sideways. Tradeoff and Inbetween are web-only and are deliberately absent from the native catalog.

SwiftUI owns navigation, Today, daily completion, a local record, settings, reminders, share presentation, and haptics. WebKit owns each existing game's rules and interaction. All game pages use `alford://app/games/<slug>/` and the persistent default WebKit data store. The custom resource handler reads only the bundled `Web` folder. Navigation cannot load a remote site.

The `alford` script-message handler accepts only a main frame from that local origin and the active catalog game's path. Progress payloads update a native ledger for daily mode and cumulative game statistics for either mode. Practice never creates a daily result. The first terminal result for a game/date is preserved. A native daily streak means solving at least one of the six dailies on consecutive Central calendar days.

The bridge carries `progress`, `share`, and `haptic` messages. It never accepts arbitrary JavaScript, file paths, URLs to open, notification commands, or purchase commands. The native code injects only a constant environment marker. User-controlled text is never interpolated into JavaScript.

Reminders default off. Only the Settings enable action requests notification authorization. The selected repeating time is explicitly Central time. StoreKit code is present, but production commerce and its UI default off. A separate debug-only scheme and launch argument enable local StoreKit testing with a local product; the normal app has no purchase button, advertising SDK, or product lookup.

Core tests specify date boundaries, untrusted bridge rejection, first-terminal records, practice isolation, and resource traversal defenses. A Python validator checks the project graph, resource references, shared schemes, privacy declaration, and optional complete Web bundle. These checks do not compile Swift. Xcode tests and device verification remain necessary on a Mac.
