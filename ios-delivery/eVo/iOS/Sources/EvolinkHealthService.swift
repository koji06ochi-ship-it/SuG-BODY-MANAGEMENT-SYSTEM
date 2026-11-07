import Foundation
import HealthKit
import Combine

@MainActor
final class EvolinkHealthService: ObservableObject {
    @Published private(set) var isLoading = false
    @Published private(set) var status = "ヘルスケア未同期。本人の許可後に取得します。"
    @Published private(set) var latestPayload: [String: Any]?

    private let store = HKHealthStore()
    private let quantityTypes: [HKQuantityTypeIdentifier] = [
        .stepCount, .distanceWalkingRunning, .activeEnergyBurned,
        .heartRate, .restingHeartRate, .heartRateVariabilitySDNN
    ]

    func refreshFromDevice() async {
        guard !isLoading else { return }
        guard HKHealthStore.isHealthDataAvailable() else {
            status = "この端末はHealthKitを利用できません。"; return
        }
        isLoading = true
        defer { isLoading = false }
        status = "HealthKitの許可とデータ取得を確認中…"
        var readTypes: Set<HKObjectType> = []
        for id in quantityTypes {
            if let t = HKObjectType.quantityType(forIdentifier: id) { readTypes.insert(t) }
        }
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { readTypes.insert(sleepType) }
        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
        } catch {
            status = "ヘルスケアへのアクセスを確認できませんでした。"
            return
        }
        let startOfToday = Calendar.current.startOfDay(for: Date())
        var metrics: [String: Double] = [:]
        if let x = await sum(.stepCount, unit: .count(), since: startOfToday) { metrics["steps"] = x }
        if let x = await sum(.distanceWalkingRunning, unit: .meter(), since: startOfToday) { metrics["distanceKm"] = x / 1000 }
        if let x = await sum(.activeEnergyBurned, unit: .kilocalorie(), since: startOfToday) { metrics["activeEnergyKcal"] = x }
        if let x = await latest(.heartRate, unit: HKUnit.count().unitDivided(by: .minute())) { metrics["heartRate"] = x }
        if let x = await latest(.restingHeartRate, unit: HKUnit.count().unitDivided(by: .minute())) { metrics["restingHeartRate"] = x }
        if let x = await latest(.heartRateVariabilitySDNN, unit: .secondUnit(with: .milli)) { metrics["hrvMs"] = x }
        if let x = await lastNightSleepHours() { metrics["sleepHours"] = x }
        guard !metrics.isEmpty else {
            status = "取得可能なデータがありません。ヘルスケアの許可と記録を確認してください。"
            latestPayload = nil
            return
        }
        latestPayload = [
            "source": "healthkit_native_evolink",
            "verifiedMeasurement": true,
            "syncedAt": ISO8601DateFormatter().string(from: Date()),
            "metrics": metrics
        ]
        status = "取得した実測項目：\(metrics.keys.sorted().joined(separator: "、"))。値を画面で確認してください。"
    }

    private func sum(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, since start: Date) async -> Double? {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
        return await withCheckedContinuation { continuation in
            let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, value, _ in
                continuation.resume(returning: value?.sumQuantity()?.doubleValue(for: unit))
            }
            store.execute(q)
        }
    }

    private func latest(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit) async -> Double? {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
        return await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: type, predicate: nil, limit: 1,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]) { _, items, _ in
                let sample = items?.first as? HKQuantitySample
                continuation.resume(returning: sample?.quantity.doubleValue(for: unit))
            }
            store.execute(q)
        }
    }

    private func lastNightSleepHours() async -> Double? {
        guard let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return nil }
        let start = Calendar.current.startOfDay(for: Date()).addingTimeInterval(-6 * 3600)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
        return await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit,
                sortDescriptors: nil) { _, items, _ in
                let sleepSamples = (items as? [HKCategorySample] ?? []).filter { sample in
                    [HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
                     HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                     HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
                     HKCategoryValueSleepAnalysis.asleepREM.rawValue].contains(sample.value)
                }
                // Sources can overlap. Use one source's recorded total to avoid double counting.
                let grouped = Dictionary(grouping: sleepSamples, by: { $0.sourceRevision.source.bundleIdentifier })
                let best = grouped.values.map { samples in
                    samples.reduce(0.0) { $0 + max(0, $1.endDate.timeIntervalSince($1.startDate)) }
                }.max()
                continuation.resume(returning: best.map { $0 / 3600 })
            }
            store.execute(q)
        }
    }
}
