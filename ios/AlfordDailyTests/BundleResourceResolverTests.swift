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
            "alford://app/games/unknown-game/index.html", "alford://app/games/ringcount/%2e%2e/secret",
            "alford://app/games/ringcount/%252e%252e/secret", "alford://app/games/ringcount/%2fetc/passwd",
            "alford://app/games/ringcount/%5csecret", "alford://app/games/ringcount/%00secret"
        ]
        for text in rejected {
            guard let url = URL(string: text) else { continue }
            XCTAssertThrowsError(try resolver.fileURL(for: url), text)
        }
    }

    func testKimiSharedResourcesAreRestrictedAndNeverNavigableGameDocuments() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent("AlfordBundle/Web", isDirectory: true)
        let resolver = BundleResourceResolver(root: root)
        for path in ["assets/app-123.js", "assets/nested/chunk.mjs", "assets/styles.css", "fonts/nunito.woff2", "fonts/LICENSE.txt"] {
            let url = URL(string: "alford://app/games/kimi-runtime/\(path)")!
            XCTAssertTrue(try resolver.fileURL(for: url).path.hasSuffix("/games/kimi-runtime/\(path)"))
            XCTAssertNil(LocalRoute.game(at: url))
            XCTAssertFalse(LocalRoute.isHome(url))
        }
        for path in ["", "index.html", "assets/index.html", "assets/main.js/", "fonts/script.js",
                     "other/app.js", "assets/.private.js", "assets/app.map", "assets/%2e%2e/index.html"] {
            XCTAssertThrowsError(try resolver.fileURL(for: URL(string: "alford://app/games/kimi-runtime/\(path)")!), path)
        }
        for game in CreatorFilter.kimi.games {
            XCTAssertEqual(LocalRoute.game(at: game.localURL), game)
            XCTAssertTrue(try resolver.fileURL(for: game.localURL).path.hasSuffix("/games/\(game.rawValue)/index.html"))
        }
    }

    func testFlatSharedModulesResolveWithoutCreatingNavigableDocuments() throws {
        let resolver = BundleResourceResolver(root: FileManager.default.temporaryDirectory.appendingPathComponent("AlfordBundle/Web"))
        for path in ["core.mjs", "common.mjs", "styles.css"] {
            let url = URL(string: "alford://app/games/deepseek-runtime/\(path)")!
            XCTAssertTrue(try resolver.fileURL(for: url).path.hasSuffix("/games/deepseek-runtime/\(path)"))
            XCTAssertNil(LocalRoute.game(at: url))
            XCTAssertFalse(LocalRoute.isHome(url))
        }
        for path in ["", "index.html", "puzzles.json", "other.mjs", "core.mjs/", "nested/core.mjs",
                     ".core.mjs", "%2e%2e/core.mjs", "%252e%252e/core.mjs"] {
            let url = URL(string: "alford://app/games/deepseek-runtime/\(path)")!
            XCTAssertThrowsError(try resolver.fileURL(for: url), path)
            XCTAssertNil(LocalRoute.game(at: url))
        }
        for game in CreatorFilter.deepSeek.games + CreatorFilter.qwen.games + CreatorFilter.claude.games {
            XCTAssertEqual(LocalRoute.game(at: game.localURL), game)
            XCTAssertTrue(try resolver.fileURL(for: game.localURL).path.hasSuffix("/games/\(game.rawValue)/index.html"))
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
