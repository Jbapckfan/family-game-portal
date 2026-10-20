import XCTest
@testable import AlfordDaily

final class ProgressLedgerTests: XCTestCase {
    private func message(_ game: GameID, _ date: String, _ status: GameStatus, mode: GameMode = .daily) -> ProgressMessage {
        ProgressMessage(game: game, mode: mode, dateKey: date, status: status, stats: .empty)
    }

    func testFirstTerminalResultSurvivesLaterMessagesAndPracticeStaysSeparate() {
        var ledger = ProgressLedger()
        ledger.record(message(.counterpart, "2026-10-20", .playing))
        ledger.record(message(.counterpart, "2026-10-20", .won))
        ledger.record(message(.counterpart, "2026-10-20", .revealed))
        ledger.record(message(.counterpart, "2026-10-20", .playing))
        ledger.record(message(.shortlist, "2026-10-20", .won, mode: .practice))
        XCTAssertEqual(ledger.status(for: .counterpart, on: "2026-10-20"), .won)
        XCTAssertNil(ledger.status(for: .shortlist, on: "2026-10-20"))
        XCTAssertEqual(ledger.completed(on: "2026-10-20"), 1)
    }

    func testDailyStreakCanContinueAcrossDifferentGamesAndWaitForToday() {
        var ledger = ProgressLedger()
        ledger.record(message(.ringcount, "2026-10-20", .won))
        ledger.record(message(.switchpath, "2026-10-21", .won))
        XCTAssertEqual(ledger.dailyStreak(today: "2026-10-22"), 2)
        ledger.record(message(.shortlist, "2026-10-22", .lost))
        XCTAssertEqual(ledger.dailyStreak(today: "2026-10-22"), 2)
        ledger.record(message(.secondSense, "2026-10-22", .won))
        XCTAssertEqual(ledger.dailyStreak(today: "2026-10-22"), 3)
        XCTAssertEqual(ledger.dailyStreak(today: "2026-10-24"), 0)
    }

    func testRevealsNeverCreateWinsAndAllFinishedWithoutAWinBreaksToday() {
        var ledger = ProgressLedger()
        ledger.record(message(.ringcount, "2026-10-20", .won))
        for game in GameID.allCases { ledger.record(message(game, "2026-10-21", .revealed)) }
        XCTAssertEqual(ledger.completed(on: "2026-10-21"), 6)
        XCTAssertEqual(ledger.solved(on: "2026-10-21"), 0)
        XCTAssertEqual(ledger.dailyStreak(today: "2026-10-21"), 0)
        XCTAssertEqual(ledger.gameStreak(.ringcount, today: "2026-10-21"), 0)
    }

    func testFutureRecordsDoNotInflateTodaysStreak() {
        var ledger = ProgressLedger()
        ledger.record(message(.ringcount, "2026-10-20", .won))
        ledger.record(message(.ringcount, "2026-10-21", .won))
        XCTAssertEqual(ledger.dailyStreak(today: "2026-10-20"), 1)
    }

    @MainActor
    func testStaleWebStatisticsCannotEraseARecordedWinButStreakCanExpire() {
        let suite = "AlfordDailyTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let store = ProgressStore(defaults: defaults)
        let won = GameStatistics(played: 1, won: 1, streak: 1, bestStreak: 1)
        store.accept(ProgressMessage(game: .ringcount, mode: .daily, dateKey: "2026-10-20", status: .won, stats: won))
        store.accept(message(.ringcount, "2026-10-20", .playing))
        XCTAssertEqual(store.ledger.status(for: .ringcount, on: "2026-10-20"), .won)
        XCTAssertEqual(store.stats(for: .ringcount), won)
        XCTAssertEqual(ProgressStore(defaults: defaults).stats(for: .ringcount), won)
        let expired = GameStatistics(played: 1, won: 1, streak: 0, bestStreak: 1)
        store.accept(ProgressMessage(game: .ringcount, mode: .daily, dateKey: "2026-10-22", status: .playing, stats: expired))
        XCTAssertEqual(store.stats(for: .ringcount).streak, 0)
        XCTAssertEqual(store.stats(for: .ringcount).won, 1)
    }

    @MainActor
    func testPersistenceRoundTripAndResetPreservePreferences() {
        let suite = "AlfordDailyTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let store = ProgressStore(defaults: defaults)
        store.updatePreferences { $0.hapticsEnabled = false }
        store.accept(message(.ringcount, "2026-10-20", .won))
        let restored = ProgressStore(defaults: defaults)
        XCTAssertEqual(restored.ledger.status(for: .ringcount, on: "2026-10-20"), .won)
        XCTAssertFalse(restored.preferences.hapticsEnabled)
        restored.resetProgress()
        XCTAssertEqual(ProgressStore(defaults: defaults).ledger.completed(on: "2026-10-20"), 0)
        XCTAssertFalse(ProgressStore(defaults: defaults).preferences.hapticsEnabled)
    }
}
