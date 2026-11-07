import SwiftUI

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
            MemberWebView(store: bodyStore).tag(0).tabItem { Label("BODY", systemImage: "house.fill") }
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
            }
        }
        .onChange(of: selectedTab) { _, tab in
            guard tab == 0 else { return }
            Task { await refreshAndPush() }
        }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active else { return }
            Task { await refreshAndPush() }
        }
    }
}
