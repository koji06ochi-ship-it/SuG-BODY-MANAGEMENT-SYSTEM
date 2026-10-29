# iOS / HealthKit build readiness

This isolated copy targets the existing App Store Connect app only:

- App: `S.u.G`
- Bundle ID: `jp.sugosaka.member`
- Marketing version: `1.0.0`
- Preserved uploaded build: `290`
- Proposed next build: `291`

The workflow fails unless the Bundle ID, HealthKit capability and App Store Connect app already exist. It does not create a new App ID, app record or capability. Upload is manual only and requires the dispatch input `UPLOAD` plus a build number greater than 290.

`project.yml` embeds `BodyWeb` as a folder resource. `package_body_web.cjs` builds that resource from the current `apps/body/daily-preview` source before XcodeGen runs. `ContentView.swift` loads the embedded HTML first and retains the remote daily-preview URL only as a fallback.

Read-only HealthKit support covers steps, heart rate, sleep, active energy and basal/resting energy. The web bridge asks only after a member action. `Info.plist` contains the read explanation and `SuGMember.entitlements` contains `com.apple.developer.healthkit=true`.

## Verified on Windows

- Bundle ID, version, next build number, entitlement path and BODY resource configuration: static validation.
- BODY packaging: 65 manifest entries, 9,462,932 bytes, deterministic manifest SHA-256 `FEF83F937440356B331750B02FD8F05FCFC709B33EEB9B0DBFA3DDDE95A0DCC6`.
- Packaged JavaScript syntax: 43/43 PASS.
- Release boundary validation: 33/33 PASS.
- `Info.plist` and entitlements: XML parse PASS.

## Requires the existing GitHub Actions environment

- XcodeGen generation, Xcode 26 archive, Apple Distribution signing, provisioning profile installation, archive entitlement inspection, IPA export and TestFlight upload.
- The existing App Store Connect API values must be supplied only through GitHub Actions secrets: `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_P8`.
- No `.p8`, certificate, profile, token or secret value is stored in this isolated copy or the send package.

Windows does not provide Xcode, XcodeGen or Swift compilation in this workspace. Therefore archive, IPA, HealthKit entitlement after codesigning, TestFlight processing and iPhone operation are not marked PASS.

## 2026-10-30 public-release gate

Build 291 inputs now pass the Windows static/publication checks described in `IOS-PUBLICATION-AUDIT-20261030.md`. The full 81-file package remains blocked from this public repository because publication permission is not recorded for 16 original image assets. The 65-file code-only review package is safe for review but is not a runnable build. Do not dispatch the workflow from it.

No Git push, Actions run, signing request, archive, IPA, or TestFlight upload occurred in this audit.
