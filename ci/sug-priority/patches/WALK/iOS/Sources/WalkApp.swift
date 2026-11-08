import SwiftUI
import WebKit
import os
import Combine
import HealthKit
import UniformTypeIdentifiers

@main struct SuGWALKApp: App { var body: some Scene { WindowGroup { WalkRootView() } } }

@MainActor final class WalkWebStore: ObservableObject {
    let web: WKWebView
    let bridge: WalkNativeBridge
    let export: NativeJSONExport
    @Published var stepsStatus: String?
    private struct StepReceipt: Codable { var schema = 1; var source = "healthkit_native"; var steps: Double; var syncedAt: Date }
    private var pendingSteps: StepReceipt?
    private var sendingSteps = false
    private var stepsDeliveryBlocked = false
    private var stepsReadable = true
    private var stepFile: URL { FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("SUGWalkHealthV1/steps.json") }
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
        if FileManager.default.fileExists(atPath: stepFile.path) {
            do {
                guard (try stepFile.resourceValues(forKeys:[.fileSizeKey]).fileSize ?? Int.max) <= 65536 else { throw CocoaError(.fileReadTooLarge) }
                let value = try JSONDecoder().decode(StepReceipt.self,from:Data(contentsOf:stepFile))
                guard value.schema == 1, value.source == "healthkit_native", value.steps.isFinite, value.steps >= 0, value.steps <= Double(Int.max), value.steps.rounded() == value.steps, value.syncedAt <= Date().addingTimeInterval(300) else { throw CocoaError(.fileReadCorruptFile) }
                if Calendar.current.isDateInToday(value.syncedAt) { pendingSteps = value; stepsStatus = "今日の保存済み歩数 \(Int(value.steps))歩。現在値は再同期で確認します。" }
                else { stepsStatus = "前回の歩数を保持しています。今日の歩数は再同期してください。" }
            } catch { stepsReadable = false; stepsStatus = "保存済み歩数を読めません。元ファイルの上書きを停止しています。" }
        }
    }
    func load() { if web.url == nil { web.load(URLRequest(url: WalkNativeConfiguration.launchURL)) } }
    func shareSteps(_ steps: Double) {
        guard stepsReadable, steps.isFinite, steps >= 0, steps <= Double(Int.max), steps.rounded() == steps else { stepsStatus = "歩数を保存できません。既存ファイルは保持しています。"; return }
        let value = StepReceipt(steps:steps,syncedAt:Date())
        do {
            try FileManager.default.createDirectory(at:stepFile.deletingLastPathComponent(),withIntermediateDirectories:true)
            try JSONEncoder().encode(value).write(to:stepFile,options:[.atomic,.completeFileProtectionUntilFirstUserAuthentication])
            pendingSteps = value; stepsDeliveryBlocked = false; stepsStatus = "\(Int(steps))歩を端末内へ保存。画面への反映を確認しています。"; flushSteps()
        } catch { stepsStatus = "歩数の保存に失敗しました。成功として表示しません。" }
    }
    func flushSteps() {
        guard !sendingSteps, !stepsDeliveryBlocked, UIApplication.shared.applicationState == .active, let value = pendingSteps, bridge.permits(web.url), !web.isLoading else { return }
        guard Calendar.current.isDateInToday(value.syncedAt) else { pendingSteps = nil; stepsStatus = "前回の歩数は保持。今日の歩数は再同期してください。"; return }
        sendingSteps = true
        let payload: [String:Any] = ["steps":value.steps,"syncedAt":ISO8601DateFormatter().string(from:value.syncedAt),"source":value.source]
        web.callAsyncJavaScript("if(window!==window.top||location.origin!=='http://127.0.0.1:5413'||location.pathname!==expectedPath)throw Error('origin_rejected');localStorage.setItem('sug_native_health_v1',JSON.stringify(payload));if(JSON.parse(localStorage.getItem('sug_native_health_v1')).syncedAt!==payload.syncedAt)throw Error('storage_not_confirmed');window.dispatchEvent(new CustomEvent('sug:native-health',{detail:payload}));return true;",arguments:["payload":payload,"expectedPath":WalkNativeConfiguration.launchURL.path],in:nil,in:.page) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }; self.sendingSteps = false
                if case .success(let ok) = result, ok as? Bool == true {
                    if self.pendingSteps?.syncedAt == value.syncedAt { self.pendingSteps = nil }
                    self.stepsStatus = "保存した歩数 \(Int(value.steps))歩を画面へ反映しました。"
                } else if self.pendingSteps?.syncedAt == value.syncedAt { self.stepsDeliveryBlocked = true; self.stepsStatus = "端末内の歩数は保存済み。画面反映に失敗しました。確認後、歩数同期から再試行できます。" }
            }
        }
    }
}
struct WalkWebView: UIViewRepresentable {
    @ObservedObject var store: WalkWebStore
    func makeCoordinator() -> Coordinator { Coordinator() }
    func makeUIView(context: Context) -> WKWebView { store.web.navigationDelegate = context.coordinator; store.web.uiDelegate = context.coordinator; store.load(); return store.web }
    func updateUIView(_ web: WKWebView, context: Context) {}
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        func webView(_ web: WKWebView, didFinish navigation: WKNavigation!) { Logger(subsystem:Bundle.main.bundleIdentifier ?? "jp.sugosaka.walk",category:"startup").notice("sug_startup stage=webview_ready") }

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
    @StateObject private var server = BundleHTTPServer(folder:"Web",port:5413,entry:"walk-quest.html")
    @StateObject private var store = WalkWebStore()
    @StateObject private var recorder = WalkSessionRecorder()
    @State private var showRecorder = false
    @State private var showHistory = false
    @State private var healthStatus = "歩数は未取得"
    var body: some View {
        VStack(spacing:0) {
            if server.ready {
                HStack { Button("歩行を記録") { showRecorder = true }; Button("保存履歴") { showHistory = true }; Spacer(); Button("歩数を同期") { requestSteps() } }.padding(12)
                Text(store.stepsStatus ?? healthStatus).font(.caption).frame(maxWidth:.infinity,alignment:.leading).padding(.horizontal,12)
                WalkWebView(store:store)
            } else { Text(server.error ?? "S.u.G WALKを起動しています…").padding() }
        }.task { server.start() }
        .onReceive(Timer.publish(every:1,on:.main,in:.common).autoconnect()) { _ in store.bridge.push(recorder,into:store.web); store.flushSteps() }
        .sheet(isPresented:$showRecorder) { VStack { Toggle("経路を端末内へ保存",isOn:$recorder.recordRoute).padding().onChange(of:recorder.recordRoute) { _,_ in recorder.persistRoutePreference() }; Text("オフ以降は経路点を追加しません。既に保存した点は保持します。").font(.caption); WalkRecorderPanel(recorder:recorder,start:{ if store.bridge.ready && !store.web.isLoading { recorder.startFromUserAction() } else { recorder.reportConnectionIssue() } }); Button("閉じる") { showRecorder=false } }.presentationDetents([.medium,.large]) }
        .sheet(isPresented:$showHistory) { NativeWalkHistoryView(recorder:recorder) }
    }
    private func requestSteps() {
        store.stepsStatus = nil
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
    @State private var exporting = false
    @State private var importing = false
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
            do { let url=try result.get();let access=url.startAccessingSecurityScopedResource();defer {if access {url.stopAccessingSecurityScopedResource()}};guard (try url.resourceValues(forKeys:[.fileSizeKey]).fileSize ?? Int.max) <= 20*1024*1024 else { throw CocoaError(.fileReadTooLarge) };try recorder.importHistory(Data(contentsOf:url));reload();status="履歴を復元しました。既存ファイルは上書きしていません。" } catch { status="復元できません："+error.localizedDescription }
        } }
    }
    private func reload() { do { rows=try recorder.savedHistory() } catch { status="履歴を読めません："+error.localizedDescription } }
}
