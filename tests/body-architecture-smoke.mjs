import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = p => fs.readFileSync(p, 'utf8');

const hub = read('apps/body/hub-v27.82.html');
const rom = read('apps/body/rom-care-v27.82.html');
const normal = read('apps/body/index.html');
const miss = read('apps/body/best-of-miss-demo-v27.76.html');
const quest = read('shrine-quest-v26.5.208.html');
const ios = read('ios/SuGMember/ContentView.swift');
const legacy = read('index.html');

// BODY hub must keep the three distinct product surfaces.
assert.match(hub, /通常 BODY/);
assert.match(hub, /ROM \/ CARE/);
assert.match(hub, /BEAUTY BODY/);
assert.match(hub, /\.\/index\.html/);
assert.match(hub, /\.\/rom-care-v27\.82\.html/);
assert.match(hub, /\.\/best-of-miss-demo-v27\.76\.html/);

// Shared ROM bridge must reuse, not recreate/delete, the legacy ROM/CARE source.
assert.match(rom, /\.\.\/\.\.\/index\.html/);
assert.match(rom, /querySelector\('\.tab\[data-tab=/);
assert.match(rom, /tab\.click\(\)/);
assert.match(legacy, /data-tab="rom"/);
assert.match(legacy, /data-tab="care"/);
assert.match(legacy, /AROM \/ PROM/);
assert.match(legacy, /SHR/);

// Normal BODY and MISS both still exist as separate implementations.
assert.match(normal, /S\.u\.G BODY/);
assert.match(normal, /TODAY FLOW/);
assert.match(miss, /BEST OF MISS|BEAUTY|MISS/i);

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
