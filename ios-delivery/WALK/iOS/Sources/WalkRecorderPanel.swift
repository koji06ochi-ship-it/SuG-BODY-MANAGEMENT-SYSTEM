import SwiftUI

/// Native WALK controls; device behavior requires validation.
/// Native controls avoid granting arbitrary web pages authority to start GPS.
struct WalkRecorderPanel: View {
    @ObservedObject var recorder: WalkSessionRecorder
    let start: () -> Void
    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { _ in
            VStack(alignment: .leading, spacing: 12) {
                Text("ネイティブWALK").font(.headline)
                Text("\(Int(recorder.summary.meters)) m · \(Int(recorder.elapsedSeconds)) 秒")
                    .font(.title2).monospacedDigit()
                Text(recorder.message).font(.callout)
                HStack {
                    Button("開始・再開", action: start)
                        .disabled(recorder.summary.phase == .recording)
                    Button("一時停止") { recorder.pauseFromUserAction() }
                    Button("停止・保存") { recorder.finishFromUserAction() }
                        .disabled(recorder.summary.phase == .ready || recorder.summary.phase == .finished)
                }.buttonStyle(.bordered).controlSize(.large)
                Text("記録の担当はiOSです。Webとは合算しません。画面読込後に開始してください。常時動作は保証されません。")
                    .font(.footnote)
            }.padding()
        }
    }
}
