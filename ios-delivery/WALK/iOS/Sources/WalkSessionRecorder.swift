import Foundation
import CoreLocation
import Combine
import UIKit

/// Native WALK owner; foreground bridge delivers ephemeral fixes.
/// Owns only native WALK summaries; never modifies web/HealthKit/card storage.
@MainActor
final class WalkSessionRecorder: NSObject, ObservableObject, CLLocationManagerDelegate {
    enum Phase: String, Codable { case ready, recording, paused, interrupted, finished }
    struct RoutePoint: Codable { var lat: Double; var lng: Double; var time: Double }
    @Published var recordRoute = false
    struct Summary: Codable {
        var route: [RoutePoint]?
        var importedAt: Date?
        var schema = 1
        var id = UUID()
        var source = "ios-core-location"
        var phase: Phase = .ready
        var meters = 0.0
        var seconds = 0.0
        var acceptedFixes = 0
        var rejectedFixes = 0
        var accuracyMeters: Double?
        var updatedAt = Date()
    }
    @Published private(set) var summary = Summary()
    @Published private(set) var message = "開始ボタンを押した間だけ位置情報を取得します。"
    private let manager = CLLocationManager()
    private(set) var latestFix: CLLocation?
    private var anchor: CLLocation?
    private var previous: CLLocation?
    private var tickUptime: TimeInterval?
    private var pendingStart = false
    private var storageReadable = true
    private let directory: URL

    var elapsedSeconds: Double {
        summary.seconds + (tickUptime.map { max(0, ProcessInfo.processInfo.systemUptime - $0) } ?? 0)
    }

    override init() {
        directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("SUGNativeWalkV1", isDirectory: true)
        super.init()
        manager.delegate = self
        manager.activityType = .fitness
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 5
        manager.pausesLocationUpdatesAutomatically = true
        manager.showsBackgroundLocationIndicator = true
        let checkpoint = directory.appendingPathComponent("checkpoint.json")
        if FileManager.default.fileExists(atPath: checkpoint.path) {
            do {
                let saved = try JSONDecoder().decode(Summary.self, from: Data(contentsOf: checkpoint))
                guard saved.schema == 1, saved.source == "ios-core-location",
                      saved.meters.isFinite, saved.meters >= 0, saved.seconds.isFinite, saved.seconds >= 0,
                      saved.acceptedFixes >= 0, saved.rejectedFixes >= 0 else { throw CocoaError(.fileReadCorruptFile) }
                summary = saved
                let finishedFile = directory.appendingPathComponent(saved.id.uuidString + ".json")
                if FileManager.default.fileExists(atPath: finishedFile.path) {
                    let finished = try JSONDecoder().decode(Summary.self, from: Data(contentsOf: finishedFile))
                    guard finished.id == saved.id, finished.schema == 1,
                          finished.source == "ios-core-location", finished.phase == .finished,
                          finished.meters.isFinite, finished.meters >= 0,
                          finished.seconds.isFinite, finished.seconds >= 0 else { throw CocoaError(.fileReadCorruptFile) }
                    summary = finished
                }
                if summary.phase == .recording {
                    summary.phase = .interrupted
                    message = "前回の記録は中断されました。保存済み区間を保持しています。再開にはボタン操作が必要です。"
                }
            } catch {
                storageReadable = false
                message = "保存済み記録を読み込めません。元ファイルを保全し、新しい記録を停止しています。"
            }
        }
    }

    func reportConnectionIssue() {
        if summary.phase != .recording { message = "WALK画面のネイティブ接続を確認できません。読込完了後に再試行してください。" }
    }

