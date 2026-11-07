import SwiftUI
import WebKit
import Combine

@MainActor
final class EvolinkWebBridge: ObservableObject {
    weak var webView: WKWebView?
    private var pending: [String: Any]?
    func deliver(_ payload: [String: Any]) { pending = payload; flush() }
    func clear() { pending = nil; webView?.evaluateJavaScript("window.SuGEvolinkNativeHealth?.clear?.()") }
    func flush() {
        guard let webView, let pending, JSONSerialization.isValidJSONObject(pending),
              let data = try? JSONSerialization.data(withJSONObject: pending), let json = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.SuGEvolinkNativeHealth?.receive(\(json))") { [weak self] _, error in if error == nil { self?.pending = nil } }
    }
}
struct EvolinkWebView: UIViewRepresentable {
    @ObservedObject var bridge: EvolinkWebBridge
    let onRefresh: () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(bridge: bridge, onRefresh: onRefresh) }
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration(); config.websiteDataStore = .default()
        config.userContentController.add(context.coordinator, name: "sugEvolinkHealth")
        if let url = Bundle.main.url(forResource: "native-health-bridge", withExtension: "js"), let script = try? String(contentsOf: url) {
            config.userContentController.addUserScript(WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        let export = NativeJSONExport(origin: "http://127.0.0.1:5412", expectedFormat: "SUG_EVOLINK_BACKUP")
        config.userContentController.add(export, name: "sugJSON")
        if let url = Bundle.main.url(forResource: "native-json-export", withExtension: "js"), let script = try? String(contentsOf: url) {
            config.userContentController.addUserScript(WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        let web = WKWebView(frame: .zero, configuration: config)
        context.coordinator.export = export; export.webView = web
        web.navigationDelegate = context.coordinator; web.uiDelegate = context.coordinator
        web.scrollView.keyboardDismissMode = .interactive
        bridge.webView = web
        web.load(URLRequest(url: URL(string: "http://127.0.0.1:5412/top.html")!))
        return web
    }
    func updateUIView(_ web: WKWebView, context: Context) { bridge.webView = web }
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler, WKUIDelegate {
        let bridge: EvolinkWebBridge; let onRefresh: () -> Void; var export: NativeJSONExport?
        init(bridge: EvolinkWebBridge, onRefresh: @escaping () -> Void) { self.bridge = bridge; self.onRefresh = onRefresh }
        func webView(_ web: WKWebView, didFinish navigation: WKNavigation!) { bridge.flush() }
        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.host == "127.0.0.1", message.frameInfo.request.url?.port == 5412,
                  message.name == "sugEvolinkHealth", let body = message.body as? [String: String], body["action"] == "refresh" else { return }
            onRefresh()
        }
        func webView(_ web: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            if url.scheme == "http", url.host == "127.0.0.1", url.port == 5412 { decisionHandler(.allow); return }
            if action.navigationType == .linkActivated, ["https", "tel"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }
            decisionHandler(.cancel)
        }
        func webView(_ web: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = action.request.url, action.navigationType == .linkActivated, url.scheme == "https" { UIApplication.shared.open(url) }; return nil
        }
        func webView(_ web: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            guard let host = web.window?.rootViewController else { completionHandler(); return }
            let alert = UIAlertController(title: "S.u.G eVo", message: message, preferredStyle: .alert); alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() }); host.present(alert, animated: true)
        }
        func webView(_ web: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            guard let host = web.window?.rootViewController else { completionHandler(false); return }
            let alert = UIAlertController(title: "確認", message: message, preferredStyle: .alert); alert.addAction(UIAlertAction(title: "キャンセル", style: .cancel) { _ in completionHandler(false) }); alert.addAction(UIAlertAction(title: "確認して実行", style: .default) { _ in completionHandler(true) }); host.present(alert, animated: true)
        }
    }
}
struct EvolinkBootView: View {
    @StateObject private var server = BundleHTTPServer(folder: "Web", port: 5412)
    var body: some View {
        Group { if server.ready { EvolinkMainView() } else { VStack { Text("S.u.G eVo").font(.title); Text(server.error ?? "起動しています…") }.padding() } }.task { server.start() }
    }
}
