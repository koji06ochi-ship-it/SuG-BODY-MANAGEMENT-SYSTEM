import SwiftUI

@main
struct SuGEvolinkApp: App {
    var body: some Scene {
        WindowGroup {
            EvolinkBootView()
                .preferredColorScheme(.dark)
        }
    }
}
