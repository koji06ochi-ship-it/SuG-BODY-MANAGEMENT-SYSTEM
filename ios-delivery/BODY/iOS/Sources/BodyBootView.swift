import SwiftUI

struct BodyBootView: View {
    @StateObject private var server = BundleHTTPServer(folder: "BodyFormal", port: 5411)

    var body: some View {
        Group {
            if server.ready {
                ContentView()
            } else {
                ZStack {
                    LinearGradient(
                        colors: [
                            Color(red: 1.0, green: 0.0, blue: 0.498),
                            Color(red: 1.0, green: 0.078, blue: 0.576),
                            Color(red: 1.0, green: 0.302, blue: 0.769)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .ignoresSafeArea()
                    VStack(spacing: 10) {
                        Text("S.u.G SWAG")
                            .font(.system(size: 28, weight: .black))
                            .foregroundColor(.white)
                        Text("OWN YOUR STYLE. LIVE YOUR LIFE.")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(red: 0.969, green: 0.878, blue: 0.620))
                        Text(server.error ?? "S.u.G SWAGを起動しています…")
                            .font(.footnote)
                            .foregroundColor(.white.opacity(0.92))
                            .padding(.top, 6)
                    }
                    .padding()
                }
            }
        }
        .task { server.start() }
    }
}
