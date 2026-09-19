import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
const flow = read('apps/body/miss-of-integrated-flow-v27.81.js');
const bridge = read('apps/body/health-bridge-v27.64.js');
const css = read('apps/body/miss-of-integrated-flow-v27.81.css');

new vm.Script(flow, { filename: 'miss-of-integrated-flow-v27.81.js' });
new vm.Script(bridge, { filename: 'health-bridge-v27.64.js' });

assert.match(bridge, /ensureMissIntegratedFlow/);
assert.match(bridge, /miss-of-integrated-flow-v27\.81\.js/);
assert.match(bridge, /miss-of-integrated-flow-v27\.81\.css/);
assert.match(flow, /sug_body_photos_v1/);
assert.match(flow, /SuGBeautyBody/);
assert.match(flow, /BODY共通データ/);
assert.match(flow, /WHAT → WHY/);
assert.match(flow, /TOP3 → LONG TERM → WEEK → TODAY/);
assert.match(flow, /やり方/);
assert.match(flow, /感じる場所/);
assert.match(flow, /NG/);
assert.match(flow, /BODY RESPONSE/);
assert.match(flow, /sug:body-response/);
assert.doesNotMatch(flow, /V27\.85|V27\.86/);
assert.doesNotMatch(bridge, /V27\.85|V27\.86/);
assert.ok(css.length > 1000);

for (const file of [
  'apps/body/assets/miss/90-90-breathing.svg',
  'apps/body/assets/miss/thoracic-extension.svg',
  'apps/body/assets/miss/serratus-reach.svg',
  'apps/body/assets/miss/hip-extension.svg',
  'apps/body/assets/miss/hip-90-90.svg',
  'apps/body/assets/miss/adductor-rockback.svg',
  'apps/body/assets/miss/wall-shoulder-flexion.svg',
  'apps/body/assets/miss/hamstring-hinge.svg'
]) assert.ok(fs.existsSync(file), `${file} missing`);

console.log('MISS OF integrated flow smoke OK');
