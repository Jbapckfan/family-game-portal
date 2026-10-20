import SwiftUI

struct RecordView: View {
    let store: ProgressStore
    let now: Date
    private var today: String { DailyCalendar.key(for: now) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Text("Small daily victories.").font(.system(.largeTitle, design: .serif))
                Text("Your record stays on this device. Practice is separate from these daily results.")
                    .font(.subheadline).foregroundStyle(Theme.muted)
                VStack(alignment: .leading, spacing: 14) {
                    Text("The last seven days").font(.headline)
                    ForEach((-6...0).reversed(), id: \.self) { offset in
                        if let key = DailyCalendar.shifted(today, days: offset) {
                            HStack {
                                Text(key == today ? "Today" : key).font(.subheadline).monospacedDigit()
                                Spacer()
                                Text("\(store.ledger.solved(on: key)) solved · \(store.ledger.completed(on: key)) finished")
                                    .font(.caption).foregroundStyle(Theme.muted)
                            }
                        }
                    }
                }.paperCard()
                ForEach(GameID.allCases) { game in
                    let stats = store.stats(for: game)
                    VStack(alignment: .leading, spacing: 16) {
                        Label(game.name, systemImage: game.symbol).font(.system(.title3, design: .serif)).foregroundStyle(game.tint)
                        Text(game.creator.credit).font(.caption.weight(.semibold)).foregroundStyle(Theme.muted)
                        HStack {
                            MetricView(value: "\(stats.won)", label: "solved")
                            Spacer()
                            MetricView(value: "\(stats.played)", label: "completed")
                            Spacer()
                            MetricView(value: "\(stats.bestStreak)", label: "best streak")
                        }
                        Text("Current streak: \(store.ledger.gameStreak(game, today: today)) days")
                            .font(.caption).foregroundStyle(Theme.muted)
                    }.paperCard()
                }
                Text("Revealed boards and losses count as completed, without extending a winning streak. Clearing local progress resets this record.")
                    .font(.footnote).foregroundStyle(Theme.muted).lineSpacing(4)
            }.padding(20).frame(maxWidth: 680).frame(maxWidth: .infinity)
        }.background(Theme.paper).navigationTitle("Your record").navigationBarTitleDisplayMode(.inline)
    }
}
