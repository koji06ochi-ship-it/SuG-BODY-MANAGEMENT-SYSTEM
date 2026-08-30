import SwiftUI
import WebKit

@MainActor
final class MemberWebViewStore: ObservableObject {
    let webView: WKWebView
    private let initialURL: URL
    private var didLoad = false
    private var pendingHealthJSON: String?

    init(url: URL) {
        self.initialURL = url
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        config.defaultWebpagePreferences = preferences
        let view = WKWebView(frame: .zero, configuration: config)
        view.isOpaque = false
        view.backgroundColor = .black
        view.scrollView.backgroundColor = .black
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.scrollView.keyboardDismissMode = .interactive
        view.allowsBackForwardNavigationGestures = true
        view.customUserAgent = "S.u.G Member iOS/1.0"
        self.webView = view
    }

    func loadIfNeeded() { guard !didLoad else { return }; didLoad = true; var request = URLRequest(url: initialURL); request.cachePolicy = .reloadIgnoringLocalCacheData; webView.load(request) }
    func reload() { webView.reload() }

    private var isBodyPage: Bool { guard let path = webView.url?.path else { return false }; return path.contains("/apps/body/") || path.contains("member-home-v2.html") }
    private var isWalkPage: Bool { webView.url?.path.contains("walk-quest.html") == true }

    func installBodyRuntimeIfNeeded() {
        guard isBodyPage else { return }
        let js = """
        (function(){
          const isStandalone = location.pathname.indexOf('/apps/body/') !== -1;
          if (!isStandalone) {
            const scripts = [['sugIdealV27Script','assets/member/v27/ideal-v27.js?v=27.33'],['sugHealthV2Script','assets/member/v2/health-v2.js?v=27.33']];
            for (const pair of scripts) { if (document.getElementById(pair[0])) continue; const s=document.createElement('script'); s.id=pair[0]; s.src=pair[1]; document.body.appendChild(s); }
          }
          const p=window.__SUG_NATIVE_HEALTH__;
          if(p){ if(window.SuGBody?.receiveNative)window.SuGBody.receiveNative(p); if(window.SuGHealthV2?.receiveNative)window.SuGHealthV2.receiveNative(p); if(window.SuGV27?.receiveNative)window.SuGV27.receiveNative(p); }
        })();
        """
        webView.evaluateJavaScript(js)
    }

    func installWalkRuntimeIfNeeded() {
        guard isWalkPage else { return }
        let js = """
        (function(){
          if (window.__SUG_WALK_NATIVE_V2733__) return;
          window.__SUG_WALK_NATIVE_V2733__ = true;
          const day=()=>new Date().toISOString().slice(0,10);
          function apply(p){
            if(!p||typeof p!=='object')return;
            try{
              let s={}; try{s=JSON.parse(localStorage.getItem('sug_walk_quest_v1')||'{}')}catch(_){}
              if(s.date!==day()) s={date:day(),steps:0,points:0,checkins:[],route:[],event:false,supporters:0};
              if(Number.isFinite(Number(p.steps))) s.steps=Math.max(Number(s.steps||0),Number(p.steps));
              if(Number.isFinite(Number(p.distanceKm))) s.distanceKm=Math.max(0,Number(p.distanceKm));
              if(Number.isFinite(Number(p.heartRate))) s.heartRate=Number(p.heartRate);
              if(Number.isFinite(Number(p.restingHeartRate))) s.restingHeartRate=Number(p.restingHeartRate);
              s.healthSyncedAt=p.syncedAt||new Date().toISOString();
              localStorage.setItem('sug_walk_quest_v1',JSON.stringify(s));
            }catch(_){}
            const steps=document.getElementById('steps'); if(steps&&Number.isFinite(Number(p.steps)))steps.textContent=Math.round(Number(p.steps)).toLocaleString();
            let box=document.getElementById('nativeWalkHealth');
            if(!box){
              const stats=document.querySelector('.stats');
              if(stats){box=document.createElement('div');box.id='nativeWalkHealth';box.style.cssText='grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:2px';stats.appendChild(box);}
            }
            if(box){
              const dist=Number.isFinite(Number(p.distanceKm))?Number(p.distanceKm).toFixed(2)+' km':'--';
              const hr=Number.isFinite(Number(p.heartRate))?Math.round(Number(p.heartRate))+' bpm':'--';
              const rhr=Number.isFinite(Number(p.restingHeartRate))?Math.round(Number(p.restingHeartRate))+' bpm':'--';
              box.innerHTML=`<div class="stat"><span>DISTANCE</span><b>${dist}</b></div><div class="stat"><span>HEART</span><b>${hr}</b></div><div class="stat"><span>RESTING HR</span><b>${rhr}</b></div>`;
            }
          }
          window.addEventListener('sug:native-health',e=>apply(e.detail));
          try{apply(window.__SUG_NATIVE_HEALTH__||JSON.parse(localStorage.getItem('sug_native_health_v1')||'null'))}catch(_){}
        })();
        """
        webView.evaluateJavaScript(js)
    }

