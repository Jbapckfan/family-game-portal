import Foundation

/// Collection visibility is independent of puzzle saves, records, and daily identity.
struct GamePreference: Codable, Equatable {
    var favorite = false
    var hidden = false
}
