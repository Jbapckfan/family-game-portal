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
        XCTAssertEqual(Set(GameID.allCases.map(\.rawValue)), Set(["ringcount", "switchpath", "counterpart", "shortlist", "second-sense", "sideways", "tradeoff", "inbetween", "kimi-cairn", "kimi-morph", "kimi-tangle", "kimi-hunch", "kimi-circuit", "kimi-quartet"]))
        XCTAssertEqual(Array(GameID.allCases.prefix(2)), [.ringcount, .switchpath])
        XCTAssertEqual(CreatorFilter.all.games.count, 14)
        XCTAssertEqual(CreatorFilter.chatGPT.games.count, 8)
        XCTAssertEqual(CreatorFilter.kimi.games.count, 6)
        XCTAssertTrue(CreatorFilter.chatGPT.games.allSatisfy { $0.creator == .chatGPT })
        XCTAssertTrue(CreatorFilter.kimi.games.allSatisfy { $0.creator == .kimi && $0.rawValue.hasPrefix("kimi-") })
        XCTAssertTrue(Set(CreatorFilter.chatGPT.games).isDisjoint(with: Set(CreatorFilter.kimi.games)))
        XCTAssertNil(GameID(rawValue: "kimi-runtime"))
        XCTAssertEqual(GameID.inbetween.collectionCount, 60)
    }
}
