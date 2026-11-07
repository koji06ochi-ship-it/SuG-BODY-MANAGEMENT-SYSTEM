import SwiftUI
import WebKit
import UIKit

@MainActor
final class DeviceWebSession: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate {
    let web: WKWebView
    private let exporter = NativeRecordExport()
    @Published var error: String?

    override init() {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.userContentController.add(exporter, name: "sugJSON")
        if let url = Bundle.main.url(forResource: "native-json-export", withExtension: "js"),
           let script = try? String(contentsOf: url, encoding: .utf8) {
            config.userContentController.addUserScript(WKUserScript(source: script,
                injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        web = WKWebView(frame: .zero, configuration: config)
        super.init()
        web.navigationDelegate = self
        web.uiDelegate = self
        web.scrollView.keyboardDismissMode = .interactive
        web.allowsBackForwardNavigationGestures = true
        exporter.webView = web
        web.load(URLRequest(url: URL(string: DeviceConfiguration.origin + "/index.html")!))
    }

    func openRecords() { web.evaluateJavaScript("window.SuGDeviceRecords?.open()") }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { error = nil }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError failure: Error) {
        error = "読み込めませんでした。保存済み記録は保持しています。"
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        error = "表示が中断しました。再読込すると未保存の入力は失われます。"
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        if url.scheme == "http", url.host == "127.0.0.1", url.port == Int(DeviceConfiguration.port),
           url.user == nil, url.password == nil { decisionHandler(.allow); return }
        if url.absoluteString == "about:blank" { decisionHandler(.allow); return }
        if action.navigationType == .linkActivated, url.scheme == "https" { UIApplication.shared.open(url) }
        decisionHandler(.cancel)
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard let url = action.request.url, action.navigationType == .linkActivated else { return nil }
        if url.scheme == "http", url.host == "127.0.0.1", url.port == Int(DeviceConfiguration.port) {
            webView.load(URLRequest(url: url))
        } else if url.scheme == "https" { UIApplication.shared.open(url) }
        return nil
    }
    private func presenter() -> UIViewController? {
        var view = web.window?.rootViewController
        while let next = view?.presentedViewController { view = next }
        return view
    }
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        guard let host = presenter() else { completionHandler(); return }
        let alert = UIAlertController(title: "S.u.G " + DeviceConfiguration.app, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        host.present(alert, animated: true)
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        guard let host = presenter() else { completionHandler(false); return }
        let alert = UIAlertController(title: "確認", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "キャンセル", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "確認して実行", style: .default) { _ in completionHandler(true) })
        host.present(alert, animated: true)
    }
}

struct DeviceWebView: UIViewRepresentable {
    @ObservedObject var session: DeviceWebSession
    func makeUIView(context: Context) -> WKWebView { session.web }
    func updateUIView(_ view: WKWebView, context: Context) {}
}

struct DevicePage: View {
    @StateObject private var session = DeviceWebSession()
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if let error = session.error {
                    Text(error).font(.callout).padding()
                    Button("再読込") { session.web.reload() }.padding(.bottom, 8)
                }
                DeviceWebView(session: session)
            }
            .navigationTitle("S.u.G " + DeviceConfiguration.app)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("記録") { session.openRecords() } } }
        }
    }
}

struct DeviceRoot: View {
    @StateObject private var server = BundleHTTPServer(folder: "Web", port: DeviceConfiguration.port)
    var body: some View {
        Group {
            if server.ready { DevicePage() }
            else { VStack { Text("S.u.G " + DeviceConfiguration.app).font(.title); Text(server.error ?? "起動しています…") }.padding() }
        }.task { server.start() }
    }
}
