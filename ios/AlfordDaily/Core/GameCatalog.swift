import Foundation

enum GameCreator: String, CaseIterable, Identifiable, Hashable {
    case chatGPT = "ChatGPT"
    case kimi = "Kimi"
    var id: String { rawValue }
    var credit: String { "Developed by \(rawValue)" }
}

enum CreatorFilter: String, CaseIterable, Identifiable, Hashable {
    case all = "All"
    case chatGPT = "ChatGPT"
    case kimi = "Kimi"
    var id: String { rawValue }
    var games: [GameID] {
        GameID.allCases.filter { self == .all || $0.creator.rawValue == rawValue }
    }
}

enum GameID: String, CaseIterable, Codable, Identifiable, Hashable {
    case ringcount
    case switchpath
    case counterpart
    case shortlist
    case secondSense = "second-sense"
    case sideways
    case tradeoff
    case inbetween
    case kimiCairn = "kimi-cairn"
    case kimiMorph = "kimi-morph"
    case kimiTangle = "kimi-tangle"
    case kimiHunch = "kimi-hunch"
    case kimiCircuit = "kimi-circuit"
    case kimiQuartet = "kimi-quartet"

    var id: String { rawValue }

    var name: String {
        switch self {
        case .ringcount: "Ringcount"
        case .switchpath: "Switchpath"
        case .counterpart: "Counterpart"
        case .shortlist: "Shortlist"
        case .secondSense: "Second Sense"
        case .sideways: "Sideways"
        case .tradeoff: "Tradeoff"
        case .inbetween: "Inbetween"
        case .kimiCairn: "Cairn"
        case .kimiMorph: "Morph"
        case .kimiTangle: "Tangle"
        case .kimiHunch: "Hunch"
        case .kimiCircuit: "Circuit"
        case .kimiQuartet: "Quartet"
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
        case .tradeoff: "Trade letters. Make every word fit."
        case .inbetween: "Find a home for every letter pair."
        case .kimiCairn: "Add a letter. Build a word tower."
        case .kimiMorph: "Change one letter. Find a path."
        case .kimiTangle: "Trace words. Reach for gold."
        case .kimiHunch: "Follow your clues to the hidden word."
        case .kimiCircuit: "Chain words around the letter arcs."
        case .kimiQuartet: "Sixteen words. Four connections."
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
        case .tradeoff: "arrow.2.squarepath"
        case .inbetween: "character.cursor.ibeam"
        case .kimiCairn: "square.stack.3d.up"
        case .kimiMorph: "point.topleft.down.curvedto.point.bottomright.up"
        case .kimiTangle: "point.3.connected.trianglepath.dotted"
        case .kimiHunch: "lightbulb"
        case .kimiCircuit: "circle.hexagongrid"
        case .kimiQuartet: "square.grid.2x2"
        }
    }

    var isFlagship: Bool { self == .ringcount || self == .switchpath }
    var creator: GameCreator {
        switch self {
        case .kimiCairn, .kimiMorph, .kimiTangle, .kimiHunch, .kimiCircuit, .kimiQuartet: .kimi
        default: .chatGPT
        }
    }
    var allowsLoss: Bool { self == .shortlist || self == .kimiHunch || self == .kimiQuartet }
    var collectionCount: Int {
        switch self {
        case .counterpart, .secondSense: 30
        case .inbetween: 60
        case .kimiCairn: 839
        case .kimiMorph: 450
        case .kimiTangle: 430
        case .kimiHunch: 937
        case .kimiCircuit: 286
        case .kimiQuartet: 420
        default: 90
        }
    }
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
