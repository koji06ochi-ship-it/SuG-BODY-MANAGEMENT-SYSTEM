import SwiftUI

struct ContentView: View {
    private static let base = "https://koji06ochi-ship-it.github.io/SuG-BODY-MANAGEMENT-SYSTEM/"
    @State private var selectedTab = 0
    @StateObject private var health = HealthKitManager.shared
    @StateObject private var bodyStore = MemberWebViewStore(url: URL(string: base + "apps/body/?native=ios&v=27.37")!)
    @StateObject private var questStore = MemberWebViewStore(url: URL(string: base + "shrine-quest-v26.5.206.html?embedded=1&native=ios&v=27.37")!)
    @StateObject private var walkStore = MemberWebViewStore(url: URL(string: base + "walk-quest.html?embedded=1&native=ios&v=27.37")!)
    @StateObject private var cardStore = MemberWebViewStore(url: URL(string: base + "?entry=member&hub=1&membercard=1&native=ios&v=27.37")!)

    private func pushHealth(to store: MemberWebViewStore) {
        store.pushNativeHealth(steps: health.steps, distanceKm: health.walkingDistanceKm, sleepHours: health.sleepHours, heartRate: health.heartRate, restingHeartRate: health.restingHeartRate, weightKg: health.weightKg, syncedAt: health.lastSync)
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
            pushHealth(to:bodyStore); pushHealth(to:walkStore)
        }
        .onChange(of:selectedTab){_,tab in
            guard tab==0 || tab==2 else{return}
            Task{await health.refreshToday(); pushHealth(to:bodyStore); pushHealth(to:walkStore)}
        }
    }
}
