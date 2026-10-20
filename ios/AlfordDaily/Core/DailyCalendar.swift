import Foundation

enum DailyCalendar {
    static let timeZone = TimeZone(identifier: "America/Chicago")!
    static let epoch = "2026-10-20"

    static var calendar: Calendar {
        var value = Calendar(identifier: .gregorian)
        value.timeZone = timeZone
        value.locale = Locale(identifier: "en_US_POSIX")
        return value
    }

    static func key(for date: Date = Date()) -> String {
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year!, parts.month!, parts.day!)
    }

    static func date(for key: String) -> Date? {
        guard key.range(of: #"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"#, options: .regularExpression) != nil else { return nil }
        let parts = key.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3, parts[0] > 0 else { return nil }
        var components = DateComponents()
        components.year = parts[0]
        components.month = parts[1]
        components.day = parts[2]
        components.timeZone = timeZone
        guard let date = calendar.date(from: components), self.key(for: date) == key else { return nil }
        return date
    }

    static func shifted(_ key: String, days: Int) -> String? {
        guard let date = date(for: key), let next = calendar.date(byAdding: .day, value: days, to: date) else { return nil }
        return self.key(for: next)
    }

    static func number(for key: String) -> Int? {
        guard let date = date(for: key), let first = date(for: epoch),
              let distance = calendar.dateComponents([.day], from: first, to: date).day else { return nil }
        return distance + 1
    }

    static func display(_ date: Date = Date()) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US")
        formatter.timeZone = timeZone
        formatter.dateFormat = "EEEE, MMMM d"
        return formatter.string(from: date)
    }
}
