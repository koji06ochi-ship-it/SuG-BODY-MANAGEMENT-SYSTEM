import Foundation
import HealthKit

@MainActor
final class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()

    @Published var isAuthorized = false
    @Published var steps: Int = 0
    @Published var walkingDistanceKm: Double = 0
    @Published var weightKg: Double?
    @Published var heartRate: Double?
    @Published var restingHeartRate: Double?
    @Published var hrvMs: Double?
    @Published var sleepHours: Double?
    @Published var lastSync: Date?
    @Published var errorMessage: String?

    private let store = HKHealthStore()

    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        [
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning),
            HKQuantityType.quantityType(forIdentifier: .bodyMass),
            HKQuantityType.quantityType(forIdentifier: .heartRate),
            HKQuantityType.quantityType(forIdentifier: .restingHeartRate),
            HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN),
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
        async let d = fetchTodayWalkingDistanceKm()
        async let w = fetchLatestWeight()
        async let hr = fetchLatestHeartRate()
        async let rhr = fetchLatestRestingHeartRate()
        async let hrv = fetchLatestHRV()
        async let sl = fetchLastNightSleepHours()
        let result = await (s, d, w, hr, rhr, hrv, sl)
        steps = result.0
        walkingDistanceKm = result.1
        weightKg = result.2
        heartRate = result.3
        restingHeartRate = result.4
        hrvMs = result.5
        sleepHours = result.6
        lastSync = Date()
    }

    private func todayPredicate() -> NSPredicate {
        let start = Calendar.current.startOfDay(for: Date())
        return HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
    }

    private func fetchTodaySteps() async -> Int {
        guard let type = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return 0 }
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: todayPredicate(), options: .cumulativeSum) { _, stats, _ in
                let value = stats?.sumQuantity()?.doubleValue(for: .count()) ?? 0
                continuation.resume(returning: Int(value.rounded()))
            }
            store.execute(query)
        }
    }

    private func fetchTodayWalkingDistanceKm() async -> Double {
        guard let type = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else { return 0 }
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: todayPredicate(), options: .cumulativeSum) { _, stats, _ in
                let meters = stats?.sumQuantity()?.doubleValue(for: .meter()) ?? 0
                continuation.resume(returning: max(0, meters / 1000))
            }
            store.execute(query)
        }
    }

    private func fetchLatestWeight() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .bodyMass) else { return nil }
        return await latestQuantity(type: type, unit: .gramUnit(with: .kilo))
    }

    private func fetchLatestHeartRate() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return nil }
        return await latestQuantity(type: type, unit: HKUnit.count().unitDivided(by: .minute()))
    }

    private func fetchLatestRestingHeartRate() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) else { return nil }
        return await latestQuantity(type: type, unit: HKUnit.count().unitDivided(by: .minute()))
    }

    private func fetchLatestHRV() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else { return nil }
        return await latestQuantity(type: type, unit: HKUnit.secondUnit(with: .milli))
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
