import SwiftUI
import WebKit
import Combine
import HealthKit
import UniformTypeIdentifiers

@main struct SuGWALKApp: App { var body: some Scene { WindowGroup { WalkRootView() } } }

@MainActor final class WalkWebStore: ObservableObject {
    let web: WKWebView
    let bridge: WalkNativeBridge
    let export: NativeJSONExport
    init() {
        bridge = WalkNativeBridge(target: WalkNativeConfiguration.launchURL)
        let config = WKWebViewConfiguration(); config.websiteDataStore = .default(); bridge.install(on: config)
        export = NativeJSONExport(origin: "http://127.0.0.1:5413", expectedFormat: "sug-walk-backup-v1")
        config.userContentController.add(export, name: "sugJSON")
        if let url = Bundle.main.url(forResource: "native-json-export", withExtension: "js"), let script = try? String(contentsOf: url) {
            config.userContentController.addUserScript(WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        web = WKWebView(frame: .zero, configuration: config); export.webView = web
        web.scrollView.keyboardDismissMode = .interactive
    }
    func load() { if web.url == nil { web.load(URLRequest(url: WalkNativeConfiguration.launchURL)) } }
    func shareSteps(_ steps: Double) {
        let payload: [String: Any] = ["steps": steps, "syncedAt": ISO8601DateFormatter().string(from: Date()), "source":"healthkit_native"]
        web.callAsyncJavaScript("localStorage.setItem('sug_native_health_v1',JSON.stringify(payload));window.dispatchEvent(new CustomEvent('sug:native-health'));", arguments: ["payload":payload], in: nil, contentWorld: .page) { _ in }
    }
}
struct WalkWebView: UIViewRepresentable {
    @ObservedObject var store: WalkWebStore
    func makeCoordinator() -> Coordinator { Coordinator() }
    func makeUIView(context: Context) -> WKWebView { store.web.navigationDelegate = context.coordinator; store.web.uiDelegate = context.coordinator; store.load(); return store.web }
    func updateUIView(_ web: WKWebView, context: Context) {}
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {

        func webView(_ web: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            guard var host = web.window?.rootViewController else { completionHandler(); return }
            while let next = host.presentedViewController { host = next }
            let alert = UIAlertController(title: "S.u.G", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() }); host.present(alert, animated: true)
        }
        func webView(_ web: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            guard var host = web.window?.rootViewController else { completionHandler(false); return }
            while let next = host.presentedViewController { host = next }
            let alert = UIAlertController(title: "確認", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "キャンセル", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "確認して実行", style: .default) { _ in completionHandler(true) }); host.present(alert, animated: true)
        }

        func webView(_ web: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            if url.scheme == "http", url.host == "127.0.0.1", url.port == 5413 { decisionHandler(.allow); return }
            if action.navigationType == .linkActivated, url.scheme == "sug-body" {
                UIApplication.shared.open(url, options: [:]) { opened in
                    if !opened { DispatchQueue.main.async { web.evaluateJavaScript("alert('BODYアプリを開けません。端末への導入状態を確認してください。')") } }
                }; decisionHandler(.cancel); return
            }
            if action.navigationType == .linkActivated, ["https", "tel"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }; decisionHandler(.cancel)
        }
    }
}
struct WalkRootView: View {
    @StateObject private var server = BundleHTTPServer(folder:"Web",port:5413)
    @StateObject private var store = WalkWebStore()
    @StateObject private var recorder = WalkSessionRecorder()
    @State private var showRecorder = false
    @State private var showHistory = false
    @State private var healthStatus = "歩数は未取得"
    var body: some View {
        VStack(spacing:0) {
            if server.ready {
                HStack { Button("歩行を記録") { showRecorder = true }; Button("保存履歴") { showHistory = true }; Spacer(); Button("歩数を同期") { requestSteps() } }.padding(12)
                Text(healthStatus).font(.caption).frame(maxWidth:.infinity,alignment:.leading).padding(.horizontal,12)
                WalkWebView(store:store)
            } else { Text(server.error ?? "S.u.G WALKを起動しています…").padding() }
        }.task { server.start() }
        .onReceive(Timer.publish(every:1,on:.main,in:.common).autoconnect()) { _ in store.bridge.push(recorder,into:store.web) }
        .sheet(isPresented:$showRecorder) { VStack { Toggle("経路を端末内へ保存",isOn:$recorder.recordRoute).padding(); WalkRecorderPanel(recorder:recorder,start:{ if store.bridge.ready && !store.web.isLoading { recorder.startFromUserAction() } else { recorder.reportConnectionIssue() } }); Button("閉じる") { showRecorder=false } }.presentationDetents([.medium,.large]) }
        .sheet(isPresented:$showHistory) { NativeWalkHistoryView(recorder:recorder) }
    }
    private func requestSteps() {
        guard HKHealthStore.isHealthDataAvailable(), let stepsType = HKObjectType.quantityType(forIdentifier:.stepCount) else { healthStatus="この端末では歩数を取得できません"; return }
        let health=HKHealthStore(); healthStatus="許可と歩数を確認しています…"
        health.requestAuthorization(toShare:[],read:[stepsType]) { ok,error in
            guard ok,error == nil else { DispatchQueue.main.async { healthStatus="歩数へのアクセスを確認できませんでした" }; return }
            let start=Calendar.current.startOfDay(for:Date()),predicate=HKQuery.predicateForSamples(withStart:start,end:Date(),options:.strictStartDate)
            let query=HKStatisticsQuery(quantityType:stepsType,quantitySamplePredicate:predicate,options:.cumulativeSum) { _,stats,error in
                DispatchQueue.main.async {
                    guard error == nil, let n=stats?.sumQuantity()?.doubleValue(for:.count()), n.isFinite,n>=0 else { healthStatus="歩数は未取得。データなし・読取拒否は区別できません"; return }
                    healthStatus="今日の歩数 \(Int(n))歩（HealthKit）"; store.shareSteps(n)
                }
            }; health.execute(query)
        }
    }
}
struct WalkBackupDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var data: Data
    init(data:Data) { self.data=data }
    init(configuration:ReadConfiguration) throws { data=configuration.file.regularFileContents ?? Data() }
    func fileWrapper(configuration:WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents:data) }
}
struct NativeWalkHistoryView: View {
    @ObservedObject var recorder: WalkSessionRecorder
    @Environment(\.dismiss) private var dismiss
    @State private var rows: [WalkSessionRecorder.Summary] = []
    @State private var status = "保存済みのネイティブGPS履歴です。Web記録とは合算しません。"
    @State private var exporting=false,importing=false
    @State private var document: WalkBackupDocument?
    var body: some View {
        NavigationStack { List {
            Text(status)
            ForEach(rows,id:\.id) { row in VStack(alignment:.leading) { Text(row.updatedAt.formatted()); Text("\(Int(row.meters))m / \(Int(row.seconds))秒・GPS推定"); Text("有効測位 \(row.acceptedFixes)回 / 保存経路 \(row.route?.count ?? 0)点").font(.caption); if row.importedAt != nil { Text("ファイル取込・GPS実測の確認なし").font(.caption) } } }
            Button("保存済み履歴を書き出す") { do { document=WalkBackupDocument(data:try recorder.exportHistory());exporting=true } catch { status=error.localizedDescription } }
            Button("履歴JSONを選んで復元") { importing=true }
        }.navigationTitle("歩行の保存履歴").toolbar { Button("閉じる") { dismiss() } }.onAppear { reload() }
        .fileExporter(isPresented:$exporting,document:document,contentType:.json,defaultFilename:"SUG-WALK-native-history") { result in if case .failure(let e)=result { status=e.localizedDescription } }
        .fileImporter(isPresented:$importing,allowedContentTypes:[.json]) { result in
            do { let url=try result.get();let access=url.startAccessingSecurityScopedResource();defer {if access {url.stopAccessingSecurityScopedResource()}};try recorder.importHistory(Data(contentsOf:url));reload();status="履歴を復元しました。既存ファイルは上書きしていません。" } catch { status="復元できません："+error.localizedDescription }
        } }
    }
    private func reload() { do { rows=try recorder.savedHistory() } catch { status="履歴を読めません："+error.localizedDescription } }
}
