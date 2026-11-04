import SwiftUI
import WebKit

struct ShareRequest: Identifiable {
    let id = UUID()
    let text: String
}

@MainActor
struct GameWebView: UIViewRepresentable {
    let game: GameID
    let store: ProgressStore
    let reloadToken: UUID
    let onShare: (String) -> Void
    let onNavigate: (GameID?) -> Void
    let onLoading: (Bool, String?) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(parent: self) }

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero, configuration: OfflineWebConfiguration.make(messageHandler: context.coordinator, game: game, preference: store.gamePreference(for: game)))
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(Theme.paper)
        webView.scrollView.backgroundColor = UIColor(Theme.paper)
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.allowsBackForwardNavigationGestures = false
        webView.accessibilityIdentifier = "bundled-game-\(game.rawValue)"
        context.coordinator.lastReloadToken = reloadToken
        webView.load(URLRequest(url: game.localURL))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.parent = self
        context.coordinator.syncPreference(to: webView)
        if context.coordinator.lastReloadToken != reloadToken {
            context.coordinator.lastReloadToken = reloadToken
            webView.configuration.userContentController.removeAllUserScripts()
            webView.configuration.userContentController.addUserScript(OfflineWebConfiguration.environmentScript(game: game, preference: store.gamePreference(for: game)))
            webView.load(URLRequest(url: game.localURL))
        }
    }

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.stopLoading()
        webView.navigationDelegate = nil
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "alford")
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: GameWebView
        var lastReloadToken: UUID?
        private var isLoaded = false
        private var lastSyncedPreference: GamePreference?
        private let resetGeneration: UUID

        init(parent: GameWebView) {
            self.parent = parent
            resetGeneration = parent.store.resetGeneration
            super.init()
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "alford", resetGeneration == parent.store.resetGeneration else { return }
            let origin = message.frameInfo.securityOrigin
            let context = BridgeContext(isMainFrame: message.frameInfo.isMainFrame, scheme: origin.protocol,
                host: origin.host, port: origin.port, sourceURL: message.frameInfo.request.url, game: parent.game)
            guard let decoded = BridgeDecoder.decode(message.body, context: context) else { return }
            switch decoded {
            case .progress(let progress): parent.store.accept(progress)
            case .gamePreference(let game, let preference): parent.store.setGamePreference(preference, for: game)
            case .share(let text): parent.onShare(text)
            case .haptic(let kind): HapticService.play(kind, enabled: parent.store.preferences.hapticsEnabled)
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard navigationAction.targetFrame?.isMainFrame == true else { decisionHandler(.cancel); return }
            let url = navigationAction.request.url
            if let destination = LocalRoute.game(at: url) {
                if destination == parent.game { decisionHandler(.allow) }
                else { decisionHandler(.cancel); parent.onNavigate(destination) }
            } else if LocalRoute.isHome(url) {
                decisionHandler(.cancel)
                parent.onNavigate(nil)
            } else {
                decisionHandler(.cancel)
            }
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            isLoaded = false
            lastSyncedPreference = nil
            parent.onLoading(true, nil)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            isLoaded = true
            syncPreference(to: webView)
            parent.onLoading(false, nil)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            report(error)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            report(error)
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            parent.onLoading(false, "The puzzle paused unexpectedly. Reload to continue from its last saved move.")
        }

        func syncPreference(to webView: WKWebView) {
            let preference = parent.store.gamePreference(for: parent.game)
            guard isLoaded, preference != lastSyncedPreference,
                  LocalRoute.game(at: webView.url) == parent.game else { return }
            lastSyncedPreference = preference
            webView.callAsyncJavaScript("""
                const detail = {slug, favorite, hidden};
                try { localStorage.setItem('alford:game-pref:v1:' + slug, JSON.stringify({favorite, hidden})); } catch {}
                window.dispatchEvent(new CustomEvent('alford:game-preference-change', {detail}));
                """, arguments: ["slug": parent.game.rawValue, "favorite": preference.favorite, "hidden": preference.hidden],
                in: nil, in: .page, completionHandler: nil)
        }

        private func report(_ error: Error) {
            guard (error as NSError).code != NSURLErrorCancelled else { return }
            parent.onLoading(false, "This puzzle couldn’t load. Please try reloading it.")
        }
    }
}
