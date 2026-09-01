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
    @Published var recentLabResults: [HealthLabResultSummary] = []
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
            HKCategoryType.categoryType(forIdentifier: .sleepAnalysis),
            HKObjectType.clinicalType(forIdentifier: .labResultRecord)
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
        async let labs = fetchRecentLabResults(limit: 50)
        async let hrvBaseline = fetchAverageQuantity(identifier: .heartRateVariabilitySDNN, unit: HKUnit.secondUnit(with: .milli), days: 14)
        async let rhrBaseline = fetchAverageQuantity(identifier: .restingHeartRate, unit: HKUnit.count().unitDivided(by: .minute()), days: 14)
        async let rrBaseline = fetchAverageQuantity(identifier: .respiratoryRate, unit: HKUnit.count().unitDivided(by: .minute()), days: 14)

        let stepsValue = await s
        let distanceValue = await d
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
        let labsValue = await labs
        let hrvBaselineValue = await hrvBaseline
        let rhrBaselineValue = await rhrBaseline
        let rrBaselineValue = await rrBaseline

        steps = stepsValue
        walkingDistanceKm = distanceValue
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
        recentLabResults = labsValue

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

    private func fetchTodayCumulative(identifier: HKQuantityTypeIdentifier, unit: HKUnit) async -> Double {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { return 0 }
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: todayPredicate(), options: .cumulativeSum) { _, stats, _ in
                continuation.resume(returning: stats?.sumQuantity()?.doubleValue(for: unit) ?? 0)
            }
            store.execute(query)
        }
    }

    private func fetchAverageQuantity(identifier: HKQuantityTypeIdentifier, unit: HKUnit, days: Int) async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { return nil }
        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -max(1, days), to: end) ?? end.addingTimeInterval(-86400 * Double(max(1, days)))
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .discreteAverage) { _, stats, _ in
                continuation.resume(returning: stats?.averageQuantity()?.doubleValue(for: unit))
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

    private func fetchRecentLabResults(limit: Int) async -> [HealthLabResultSummary] {
        guard let type = HKObjectType.clinicalType(forIdentifier: .labResultRecord) else { return [] }
        return await withCheckedContinuation { continuation in
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(sampleType: type, predicate: nil, limit: limit, sortDescriptors: [sort]) { _, samples, _ in
                let formatter = ISO8601DateFormatter()
                let results = (samples as? [HKClinicalRecord] ?? []).map { record in
                    Self.parseLabRecord(record, fallbackDate: formatter.string(from: record.endDate))
                }
                continuation.resume(returning: results)
            }
            store.execute(query)
        }
    }

    nonisolated private static func parseLabRecord(_ record: HKClinicalRecord, fallbackDate: String) -> HealthLabResultSummary {
        guard
            let resource = record.fhirResource,
            let json = try? JSONSerialization.jsonObject(with: resource.data) as? [String: Any]
        else {
            return HealthLabResultSummary(
                name: record.displayName,
                value: nil,
                unit: nil,
                referenceRange: nil,
                interpretation: nil,
                effectiveDateISO: fallbackDate,
                sourceName: record.source.name
            )
        }

        let code = json["code"] as? [String: Any]
        let coding = (code?["coding"] as? [[String: Any]])?.first
        let name = (code?["text"] as? String) ?? (coding?["display"] as? String) ?? record.displayName

        var value: String?
        var unit: String?
        if let q = json["valueQuantity"] as? [String: Any] {
            if let number = q["value"] as? NSNumber { value = number.stringValue }
            else if let text = q["value"] as? String { value = text }
            unit = (q["unit"] as? String) ?? (q["code"] as? String)
        } else if let text = json["valueString"] as? String {
            value = text
        } else if let concept = json["valueCodeableConcept"] as? [String: Any] {
            let conceptCoding = (concept["coding"] as? [[String: Any]])?.first
            value = (concept["text"] as? String) ?? (conceptCoding?["display"] as? String) ?? (conceptCoding?["code"] as? String)
        }

        var referenceRange: String?
        if let range = (json["referenceRange"] as? [[String: Any]])?.first {
            let low = (range["low"] as? [String: Any])?["value"]
            let high = (range["high"] as? [String: Any])?["value"]
            let rangeUnit = ((range["low"] as? [String: Any])?["unit"] as? String) ?? ((range["high"] as? [String: Any])?["unit"] as? String)
            let lowText = (low as? NSNumber)?.stringValue ?? (low as? String)
            let highText = (high as? NSNumber)?.stringValue ?? (high as? String)
            if let lowText, let highText { referenceRange = "\(lowText)-\(highText)\(rangeUnit.map { " \($0)" } ?? "")" }
            else if let lowText { referenceRange = ">= \(lowText)\(rangeUnit.map { " \($0)" } ?? "")" }
            else if let highText { referenceRange = "<= \(highText)\(rangeUnit.map { " \($0)" } ?? "")" }
            else if let text = range["text"] as? String { referenceRange = text }
        }

        var interpretation: String?
        if let first = (json["interpretation"] as? [[String: Any]])?.first {
            let interpretationCoding = (first["coding"] as? [[String: Any]])?.first
            interpretation = (first["text"] as? String) ?? (interpretationCoding?["display"] as? String) ?? (interpretationCoding?["code"] as? String)
        }

        let effectiveDate = (json["effectiveDateTime"] as? String) ?? (json["issued"] as? String) ?? fallbackDate
        return HealthLabResultSummary(
            name: name,
            value: value,
            unit: unit,
            referenceRange: referenceRange,
            interpretation: interpretation,
            effectiveDateISO: effectiveDate,
            sourceName: record.source.name
        )
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
            case 7.5...9.5: recovery += 15; stress -= 10
            case 6.5..<7.5: recovery += 5; stress -= 3
            case 5.5..<6.5: recovery -= 10; stress += 10
            case ..<5.5: recovery -= 25; stress += 20
            default: recovery += 5
            }
        }

        if let hrvMs, let baseline = hrvBaselineMs, baseline > 0 {
            signals += 1
            let ratio = hrvMs / baseline
            if ratio >= 1.10 { recovery += 10; stress -= 10 }
            else if ratio < 0.80 { recovery -= 20; stress += 20 }
            else if ratio < 0.90 { recovery -= 10; stress += 10 }
        }

        if let restingHeartRate, let baseline = restingHeartRateBaseline, baseline > 0 {
            signals += 1
            let ratio = restingHeartRate / baseline
            if ratio <= 0.95 { recovery += 8; stress -= 5 }
            else if ratio > 1.10 { recovery -= 15; stress += 15 }
            else if ratio > 1.05 { recovery -= 8; stress += 8 }
        }

        if let respiratoryRate, let baseline = respiratoryRateBaseline, baseline > 0 {
            signals += 1
            let ratio = respiratoryRate / baseline
            if ratio > 1.10 { recovery -= 8; stress += 10 }
            else if ratio > 1.05 { recovery -= 4; stress += 5 }
        }

        if let oxygenSaturationPercent {
            signals += 1
            if oxygenSaturationPercent < 92 { recovery -= 15; stress += 12 }
            else if oxygenSaturationPercent < 95 { recovery -= 8; stress += 8 }
        }

        let formatter = ISO8601DateFormatter()
        let cutoff = Date().addingTimeInterval(-86400)
        let last24hMinutes = workouts.reduce(0.0) { total, workout in
            guard let end = formatter.date(from: workout.endDateISO), end >= cutoff else { return total }
            return total + workout.durationMinutes
        }
        if last24hMinutes > 0 {
            signals += 1
            if last24hMinutes >= 120 { recovery -= 10; stress += 8 }
            else if last24hMinutes >= 60 { recovery -= 5; stress += 4 }
        }

        guard signals >= 2 else { return (nil, nil, nil, nil, Double(signals) / 6.0) }
        let recoveryInt = Int(min(100, max(0, recovery)).rounded())
        let stressInt = Int(min(100, max(0, stress)).rounded())
        let recoveryLabel: String = recoveryInt >= 80 ? "回復良好" : recoveryInt >= 60 ? "概ね回復" : recoveryInt >= 40 ? "回復不足" : "強い回復不足"
        let stressLabel: String = stressInt < 30 ? "低い" : stressInt < 50 ? "通常域" : stressInt < 70 ? "高め" : "かなり高い"
        return (recoveryInt, stressInt, recoveryLabel, stressLabel, min(1, Double(signals) / 6.0))
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
