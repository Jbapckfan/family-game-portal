import Foundation

enum BundleResourceError: Error { case invalidOrigin, invalidPath, outsideBundle }

struct BundleResourceResolver {
    let root: URL

    init(root: URL) { self.root = root.standardizedFileURL.resolvingSymlinksInPath() }

    func fileURL(for url: URL) throws -> URL {
        guard LocalRoute.hasLocalOrigin(url),
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            throw BundleResourceError.invalidOrigin
        }
        let rawParts = components.percentEncodedPath.split(separator: "/", omittingEmptySubsequences: true)
        var parts: [String] = []
        for raw in rawParts {
            guard let part = String(raw).removingPercentEncoding, !part.isEmpty,
                  part != ".", part != "..", !part.contains("/"), !part.contains("\\"),
                  !part.contains("\0"), !part.contains("%") else { throw BundleResourceError.invalidPath }
            parts.append(part)
        }
        guard parts.count >= 2, parts[0] == "games" else {
            throw BundleResourceError.invalidPath
        }
        if parts[1] == "kimi-runtime" {
            guard !components.percentEncodedPath.hasSuffix("/"), Self.isSharedKimiResource(parts) else { throw BundleResourceError.invalidPath }
        } else if parts[1] == "deepseek-runtime" {
            guard !components.percentEncodedPath.hasSuffix("/"), parts.count == 3,
                  ["core.mjs", "common.mjs", "player-tools.mjs", "feedback-client.mjs", "daily-rotations.mjs", "practice-calendar.mjs", "styles.css"].contains(parts[2]) else { throw BundleResourceError.invalidPath }
        } else {
            guard GameID(rawValue: parts[1]) != nil else { throw BundleResourceError.invalidPath }
            if parts.count == 2 || components.percentEncodedPath.hasSuffix("/") { parts.append("index.html") }
        }
        var candidate = root
        for part in parts {
            candidate.appendPathComponent(part)
            // Bundled resources contain no symlinks. Inspect every component
            // before resolving the full path: Darwin may leave that path
            // unresolved when a later component does not exist. Reading the
            // link itself also detects a dangling link without following it.
            if (try? FileManager.default.destinationOfSymbolicLink(atPath: candidate.path)) != nil {
                throw BundleResourceError.outsideBundle
            }
        }
        candidate = candidate.standardizedFileURL.resolvingSymlinksInPath()
        guard candidate.path.hasPrefix(root.path + "/") else { throw BundleResourceError.outsideBundle }
        return candidate
    }

    // The shared directory is only an asset source, never a document route.
    // Keep this allowlist aligned with scripts/sync-ios-web.mjs.
    private static func isSharedKimiResource(_ parts: [String]) -> Bool {
        guard parts.count >= 4, parts.dropFirst(2).allSatisfy({ !$0.hasPrefix(".") }),
              let filename = parts.last else { return false }
        let suffix = (filename as NSString).pathExtension.lowercased()
        switch parts[2] {
        case "assets":
            return ["js", "mjs", "css", "json", "txt", "svg", "png", "jpg", "jpeg", "webp", "gif", "ico", "avif", "woff", "woff2", "ttf", "otf"].contains(suffix)
        case "fonts":
            return ["woff", "woff2", "ttf", "otf", "txt"].contains(suffix)
        default:
            return false
        }
    }

    static func mimeType(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "html", "htm": "text/html"
        case "mjs", "js": "text/javascript"
        case "css": "text/css"
        case "json": "application/json"
        case "webmanifest": "application/manifest+json"
        case "svg": "image/svg+xml"
        case "png": "image/png"
        case "jpg", "jpeg": "image/jpeg"
        case "webp": "image/webp"
        case "gif": "image/gif"
        case "avif": "image/avif"
        case "ico": "image/x-icon"
        case "woff": "font/woff"
        case "woff2": "font/woff2"
        case "ttf": "font/ttf"
        case "otf": "font/otf"
        case "txt": "text/plain"
        default: "application/octet-stream"
        }
    }
}
