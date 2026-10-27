import SwiftUI
import Combine

@main
@MainActor
struct AlfordDailyApp: App {
    @State private var store = ProgressStore()
    @State private var reminders = ReminderManager()
    @State private var purchases = PurchaseManager()

    var body: some Scene {
        WindowGroup {
            AppRootView(store: store, reminders: reminders, purchases: purchases)
                .tint(Theme.accent).foregroundStyle(Theme.ink).preferredColorScheme(.light)
        }
    }
}

private struct AppRootView: View {
    let store: ProgressStore
    let reminders: ReminderManager
    let purchases: PurchaseManager
    @Environment(\.scenePhase) private var scenePhase
    @State private var path: [GameID] = []
    @State private var selectedTab = 0
    @State private var now = Date()
    private let calendarPulse = Timer.publish(every: 30, on: .main, in: .common).autoconnect()

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack(path: $path) {
                HomeView(store: store, now: now)
                    .navigationDestination(for: GameID.self) { game in
                        GameScreen(game: game, store: store) { destination in
                            if let destination { path.append(destination) }
                            else { path.removeAll() }
                        }
                    }
            }.tabItem { Label("Today", systemImage: "square.grid.2x2") }.tag(0)
            NavigationStack { RecordView(store: store, now: now) }
                .tabItem { Label("Record", systemImage: "chart.bar") }.tag(1)
            NavigationStack { SettingsView(store: store, reminders: reminders, purchases: purchases) }
                .tabItem { Label("Settings", systemImage: "slider.horizontal.3") }.tag(2)
        }
        .onReceive(calendarPulse) { now = $0 }
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.significantTimeChangeNotification)) { _ in now = Date() }
        .onChange(of: store.resetGeneration) { _, _ in path.removeAll() }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active else { return }
            now = Date()
            Task { await reminders.refresh(store: store); await purchases.refreshEntitlements() }
        }
        .task { await reminders.refresh(store: store); await purchases.start() }
    }
}
