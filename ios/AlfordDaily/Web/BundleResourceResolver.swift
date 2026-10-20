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
        guard parts.count >= 2, parts[0] == "games", GameID(rawValue: parts[1]) != nil else {
            throw BundleResourceError.invalidPath
        }
        if parts.count == 2 || components.percentEncodedPath.hasSuffix("/") { parts.append("index.html") }
        let candidate = parts.reduce(root) { $0.appendingPathComponent($1) }
            .standardizedFileURL.resolvingSymlinksInPath()
        guard candidate.path.hasPrefix(root.path + "/") else { throw BundleResourceError.outsideBundle }
        return candidate
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
