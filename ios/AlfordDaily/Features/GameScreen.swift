import SwiftUI

struct GameScreen: View {
    let game: GameID
    let store: ProgressStore
    let onNavigate: (GameID?) -> Void
    @State private var reloadToken = UUID()
    @State private var isLoading = true
    @State private var loadError: String?
    @State private var share: ShareRequest?
    @State private var showingAbout = false

    var body: some View {
        ZStack {
            Theme.paper.ignoresSafeArea()
            GameWebView(game: game, store: store, reloadToken: reloadToken,
                onShare: { text in share = ShareRequest(text: text) }, onNavigate: onNavigate,
                onLoading: { loading, error in isLoading = loading; loadError = error })
                .id(store.resetGeneration)
            if isLoading {
                ProgressView("Opening \(game.name)…").padding(24)
                    .background(Theme.card, in: RoundedRectangle(cornerRadius: 16))
            }
            if let error = loadError {
                VStack(spacing: 16) {
                    Image(systemName: "arrow.clockwise.circle").font(.largeTitle).foregroundStyle(game.tint)
                    Text(error).multilineTextAlignment(.center)
                    Button("Reload puzzle") { reloadToken = UUID() }.buttonStyle(.borderedProminent).tint(game.tint)
                }.padding(28).frame(maxWidth: 350).background(Theme.card, in: RoundedRectangle(cornerRadius: 20))
            }
        }
        .navigationTitle(game.name).navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .top, spacing: 0) {
            Text(game.credit).font(.caption.weight(.semibold)).foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity).padding(.horizontal, 16).padding(.vertical, 7).background(Theme.paper)
                .accessibilityIdentifier("game-developer-credit")
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Back to Today", systemImage: "square.grid.2x2") { onNavigate(nil) }
                    Button("Reload saved puzzle", systemImage: "arrow.clockwise") { reloadToken = UUID() }
                    Button("About this game", systemImage: "info.circle") { showingAbout = true }
                } label: { Image(systemName: "ellipsis.circle").accessibilityLabel("Game navigation") }
            }
        }
        .sheet(item: $share) { request in ShareSheet(text: request.text).presentationDetents([.medium, .large]) }
        .sheet(isPresented: $showingAbout) { GameAboutView(game: game).presentationDetents([.medium, .large]) }
    }
}

private struct GameAboutView: View {
    let game: GameID
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Label(game.name, systemImage: game.symbol).font(.system(.largeTitle, design: .serif))
                        .foregroundStyle(game.tint)
                    Text(game.credit).font(.headline)
                    Text(game.subtitle).font(.title3).foregroundStyle(Theme.muted)
                    Text(game.attributionDescription)
                    Text("\(game.collectionCount) prepared puzzles. Daily play changes at midnight Central and repeats after the collection ends. Practice stays separate from your daily record.")
                    Text("This game works offline. Progress is stored locally on this device.")
                        .font(.footnote).foregroundStyle(Theme.muted)
                }.padding(24).frame(maxWidth: 600).frame(maxWidth: .infinity)
            }.background(Theme.paper)
                .navigationTitle("About this game").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }
}
