#!/bin/bash
set -euo pipefail
app="${1:?BODY, eVo or WALK required}"
case "$app" in BODY) scheme=SuGBODY;; eVo) scheme=SuGeVo;; WALK) scheme=SuGWALK;; *) echo 'Unsupported app or WAY source missing' >&2; exit 2;; esac
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
node ci/validate.mjs --app "$app"
while IFS= read -r file; do plutil -lint "$file"; done < <(find "$app/iOS" -type f \( -name '*.plist' -o -name '*.entitlements' -o -name '*.xcprivacy' -o -name 'project.pbxproj' \))
xcodebuild -version
work_root="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
for sdk in iphoneos iphonesimulator; do
  if [[ "$sdk" == iphoneos ]]; then destination='generic/platform=iOS'; else destination='generic/platform=iOS Simulator'; fi
  xcodebuild -project "$app/iOS/$scheme.xcodeproj" -scheme "$scheme" \
    -configuration Debug -sdk "$sdk" -destination "$destination" \
    -derivedDataPath "$work_root/sug-ios-$app-$sdk" \
    CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY='' \
    DEVELOPMENT_TEAM='' COMPILER_INDEX_STORE_ENABLE=NO build
done
# No certificate/profile creation, upload, provisioning, Apple API calls or artifact publication.
