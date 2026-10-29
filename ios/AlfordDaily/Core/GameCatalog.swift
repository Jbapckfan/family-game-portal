import Foundation

enum GameCreator: String, CaseIterable, Identifiable, Hashable {
    case chatGPT = "ChatGPT"
    case kimi = "Kimi"
    case deepSeek = "DeepSeek"
    case qwen = "Qwen"
    case claude = "Claude"
    var id: String { rawValue }
    var credit: String {
        self == .deepSeek ? "Concept by DeepSeek · Built by ChatGPT" : "Developed by \(rawValue)"
    }
}

enum CreatorFilter: String, CaseIterable, Identifiable, Hashable {
    case all = "All"
    case chatGPT = "ChatGPT"
    case kimi = "Kimi"
    case deepSeek = "DeepSeek"
    case qwen = "Qwen"
    case claude = "Claude"
    var id: String { rawValue }
    var games: [GameID] {
        GameID.dailyGames.filter { self == .all || $0.creator.rawValue == rawValue }
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
    case deepSeekTwinHive = "deepseek-twin-hive"
    case deepSeekSpare = "deepseek-spare"
    case deepSeekRung = "deepseek-rung"
    case deepSeekCipher = "deepseek-cipher"
    case deepSeekTrail = "deepseek-trail"
    case deepSeekSplit = "deepseek-split"
    case qwenQuadra = "qwen-quadra"
    case qwenLogicLattice = "qwen-logic-lattice"
    case qwenSyntaxSiege = "qwen-syntax-siege"
    case qwenMemoryMaze = "qwen-memory-maze"
    case qwenPatternPrism = "qwen-pattern-prism"
    case qwenTerritoryTactics = "qwen-territory-tactics"
    case claudeDovetail = "claude-dovetail"
    case claudeSplice = "claude-splice"
    case claudeSprout = "claude-sprout"
    case claudeTangle = "claude-tangle"
    case claudeKeystone = "claude-keystone"
    case claudeTumbler = "claude-tumbler"
    case nestedTicTacToe = "nested-tic-tac-toe"

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
        case .deepSeekTwinHive: "Twin Hive"
        case .deepSeekSpare: "Spare"
        case .deepSeekRung: "Rung"
        case .deepSeekCipher: "Cipher"
        case .deepSeekTrail: "Trail"
        case .deepSeekSplit: "Split"
        case .qwenQuadra: "Quadra"
        case .qwenLogicLattice: "Logic Lattice"
        case .qwenSyntaxSiege: "Syntax Siege"
        case .qwenMemoryMaze: "Memory Maze"
        case .qwenPatternPrism: "Pattern Prism"
        case .qwenTerritoryTactics: "Territory Tactics"
        case .claudeDovetail: "Dovetail"
        case .claudeSplice: "Splice"
        case .claudeSprout: "Sprout"
        case .claudeTangle: "Tangle"
        case .claudeKeystone: "Keystone"
        case .claudeTumbler: "Tumbler"
        case .nestedTicTacToe: "Tic-Tac-Toe"
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
        case .deepSeekTwinHive: "Every word needs both golden letters."
        case .deepSeekSpare: "Four meaning pairs. One word left over."
        case .deepSeekRung: "One letter at a time. Reach the target."
        case .deepSeekCipher: "One secret alphabet. Decode the phrase."
        case .deepSeekTrail: "Nine tiles. One winding word."
        case .deepSeekSplit: "Ten letters. Two clued words."
        case .qwenQuadra: "Four words. One category. Sixteen letters."
        case .qwenLogicLattice: "Fill the grid. Satisfy every clue."
        case .qwenSyntaxSiege: "Build words before the wave reaches you."
        case .qwenMemoryMaze: "Study the route. Find it from memory."
        case .qwenPatternPrism: "Find the rule. Predict what comes next."
        case .qwenTerritoryTactics: "Two moves. Surround and capture."
        case .claudeDovetail: "Fill the missing links in a compound-word chain."
        case .claudeSplice: "Twelve word halves. Six complete words."
        case .claudeSprout: "Add a letter. Grow an eight-letter bloom."
        case .claudeTangle: "Three words. One string. Keep their letter order."
        case .claudeKeystone: "One hidden word connects every clue."
        case .claudeTumbler: "Read the alphabet ranges. Crack the lock."
        case .nestedTicTacToe: "Nine boards. Your move chooses the next."
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
        case .deepSeekTwinHive: "hexagon"
        case .deepSeekSpare: "rectangle.split.2x2"
        case .deepSeekRung: "arrow.up.right"
        case .deepSeekCipher: "lock.open"
        case .deepSeekTrail: "point.topleft.down.curvedto.point.bottomright.up"
        case .deepSeekSplit: "rectangle.split.2x1"
        case .qwenQuadra: "square.grid.2x2"
        case .qwenLogicLattice: "square.grid.3x3"
        case .qwenSyntaxSiege: "shield"
        case .qwenMemoryMaze: "brain.head.profile"
        case .qwenPatternPrism: "diamond"
        case .qwenTerritoryTactics: "flag"
        case .claudeDovetail: "link"
        case .claudeSplice: "rectangle.split.2x1"
        case .claudeSprout: "leaf"
        case .claudeTangle: "line.3.horizontal"
        case .claudeKeystone: "building.columns"
        case .claudeTumbler: "lock"
        case .nestedTicTacToe: "square.grid.3x3"
        }
    }

    var isFlagship: Bool { self == .ringcount || self == .switchpath }

    var isDaily: Bool { self != .nestedTicTacToe }
    static var dailyGames: [GameID] { allCases.filter(\.isDaily) }
    static let bonusGames: [GameID] = [.nestedTicTacToe]
    static let featured: [GameID] = [.counterpart, .shortlist, .secondSense, .sideways]

    static func todaysThree(on dateKey: String, available: [GameID] = dailyGames) -> [GameID] {
        guard let number = DailyCalendar.number(for: dateKey) else { return [] }
        let allowed = Set(available.filter(\.isDaily))
        let selected: [GameID] = dateKey < "2026-10-28" ? [.ringcount, .switchpath, .counterpart, .shortlist] : featured
        let preferred = selected.filter(allowed.contains)
        let pool = preferred.count >= 3 ? preferred : preferred + dailyGames.filter { allowed.contains($0) && !selected.contains($0) }
        guard !pool.isEmpty else { return [] }
        let start = ((number - 1) % pool.count + pool.count) % pool.count
        return (0..<min(3, pool.count)).map { pool[(start + $0) % pool.count] }
    }
    var creator: GameCreator {
        switch self {
        case .kimiCairn, .kimiMorph, .kimiTangle, .kimiHunch, .kimiCircuit, .kimiQuartet: .kimi
        case .deepSeekTwinHive, .deepSeekSpare, .deepSeekRung, .deepSeekCipher, .deepSeekTrail, .deepSeekSplit: .deepSeek
        case .qwenQuadra, .qwenLogicLattice, .qwenSyntaxSiege, .qwenMemoryMaze, .qwenPatternPrism, .qwenTerritoryTactics: .qwen
        case .claudeDovetail, .claudeSplice, .claudeSprout, .claudeTangle, .claudeKeystone, .claudeTumbler: .claude
        default: .chatGPT
        }
    }
    var credit: String {
        creator == .qwen && self != .qwenQuadra ? "Concept by Qwen · Built by ChatGPT" : creator.credit
    }
    var attributionDescription: String {
        if creator == .deepSeek || (creator == .qwen && self != .qwenQuadra) {
            return "Original concept: \(creator.rawValue). Playable implementation and integration: ChatGPT. Both contributions remain credited in this collection."
        }
        return "Original developer: \(creator.rawValue). Included in the Alford Daily collection with its original attribution."
    }
    var allowsLoss: Bool {
        [GameID.shortlist, .kimiHunch, .kimiQuartet, .deepSeekSpare, .qwenQuadra, .qwenSyntaxSiege,
         .claudeDovetail, .claudeSplice, .claudeSprout, .claudeTangle, .claudeKeystone, .claudeTumbler].contains(self)
    }
    var collectionCount: Int {
        switch self {
        case .switchpath: 217
        case .kimiCairn: 839
        case .kimiMorph: 450
        case .kimiTangle: 430
        case .kimiHunch: 937
        case .kimiCircuit: 286
        case .kimiQuartet: 420
        case .deepSeekTwinHive: 200
        case .qwenPatternPrism: 225
        case .deepSeekSpare, .deepSeekRung, .deepSeekCipher, .deepSeekTrail, .deepSeekSplit,
             .qwenQuadra, .qwenLogicLattice, .qwenSyntaxSiege, .qwenMemoryMaze, .qwenTerritoryTactics: 200
        case .claudeDovetail: 200
        case .claudeSplice: 202
        case .claudeSprout: 211
        case .claudeTangle: 200
        case .claudeKeystone: 200
        case .claudeTumbler: 1054
        case .nestedTicTacToe: 0
        default: 210
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
