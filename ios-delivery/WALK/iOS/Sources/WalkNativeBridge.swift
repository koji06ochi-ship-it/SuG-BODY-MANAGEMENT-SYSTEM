import Foundation
import WebKit
import UIKit

enum WalkNativeConfiguration {
    static let launchURL=URL(string:"http://127.0.0.1:5413/walk-quest.html?native=ios")!
    static func matches(_ url: URL?, target: URL)->Bool { guard let url else {return false};return url.scheme=="http" && url.host=="127.0.0.1" && url.port==5413 && url.path==target.path && url.user==nil && url.password==nil }
}

/// One-way native-to-main-frame delivery. No web-accessible GPS start command.
@MainActor
final class WalkNativeBridge {
    private let target: URL
    private let streamID = UUID().uuidString
    private var sequence = 0
    private var sending = false
    private(set) var ready = false

    init(target: URL) { self.target = target }

    func install(on configuration: WKWebViewConfiguration) {
        guard let url = Bundle.main.url(forResource: "WalkBridgeBoot", withExtension: "js"),
              let script = try? String(contentsOf: url, encoding: .utf8),
              let data = try? JSONSerialization.data(withJSONObject: [
                "origin": "http://127.0.0.1:5413", "path": target.path, "streamId": streamID
              ]), let json = String(data: data, encoding: .utf8) else { return }
        configuration.userContentController.addUserScript(WKUserScript(
            source: "const sugWalkBootConfig = \(json);\n" + script,
            injectionTime: .atDocumentStart, forMainFrameOnly: false))
        ready = true
    }

    func permits(_ url: URL?) -> Bool { WalkNativeConfiguration.matches(url, target: target) }

    func push(_ recorder: WalkSessionRecorder, into webView: WKWebView) {
        guard ready, !sending, UIApplication.shared.applicationState == .active,
              permits(webView.url), !webView.isLoading else { return }
        sequence += 1
        let s = recorder.summary
        var payload: [String: Any] = [
            "schema": 1, "source": "ios-core-location", "streamId": streamID,
            "sequence": sequence, "sessionId": s.id.uuidString, "phase": s.phase.rawValue,
            "meters": s.meters, "elapsedMs": recorder.elapsedSeconds * 1000,
            "sentAt": Date().timeIntervalSince1970 * 1000, "message": recorder.message
        ]
        if s.phase == .recording, let fix = recorder.latestFix,
           Date().timeIntervalSince(fix.timestamp) <= 20 {
            payload["fix"] = ["lat": fix.coordinate.latitude, "lng": fix.coordinate.longitude,
                              "accuracy": fix.horizontalAccuracy, "t": fix.timestamp.timeIntervalSince1970 * 1000]
        }
        sending = true
        webView.callAsyncJavaScript("""
            if (location.origin !== expectedOrigin || location.pathname !== expectedPath || window !== window.top) return;
            const owner = window.__SUG_NATIVE_WALK_OWNER__;
            if (!owner || owner.streamId !== payload.streamId) return;
            window.__SUG_NATIVE_WALK_SNAPSHOT__ = payload;
            window.dispatchEvent(new CustomEvent('sug:native-walk', {detail: payload}));
            """, arguments: ["payload": payload, "expectedOrigin": "http://127.0.0.1:5413",
                             "expectedPath": target.path], in: nil, in: .page) { [weak self] _ in
            self?.sending = false
        }
    }
}
