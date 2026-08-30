import Foundation
import HealthKit

@MainActor
final class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()

    @Published var isAuthorized = false
    @Published var steps: Int = 0
    @Published var weightKg: Double?
    @Published var restingHeartRate: Double?
    @Published var sleepHours: Double?
    @Published var lastSync: Date?
    @Published var errorMessage: String?

    private let store = HKHealthStore()

    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        [
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .bodyMass),
            HKQuantityType.quantityType(forIdentifier: .restingHeartRate),
            HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)
        ].compactMap { $0 }.forEach { types.insert($0) }
        return types
    }

    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            isAuthorized = false
            errorMessage = "この端末ではAppleヘルスケアを利用できません。"
            return
        }
        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
            isAuthorized = true
            errorMessage = nil
            await refreshToday()
        } catch {
            isAuthorized = false
            errorMessage = error.localizedDescription
        }
    }

    func refreshToday() async {
        async let s = fetchTodaySteps()
        async let w = fetchLatestWeight()
        async let h = fetchLatestRestingHeartRate()
        async let sl = fetchLastNightSleepHours()
        let result = await (s, w, h, sl)
        steps = result.0
        weightKg = result.1
        restingHeartRate = result.2
        sleepHours = result.3
        lastSync = Date()
    }

    private func fetchTodaySteps() async -> Int {
        guard let type = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return 0 }
        let start = Calendar.current.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
                let value = stats?.sumQuantity()?.doubleValue(for: .count()) ?? 0
                continuation.resume(returning: Int(value.rounded()))
            }
            store.execute(query)
        }
    }

    private func fetchLatestWeight() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .bodyMass) else { return nil }
        return await latestQuantity(type: type, unit: .gramUnit(with: .kilo))
    }

    private func fetchLatestRestingHeartRate() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) else { return nil }
        let unit = HKUnit.count().unitDivided(by: .minute())
        return await latestQuantity(type: type, unit: unit)
    }

    private func latestQuantity(type: HKQuantityType, unit: HKUnit) async -> Double? {
        await withCheckedContinuation { continuation in
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                let sample = samples?.first as? HKQuantitySample
                continuation.resume(returning: sample?.quantity.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }

    private func fetchLastNightSleepHours() async -> Double? {
        guard let type = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else { return nil }
        let now = Date()
        let start = Calendar.current.date(byAdding: .hour, value: -24, to: now) ?? now.addingTimeInterval(-86400)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now, options: [])

        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                let asleepValues: Set<Int> = [
                    HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
                    HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                    HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
                    HKCategoryValueSleepAnalysis.asleepREM.rawValue
                ]

                // Oura / Apple Watch / iPhone may contribute overlapping sleep samples.
                // Merge intervals first so the same minute is never counted twice.
                let intervals = (samples as? [HKCategorySample] ?? [])
                    .filter { asleepValues.contains($0.value) }
                    .map { (max($0.startDate, start), min($0.endDate, now)) }
                    .filter { $0.1 > $0.0 }
                    .sorted { $0.0 < $1.0 }

                guard var current = intervals.first else {
                    continuation.resume(returning: nil)
                    return
                }

                var seconds = 0.0
                for interval in intervals.dropFirst() {
                    if interval.0 <= current.1 {
                        current.1 = max(current.1, interval.1)
                    } else {
                        seconds += current.1.timeIntervalSince(current.0)
                        current = interval
                    }
                }
                seconds += current.1.timeIntervalSince(current.0)

                continuation.resume(returning: seconds > 0 ? seconds / 3600 : nil)
            }
            store.execute(query)
        }
    }
}
