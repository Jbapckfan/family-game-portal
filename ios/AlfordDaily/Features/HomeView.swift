import SwiftUI

struct HomeView: View {
    let store: ProgressStore
    let now: Date
    @State private var creatorFilter = CreatorFilter.all
    @State private var favoritesOnly = false
    @State private var showHidden = false
    @State private var share: ShareRequest?
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    private var today: String { DailyCalendar.key(for: now) }
    private var gameCount: Int { GameID.dailyGames.count }
    private var columns: [GridItem] {
        dynamicTypeSize.isAccessibilitySize
            ? [GridItem(.flexible(minimum: 0), spacing: 14)]
            : [GridItem(.adaptive(minimum: 270), spacing: 14)]
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 26) {
                introduction
                collectionPreferences
                todaysThree
                gameSection(title: "Original word games", games: visible(GameID.featured))
                DisclosureGroup("Your collection record") { dailyProgress }
                gameSection(title: "Bonus · Local AI", games: visible(GameID.bonusGames))
                creatorPicker

                if visible(creatorFilter.games).contains(where: \.isFlagship) {
                    gameSection(title: "Start with a new challenge", games: visible(creatorFilter.games).filter(\.isFlagship))
                }
                gameSection(title: "More ways to play", games: visible(creatorFilter.games).filter { !$0.isFlagship })

                Text("New dailies arrive at midnight Central. All \(gameCount) games work offline. Each prepared collection repeats after its last puzzle.")
                    .font(.footnote).foregroundStyle(Theme.muted).lineSpacing(4)
                    .padding(.top, 4)
                if let error = store.storageError { Text(error).font(.footnote).foregroundStyle(.red) }
            }
            .padding(20).frame(maxWidth: 760).frame(maxWidth: .infinity)
        }
        .background(Theme.paper)
        .navigationTitle("Alford Daily")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.paper, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .sheet(item: $share) { request in ShareSheet(text: request.text).presentationDetents([.medium, .large]) }
    }

    private func visible(_ games: [GameID]) -> [GameID] {
        store.visibleGames(games, favoritesOnly: favoritesOnly, showHidden: showHidden)
    }

    private var collectionPreferences: some View {
        VStack(alignment: .leading, spacing: 12) {
            Toggle("Favorites only", isOn: $favoritesOnly)
                .accessibilityIdentifier("favorites-only")
            Toggle("Show hidden", isOn: $showHidden)
                .accessibilityIdentifier("show-hidden-games")
            Text("Stars and hidden games are saved on this device. Hiding a game keeps its progress and records.")
                .font(.caption).foregroundStyle(Theme.muted)
            if visible(GameID.allCases).isEmpty {
                Text(favoritesOnly ? "No favorites to show. Turn off Favorites only to star a game, or turn on Show hidden." : "Your games are hidden. Turn on Show hidden to restore them.")
                    .font(.subheadline).foregroundStyle(Theme.ink)
            }
        }.tint(Theme.ink).paperCard()
    }

    private func gamePreferences(_ game: GameID) -> some View {
        let preference = store.gamePreference(for: game)
        return HStack {
            Button { store.toggleFavorite(game) } label: {
                Label(preference.favorite ? "Starred" : "Star", systemImage: preference.favorite ? "star.fill" : "star")
                    .frame(minHeight: 44)
            }
            .accessibilityLabel("\(preference.favorite ? "Remove" : "Add") \(game.name) \(preference.favorite ? "from" : "to") favorites")
            .accessibilityIdentifier("favorite-\(game.rawValue)")
            Spacer()
            Button { store.toggleHidden(game) } label: {
                Label(preference.hidden ? "Unhide" : "Hide", systemImage: preference.hidden ? "eye" : "eye.slash")
                    .frame(minHeight: 44)
            }
            .accessibilityLabel("\(preference.hidden ? "Unhide" : "Hide") \(game.name)")
            .accessibilityIdentifier("hide-\(game.rawValue)")
        }.font(.subheadline.weight(.semibold)).buttonStyle(.plain).foregroundStyle(Theme.ink)
            .padding(.horizontal, 12)
    }

    private var introduction: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(DailyCalendar.display(now).uppercased())
                .font(.caption.weight(.semibold)).tracking(1.4).foregroundStyle(Theme.muted)
            Text("A little pause.\nA good puzzle.")
                .font(.system(.largeTitle, design: .serif)).foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 8) {
                Image(systemName: "square.grid.2x2").accessibilityHidden(true)
                Text("Four original word games. Your own pace.")
            }
            .font(.subheadline).foregroundStyle(Theme.muted)
        }
        .padding(.top, 4)
    }

    private var dailyProgress: some View {
        VStack(alignment: .leading, spacing: 17) {
            Text("YOUR DAY, IN PUZZLES")
                .font(.caption.weight(.bold)).tracking(1.2).foregroundStyle(Theme.muted)
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 15) { progressMetrics }
            } else {
                HStack(alignment: .top, spacing: 12) { progressMetrics }
            }
            ProgressView(value: Double(store.ledger.completed(on: today)), total: Double(gameCount))
                .tint(Theme.ink).accessibilityLabel("Today’s completion")
            Text("Across all \(gameCount) games. Solve at least one daily to keep your streak going.")
                .font(.caption).foregroundStyle(Theme.muted).fixedSize(horizontal: false, vertical: true)
        }.paperCard()
    }

    private var todaysThree: some View {
        let games = visible(GameID.todaysThree(on: today))
        let next = games.first { store.ledger.status(for: $0, on: today) == .playing }
            ?? games.first { store.ledger.status(for: $0, on: today)?.isTerminal != true }
        let solved = games.filter { store.ledger.status(for: $0, on: today) == .won }.count
        return VStack(alignment: .leading, spacing: 14) {
            Text("Today’s Three").font(.system(.title2, design: .serif))
            Text("\(solved) of \(games.count) solved · a small daily ritual")
                .font(.subheadline).foregroundStyle(Theme.muted)
            if let next {
                NavigationLink(value: next) {
                    HStack {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("\(store.ledger.status(for: next, on: today) == .playing ? "Continue" : "Play") \(next.name)")
                                .font(.system(.title3, design: .serif).weight(.semibold))
                            Text("Your next good puzzle.").font(.subheadline)
                        }
                        Spacer()
                        Image(systemName: "arrow.up.right").accessibilityHidden(true)
                    }.padding(18).frame(maxWidth: .infinity, minHeight: 72, alignment: .leading)
                        .background(Theme.ink, in: RoundedRectangle(cornerRadius: 14)).foregroundStyle(Theme.card)
                }.buttonStyle(.plain).accessibilityIdentifier("next-daily")
            } else if !games.isEmpty && games.allSatisfy({ store.ledger.status(for: $0, on: today)?.isTerminal == true }) {
                Text("Daily set complete. Share your result, try Practice, or return for a fresh set tomorrow.")
                    .font(.subheadline).foregroundStyle(Theme.muted)
            }
            ForEach(games) { game in
                NavigationLink(value: game) {
                    HStack(alignment: .center, spacing: 14) {
                        GameEmblem(game: game, size: 40).accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: 5) {
                            Text(game.name).font(.headline)
                            Text(store.ledger.status(for: game, on: today)?.label ?? "Ready for today")
                                .font(.subheadline).foregroundStyle(Theme.muted)
                        }
                        Spacer(minLength: 8)
                        Image(systemName: "arrow.up.right").accessibilityHidden(true)
                    }.padding(14).frame(maxWidth: .infinity, minHeight: 64, alignment: .leading)
                        .background(game.palette.wash, in: RoundedRectangle(cornerRadius: 14))
                        .contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityIdentifier("today-three-\(game.rawValue)")
            }
            Button { share = ShareRequest(text: store.ledger.todayShare()) } label: {
                Label("Share today’s result", systemImage: "square.and.arrow.up")
                    .font(.subheadline.weight(.semibold)).frame(minHeight: 44)
            }.accessibilityHint("Shares game names and result labels without answers")
            Text("Choose one good puzzle, then return whenever you like. All 32 daily games remain in the collection below.")
                .font(.caption).foregroundStyle(Theme.muted)
        }.accessibilityIdentifier("todays-three")
    }

    @ViewBuilder private var progressMetrics: some View {
        MetricView(value: "\(store.ledger.completed(on: today))/\(gameCount)", label: "finished today")
            .frame(maxWidth: .infinity, alignment: .leading)
        MetricView(value: "\(store.ledger.solved(on: today))", label: "solved today")
            .frame(maxWidth: .infinity, alignment: .leading)
        MetricView(value: "\(store.ledger.dailyStreak(today: today))", label: "day streak")
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var creatorPicker: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text("The collection").font(.system(.title2, design: .serif))
                Spacer(minLength: 8)
                Text("\(visible(creatorFilter.games).count) games")
                    .font(.caption.weight(.semibold)).foregroundStyle(Theme.muted)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(CreatorFilter.allCases) { filter in
                        Button { creatorFilter = filter } label: {
                            Text(filter.rawValue).font(.subheadline.weight(.semibold))
                                .padding(.horizontal, 15).frame(minHeight: 44)
                                .foregroundStyle(creatorFilter == filter ? Theme.card : Theme.ink)
                                .background(creatorFilter == filter ? Theme.ink : Theme.card, in: Capsule())
                                .overlay(Capsule().stroke(creatorFilter == filter ? Theme.ink : Theme.line, lineWidth: 1))
                        }.buttonStyle(.plain)
                            .accessibilityLabel("\(filter.rawValue) games")
                            .accessibilityAddTraits(creatorFilter == filter ? .isSelected : [])
                    }
                }
                .padding(.vertical, 2)
            }.accessibilityLabel("Filter games by creator").accessibilityIdentifier("creator-filter")
        }
    }

    @ViewBuilder private func gameSection(title: String, games: [GameID]) -> some View {
        if !games.isEmpty {
            VStack(alignment: .leading, spacing: 13) {
                Text(title.uppercased()).font(.caption.weight(.semibold)).tracking(1.1)
                    .foregroundStyle(Theme.muted)
                LazyVGrid(columns: columns, alignment: .leading, spacing: 14) {
                    ForEach(games) { game in
                        VStack(alignment: .leading, spacing: 8) {
                            NavigationLink(value: game) {
                                GameCard(game: game, status: store.ledger.status(for: game, on: today))
                            }.buttonStyle(.plain)
                            gamePreferences(game)
                        }
                    }
                }
            }
        }
    }
}

