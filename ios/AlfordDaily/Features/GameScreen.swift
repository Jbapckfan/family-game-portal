import SwiftUI

struct GameScreen: View {
    let game: GameID
    let store: ProgressStore
    let onNavigate: (GameID?) -> Void
    @State private var reloadToken = UUID()
    @State private var isLoading = true
    @State private var loadError: String?
    @State private var share: ShareRequest?

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
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Back to Today", systemImage: "square.grid.2x2") { onNavigate(nil) }
                    Button("Reload saved puzzle", systemImage: "arrow.clockwise") { reloadToken = UUID() }
                } label: { Image(systemName: "ellipsis.circle").accessibilityLabel("Game navigation") }
            }
        }
        .sheet(item: $share) { request in ShareSheet(text: request.text).presentationDetents([.medium, .large]) }
    }
}
