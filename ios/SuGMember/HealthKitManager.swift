import Foundation
import HealthKit

struct HealthWorkoutSummary: Sendable {
    let activityTypeRaw: UInt
    let activityName: String
    let startDateISO: String
    let endDateISO: String
    let durationMinutes: Double
    let activeEnergyKcal: Double?
    let distanceKm: Double?
}

@MainActor
final class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()

    @Published var isAuthorized = false
    @Published var steps: Int = 0
    @Published var walkingDistanceKm: Double = 0
    @Published var activeEnergyKcal: Double = 0
    @Published var exerciseMinutes: Double = 0
    @Published var weightKg: Double?
    @Published var bodyFatPercentage: Double?
    @Published var leanBodyMassKg: Double?
    @Published var heartRate: Double?
    @Published var restingHeartRate: Double?
    @Published var hrvMs: Double?
    @Published var vo2Max: Double?
    @Published var respiratoryRate: Double?
    @Published var oxygenSaturationPercent: Double?
    @Published var sleepHours: Double?
    @Published var recentWorkouts: [HealthWorkoutSummary] = []
    @Published var lastSync: Date?
    @Published var errorMessage: String?

    private let store = HKHealthStore()

    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        [
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning),
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
            HKQuantityType.quantityType(forIdentifier: .appleExerciseTime),
            HKQuantityType.quantityType(forIdentifier: .bodyMass),
            HKQuantityType.quantityType(forIdentifier: .bodyFatPercentage),
            HKQuantityType.quantityType(forIdentifier: .leanBodyMass),
            HKQuantityType.quantityType(forIdentifier: .heartRate),
            HKQuantityType.quantityType(forIdentifier: .restingHeartRate),
            HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN),
            HKQuantityType.quantityType(forIdentifier: .vo2Max),
            HKQuantityType.quantityType(forIdentifier: .respiratoryRate),
            HKQuantityType.quantityType(forIdentifier: .oxygenSaturation),
            HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)
        ].compactMap { $0 }.forEach { types.insert($0) }
        types.insert(HKObjectType.workoutType())
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
        async let ae = fetchTodayActiveEnergyKcal()
        async let ex = fetchTodayExerciseMinutes()
        async let w = fetchLatestWeight()
        async let bf = fetchLatestBodyFatPercentage()
        async let lbm = fetchLatestLeanBodyMassKg()
        async let hr = fetchLatestHeartRate()
        async let rhr = fetchLatestRestingHeartRate()
        async let hrv = fetchLatestHRV()
        async let vo2 = fetchLatestVO2Max()
        async let rr = fetchLatestRespiratoryRate()
        async let spo2 = fetchLatestOxygenSaturationPercent()
        async let sl = fetchLastNightSleepHours()
        async let workouts = fetchRecentWorkouts(limit: 20)

        let result = await (s, d, ae, ex, w, bf, lbm, hr, rhr, hrv, vo2, rr, spo2, sl, workouts)
        steps = result.0
        walkingDistanceKm = result.1
        activeEnergyKcal = result.2
        exerciseMinutes = result.3
        weightKg = result.4
        bodyFatPercentage = result.5
        leanBodyMassKg = result.6
        heartRate = result.7
        restingHeartRate = result.8
        hrvMs = result.9
        vo2Max = result.10
        respiratoryRate = result.11
        oxygenSaturationPercent = result.12
        sleepHours = result.13
        recentWorkouts = result.14
        lastSync = Date()
    }

    private func todayPredicate() -> NSPredicate {
        let start = Calendar.current.startOfDay(for: Date())
        return HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
    }

    private func fetchTodayCumulative(identifier: HKQuantityTypeIdentifier, unit: HKUnit) async -> Double {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { return 0 }
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: todayPredicate(), options: .cumulativeSum) { _, stats, _ in
                continuation.resume(returning: stats?.sumQuantity()?.doubleValue(for: unit) ?? 0)
            }
            store.execute(query)
        }
    }

    private func fetchTodaySteps() async -> Int {
        let value = await fetchTodayCumulative(identifier: .stepCount, unit: .count())
        return Int(value.rounded())
    }

    private func fetchTodayWalkingDistanceKm() async -> Double {
        let meters = await fetchTodayCumulative(identifier: .distanceWalkingRunning, unit: .meter())
        return max(0, meters / 1000)
    }

    private func fetchTodayActiveEnergyKcal() async -> Double {
        max(0, await fetchTodayCumulative(identifier: .activeEnergyBurned, unit: .kilocalorie()))
    }

    private func fetchTodayExerciseMinutes() async -> Double {
        max(0, await fetchTodayCumulative(identifier: .appleExerciseTime, unit: .minute()))
    }

    private func fetchLatestWeight() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .bodyMass) else { return nil }
        return await latestQuantity(type: type, unit: .gramUnit(with: .kilo))
    }

    private func fetchLatestBodyFatPercentage() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .bodyFatPercentage) else { return nil }
        return await latestQuantity(type: type, unit: .percent())
    }

    private func fetchLatestLeanBodyMassKg() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .leanBodyMass) else { return nil }
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

    private func fetchLatestVO2Max() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .vo2Max) else { return nil }
        return await latestQuantity(type: type, unit: HKUnit(from: "ml/kg*min"))
    }

    private func fetchLatestRespiratoryRate() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .respiratoryRate) else { return nil }
        return await latestQuantity(type: type, unit: HKUnit.count().unitDivided(by: .minute()))
    }

    private func fetchLatestOxygenSaturationPercent() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .oxygenSaturation) else { return nil }
        return await latestQuantity(type: type, unit: .percent())
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

    private func fetchRecentWorkouts(limit: Int) async -> [HealthWorkoutSummary] {
        await withCheckedContinuation { continuation in
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: nil, limit: limit, sortDescriptors: [sort]) { _, samples, _ in
                let formatter = ISO8601DateFormatter()
                let workouts = (samples as? [HKWorkout] ?? []).map { workout in
                    let kcal = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie())
                    let km = workout.totalDistance.map { $0.doubleValue(for: .meter()) / 1000 }
                    return HealthWorkoutSummary(
                        activityTypeRaw: workout.workoutActivityType.rawValue,
                        activityName: Self.workoutName(workout.workoutActivityType),
                        startDateISO: formatter.string(from: workout.startDate),
                        endDateISO: formatter.string(from: workout.endDate),
                        durationMinutes: workout.duration / 60,
                        activeEnergyKcal: kcal,
                        distanceKm: km
                    )
                }
                continuation.resume(returning: workouts)
            }
            store.execute(query)
        }
    }

    nonisolated private static func workoutName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .walking: return "ウォーキング"
        case .running: return "ランニング"
        case .cycling: return "サイクリング"
        case .traditionalStrengthTraining: return "筋力トレーニング"
        case .functionalStrengthTraining: return "機能的筋力トレーニング"
        case .highIntensityIntervalTraining: return "HIIT"
        case .coreTraining: return "コアトレーニング"
        case .flexibility: return "柔軟性"
        case .yoga: return "ヨガ"
        case .hiking: return "ハイキング"
        case .swimming: return "水泳"
        case .rowing: return "ローイング"
        case .elliptical: return "エリプティカル"
        case .stairClimbing: return "階段"
        case .mixedCardio: return "ミックスカーディオ"
        default: return "ワークアウト"
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
