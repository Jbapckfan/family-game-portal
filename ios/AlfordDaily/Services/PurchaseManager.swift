import Foundation
import Observation
import StoreKit

struct CommerceConfiguration: Equatable {
    let isEnabled: Bool
    let isLocalTest: Bool
    let productID: String?

    static var current: CommerceConfiguration {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-StoreKitTesting") {
            return CommerceConfiguration(isEnabled: true, isLocalTest: true,
                productID: "com.alfordfamily.daily.removeads.localtest")
        }
        #endif
        // Deliberately disabled. Configure a real product AND an actual ad integration
        // before exposing monetization in a future release. No product lookup runs now.
        return CommerceConfiguration(isEnabled: false, isLocalTest: false, productID: nil)
    }
}

@MainActor @Observable
final class PurchaseManager {
    let configuration: CommerceConfiguration
    private(set) var removesAds = false
    private(set) var product: Product?
    private(set) var isBusy = false
    var message: String?
    @ObservationIgnored private var updatesTask: Task<Void, Never>?
    @ObservationIgnored private var started = false

    init(configuration: CommerceConfiguration = .current) { self.configuration = configuration }
    deinit { updatesTask?.cancel() }

    func start() async {
        guard configuration.isEnabled, let productID = configuration.productID, !started else { return }
        started = true
        updatesTask = Task { [weak self] in
            for await result in Transaction.updates {
                guard !Task.isCancelled else { return }
                guard case .verified(let transaction) = result else { continue }
                guard transaction.productID == productID else { continue }
                // Rebuild from current verified entitlements. Refunded/revoked products
                // disappear from this sequence, so an old grant cannot survive a refund.
                await self?.refreshEntitlements()
                await transaction.finish()
            }
        }
        await refreshEntitlements()
        await loadProduct()
    }

    func refreshEntitlements() async {
        guard configuration.isEnabled, let productID = configuration.productID else { return }
        var ownsProduct = false
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result,
                  transaction.productID == productID, transaction.productType == .nonConsumable,
                  transaction.revocationDate == nil, !transaction.isUpgraded else { continue }
            ownsProduct = true
        }
        removesAds = ownsProduct
    }

    func loadProduct() async {
        guard configuration.isEnabled, let productID = configuration.productID else { return }
        do {
            let products = try await Product.products(for: [productID])
            product = products.first { $0.type == .nonConsumable }
            if product == nil { message = "This purchase is not available right now." }
        } catch { message = "Purchase information could not be loaded." }
    }

    func purchase() async {
        guard configuration.isEnabled, let product, !isBusy else { return }
        isBusy = true
        defer { isBusy = false }
        message = nil
        do {
            switch try await product.purchase() {
            case .success(let result):
                guard case .verified(let transaction) = result,
                      transaction.productID == configuration.productID,
                      transaction.productType == .nonConsumable else {
                    message = "This purchase could not be verified. No entitlement was granted."
                    return
                }
                await refreshEntitlements()
                await transaction.finish()
            case .pending:
                message = "The purchase is waiting for approval. It will update automatically when approved."
            case .userCancelled:
                break
            @unknown default:
                message = "The purchase did not complete."
            }
        } catch { message = "The purchase could not be completed. Please try again." }
    }

    // Called only by the explicit Restore button in the gated commerce section.
    func restore() async {
        guard configuration.isEnabled, !isBusy else { return }
        isBusy = true
        defer { isBusy = false }
        message = nil
        do {
            try await AppStore.sync()
            await refreshEntitlements()
            message = removesAds ? "Your purchase is restored." : "No eligible purchase was found for this account."
        } catch { message = "Purchases could not be restored. Please try again." }
    }
}
