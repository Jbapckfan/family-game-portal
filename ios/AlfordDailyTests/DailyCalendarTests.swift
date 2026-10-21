import XCTest
@testable import AlfordDaily

final class DailyCalendarTests: XCTestCase {
    private func instant(_ text: String) -> Date { ISO8601DateFormatter().date(from: text)! }

    func testCentralMidnightUsesTheCorrectDaily() {
        XCTAssertEqual(DailyCalendar.key(for: instant("2026-10-20T04:59:59Z")), "2026-10-19")
        XCTAssertEqual(DailyCalendar.key(for: instant("2026-10-20T05:00:00Z")), "2026-10-20")
        XCTAssertEqual(DailyCalendar.number(for: "2026-10-20"), 1)
        XCTAssertEqual(DailyCalendar.number(for: "2026-10-21"), 2)
    }

    func testCalendarDaysRemainStableAcrossDaylightSavingChanges() {
        XCTAssertEqual(DailyCalendar.key(for: instant("2026-11-02T05:59:59Z")), "2026-11-01")
        XCTAssertEqual(DailyCalendar.key(for: instant("2026-11-02T06:00:00Z")), "2026-11-02")
        XCTAssertEqual(DailyCalendar.shifted("2026-11-01", days: 1), "2026-11-02")
        XCTAssertEqual(DailyCalendar.shifted("2027-03-14", days: 1), "2027-03-15")
        XCTAssertEqual(DailyCalendar.number(for: "2026-11-02"), 14)
    }

    func testInvalidCalendarDatesAreRejected() {
        for key in ["2026-02-30", "2026-2-01", "2026-13-01", "2026-00-20", "not-a-date", "0000-01-01"] {
            XCTAssertNil(DailyCalendar.date(for: key), key)
        }
        XCTAssertNotNil(DailyCalendar.date(for: "2028-02-29"))
    }

    func testUnifiedCatalogPreservesOriginalIDsAndAttributesEveryGame() {
        XCTAssertEqual(Set(GameID.allCases.map(\.rawValue)), Set(["ringcount", "switchpath", "counterpart", "shortlist", "second-sense", "sideways", "tradeoff", "inbetween", "kimi-cairn", "kimi-morph", "kimi-tangle", "kimi-hunch", "kimi-circuit", "kimi-quartet", "deepseek-twin-hive", "deepseek-spare", "deepseek-rung", "deepseek-cipher", "deepseek-trail", "deepseek-split", "qwen-quadra", "qwen-logic-lattice", "qwen-syntax-siege", "qwen-memory-maze", "qwen-pattern-prism", "qwen-territory-tactics", "claude-dovetail", "claude-splice", "claude-sprout", "claude-tangle", "claude-keystone", "claude-tumbler"]))
        XCTAssertEqual(Array(GameID.allCases.prefix(2)), [.ringcount, .switchpath])
        XCTAssertEqual(CreatorFilter.all.games.count, 32)
        XCTAssertEqual(CreatorFilter.chatGPT.games.count, 8)
        XCTAssertEqual(CreatorFilter.kimi.games.count, 6)
        XCTAssertTrue(CreatorFilter.chatGPT.games.allSatisfy { $0.creator == .chatGPT })
        XCTAssertTrue(CreatorFilter.kimi.games.allSatisfy { $0.creator == .kimi && $0.rawValue.hasPrefix("kimi-") })
        XCTAssertTrue(Set(CreatorFilter.chatGPT.games).isDisjoint(with: Set(CreatorFilter.kimi.games)))
        XCTAssertNil(GameID(rawValue: "kimi-runtime"))
        XCTAssertNil(GameID(rawValue: "deepseek-runtime"))
        XCTAssertEqual(GameID.inbetween.collectionCount, 60)
    }

    func testConceptCreditsDistinguishOriginalPrototypesFromNewImplementations() {
        XCTAssertEqual(CreatorFilter.deepSeek.games.count, 6)
        XCTAssertEqual(CreatorFilter.qwen.games.count, 6)
        XCTAssertEqual(GameID.qwenQuadra.credit, "Developed by Qwen")
        XCTAssertEqual(GameID.kimiCairn.credit, "Developed by Kimi")
        XCTAssertEqual(GameID.ringcount.credit, "Developed by ChatGPT")
        for game in CreatorFilter.deepSeek.games {
            XCTAssertEqual(game.creator, .deepSeek)
            XCTAssertTrue(game.rawValue.hasPrefix("deepseek-"))
            XCTAssertEqual(game.credit, "Concept by DeepSeek · Built by ChatGPT")
            XCTAssertEqual(game.collectionCount, 30)
            XCTAssertEqual(game.allowsLoss, game == .deepSeekSpare)
        }
        for game in CreatorFilter.qwen.games {
            XCTAssertEqual(game.creator, .qwen)
            XCTAssertTrue(game.rawValue.hasPrefix("qwen-"))
            if game != .qwenQuadra {
                XCTAssertEqual(game.credit, "Concept by Qwen · Built by ChatGPT")
            }
            XCTAssertEqual(game.allowsLoss, game == .qwenQuadra || game == .qwenSyntaxSiege)
        }
        let creatorGames = CreatorFilter.allCases.filter { $0 != .all }.flatMap(\.games)
        XCTAssertEqual(Set(creatorGames), Set(GameID.allCases))
        XCTAssertEqual(creatorGames.count, GameID.allCases.count)
    }

    func testClaudeGamesRetainDevelopmentCreditDistinctIDsAndOriginalCollectionCounts() {
        let expectedCounts: [GameID: Int] = [.claudeDovetail: 77, .claudeSplice: 73, .claudeSprout: 128,
                                           .claudeTangle: 160, .claudeKeystone: 58, .claudeTumbler: 1054]
        XCTAssertEqual(Set(CreatorFilter.claude.games), Set(expectedCounts.keys))
        for game in CreatorFilter.claude.games {
            XCTAssertEqual(game.creator, .claude)
            XCTAssertTrue(game.rawValue.hasPrefix("claude-"))
            XCTAssertEqual(game.credit, "Developed by Claude")
            XCTAssertTrue(game.attributionDescription.contains("Original developer: Claude"))
            XCTAssertEqual(game.collectionCount, expectedCounts[game])
            XCTAssertTrue(game.allowsLoss)
        }
        XCTAssertEqual(GameID.claudeTangle.name, GameID.kimiTangle.name)
        XCTAssertNotEqual(GameID.claudeTangle.localURL, GameID.kimiTangle.localURL)
        XCTAssertTrue(Set(CreatorFilter.claude.games).isDisjoint(with: Set(CreatorFilter.kimi.games)))
        XCTAssertEqual(CreatorFilter.allCases.count, 6)
        XCTAssertEqual(GameCreator.allCases.count, 5)
    }
}
