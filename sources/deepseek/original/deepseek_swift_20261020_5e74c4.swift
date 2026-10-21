//  DailySix.swift
//  Six daily word games, one app.

import SwiftUI

// MARK: - App

@main
struct DailySixApp: App {
    var body: some Scene {
        WindowGroup { RootView() }
    }
}

struct RootView: View {
    var body: some View {
        NavigationStack { HomeView() }
            .tint(Theme.ink)
    }
}

// MARK: - Theme

enum Theme {
    static let bg   = Color(uiColor: .systemGroupedBackground)
    static let card = Color(uiColor: .secondarySystemGroupedBackground)
    static let ink  = Color(uiColor: .label)
    static let sub  = Color(uiColor: .secondaryLabel)
    static let line = Color(uiColor: .separator)
}

extension Font {
    static func tile(_ s: CGFloat) -> Font { .system(size: s, weight: .bold, design: .rounded) }
    static func r(_ s: CGFloat, _ w: Font.Weight = .semibold) -> Font {
        .system(size: s, weight: w, design: .rounded)
    }
}

struct PressableStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

enum Haptics {
    static func tap()   { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func good()  { UINotificationFeedbackGenerator().notificationOccurred(.success) }
    static func bad()   { UINotificationFeedbackGenerator().notificationOccurred(.error) }
}

// MARK: - Daily seeding

struct SeededGenerator: RandomNumberGenerator {
    private var state: UInt64
    init(seed: UInt64) { state = seed == 0 ? 0x9E37_79B9_7F4A_7C15 : seed }
    mutating func next() -> UInt64 {
        state ^= state << 13; state ^= state >> 7; state ^= state << 17
        return state
    }
}

enum Daily {
    /// Replace `stableHash` with a real FNV-1a hash — Swift's `hashValue`
    /// is seeded per launch and will break "same puzzle for everyone".
    static func seed(for game: GameID, date: Date = .now) -> UInt64 {
        let day = UInt64(Calendar.current.ordinality(of: .day, in: .era, for: date) ?? 0)
        return day &* 1_000_003 &+ stableHash(game.rawValue)
    }
    static func stableHash(_ s: String) -> UInt64 {
        s.utf8.reduce(14_695_981_039_346_656_037) { ($0 ^ UInt64($1)) &* 109_951_162_821_193_847_1 }
    }
}

// MARK: - Catalog

enum GameID: String, CaseIterable, Identifiable {
    case twinHive, spare, rung, cipher, trail, split
    var id: String { rawValue }

    var title: String {
        switch self {
        case .twinHive: return "Twin Hive"
        case .spare:    return "Spare"
        case .rung:     return "Rung"
        case .cipher:   return "Cipher"
        case .trail:    return "Trail"
        case .split:    return "Split"
        }
    }

    var tagline: String {
        switch self {
        case .twinHive: return "Spelling Bee, but two letters are gold and every word needs both."
        case .spare:    return "Four hidden pairs and one liar. Three strikes."
        case .rung:     return "Climb from one word to another in par or better."
        case .cipher:   return "Crack today's letter substitution."
        case .trail:    return "Find the longest word in a 3×3 letter grid."
        case .split:    return "Ten letters, exactly two words."
        }
    }

    var glyph: String {
        switch self {
        case .twinHive: return "hexagon.fill"
        case .spare:    return "square.grid.3x3.fill"
        case .rung:     return "chart.bar.fill"
        case .cipher:   return "key.horizontal.fill"
        case .trail:    return "point.topleft.down.to.point.bottomright.curvepath.fill"
        case .split:    return "square.split.2x1.fill"
        }
    }

    var accent: Color {
        switch self {
        case .twinHive: return Color(red: 0.98, green: 0.72, blue: 0.18)
        case .spare:    return Color(red: 0.36, green: 0.62, blue: 0.98)
        case .rung:     return Color(red: 0.42, green: 0.80, blue: 0.62)
        case .cipher:   return Color(red: 0.78, green: 0.52, blue: 0.96)
        case .trail:    return Color(red: 0.98, green: 0.52, blue: 0.42)
        case .split:    return Color(red: 0.36, green: 0.82, blue: 0.86)
        }
    }
}

// MARK: - Home

struct HomeView: View {
    private let cols = [GridItem(.flexible(), spacing: 14),
                        GridItem(.flexible(), spacing: 14)]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                LazyVGrid(columns: cols, spacing: 14) {
                    ForEach(GameID.allCases) { game in
                        NavigationLink(value: game) {
                            GameCard(game: game)
                        }
                        .buttonStyle(PressableStyle())
                    }
                }
            }
            .padding(20)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationDestination(for: GameID.self) { GameRouter(game: $0) }
        .toolbar(.hidden, for: .navigationBar)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(Date.now.formatted(.dateTime.weekday(.wide).month().day()))
                .font(.r(12, .bold))
                .foregroundStyle(Theme.sub)
                .textCase(.uppercase)
                .tracking(1.2)
            Text("Daily Six")
                .font(.system(size: 34, weight: .bold, design: .rounded))
            HStack(spacing: 6) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color.orange)
                Text("12 day streak")
                    .font(.r(13))
                    .foregroundStyle(Theme.sub)
            }
        }
        .padding(.top, 8)
    }
}

struct GameCard: View {
    let game: GameID

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: game.glyph)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(game.accent)
                    .frame(width: 34, height: 34)
                    .background(game.accent.opacity(0.15), in: Circle())
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(Theme.sub.opacity(0.45))
            }
            Spacer(minLength: 8)
            Text(game.title)
                .font(.r(17, .bold))
                .foregroundStyle(Theme.ink)
            Text(game.tagline)
                .font(.r(12, .medium))
                .foregroundStyle(Theme.sub)
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 152, alignment: .leading)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .strokeBorder(Theme.line.opacity(0.55), lineWidth: 1)
        )
    }
}

struct GameRouter: View {
    let game: GameID
    var body: some View {
        switch game {
        case .twinHive: TwinHiveView()
        case .spare:    SpareView()
        case .rung:     RungView()
        default:        SpecView(game: game)
        }
    }
}

// MARK: - Reusable scaffold

struct GameScaffold<Content: View>: View {
    let title: String
    let subtitle: String
    @ViewBuilder var content: Content

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.system(size: 30, weight: .bold, design: .rounded))
                    Text(subtitle).font(.r(13, .medium)).foregroundStyle(Theme.sub)
                }
                content
            }
            .padding(20)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct RankBar: View {
    let label: String
    let progress: Double
    let accent: Color

    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Text(label).font(.r(12, .bold)).foregroundStyle(Theme.ink)
                Spacer()
                Text("\(Int(progress * 100))%")
                    .font(.r(12, .semibold))
                    .foregroundStyle(Theme.sub)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.line.opacity(0.35))
                    Capsule().fill(accent)
                        .frame(width: max(8, geo.size.width * min(progress, 1)))
                }
            }
            .frame(height: 8)
        }
    }
}

struct Toast: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.r(13, .semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.black.opacity(0.82), in: Capsule())
            .transition(.move(edge: .top).combined(with: .opacity))
    }
}

// MARK: - Lexicon (swap for a real 200k word list)

enum Lexicon {
    static let words: Set<String> = [
        "ACTION","ANTIC","CANTO","CANTOR","CARTON","CATER","COAT","CRATE",
        "ORATE","REACT","REACTION","RETAIN","TACO","TRACE","TRANCE",
        "COLD","CORD","CARD","WARD","WARM"
    ]
    static func contains(_ w: String) -> Bool { words.contains(w.uppercased()) }
}