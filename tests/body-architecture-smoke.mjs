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

// BODY hub must keep the three distinct product surfaces.
assert.match(hub, /通常 BODY/);
assert.match(hub, /ROM \/ CARE/);
assert.match(hub, /BEAUTY BODY/);
assert.match(hub, /\.\/index\.html/);
assert.match(hub, /\.\/best-of-miss-demo-v27\.76\.html/);
assert.match(hub, /rom-care-v27\.82\.js/);
assert.match(hub, /SuGRomCare\.open\(\{source:'hub'/);

// Shared ROM bridge reuses legacy functionality through an explicit message contract.
assert.match(rom, /rom-care-v27\.82\.js/);
assert.match(rom, /legacyPageUrl\(context\)/);
assert.match(rom, /postMessage/);
assert.doesNotMatch(rom, /contentDocument/);
assert.doesNotMatch(rom, /\.tab\[data-tab=/);
assert.match(shared, /sug:rom-care:ready/);
assert.match(shared, /sug:rom-care:set-section/);
assert.match(shared, /\.tab\[data-tab=/);
assert.match(shared, /romCareShared/);
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
const member = {};
api.ensureMemberCollections(member);
for (const key of api.collectionNames) assert.ok(Array.isArray(member[key]), `${key} must be an array`);

// Normal BODY and MISS both still exist as separate implementations.
assert.match(normal, /S\.u\.G BODY/);
assert.match(normal, /TODAY FLOW/);
assert.match(normal, /data-rom-care-source="normal"/);
assert.match(normal, /rom-care-v27\.82\.js/);
assert.match(miss, /BEST OF MISS|BEAUTY|MISS/i);
assert.match(miss, /data-rom-care-source="miss"/);
assert.match(miss, /rom-care-v27\.82\.js/);

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
