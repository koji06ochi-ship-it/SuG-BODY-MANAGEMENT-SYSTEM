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

const documentStub = { getElementById: element };
const values = new Map();
const localStorageStub = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); }
};

const testFlow = `
  claimRyoMenu('yakiniku');
  claimRyoMenu('hormone');
  claimRyoMenu('protein');
  claimRyoMenu('recommend');
  const partner = ryoProfile();
  saveStore({unlocked:true,wins:0,bestTurns:null,victoryCard:false,lastPlayed:null});
  startBattle();
  useCard('kintetsu');
  endTurn();
  useCard('ryo');
  useCard('masashige');
  return {partner,battle,stored:loadRyo(),cards:cardsForBattle()};
`;

const run = new Function('document', 'localStorage', 'confirm', `${match[1]}\n${testFlow}`);
const result = run(documentStub, localStorageStub, () => true);

assert.equal(result.partner.level, 4, 'four unique menu cards should reach level 4');
assert.equal(result.partner.heal, 30, 'level 4 should heal 30');
assert.equal(result.partner.attack, 8, 'level 4 should buff attack by 8');
assert.equal(result.stored.visits, 4, 'each unique menu card should record one visit');
assert.equal(result.stored.claimed.length, 4, 'four menu cards should persist');
assert.equal(result.cards.length, 6, 'Ryo card should join the five-card battle deck');
assert.equal(result.battle.used.ryo, true, 'Ryo card should be usable once');
assert.equal(result.battle.hp, 80, 'Ryo level 4 should restore HP to the maximum');
assert.equal(result.battle.attack, 26, 'Ryo level 4 should add eight attack');
assert.equal(result.battle.boss, 94, 'buffed Masashige attack should deal 26 damage');

console.log('ryo-partner-v21: PASS');