    /// Called only by a native, foreground user action. No automatic resume on launch.
    func startFromUserAction() {
        guard summary.phase != .recording, storageReadable else { return }
        guard UIApplication.shared.applicationState == .active else {
            message = "アプリを開いてから開始してください。"; return
        }
        let modes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String] ?? []
        let purpose = Bundle.main.object(forInfoDictionaryKey: "NSLocationWhenInUseUsageDescription") as? String ?? ""
        guard modes.contains("location"), !purpose.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            message = "未接続：Location updatesと位置情報利用目的説明のビルド設定が必要です。"; return
        }
        switch manager.authorizationStatus {
        case .notDetermined:
            pendingStart = true
            message = "位置情報の許可を待っています。"
            manager.requestWhenInUseAuthorization()
        case .authorizedAlways, .authorizedWhenInUse:
            beginAuthorized()
        default:
            pendingStart = false
            message = "位置情報が拒否または制限されています。設定を確認してください。"
        }
    }

    private func beginAuthorized() {
        pendingStart = false
        guard UIApplication.shared.applicationState == .active else {
            message = "許可を確認しました。アプリを開き、もう一度開始してください。"; return
        }
        guard manager.accuracyAuthorization == .fullAccuracy else {
            message = "正確な位置情報が無効です。距離の誤記録を避けるため開始していません。"; return
        }
        if summary.phase == .finished { summary = Summary() }
        latestFix = nil; anchor = nil; previous = nil
        summary.phase = .recording
        summary.accuracyMeters = nil
        tickUptime = ProcessInfo.processInfo.systemUptime
        guard checkpoint() else { return }
        manager.allowsBackgroundLocationUpdates = true
        manager.startUpdatingLocation()
        message = "ネイティブ歩行記録中。画面ロック中も記録を試みます。OSによる中断はあり得ます。"
    }

    func pauseFromUserAction() { pause("一時停止しました。停止中の位置情報は取得しません。") }
    private func pause(_ text: String) {
        pendingStart = false
        advanceTime()
        tickUptime = nil
        manager.stopUpdatingLocation()
        manager.allowsBackgroundLocationUpdates = false
        latestFix = nil; anchor = nil; previous = nil
        summary.accuracyMeters = nil
        if summary.phase == .recording { summary.phase = .paused }
        message = text
        _ = checkpoint()
    }

    func finishFromUserAction() {
        guard storageReadable, summary.phase != .ready, summary.phase != .finished else { return }
        if summary.acceptedFixes == 0 { pause("GPSの有効な測位がないため履歴には保存しません。"); return }
        pause("歩行を保存しています。")
        guard storageReadable else { return }
        let prior = summary.phase
        summary.phase = .finished
        summary.updatedAt = Date()
        do {
            let data = try JSONEncoder().encode(summary)
            let file = directory.appendingPathComponent(summary.id.uuidString + ".json")
            // A finished session ID is never reused. Do not overwrite an existing history item.
            guard !FileManager.default.fileExists(atPath: file.path) else { throw CocoaError(.fileWriteFileExists) }
            try data.write(to: file, options: [.withoutOverwriting, .completeFileProtectionUntilFirstUserAuthentication])
            if checkpoint() { message = "ネイティブ歩行記録を端末内に保存しました。Web表示はアプリ前景時に更新します。" }
        } catch {
            summary.phase = prior
            message = "履歴を保存できません。現在の記録を保持しています。"
        }
    }

    private func advanceTime() {
        if let last = tickUptime {
            let now = ProcessInfo.processInfo.systemUptime
            summary.seconds += max(0, now - last)
            tickUptime = now
        }
    }

    @discardableResult private func checkpoint() -> Bool {
        guard storageReadable else { return false }
        advanceTime()
        summary.updatedAt = Date()
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            var excluded = directory
            var values = URLResourceValues(); values.isExcludedFromBackup = true
            try excluded.setResourceValues(values)
            let data = try JSONEncoder().encode(summary)
            try data.write(to: directory.appendingPathComponent("checkpoint.json"),
                           options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
            return true
        } catch {
            manager.stopUpdatingLocation(); manager.allowsBackgroundLocationUpdates = false
            tickUptime = nil; latestFix = nil; anchor = nil; previous = nil; pendingStart = false
            summary.phase = .paused
            storageReadable = false
            message = "保存に失敗したため位置情報を停止しました。既存ファイルは削除しません。"
            return false
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            if summary.phase == .recording && manager.accuracyAuthorization != .fullAccuracy {
                pause("正確な位置情報が無効になったため停止しました。")
            } else if pendingStart { beginAuthorized() }
        case .denied, .restricted:
            if pendingStart || summary.phase == .recording { pause("位置情報の許可がないため停止しました。") }
        default: break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard summary.phase == .recording else { return }
        for fix in locations.sorted(by: { $0.timestamp < $1.timestamp }) {
            let age = Date().timeIntervalSince(fix.timestamp)
            guard CLLocationCoordinate2DIsValid(fix.coordinate), fix.horizontalAccuracy.isFinite,
                  fix.horizontalAccuracy >= 0, fix.horizontalAccuracy <= 50, age >= -5, age <= 20 else {
                summary.rejectedFixes += 1; summary.accuracyMeters = nil
                latestFix = nil; anchor = nil; previous = nil; continue
            }
            if let last = previous {
                let seconds = fix.timestamp.timeIntervalSince(last.timestamp)
                guard seconds > 0 else { continue }
                if seconds > 30 || fix.distance(from: last) / seconds > 3 {
                    summary.rejectedFixes += 1
                    latestFix = nil
                    anchor = fix; previous = fix; continue
                }
            }
            latestFix = fix
            summary.acceptedFixes += 1
            if recordRoute, (summary.route?.count ?? 0) < 5000 { if summary.route == nil { summary.route = [] }; summary.route?.append(RoutePoint(lat:fix.coordinate.latitude,lng:fix.coordinate.longitude,time:fix.timestamp.timeIntervalSince1970)) }
            summary.accuracyMeters = fix.horizontalAccuracy
            if let origin = anchor {
                let meters = fix.distance(from: origin)
                if meters >= max(4, (origin.horizontalAccuracy + fix.horizontalAccuracy) / 2) {
                    summary.meters += meters; anchor = fix
                }
            } else { anchor = fix }
            previous = fix
        }
        _ = checkpoint()
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        guard summary.phase == .recording else { return }
        if let e = error as? CLError, e.code == .locationUnknown {
            latestFix = nil; anchor = nil; previous = nil; summary.accuracyMeters = nil
            message = "測位できません。距離は加算せず、位置情報の回復を待っています。"
            _ = checkpoint()
        } else { pause("位置情報エラーで停止しました。アプリを開いて確認してください。") }
    }

    func locationManagerDidPauseLocationUpdates(_ manager: CLLocationManager) {
        if summary.phase == .recording { pause("OSが測位を休止しました。再開には開始ボタンを押してください。") }
    }
}


