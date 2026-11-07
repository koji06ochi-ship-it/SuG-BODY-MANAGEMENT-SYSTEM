import Foundation
import Security
import Combine

@MainActor
final class WhyDevice: ObservableObject {
    @Published var serverText = UserDefaults.standard.string(forKey: "WHY_SERVER") ?? ""
    @Published var message = ""
    @Published var connected = false
    private let service = "jp.sugosaka.why.device"
    private let session: URLSession = {
        let c = URLSessionConfiguration.default
        c.timeoutIntervalForRequest = 35
        c.httpMaximumConnectionsPerHost = 2
        return URLSession(configuration: c, delegate: NoRedirect(), delegateQueue: nil)
    }()
    private func origin() throws -> URL {
        guard let u = URL(string: serverText), u.scheme == "https", u.host != nil,
              u.user == nil, u.password == nil, (u.path.isEmpty || u.path == "/"), u.query == nil, u.fragment == nil else {
            throw NSError(domain: "WHY", code: 1, userInfo: [NSLocalizedDescriptionKey: "実在するHTTPSサーバーのURLが必要です"])
        }; return u
    }
    private var query: [String: Any] { [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: "device"] }
    private func token() -> String? {
        var q = query; q[kSecReturnData as String] = true; q[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?; guard SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess, let d = result as? Data else { return nil }
        return String(data: d, encoding: .utf8)
    }
    private func store(_ token: String) throws {
        SecItemDelete(query as CFDictionary); var q = query
        q[kSecValueData as String] = Data(token.utf8)
        q[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        guard SecItemAdd(q as CFDictionary, nil) == errSecSuccess else { throw NSError(domain: "WHY", code: 2) }
    }
    func pair(code: String) async {
        do {
            let base = try origin(); var r = URLRequest(url: base.appendingPathComponent("device/pair"))
            r.httpMethod = "POST"; r.setValue("application/json", forHTTPHeaderField: "Content-Type")
            r.httpBody = try JSONSerialization.data(withJSONObject: ["code":code])
            let (data, response) = try await session.data(for:r)
            guard (response as? HTTPURLResponse)?.statusCode == 200,
                  let x = try JSONSerialization.jsonObject(with:data) as? [String:Any], let t = x["deviceToken"] as? String else {
                throw NSError(domain:"WHY",code:3,userInfo:[NSLocalizedDescriptionKey:"接続コードを確認してください。AI送信はしていません。"])
            }
            try store(t); UserDefaults.standard.set(base.absoluteString,forKey:"WHY_SERVER"); connected = true; message = "接続しました。外部AI送信には別途、内容の確認と同意が必要です。"
        } catch { connected = false; message = error.localizedDescription }
    }
    func disconnect() async {
        _ = try? await request(path:"/device/disconnect",method:"POST",body:"{}",csrf:"")
        SecItemDelete(query as CFDictionary); session.configuration.httpCookieStorage?.removeCookies(since: .distantPast)
        connected = false; message = "この端末の接続を解除しました。送信済み情報は取り消せません。"
    }
    func request(path:String,method:String,body:String,csrf:String) async throws -> [String:Any] {
        guard (path == "/device/disconnect" || path.range(of:"^/api/[a-z-]+$",options:.regularExpression) != nil),
              ["GET","POST"].contains(method), body.utf8.count <= 16000 else { throw NSError(domain:"WHY",code:4) }
        let base = try origin()
        // The token is bound to its paired server. Never forward it after an edited URL.
        guard base.absoluteString == UserDefaults.standard.string(forKey:"WHY_SERVER"), let t=token() else {
            throw NSError(domain:"WHY",code:5,userInfo:[NSLocalizedDescriptionKey:"このiPhoneの接続を先に確認してください"])
        }
        var r=URLRequest(url:base.appendingPathComponent(String(path.dropFirst())));r.httpMethod=method
        r.setValue("Bearer "+t,forHTTPHeaderField:"Authorization");r.setValue("application/json",forHTTPHeaderField:"Content-Type")
        r.setValue(csrf,forHTTPHeaderField:"X-WHY-CSRF");if method == "POST" { r.httpBody=Data(body.utf8) }
        let (data,response)=try await session.data(for:r)
        guard let h=response as? HTTPURLResponse, data.count <= 524288, let text=String(data:data,encoding:.utf8) else { throw NSError(domain:"WHY",code:6) }
        if h.statusCode == 401 { connected=false }
        return ["status":h.statusCode,"body":text]
    }
}
private final class NoRedirect: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
