import Foundation
import WebKit
import UniformTypeIdentifiers
import UIKit

/// User-requested JSON export to Files. Private app data is never uploaded.
@MainActor
final class NativeJSONExport: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    let origin: String
    let expectedFormat: String
    init(origin: String, expectedFormat: String) { self.origin = origin; self.expectedFormat = expectedFormat }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, let frameURL = message.frameInfo.request.url,
              frameURL.scheme == "http", frameURL.host == "127.0.0.1",
              "http://127.0.0.1:\(frameURL.port ?? 80)" == origin,
              let page = webView?.url, page.scheme == frameURL.scheme, page.host == frameURL.host, page.port == frameURL.port,
              let body = message.body as? [String: String], body["kind"] == "export",
              let text = body["json"], text.utf8.count <= 20 * 1024 * 1024,
              let bytes = text.data(using: .utf8), let object = try? JSONSerialization.jsonObject(with: bytes) as? [String: Any],
              (object["format"] as? String == expectedFormat || object["schema"] as? String == expectedFormat),
              var presenter = webView?.window?.rootViewController else { return }
        do {
            let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            let file = dir.appendingPathComponent("SUG-records.json")
            try bytes.write(to: file, options: [.withoutOverwriting, .completeFileProtection])
            while let next = presenter.presentedViewController { presenter = next }
            presenter.present(UIDocumentPickerViewController(forExporting: [file], asCopy: true), animated: true)
        } catch {
            webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('sug:native-export-error'))")
        }
    }
}
