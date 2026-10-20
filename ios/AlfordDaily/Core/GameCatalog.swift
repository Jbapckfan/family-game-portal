import Foundation

enum GameID: String, CaseIterable, Codable, Identifiable, Hashable {
    case ringcount
    case switchpath
    case counterpart
    case shortlist
    case secondSense = "second-sense"
    case sideways

    var id: String { rawValue }

    var name: String {
        switch self {
        case .ringcount: "Ringcount"
        case .switchpath: "Switchpath"
        case .counterpart: "Counterpart"
        case .shortlist: "Shortlist"
        case .secondSense: "Second Sense"
        case .sideways: "Sideways"
        }
    }

    var subtitle: String {
        switch self {
        case .ringcount: "Four cuts. One perfect balance."
        case .switchpath: "Higher. Lower. Find a way through."
        case .counterpart: "Different words. The same relationship."
        case .shortlist: "Twelve words. Three good questions."
        case .secondSense: "One spelling. Two meanings."
        case .sideways: "Move across. Read down."
        }
    }

    var symbol: String {
        switch self {
        case .ringcount: "circle.dotted.circle"
        case .switchpath: "arrow.triangle.branch"
        case .counterpart: "arrow.left.arrow.right"
        case .shortlist: "line.3.horizontal.decrease.circle"
        case .secondSense: "text.bubble"
        case .sideways: "arrow.left.and.right"
        }
    }

    var isFlagship: Bool { self == .ringcount || self == .switchpath }
    var collectionCount: Int { self == .counterpart || self == .secondSense ? 30 : 90 }
    var localURL: URL { URL(string: "alford://app/games/\(rawValue)/")! }
}

enum GameStatus: String, Codable, CaseIterable {
    case playing, won, lost, revealed
    var isTerminal: Bool { self != .playing }
    var label: String {
        switch self {
        case .playing: "In progress"
        case .won: "Solved"
        case .lost: "Finished"
        case .revealed: "Revealed"
        }
    }
}

enum GameMode: String, Codable { case daily, practice }

struct GameStatistics: Codable, Equatable {
    var played: Int
    var won: Int
    var streak: Int
    var bestStreak: Int
    var perfect: Int?
    var unassisted: Int?
    var averageAttempts: Double?
    var averageScans: Double?
    var averageChecks: Double?
    var averageMoves: Double?

    static let empty = GameStatistics(played: 0, won: 0, streak: 0, bestStreak: 0)

    var isValid: Bool {
        let counts = [played, won, streak, bestStreak] + [perfect, unassisted].compactMap { $0 }
        let averages = [averageAttempts, averageScans, averageChecks, averageMoves].compactMap { $0 }
        return counts.allSatisfy { (0...1_000_000).contains($0) }
            && won <= played && streak <= bestStreak && bestStreak <= won
            && (perfect ?? 0) <= won && (unassisted ?? 0) <= won
            && averages.allSatisfy { $0.isFinite && (0...1_000_000).contains($0) }
    }
}
