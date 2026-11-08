import Foundation
import WebKit
import UIKit

@MainActor
final class NativeRecordExport: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "sugJSON", message.frameInfo.isMainFrame,
              let url = message.frameInfo.request.url, url.scheme == "http", url.host == "127.0.0.1",
              url.port == Int(DeviceConfiguration.port), let page = webView?.url,
              page.scheme == url.scheme, page.host == url.host, page.port == url.port,
              let body = message.body as? [String: String], body["kind"] == "export",
              let text = body["json"], text.utf8.count <= 36 * 1024 * 1024,
              let data = text.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let format = object["format"] as? String ?? object["schema"] as? String,
              DeviceConfiguration.formats.contains(format),
              text.utf8.count <= (format == "SUG_GLOW_PHOTOS" ? 36 : 20) * 1024 * 1024,
              format != "SUG_GLOW_PHOTOS" || (DeviceConfiguration.app == "GLOW" && object["app"] as? String == "GLOW" && object["version"] as? Int == 1),
              format != "SUG_DEVICE_BACKUP" || object["app"] as? String == DeviceConfiguration.app,
              var host = webView?.window?.rootViewController else {
            fail(); return
        }
        do {
            let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let file = folder.appendingPathComponent("SUG-" + DeviceConfiguration.app + (format == "SUG_GLOW_PHOTOS" ? "-photos.json" : "-records.json"))
            try data.write(to: file, options: [.withoutOverwriting, .completeFileProtection])
            while let next = host.presentedViewController { host = next }
            host.present(UIDocumentPickerViewController(forExporting: [file], asCopy: true), animated: true)
        } catch { fail() }
    }
    private func fail() {
        webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('sug:native-export-error'))")
    }
}
