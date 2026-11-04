import XCTest
@testable import AlfordDaily

final class GamePreferenceTests: XCTestCase {
    @MainActor func testPreferencesPersistAndHidingRetainsFavoriteAndRecords() {
        let name = "AlfordDaily.preference-test.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        let store = ProgressStore(defaults: defaults)
        store.accept(ProgressMessage(game: .counterpart, mode: .daily, dateKey: "2026-10-28", status: .won, stats: .empty))
        store.toggleFavorite(.counterpart)
        store.toggleHidden(.counterpart)
        let restored = ProgressStore(defaults: defaults)
        XCTAssertEqual(restored.gamePreference(for: .counterpart), GamePreference(favorite: true, hidden: true))
        XCTAssertEqual(restored.ledger.status(for: .counterpart, on: "2026-10-28"), .won)
        restored.toggleHidden(.counterpart)
        XCTAssertEqual(restored.gamePreference(for: .counterpart), GamePreference(favorite: true, hidden: false))
        XCTAssertEqual(restored.ledger.status(for: .counterpart, on: "2026-10-28"), .won)
    }

    @MainActor func testFiltersCombineWithoutDeletingGamesAndIncludeBonus() {
        let name = "AlfordDaily.preference-test.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        let store = ProgressStore(defaults: defaults)
        let games: [GameID] = [.counterpart, .shortlist, .nestedTicTacToe]
        store.toggleFavorite(.counterpart)
        store.toggleFavorite(.nestedTicTacToe)
        store.toggleHidden(.counterpart)
        XCTAssertEqual(store.visibleGames(games), [.shortlist, .nestedTicTacToe])
        XCTAssertEqual(store.visibleGames(games, favoritesOnly: true), [.nestedTicTacToe])
        XCTAssertEqual(store.visibleGames(games, favoritesOnly: true, showHidden: true), [.counterpart, .nestedTicTacToe])
        XCTAssertEqual(store.visibleGames(games, showHidden: true), games)
        XCTAssertEqual(store.gamePreference(for: .shortlist), GamePreference())
    }

    @MainActor func testMalformedPreferencesAreIgnoredAndProgressResetRetainsChoices() {
        let name = "AlfordDaily.preference-test.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        defaults.set(Data("{\"favorite\":1,\"hidden\":false}".utf8), forKey: "alford:game-pref:v1:counterpart")
        let store = ProgressStore(defaults: defaults)
        XCTAssertEqual(store.gamePreference(for: .counterpart), GamePreference())
        store.toggleFavorite(.counterpart)
        store.resetProgress()
        XCTAssertTrue(store.gamePreference(for: .counterpart).favorite)
        XCTAssertTrue(ProgressStore(defaults: defaults).gamePreference(for: .counterpart).favorite)
    }

    func testPreferenceBridgeRequiresActiveSlugBooleansAndTrustedOrigin() {
        let trusted = BridgeContext(isMainFrame: true, scheme: "alford", host: "app", port: 0,
            sourceURL: GameID.counterpart.localURL, game: .counterpart)
        let body: [String: Any] = ["type": "gamePreference", "slug": "counterpart", "favorite": true, "hidden": false]
        XCTAssertEqual(BridgeDecoder.decode(body, context: trusted), .gamePreference(.counterpart, GamePreference(favorite: true, hidden: false)))
        for patch: [String: Any] in [["slug": "shortlist"], ["favorite": 1], ["hidden": "false"]] {
            XCTAssertNil(BridgeDecoder.decode(body.merging(patch) { _, new in new }, context: trusted))
        }
        var missing = body; missing.removeValue(forKey: "slug")
        XCTAssertNil(BridgeDecoder.decode(missing, context: trusted))
        let untrusted = BridgeContext(isMainFrame: false, scheme: "alford", host: "app", port: 0,
            sourceURL: GameID.counterpart.localURL, game: .counterpart)
        XCTAssertNil(BridgeDecoder.decode(body, context: untrusted))
    }
}
