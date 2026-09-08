const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'quest-battle-mvp-v20.html'), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'app script must exist');

const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      innerHTML: '',
      textContent: '',
      dataset: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute() {},
      addEventListener() {},
      querySelectorAll() { return []; }
    });
  }
  return elements.get(id);
}

const values = new Map();
const localStorageStub = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); }
};

const testFlow = `
  saveStore({unlocked:true,wins:1,bestTurns:4,victoryCard:true,lastPlayed:1});
  claimRyoMenu('yakiniku');
  claimRyoMenu('hormone');
  const partial = collectionState();
  const next = collectionNext(partial);
  const future = COLLECTION_24.find(c => c.id === 'station-kanan');
  const ryo = COLLECTION_24.find(c => c.id === 'ryo');
  claimRyoMenu('protein');
  claimRyoMenu('recommend');
  const completePartner = collectionState();
  const afterPartner = collectionNext(completePartner);
  return {
    total: COLLECTION_24.length,
    partialCount: partial.count,
    next,
    futureOwned: collectionOwned(future, partial.battle, partial.ryo),
    ryoOwned: collectionOwned(ryo, partial.battle, partial.ryo),
    ryoRarity: collectionRarity(ryo),
    completePartnerCount: completePartner.count,
    afterPartner
  };
`;

const run = new Function('document', 'localStorage', 'confirm', `${match[1]}\n${testFlow}`);
const result = run({ getElementById: element }, localStorageStub, () => true);

assert.equal(result.total, 24, 'collection must contain exactly 24 cards');
assert.equal(result.partialCount, 9, 'base five, Ryo, two menus, and victory should be owned');
assert.equal(result.next.title, 'たんぱく兵糧', 'next target should be the next unclaimed Ryo menu');
assert.equal(result.futureOwned, false, 'future cards must remain locked');
assert.equal(result.ryoOwned, true, 'Ryo card should unlock after the first menu');
assert.equal(result.ryoRarity, 'UR', 'Ryo rarity should reflect the latest level after four menu claims');
assert.equal(result.completePartnerCount, 11, 'four menu cards should raise the owned count to eleven');
assert.equal(result.afterPartner.title, '道の駅かなん 駅守将', 'future GPS card should become the next visible goal');

console.log('collection-v22: PASS');
