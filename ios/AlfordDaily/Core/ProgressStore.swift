import Foundation
import Observation

@MainActor @Observable
final class ProgressStore {
    private(set) var ledger = ProgressLedger()
    private(set) var statistics: [String: GameStatistics] = [:]
    private(set) var preferences = AppPreferences()
    private(set) var gamePreferences: [GameID: GamePreference] = [:]
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
        for game in GameID.allCases {
            if let data = defaults.data(forKey: gamePreferenceKey(game)),
               let stored = try? JSONDecoder().decode(GamePreference.self, from: data) {
                gamePreferences[game] = stored
            }
        }
        if let data = defaults.data(forKey: progressKey),
           let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data), snapshot.version == 1 {
            ledger = snapshot.ledger.sanitized()
            statistics = snapshot.statistics.filter { GameID(rawValue: $0.key)?.isDaily == true && $0.value.isValid }
        }
        if let data = defaults.data(forKey: preferencesKey),
           let stored = try? JSONDecoder().decode(AppPreferences.self, from: data) {
            preferences = stored.sanitized
        }
    }

    func accept(_ progress: ProgressMessage) {
        guard progress.game.isDaily else { return }
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

    func gamePreference(for game: GameID) -> GamePreference { gamePreferences[game] ?? GamePreference() }

    func setGamePreference(_ preference: GamePreference, for game: GameID) {
        guard let data = try? JSONEncoder().encode(preference) else { return }
        gamePreferences[game] = preference
        defaults.set(data, forKey: gamePreferenceKey(game))
    }

    func toggleFavorite(_ game: GameID) {
        var preference = gamePreference(for: game)
        preference.favorite.toggle()
        setGamePreference(preference, for: game)
    }

    func toggleHidden(_ game: GameID) {
        var preference = gamePreference(for: game)
        preference.hidden.toggle()
        setGamePreference(preference, for: game)
    }

    func visibleGames(_ games: [GameID], favoritesOnly: Bool = false, showHidden: Bool = false) -> [GameID] {
        games.filter { game in
            let preference = gamePreference(for: game)
            return (showHidden || !preference.hidden) && (!favoritesOnly || preference.favorite)
        }
    }

    private func gamePreferenceKey(_ game: GameID) -> String { "alford:game-pref:v1:\(game.rawValue)" }

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
