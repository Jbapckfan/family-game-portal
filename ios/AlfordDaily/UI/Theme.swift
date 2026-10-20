import SwiftUI

enum Theme {
    static let paper = Color(red: 0.973, green: 0.961, blue: 0.929)
    static let card = Color(red: 0.997, green: 0.989, blue: 0.968)
    static let ink = Color(red: 0.188, green: 0.173, blue: 0.157)
    static let muted = Color(red: 0.43, green: 0.40, blue: 0.36)
    static let accent = Color(red: 0.52, green: 0.29, blue: 0.23)
    static let line = Color(red: 0.85, green: 0.82, blue: 0.76)
}

extension GameID {
    var tint: Color {
        switch self {
        case .ringcount: Color(red: 0.64, green: 0.37, blue: 0.17)
        case .switchpath: Color(red: 0.27, green: 0.39, blue: 0.51)
        case .counterpart: Color(red: 0.56, green: 0.29, blue: 0.22)
        case .shortlist: Color(red: 0.16, green: 0.30, blue: 0.44)
        case .secondSense: Color(red: 0.44, green: 0.32, blue: 0.42)
        case .sideways: Color(red: 0.29, green: 0.42, blue: 0.38)
        case .tradeoff: Color(red: 0.59, green: 0.34, blue: 0.22)
        case .inbetween: Color(red: 0.38, green: 0.34, blue: 0.48)
        case .kimiCairn: Color(red: 0.29, green: 0.43, blue: 0.40)
        case .kimiMorph: Color(red: 0.39, green: 0.35, blue: 0.55)
        case .kimiTangle: Color(red: 0.33, green: 0.45, blue: 0.27)
        case .kimiHunch: Color(red: 0.59, green: 0.39, blue: 0.14)
        case .kimiCircuit: Color(red: 0.24, green: 0.42, blue: 0.53)
        case .kimiQuartet: Color(red: 0.53, green: 0.31, blue: 0.40)
        }
    }
}

struct MetricView: View {
    let value: String
    let label: String
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(value).font(.system(.title, design: .serif).weight(.semibold)).monospacedDigit()
            Text(label).font(.caption).foregroundStyle(Theme.muted)
        }
        .accessibilityElement(children: .combine)
    }
}

struct PaperCard: ViewModifier {
    func body(content: Content) -> some View {
        content.padding(20).background(Theme.card, in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Theme.line, lineWidth: 0.7))
    }
}

extension View { func paperCard() -> some View { modifier(PaperCard()) } }
