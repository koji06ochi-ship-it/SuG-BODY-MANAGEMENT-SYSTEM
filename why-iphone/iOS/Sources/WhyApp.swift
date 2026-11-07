import SwiftUI
import WebKit
import UniformTypeIdentifiers

@main
struct WhyApp: App {
    var body: some Scene { WindowGroup { WhyRoot().preferredColorScheme(.dark) } }
}
struct WhyRoot: View {
    @StateObject private var server = BundleHTTPServer(folder:"Web",port:5415)
    @StateObject private var device = WhyDevice()
    @State private var showingConnection = false
    @State private var code = ""
    @State private var pairing = false
    var body: some View {
        NavigationStack {
            Group {
                if server.ready { WhyWeb(device:device) }
                else { Text(server.error ?? "S.u.G WHYを起動しています…").padding() }
            }
            .toolbar { ToolbarItem(placement:.topBarTrailing) { Button("AI接続") { showingConnection=true } } }
            .navigationBarTitleDisplayMode(.inline)
        }
        .task { server.start() }
        .sheet(isPresented:$showingConnection) {
            NavigationStack {
                Form {
                    Section("このiPhoneのAI接続") {
                        TextField("HTTPSサーバーURL",text:$device.serverText).textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                        SecureField("本人用の接続コード",text:$code).textInputAutocapitalization(.never).autocorrectionDisabled()
                        Button(pairing ? "接続中…" : "このiPhoneを接続") {
                            pairing=true
                            Task { await device.pair(code:code);code="";pairing=false }
                        }.disabled(pairing || code.isEmpty)
                        Text(device.message.isEmpty ? "APIキーはこのiPhoneに設定しません。会話送信は毎回、内容を確認してから行います。" : device.message)
                        Button("接続を解除",role:.destructive) { Task { await device.disconnect() } }
                    }
                }
                .navigationTitle("AI接続")
                .toolbar { ToolbarItem(placement:.confirmationAction) { Button("戻る") { showingConnection=false; NotificationCenter.default.post(name: .whyDeviceChanged,object:nil) } } }
            }
        }
    }
}
extension Notification.Name { static let whyDeviceChanged=Notification.Name("whyDeviceChanged") }
struct WhyWeb: UIViewRepresentable {
    @ObservedObject var device: WhyDevice
    func makeCoordinator() -> Coordinator { Coordinator(device:device) }
    func makeUIView(context:Context) -> WKWebView {
        let config=WKWebViewConfiguration();config.websiteDataStore = .default()
        config.userContentController.addScriptMessageHandler(context.coordinator,contentWorld:.page,name:"whyDevice")
        if let u=Bundle.main.url(forResource:"native-api",withExtension:"js"),let script=try? String(contentsOf:u,encoding:.utf8) {
            config.userContentController.addUserScript(WKUserScript(source:script,injectionTime:.atDocumentStart,forMainFrameOnly:true))
        }
        let web=WKWebView(frame:.zero,configuration:config);context.coordinator.web=web
        web.navigationDelegate=context.coordinator;web.uiDelegate=context.coordinator
        web.scrollView.isScrollEnabled=false;web.scrollView.keyboardDismissMode = .interactive
        web.load(URLRequest(url:URL(string:"http://127.0.0.1:5415/prototype/index.html")!))
        return web
    }
    func updateUIView(_ view:WKWebView,context:Context) {}
    static func dismantleUIView(_ uiView:WKWebView,coordinator:Coordinator) { uiView.configuration.userContentController.removeScriptMessageHandler(forName:"whyDevice",contentWorld:.page) }
    @MainActor final class Coordinator:NSObject,WKScriptMessageHandlerWithReply,WKNavigationDelegate,WKUIDelegate {
        let device:WhyDevice;weak var web:WKWebView?;var observer:NSObjectProtocol?
        init(device:WhyDevice) { self.device=device;super.init();observer=NotificationCenter.default.addObserver(forName:.whyDeviceChanged,object:nil,queue:.main) { [weak self] _ in Task { @MainActor in self?.web?.evaluateJavaScript("window.dispatchEvent(new Event('why-device-connected'))") } } }
        deinit { if let observer { NotificationCenter.default.removeObserver(observer) } }
        private func trusted(_ url:URL?) -> Bool { url?.scheme=="http" && url?.host=="127.0.0.1" && url?.port==5415 }
        func userContentController(_ userContentController:WKUserContentController,didReceive message:WKScriptMessage,replyHandler:@escaping (Any?,String?)->Void) {
            guard message.frameInfo.isMainFrame,trusted(message.frameInfo.request.url),trusted(web?.url),let body=message.body as? [String:Any] else { replyHandler(nil,"frame_forbidden");return }
            if body["kind"] as? String == "api",let path=body["path"] as? String,let method=body["method"] as? String,let text=body["body"] as? String,let csrf=body["csrf"] as? String {
                Task { do { replyHandler(try await device.request(path:path,method:method,body:text,csrf:csrf),nil) } catch { replyHandler(nil,error.localizedDescription) } };return
            }
            if body["kind"] as? String == "export",let text=body["json"] as? String {
                do { try export(text);replyHandler(["exported":true],nil) } catch { replyHandler(nil,"export_failed") };return
            };replyHandler(nil,"native_request_invalid")
        }
        private func export(_ text:String) throws {
            guard text.utf8.count<=1048576,let data=text.data(using:.utf8),let x=try JSONSerialization.jsonObject(with:data) as? [String:Any],
                  ["sug-why-live-export","sug-why-prototype"].contains(x["kind"] as? String ?? ""),var host=web?.window?.rootViewController else { throw NSError(domain:"WHY",code:7) }
            let dir=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString,isDirectory:true)
            try FileManager.default.createDirectory(at:dir,withIntermediateDirectories:true)
            let file=dir.appendingPathComponent("SUG-WHY.json");try data.write(to:file,options:[.withoutOverwriting,.completeFileProtection])
            while let next=host.presentedViewController { host=next }
            host.present(UIDocumentPickerViewController(forExporting:[file],asCopy:true),animated:true)
        }
        func webView(_ webView:WKWebView,decidePolicyFor action:WKNavigationAction,decisionHandler:@escaping (WKNavigationActionPolicy)->Void) {
            if trusted(action.request.url) { decisionHandler(.allow);return }
            if action.navigationType == .linkActivated,let u=action.request.url,u.scheme=="https" { UIApplication.shared.open(u) };decisionHandler(.cancel)
        }
        func webView(_ webView:WKWebView,runJavaScriptConfirmPanelWithMessage message:String,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping (Bool)->Void) {
            guard let host=webView.window?.rootViewController else { completionHandler(false);return }
            let a=UIAlertController(title:"確認",message:message,preferredStyle:.alert)
            a.addAction(UIAlertAction(title:"戻る",style:.cancel){_ in completionHandler(false)});a.addAction(UIAlertAction(title:"実行する",style:.default){_ in completionHandler(true)});host.present(a,animated:true)
        }
        func webView(_ webView:WKWebView,runJavaScriptAlertPanelWithMessage message:String,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping ()->Void) {
            guard let host=webView.window?.rootViewController else { completionHandler();return };let a=UIAlertController(title:"S.u.G WHY",message:message,preferredStyle:.alert);a.addAction(UIAlertAction(title:"OK",style:.default){_ in completionHandler()});host.present(a,animated:true)
        }
    }
}
