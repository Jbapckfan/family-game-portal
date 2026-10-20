import UIKit

@MainActor
enum HapticService {
    static func play(_ kind: HapticKind, enabled: Bool) {
        guard enabled else { return }
        switch kind {
        case .select: UISelectionFeedbackGenerator().selectionChanged()
        case .fit: UIImpactFeedbackGenerator(style: .soft).impactOccurred()
        case .miss: UINotificationFeedbackGenerator().notificationOccurred(.warning)
        case .win: UINotificationFeedbackGenerator().notificationOccurred(.success)
        }
    }
}
