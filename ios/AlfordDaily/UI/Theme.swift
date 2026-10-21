import SwiftUI

/// Shared collection colors. Per-game palettes mirror design/identities.json.
enum Theme {
    static let paper = color(0xf6f3ec)
    static let card = color(0xfffdf8)
    static let ink = color(0x202c35)
    static let muted = color(0x59636a)
    static let accent = ink
    static let line = color(0xd9d5cb)

    static func color(_ rgb: UInt32) -> Color {
        Color(.sRGB,
              red: Double((rgb >> 16) & 0xff) / 255,
              green: Double((rgb >> 8) & 0xff) / 255,
              blue: Double(rgb & 0xff) / 255,
              opacity: 1)
    }
}

struct GamePalette {
    let accent: Color
    let ink: Color
    let wash: Color
    let edge: Color

    init(accent: UInt32, ink: UInt32, wash: UInt32, edge: UInt32) {
        self.accent = Theme.color(accent)
        self.ink = Theme.color(ink)
        self.wash = Theme.color(wash)
        self.edge = Theme.color(edge)
    }
}

extension GameID {
    var tint: Color { palette.accent }

    var palette: GamePalette {
        switch self {
        case .ringcount: GamePalette(accent: 0x996519, ink: 0x755015, wash: 0xf6e9cc, edge: 0xe2c68f)
        case .switchpath: GamePalette(accent: 0x355fa7, ink: 0x264a86, wash: 0xe5edfb, edge: 0xbed0ed)
        case .counterpart: GamePalette(accent: 0xb2573f, ink: 0x8e402d, wash: 0xf7e6dd, edge: 0xe2bfaa)
        case .shortlist: GamePalette(accent: 0x2f5baf, ink: 0x214586, wash: 0xe7eefc, edge: 0xbdceed)
        case .secondSense: GamePalette(accent: 0x855194, ink: 0x673b75, wash: 0xefe4f4, edge: 0xd9bfe1)
        case .sideways: GamePalette(accent: 0xb75c36, ink: 0x8e4327, wash: 0xf8e6d7, edge: 0xe6bf9f)
        case .tradeoff: GamePalette(accent: 0xa44957, ink: 0x823442, wash: 0xf7e4e7, edge: 0xdfb6bf)
        case .inbetween: GamePalette(accent: 0x247a7e, ink: 0x195b60, wash: 0xe0f0ef, edge: 0xacd4ce)
        case .kimiCairn: GamePalette(accent: 0x39766f, ink: 0x285b55, wash: 0xe0efea, edge: 0xb5d5ca)
        case .kimiMorph: GamePalette(accent: 0x7054a1, ink: 0x523b7e, wash: 0xede6f7, edge: 0xcfc0e4)
        case .kimiTangle: GamePalette(accent: 0x527b35, ink: 0x3b5c24, wash: 0xeaf0dc, edge: 0xc6d6aa)
        case .kimiHunch: GamePalette(accent: 0x94701c, ink: 0x705210, wash: 0xf7edca, edge: 0xe4ce8d)
        case .kimiCircuit: GamePalette(accent: 0x287d8a, ink: 0x1a5d68, wash: 0xdff0f2, edge: 0xacd5db)
        case .kimiQuartet: GamePalette(accent: 0x9a4f74, ink: 0x763858, wash: 0xf4e3ed, edge: 0xdfb7cd)
        case .deepSeekTwinHive: GamePalette(accent: 0x916719, ink: 0x6e4c0f, wash: 0xf6eacc, edge: 0xe4ca8c)
        case .deepSeekSpare: GamePalette(accent: 0x9d4868, ink: 0x76334d, wash: 0xf7e3eb, edge: 0xdfb2c4)
        case .deepSeekRung: GamePalette(accent: 0x287a73, ink: 0x195c57, wash: 0xe0f1ea, edge: 0xa8d6c8)
        case .deepSeekCipher: GamePalette(accent: 0x6c4bb3, ink: 0x50358b, wash: 0xece5fa, edge: 0xcbb9e9)
        case .deepSeekTrail: GamePalette(accent: 0x347353, ink: 0x24573c, wash: 0xe3efdc, edge: 0xb4d0a4)
        case .deepSeekSplit: GamePalette(accent: 0xb54f40, ink: 0x8e392d, wash: 0xfae5dc, edge: 0xe8b9a9)
        case .qwenQuadra: GamePalette(accent: 0x594ab5, ink: 0x41358d, wash: 0xe9e6fb, edge: 0xc7bfed)
        case .qwenLogicLattice: GamePalette(accent: 0x286a8a, ink: 0x1b4f6b, wash: 0xe2f0f6, edge: 0xb0d0df)
        case .qwenSyntaxSiege: GamePalette(accent: 0xb7562a, ink: 0x8f3e1b, wash: 0xf9e8d9, edge: 0xe7bd9f)
        case .qwenMemoryMaze: GamePalette(accent: 0x405caa, ink: 0x2c4383, wash: 0xe6ebfb, edge: 0xbdcaeb)
        case .qwenPatternPrism: GamePalette(accent: 0x8c4a90, ink: 0x6b346f, wash: 0xf3e5f4, edge: 0xddbcdf)
        case .qwenTerritoryTactics: GamePalette(accent: 0x356f58, ink: 0x25523f, wash: 0xe3efe5, edge: 0xb3d0bd)
        case .claudeDovetail: GamePalette(accent: 0x9d543b, ink: 0x783c29, wash: 0xf5e5d8, edge: 0xdfbda4)
        case .claudeSplice: GamePalette(accent: 0x3258b7, ink: 0x24418e, wash: 0xe5ecfc, edge: 0xb8c9ef)
        case .claudeSprout: GamePalette(accent: 0x37735a, ink: 0x26563f, wash: 0xe4f0df, edge: 0xb8d2a6)
        case .claudeTangle: GamePalette(accent: 0x83529b, ink: 0x633975, wash: 0xefe3f5, edge: 0xd5b9e0)
        case .claudeKeystone: GamePalette(accent: 0x936b2a, ink: 0x70501b, wash: 0xf5ead5, edge: 0xdfc597)
        case .claudeTumbler: GamePalette(accent: 0x385d85, ink: 0x284663, wash: 0xe4edf5, edge: 0xbacfe0)
        }
    }
}

/// A consistent home for each game's own symbol and palette.
struct GameEmblem: View {
    let game: GameID
    var size: CGFloat = 60

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.25, style: .continuous)
                .fill(Theme.card)
            RoundedRectangle(cornerRadius: size * 0.25, style: .continuous)
                .stroke(game.palette.edge, lineWidth: 1)
            Circle().stroke(game.palette.edge.opacity(0.65), lineWidth: 1)
                .padding(size * 0.12)
            Image(systemName: game.symbol)
                .font(.system(size: size * 0.43, weight: .medium))
                .foregroundStyle(game.palette.ink)
        }
        .frame(width: size, height: size)
        .shadow(color: game.palette.ink.opacity(0.08), radius: 0, x: 0, y: 3)
        .accessibilityHidden(true)
    }
}

struct MetricView: View {
    let value: String
    let label: String
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(value).font(.system(.title, design: .serif).weight(.semibold)).monospacedDigit()
                .foregroundStyle(Theme.ink)
            Text(label).font(.caption).foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }
}

struct PaperCard: ViewModifier {
    func body(content: Content) -> some View {
        content.padding(20)
            .background(Theme.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Theme.line, lineWidth: 1))
            .shadow(color: Theme.ink.opacity(0.035), radius: 0, x: 0, y: 4)
    }
}

extension View { func paperCard() -> some View { modifier(PaperCard()) } }
