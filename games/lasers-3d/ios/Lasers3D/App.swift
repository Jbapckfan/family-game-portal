import UIKit
import WebKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let configuration = UISceneConfiguration(name: "Default", sessionRole: session.role)
        configuration.delegateClass = SceneDelegate.self
        return configuration
    }
}

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = GameController()
        self.window = window
        window.makeKeyAndVisible()
    }
}

final class GameController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    private var web: WKWebView!
    private let saveKey = "lasers3d.savedProgress"
    private let verify = ProcessInfo.processInfo.arguments.contains("--verify-game")
    private var initialSave: String?

    override func viewDidLoad() {
        super.viewDidLoad()
        initialSave = UserDefaults.standard.string(forKey: saveKey)
        let config = WKWebViewConfiguration()
        if verify { config.websiteDataStore = .nonPersistent() }
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.userContentController.add(self, name: "saveProgress")
        config.userContentController.add(self, name: "verification")
        let savedLiteral = jsonLiteral(initialSave)
        let bootstrap = """
        window.__nativeGame = true;
        try { const saved = \(savedLiteral); if (saved && !localStorage.getItem('lasers3d.v1')) localStorage.setItem('lasers3d.v1', saved); } catch (_) {}
        window.addEventListener('error', function(e) { console.error('Laser runtime: '+e.message); });
        document.addEventListener('DOMContentLoaded', function() {
          var fallback=document.querySelector('#webgl-fallback');
          if(fallback){fallback.querySelector('p').textContent='Graphics could not start. Your saved puzzle is safe.';var retry=fallback.querySelector('a');retry.textContent='Try again';retry.href='index.html';}
          var menu=document.querySelector('a.menu-link');
          if(menu){menu.textContent='Levels';menu.setAttribute('aria-label','Choose a level');menu.addEventListener('click',function(e){e.preventDefault();if(window.__lasers3d)window.__lasers3d.ui.showLevelSelect();});}
        });
        """
        config.userContentController.addUserScript(WKUserScript(source: bootstrap, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        web = WKWebView(frame: .zero, configuration: config)
        if #available(iOS 16.4, *) { web.isInspectable = true }
        web.navigationDelegate = self
        web.isOpaque = false
        web.backgroundColor = UIColor(red: 0.03, green: 0.05, blue: 0.14, alpha: 1)
        view.backgroundColor = web.backgroundColor
        web.scrollView.bounces = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)
        NSLayoutConstraint.activate([web.topAnchor.constraint(equalTo: view.topAnchor), web.bottomAnchor.constraint(equalTo: view.bottomAnchor), web.leadingAnchor.constraint(equalTo: view.leadingAnchor), web.trailingAnchor.constraint(equalTo: view.trailingAnchor)])
        NotificationCenter.default.addObserver(self, selector: #selector(save), name: UIApplication.willResignActiveNotification, object: nil)
        loadGame()
    }

    private func loadGame() {
        guard let root = Bundle.main.resourceURL?.appendingPathComponent("Game"),
              FileManager.default.fileExists(atPath: root.appendingPathComponent("index.html").path) else { showError("The game could not be opened."); return }
        web.loadFileURL(root.appendingPathComponent("index.html"), allowingReadAccessTo: root)
    }
    @objc private func save() { web.evaluateJavaScript("if(window.__lasers3d)window.__lasers3d.saveAttempt()", completionHandler: nil) }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { loadGame() }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { showError("Please reopen the game.") }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(action.request.url?.isFileURL == true || action.request.url?.scheme == "about" ? .allow : .cancel)
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "saveProgress", let value = message.body as? String, !verify { UserDefaults.standard.set(value, forKey: saveKey) }
        if message.name == "verification", let body = message.body as? [String: Any] {
            let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("verification.json")
            if let data = try? JSONSerialization.data(withJSONObject: body, options: [.prettyPrinted, .sortedKeys]) { try? data.write(to: url, options: .atomic) }
            print("LASERS_VERIFICATION: \(body)")
        }
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard verify else { return }
        guard let url = Bundle.main.url(forResource: "device-verify", withExtension: "js"), let script = try? String(contentsOf: url) else { return }
        web.evaluateJavaScript(script) { _, error in if let error { print("Verification error: \(error)") } }
    }
    private func jsonLiteral(_ value: String?) -> String {
        guard let value, let data = try? JSONSerialization.data(withJSONObject: [value]), let encoded = String(data: data, encoding: .utf8) else { return "null" }
        return String(encoded.dropFirst().dropLast())
    }
    private func showError(_ text: String) {
        let alert = UIAlertController(title: "Lasers 3D", message: text, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Retry", style: .default) { [weak self] _ in self?.loadGame() })
        present(alert, animated: true)
    }
    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
}
