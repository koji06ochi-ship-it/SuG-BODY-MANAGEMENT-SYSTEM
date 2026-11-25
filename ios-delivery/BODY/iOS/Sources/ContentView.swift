import SwiftUI
import HealthKit

struct ContentView: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var selectedTab = 0
    @StateObject private var health = HealthKitManager.shared
    @StateObject private var bodyStore = MemberWebViewStore(url: MemberWebViewStore.formalBodyURL)

    private func pushHealth(to store: MemberWebViewStore) {
        guard health.lastSync != nil else { return }
        store.pushNativeHealth(
            steps: health.steps,
            distanceKm: health.walkingDistanceKm,
            restingEnergyKcal: health.restingEnergyKcal,
            activeEnergyKcal: health.activeEnergyKcal,
            exerciseMinutes: health.exerciseMinutes,
            sleepHours: health.sleepHours,
            heartRate: health.heartRate,
            restingHeartRate: health.restingHeartRate,
            hrvMs: health.hrvMs,
            weightKg: health.weightKg,
            bodyFatPercentage: health.bodyFatPercentage,
            leanBodyMassKg: health.leanBodyMassKg,
            vo2Max: health.vo2Max,
            respiratoryRate: health.respiratoryRate,
            oxygenSaturationPercent: health.oxygenSaturationPercent,
            recoveryScore: health.recoveryScore,
            stressScore: health.stressScore,
            recoveryStatus: health.recoveryStatus,
            stressStatus: health.stressStatus,
            recoveryConfidence: health.recoveryConfidence,
            workouts: health.recentWorkouts,
            labResults: health.recentLabResults,
            extras: health.bodyExtras,
            authorizationRequestCompleted: health.authorizationRequestCompleted,
            syncedAt: health.lastSync
        )
    }

    private func refreshAndPush() async {
        guard health.authorizationRequestCompleted else { return }
        await health.refreshToday()
        pushHealth(to: bodyStore)
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            MemberWebView(store: bodyStore).tag(0).tabItem { Label("SWAG", systemImage: "house.fill") }
        }
        .tint(Color(red:0.89,green:0.72,blue:0.28)).toolbarBackground(Color.black,for:.tabBar).toolbarBackground(.visible,for:.tabBar).preferredColorScheme(.dark)
        .task {
            bodyStore.loadIfNeeded()
            if health.authorizationRequestCompleted { await refreshAndPush() }
        }
        .task(id: selectedTab) {
            guard selectedTab == 0 else { return }
            while !Task.isCancelled {
                if scenePhase == .active { await refreshAndPush() }
                try? await Task.sleep(nanoseconds: 60_000_000_000)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .init("SuGBodyRequestHealth"))) { _ in
            Task {
                await health.requestAuthorization()
                pushHealth(to: bodyStore)
                let result: [String: Any] = [
                    "ok": health.authorizationRequestCompleted,
                    "error": health.errorMessage ?? ""
                ]
                if let data = try? JSONSerialization.data(withJSONObject: result),
                   let json = String(data: data, encoding: .utf8) {
                    do {
                        _ = try await bodyStore.webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('sug:healthkit-result',{detail:\(json)}))")
                    } catch {
                        NSLog("SWAG JavaScript bridge error: %@", error.localizedDescription)
                    }
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .init("SuGBodyWriteHealth"))) { note in
            let info = note.userInfo ?? [:]
            let action = info["action"] as? String ?? ""
            let payload = info["payload"] as? [String: Any] ?? [:]
            Task {
                let store = HKHealthStore()
                var ok = false
                var errMsg = ""
                do {
                    try await health.requestBodyRenewalAuthorization(store: store)
                    let iso = ISO8601DateFormatter()
                    switch action {
                    case "writeMindfulSession":
                        if let sStr = payload["startDateISO"] as? String,
                           let eStr = payload["endDateISO"] as? String,
                           let sDate = iso.date(from: sStr),
                           let eDate = iso.date(from: eStr) {
                            let syncId = payload["syncId"] as? String ?? "body-mindful-\(sStr)"
                            let exType = payload["exerciseType"] as? String ?? "360_breathing"
                            try await health.saveMindfulSession(store: store, syncId: syncId, startDate: sDate, endDate: eDate, exerciseType: exType)
                            ok = true
                        }
                    case "writeStateOfMind":
                        if #available(iOS 18.0, *), let valence = payload["valence"] as? Double {
                            let date = (payload["dateISO"] as? String).flatMap { iso.date(from: $0) } ?? Date()
                            let syncId = payload["syncId"] as? String ?? "body-som-\(Int(date.timeIntervalSince1970))"
                            let isDaily = (payload["kind"] as? String) == "dailyMood"
                            try await health.saveStateOfMind(store: store, syncId: syncId, date: date, isDailyMood: isDaily, valence: valence)
                            ok = true
                        }
                    case "writeAlcoholBeverages":
                        if let drinks = payload["standardDrinks"] as? Double {
                            let date = (payload["dateISO"] as? String).flatMap { iso.date(from: $0) } ?? Date()
                            let syncId = payload["syncId"] as? String ?? "body-alc-\(Int(date.timeIntervalSince1970))"
                            try await health.saveQuantitySample(store: store, identifier: .numberOfAlcoholicBeverages, unit: .count(), value: drinks, date: date, syncId: syncId)
                            ok = true
                        }
                    case "writeNutrition":
                        let date = (payload["dateISO"] as? String).flatMap { iso.date(from: $0) } ?? Date()
                        let baseId = payload["syncId"] as? String ?? "body-meal-\(Int(date.timeIntervalSince1970))"
                        var wroteAny = false
                        let pairs: [(String, HKQuantityTypeIdentifier, HKUnit)] = [
                            ("kcal", .dietaryEnergyConsumed, .kilocalorie()),
                            ("proteinG", .dietaryProtein, .gram()),
                            ("fatG", .dietaryFatTotal, .gram()),
                            ("carbsG", .dietaryCarbohydrates, .gram()),
                            ("fiberG", .dietaryFiber, .gram()),
                            ("waterMl", .dietaryWater, .literUnit(with: .milli))
                        ]
                        for (k, id, unit) in pairs {
                            if let val = payload[k] as? Double, val >= 0 {
                                try await health.saveQuantitySample(store: store, identifier: id, unit: unit, value: val, date: date, syncId: "\(baseId)-\(k)")
                                wroteAny = true
                            }
                        }
                        ok = wroteAny
                    case "writeBodyMetrics":
                        let date = (payload["dateISO"] as? String).flatMap { iso.date(from: $0) } ?? Date()
                        let baseId = payload["syncId"] as? String ?? "body-metrics-\(Int(date.timeIntervalSince1970))"
                        var wroteAny = false
                        if let w = payload["weightKg"] as? Double, w > 0 {
                            try await health.saveQuantitySample(store: store, identifier: .bodyMass, unit: .gramUnit(with: .kilo), value: w, date: date, syncId: "\(baseId)-weight")
                            wroteAny = true
                        }
                        if let bf = payload["bodyFatPct"] as? Double, bf >= 0, bf <= 100 {
                            try await health.saveQuantitySample(store: store, identifier: .bodyFatPercentage, unit: .percent(), value: bf / 100.0, date: date, syncId: "\(baseId)-bodyfat")
                            wroteAny = true
                        }
                        ok = wroteAny
                    case "writeWorkout":
                        if let sStr = payload["startDateISO"] as? String,
                           let eStr = payload["endDateISO"] as? String,
                           let sDate = iso.date(from: sStr),
                           let eDate = iso.date(from: eStr) {
                            let syncId = payload["syncId"] as? String ?? "swag-workout-\(sStr)"
                            let act = payload["activityType"] as? String ?? "strength"
                            let distM = payload["distanceMeters"] as? Double
                            let kcal = payload["energyKcal"] as? Double
                            try await health.saveWorkout(store: store, syncId: syncId, activityName: act, startDate: sDate, endDate: eDate, distanceMeters: distM, energyKcal: kcal)
                            ok = true
                        }
                    default:
                        errMsg = "Unsupported HealthKit write action"
                    }
                } catch {
                    errMsg = error.localizedDescription
                }
                let detail: [String: Any] = ["action": action, "ok": ok, "error": errMsg]
                if let data = try? JSONSerialization.data(withJSONObject: detail),
                   let json = String(data: data, encoding: .utf8) {
                    do {
                        _ = try await bodyStore.webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('sug:native-health-write-result',{detail:\(json)}))")
                    } catch {
                        NSLog("SWAG JavaScript bridge error: %@", error.localizedDescription)
                    }
                }
            }
        }
        .onChange(of: selectedTab) { _, tab in
            guard tab == 0 else { return }
            Task { await refreshAndPush() }
        }
        .onOpenURL { url in
            guard url.scheme == "sug-swag" || url.scheme == "sug-body" else { return }
            let comps = URLComponents(url: url, resolvingAgainstBaseURL: false)
            var params: [String: String] = [:]
            for item in comps?.queryItems ?? [] { params[item.name] = item.value ?? "" }
            let detail: [String: Any] = ["host": url.host ?? "", "params": params]
            if let data = try? JSONSerialization.data(withJSONObject: detail),
               let json = String(data: data, encoding: .utf8) {
                bodyStore.webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('sug:walk-incoming',{detail:\(json)}))", completionHandler: { _, error in
                    if let error {
                        NSLog("SWAG JavaScript bridge error: %@", error.localizedDescription)
                    }
                })
            }
        }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active else { return }
            Task { await refreshAndPush() }
        }
    }
}
