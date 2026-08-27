# S.u.G MEMBER iOS Native Shell

The iOS app in `ios/SuGMember` now uses a native SwiftUI `TabView` with four persistent `WKWebView` instances:

- BODY
- QUEST
- WALK
- 会員証

Each tab keeps its own web view alive, so switching tabs does not recreate the page or add Safari browser chrome. BODY opens the member app directly instead of nesting `member-hub.html` inside another iframe.

The GitHub Actions workflow `.github/workflows/ios-native-shell-build.yml` generates the Xcode project with XcodeGen and verifies an iPhone Simulator build with Xcode.

Current native shell version target: V26.5.242.
