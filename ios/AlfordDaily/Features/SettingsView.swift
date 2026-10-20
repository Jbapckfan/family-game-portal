import SwiftUI
import WebKit

struct SettingsView: View {
    let store: ProgressStore
    let reminders: ReminderManager
    let purchases: PurchaseManager
    @Environment(\.openURL) private var openURL
    @State private var confirmReset = false
    @State private var resetting = false

    var body: some View {
        Form {
            Section("Make it your moment") {
                Toggle("Haptics", isOn: Binding(
                    get: { store.preferences.hapticsEnabled },
                    set: { enabled in store.updatePreferences { $0.hapticsEnabled = enabled } }))
                Text("Gentle feedback for selections, discoveries, and finishes. Game sound has its own control inside each puzzle.")
                    .font(.footnote).foregroundStyle(Theme.muted)
            }
            Section {
                Toggle("Daily reminder", isOn: Binding(
                    get: { store.preferences.reminderEnabled },
                    set: { enabled in Task { await reminders.setEnabled(enabled, store: store) } }))
                    .disabled(reminders.isBusy)
                if store.preferences.reminderEnabled {
                    DatePicker("Time (Central)", selection: Binding(
                        get: { reminders.selectedTime(preferences: store.preferences) },
                        set: { date in Task { await reminders.updateTime(date, store: store) } }), displayedComponents: .hourAndMinute)
                        .environment(\.timeZone, DailyCalendar.timeZone)
                }
                if let message = reminders.message { Text(message).font(.footnote).foregroundStyle(Theme.muted) }
                if reminders.permissionDenied {
                    Button("Open notification settings") {
                        if let url = URL(string: UIApplication.openSettingsURLString) { openURL(url) }
                    }
                }
            } header: { Text("A little nudge") } footer: {
                Text("Off until you enable it. The reminder is scheduled on this device at your chosen Central time; no server or account is involved.")
            }
            Section {
                LabeledContent("Saved here", value: "This device")
                Text("Game saves, daily results, and settings stay locally. There is no account, tracking, or cross-device score sync.")
                    .font(.footnote).foregroundStyle(Theme.muted)
                Button("Clear all local game progress", role: .destructive) { confirmReset = true }
                    .disabled(resetting)
            } header: { Text("Your progress") } footer: {
                Text("Clearing progress removes every game’s daily and practice saves and native statistics. Your haptic and reminder preferences stay as chosen.")
            }
            if purchases.configuration.isEnabled { commerceSection }
            Section("This collection") {
                ForEach(GameID.allCases) { game in
                    LabeledContent("\(game.name) · \(game.creator.rawValue)", value: "\(game.collectionCount) puzzles")
                }
                Text("Every daily resets at midnight in America/Chicago. These prepared collections repeat; they do not need a network connection.")
                    .font(.footnote).foregroundStyle(Theme.muted)
            }
            Section {
                Text("Made for a little daily thinking.").font(.system(.title3, design: .serif))
                Text("Alford Daily · Version 1.0\n\(GameID.allCases.count) games. No ads in this edition.")
                    .font(.footnote).foregroundStyle(Theme.muted)
            }
        }
        .scrollContentBackground(.hidden).background(Theme.paper)
        .navigationTitle("Settings")
        .confirmationDialog("Clear every local game save?", isPresented: $confirmReset, titleVisibility: .visible) {
            Button("Clear all progress", role: .destructive) { Task { await clearProgress() } }
            Button("Keep my progress", role: .cancel) {}
        } message: { Text("Daily results, streaks, and practice saves on this device will be removed. This cannot be undone.") }
    }

    private var commerceSection: some View {
        Section {
            if purchases.configuration.isLocalTest {
                Text("Development-only StoreKit transactions. This local configuration does not charge an account or configure an App Store product.")
                    .font(.footnote)
            }
            if purchases.removesAds {
                Label("Remove Ads entitlement active", systemImage: "checkmark.seal.fill")
            } else if let product = purchases.product {
                Button("\(product.displayName) · \(product.displayPrice)") { Task { await purchases.purchase() } }
                    .disabled(purchases.isBusy)
            } else {
                Text("Purchase information is unavailable.").foregroundStyle(.secondary)
                Button("Try loading again") { Task { await purchases.loadProduct() } }.disabled(purchases.isBusy)
            }
            Button("Restore purchases") { Task { await purchases.restore() } }.disabled(purchases.isBusy)
            if let message = purchases.message { Text(message).font(.footnote).foregroundStyle(.secondary) }
        } header: { Text(purchases.configuration.isLocalTest ? "Local StoreKit test" : "Remove Ads") }
    }

    @MainActor
    private func clearProgress() async {
        guard !resetting else { return }
        resetting = true
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            WKWebsiteDataStore.default().removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: .distantPast) {
                continuation.resume()
            }
        }
        store.resetProgress()
        resetting = false
    }
}