extension WalkSessionRecorder {
    struct HistoryBackup: Codable { var schema = "sug-walk-native-history-v1"; var sessions: [Summary] }
    private func validateHistory(_ value: Summary) throws {
        guard value.schema == 1, value.source == "ios-core-location", value.phase == .finished,
              value.meters.isFinite, value.meters >= 0, value.meters <= 1_000_000,
              value.seconds.isFinite, value.seconds >= 0, value.seconds <= 31_536_000,
              value.acceptedFixes > 0, value.rejectedFixes >= 0, (value.route?.count ?? 0) <= 5000,
              value.route?.allSatisfy({ $0.lat.isFinite && abs($0.lat) <= 90 && $0.lng.isFinite && abs($0.lng) <= 180 && $0.time.isFinite }) ?? true else { throw CocoaError(.fileReadCorruptFile) }
    }
    func savedHistory() throws -> [Summary] {
        guard FileManager.default.fileExists(atPath: directory.path) else { return [] }
        let files = try FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.fileSizeKey]).filter { UUID(uuidString: $0.deletingPathExtension().lastPathComponent) != nil && $0.pathExtension == "json" }
        guard files.count <= 10000 else { throw CocoaError(.fileReadTooLarge) }
        return try files.map { url in
            guard (try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? Int.max) <= 2*1024*1024 else { throw CocoaError(.fileReadTooLarge) }
            let value = try JSONDecoder().decode(Summary.self, from: Data(contentsOf: url)); try validateHistory(value); return value
        }.sorted { $0.updatedAt > $1.updatedAt }
    }
    func exportHistory() throws -> Data { try JSONEncoder().encode(HistoryBackup(sessions: savedHistory())) }
    func importHistory(_ data: Data) throws {
        guard data.count <= 20*1024*1024 else { throw CocoaError(.fileReadTooLarge) }
        let backup = try JSONDecoder().decode(HistoryBackup.self, from: data)
        guard backup.schema == "sug-walk-native-history-v1", backup.sessions.count <= 10000,
              Set(backup.sessions.map(\.id)).count == backup.sessions.count else { throw CocoaError(.fileReadCorruptFile) }
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
        var staged: [(URL,Data)] = []
        for var value in backup.sessions {
            try validateHistory(value)
            let file = directory.appendingPathComponent(value.id.uuidString + ".json")
            if FileManager.default.fileExists(atPath: file.path) {
                var current = try JSONDecoder().decode(Summary.self, from: Data(contentsOf: file))
                current.importedAt = nil; value.importedAt = nil
                guard try encoder.encode(current) == encoder.encode(value) else { throw CocoaError(.fileWriteFileExists) }; continue
            }
            value.importedAt = Date(); staged.append((file,try encoder.encode(value)))
        }
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        var written: [URL] = []
        do { for (file,bytes) in staged { try bytes.write(to:file,options:[.withoutOverwriting,.completeFileProtectionUntilFirstUserAuthentication]); written.append(file) } }
        catch { for file in written { try? FileManager.default.removeItem(at:file) }; throw error }
    }
}
