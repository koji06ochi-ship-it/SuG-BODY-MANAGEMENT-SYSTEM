# S.u.G BODY iOS Actions integration — 2026-10-29

## Build 290 evidence

- Repository: `koji06ochi-ship-it/SuG-BODY-MANAGEMENT-SYSTEM`
- Current `main` HEAD checked before send: `b29b8e8ccf90b21eede51e3eaa9df02d830f7ee2`
- Proposed send branch: `codex/body-ios-build-291-review` created from that exact HEAD.
- Workflow path: `.github/workflows/ios-testflight.yml`
- Workflow name: `iOS TestFlight upload`
- Run: `37162890144`, run number `290`
- URL: https://github.com/koji06ochi-ship-it/SuG-BODY-MANAGEMENT-SYSTEM/actions/runs/37162890144
- Started: `2026-10-03T23:47:35Z` (2026-10-04 JST)
- Checked-out commit: `70ccc33af9c858f6c916310c53349d632b9c29ad`
- Bundle ID: `jp.sugosaka.member`
- Version/build: `1.0.0 (290)`
- Upload method: XcodeGen → signed `xcodebuild archive` → export IPA → `xcrun altool --upload-app` with an App Store Connect API key.

The run’s final job conclusion was failure because the post-upload state-marker step failed. The archive, export and upload steps succeeded, and the log recorded `UPLOAD SUCCEEDED with no errors`. Build 290 must remain preserved.

## Source comparison and integration

Build 290 loaded `apps/body/best-of-miss-demo-v27.76.html`. The isolated current app loads `apps/body/daily-preview/index.html`, which contains the latest seven-screen BODY, AI/HealthKit boundary, MAP and saved-record work. The current GitHub branch does not contain that daily-preview entry, so changing only Swift would produce a missing page.

The isolated copy now:

1. Packages the current daily-preview runtime and BODY assets into `ios/BodyWeb`.
2. Embeds `BodyWeb` through XcodeGen.
3. Loads `BodyWeb/index.html` from the app bundle first.
4. Preserves the existing HealthKit `WKScriptMessageHandler` and read-only Swift manager.
5. Keeps `jp.sugosaka.member` and `1.0.0`; proposes build `291` and rejects 290 or lower.
6. Requires the existing Bundle ID, existing HealthKit capability and existing App Store app. Missing Apple records cause a hard failure; the workflow cannot create them.
7. Uses manual `workflow_dispatch` only. It has no schedule, push trigger, repository write permission or state commit.

The existing `ios-native-shell-build.yml` runs automatically for `ios/**` pushes to `main`. Sending directly to `main` would therefore start an Action before a separate Actions approval. The prepared send target is a new review branch, `codex/body-ios-build-291-review`, based on the checked `main` HEAD. Existing **push** workflows do not match that branch/path combination, and GitHub Pages remains on the default branch. However, that workflow also listens to `pull_request` changes under `ios/**`; opening a PR would start it. Push approval must not be treated as PR or Actions approval.

## Signing and secret handling

The certificate/profile helper and key normalizer remain based on the build-290 scripts. The workflow creates signing material for the runner, installs it in a temporary keychain, uploads with the existing API key, and revokes the temporary signing assets in the always-running cleanup step.

Required GitHub secret names are `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, and `ASC_API_KEY_P8`. Values must stay in GitHub Actions secrets. They must not be placed in YAML, source, artifacts, chat, logs or the send package.

## Actions cost and allowance

The repository is currently public and the workflow uses the standard GitHub-hosted label `macos-26`. GitHub documents standard hosted runners as free and unlimited for public repositories. Therefore the execution-minute charge is currently $0. Artifact storage still uses the account allowance; the workflow retains only the exported IPA for three days. If repository visibility changes to private, the cost must be reassessed before dispatch.

## Static validation result

- Release boundary after publication fixes: 40/40 PASS.
- Build-291 package boundary: 22/22 PASS.
- BODY package: 65 manifest entries, 9,463,491 bytes.
- Deterministic package manifest: PASS.
- Packaged JavaScript: 43/43 syntax PASS.
- Supabase absent-config runtime: 8/8 PASS, 0 network requests.
- `Info.plist` and entitlements: XML parse PASS.
- Xcode archive, signing, export, upload and iPhone operation: not run on Windows.

## Approval gate

No branch creation, Git push, Actions dispatch, signing call, TestFlight upload or App Store change was performed. The audited full manifest is `ios-github-send-manifest-audited-20261030.json`. It is buildable but blocked from the public repository pending explicit publication permission for 16 original image assets. The separate 65-file public-code package is review-only and must not be used to run the workflow. See `IOS-PUBLICATION-AUDIT-20261030.md` before requesting the review-branch push. A later dispatch must still use build 291 or higher and explicitly enter `UPLOAD`.
