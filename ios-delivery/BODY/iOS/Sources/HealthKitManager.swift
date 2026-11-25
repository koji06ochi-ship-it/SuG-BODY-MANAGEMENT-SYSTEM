import Foundation
import HealthKit
import Combine

struct HealthWorkoutSummary: Sendable {
    let activityTypeRaw: UInt
    let activityName: String
    let startDateISO: String
    let endDateISO: String
    let durationMinutes: Double
    let activeEnergyKcal: Double?
    let distanceKm: Double?
}

struct HealthLabResultSummary: Sendable {
    let name: String
    let value: String?
    let unit: String?
    let referenceRange: String?
    let interpretation: String?
    let effectiveDateISO: String?
    let sourceName: String
}

@MainActor
final class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()

    // HealthKit does not reveal whether each requested read type was denied.
    // This flag means only that the authorization sheet completed successfully.
    @Published var authorizationRequestCompleted = false
    @Published var steps: Int?
    @Published var walkingDistanceKm: Double?
    @Published var restingEnergyKcal: Double?
    @Published var activeEnergyKcal: Double?
    @Published var exerciseMinutes: Double?
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
    @Published var recentLabResults: [HealthLabResultSummary] = []
    @Published var bodyExtras: BodyRenewalHealthExtras?
    @Published var recoveryScore: Int?
    @Published var stressScore: Int?
    @Published var recoveryStatus: String?
    @Published var stressStatus: String?
    @Published var recoveryConfidence: Double = 0
    @Published var lastSync: Date?
    @Published var errorMessage: String?

    private let store = HKHealthStore()

    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        [
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning),
            HKQuantityType.quantityType(forIdentifier: .basalEnergyBurned),
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
        if let mindful = HKCategoryType.categoryType(forIdentifier: .mindfulSession) { types.insert(mindful) }
        if #available(iOS 17.0, *), let daylight = HKQuantityType.quantityType(forIdentifier: .timeInDaylight) { types.insert(daylight) }
        if #available(iOS 18.0, *) { types.insert(HKObjectType.stateOfMindType()) }
        return types
    }

    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            authorizationRequestCompleted = false
            errorMessage = "この端末ではAppleヘルスケアを利用できません。"
            return
        }

        do {
            try await store.requestAuthorization(toShare: bodyRenewalShareTypes, read: bodyRenewalReadTypes)
            authorizationRequestCompleted = true
            errorMessage = nil
            await refreshToday()
        } catch {
            authorizationRequestCompleted = false
            errorMessage = error.localizedDescription
        }
    }

    func refreshToday() async {
        async let s = fetchTodaySteps()
        async let d = fetchTodayWalkingDistanceKm()
        async let re = fetchTodayRestingEnergyKcal()
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
        async let hrvBaseline = fetchAverageQuantity(
            identifier: .heartRateVariabilitySDNN,
            unit: HKUnit.secondUnit(with: .milli),
            days: 14
        )
        async let rhrBaseline = fetchAverageQuantity(
            identifier: .restingHeartRate,
            unit: HKUnit.count().unitDivided(by: .minute()),
            days: 14
        )
        async let rrBaseline = fetchAverageQuantity(
            identifier: .respiratoryRate,
            unit: HKUnit.count().unitDivided(by: .minute()),
            days: 14
        )

        let stepsValue = await s
        let distanceValue = await d
        let restingEnergyValue = await re
        let energyValue = await ae
        let exerciseValue = await ex
        let weightValue = await w
        let bodyFatValue = await bf
        let leanMassValue = await lbm
        let heartRateValue = await hr
        let restingHeartRateValue = await rhr
        let hrvValue = await hrv
        let vo2Value = await vo2
        let respiratoryValue = await rr
        let oxygenValue = await spo2
        let sleepValue = await sl
        let workoutsValue = await workouts
        let hrvBaselineValue = await hrvBaseline
        let rhrBaselineValue = await rhrBaseline
        let rrBaselineValue = await rrBaseline

        steps = stepsValue
        walkingDistanceKm = distanceValue
        restingEnergyKcal = restingEnergyValue
        activeEnergyKcal = energyValue
        exerciseMinutes = exerciseValue
        weightKg = weightValue
        bodyFatPercentage = bodyFatValue
        leanBodyMassKg = leanMassValue
        heartRate = heartRateValue
        restingHeartRate = restingHeartRateValue
        hrvMs = hrvValue
        vo2Max = vo2Value
        respiratoryRate = respiratoryValue
        oxygenSaturationPercent = oxygenValue
        sleepHours = sleepValue
        recentWorkouts = workoutsValue
        recentLabResults = []
        bodyExtras = await fetchBodyRenewalExtras(store: store)

        let state = Self.estimateRecoveryAndStress(
            sleepHours: sleepValue,
            hrvMs: hrvValue,
            hrvBaselineMs: hrvBaselineValue,
            restingHeartRate: restingHeartRateValue,
            restingHeartRateBaseline: rhrBaselineValue,
            respiratoryRate: respiratoryValue,
            respiratoryRateBaseline: rrBaselineValue,
            oxygenSaturationPercent: oxygenValue,
            workouts: workoutsValue
        )
        recoveryScore = state.recovery
        stressScore = state.stress
        recoveryStatus = state.recoveryStatus
        stressStatus = state.stressStatus
        recoveryConfidence = state.confidence
        lastSync = Date()
    }

    private func todayPredicate() -> NSPredicate {
        let start = Calendar.current.startOfDay(for: Date())
        return HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
    }

    private func fetchTodayCumulative(identifier: HKQuantityTypeIdentifier, unit: HKUnit) async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { return nil }
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: type,
                quantitySamplePredicate: todayPredicate(),
                options: .cumulativeSum
            ) { _, stats, error in
                guard error == nil, let quantity = stats?.sumQuantity() else {
                    continuation.resume(returning: nil)
                    return
                }
                continuation.resume(returning: quantity.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }

    private func fetchAverageQuantity(identifier: HKQuantityTypeIdentifier, unit: HKUnit, days: Int) async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { return nil }
        let end = Date()
        let safeDays = max(1, days)
        let start = Calendar.current.date(byAdding: .day, value: -safeDays, to: end)
            ?? end.addingTimeInterval(-86400 * Double(safeDays))
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: type,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { _, stats, _ in
                continuation.resume(returning: stats?.averageQuantity()?.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }

    private func fetchTodaySteps() async -> Int? {
        guard let value = await fetchTodayCumulative(identifier: .stepCount, unit: .count()) else { return nil }
        return Int(value.rounded())
    }

    private func fetchTodayWalkingDistanceKm() async -> Double? {
        guard let meters = await fetchTodayCumulative(identifier: .distanceWalkingRunning, unit: .meter()) else { return nil }
        return max(0, meters / 1000)
    }

    private func fetchTodayActiveEnergyKcal() async -> Double? {
        guard let value = await fetchTodayCumulative(identifier: .activeEnergyBurned, unit: .kilocalorie()) else { return nil }
        return max(0, value)
    }

    private func fetchTodayRestingEnergyKcal() async -> Double? {
        guard let value = await fetchTodayCumulative(identifier: .basalEnergyBurned, unit: .kilocalorie()) else { return nil }
        return max(0, value)
    }

    private func fetchTodayExerciseMinutes() async -> Double? {
        guard let value = await fetchTodayCumulative(identifier: .appleExerciseTime, unit: .minute()) else { return nil }
        return max(0, value)
    }

    private func fetchLatestWeight() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .bodyMass) else { return nil }
        return await latestQuantity(type: type, unit: .gramUnit(with: .kilo))
    }

    private func fetchLatestBodyFatPercentage() async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: .bodyFatPercentage) else { return nil }
        guard let value = await latestQuantity(type: type, unit: .percent()) else { return nil }
        return value * 100
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
        guard let value = await latestQuantity(type: type, unit: .percent()) else { return nil }
        return value * 100
    }

    private func latestQuantity(type: HKQuantityType, unit: HKUnit) async -> Double? {
        await withCheckedContinuation { continuation in
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(
                sampleType: type,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sort]
            ) { _, samples, _ in
                let sample = samples?.first as? HKQuantitySample
                continuation.resume(returning: sample?.quantity.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }

    private func fetchRecentWorkouts(limit: Int) async -> [HealthWorkoutSummary] {
        await withCheckedContinuation { continuation in
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(
                sampleType: HKObjectType.workoutType(),
                predicate: nil,
                limit: limit,
                sortDescriptors: [sort]
            ) { _, samples, _ in
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

    private func fetchLastNightSleepHours() async -> Double? {
        guard let type = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else { return nil }
        let now = Date()
        let start = Calendar.current.date(byAdding: .hour, value: -24, to: now)
            ?? now.addingTimeInterval(-86400)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now, options: [])

        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, _ in
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

    nonisolated private static func estimateRecoveryAndStress(
        sleepHours: Double?,
        hrvMs: Double?,
        hrvBaselineMs: Double?,
        restingHeartRate: Double?,
        restingHeartRateBaseline: Double?,
        respiratoryRate: Double?,
        respiratoryRateBaseline: Double?,
        oxygenSaturationPercent: Double?,
        workouts: [HealthWorkoutSummary]
    ) -> (recovery: Int?, stress: Int?, recoveryStatus: String?, stressStatus: String?, confidence: Double) {
        var recovery = 70.0
        var stress = 30.0
        var signals = 0

        if let sleepHours {
            signals += 1
            switch sleepHours {
            case 7.5...9.5:
                recovery += 15
                stress -= 10
            case 6.5..<7.5:
                recovery += 5
                stress -= 3
            case 5.5..<6.5:
                recovery -= 10
                stress += 10
            case ..<5.5:
                recovery -= 25
                stress += 20
            default:
                recovery += 5
            }
        }

        if let hrvMs, let baseline = hrvBaselineMs, baseline > 0 {
            signals += 1
            let ratio = hrvMs / baseline
            if ratio >= 1.10 {
                recovery += 10
                stress -= 10
            } else if ratio < 0.80 {
                recovery -= 20
                stress += 20
            } else if ratio < 0.90 {
                recovery -= 10
                stress += 10
            }
        }

        if let restingHeartRate, let baseline = restingHeartRateBaseline, baseline > 0 {
            signals += 1
            let ratio = restingHeartRate / baseline
            if ratio <= 0.95 {
                recovery += 8
                stress -= 5
            } else if ratio > 1.10 {
                recovery -= 15
                stress += 15
            } else if ratio > 1.05 {
                recovery -= 8
                stress += 8
            }
        }

        if let respiratoryRate, let baseline = respiratoryRateBaseline, baseline > 0 {
            signals += 1
            let ratio = respiratoryRate / baseline
            if ratio > 1.10 {
                recovery -= 8
                stress += 10
            } else if ratio > 1.05 {
                recovery -= 4
                stress += 5
            }
        }

        if let oxygenSaturationPercent {
            signals += 1
            if oxygenSaturationPercent < 92 {
                recovery -= 15
                stress += 12
            } else if oxygenSaturationPercent < 95 {
                recovery -= 8
                stress += 8
            }
        }

        let formatter = ISO8601DateFormatter()
        let cutoff = Date().addingTimeInterval(-86400)
        let last24hMinutes = workouts.reduce(0.0) { total, workout in
            guard let end = formatter.date(from: workout.endDateISO), end >= cutoff else { return total }
            return total + workout.durationMinutes
        }
        if last24hMinutes > 0 {
            signals += 1
            if last24hMinutes >= 120 {
                recovery -= 10
                stress += 8
            } else if last24hMinutes >= 60 {
                recovery -= 5
                stress += 4
            }
        }

        guard signals >= 2 else {
            return (nil, nil, nil, nil, Double(signals) / 6.0)
        }

        let recoveryInt = Int(min(100, max(0, recovery)).rounded())
        let stressInt = Int(min(100, max(0, stress)).rounded())
        let recoveryLabel: String = recoveryInt >= 80
            ? "回復良好"
            : recoveryInt >= 60
                ? "概ね回復"
                : recoveryInt >= 40
                    ? "回復不足"
                    : "強い回復不足"
        let stressLabel: String = stressInt < 30
            ? "低い"
            : stressInt < 50
                ? "通常域"
                : stressInt < 70
                    ? "高め"
                    : "かなり高い"

        return (
            recoveryInt,
            stressInt,
            recoveryLabel,
            stressLabel,
            min(1, Double(signals) / 6.0)
        )
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
}


// MARK: - S.u.G BODY Renewal (Section 15: 26 HealthKit Types, Read/Write, SyncIdentifier Dedup)
struct BodyRenewalHealthExtras: Sendable {
    let timeInDaylightMinutes: Double?
    let mindfulMinutesToday: Double?
    let latestStateOfMindValence: Double?
    let walkingSpeedKmh: Double?
    let walkingStepLengthCm: Double?
    let walkingAsymmetryPercent: Double?
    let walkingSteadinessPercent: Double?
    let dietaryEnergyKcalToday: Double?
    let dietaryProteinGToday: Double?
    let dietaryFatGToday: Double?
    let dietaryCarbsGToday: Double?
    let dietaryFiberGToday: Double?
    let dietaryWaterMlToday: Double?
    let alcoholicBeveragesToday: Double?
}

extension HealthKitManager {
    var bodyRenewalReadTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        let qIds: [HKQuantityTypeIdentifier] = [
            .stepCount, .distanceWalkingRunning, .activeEnergyBurned, .appleExerciseTime,
            .bodyMass, .bodyFatPercentage, .leanBodyMass,
            .heartRate, .restingHeartRate, .heartRateVariabilitySDNN,
            .vo2Max, .respiratoryRate, .oxygenSaturation,
            .walkingSpeed, .walkingStepLength, .walkingAsymmetryPercentage,
            .appleWalkingSteadiness,
            .dietaryEnergyConsumed, .dietaryProtein, .dietaryFatTotal,
            .dietaryCarbohydrates, .dietaryFiber, .dietaryWater,
            .numberOfAlcoholicBeverages
        ]
        for id in qIds {
            if let t = HKQuantityType.quantityType(forIdentifier: id) { types.insert(t) }
        }
        if #available(iOS 17.0, *),
           let daylight = HKQuantityType.quantityType(forIdentifier: .timeInDaylight) {
            types.insert(daylight)
        }
        if let sleep = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(sleep) }
        if let mindful = HKCategoryType.categoryType(forIdentifier: .mindfulSession) { types.insert(mindful) }
        if #available(iOS 18.0, *) {
            types.insert(HKObjectType.stateOfMindType())
        }
        types.insert(HKObjectType.workoutType())
        return types
    }

    var bodyRenewalShareTypes: Set<HKSampleType> {
        var types = Set<HKSampleType>()
        let writableQIds: [HKQuantityTypeIdentifier] = [
            .bodyMass, .bodyFatPercentage,
            .dietaryEnergyConsumed, .dietaryProtein, .dietaryFatTotal,
            .dietaryCarbohydrates, .dietaryFiber, .dietaryWater,
            .numberOfAlcoholicBeverages
        ]
        for id in writableQIds {
            if let t = HKQuantityType.quantityType(forIdentifier: id) { types.insert(t) }
        }
        if let mindful = HKCategoryType.categoryType(forIdentifier: .mindfulSession) { types.insert(mindful) }
        if #available(iOS 18.0, *) {
            types.insert(HKObjectType.stateOfMindType())
        }
        types.insert(HKObjectType.workoutType())
        return types
    }

    func requestBodyRenewalAuthorization(store: HKHealthStore) async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        try await store.requestAuthorization(toShare: bodyRenewalShareTypes, read: bodyRenewalReadTypes)
    }

    func saveMindfulSession(store: HKHealthStore, syncId: String, startDate: Date, endDate: Date, exerciseType: String) async throws {
        guard let type = HKCategoryType.categoryType(forIdentifier: .mindfulSession), endDate > startDate else { return }
        let sample = HKCategorySample(
            type: type,
            value: HKCategoryValue.notApplicable.rawValue,
            start: startDate,
            end: endDate,
            metadata: [HKMetadataKeySyncIdentifier: syncId, HKMetadataKeySyncVersion: 1, "SuGBodyExerciseType": exerciseType]
        )
        try await store.save(sample)
    }

    @available(iOS 18.0, *)
    func saveStateOfMind(store: HKHealthStore, syncId: String, date: Date, isDailyMood: Bool, valence: Double) async throws {
        let sample = HKStateOfMind(
            date: date,
            kind: isDailyMood ? .dailyMood : .momentaryEmotion,
            valence: max(-1.0, min(1.0, valence)),
            labels: [],
            associations: [],
            metadata: [HKMetadataKeySyncIdentifier: syncId, HKMetadataKeySyncVersion: 1]
        )
        try await store.save(sample)
    }


    func saveWorkout(store: HKHealthStore, syncId: String, activityName: String, startDate: Date, endDate: Date, distanceMeters: Double?, energyKcal: Double?) async throws {
        guard endDate > startDate else { return }
        let activityType: HKWorkoutActivityType
        switch activityName.lowercased() {
        case "running", "run": activityType = .running
        case "walking", "walk": activityType = .walking
        case "hyrox", "functional": activityType = .functionalStrengthTraining
        case "mobility", "flexibility", "stretch": activityType = .flexibility
        default: activityType = .traditionalStrengthTraining
        }
        let config = HKWorkoutConfiguration()
        config.activityType = activityType
        config.locationType = (activityType == .running || activityType == .walking) ? .outdoor : .indoor
        let builder = HKWorkoutBuilder(healthStore: store, configuration: config, device: .local())
        try await builder.beginCollection(at: startDate)
        var samples: [HKSample] = []
        if let kcal = energyKcal, kcal > 0, let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            samples.append(HKQuantitySample(type: energyType, quantity: HKQuantity(unit: .kilocalorie(), doubleValue: kcal), start: startDate, end: endDate))
        }
        if let dist = distanceMeters, dist > 0, let distType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) {
            samples.append(HKQuantitySample(type: distType, quantity: HKQuantity(unit: .meter(), doubleValue: dist), start: startDate, end: endDate))
        }
        if !samples.isEmpty {
            try await builder.addSamples(samples)
        }
        try await builder.addMetadata([HKMetadataKeySyncIdentifier: syncId, HKMetadataKeySyncVersion: 1, "SuGSwagActivity": activityName])
        try await builder.endCollection(at: endDate)
        _ = try await builder.finishWorkout()
    }

    func saveQuantitySample(store: HKHealthStore, identifier: HKQuantityTypeIdentifier, unit: HKUnit, value: Double, date: Date, syncId: String) async throws {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier), value >= 0 else { return }
        let sample = HKQuantitySample(
            type: type,
            quantity: HKQuantity(unit: unit, doubleValue: value),
            start: date,
            end: date,
            metadata: [HKMetadataKeySyncIdentifier: syncId, HKMetadataKeySyncVersion: 1]
        )
        try await store.save(sample)
    }

    func fetchBodyRenewalExtras(store: HKHealthStore) async -> BodyRenewalHealthExtras {
        let startOfDay = Calendar.current.startOfDay(for: Date())
        let now = Date()

        func sumToday(_ id: HKQuantityTypeIdentifier, unit: HKUnit) async -> Double? {
            guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return nil }
            let pred = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
            return await withCheckedContinuation { cont in
                let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, _ in
                    cont.resume(returning: stats?.sumQuantity()?.doubleValue(for: unit))
                }
                store.execute(q)
            }
        }

        func latestSample(_ id: HKQuantityTypeIdentifier, unit: HKUnit) async -> Double? {
            guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return nil }
            return await withCheckedContinuation { cont in
                let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
                let q = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                    let sample = samples?.first as? HKQuantitySample
                    cont.resume(returning: sample?.quantity.doubleValue(for: unit))
                }
                store.execute(q)
            }
        }

        var daylightMin: Double? = nil
        if #available(iOS 17.0, *) {
            daylightMin = await sumToday(.timeInDaylight, unit: .minute())
        }

        var mindfulMin: Double? = nil
        if let mType = HKCategoryType.categoryType(forIdentifier: .mindfulSession) {
            mindfulMin = await withCheckedContinuation { cont in
                let mPred = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
                let q = HKSampleQuery(sampleType: mType, predicate: mPred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                    let totalSec = (samples ?? []).reduce(0.0) { acc, s in acc + max(0, s.endDate.timeIntervalSince(s.startDate)) }
                    cont.resume(returning: totalSec > 0 ? totalSec / 60.0 : nil)
                }
                store.execute(q)
            }
        }

        var stateOfMindValence: Double? = nil
        if #available(iOS 18.0, *) {
            let somType = HKObjectType.stateOfMindType()
            stateOfMindValence = await withCheckedContinuation { cont in
                let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
                let somPred = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
                let q = HKSampleQuery(sampleType: somType, predicate: somPred, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                    let som = samples?.first as? HKStateOfMind
                    cont.resume(returning: som?.valence)
                }
                store.execute(q)
            }
        }

        async let wSpeed = latestSample(.walkingSpeed, unit: HKUnit.meter().unitDivided(by: .second()))
        async let wLen = latestSample(.walkingStepLength, unit: HKUnit.meter())
        async let wAsym = latestSample(.walkingAsymmetryPercentage, unit: .percent())
        async let wStead = latestSample(.appleWalkingSteadiness, unit: .percent())
        async let kcal = sumToday(.dietaryEnergyConsumed, unit: .kilocalorie())
        async let prot = sumToday(.dietaryProtein, unit: .gram())
        async let fat = sumToday(.dietaryFatTotal, unit: .gram())
        async let carb = sumToday(.dietaryCarbohydrates, unit: .gram())
        async let fiber = sumToday(.dietaryFiber, unit: .gram())
        async let water = sumToday(.dietaryWater, unit: .literUnit(with: .milli))
        async let alcCount = sumToday(.numberOfAlcoholicBeverages, unit: .count())

        let speedMs = await wSpeed
        let lenM = await wLen
        let asymPct = await wAsym
        let steadPct = await wStead

        return BodyRenewalHealthExtras(
            timeInDaylightMinutes: daylightMin,
            mindfulMinutesToday: mindfulMin,
            latestStateOfMindValence: stateOfMindValence,
            walkingSpeedKmh: speedMs.map { $0 * 3.6 },
            walkingStepLengthCm: lenM.map { $0 * 100.0 },
            walkingAsymmetryPercent: asymPct.map { $0 * 100.0 },
            walkingSteadinessPercent: steadPct.map { $0 * 100.0 },
            dietaryEnergyKcalToday: await kcal,
            dietaryProteinGToday: await prot,
            dietaryFatGToday: await fat,
            dietaryCarbsGToday: await carb,
            dietaryFiberGToday: await fiber,
            dietaryWaterMlToday: await water,
            alcoholicBeveragesToday: await alcCount
        )
    }
}
