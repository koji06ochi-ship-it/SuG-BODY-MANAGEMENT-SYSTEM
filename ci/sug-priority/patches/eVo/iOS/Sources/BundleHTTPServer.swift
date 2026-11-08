import Foundation
import Network
import Combine
import os

/// Bundled static files only. The fixed loopback origin preserves WK storage.
/// No Documents/Application Support files, Bonjour advertisement, or API proxy.
final class BundleHTTPServer: ObservableObject {
    @Published private(set) var ready = false
    @Published private(set) var error: String?
    @Published private(set) var diagnostics = "stage=idle"
    let port: UInt16
    let root: URL
    private let entry: String
    private var listener: NWListener?
    private let queue = DispatchQueue(label: "sug.bundle.http")
    private let logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "sug.bundle.http", category: "startup")
    private let csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tile.openstreetmap.org; connect-src 'self' blob:; font-src 'self' data:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'"

    init(folder: String, port: UInt16, entry: String = "index.html") {
        self.port = port
        self.entry = entry
        root = Bundle.main.resourceURL!.appendingPathComponent(folder, isDirectory: true).standardizedFileURL
    }

    private func report(stage: String, state: String, fault: String = "none", failure: Error? = nil, message: String? = nil) {
        let ns = failure.map { $0 as NSError }
        // Fixed endpoint and error domain/code only; no input, records, headers, or full paths.
        let detail = "stage=\(stage)\nstate=\(state)\nfault=\(fault)\nendpoint=127.0.0.1:\(port)\ndomain=\(ns?.domain ?? "none")\ncode=\(ns?.code ?? 0)"
        logger.info("sug_startup stage=\(stage, privacy: .public) state=\(state, privacy: .public) fault=\(fault, privacy: .public) port=\(self.port, privacy: .public) code=\(ns?.code ?? 0, privacy: .public)")
        DispatchQueue.main.async { [weak self] in
            self?.ready = state == "ready"
            self?.error = message
            self?.diagnostics = detail
        }
    }

    private func reportNetworkFailure(_ failure: NWError, stage: String, waiting: Bool = false) {
        let fault: String
        let message: String
        switch failure {
        case .posix(.EADDRINUSE):
            fault = "port_in_use"
            message = "端末内のポートが使用中です。保存済み記録は変更していません。"
        case .posix(.EINVAL):
            fault = "invalid_listener_configuration"
            message = "端末内サーバーの設定で起動に失敗しました。保存済み記録は変更していません。"
        default:
            fault = "network_listener_failure"
            message = waiting ? "端末内サーバーの起動を待機しています。" : "端末内サーバーを起動できませんでした。"
        }
        report(stage: stage, state: waiting ? "waiting" : "failed", fault: fault, failure: failure, message: message)
    }

    func start() {
        guard listener == nil else { return }
        report(stage: "resource_check", state: "starting")
        var directory: ObjCBool = false
        guard FileManager.default.fileExists(atPath: root.path, isDirectory: &directory), directory.boolValue else {
            report(stage: "resource_check", state: "failed", fault: "bundle_directory_missing", message: "同梱フォルダーがありません。起動を停止しました。")
            return
        }
        guard FileManager.default.isReadableFile(atPath: root.appendingPathComponent(entry).path) else {
            report(stage: "resource_check", state: "failed", fault: "bundle_entry_missing", message: "同梱の起動ページがありません。起動を停止しました。")
            return
        }
        guard port != 0, let localPort = NWEndpoint.Port(rawValue: port) else {
            report(stage: "listener_configuration", state: "failed", fault: "invalid_fixed_port", message: "端末内サーバーの固定ポート設定が不正です。")
            return
        }
        do {
            let params = NWParameters.tcp
            params.requiredLocalEndpoint = .hostPort(host: "127.0.0.1", port: localPort)
            // The address and fixed port have ONE source. Never fall back to an any-address listener.
            report(stage: "listener_create", state: "starting")
            let value = try NWListener(using: params)
            value.stateUpdateHandler = { [weak self] state in
                guard let self else { return }
                switch state {
                case .setup:
                    self.report(stage: "listener_state", state: "setup")
                case .ready:
                    guard self.listener?.port?.rawValue == self.port else {
                        self.report(stage: "listener_state", state: "failed", fault: "listener_port_mismatch", message: "固定ポートを確認できないため、起動を停止しました。")
                        self.listener?.cancel()
                        return
                    }
                    self.report(stage: "listener_ready", state: "ready")
                case .waiting(let failure): self.reportNetworkFailure(failure, stage: "listener_state", waiting: true)
                case .failed(let failure): self.reportNetworkFailure(failure, stage: "listener_state")
                case .cancelled:
                    self.report(stage: "listener_state", state: "cancelled", message: "端末内サーバーが停止しました。保存済み記録は保持しています。")
                @unknown default:
                    self.report(stage: "listener_state", state: "unknown", message: "端末内サーバーの状態を確認できません。")
                }
            }
            value.newConnectionHandler = { [weak self] connection in
                guard let self else { connection.cancel(); return }
                connection.start(queue: self.queue)
                self.receive(connection, buffer: Data())
                self.queue.asyncAfter(deadline: .now() + 10) { connection.cancel() }
            }
            listener = value
            value.start(queue: queue)
        } catch let failure as NWError {
            reportNetworkFailure(failure, stage: "listener_create")
        } catch {
            report(stage: "listener_create", state: "failed", fault: "listener_initialization_failure", failure: error, message: "端末内サーバーを作成できませんでした。")
        }
    }
    private func receive(_ c: NWConnection, buffer: Data) {
        c.receive(minimumIncompleteLength: 1, maximumLength: 16384) { [weak self] data, _, complete, error in
            guard let self else { c.cancel(); return }
            var next = buffer; if let data { next.append(data) }
            guard next.count <= 16384 else { self.reply(c, code: 431, mime: "text/plain", data: Data()); return }
            if next.range(of: Data("\r\n\r\n".utf8)) != nil { self.respond(c, request: next) }
            else if !complete && error == nil { self.receive(c, buffer: next) }
            else { c.cancel() }
        }
    }
    private func respond(_ c: NWConnection, request: Data) {
        guard let raw = String(data: request, encoding: .utf8) else { reply(c, code: 400, mime: "text/plain", data: Data()); return }
        let lines = raw.components(separatedBy: "\r\n"), parts = (lines.first ?? "").split(separator: " ")
        guard parts.count == 3, parts[2].hasPrefix("HTTP/1."), ["GET", "HEAD"].contains(String(parts[0])),
              lines.dropFirst().contains(where: { $0.lowercased() == "host: 127.0.0.1:\(port)" }) else {
            reply(c, code: 403, mime: "application/json", data: Data("{\"error\":\"local_request_only\",\"networkCalled\":false}".utf8)); return
        }
        let method = String(parts[0]), pathWithQuery = String(parts[1])
        guard pathWithQuery.hasPrefix("/"), !pathWithQuery.hasPrefix("//"),
              let rel = pathWithQuery.split(separator: "?", maxSplits: 1).first?.removingPercentEncoding,
              !rel.contains("\\"), !rel.contains("\0"), !rel.split(separator: "/").contains("..") else {
            reply(c, code: 400, mime: "text/plain", data: Data()); return
        }
        if rel.hasPrefix("/api/") { reply(c, code: 503, mime: "application/json", data: Data("{\"status\":\"safe_stopped\",\"error\":\"real_api_transport_disabled\",\"networkCalled\":false}".utf8)); return }
        var file = root.appendingPathComponent(rel == "/" ? "index.html" : (rel == "/top" ? "top.html" : String(rel.dropFirst()))).standardizedFileURL.resolvingSymlinksInPath()
        var isDir: ObjCBool = false
        if FileManager.default.fileExists(atPath: file.path, isDirectory: &isDir), isDir.boolValue { file.appendPathComponent("index.html") }
        guard file.path.hasPrefix(root.resolvingSymlinksInPath().path + "/"),
              let bytes = try? Data(contentsOf: file, options: .mappedIfSafe) else { reply(c, code: 404, mime: "text/plain", data: Data("同梱ファイルがありません".utf8)); return }
        let types = ["html":"text/html; charset=utf-8", "js":"text/javascript; charset=utf-8", "mjs":"text/javascript; charset=utf-8", "css":"text/css; charset=utf-8", "json":"application/json", "png":"image/png", "jpg":"image/jpeg", "jpeg":"image/jpeg", "webp":"image/webp", "svg":"image/svg+xml", "woff2":"font/woff2"]
        reply(c, code: 200, mime: types[file.pathExtension.lowercased()] ?? "application/octet-stream", data: bytes, head: method == "HEAD")
    }
    private func reply(_ c: NWConnection, code: Int, mime: String, data: Data, head: Bool = false) {
        let header = "HTTP/1.1 \(code) Response\r\nContent-Type: \(mime)\r\nContent-Length: \(data.count)\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nContent-Security-Policy: \(csp)\r\nConnection: close\r\n\r\n"
        var all = Data(header.utf8); if !head { all.append(data) }
        c.send(content: all, completion: .contentProcessed { _ in c.cancel() })
    }
}
