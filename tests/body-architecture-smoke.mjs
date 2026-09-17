import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = p => fs.readFileSync(p, 'utf8');

const hub = read('apps/body/hub-v27.82.html');
const rom = read('apps/body/rom-care-v27.82.html');
const normal = read('apps/body/index.html');
const miss = read('apps/body/best-of-miss-demo-v27.76.html');
const quest = read('shrine-quest-v26.5.208.html');
const ios = read('ios/SuGMember/ContentView.swift');
const legacy = read('index.html');
const shared = read('apps/shared/rom-care-v27.82.js');
const data = read('apps/shared/rom-care-data-v27.82.js');
const engine = read('apps/shared/rom-care-engine-v27.82.js');
const analysis = read('apps/shared/rom-care-analysis-v27.82.js');
const css = read('apps/shared/rom-care-v27.82.css');
const monthlyReview = read('apps/body/monthly-review-v27.23.js');
const futureImageRule = read('apps/body/future-image-rule-v27.63.js');
const beautyAssessmentPage = read('apps/body/beauty-initial-assessment-v27.82.html');
const beautyAssessment = read('apps/body/beauty-initial-assessment-v27.82.js');
const beautyAssessmentCss = read('apps/body/beauty-initial-assessment-v27.82.css');

// BODY hub must keep the three distinct product surfaces.
assert.match(hub, /通常 BODY/);
assert.match(hub, /ROM \/ CARE/);
assert.match(hub, /BEAUTY BODY/);
assert.match(hub, /\.\/index\.html/);
assert.match(hub, /\.\/best-of-miss-demo-v27\.76\.html/);
assert.match(hub, /rom-care-v27\.82\.js/);
assert.match(hub, /SuGRomCare\.open\(\{source:'hub'/);

// V27.82 ROM/CARE is now a standalone shared runtime, not a legacy iframe shell.
assert.match(rom, /data-rom-care-runtime/);
assert.match(rom, /data-rom-care-panel="rom"/);
assert.match(rom, /data-rom-care-panel="care"/);
assert.match(rom, /rom-care-v27\.82\.css/);
assert.match(rom, /rom-care-v27\.82\.js/);
assert.match(rom, /rom-care-data-v27\.82\.js/);
assert.match(rom, /rom-care-engine-v27\.82\.js/);
assert.match(rom, /rom-care-analysis-v27\.82\.js/);
assert.match(rom, /SuGRomCareData\.boot/);
assert.match(rom, /SuGRomCareEngine\.boot/);
assert.match(rom, /data-rom-care-compact="v27\.82"/);
assert.match(rom, /再評価へ進む/);
assert.match(rom, /BEAUTY BODY評価/);
assert.match(rom, /共通BODYデータを確認中/);
assert.match(data, /共通BODYデータ未接続｜この画面単体でも評価できます/);
assert.match(rom, /今日のROM評価サマリー/);
assert.match(rom, /優先CARE TOP3/);
assert.match(rom, /detailGroup\('AROM \/ PROM詳細・胸椎ROM'/);
assert.match(rom, /detailGroup\('SHR'/);
assert.match(rom, /detailGroup\('Joint by Joint'/);
assert.match(rom, /detailGroup\('Movement Screen'/);
assert.match(rom, /detailGroup\('CARE RESPONSE'/);
assert.match(rom, /detailGroup\('24H FOLLOW UP'/);
assert.match(rom, /detailGroup\('Integrated CARE Decision'/);
assert.match(rom, /detailGroup\('Medical Referral詳細'/);
assert.match(css, /\.compactDetails/);
for (const id of ['romResult', 'aromAsymmetry', 'jbjPriority', 'careResult', 'careReferralGate', 'integratedResult']) {
  assert.equal((rom.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `${id} must remain unique`);
}
assert.doesNotMatch(rom, /<iframe/i);
assert.doesNotMatch(rom, /legacyPageUrl\(context\)/);
assert.doesNotMatch(rom, /contentDocument/);

// Shared module contracts and extracted runtime assets must exist.
assert.match(shared, /sug:rom-care:ready/);
assert.match(shared, /sug:rom-care:set-section/);
assert.match(shared, /romCareShared/);
assert.match(data, /SuGRomCareData/);
assert.match(engine, /SuGRomCareEngine/);
assert.match(analysis, /V27\.82|27\.82/);
assert.ok(css.length > 0);

// Key normal-BODY modules must at least parse; these previously broke the page at runtime.
new vm.Script(monthlyReview, { filename: 'monthly-review-v27.23.js' });
new vm.Script(futureImageRule, { filename: 'future-image-rule-v27.63.js' });

// Legacy root remains available for compatibility/migration and is not deleted.
assert.match(legacy, /data-tab="rom"/);
assert.match(legacy, /data-tab="care"/);
assert.match(legacy, /AROM \/ PROM/);
assert.match(legacy, /SHR/);
assert.match(legacy, /apps\/shared\/rom-care-v27\.82\.js/);
assert.match(legacy, /SuGRomCare\.aromBand/);
assert.match(legacy, /SuGRomCare\.aromAsymmetryPairs/);
assert.match(legacy, /SuGRomCare\.romBand/);
assert.match(legacy, /SuGRomCare\.ensureMemberCollections/);

// Shared pure rules and collection normalization remain executable without DOM.
const sandbox = {
  URL,
  URLSearchParams,
  location: {
    href: 'https://example.test/apps/body/index.html',
    search: '',
    origin: 'https://example.test'
  }
};
sandbox.globalThis = sandbox;
vm.runInNewContext(shared, sandbox);
const api = sandbox.SuGRomCare;
assert.equal(api.version, '27.82');
assert.deepEqual({ ...api.aromBand(135, { ideal: [130, 145], warn: [120, 155] }) }, { symbol: '◎', text: '参考帯内', cls: 'ok' });
assert.equal(api.aromGapThreshold('knee_ext'), 5);
assert.equal(api.aromGapThreshold('shoulder_flex'), 10);
assert.equal(api.romBand(80, 'knee').cls, 'ok');
const pairs = api.aromAsymmetryPairs([
  { date: '2026-09-02', key: 'ankle_df', label: '足関節｜背屈', side: 'left', active: 9 },
  { date: '2026-09-02', key: 'ankle_df', label: '足関節｜背屈', side: 'right', active: 18 }
]);
assert.equal(pairs.length, 1);
assert.equal(pairs[0].diff, 9);
assert.match(api.returnUrl({ source: 'miss' }), /beauty-initial-assessment-v27\.82\.html/);
assert.match(api.returnUrl({ source: 'miss' }), /mode=reassessment/);
assert.match(api.returnUrl({ source: 'normal' }), /apps\/body\/index\.html/);
const member = {};
api.ensureMemberCollections(member);
for (const key of api.collectionNames) assert.ok(Array.isArray(member[key]), `${key} must be an array`);

// Normal BODY and MISS both still exist as separate implementations.
assert.match(normal, /S\.u\.G BODY/);
assert.match(normal, /TODAY FLOW/);
assert.match(normal, /data-rom-care-source="normal"/);
assert.match(normal, /rom-care-v27\.82\.js/);
assert.match(normal, /normalizeVisibleBodyVersions/);
assert.match(miss, /BEST OF MISS|BEAUTY|MISS/i);
assert.match(miss, /data-rom-care-source="miss"/);
assert.match(miss, /rom-care-v27\.82\.js/);
assert.match(miss, /BEST OF MISS BEAUTY BODY · V27\.82/);
assert.doesNotMatch(miss, /BEST OF MISS BEAUTY BODY · V27\.76/);
assert.match(miss, /大会BODY｜初回身体評価を始める/);
assert.match(miss, /beauty-initial-assessment-v27\.82\.html/);

// BEST OF MISS initial assessment must cover the six requested domains and remain non-diagnostic.
for (const label of ['正面・側面・背面', '呼吸・肋骨／胸郭', '胸椎', '骨盤・股関節', '肩・肩甲骨', '前屈・開脚', '大会に向けた身体課題 TOP3']) {
  assert.ok(beautyAssessmentPage.includes(label), `beauty assessment missing ${label}`);
}
for (const label of ['WHY', 'WHAT', 'HOW', 'Before / After', '共通ROM / CARE']) assert.ok(beautyAssessmentPage.includes(label) || beautyAssessment.includes(label), `beauty assessment missing ${label}`);
assert.match(beautyAssessmentPage, /次へ：ROM \/ CAREで確認/);
assert.match(beautyAssessment, /mode.*reassessment|reassessment.*mode/);
assert.match(beautyAssessmentPage, /ポージング技術を採点せず/);
assert.match(beautyAssessmentPage, /医学的診断や傷病名の判定は行いません/);
assert.match(beautyAssessment, /sug_body_photos_v1/);
assert.match(beautyAssessment, /SuGRomCareData/);
assert.ok(beautyAssessmentCss.length > 0);
new vm.Script(beautyAssessment, { filename: 'beauty-initial-assessment-v27.82.js' });
const beautySandbox = {};
beautySandbox.window = beautySandbox;
beautySandbox.globalThis = beautySandbox;
vm.runInNewContext(beautyAssessment, beautySandbox);
const beautyResult = beautySandbox.SuGBeautyAssessment.calculate({
  photos: { front: true, side: true, back: true },
  values: {
    posture: 2, bodyAsymmetry: 2, shoulderLine: 2, waistLine: 2, pelvisLine: 2, legLine: 2,
    ribFlare: 2, ribAsymmetry: 1, breathingExpansion: 2, ribPelvisStack: 2,
    thoracicExtensionQuality: 2, thoracicRotationRight: 52, thoracicRotationLeft: 34,
    pelvisTilt: 'anterior', hipExtensionRight: 8, hipExtensionLeft: 14,
    hipInternalRotationRight: 25, hipInternalRotationLeft: 38,
    hipExternalRotationRight: 48, hipExternalRotationLeft: 36,
    shoulderFlexionRight: 142, shoulderFlexionLeft: 162,
    scapularAsymmetry: 2, overheadMovementQuality: 2,
    forwardFoldCm: 12, straddleAngle: 105
  }
});
assert.equal(beautyResult.quality.completeSections, 6);
assert.equal(beautyResult.top3.length, 3);
assert.ok(beautyResult.top3.some(issue => issue.key === 'ribPelvis'));
for (const issue of beautyResult.top3) {
  assert.ok(issue.why && issue.what && issue.how.length >= 2, `${issue.key} must include WHY/WHAT/HOW`);
}

// Canonical QUEST 208 keeps the 11-shrine pilot and migration from older progress.
assert.match(quest, /V26\.5\.208/);
assert.match(quest, /北区 0\/11/);
assert.match(quest, /shrine207/);
assert.match(quest, /shrine206/);
assert.match(quest, /TODAY'S QUEST/);

// iOS must point BODY to the hub, not directly to BEST OF MISS, and QUEST to 208.
assert.match(ios, /apps\/body\/hub-v27\.82\.html\?native=ios&v=27\.82/);
assert.doesNotMatch(ios, /bodyStore = .*best-of-miss-demo/);
assert.match(ios, /shrine-quest-v26\.5\.208\.html/);

console.log('BODY architecture smoke: OK');