private struct GameCard: View {
    let game: GameID
    let status: GameStatus?
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    private var actionTitle: String {
        if !game.isDaily { return "Open match" }
        if status?.isTerminal == true { return "View result" }
        return status == .playing ? "Continue" : "Play"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack(alignment: .top, spacing: 14) {
                GameEmblem(game: game, size: dynamicTypeSize.isAccessibilitySize ? 48 : 58)
                VStack(alignment: .leading, spacing: 7) {
                    Text(game.name).font(.system(.title2, design: .serif).weight(.semibold))
                        .foregroundStyle(game.palette.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(game.subtitle).font(.subheadline).foregroundStyle(Theme.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            Text(game.credit).font(.caption.weight(.semibold)).foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            Rectangle().fill(game.palette.edge).frame(height: 1).accessibilityHidden(true)
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Label(status?.label ?? "Ready when you are", systemImage: status == .won ? "checkmark.circle.fill" : "circle.dotted")
                    .font(.caption.weight(.semibold)).foregroundStyle(game.palette.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
                HStack(spacing: 5) {
                    Text(actionTitle)
                    Image(systemName: "arrow.up.right").accessibilityHidden(true)
                }.font(.caption.weight(.bold)).foregroundStyle(game.palette.ink)
            }
        }
        .padding(18).frame(maxWidth: .infinity, alignment: .leading)
        .background(game.palette.wash, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(game.palette.edge, lineWidth: 1))
        .shadow(color: game.palette.ink.opacity(0.07), radius: 0, x: 0, y: 4)
        .contentShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("game-card-\(game.rawValue)")
    }
}
