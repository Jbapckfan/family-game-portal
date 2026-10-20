import XCTest
@testable import AlfordDaily

final class BridgeDecoderTests: XCTestCase {
    private let now = ISO8601DateFormatter().date(from: "2026-10-22T12:00:00Z")!
    private var validContext: BridgeContext {
        BridgeContext(isMainFrame: true, scheme: "alford", host: "app", port: 0,
            sourceURL: GameID.counterpart.localURL, game: .counterpart)
    }
    private var payload: [String: Any] {
        ["type": "progress", "slug": "counterpart", "name": "Counterpart", "mode": "daily",
         "dateKey": "2026-10-22", "status": "won",
         "stats": ["played": 3, "won": 2, "streak": 1, "bestStreak": 2, "perfect": 1, "averageAttempts": 6.5]]
    }

    func testValidMainFrameProgressIsDecoded() {
        guard case .progress(let progress) = BridgeDecoder.decode(payload, context: validContext, now: now) else {
            return XCTFail("Expected validated progress")
        }
        XCTAssertEqual(progress.game, .counterpart)
        XCTAssertEqual(progress.status, .won)
        XCTAssertEqual(progress.stats.averageAttempts, 6.5)
    }

    func testSubframesRemoteOriginsOtherPortsAndWrongGamePathsAreRejected() {
        let contexts = [
            BridgeContext(isMainFrame: false, scheme: "alford", host: "app", port: 0, sourceURL: GameID.counterpart.localURL, game: .counterpart),
            BridgeContext(isMainFrame: true, scheme: "https", host: "app", port: 443, sourceURL: GameID.counterpart.localURL, game: .counterpart),
            BridgeContext(isMainFrame: true, scheme: "alford", host: "evil.example", port: 0, sourceURL: GameID.counterpart.localURL, game: .counterpart),
            BridgeContext(isMainFrame: true, scheme: "alford", host: "app", port: 80, sourceURL: GameID.counterpart.localURL, game: .counterpart),
            BridgeContext(isMainFrame: true, scheme: "alford", host: "app", port: 0, sourceURL: GameID.shortlist.localURL, game: .counterpart)
        ]
        for context in contexts { XCTAssertNil(BridgeDecoder.decode(payload, context: context, now: now)) }
    }

    func testInvalidCountersAndMalformedDatesAreRejected() {
        let invalidValues: [Any] = [-1, 1.5, true, "2", 2_000_000]
        for value in invalidValues {
            var body = payload
            body["stats"] = ["played": value, "won": 0, "streak": 0, "bestStreak": 0]
            XCTAssertNil(BridgeDecoder.decode(body, context: validContext, now: now))
        }
        for date in ["2026-02-30", "2026-10-23", "2026-1-2"] {
            var body = payload; body["dateKey"] = date
            XCTAssertNil(BridgeDecoder.decode(body, context: validContext, now: now))
        }
        var inconsistent = payload
        inconsistent["stats"] = ["played": 1, "won": 3, "streak": 1, "bestStreak": 2]
        XCTAssertNil(BridgeDecoder.decode(inconsistent, context: validContext, now: now))
    }

    func testOtherGamesCannotClaimTheActiveGamesProgressOrShare() {
        var wrong = payload; wrong["slug"] = "shortlist"
        XCTAssertNil(BridgeDecoder.decode(wrong, context: validContext, now: now))
        XCTAssertNil(BridgeDecoder.decode(["type": "share", "slug": "shortlist", "text": "score"], context: validContext, now: now))
        var lost = payload; lost["status"] = "lost"
        XCTAssertNil(BridgeDecoder.decode(lost, context: validContext, now: now))
    }

    func testShareAndHapticsAreBoundedAndOnlyKnownActionsAreAccepted() {
        XCTAssertEqual(BridgeDecoder.decode(["type": "share", "slug": "counterpart", "text": "COUNTERPART #003\n5 checks · 0 hints"], context: validContext, now: now), .share("COUNTERPART #003\n5 checks · 0 hints"))
        XCTAssertEqual(BridgeDecoder.decode(["type": "haptic", "kind": "win"], context: validContext, now: now), .haptic(.win))
        XCTAssertNil(BridgeDecoder.decode(["type": "share", "text": String(repeating: "x", count: 5_000)], context: validContext, now: now))
        XCTAssertNil(BridgeDecoder.decode(["type": "haptic", "kind": "purchase"], context: validContext, now: now))
        XCTAssertNil(BridgeDecoder.decode(["type": "evaluate", "script": "alert(1)"], context: validContext, now: now))
    }
}
