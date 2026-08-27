import SwiftUI
import WebKit

@MainActor
final class MemberWebViewStore: ObservableObject {
    let webView: WKWebView
    private let initialURL: URL
    private var didLoad = false

    init(url: URL) {
        self.initialURL = url

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        config.defaultWebpagePreferences = preferences

        let view = WKWebView(frame: .zero, configuration: config)
        view.isOpaque = false
        view.backgroundColor = .black
        view.scrollView.backgroundColor = .black
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.scrollView.keyboardDismissMode = .interactive
        view.allowsBackForwardNavigationGestures = true
        view.customUserAgent = "S.u.G Member iOS/1.0"
        self.webView = view
    }

    func loadIfNeeded() {
        guard !didLoad else { return }
        didLoad = true
        var request = URLRequest(url: initialURL)
        request.cachePolicy = .useProtocolCachePolicy
        webView.load(request)
    }

    func reload() {
        webView.reload()
    }
}

struct MemberWebView: UIViewRepresentable {
    @ObservedObject var store: MemberWebViewStore

    func makeUIView(context: Context) -> WKWebView {
        store.webView.navigationDelegate = context.coordinator
        store.loadIfNeeded()
        return store.webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }

            let allowedHosts = [
                "koji06ochi-ship-it.github.io",
                "supabase.co"
            ]

            if let host = url.host,
               !allowedHosts.contains(where: { host == $0 || host.hasSuffix("." + $0) }),
               navigationAction.navigationType == .linkActivated {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }

            decisionHandler(.allow)
        }
    }
}
