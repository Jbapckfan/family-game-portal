import Foundation
import Observation

@MainActor @Observable
final class ProgressStore {
    private(set) var ledger = ProgressLedger()
    private(set) var statistics: [String: GameStatistics] = [:]
    private(set) var preferences = AppPreferences()
    private(set) var resetGeneration = UUID()
    private(set) var storageError: String?

    @ObservationIgnored private let defaults: UserDefaults
    @ObservationIgnored private let progressKey = "alford.native.progress.v1"
    @ObservationIgnored private let preferencesKey = "alford.native.preferences.v1"

    private struct Snapshot: Codable {
        let version: Int
        let ledger: ProgressLedger
        let statistics: [String: GameStatistics]
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        if let data = defaults.data(forKey: progressKey),
           let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data), snapshot.version == 1 {
            ledger = snapshot.ledger.sanitized()
            statistics = snapshot.statistics.filter { GameID(rawValue: $0.key) != nil && $0.value.isValid }
        }
        if let data = defaults.data(forKey: preferencesKey),
           let stored = try? JSONDecoder().decode(AppPreferences.self, from: data) {
            preferences = stored.sanitized
        }
    }

    func accept(_ progress: ProgressMessage) {
        let previousLedger = ledger
        let previousStats = statistics[progress.game.rawValue]
        ledger.record(progress)
        // Lifetime counters cannot shrink unless the user explicitly clears all
        // progress. A stale WebKit save must not erase a result already observed
        // by the native app. The current streak may legitimately fall to zero.
        let candidate = progress.stats
        if candidate.isValid, previousStats.map({ previous in
            candidate.played >= previous.played && candidate.won >= previous.won
                && candidate.bestStreak >= previous.bestStreak
                && (candidate.perfect ?? 0) >= (previous.perfect ?? 0)
                && (candidate.unassisted ?? 0) >= (previous.unassisted ?? 0)
        }) ?? true {
            statistics[progress.game.rawValue] = candidate
        }
        guard ledger != previousLedger || previousStats != statistics[progress.game.rawValue] else { return }
        persistProgress()
    }

    func updatePreferences(_ change: (inout AppPreferences) -> Void) {
        var next = preferences
        change(&next)
        preferences = next.sanitized
        if let data = try? JSONEncoder().encode(preferences) { defaults.set(data, forKey: preferencesKey) }
    }

    func resetProgress() {
        ledger = ProgressLedger()
        statistics = [:]
        defaults.removeObject(forKey: progressKey)
        resetGeneration = UUID()
        storageError = nil
    }

    func stats(for game: GameID) -> GameStatistics { statistics[game.rawValue] ?? .empty }

    private func persistProgress() {
        do {
            let data = try JSONEncoder().encode(Snapshot(version: 1, ledger: ledger, statistics: statistics))
            defaults.set(data, forKey: progressKey)
            storageError = nil
        } catch {
            storageError = "Your record could not be saved. The current session is still available."
        }
    }
}
