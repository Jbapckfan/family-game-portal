import Foundation
import CoreFoundation

struct BridgeContext {
    let isMainFrame: Bool
    let scheme: String
    let host: String
    let port: Int
    let sourceURL: URL?
    let game: GameID

    var isTrusted: Bool {
        isMainFrame && scheme == "alford" && host == "app" && port == 0
            && LocalRoute.game(at: sourceURL) == game
    }
}

enum LocalRoute {
    static func hasLocalOrigin(_ url: URL?) -> Bool {
        guard let url else { return false }
        return url.scheme == "alford" && url.host == "app" && url.port == nil
            && url.user == nil && url.password == nil
    }

    static func game(at url: URL?) -> GameID? {
        guard hasLocalOrigin(url), let url, url.query == nil,
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              !components.percentEncodedPath.contains("%") else { return nil }
        return GameID.allCases.first {
            url.path == "/games/\($0.rawValue)/" || url.path == "/games/\($0.rawValue)"
                || url.path == "/games/\($0.rawValue)/index.html"
        }
    }

    static func isHome(_ url: URL?) -> Bool {
        hasLocalOrigin(url) && (url?.path == "/" || url?.path == "" || url?.path == "/index.html")
    }
}

enum HapticKind: String, Equatable { case select, fit, miss, win }

struct ProgressMessage: Equatable {
    let game: GameID
    let mode: GameMode
    let dateKey: String
    let status: GameStatus
    let stats: GameStatistics
}

enum BridgeMessage: Equatable {
    case progress(ProgressMessage)
    case share(String)
    case haptic(HapticKind)
}

enum BridgeDecoder {
    static func decode(_ body: Any, context: BridgeContext, now: Date = Date()) -> BridgeMessage? {
        guard context.isTrusted, let value = body as? [String: Any],
              JSONSerialization.isValidJSONObject(value),
              let data = try? JSONSerialization.data(withJSONObject: value), data.count <= 16_384,
              let type = value["type"] as? String else { return nil }

        if value["slug"] != nil {
            guard value["slug"] as? String == context.game.rawValue else { return nil }
        }
        switch type {
        case "progress":
            guard context.game.isDaily else { return nil }
            guard let slug = value["slug"] as? String, let game = GameID(rawValue: slug), game == context.game,
                  value["name"] as? String == game.name,
                  let rawMode = value["mode"] as? String, let mode = GameMode(rawValue: rawMode),
                  let dateKey = value["dateKey"] as? String, DailyCalendar.date(for: dateKey) != nil,
                  dateKey >= DailyCalendar.epoch, dateKey <= DailyCalendar.key(for: now),
                  let rawStatus = value["status"] as? String, let status = GameStatus(rawValue: rawStatus),
                  status != .lost || game.allowsLoss,
                  let rawStats = value["stats"] as? [String: Any], let stats = statistics(rawStats) else { return nil }
            return .progress(ProgressMessage(game: game, mode: mode, dateKey: dateKey, status: status, stats: stats))
        case "share":
            guard let text = value["text"] as? String, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  text.utf8.count <= 4_096, !text.contains("\0") else { return nil }
            return .share(text)
        case "haptic":
            guard let rawKind = value["kind"] as? String, let kind = HapticKind(rawValue: rawKind) else { return nil }
            return .haptic(kind)
        default:
            return nil
        }
    }

    private static func number(_ value: Any?) -> Double? {
        guard let value = value as? NSNumber, CFGetTypeID(value) != CFBooleanGetTypeID(),
              value.doubleValue.isFinite, (0...1_000_000).contains(value.doubleValue) else { return nil }
        return value.doubleValue
    }

    private static func integer(_ value: Any?) -> Int? {
        guard let value = number(value), value.rounded(.towardZero) == value else { return nil }
        return Int(value)
    }

    private static func statistics(_ raw: [String: Any]) -> GameStatistics? {
        guard let played = integer(raw["played"]), let won = integer(raw["won"]),
              let streak = integer(raw["streak"]), let best = integer(raw["bestStreak"]) else { return nil }
        for key in ["perfect", "unassisted"] where raw[key] != nil {
            guard integer(raw[key]) != nil else { return nil }
        }
        for key in ["averageAttempts", "averageScans", "averageChecks", "averageMoves"] where raw[key] != nil {
            guard number(raw[key]) != nil else { return nil }
        }
        let result = GameStatistics(played: played, won: won, streak: streak, bestStreak: best,
            perfect: integer(raw["perfect"]), unassisted: integer(raw["unassisted"]),
            averageAttempts: number(raw["averageAttempts"]), averageScans: number(raw["averageScans"]),
            averageChecks: number(raw["averageChecks"]), averageMoves: number(raw["averageMoves"]))
        return result.isValid ? result : nil
    }
}
