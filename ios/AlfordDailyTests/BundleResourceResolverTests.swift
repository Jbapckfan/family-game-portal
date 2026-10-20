import XCTest
@testable import AlfordDaily

final class BundleResourceResolverTests: XCTestCase {
    func testGameDocumentsModulesAndFontsResolveInsideTheBundle() throws {
        let root = URL(fileURLWithPath: "/tmp/AlfordBundle/Web", isDirectory: true)
        let resolver = BundleResourceResolver(root: root)
        XCTAssertEqual(try resolver.fileURL(for: GameID.ringcount.localURL).path,
            root.resolvingSymlinksInPath().appendingPathComponent("games/ringcount/index.html").path)
        XCTAssertEqual(BundleResourceResolver.mimeType(for: URL(fileURLWithPath: "engine.mjs")), "text/javascript")
        XCTAssertEqual(BundleResourceResolver.mimeType(for: URL(fileURLWithPath: "index.html")), "text/html")
        XCTAssertEqual(BundleResourceResolver.mimeType(for: URL(fileURLWithPath: "font.ttf")), "font/ttf")
    }

    func testTraversalRemoteOriginsAndUnknownGamesAreRejected() {
        let resolver = BundleResourceResolver(root: URL(fileURLWithPath: "/tmp/AlfordBundle/Web"))
        let rejected = [
            "https://app/games/ringcount/index.html", "alford://evil.example/games/ringcount/index.html",
            "alford://app:80/games/ringcount/index.html", "alford://user@app/games/ringcount/index.html",
            "alford://app/games/tradeoff/index.html", "alford://app/games/ringcount/%2e%2e/secret",
            "alford://app/games/ringcount/%252e%252e/secret", "alford://app/games/ringcount/%2fetc/passwd",
            "alford://app/games/ringcount/%5csecret", "alford://app/games/ringcount/%00secret"
        ]
        for text in rejected {
            guard let url = URL(string: text) else { continue }
            XCTAssertThrowsError(try resolver.fileURL(for: url), text)
        }
    }

    func testSymlinksCannotEscapeTheWebBundle() throws {
        let temporary = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let root = temporary.appendingPathComponent("Web", isDirectory: true)
        let game = root.appendingPathComponent("games/ringcount", isDirectory: true)
        let outside = temporary.appendingPathComponent("outside", isDirectory: true)
        try FileManager.default.createDirectory(at: game, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: outside, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: temporary) }
        try Data("private".utf8).write(to: outside.appendingPathComponent("private.txt"))
        try Data("public".utf8).write(to: game.appendingPathComponent("public.txt"))
        try FileManager.default.createSymbolicLink(at: game.appendingPathComponent("link"), withDestinationURL: outside)
        try FileManager.default.createSymbolicLink(at: game.appendingPathComponent("file-link.txt"),
            withDestinationURL: outside.appendingPathComponent("private.txt"))
        try FileManager.default.createSymbolicLink(at: game.appendingPathComponent("dangling"),
            withDestinationURL: temporary.appendingPathComponent("does-not-exist"))
        try FileManager.default.createSymbolicLink(at: game.appendingPathComponent("internal-link.txt"),
            withDestinationURL: game.appendingPathComponent("public.txt"))
        let resolver = BundleResourceResolver(root: root)
        // Existing external targets, missing leaves, missing intermediate
        // directories, final-component links, and dangling links must all be
        // rejected by the resolver itself, before any file read is attempted.
        for path in ["link/private.txt", "link/missing.txt", "link/missing/leaf.txt",
                     "file-link.txt", "dangling", "dangling/leaf.txt", "internal-link.txt"] {
            XCTAssertThrowsError(try resolver.fileURL(for: URL(string: "alford://app/games/ringcount/\(path)")!), path) { error in
                guard let failure = error as? BundleResourceError else { return XCTFail("Unexpected error: \(error)") }
                switch failure {
                case .outsideBundle: break
                default: XCTFail("Expected bundle containment rejection for \(path), got \(failure)")
                }
            }
        }
        let ordinaryFile = try resolver.fileURL(for: URL(string: "alford://app/games/ringcount/public.txt")!)
        XCTAssertEqual(try String(contentsOf: ordinaryFile, encoding: .utf8), "public")
    }
}
