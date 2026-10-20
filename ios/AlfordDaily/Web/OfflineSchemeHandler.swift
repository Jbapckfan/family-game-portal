import Foundation
import WebKit

@MainActor
final class OfflineSchemeHandler: NSObject, WKURLSchemeHandler {
    private let resolver: BundleResourceResolver
    private var activeTasks = Set<ObjectIdentifier>()

    init(root: URL) { resolver = BundleResourceResolver(root: root); super.init() }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        let identifier = ObjectIdentifier(urlSchemeTask)
        activeTasks.insert(identifier)
        defer { activeTasks.remove(identifier) }
        guard let url = urlSchemeTask.request.url,
              ["GET", "HEAD"].contains(urlSchemeTask.request.httpMethod ?? "GET") else {
            urlSchemeTask.didFailWithError(URLError(.unsupportedURL))
            return
        }
        do {
            let file = try resolver.fileURL(for: url)
            let data = try Data(contentsOf: file, options: .mappedIfSafe)
            let mime = BundleResourceResolver.mimeType(for: file)
            let textEncoding = mime.hasPrefix("text/") || mime.contains("json") || mime == "image/svg+xml"
            var headers = [
                "Content-Type": mime + (textEncoding ? "; charset=utf-8" : ""),
                "Content-Length": String(data.count),
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "no-cache",
                "Access-Control-Allow-Origin": "alford://app"
            ]
            if mime == "text/html" {
                headers["Content-Security-Policy"] = "default-src 'none'; script-src 'self' alford:; style-src 'self' alford: 'unsafe-inline'; img-src 'self' alford: data:; font-src 'self' alford:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'"
            }
            guard let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers) else {
                throw URLError(.badServerResponse)
            }
            guard activeTasks.contains(identifier) else { return }
            urlSchemeTask.didReceive(response)
            guard activeTasks.contains(identifier) else { return }
            if urlSchemeTask.request.httpMethod != "HEAD" { urlSchemeTask.didReceive(data) }
            guard activeTasks.contains(identifier) else { return }
            urlSchemeTask.didFinish()
        } catch {
            guard activeTasks.contains(identifier) else { return }
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        activeTasks.remove(ObjectIdentifier(urlSchemeTask))
    }
}

@MainActor
enum OfflineWebConfiguration {
    static var bundledRoot: URL { Bundle.main.resourceURL!.appendingPathComponent("Web", isDirectory: true) }

    static func make(messageHandler: WKScriptMessageHandler, root: URL? = nil) -> WKWebViewConfiguration {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        configuration.setURLSchemeHandler(OfflineSchemeHandler(root: root ?? bundledRoot), forURLScheme: "alford")
        configuration.userContentController.add(messageHandler, name: "alford")
        configuration.userContentController.addUserScript(WKUserScript(
            source: "window.__ALFORD_NATIVE__ = Object.freeze({ platform: 'ios', version: 1 });",
            injectionTime: .atDocumentStart, forMainFrameOnly: true))
        return configuration
    }
}
