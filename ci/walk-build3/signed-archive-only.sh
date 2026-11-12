#!/bin/bash
# Must run on the separately approved ephemeral Mac runner with this batch's signing assets.
set -euo pipefail
test "${SUG_SIGNING_APPROVED:-}" = yes || { echo 'Signing approval required'; exit 65; }
root="${1:?source root required}"
app="${2:?app required}"
work="${3:?batch signing directory required}"
test "$app" = WALK || { echo 'WALK-only archive'; exit 65; }
scheme=SuGWALK;bundle=jp.sugosaka.walk
test -n "${RUNNER_TEMP:-}"; test -n "${SUG_BUILD_NUMBER:-}"
test "$SUG_BUILD_NUMBER" = 3 || { echo 'Build 3 only'; exit 65; }
case "$SUG_BUILD_NUMBER" in ''|0|*[!0-9]*) echo 'Unique positive build number required';exit 2;;esac
if [[ "$app" == WALK ]]; then
  SUG_INFO_ROOT="$root" SUG_INFO_APP="$app" python3 - <<'PY_PURPOSE'
import os,pathlib,plistlib
root=pathlib.Path(os.environ['SUG_INFO_ROOT']).resolve()
runner=pathlib.Path(os.environ['RUNNER_TEMP']).resolve()
assert root.is_relative_to(runner) and root!=runner,'Only isolated runner sources may be patched'
app=os.environ['SUG_INFO_APP'];assert app == 'WALK'
p=root/app/'iOS/Sources/Info.plist'
before=plistlib.loads(p.read_bytes());after=dict(before)
assert isinstance(before.get('NSHealthShareUsageDescription'),str) and before['NSHealthShareUsageDescription'].strip(),'HealthKit reading purpose required'
if not after.get('NSHealthUpdateUsageDescription'):
    after['NSHealthUpdateUsageDescription']='この版は、本人が同期を選んだ健康・活動データを読み取り、日々の記録の確認に使用します。ヘルスケアへの書き込みは要求せず、既存データを変更しません。'
assert all(after[k]==v for k,v in before.items()),'Existing purpose and configuration must be preserved'
if after!=before:p.write_bytes(plistlib.dumps(after,sort_keys=False))
assert plistlib.loads(p.read_bytes()).get('NSHealthUpdateUsageDescription'),'HealthKit purpose missing'
print('HEALTHKIT_PURPOSE_CHECK_PASS='+app+'; read-only behavior unchanged')
PY_PURPOSE
fi
profile="$work/$app.mobileprovision"
decoded="$work/$app.profile.plist"
security cms -D -i "$profile" > "$decoded"
team=$(/usr/libexec/PlistBuddy -c 'Print :TeamIdentifier:0' "$decoded")
uuid=$(/usr/libexec/PlistBuddy -c 'Print :UUID' "$decoded")
profile_name=$(/usr/libexec/PlistBuddy -c 'Print :Name' "$decoded")
identifier=$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' "$decoded")
test "$identifier" = "$team.$bundle"
if [[ "$app" == WALK ]];then /usr/libexec/PlistBuddy -c 'Print :Entitlements:com.apple.developer.healthkit' "$decoded" | grep -qi true;fi
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
cp "$profile" "$HOME/Library/MobileDevice/Provisioning Profiles/$uuid.mobileprovision"
archive="$RUNNER_TEMP/$scheme-$SUG_BUILD_NUMBER.xcarchive"
test ! -e "$archive"
xcodebuild -project "$root/$app/iOS/$scheme.xcodeproj" -scheme "$scheme" -configuration Release -destination 'generic/platform=iOS' -archivePath "$archive" DEVELOPMENT_TEAM="$team" CURRENT_PROJECT_VERSION="$SUG_BUILD_NUMBER" CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY='Apple Distribution' PROVISIONING_PROFILE_SPECIFIER="$profile_name" archive
product="$archive/Products/Applications/$scheme.app"
test "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$product/Info.plist")" = "$bundle"
if [[ "$app" == WALK ]];then
  test -n "$(/usr/libexec/PlistBuddy -c 'Print :NSHealthShareUsageDescription' "$product/Info.plist")"
  test -n "$(/usr/libexec/PlistBuddy -c 'Print :NSHealthUpdateUsageDescription' "$product/Info.plist")"
fi
codesign --verify --deep --strict "$product"
SOURCE_WEB="$root/$app/iOS/Resources/Web" PRODUCT_WEB="$product/Web" python3 - <<'PY_WEB'
import os,pathlib,hashlib
source=pathlib.Path(os.environ['SOURCE_WEB']); target=pathlib.Path(os.environ['PRODUCT_WEB'])
files=[p for p in source.rglob('*') if p.is_file()]
assert files and (target/'walk-quest.html').is_file(), 'Bundled WALK entry missing'
for p in files:
    q=target/p.relative_to(source)
    assert q.is_file() and hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256(q.read_bytes()).digest(), str(p.relative_to(source))
print('WALK_ARCHIVE_WEB_HASH_MATCH='+str(len(files)))
PY_WEB
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

# No Apple upload code exists in this archive-only entry point.
IPA_PATH="$ipa" ARCHIVE_PATH="$archive" python3 - <<'PY_RECEIPT'
import os,pathlib,hashlib,json,zipfile,plistlib
p=pathlib.Path(os.environ['IPA_PATH'])
with zipfile.ZipFile(p) as z:
    info=plistlib.loads(z.read('Payload/SuGWALK.app/Info.plist'))
assert info['CFBundleIdentifier']=='jp.sugosaka.walk'
assert str(info['CFBundleVersion'])=='3'
assert info['CFBundleShortVersionString']=='1.0.0'
receipt={'bundle':'jp.sugosaka.walk','build':'3','ipa':str(p),'ipaBytes':p.stat().st_size,'ipaSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'archive':os.environ['ARCHIVE_PATH'],'appleUploaded':False}
(p.parent/'WALK_BUILD3_IPA_RECEIPT.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt))
PY_RECEIPT

