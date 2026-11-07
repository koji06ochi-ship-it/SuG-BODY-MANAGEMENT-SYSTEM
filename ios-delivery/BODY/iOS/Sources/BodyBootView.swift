import SwiftUI
struct BodyBootView: View { @StateObject private var server=BundleHTTPServer(folder:"BodyFormal",port:5411); var body:some View { Group { if server.ready { ContentView() } else { Text(server.error ?? "S.u.G BODYを起動しています…").padding() } }.task { server.start() } } }
