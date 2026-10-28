import XCTest
@testable import AlfordDaily

final class ProgressLedgerTests: XCTestCase {
    func testBonusCannotCreateDailyCreditAndNextActionHandlesFinishedSet() {
        var ledger = ProgressLedger()
        ledger.record(message(.nestedTicTacToe, "2026-10-28", .won))
        XCTAssertEqual(ledger.completed(on: "2026-10-28"), 0)
        XCTAssertEqual(ledger.dailyStreak(today: "2026-10-28"), 0)
        ledger.record(message(.shortlist, "2026-10-28", .playing))
        XCTAssertEqual(ledger.nextDaily(on: "2026-10-28"), .shortlist)
        ledger.record(message(.counterpart, "2026-10-28", .revealed))
        ledger.record(message(.shortlist, "2026-10-28", .lost))
        ledger.record(message(.secondSense, "2026-10-28", .won))
        XCTAssertNil(ledger.nextDaily(on: "2026-10-28"))
        XCTAssertEqual(ledger.solved(on: "2026-10-28"), 1)
    }

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
        for game in GameID.dailyGames { ledger.record(message(game, "2026-10-21", .revealed)) }
        XCTAssertEqual(ledger.completed(on: "2026-10-21"), GameID.dailyGames.count)
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
    func testSixGameSnapshotSurvivesCatalogExpansionWithoutResettingPreferences() throws {
        let suite = "AlfordDailyTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let oldSnapshot = #"{"version":1,"ledger":{"days":{"2026-10-20":{"ringcount":"won","switchpath":"revealed","counterpart":"won","shortlist":"lost","second-sense":"playing","sideways":"won"}}},"statistics":{"ringcount":{"played":1,"won":1,"streak":1,"bestStreak":1}}}"#
        let oldPreferences = #"{"hapticsEnabled":false,"reminderEnabled":false,"reminderHour":7,"reminderMinute":45}"#
        defaults.set(Data(oldSnapshot.utf8), forKey: "alford.native.progress.v1")
        defaults.set(Data(oldPreferences.utf8), forKey: "alford.native.preferences.v1")
        let store = ProgressStore(defaults: defaults)
        XCTAssertEqual(store.ledger.completed(on: "2026-10-20"), 5)
        XCTAssertEqual(store.ledger.solved(on: "2026-10-20"), 3)
        XCTAssertEqual(store.ledger.status(for: .shortlist, on: "2026-10-20"), .lost)
        XCTAssertEqual(store.stats(for: .ringcount).won, 1)
        XCTAssertFalse(store.preferences.hapticsEnabled)
        XCTAssertEqual(store.preferences.reminderHour, 7)
        XCTAssertEqual(store.preferences.reminderMinute, 45)
        for game in [GameID.tradeoff, .inbetween] + CreatorFilter.kimi.games + CreatorFilter.deepSeek.games + CreatorFilter.qwen.games + CreatorFilter.claude.games {
            XCTAssertNil(store.ledger.status(for: game, on: "2026-10-20"))
            XCTAssertEqual(store.stats(for: game), .empty)
        }
        store.accept(message(.kimiHunch, "2026-10-20", .lost))
        let restored = ProgressStore(defaults: defaults)
        XCTAssertEqual(restored.ledger.status(for: .kimiHunch, on: "2026-10-20"), .lost)
        XCTAssertEqual(restored.ledger.status(for: .ringcount, on: "2026-10-20"), .won)
        XCTAssertEqual(restored.stats(for: .ringcount).won, 1)
    }

    @MainActor
    func testFourteenGameSnapshotRetainsResultsWhenMoreCreatorsAreAdded() throws {
        let suite = "AlfordDailyTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let snapshot = #"{"version":1,"ledger":{"days":{"2026-10-20":{"ringcount":"won","switchpath":"won","counterpart":"won","shortlist":"lost","second-sense":"won","sideways":"won","tradeoff":"won","inbetween":"won","kimi-cairn":"won","kimi-morph":"won","kimi-tangle":"won","kimi-hunch":"lost","kimi-circuit":"revealed","kimi-quartet":"won"}}},"statistics":{"ringcount":{"played":1,"won":1,"streak":1,"bestStreak":1},"kimi-cairn":{"played":1,"won":1,"streak":1,"bestStreak":1}}}"#
        let preferences = #"{"hapticsEnabled":false,"reminderEnabled":false,"reminderHour":20,"reminderMinute":15}"#
        defaults.set(Data(snapshot.utf8), forKey: "alford.native.progress.v1")
        defaults.set(Data(preferences.utf8), forKey: "alford.native.preferences.v1")
        let store = ProgressStore(defaults: defaults)
        XCTAssertEqual(store.ledger.completed(on: "2026-10-20"), 14)
        XCTAssertEqual(store.ledger.solved(on: "2026-10-20"), 11)
        XCTAssertEqual(store.ledger.status(for: .kimiHunch, on: "2026-10-20"), .lost)
        XCTAssertEqual(store.ledger.status(for: .kimiCircuit, on: "2026-10-20"), .revealed)
        XCTAssertEqual(store.stats(for: .kimiCairn).won, 1)
        for game in CreatorFilter.deepSeek.games + CreatorFilter.qwen.games + CreatorFilter.claude.games {
            XCTAssertNil(store.ledger.status(for: game, on: "2026-10-20"))
            XCTAssertEqual(store.stats(for: game), .empty)
        }
        store.accept(message(.deepSeekSpare, "2026-10-20", .lost))
        store.accept(message(.qwenLogicLattice, "2026-10-20", .won))
        store.accept(message(.claudeTangle, "2026-10-20", .lost))
        let restored = ProgressStore(defaults: defaults)
        XCTAssertEqual(restored.ledger.completed(on: "2026-10-20"), 17)
        XCTAssertEqual(restored.ledger.solved(on: "2026-10-20"), 12)
        XCTAssertEqual(restored.ledger.status(for: .deepSeekSpare, on: "2026-10-20"), .lost)
        XCTAssertEqual(restored.ledger.status(for: .qwenLogicLattice, on: "2026-10-20"), .won)
        XCTAssertEqual(restored.ledger.status(for: .claudeTangle, on: "2026-10-20"), .lost)
        XCTAssertEqual(restored.ledger.status(for: .kimiTangle, on: "2026-10-20"), .won)
        XCTAssertEqual(restored.ledger.status(for: .kimiCairn, on: "2026-10-20"), .won)
        XCTAssertEqual(restored.stats(for: .kimiCairn).won, 1)
        XCTAssertFalse(restored.preferences.hapticsEnabled)
        XCTAssertEqual(restored.preferences.reminderHour, 20)
        XCTAssertEqual(restored.preferences.reminderMinute, 15)
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
