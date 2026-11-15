#!/usr/bin/env bash
set -euo pipefail
WORK="$RUNNER_TEMP/evolink-20261115"
mkdir -p "$WORK/proof"
XCODE_APP='/Applications/Xcode_26.6.app'
if [ ! -d "$XCODE_APP" ]; then
  XCODE_APP="$(find /Applications -maxdepth 1 -type d -name 'Xcode_26.*.app' | grep -v -i beta | sort -V | tail -1)"
fi
test -n "$XCODE_APP"
export DEVELOPER_DIR="$XCODE_APP/Contents/Developer"
xcodebuild -version | tee "$WORK/proof/xcode-version.txt"
SDK="$(xcrun --sdk iphoneos --show-sdk-version)"
printf '%s\n' "$SDK" | tee "$WORK/proof/iphoneos-sdk.txt"
case "$SDK" in 26.*|27.*) ;; *) echo 'Unsupported iPhoneOS SDK'; exit 1 ;; esac
command -v xcodegen >/dev/null || brew install xcodegen
KEYCHAIN="$WORK/temporary.keychain-db"
KEYCHAIN_PASSWORD="$(uuidgen)"
security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN"
security set-keychain-settings -lut 21600 "$KEYCHAIN"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN"
security import "$WORK/distribution.p12" -P "$EVOLINK_SIGN_PASSWORD" -A -t cert -f pkcs12 -k "$KEYCHAIN"
security list-keychains -d user -s "$KEYCHAIN" login.keychain-db
security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN"
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
cp "$WORK/existing.mobileprovision" "$HOME/Library/MobileDevice/Provisioning Profiles/$EVOLINK_PROFILE_UUID.mobileprovision"
cd "$WORK/source"
xcodegen generate
xcodebuild -project SuGEvolink.xcodeproj -scheme SuGEvolink -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$WORK/EVOLINK.xcarchive" PRODUCT_BUNDLE_IDENTIFIER=jp.sugosaka.evolink \
  CURRENT_PROJECT_VERSION="$EVOLINK_BUILD_NUMBER" DEVELOPMENT_TEAM="$EVOLINK_TEAM" CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY='Apple Distribution' PROVISIONING_PROFILE_SPECIFIER="$EVOLINK_PROFILE" archive 2>&1 | tee "$WORK/proof/archive.log"
xcodebuild -exportArchive -archivePath "$WORK/EVOLINK.xcarchive" -exportPath "$WORK/ipa" \
  -exportOptionsPlist "$WORK/ExportOptions.plist" 2>&1 | tee "$WORK/proof/export.log"
