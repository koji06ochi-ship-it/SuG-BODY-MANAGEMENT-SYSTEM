'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const read = relative => fs.readFileSync(path.join(repoRoot, relative), 'utf8');
const checks = [];
const check = (name, condition, detail = '') => {
  checks.push({ name, pass: Boolean(condition), detail });
};

const workflow = read('.github/workflows/ios-testflight.yml');
const project = read('ios/project.yml');
const plist = read('ios/SuGMember/Info.plist');
const entitlements = read('ios/SuGMember/SuGMember.entitlements');
const content = read('ios/SuGMember/ContentView.swift');
const webview = read('ios/SuGMember/MemberWebView.swift');
const health = read('ios/SuGMember/HealthKitManager.swift');
const packageScript = read('ios/scripts/package_body_web.cjs');
const decryptScript = read('ios/scripts/decrypt_body_assets.cjs');
const normalizeKeyScript = read('ios/scripts/normalize_asc_key.py');
const bodyIndex = read('apps/body/daily-preview/index.html');
const supabaseBridge = read('apps/body/daily-preview/body-supabase-bridge.js');
const trainingSheet = read('apps/body/daily-preview/sheet-training.js');

check('workflow is manual only', /on:\s*\n\s*workflow_dispatch:/.test(workflow) && !/\n\s*(push|schedule):/.test(workflow));
check('workflow has read-only repository permission', /permissions:\s*\n\s*contents:\s*read/.test(workflow));
check('workflow requires explicit UPLOAD value', /confirm_upload/.test(workflow) && /test '\$\{\{ inputs\.confirm_upload \}\}' = 'UPLOAD'/.test(workflow));
check('workflow rejects build 290 and lower', /build_number.*greater than 290/.test(workflow) && /-le 290/.test(workflow));
check('workflow default build is 291', /build_number:[\s\S]*?default:\s*'291'/.test(workflow));
check('workflow has no git push', !/\bgit\s+push\b/.test(workflow));
check('workflow preserves existing App Store API identifiers', /ASC_API_KEY_ID:\s*MM98J638B7/.test(workflow) && /ASC_API_ISSUER_ID:\s*d3a981e0-7557-4223-a67f-d026debee303/.test(workflow));
check('workflow keeps the App Store private key in GitHub Secrets', workflow.includes('ASC_API_KEY_P8: ${{ secrets.ASC_API_KEY_P8 }}'));
check('workflow uses a secret reference for the protected BODY asset key', workflow.includes('BODY_ASSET_BUNDLE_KEY_B64: ${{ secrets.BODY_ASSET_BUNDLE_KEY_B64 }}'));
check('workflow uses a secret reference for the private asset deploy key', workflow.includes('BODY_ASSET_DEPLOY_KEY: ${{ secrets.BODY_ASSET_DEPLOY_KEY }}'));
check('workflow refuses to create Apple app records or capabilities', /appstore_bootstrap\.py --require-existing/.test(workflow));
check('workflow packages current BODY before XcodeGen', workflow.indexOf('package_body_web.cjs') < workflow.indexOf('xcodegen generate'));
check('workflow restores protected assets before packaging', workflow.indexOf('decrypt_body_assets.cjs') > 0 && workflow.indexOf('decrypt_body_assets.cjs') < workflow.indexOf('package_body_web.cjs'));
check('workflow fetches assets only from the dedicated private repository', /git@github\.com:koji06ochi-ship-it\/SuG-BODY-BUILD-ASSETS\.git/.test(workflow));
check('workflow pins the published GitHub Ed25519 host key', /github\.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl/.test(workflow));
check('workflow verifies the encrypted bundle hash before decryption', /98F9EDBDF3C3197F6697A3C2D30CDE9E5A737A51DC1D7C3666241E35D479893C/.test(workflow) && /shasum -a 256 -c/.test(workflow));
check('workflow removes restored assets from runner', /if:\s*always\(\)[\s\S]*?rm -rf apps\/body\/daily-preview\/assets/.test(workflow));
check('workflow validates archived bundle, version, build and BODY resource', ['CFBundleIdentifier','CFBundleShortVersionString','CFBundleVersion','BodyWeb/index.html'].every(value => workflow.includes(value)));
check('workflow preserves successful build 290', /CURRENT_PROJECT_VERSION='\$\{\{ inputs\.build_number \}\}'/.test(workflow) && /-le 290/.test(workflow));
check('public workflow does not publish an extractable IPA artifact', !/actions\/upload-artifact/.test(workflow) && !/retention-days:/.test(workflow));
check('workflow runs static release validation before signing', workflow.indexOf('validate_ios_release.cjs') > workflow.indexOf('package_body_web.cjs') && workflow.indexOf('validate_ios_release.cjs') < workflow.indexOf('appstore_signing.py prepare'));
check('workflow removes only the known stale build 290 signing assets before prepare', /certificateId": "L366QFQ25R"/.test(workflow) && /profileId": "52RX8A3H8H"/.test(workflow) && workflow.indexOf('build290-stale-signing.json') < workflow.indexOf('appstore_signing.py prepare'));
check('normalized App Store private key is masked before export', /::add-mask::\{encoded\}/.test(normalizeKeyScript) && normalizeKeyScript.indexOf('::add-mask::') < normalizeKeyScript.indexOf('ASC_API_KEY_P8_BASE64='));

