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
            defer {
                webView.stopLoading()
                configuration.userContentController.removeScriptMessageHandler(forName: "alford")
            }
            webView.load(URLRequest(url: game.localURL))
            await fulfillment(of: [ready], timeout: 20)
            let progress = try XCTUnwrap(probe.progress, "No trusted progress message from \(game.name)")
            XCTAssertEqual(progress.game, game)
            XCTAssertEqual(progress.mode, .daily)
            let boardSelector = game.creator == .kimi ? "#root [data-game-ready='true']" : game == .tradeoff ? "#board" : "#puzzle"
            let nativeCheck = game.creator == .kimi ? "document.documentElement.dataset.native === 'true'" : "document.body.classList.contains('native-app') || document.documentElement.classList.contains('native-app')"
            let raw = try await evaluate("({ title: document.title, populated: document.querySelector(\"\(boardSelector)\")?.childElementCount > 0, native: (\(nativeCheck)), creator: document.body.dataset.gameCreator })", in: webView, game: game)
            let state = try XCTUnwrap(raw as? [String: Any])
            XCTAssertTrue((state["title"] as? String)?.contains(game.name) == true)
            XCTAssertEqual(state["populated"] as? Bool, true, game.rawValue)
            XCTAssertEqual(state["native"] as? Bool, true, game.rawValue)
            XCTAssertEqual(state["creator"] as? String, game.creator.rawValue, game.rawValue)
            if index == 0 {
                _ = try await evaluate("localStorage.setItem('\(probeKey)', 'retained')", in: webView, game: game)
            } else {
                let saved = try await evaluate("localStorage.getItem('\(probeKey)')", in: webView, game: game)
                XCTAssertEqual(saved as? String, "retained", "Same-origin storage was lost in \(game.name)")
            }
            if index == GameID.allCases.count - 1 {
                _ = try await evaluate("localStorage.removeItem('\(probeKey)')", in: webView, game: game)
            }
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

    private final class MessageProbe: NSObject, WKScriptMessageHandler {
        let game: GameID
        let ready: XCTestExpectation
        var progress: ProgressMessage?
        init(game: GameID, ready: XCTestExpectation) { self.game = game; self.ready = ready; super.init() }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            let origin = message.frameInfo.securityOrigin
            let context = BridgeContext(isMainFrame: message.frameInfo.isMainFrame, scheme: origin.protocol,
                host: origin.host, port: origin.port, sourceURL: message.frameInfo.request.url, game: game)
            guard case .progress(let received) = BridgeDecoder.decode(message.body, context: context), progress == nil else { return }
            progress = received
            ready.fulfill()
        }
    }
}
