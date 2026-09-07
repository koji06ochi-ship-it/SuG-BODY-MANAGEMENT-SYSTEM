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
    private var isQuestPage: Bool { guard let path = webView.url?.path else { return false }; return path.contains("shrine-quest") || path.contains("quest-live") || path.contains("quest-transport-map") }
    private var isWalkPage: Bool { webView.url?.path.contains("walk-quest.html") == true }

    func installBodyRuntimeIfNeeded() {
        guard isBodyPage else { return }
        let js = """
        (function(){
          const isStandalone = location.pathname.indexOf('/apps/body/') !== -1;
          if (!isStandalone) {
            const scripts = [['sugIdealV27Script','assets/member/v27/ideal-v27.js?v=27.43'],['sugHealthV2Script','assets/member/v2/health-v2.js?v=27.43']];
            for (const pair of scripts) { if (document.getElementById(pair[0])) continue; const s=document.createElement('script'); s.id=pair[0]; s.src=pair[1]; document.body.appendChild(s); }
          }
          if (!document.getElementById('sugBeautyBodyV2774')) {
            const s=document.createElement('script');
            s.id='sugBeautyBodyV2774';
            s.src=isStandalone?'./beauty-body-engine-v27.74.js?v=27.81':'apps/body/beauty-body-engine-v27.74.js?v=27.81';
            document.body.appendChild(s);
          }
          if (!document.getElementById('sugRecoveryBodyContextV2777')) {
            const s=document.createElement('script');
            s.id='sugRecoveryBodyContextV2777';
            s.src=isStandalone?'./recovery-body-context-v27.77.js?v=27.81':'apps/body/recovery-body-context-v27.77.js?v=27.81';
            document.body.appendChild(s);
          }
          if (!document.getElementById('sugNutritionRecoveryV2778')) {
            const s=document.createElement('script');
            s.id='sugNutritionRecoveryV2778';
            s.src=isStandalone?'./nutrition-recovery-engine-v27.78.js?v=27.81':'apps/body/nutrition-recovery-engine-v27.78.js?v=27.81';
            document.body.appendChild(s);
          }
          if (!document.getElementById('sugFoodPhotoV2779')) {
            const s=document.createElement('script');
            s.id='sugFoodPhotoV2779';
            s.src=isStandalone?'./food-photo-intake-v27.79.js?v=27.81':'apps/body/food-photo-intake-v27.79.js?v=27.81';
            document.body.appendChild(s);
          }
          if (!document.getElementById('sugNextMealV2780')) {
            const s=document.createElement('script');
            s.id='sugNextMealV2780';
            s.src=isStandalone?'./next-meal-guidance-v27.80.js?v=27.81':'apps/body/next-meal-guidance-v27.80.js?v=27.81';
            document.body.appendChild(s);
          }
          if (!document.getElementById('sugMealTimingV2781')) {
            const s=document.createElement('script');
            s.id='sugMealTimingV2781';
            s.src=isStandalone?'./meal-timing-v27.81.js?v=27.81':'apps/body/meal-timing-v27.81.js?v=27.81';
            document.body.appendChild(s);
          }
          const p=window.__SUG_NATIVE_HEALTH__;
          if(p){
            if(window.SuGBody?.receiveNative)window.SuGBody.receiveNative(p);
            if(window.SuGHealthV2?.receiveNative)window.SuGHealthV2.receiveNative(p);
            if(window.SuGV27?.receiveNative)window.SuGV27.receiveNative(p);
            if(window.SuGBeautyBody?.receiveHealth)window.SuGBeautyBody.receiveHealth(p);
            if(window.SuGBodyContext?.receiveHealth)window.SuGBodyContext.receiveHealth(p);
            if(window.SuGNutrition?.receiveHealth)window.SuGNutrition.receiveHealth(p);
            if(window.SuGNextMeal?.render)window.SuGNextMeal.render();
            if(window.SuGMealTiming?.render)window.SuGMealTiming.render();
          }
        })();
        """
        webView.evaluateJavaScript(js)
    }

    func installQuestRuntimeIfNeeded() {
        guard isQuestPage else { return }
        let js = """
        (function(){
          if (window.__SUG_GENERAL_READINESS_V1__) {
            if (window.SuGGeneral?.render) window.SuGGeneral.render();
            return;
          }
          window.__SUG_GENERAL_READINESS_V1__ = true;

          const GENERAL_KEY='sug_my_general_v1';
          const RECOVERY_KEY='sug_recovery_actions_v1';
          let health=null;

          function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch(_){return fallback}}
          function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
          function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
          function general(){return readJSON(GENERAL_KEY,{id:'kusunoki_masanari',name:'楠木正成',crest:'菊水'})}
          function setGeneral(value){if(!value||!value.name)return;writeJSON(GENERAL_KEY,{id:value.id||value.name,name:value.name,crest:value.crest||''});render()}

          function decision(p){
            const recovery=num(p?.recoveryScore),stress=num(p?.stressScore),sleep=num(p?.sleepHours??p?.sleep);
            if(recovery===null && stress===null && sleep===null)return{mode:'unknown',label:'BODY CHECK',sub:'ヘルスケア同期後に出陣判定',score:null};
            if((recovery!==null&&recovery<40)||(stress!==null&&stress>=70)||(sleep!==null&&sleep<5.5))return{mode:'rest',label:'休養',sub:'今日は戦わない。回復も強くなるための行動。',score:recovery};
            if((recovery!==null&&recovery<60)||(stress!==null&&stress>=50)||(sleep!==null&&sleep<6.5))return{mode:'light',label:'軽め',sub:'短時間QUESTかRECOVERY QUESTを優先。',score:recovery};
            return{mode:'ready',label:'出陣可能',sub:'通常QUESTへ。無理はせず今日の状態で進む。',score:recovery};
          }

          function actions(){return readJSON(RECOVERY_KEY,[])}
          function logRecovery(type,label){
            const p=health||window.__SUG_NATIVE_HEALTH__||{};
            const list=actions();
            list.unshift({id:Date.now(),type,label,at:new Date().toISOString(),before:{recoveryScore:num(p.recoveryScore),stressScore:num(p.stressScore),hrv:num(p.hrvMs??p.hrv),restingHeartRate:num(p.restingHeartRate),sleepHours:num(p.sleepHours??p.sleep)},after:null});
            writeJSON(RECOVERY_KEY,list.slice(0,30));
            render();
          }

          function updateLatestAfter(p){
            const list=actions(); if(!list.length||!p)return;
            const first=list[0];
            const sync=new Date(p.syncedAt||Date.now()).getTime();
            const actionAt=new Date(first.at).getTime();
            if(!Number.isFinite(sync)||!Number.isFinite(actionAt)||sync<=actionAt)return;
            first.after={at:p.syncedAt||new Date().toISOString(),recoveryScore:num(p.recoveryScore),stressScore:num(p.stressScore),hrv:num(p.hrvMs??p.hrv),restingHeartRate:num(p.restingHeartRate),sleepHours:num(p.sleepHours??p.sleep)};
            writeJSON(RECOVERY_KEY,list);
          }

          function fmt(v,digits=0){const n=num(v);return n===null?'--':n.toFixed(digits)}
          function delta(a,b){const x=num(a),y=num(b);if(x===null||y===null)return null;const d=y-x;return (d>0?'+':'')+d.toFixed(0)}
          function comparison(){
            const item=actions()[0]; if(!item)return '回復行動を記録すると、その後の身体データ変化を見られます。';
            if(!item.after)return `${item.label}を記録済｜次回のHealth同期で変化を確認`;
            const r=delta(item.before?.recoveryScore,item.after?.recoveryScore),s=delta(item.before?.stressScore,item.after?.stressScore),h=delta(item.before?.hrv,item.after?.hrv);
            const parts=[]; if(r!==null)parts.push(`回復 ${r}`); if(s!==null)parts.push(`ストレス ${s}`); if(h!==null)parts.push(`HRV ${h}ms`);
            return `${item.label}後の観測変化｜${parts.length?parts.join(' / '):'比較できるデータ待ち'} ※因果ではなく本人内の変化記録`;
          }

          function ensureStyle(){
            if(document.getElementById('sugGeneralReadinessStyle'))return;
            const s=document.createElement('style');s.id='sugGeneralReadinessStyle';s.textContent=`
            #sugGeneralPanel{margin:12px 0;border:1px solid #765c2a;border-radius:20px;padding:14px;background:linear-gradient(145deg,#21180c,#111217 58%,#09090b);box-shadow:0 12px 30px #0008;color:#f7f7f8}
            #sugGeneralPanel .sg-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.sg-kicker{font-size:8px;letter-spacing:.16em;font-weight:900;color:#f3dc95}.sg-name{font-size:21px;font-weight:1000;margin-top:3px}.sg-crest{font-size:9px;color:#b8bac1;margin-top:2px}.sg-state{text-align:right}.sg-state b{display:block;font-size:16px}.sg-state small{font-size:8px;color:#a7a9b0}.sg-ready .sg-state b{color:#79dfa5}.sg-light .sg-state b{color:#f3dc95}.sg-rest .sg-state b{color:#ff9b8f}.sg-unknown .sg-state b{color:#a9b2c4}
            .sg-message{margin-top:10px;padding:10px;border-radius:12px;background:#0b0c0f;border:1px solid #2d2f35;font-size:9px;line-height:1.65;color:#c6c8ce}.sg-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:9px}.sg-metric{padding:8px 5px;border-radius:10px;background:#0b0c0f;border:1px solid #292b31;text-align:center}.sg-metric span{display:block;font-size:6px;color:#858892}.sg-metric b{display:block;margin-top:3px;font-size:10px}.sg-recovery-title{margin-top:12px;font-size:8px;font-weight:1000;letter-spacing:.12em;color:#f3dc95}.sg-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:7px}.sg-action{border:1px solid #544525;border-radius:11px;padding:9px 7px;background:#111217;color:#f4f4f5;font-size:9px;font-weight:800}.sg-action:active{transform:scale(.98)}.sg-compare{margin-top:8px;font-size:8px;line-height:1.55;color:#9fa2aa}.sg-note{margin-top:7px;font-size:7px;color:#6f727a}
            `;document.head.appendChild(s);
          }

          function host(){return document.getElementById('walkPanel')||document.querySelector('.hero')||document.querySelector('main')||document.body}
          function ensurePanel(){
            let panel=document.getElementById('sugGeneralPanel'); if(panel)return panel;
            panel=document.createElement('section');panel.id='sugGeneralPanel';
            const h=host(); if(h&&h.parentNode)h.parentNode.insertBefore(panel,h); else document.body.prepend(panel);
            return panel;
          }

          function render(){
            ensureStyle(); const panel=ensurePanel(); const g=general(); const p=health||window.__SUG_NATIVE_HEALTH__||readJSON('sug_native_health_v1',null)||{}; const d=decision(p);
            panel.className='sg-'+d.mode;
            const recovery=num(p.recoveryScore),stress=num(p.stressScore),sleep=num(p.sleepHours??p.sleep),hrv=num(p.hrvMs??p.hrv),rhr=num(p.restingHeartRate);
            panel.innerHTML=`
              <div class="sg-top"><div><div class="sg-kicker">MY GENERAL × BODY</div><div class="sg-name">${g.name}</div><div class="sg-crest">家紋 ${g.crest||'未設定'}｜自分の身体状態＝将軍の状態</div></div><div class="sg-state"><b>${d.label}</b><small>${recovery===null?'--':Math.round(recovery)+' / 100'}</small></div></div>
              <div class="sg-message">${d.sub}</div>
              <div class="sg-metrics"><div class="sg-metric"><span>SLEEP</span><b>${sleep===null?'--':fmt(sleep,1)+'h'}</b></div><div class="sg-metric"><span>HRV</span><b>${hrv===null?'--':fmt(hrv,0)+'ms'}</b></div><div class="sg-metric"><span>REST HR</span><b>${rhr===null?'--':fmt(rhr,0)}</b></div><div class="sg-metric"><span>STRESS</span><b>${stress===null?'--':fmt(stress,0)}</b></div></div>
              <div class="sg-recovery-title">RECOVERY QUEST</div>
              <div class="sg-actions"><button class="sg-action" data-rec="bath">♨ 温泉・入浴</button><button class="sg-action" data-rec="nutrition">食 栄養補給</button><button class="sg-action" data-rec="stretch">伸 ストレッチ</button><button class="sg-action" data-rec="walk">歩 軽い散歩</button></div>
              <div class="sg-compare">${comparison()}</div>
              <div class="sg-note">回復行動と数値変化を個人内で記録。特定の行動が回復を起こしたと断定する表示はしません。</div>`;
            panel.querySelectorAll('[data-rec]').forEach(btn=>btn.onclick=()=>{const m={bath:'温泉・入浴',nutrition:'栄養補給',stretch:'ストレッチ',walk:'軽い散歩'};logRecovery(btn.dataset.rec,m[btn.dataset.rec]||btn.dataset.rec)});
          }

          function apply(p){if(!p||typeof p!=='object')return;health=p;updateLatestAfter(p);render()}
          window.SuGGeneral={render,setGeneral,getState:()=>({general:general(),decision:decision(health||window.__SUG_NATIVE_HEALTH__||{}),recoveryActions:actions()})};
          window.addEventListener('sug:native-health',e=>apply(e.detail));
          try{apply(window.__SUG_NATIVE_HEALTH__||readJSON('sug_native_health_v1',null)||{})}catch(_){render()}
          setTimeout(render,350);
        })();
        """
        webView.evaluateJavaScript(js)
    }

    func installWalkRuntimeIfNeeded() {
        guard isWalkPage else { return }
        let js = """
        (function(){
          if (window.__SUG_WALK_NATIVE_V2743__) return;
          window.__SUG_WALK_NATIVE_V2743__ = true;
          const day=()=>new Date().toISOString().slice(0,10);
          function apply(p){
            if(!p||typeof p!=='object')return;
            try{
              let s={}; try{s=JSON.parse(localStorage.getItem('sug_walk_quest_v1')||'{}')}catch(_){}
              if(s.date!==day()) s={date:day(),steps:0,points:0,checkins:[],route:[],event:false,supporters:0};
              if(Number.isFinite(Number(p.steps))) s.steps=Math.max(Number(s.steps||0),Number(p.steps));
              if(Number.isFinite(Number(p.distanceKm))) s.distanceKm=Math.max(0,Number(p.distanceKm));
              if(Number.isFinite(Number(p.activeEnergyKcal))) s.activeEnergyKcal=Math.max(0,Number(p.activeEnergyKcal));
              if(Number.isFinite(Number(p.exerciseMinutes))) s.exerciseMinutes=Math.max(0,Number(p.exerciseMinutes));
              if(Number.isFinite(Number(p.heartRate))) s.heartRate=Number(p.heartRate);
              if(Number.isFinite(Number(p.restingHeartRate))) s.restingHeartRate=Number(p.restingHeartRate);
              if(Number.isFinite(Number(p.hrv))) s.hrv=Number(p.hrv);
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
              const kcal=Number.isFinite(Number(p.activeEnergyKcal))?Math.round(Number(p.activeEnergyKcal))+' kcal':'--';
              const ex=Number.isFinite(Number(p.exerciseMinutes))?Math.round(Number(p.exerciseMinutes))+' min':'--';
              box.innerHTML=`<div class="stat"><span>DISTANCE</span><b>${dist}</b></div><div class="stat"><span>ACTIVE</span><b>${kcal}</b></div><div class="stat"><span>EXERCISE</span><b>${ex}</b></div>`;
            }
          }
          window.addEventListener('sug:native-health',e=>apply(e.detail));
          try{apply(window.__SUG_NATIVE_HEALTH__||JSON.parse(localStorage.getItem('sug_native_health_v1')||'null'))}catch(_){}
        })();
        """
        webView.evaluateJavaScript(js)
    }

    func pushNativeHealth(
        steps: Int,
        distanceKm: Double,
        activeEnergyKcal: Double,
        exerciseMinutes: Double,
        sleepHours: Double?,
        heartRate: Double?,
        restingHeartRate: Double?,
        hrvMs: Double?,
        weightKg: Double?,
        bodyFatPercentage: Double?,
        leanBodyMassKg: Double?,
        vo2Max: Double?,
        respiratoryRate: Double?,
        oxygenSaturationPercent: Double?,
        recoveryScore: Int?,
        stressScore: Int?,
        recoveryStatus: String?,
        stressStatus: String?,
        recoveryConfidence: Double,
        workouts: [HealthWorkoutSummary],
        labResults: [HealthLabResultSummary],
        syncedAt: Date?
    ) {
        let iso = ISO8601DateFormatter().string(from: syncedAt ?? Date())
        var payload: [String: Any] = [
            "source":"healthkit_native",
            "steps":max(0,steps),
            "distanceKm":max(0,distanceKm),
            "activeEnergyKcal":max(0,activeEnergyKcal),
            "exerciseMinutes":max(0,exerciseMinutes),
            "recoveryModel":"sug_recovery_v1",
            "stressMetricType":"physiological_load_estimate",
            "recoveryConfidence":min(1,max(0,recoveryConfidence)),
            "syncedAt":iso
        ]
        if let sleepHours { payload["sleep"] = sleepHours; payload["sleepHours"] = sleepHours }
        if let heartRate { payload["heartRate"] = heartRate; payload["latestHeartRate"] = heartRate }
        if let restingHeartRate { payload["restingHeartRate"] = restingHeartRate }
        if let hrvMs { payload["hrv"] = hrvMs; payload["hrvMs"] = hrvMs }
        if let weightKg { payload["weight"] = weightKg; payload["weightKg"] = weightKg }
        if let bodyFatPercentage { payload["bodyFatPercentage"] = bodyFatPercentage; payload["bodyFat"] = bodyFatPercentage }
        if let leanBodyMassKg { payload["leanBodyMassKg"] = leanBodyMassKg }
        if let vo2Max { payload["vo2Max"] = vo2Max }
        if let respiratoryRate { payload["respiratoryRate"] = respiratoryRate }
        if let oxygenSaturationPercent { payload["oxygenSaturationPercent"] = oxygenSaturationPercent; payload["spo2"] = oxygenSaturationPercent }
        if let recoveryScore { payload["recoveryScore"] = recoveryScore }
        if let stressScore { payload["stressScore"] = stressScore }
        if let recoveryStatus { payload["recoveryStatus"] = recoveryStatus }
        if let stressStatus { payload["stressStatus"] = stressStatus }

        let workoutPayload: [[String: Any]] = workouts.map { workout in
            var item: [String: Any] = [
                "activityType": Int(workout.activityTypeRaw),
                "activityName": workout.activityName,
                "startDate": workout.startDateISO,
                "endDate": workout.endDateISO,
                "durationMinutes": workout.durationMinutes
            ]
            if let activeEnergyKcal = workout.activeEnergyKcal { item["activeEnergyKcal"] = activeEnergyKcal }
            if let distanceKm = workout.distanceKm { item["distanceKm"] = distanceKm }
            return item
        }
        payload["workouts"] = workoutPayload
        payload["recentWorkouts"] = workoutPayload

        let labPayload: [[String: Any]] = labResults.map { lab in
            var item: [String: Any] = ["name":lab.name,"sourceName":lab.sourceName]
            if let value = lab.value { item["value"] = value }
            if let unit = lab.unit { item["unit"] = unit }
            if let referenceRange = lab.referenceRange { item["referenceRange"] = referenceRange }
            if let interpretation = lab.interpretation { item["interpretation"] = interpretation }
            if let effectiveDateISO = lab.effectiveDateISO { item["effectiveDate"] = effectiveDateISO }
            return item
        }
        payload["labResults"] = labPayload
        payload["recentLabResults"] = labPayload

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
          if(window.SuGBeautyBody?.receiveHealth)window.SuGBeautyBody.receiveHealth(payload);
          if(window.SuGBodyContext?.receiveHealth)window.SuGBodyContext.receiveHealth(payload);
          if(window.SuGNutrition?.receiveHealth)window.SuGNutrition.receiveHealth(payload);
          if(window.SuGNextMeal?.render)window.SuGNextMeal.render();
          if(window.SuGMealTiming?.render)window.SuGMealTiming.render();
          if(window.SuGGeneral?.render)window.SuGGeneral.render();
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
        func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){Task{@MainActor in self.store?.installBodyRuntimeIfNeeded(); self.store?.installQuestRuntimeIfNeeded(); self.store?.installWalkRuntimeIfNeeded(); self.store?.deliverPendingHealth()}}
        func webView(_ webView:WKWebView,decidePolicyFor navigationAction:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void){guard let url=navigationAction.request.url else{decisionHandler(.allow);return};let allowedHosts=["koji06ochi-ship-it.github.io","supabase.co"];if let host=url.host,!allowedHosts.contains(where:{host==$0||host.hasSuffix("."+$0)}),navigationAction.navigationType == .linkActivated{UIApplication.shared.open(url);decisionHandler(.cancel);return};decisionHandler(.allow)}
    }
}