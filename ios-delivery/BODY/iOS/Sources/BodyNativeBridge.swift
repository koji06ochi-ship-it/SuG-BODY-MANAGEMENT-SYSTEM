import Foundation
import WebKit
import CoreLocation
import UIKit

// No background location, no coordinate logging, no network transport.
@MainActor
final class BodyNativeBridge: NSObject, WKScriptMessageHandler, WKScriptMessageHandlerWithReply, CLLocationManagerDelegate {
    weak var webView: WKWebView?
    private let manager = CLLocationManager()
    private var requests: [Int: Bool] = [:]
    private var timeouts: [Int: DispatchWorkItem] = [:]
    private var backgroundObserver: NSObjectProtocol?

    override init() {
        super.init(); manager.delegate = self; manager.distanceFilter = kCLDistanceFilterNone
        backgroundObserver = NotificationCenter.default.addObserver(forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main) { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                for id in Array(self.requests.keys) { self.fail(id, code: 2, message: "バックグラウンドのためGPSを停止しました") }
                self.stopAll()
            }
        }
    }
    deinit { if let backgroundObserver { NotificationCenter.default.removeObserver(backgroundObserver) } }

    static func isTrusted(_ url: URL?) -> Bool {
        guard let url else { return false }
        if url.scheme == "http", url.host == "127.0.0.1", url.port == 5411, url.path == "/apps/body/daily-preview/index.html" { return true }
        guard url.isFileURL, let resources = Bundle.main.resourceURL else { return false }
        let expected = resources.appendingPathComponent("BodyFormal/apps/body/daily-preview/index.html").standardizedFileURL.path
        return url.standardizedFileURL.path == expected
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.frameInfo.isMainFrame, Self.isTrusted(message.frameInfo.request.url), Self.isTrusted(webView?.url),
              let body = message.body as? [String: Any], let text = body["url"] as? String,
              let url = URL(string: text), url.isFileURL, url.pathExtension == "json",
              let root = Bundle.main.resourceURL?.appendingPathComponent("BodyFormal/assets/walk-local/data", isDirectory: true),
              url.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path + "/") else {
            replyHandler(nil, "Not an approved bundled map asset"); return
        }
        do {
            let bytes = try Data(contentsOf: url)
            guard bytes.count <= 5 * 1024 * 1024, let value = String(data: bytes, encoding: .utf8) else {
                replyHandler(nil, "Invalid bundled JSON"); return
            }
            replyHandler(value, nil)
        } catch { replyHandler(nil, "Bundled map asset unavailable") }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, Self.isTrusted(message.frameInfo.request.url), Self.isTrusted(webView?.url),
              let body = message.body as? [String: Any], let kind = body["kind"] as? String else { return }
        switch kind {
        case "gpsStart":
            guard let id = body["id"] as? Int, id > 0, requests.count < 32 else { return }
            requests[id] = body["watch"] as? Bool ?? false
            manager.desiredAccuracy = body["highAccuracy"] as? Bool == true ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters
            let seconds = min(120, max(0, (body["timeout"] as? Double ?? 30000) / 1000))
            let timeout = DispatchWorkItem { [weak self] in self?.fail(id, code: 3, message: "現在地の取得がタイムアウトしました") }
            timeouts[id] = timeout; DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: timeout)
            startIfAuthorized()
        case "gpsStop": if let id = body["id"] as? Int { remove(id) }
        case "gpsStopAll": stopAll()
        case "healthRequest": NotificationCenter.default.post(name: .init("SuGBodyRequestHealth"), object: nil)
        case "exportJSON": if let text = body["json"] as? String { exportJSON(text) }
        default: break
        }
    }

    private func startIfAuthorized() {
        guard !requests.isEmpty else { return }
        switch manager.authorizationStatus {
        case .notDetermined: manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways: manager.startUpdatingLocation()
        case .restricted, .denied: for id in Array(requests.keys) { fail(id, code: 1, message: "位置情報の使用が許可されていません") }
        @unknown default: for id in Array(requests.keys) { fail(id, code: 2, message: "位置情報を利用できません") }
        }
    }
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) { startIfAuthorized() }
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let point = locations.last, point.horizontalAccuracy >= 0, abs(point.timestamp.timeIntervalSinceNow) <= 30,
              CLLocationCoordinate2DIsValid(point.coordinate) else { return }
        let coords: [String: Any] = ["latitude": point.coordinate.latitude, "longitude": point.coordinate.longitude,
            "accuracy": point.horizontalAccuracy, "altitude": point.verticalAccuracy >= 0 ? point.altitude as Any : NSNull(),
            "altitudeAccuracy": point.verticalAccuracy >= 0 ? point.verticalAccuracy as Any : NSNull(),
            "heading": point.course >= 0 ? point.course as Any : NSNull(), "speed": point.speed >= 0 ? point.speed as Any : NSNull()]
        for (id, watch) in Array(requests) {
            timeouts.removeValue(forKey: id)?.cancel()
            send(["id": id, "position": ["coords": coords, "timestamp": point.timestamp.timeIntervalSince1970 * 1000]])
            if !watch { remove(id) }
        }
    }
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if let value = error as? CLError, value.code == .locationUnknown { return }
        for id in Array(requests.keys) { fail(id, code: 2, message: "現在地を取得できませんでした") }
    }
    private func remove(_ id: Int) { requests.removeValue(forKey: id); timeouts.removeValue(forKey: id)?.cancel(); if requests.isEmpty { manager.stopUpdatingLocation() } }
    private func fail(_ id: Int, code: Int, message: String) { guard requests[id] != nil else { return }; send(["id": id, "error": ["code": code, "message": message]]); remove(id) }
    func stopAll() { for timeout in timeouts.values { timeout.cancel() }; timeouts.removeAll(); requests.removeAll(); manager.stopUpdatingLocation() }
    private func send(_ value: [String: Any]) {
        guard Self.isTrusted(webView?.url), let bytes = try? JSONSerialization.data(withJSONObject: value), let json = String(data: bytes, encoding: .utf8) else { return }
        webView?.evaluateJavaScript("window.SuGNativeTransport?.receiveGPS(\(json))")
    }

    private func exportJSON(_ text: String) {
        guard text.utf8.count <= 20 * 1024 * 1024, let bytes = text.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: bytes) as? [String: Any],
              object["schema"] as? String == "sug-body-daily-candidate-v3", object["data"] is [String: Any],
              var presenter = webView?.window?.rootViewController else { return }
        do {
            let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let file = directory.appendingPathComponent("SUG-BODY-records.json")
            try bytes.write(to: file, options: .withoutOverwriting)
            while let next = presenter.presentedViewController { presenter = next }
            presenter.present(UIDocumentPickerViewController(forExporting: [file], asCopy: true), animated: true)
        } catch {
            webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('sug:native-export-error'))")
        }
    }
}
