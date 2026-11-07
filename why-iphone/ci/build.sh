#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/../iOS"
xcodebuild -version
for sdk in iphoneos iphonesimulator; do
 xcodebuild -project SuGWHY.xcodeproj -scheme SuGWHY -configuration Debug -sdk "$sdk" -destination "generic/platform=$([ "$sdk" = iphoneos ] && echo iOS || echo 'iOS Simulator')" -derivedDataPath "../build/$sdk" CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO build
done
echo 'UNSIGNED_BUILD_ONLY: this is not a signed IPA, TestFlight release, or physical iPhone verification.'
