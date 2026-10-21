import XCTest
import WebKit
@testable import AlfordDaily

@MainActor
final class OfflineGamesSmokeTests: XCTestCase {
    func testEveryBundledGameInitializesAndSharesPersistentOrigin() async throws {
        let probeKey = "alford-native-smoke-\(UUID().uuidString)"
        let ruleIdentifier = "alford-offline-smoke-\(UUID().uuidString)"
        let offlineRules = try await compileOfflineRules(identifier: ruleIdentifier)
        defer { WKContentRuleListStore.default().removeContentRuleList(forIdentifier: ruleIdentifier) { _ in } }
        for (index, game) in GameID.allCases.enumerated() {
            let ready = expectation(description: "\(game.name) initializes its actual module and bridge")
            let probe = MessageProbe(game: game, ready: ready)
            let configuration = OfflineWebConfiguration.make(messageHandler: probe)
            // Exercise the actual bundle with HTTP(S) resources blocked, even
            // when the simulator itself has a working network connection.
            configuration.userContentController.add(offlineRules)
            let webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 390, height: 844), configuration: configuration)
            webView.navigationDelegate = probe
            defer {
                webView.navigationDelegate = nil
                webView.stopLoading()
                configuration.userContentController.removeScriptMessageHandler(forName: "alford")
            }
            // The first cold Simulator launch needed 27.1 seconds just to start
            // WebKit's Networking process in CI. Keep later games at 20 seconds;
            // readiness still requires the actual game's trusted progress message.
            let readinessTimeout: TimeInterval = index == 0 ? 90 : 20
            print("ALFORD_SMOKE start \(index + 1)/\(GameID.allCases.count) \(game.rawValue), readiness limit \(readinessTimeout)s")
            webView.load(URLRequest(url: game.localURL))
            await fulfillment(of: [ready], timeout: readinessTimeout)
            if let failure = probe.loadFailure {
                XCTFail("\(game.rawValue): \(failure). \(probe.diagnostics)")
                return
            }
            let progress = try XCTUnwrap(probe.progress, "No trusted progress message from \(game.name). \(probe.diagnostics)")
            XCTAssertEqual(progress.game, game)
            XCTAssertEqual(progress.mode, .daily)
            let usesSharedModules = game.creator == .deepSeek || game.creator == .qwen || game.creator == .claude
            let boardSelector = game.creator == .kimi ? "#root [data-game-ready='true']" : usesSharedModules ? "#puzzle[data-game-ready='true']" : game == .tradeoff ? "#board" : "#puzzle"
            let nativeCheck = game.creator == .kimi ? "document.documentElement.dataset.native === 'true'" : usesSharedModules ? "document.body.classList.contains('native-app') && document.documentElement.dataset.native === 'true'" : "document.body.classList.contains('native-app') || document.documentElement.classList.contains('native-app')"
            let raw = try await evaluate("({ title: document.title, populated: document.querySelector(\"\(boardSelector)\")?.childElementCount > 0, native: (\(nativeCheck)), creator: document.body.dataset.gameCreator, credit: document.querySelector('[data-creator-label]')?.textContent?.trim() })", in: webView, game: game)
            let state = try XCTUnwrap(raw as? [String: Any])
            XCTAssertTrue((state["title"] as? String)?.contains(game.name) == true)
            XCTAssertEqual(state["populated"] as? Bool, true, game.rawValue)
            XCTAssertEqual(state["native"] as? Bool, true, game.rawValue)
            XCTAssertEqual(state["creator"] as? String, game.creator.rawValue, game.rawValue)
            if usesSharedModules {
                XCTAssertEqual(state["credit"] as? String, game.credit, game.rawValue)
            }
            if index == 0 {
                _ = try await evaluate("localStorage.setItem('\(probeKey)', 'retained')", in: webView, game: game)
            } else {
                let saved = try await evaluate("localStorage.getItem('\(probeKey)')", in: webView, game: game)
                XCTAssertEqual(saved as? String, "retained", "Same-origin storage was lost in \(game.name)")
            }
            if index == GameID.allCases.count - 1 {
                _ = try await evaluate("localStorage.removeItem('\(probeKey)')", in: webView, game: game)
            }
            print("ALFORD_SMOKE checked \(index + 1)/\(GameID.allCases.count) \(game.rawValue): progress, puzzle, native layout, creator, persistent origin; HTTP(S) blocked")
        }
    }

    private func compileOfflineRules(identifier: String) async throws -> WKContentRuleList {
        let ready = expectation(description: "Compile HTTP(S) resource blocker")
        var result: Result<WKContentRuleList?, Error>?
        WKContentRuleListStore.default().compileContentRuleList(forIdentifier: identifier,
            encodedContentRuleList: #"[{"trigger":{"url-filter":"^https?://"},"action":{"type":"block"}}]"#) { rules, error in
            if let error { result = .failure(error) } else { result = .success(rules) }
            ready.fulfill()
        }
        await fulfillment(of: [ready], timeout: 10)
        let completion = try XCTUnwrap(result, "Content blocker compilation did not finish")
        return try XCTUnwrap(completion.get(), "Content blocker was not created")
    }

    private func evaluate(_ expression: String, in webView: WKWebView, game: GameID) async throws -> Any? {
        let ready = expectation(description: "\(game.name) JavaScript evaluation finishes")
        var result: Result<Any?, Error>?
        webView.evaluateJavaScript(expression) { value, error in
            if let error { result = .failure(error) } else { result = .success(value) }
            ready.fulfill()
        }
        await fulfillment(of: [ready], timeout: 10)
        return try XCTUnwrap(result, "JavaScript evaluation timed out in \(game.name)").get()
    }

    @MainActor
    private final class MessageProbe: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        let game: GameID
        let ready: XCTestExpectation
        var progress: ProgressMessage?
        private(set) var loadFailure: String?
        private let startedAt = Date()
        private var events: [String] = []
        private var completed = false
        var diagnostics: String { events.isEmpty ? "No navigation or bridge events received" : events.joined(separator: " | ") }
        init(game: GameID, ready: XCTestExpectation) { self.game = game; self.ready = ready; super.init() }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            let origin = message.frameInfo.securityOrigin
            let context = BridgeContext(isMainFrame: message.frameInfo.isMainFrame, scheme: origin.protocol,
                host: origin.host, port: origin.port, sourceURL: message.frameInfo.request.url, game: game)
            guard case .progress(let received) = BridgeDecoder.decode(message.body, context: context) else {
                if (message.body as? [String: Any])?["type"] as? String == "progress" {
                    record("Rejected progress message from \(origin.protocol)://\(origin.host), path \(message.frameInfo.request.url?.path ?? "unknown")")
                }
                return
            }
            guard progress == nil else { return }
            progress = received
            record("Trusted progress received")
            complete()
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            record("Navigation started")
        }

        func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
            record("Document committed")
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            record("Navigation finished")
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            fail("Navigation failed", error: error)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            fail("Provisional navigation failed", error: error)
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            loadFailure = "WebContent process terminated"
            record(loadFailure!)
            complete()
        }

        private func fail(_ stage: String, error: Error) {
            let detail = error as NSError
            loadFailure = "\(stage): \(detail.domain) \(detail.code), \(detail.localizedDescription)"
            record(loadFailure!)
            complete()
        }

        private func record(_ event: String) {
            let elapsed = String(format: "%.3f", Date().timeIntervalSince(startedAt))
            let entry = "\(elapsed)s: \(event)"
            events.append(entry)
            print("ALFORD_SMOKE \(game.rawValue) \(entry)")
        }

        private func complete() {
            guard !completed else { return }
            completed = true
            ready.fulfill()
        }
    }
}
