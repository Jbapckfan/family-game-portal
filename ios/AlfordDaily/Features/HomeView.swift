import SwiftUI

struct HomeView: View {
    let store: ProgressStore
    let now: Date
    private var today: String { DailyCalendar.key(for: now) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 10) {
                    Text(DailyCalendar.display(now).uppercased()).font(.caption.weight(.semibold))
                        .tracking(1.5).foregroundStyle(Theme.muted)
                    Text("Your daily six.").font(.system(size: 42, weight: .regular, design: .serif))
                        .minimumScaleFactor(0.8)
                    Text("A fresh way to think, every day.").font(.subheadline).foregroundStyle(Theme.muted)
                }

                VStack(alignment: .leading, spacing: 16) {
                    HStack(alignment: .top) {
                        MetricView(value: "\(store.ledger.completed(on: today))/6", label: "finished today")
                        Spacer()
                        MetricView(value: "\(store.ledger.solved(on: today))", label: "solved today")
                        Spacer()
                        MetricView(value: "\(store.ledger.dailyStreak(today: today))", label: "day streak")
                    }
                    ProgressView(value: Double(store.ledger.completed(on: today)), total: 6)
                        .tint(Theme.accent).accessibilityLabel("Today’s completion")
                    Text("Solve at least one daily to keep your streak going.")
                        .font(.caption).foregroundStyle(Theme.muted)
                }.paperCard()

                VStack(alignment: .leading, spacing: 12) {
                    Text("START WITH A NEW CHALLENGE").font(.caption.weight(.semibold)).tracking(1.2)
                        .foregroundStyle(Theme.muted)
                    ForEach(GameID.allCases.filter(\.isFlagship)) { game in
                        NavigationLink(value: game) { GameCard(game: game, status: store.ledger.status(for: game, on: today)) }
                            .buttonStyle(.plain)
                    }
                }
                VStack(alignment: .leading, spacing: 12) {
                    Text("A WAY WITH WORDS").font(.caption.weight(.semibold)).tracking(1.2).foregroundStyle(Theme.muted)
                    ForEach(GameID.allCases.filter { !$0.isFlagship }) { game in
                        NavigationLink(value: game) { GameCard(game: game, status: store.ledger.status(for: game, on: today)) }
                            .buttonStyle(.plain)
                    }
                }
                Text("New dailies arrive at midnight Central. All six games work offline. Prepared collections repeat after 30 or 90 days.")
                    .font(.footnote).foregroundStyle(Theme.muted).lineSpacing(4)
                if let error = store.storageError { Text(error).font(.footnote).foregroundStyle(.red) }
            }.padding(20).frame(maxWidth: 680).frame(maxWidth: .infinity)
        }
        .background(Theme.paper)
        .navigationTitle("Alford Daily")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct GameCard: View {
    let game: GameID
    let status: GameStatus?

    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            Image(systemName: game.symbol).font(.system(size: game.isFlagship ? 29 : 24, weight: .medium))
                .foregroundStyle(game.tint).frame(width: 52, height: 60)
                .background(game.tint.opacity(0.09), in: RoundedRectangle(cornerRadius: 14))
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(game.name).font(.system(game.isFlagship ? .title2 : .title3, design: .serif).weight(.semibold))
                    if status == .won { Image(systemName: "checkmark.seal.fill").foregroundStyle(game.tint).accessibilityHidden(true) }
                }
                Text(game.subtitle).font(.subheadline).foregroundStyle(Theme.muted).fixedSize(horizontal: false, vertical: true)
                Text(status?.label ?? "Ready when you are").font(.caption.weight(.semibold)).foregroundStyle(game.tint)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(Theme.muted).accessibilityHidden(true)
        }.paperCard()
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier("game-card-\(game.rawValue)")
    }
}
