import SwiftUI

struct ContentView: View {
    @StateObject private var health = HealthKitManager.shared

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    Text("S.u.G MEMBER")
                        .font(.title2.bold())

                    VStack(spacing: 10) {
                        statusRow("Apple Health", health.isAuthorized ? "連携済" : "未連携")
                        statusRow("今日の歩数", "\(health.steps) 歩")
                        statusRow("体重", health.weightKg.map { String(format: "%.1f kg", $0) } ?? "--")
                        statusRow("安静時心拍", health.restingHeartRate.map { String(format: "%.0f bpm", $0) } ?? "--")
                        statusRow("睡眠", health.sleepHours.map { String(format: "%.1f h", $0) } ?? "--")
                    }
                    .padding()
                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18))

                    Button(health.isAuthorized ? "ヘルスケアを同期" : "ヘルスケアを許可") {
                        Task {
                            if health.isAuthorized {
                                await health.refreshToday()
                            } else {
                                await health.requestAuthorization()
                            }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)

                    if let last = health.lastSync {
                        Text("最終同期 \(last.formatted(date: .omitted, time: .shortened))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    if let error = health.errorMessage {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }
                .padding()
            }
            .task {
                if health.isAuthorized {
                    await health.refreshToday()
                }
            }
        }
    }

    private func statusRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            Text(value).bold()
        }
    }
}
