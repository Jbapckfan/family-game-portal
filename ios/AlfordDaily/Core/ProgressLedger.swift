import Foundation

struct ProgressLedger: Codable, Equatable {
    private(set) var days: [String: [String: GameStatus]] = [:]

    mutating func record(_ message: ProgressMessage) {
        guard message.mode == .daily else { return }
        var day = days[message.dateKey] ?? [:]
        guard day[message.game.rawValue]?.isTerminal != true else { return }
        day[message.game.rawValue] = message.status
        days[message.dateKey] = day
    }

    func status(for game: GameID, on dateKey: String) -> GameStatus? { days[dateKey]?[game.rawValue] }

    func completed(on dateKey: String) -> Int {
        GameID.allCases.filter { status(for: $0, on: dateKey)?.isTerminal == true }.count
    }

    func solved(on dateKey: String) -> Int {
        GameID.allCases.filter { status(for: $0, on: dateKey) == .won }.count
    }

    func dailyStreak(today: String) -> Int {
        guard DailyCalendar.date(for: today) != nil else { return 0 }
        if completed(on: today) == GameID.allCases.count && solved(on: today) == 0 { return 0 }
        var cursor = solved(on: today) > 0 ? today : DailyCalendar.shifted(today, days: -1)
        var count = 0
        while let day = cursor, solved(on: day) > 0 {
            count += 1
            cursor = DailyCalendar.shifted(day, days: -1)
        }
        return count
    }

    func gameStreak(_ game: GameID, today: String) -> Int {
        if let result = status(for: game, on: today), result.isTerminal && result != .won { return 0 }
        var cursor = status(for: game, on: today) == .won ? today : DailyCalendar.shifted(today, days: -1)
        var count = 0
        while let day = cursor, status(for: game, on: day) == .won {
            count += 1
            cursor = DailyCalendar.shifted(day, days: -1)
        }
        return count
    }

    func sanitized() -> ProgressLedger {
        var result = ProgressLedger()
        for (date, entries) in days where date >= DailyCalendar.epoch && DailyCalendar.date(for: date) != nil {
            let valid = entries.filter { key, status in
                guard let game = GameID(rawValue: key) else { return false }
                return status != .lost || game == .shortlist
            }
            if !valid.isEmpty { result.days[date] = valid }
        }
        return result
    }
}

struct AppPreferences: Codable, Equatable {
    var hapticsEnabled = true
    var reminderEnabled = false
    var reminderHour = 9
    var reminderMinute = 0

    var sanitized: AppPreferences {
        var copy = self
        if !(0...23).contains(copy.reminderHour) { copy.reminderHour = 9 }
        if !(0...59).contains(copy.reminderMinute) { copy.reminderMinute = 0 }
        return copy
    }
}
