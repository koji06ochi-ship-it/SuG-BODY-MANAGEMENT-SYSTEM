import Foundation
import CoreLocation
import Combine

@MainActor
final class WalkLocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published private(set) var isRecording = false
    @Published private(set) var distanceMeters = 0.0
    @Published private(set) var errorMessage: String?
    @Published private(set) var route: [CLLocationCoordinate2D] = []
    private let manager = CLLocationManager()
    private var previous: CLLocation?
    private var startedAt: Date?
    private var completedSeconds: TimeInterval = 0

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 5
        manager.pausesLocationUpdatesAutomatically = true
        manager.allowsBackgroundLocationUpdates = false
    }

    func start() {
        guard CLLocationManager.locationServicesEnabled() else {
            errorMessage = "位置情報サービスが無効です"
            return
        }
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
            errorMessage = "許可後にもう一度開始してください"
            return
        case .authorizedWhenInUse, .authorizedAlways:
            distanceMeters = 0
            route = []
            previous = nil
            completedSeconds = 0
            startedAt = Date()
            errorMessage = nil
            isRecording = true
            manager.startUpdatingLocation()
        default:
            errorMessage = "設定から位置情報の利用を許可してください"
        }
    }

    func stop() {
        guard isRecording else { return }
        completedSeconds = duration()
        isRecording = false
        startedAt = nil
        manager.stopUpdatingLocation()
    }

    func duration(at date: Date = Date()) -> TimeInterval {
        guard isRecording, let startedAt else { return completedSeconds }
        return max(0, date.timeIntervalSince(startedAt))
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard isRecording else { return }
        for location in locations {
            guard location.horizontalAccuracy >= 0, location.horizontalAccuracy <= 35,
                  abs(location.timestamp.timeIntervalSinceNow) < 15 else { continue }
            if let previous {
                let delta = location.distance(from: previous)
                let seconds = location.timestamp.timeIntervalSince(previous.timestamp)
                if seconds <= 0 || delta > 150 || delta / seconds > 12 { continue }
                distanceMeters += max(0, delta)
            }
            previous = location
            route.append(location.coordinate)
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        errorMessage = error.localizedDescription
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if manager.authorizationStatus == .denied || manager.authorizationStatus == .restricted {
            stop()
            errorMessage = "位置情報へのアクセスが許可されていません"
        }
    }
}
