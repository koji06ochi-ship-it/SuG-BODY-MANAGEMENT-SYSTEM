import Foundation
import Network
import Combine

/// Bundled static files only. Fixed loopback origin preserves WK storage across launches.
/// Never serves Application Support/Documents, never forwards a paid API request.
final class BundleHTTPServer: ObservableObject {
    @Published private(set) var ready = false
    @Published private(set) var error: String?
    let port: UInt16
    let root: URL
    private var listener: NWListener?
    private let queue = DispatchQueue(label: "sug.bundle.http")
    private let csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tile.openstreetmap.org; connect-src 'self' blob:; font-src 'self' data:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'"

    init(folder: String, port: UInt16) {
        self.port = port
        root = Bundle.main.resourceURL!.appendingPathComponent(folder, isDirectory: true).standardizedFileURL
    }
    func start() {
        guard listener == nil else { return }
        guard FileManager.default.fileExists(atPath: root.path) else { error = "同梱ファイルがありません。起動を停止しました。"; return }
        do {
            let params = NWParameters.tcp
            let localPort = NWEndpoint.Port(rawValue: port)!
            params.requiredLocalEndpoint = .hostPort(host: "127.0.0.1", port: localPort)
            let value = try NWListener(using: params, on: localPort)
            value.stateUpdateHandler = { [weak self] state in
                DispatchQueue.main.async {
                    switch state {
                    case .ready: self?.ready = true
                    case .failed(let e): self?.ready = false; self?.error = "端末内の起動に失敗しました：\(e.localizedDescription)"
                    default: break
                    }
                }
            }
            value.newConnectionHandler = { [weak self] connection in
                guard let self else { connection.cancel(); return }
                connection.start(queue: self.queue)
                self.receive(connection, buffer: Data())
                self.queue.asyncAfter(deadline: .now() + 10) { connection.cancel() }
            }
            listener = value; value.start(queue: queue)
        } catch { self.error = "端末内サーバーを起動できません：\(error.localizedDescription)" }
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
        let types = ["html":"text/html; charset=utf-8", "js":"text/javascript; charset=utf-8", "mjs":"text/javascript; charset=utf-8", "css":"text/css; charset=utf-8", "json":"application/json", "png":"image/png", "jpg":"image/jpeg", "jpeg":"image/jpeg", "webp":"image/webp", "svg":"image/svg+xml", "woff2":"font/woff2", "ttf":"font/ttf"]
        reply(c, code: 200, mime: types[file.pathExtension.lowercased()] ?? "application/octet-stream", data: bytes, head: method == "HEAD")
    }
    private func reply(_ c: NWConnection, code: Int, mime: String, data: Data, head: Bool = false) {
        let header = "HTTP/1.1 \(code) Response\r\nContent-Type: \(mime)\r\nContent-Length: \(data.count)\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nContent-Security-Policy: \(csp)\r\nConnection: close\r\n\r\n"
        var all = Data(header.utf8); if !head { all.append(data) }
        c.send(content: all, completion: .contentProcessed { _ in c.cancel() })
    }
}
