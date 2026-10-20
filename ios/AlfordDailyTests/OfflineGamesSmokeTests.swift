import XCTest
import WebKit
@testable import AlfordDaily

@MainActor
final class OfflineGamesSmokeTests: XCTestCase {
    func testEveryBundledGameInitializesAndSharesPersistentOrigin() async throws {
        let probeKey = "alford-native-smoke-\(UUID().uuidString)"
        for (index, game) in GameID.allCases.enumerated() {
            let ready = expectation(description: "\(game.name) initializes its actual module and bridge")
            let probe = MessageProbe(game: game, ready: ready)
            let configuration = OfflineWebConfiguration.make(messageHandler: probe)
            let webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 390, height: 844), configuration: configuration)
            defer {
                webView.stopLoading()
                configuration.userContentController.removeScriptMessageHandler(forName: "alford")
            }
            webView.load(URLRequest(url: game.localURL))
            await fulfillment(of: [ready], timeout: 20)
            XCTAssertTrue(probe.didReceiveProgress, "No trusted progress message from \(game.name)")
            let raw = try await webView.evaluateJavaScript("({ title: document.title, populated: document.querySelector('#puzzle')?.childElementCount > 0, native: document.body.classList.contains('native-app') })")
            let state = try XCTUnwrap(raw as? [String: Any])
            XCTAssertTrue((state["title"] as? String)?.contains(game.name) == true)
            XCTAssertEqual(state["populated"] as? Bool, true, game.rawValue)
            XCTAssertEqual(state["native"] as? Bool, true, game.rawValue)
            if index == 0 {
                _ = try await webView.evaluateJavaScript("localStorage.setItem('\(probeKey)', 'retained')")
            } else {
                let saved = try await webView.evaluateJavaScript("localStorage.getItem('\(probeKey)')")
                XCTAssertEqual(saved as? String, "retained", "Same-origin storage was lost in \(game.name)")
            }
            if index == GameID.allCases.count - 1 {
                _ = try await webView.evaluateJavaScript("localStorage.removeItem('\(probeKey)')")
            }
        }
    }

    private final class MessageProbe: NSObject, WKScriptMessageHandler {
        let game: GameID
        let ready: XCTestExpectation
        var didReceiveProgress = false
        init(game: GameID, ready: XCTestExpectation) { self.game = game; self.ready = ready; super.init() }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            let origin = message.frameInfo.securityOrigin
            let context = BridgeContext(isMainFrame: message.frameInfo.isMainFrame, scheme: origin.protocol,
                host: origin.host, port: origin.port, sourceURL: message.frameInfo.request.url, game: game)
            guard case .progress = BridgeDecoder.decode(message.body, context: context), !didReceiveProgress else { return }
            didReceiveProgress = true
            ready.fulfill()
        }
    }
}
