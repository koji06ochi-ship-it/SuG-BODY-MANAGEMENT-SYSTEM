import Foundation
import Darwin

/// macOS-only harness for the ACTUAL app server source. Not an AI or iPhone test.
@main struct ListenerProbe {
    static func main() {
        let args = CommandLine.arguments
        guard args.count == 4, let port = UInt16(args[2]) else { exit(64) }
        let folder = args[1], mode = args[3]
        let server = BundleHTTPServer(folder: folder, port: port)
        var announced = false
        func emit(_ state: String) {
            var object: [String: Any] = ["state":state,"port":port,"error":server.error ?? "none"]
            #if REPAIRED
            object["diagnostics"] = server.diagnostics
            #endif
            let bytes = try! JSONSerialization.data(withJSONObject:object,options:[.sortedKeys])
            print(String(data:bytes,encoding:.utf8)!);fflush(stdout)
        }
        server.start()
        _ = Timer.scheduledTimer(withTimeInterval:0.05,repeats:true) { _ in
            if !announced, server.ready {
                announced = true;emit("ready")
                if mode == "observe" { exit(0) }
            } else if !announced, server.error != nil {
                announced = true;emit("error_reported");exit(0)
            }
        }
        _ = Timer.scheduledTimer(withTimeInterval:30,repeats:false) { _ in emit("timeout");exit(70) }
        RunLoop.main.run()
    }
}
