import XCTest
@testable import AlfordDaily

final class PurchasePolicyTests: XCTestCase {
    @MainActor
    func testDisabledCommerceCannotStartPurchasesOrCreateAnEntitlement() async {
        let manager = PurchaseManager(configuration: CommerceConfiguration(isEnabled: false, isLocalTest: false, productID: nil))
        await manager.start()
        await manager.purchase()
        await manager.restore()
        XCTAssertNil(manager.product)
        XCTAssertFalse(manager.removesAds)
        XCTAssertFalse(manager.isBusy)
    }
}
