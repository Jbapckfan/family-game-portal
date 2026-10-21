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
            if isLoading { loadingCard }
            if let error = loadError { errorCard(error) }
        }
        .tint(game.tint)
        .navigationTitle(game.name).navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.paper, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .safeAreaInset(edge: .top, spacing: 0) {
            HStack(alignment: .center, spacing: 9) {
                Circle().fill(game.tint).frame(width: 6, height: 6).accessibilityHidden(true)
                Text(game.credit).font(.caption.weight(.semibold)).foregroundStyle(game.palette.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("game-developer-credit")
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 18).padding(.vertical, 9)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(game.palette.wash)
            .overlay(alignment: .bottom) { Rectangle().fill(game.palette.edge).frame(height: 1) }
        }
        .toolbar {
            ToolbarItem(placement: .principal) {
                HStack(spacing: 8) {
                    Image(systemName: game.symbol).font(.subheadline.weight(.semibold))
                        .foregroundStyle(game.tint).accessibilityHidden(true)
                    Text(game.name).font(.system(.headline, design: .serif)).foregroundStyle(Theme.ink)
                        .lineLimit(1)
                }.accessibilityAddTraits(.isHeader)
            }
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Back to Today", systemImage: "square.grid.2x2") { onNavigate(nil) }
                    Button("Reload saved puzzle", systemImage: "arrow.clockwise") { reloadToken = UUID() }
                    Button("About this game", systemImage: "info.circle") { showingAbout = true }
                } label: {
                    Image(systemName: "ellipsis.circle").foregroundStyle(game.tint)
                        .frame(minWidth: 44, minHeight: 44).accessibilityLabel("Game navigation")
                }
            }
        }
        .sheet(item: $share) { request in ShareSheet(text: request.text).presentationDetents([.medium, .large]) }
        .sheet(isPresented: $showingAbout) { GameAboutView(game: game).presentationDetents([.medium, .large]) }
    }

    private var loadingCard: some View {
        VStack(spacing: 16) {
            GameEmblem(game: game, size: 64)
            Text(game.name).font(.system(.title2, design: .serif)).foregroundStyle(game.palette.ink)
            ProgressView("Opening your puzzle…").tint(game.tint)
                .font(.subheadline).foregroundStyle(Theme.muted)
        }
        .padding(28).frame(maxWidth: 290)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(game.palette.edge, lineWidth: 1))
        .shadow(color: Theme.ink.opacity(0.08), radius: 20, y: 8)
        .padding(20)
        .accessibilityElement(children: .combine)
    }

    private func errorCard(_ error: String) -> some View {
        VStack(spacing: 16) {
            GameEmblem(game: game, size: 58)
            Text("This puzzle couldn’t open.")
                .font(.system(.title2, design: .serif)).foregroundStyle(Theme.ink)
            Text(error).font(.subheadline).foregroundStyle(Theme.muted).multilineTextAlignment(.center)
            Button("Reload puzzle") { reloadToken = UUID() }
                .buttonStyle(.borderedProminent).tint(game.tint).controlSize(.large)
        }
        .padding(28).frame(maxWidth: 350)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(game.palette.edge, lineWidth: 1))
        .shadow(color: Theme.ink.opacity(0.08), radius: 20, y: 8)
        .padding(20)
    }
}

private struct GameAboutView: View {
    let game: GameID
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HStack(alignment: .center, spacing: 16) {
                        GameEmblem(game: game, size: 66)
                        VStack(alignment: .leading, spacing: 7) {
                            Text(game.name).font(.system(.largeTitle, design: .serif))
                                .foregroundStyle(game.palette.ink)
                            Text(game.credit).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.muted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    Text(game.subtitle).font(.title3).foregroundStyle(Theme.ink)
                    Text(game.attributionDescription).font(.body).foregroundStyle(Theme.muted)
                    VStack(alignment: .leading, spacing: 12) {
                        Label("\(game.collectionCount) prepared puzzles", systemImage: "calendar")
                            .font(.headline).foregroundStyle(game.palette.ink)
                        Text("Daily play changes at midnight Central and repeats after the collection ends. Practice stays separate from your daily record.")
                            .font(.subheadline).foregroundStyle(Theme.ink)
                    }
                    .padding(18).frame(maxWidth: .infinity, alignment: .leading)
                    .background(game.palette.wash, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(game.palette.edge, lineWidth: 1))
                    Text("This game works offline. Progress is stored locally on this device.")
                        .font(.footnote).foregroundStyle(Theme.muted)
                }.padding(24).frame(maxWidth: 600).frame(maxWidth: .infinity)
            }
            .background(Theme.paper).tint(game.tint)
            .navigationTitle("About this game").navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Theme.paper, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }
}
