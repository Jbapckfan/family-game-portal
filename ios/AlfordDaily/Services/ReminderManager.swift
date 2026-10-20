import Foundation
import Observation
import UserNotifications

@MainActor @Observable
final class ReminderManager {
    private(set) var isBusy = false
    private(set) var permissionDenied = false
    var message: String?
    @ObservationIgnored private let center = UNUserNotificationCenter.current()
    @ObservationIgnored private let identifier = "alford.daily.local-reminder"

    // Reading authorization on launch never prompts the user.
    func refresh(store: ProgressStore) async {
        let settings = await center.notificationSettings()
        permissionDenied = settings.authorizationStatus == .denied
        if permissionDenied && store.preferences.reminderEnabled {
            center.removePendingNotificationRequests(withIdentifiers: [identifier])
            store.updatePreferences { $0.reminderEnabled = false }
        }
    }

    // Only the explicit Settings enable action reaches requestAuthorization.
    func setEnabled(_ enabled: Bool, store: ProgressStore) async {
        guard !isBusy else { return }
        isBusy = true
        defer { isBusy = false }
        message = nil
        if !enabled {
            center.removePendingNotificationRequests(withIdentifiers: [identifier])
            center.removeDeliveredNotifications(withIdentifiers: [identifier])
            store.updatePreferences { $0.reminderEnabled = false }
            return
        }
        do {
            let settings = await center.notificationSettings()
            let granted: Bool
            switch settings.authorizationStatus {
            case .notDetermined:
                granted = try await center.requestAuthorization(options: [.alert, .sound])
            case .authorized, .provisional, .ephemeral:
                granted = true
            case .denied:
                granted = false
            @unknown default:
                granted = false
            }
            guard granted else {
                permissionDenied = true
                message = "Notifications are off. You can enable them in iOS Settings whenever you want a reminder."
                store.updatePreferences { $0.reminderEnabled = false }
                return
            }
            permissionDenied = false
            try await schedule(preferences: store.preferences)
            store.updatePreferences { $0.reminderEnabled = true }
        } catch {
            store.updatePreferences { $0.reminderEnabled = false }
            message = "The reminder could not be scheduled. Please try again."
        }
    }

    func updateTime(_ date: Date, store: ProgressStore) async {
        let components = DailyCalendar.calendar.dateComponents([.hour, .minute], from: date)
        store.updatePreferences {
            $0.reminderHour = components.hour ?? 9
            $0.reminderMinute = components.minute ?? 0
        }
        guard store.preferences.reminderEnabled else { return }
        do { try await schedule(preferences: store.preferences) }
        catch { message = "The new time could not be saved to your reminder. Please try again." }
    }

    func selectedTime(preferences: AppPreferences) -> Date {
        DailyCalendar.calendar.date(bySettingHour: preferences.reminderHour,
            minute: preferences.reminderMinute, second: 0, of: Date()) ?? Date()
    }

    private func schedule(preferences: AppPreferences) async throws {
        let content = UNMutableNotificationContent()
        content.title = "A little daily challenge"
        content.body = "Your daily games are ready. Find a fresh challenge in Alford Daily."
        content.sound = .default
        var components = DateComponents()
        components.timeZone = DailyCalendar.timeZone
        components.hour = preferences.reminderHour
        components.minute = preferences.reminderMinute
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        try await center.add(UNNotificationRequest(identifier: identifier, content: content, trigger: trigger))
    }
}