    func pushNativeHealth(steps: Int, distanceKm: Double, sleepHours: Double?, heartRate: Double?, restingHeartRate: Double?, weightKg: Double?, syncedAt: Date?) {
        let iso = ISO8601DateFormatter().string(from: syncedAt ?? Date())
        var payload: [String: Any] = ["source":"healthkit_native","steps":max(0,steps),"distanceKm":max(0,distanceKm),"syncedAt":iso]
        if let sleepHours { payload["sleep"] = sleepHours }
        if let heartRate { payload["heartRate"] = heartRate; payload["latestHeartRate"] = heartRate }
        if let restingHeartRate { payload["restingHeartRate"] = restingHeartRate }
        if let weightKg { payload["weight"] = weightKg; payload["weightKg"] = weightKg }
        guard JSONSerialization.isValidJSONObject(payload), let data=try? JSONSerialization.data(withJSONObject:payload), let json=String(data:data,encoding:.utf8) else { return }
        pendingHealthJSON=json; deliverPendingHealth()
    }

    func deliverPendingHealth() {
        guard let json=pendingHealthJSON else { return }
        let js="""
        (function(){
          const payload=\(json); window.__SUG_NATIVE_HEALTH__=payload;
          try{localStorage.setItem('sug_native_health_v1',JSON.stringify(payload));}catch(_){}
          window.dispatchEvent(new CustomEvent('sug:native-health',{detail:payload}));
          if(window.SuGBody?.receiveNative)window.SuGBody.receiveNative(payload);
          if(window.SuGHealthV2?.receiveNative)window.SuGHealthV2.receiveNative(payload);
          if(window.SuGV27?.receiveNative)window.SuGV27.receiveNative(payload);
        })();
        """
        webView.evaluateJavaScript(js){[weak self] _,error in if error==nil{self?.pendingHealthJSON=nil}}
    }
}

struct MemberWebView: UIViewRepresentable {
    @ObservedObject var store: MemberWebViewStore
    func makeUIView(context: Context) -> WKWebView { store.webView.navigationDelegate=context.coordinator; store.loadIfNeeded(); return store.webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(store:store) }
    final class Coordinator:NSObject,WKNavigationDelegate {
        weak var store:MemberWebViewStore?; init(store:MemberWebViewStore){self.store=store}
        func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){Task{@MainActor in self.store?.installBodyRuntimeIfNeeded(); self.store?.installWalkRuntimeIfNeeded(); self.store?.deliverPendingHealth()}}
        func webView(_ webView:WKWebView,decidePolicyFor navigationAction:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void){guard let url=navigationAction.request.url else{decisionHandler(.allow);return};let allowedHosts=["koji06ochi-ship-it.github.io","supabase.co"];if let host=url.host,!allowedHosts.contains(where:{host==$0||host.hasSuffix("."+$0)}),navigationAction.navigationType == .linkActivated{UIApplication.shared.open(url);decisionHandler(.cancel);return};decisionHandler(.allow)}
    }
}
