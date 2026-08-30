import SwiftUI
import WebKit

@MainActor
final class MemberWebViewStore: ObservableObject {
    let webView: WKWebView
    private let initialURL: URL
    private var didLoad = false
    private var pendingHealthJSON: String?

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
        request.cachePolicy = .reloadIgnoringLocalCacheData
        webView.load(request)
    }

    func reload() { webView.reload() }

    func installBodyRuntimeIfNeeded() {
        guard webView.url?.path.contains("member-home-v2.html") == true else { return }
        let js = """
        (function(){
          const scripts = [
            ['sugIdealV27Script','assets/member/v27/ideal-v27.js?v=27.0.2'],
            ['sugHealthV2Script','assets/member/v2/health-v2.js?v=27.0.2']
          ];
          for (const pair of scripts) {
            if (document.getElementById(pair[0])) continue;
            const s = document.createElement('script');
            s.id = pair[0];
            s.src = pair[1];
            s.onload = function(){
              const p = window.__SUG_NATIVE_HEALTH__;
              if (p && window.SuGHealthV2 && typeof window.SuGHealthV2.receiveNative === 'function') {
                window.SuGHealthV2.receiveNative(p);
              }
            };
            document.body.appendChild(s);
          }
        })();
        """
        webView.evaluateJavaScript(js)
    }

    func pushNativeHealth(steps: Int, sleepHours: Double?, restingHeartRate: Double?, weightKg: Double?, syncedAt: Date?) {
        let iso = ISO8601DateFormatter().string(from: syncedAt ?? Date())
        var payload: [String: Any] = ["source": "healthkit_native", "steps": max(0, steps), "syncedAt": iso]
        if let sleepHours { payload["sleep"] = sleepHours }
        if let restingHeartRate { payload["heartRate"] = restingHeartRate }
        if let weightKg { payload["weight"] = weightKg }
        guard JSONSerialization.isValidJSONObject(payload),
              let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }
        pendingHealthJSON = json
        deliverPendingHealth()
    }

    func deliverPendingHealth() {
        guard let json = pendingHealthJSON else { return }
        let js = """
        (function(){
          const payload = \(json);
          window.__SUG_NATIVE_HEALTH__ = payload;
          try { localStorage.setItem('sug_native_health_v1', JSON.stringify(payload)); } catch (_) {}
          window.dispatchEvent(new CustomEvent('sug:native-health', { detail: payload }));
          if (window.SuGHealthV2 && typeof window.SuGHealthV2.receiveNative === 'function') {
            window.SuGHealthV2.receiveNative(payload);
          }
          if (window.SuGV27 && typeof window.SuGV27.receiveNative === 'function') {
            window.SuGV27.receiveNative(payload);
          }
        })();
        """
        webView.evaluateJavaScript(js) { [weak self] _, error in
            if error == nil { self?.pendingHealthJSON = nil }
        }
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
    func makeCoordinator() -> Coordinator { Coordinator(store: store) }

    final class Coordinator: NSObject, WKNavigationDelegate {
        weak var store: MemberWebViewStore?
        init(store: MemberWebViewStore) { self.store = store }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            Task { @MainActor in
                self.store?.installBodyRuntimeIfNeeded()
                self.store?.deliverPendingHealth()
            }
        }
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else { decisionHandler(.allow); return }
            let allowedHosts = ["koji06ochi-ship-it.github.io", "supabase.co"]
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