check('XcodeGen bundle id matches existing app', /PRODUCT_BUNDLE_IDENTIFIER:\s*jp\.sugosaka\.member/.test(project));
check('XcodeGen marketing version is 1.0.0', /MARKETING_VERSION:\s*'1\.0\.0'/.test(project));
check('XcodeGen default next build is 291', /CURRENT_PROJECT_VERSION:\s*'291'/.test(project));
check('XcodeGen embeds BodyWeb as resources', /path:\s*BodyWeb[\s\S]*?type:\s*folder[\s\S]*?buildPhase:\s*resources/.test(project));
check('XcodeGen references HealthKit entitlements', /CODE_SIGN_ENTITLEMENTS:\s*SuGMember\/SuGMember\.entitlements/.test(project));
check('XcodeGen generates the HealthKit entitlement', /entitlements:[\s\S]*?properties:[\s\S]*?com\.apple\.developer\.healthkit:\s*true/.test(project));
check('HealthKit entitlement enabled', /com\.apple\.developer\.healthkit[\s\S]*?<true\/>/.test(entitlements));
check('Info.plist has read-only HealthKit usage copy', /NSHealthShareUsageDescription/.test(plist));
check('Info.plist keeps camera, photo and location usage copy', ['NSCameraUsageDescription','NSPhotoLibraryUsageDescription','NSLocationWhenInUseUsageDescription'].every(key => plist.includes(key)));
check('Info.plist declares no non-exempt encryption', /ITSAppUsesNonExemptEncryption[\s\S]*?<false\/>/.test(plist));

check('app resolves embedded BodyWeb first', /Bundle\.main\.url\(forResource:\s*"BodyWeb"/.test(content));
check('app retains remote BODY fallback', /apps\/body\/daily-preview\/index\.html/.test(content));
check('web view uses loadFileURL for embedded BODY', /loadFileURL\(initialURL,\s*allowingReadAccessTo:/.test(webview));
check('web view recognises embedded BODY runtime', /path\.contains\("\/BodyWeb\/"\)/.test(webview));
check('current daily-preview suppresses legacy missing-script injection', /const isCurrentDaily/.test(webview) && /!isCurrentDaily/.test(webview));
check('native HealthKit bridge remains installed', /WKScriptMessageHandler/.test(webview) && /sugHealthKit/.test(webview));
check('HealthKit covers required five categories', [
  '.stepCount', '.heartRate', '.sleepAnalysis', '.activeEnergyBurned', '.basalEnergyBurned'
].every(value => health.includes(value)));
check('HealthKit request remains read-only', /requestAuthorization\(toShare:\s*\[\],\s*read:/.test(health));

check('packager has explicit source, output and quest dependency', ["'source'", "'output'", "'quest-asset'"].every(value => packageScript.includes(value)));
check('packager writes file hashes and manifest', /sha256/.test(packageScript) && /body-web-manifest\.json/.test(packageScript));
check('protected asset decryptor uses authenticated AES-256-GCM', /aes-256-gcm/.test(decryptScript) && /setAuthTag/.test(decryptScript));
check('protected asset decryptor validates hashes and exact asset count', /files\.length\s*!==\s*16/.test(decryptScript) && /sha256/.test(decryptScript));
check('encrypted protected asset bundle exists', fs.existsSync(path.join(repoRoot, 'ios', 'private-assets', 'body-assets-291.enc')) && fs.statSync(path.join(repoRoot, 'ios', 'private-assets', 'body-assets-291.enc')).size > 0);
check('BODY does not auto-load Supabase SDK from a CDN', !/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/.test(bodyIndex));
check('BODY Supabase client needs explicit runtime configuration', /__SUG_BODY_RUNTIME_CONFIG__/.test(supabaseBridge) && /Supabase接続設定は未設定です/.test(supabaseBridge));
check('BODY does not embed the previously observed Supabase project', !/nnqzxcgkqjnmtzcvorha/.test(supabaseBridge) && !/const\s+PUBLISHABLE_KEY\s*=/.test(supabaseBridge));
check('training screen does not publish the source spreadsheet identifier', !/docs\.google\.com\/spreadsheets/.test(trainingSheet));

const bodyWeb = path.join(repoRoot, 'ios', 'BodyWeb');
const manifestPath = path.join(bodyWeb, 'body-web-manifest.json');
check('generated BodyWeb entry exists', fs.existsSync(path.join(bodyWeb, 'index.html')));
check('generated BodyWeb manifest exists', fs.existsSync(manifestPath));
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  check('generated BodyWeb has runtime files', manifest.fileCount >= 40, `fileCount=${manifest.fileCount}`);
  check('manifest entries exist on disk', manifest.files.every(item => fs.existsSync(path.join(bodyWeb, item.path))));
}

const failed = checks.filter(item => !item.pass);
const result = {
  generatedAt: new Date().toISOString(),
  total: checks.length,
  passed: checks.length - failed.length,
  failed: failed.length,
  checks
};
const output = path.join(repoRoot, 'ios', 'ios-release-static-validation.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output, total: result.total, passed: result.passed, failed: result.failed }));
if (failed.length) {
  for (const item of failed) console.error(`FAIL: ${item.name}${item.detail ? ` (${item.detail})` : ''}`);
  process.exit(1);
}
