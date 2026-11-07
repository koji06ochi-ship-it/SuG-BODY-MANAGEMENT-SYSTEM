#!/bin/bash
# Must run on the separately approved ephemeral Mac runner with this batch's signing assets.
set -euo pipefail
test "${SUG_SIGNING_APPROVED:-}" = yes || { echo 'Signing approval required'; exit 65; }
root="${1:?source root required}"
app="${2:?app required}"
work="${3:?batch signing directory required}"
case "$app" in BODY) scheme=SuGBODY;bundle=jp.sugosaka.member;;eVo) scheme=SuGeVo;bundle=jp.sugosaka.evolink;;WALK) scheme=SuGWALK;bundle=jp.sugosaka.walk;;WAY) scheme=SuGWAY;bundle=jp.sugosaka.way;;GLOW) scheme=SuGGLOW;bundle=jp.sugosaka.glow;;oTo) scheme=SuGoTo;bundle=jp.sugosaka.oto;;*) exit 2;;esac
if [[ "$app" == WAY ]] && grep -q 'WAY_SOURCE_MISSING' "$root/WAY/iOS/Sources/WAYSourceMissing.swift";then echo 'WAY source is missing; not a signed placeholder';exit 64;fi
test -n "${RUNNER_TEMP:-}"; test -n "${SUG_BUILD_NUMBER:-}"
case "$SUG_BUILD_NUMBER" in ''|0|*[!0-9]*) echo 'Unique positive build number required';exit 2;;esac
profile="$work/$app.mobileprovision"
decoded="$work/$app.profile.plist"
security cms -D -i "$profile" > "$decoded"
team=$(/usr/libexec/PlistBuddy -c 'Print :TeamIdentifier:0' "$decoded")
uuid=$(/usr/libexec/PlistBuddy -c 'Print :UUID' "$decoded")
profile_name=$(/usr/libexec/PlistBuddy -c 'Print :Name' "$decoded")
identifier=$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' "$decoded")
test "$identifier" = "$team.$bundle"
if [[ "$app" == BODY || "$app" == WALK || "$app" == eVo ]];then /usr/libexec/PlistBuddy -c 'Print :Entitlements:com.apple.developer.healthkit' "$decoded" | grep -qi true;fi
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
cp "$profile" "$HOME/Library/MobileDevice/Provisioning Profiles/$uuid.mobileprovision"
archive="$RUNNER_TEMP/$scheme-$SUG_BUILD_NUMBER.xcarchive"
test ! -e "$archive"
xcodebuild -project "$root/$app/iOS/$scheme.xcodeproj" -scheme "$scheme" -configuration Release -destination 'generic/platform=iOS' -archivePath "$archive" DEVELOPMENT_TEAM="$team" CURRENT_PROJECT_VERSION="$SUG_BUILD_NUMBER" CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY='Apple Distribution' PROVISIONING_PROFILE_SPECIFIER="$profile_name" archive
product="$archive/Products/Applications/$scheme.app"
test "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$product/Info.plist")" = "$bundle"
codesign --verify --deep --strict "$product"
node "$root/ci/bundle-contract.mjs" --root "$root" --app "$app" --product "$product"
options="$work/$app.ExportOptions.plist"
TEAM_ID="$team" BUNDLE_ID="$bundle" PROFILE_NAME="$profile_name" OPTIONS_PATH="$options" python3 - <<'PY'
import os,plistlib
with open(os.environ['OPTIONS_PATH'],'xb') as f:
    plistlib.dump({'method':'app-store-connect','destination':'export','signingStyle':'manual','teamID':os.environ['TEAM_ID'],'provisioningProfiles':{os.environ['BUNDLE_ID']:os.environ['PROFILE_NAME']}},f)
PY
export_dir="$RUNNER_TEMP/$scheme-$SUG_BUILD_NUMBER-ipa"
test ! -e "$export_dir"
xcodebuild -exportArchive -archivePath "$archive" -exportPath "$export_dir" -exportOptionsPlist "$options"
ipa=$(find "$export_dir" -maxdepth 1 -name '*.ipa' -print -quit);test -n "$ipa"
if [[ "${SUG_UPLOAD_APPROVED:-}" != yes ]];then echo 'IPA built locally; upload is not approved';exit 0;fi
# Existing API key only; never echo the private key and never retry an upload.
test -n "${ASC_API_KEY_ID:-}";test -n "${ASC_API_ISSUER_ID:-}";test -n "${ASC_API_KEY_P8:-}"
mkdir -p "$HOME/.appstoreconnect/private_keys"
python3 - <<'PY'
import os,base64,pathlib
raw=os.environ['ASC_API_KEY_P8'].strip().replace('\\n','\n');data=raw.encode() if raw.startswith('-----BEGIN ') else base64.b64decode(raw,validate=True)
p=pathlib.Path.home()/'.appstoreconnect/private_keys'/('AuthKey_'+os.environ['ASC_API_KEY_ID']+'.p8');p.write_bytes(data);p.chmod(0o600)
PY
xcrun altool --upload-app --type ios --file "$ipa" --apiKey "$ASC_API_KEY_ID" --apiIssuer "$ASC_API_ISSUER_ID"
echo "$app upload accepted by transport. Apple processing, TestFlight availability and iPhone operation require separate confirmation."
