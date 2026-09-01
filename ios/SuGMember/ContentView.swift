import SwiftUI

struct ContentView: View {
    private static let base = "https://koji06ochi-ship-it.github.io/SuG-BODY-MANAGEMENT-SYSTEM/"
    @Environment(\.scenePhase) private var scenePhase
    @State private var selectedTab = 0
    @StateObject private var health = HealthKitManager.shared
    @StateObject private var bodyStore = MemberWebViewStore(url: URL(string: base + "apps/body/best-of-miss-demo-v27.71.html?native=ios&v=27.73")!)
    @StateObject private var questStore = MemberWebViewStore(url: URL(string: base + "shrine-quest-v26.5.206.html?embedded=1&native=ios&v=27.73")!)
    @StateObject private var walkStore = MemberWebViewStore(url: URL(string: base + "walk-quest.html?embedded=1&native=ios&v=27.73")!)
    @StateObject private var cardStore = MemberWebViewStore(url: URL(string: base + "?entry=member&hub=1&membercard=1&native=ios&v=27.73")!)

    private func pushHealth(to store: MemberWebViewStore) {
        store.pushNativeHealth(
            steps: health.steps,
            distanceKm: health.walkingDistanceKm,
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
            syncedAt: health.lastSync
        )
    }

    private func refreshAndPush() async {
        await health.refreshToday()
        pushHealth(to: bodyStore)
        pushHealth(to: walkStore)
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            MemberWebView(store: bodyStore).tag(0).tabItem { Label("BODY", systemImage: "house.fill") }
            MemberWebView(store: questStore).tag(1).tabItem { Label("QUEST", systemImage: "map.fill") }
            MemberWebView(store: walkStore).tag(2).tabItem { Label("WALK", systemImage: "figure.walk") }
            MemberWebView(store: cardStore).tag(3).tabItem { Label("会員証", systemImage: "person.text.rectangle.fill") }
        }
        .tint(Color(red:0.89,green:0.72,blue:0.28)).toolbarBackground(Color.black,for:.tabBar).toolbarBackground(.visible,for:.tabBar).preferredColorScheme(.dark)
        .task {
            bodyStore.loadIfNeeded(); walkStore.loadIfNeeded()
            await health.requestAuthorization()
            pushHealth(to: bodyStore); pushHealth(to: walkStore)
        }
        .task(id: selectedTab) {
            guard selectedTab == 0 || selectedTab == 2 else { return }
            while !Task.isCancelled {
                if scenePhase == .active { await refreshAndPush() }
                try? await Task.sleep(nanoseconds: 60_000_000_000)
            }
        }
        .onChange(of: selectedTab) { _, tab in
            guard tab == 0 || tab == 2 else { return }
            Task { await refreshAndPush() }
        }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active else { return }
            Task { await refreshAndPush() }
        }
    }
}
