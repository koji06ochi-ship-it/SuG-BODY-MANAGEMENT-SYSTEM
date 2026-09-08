const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'quest-battle-mvp-v20.html'), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'battle script must exist');

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

const documentStub = {
  getElementById: element
};

const values = new Map();
const localStorageStub = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); }
};

const testFlow = `
  saveStore({unlocked:true,wins:0,bestTurns:null,victoryCard:false,lastPlayed:null});
  startBattle();
  useCard('kintetsu');
  useCard('kunishige');
  useCard('hakkenya');
  endTurn();
  useCard('masashige');
  useCard('masashige');
  endTurn();
  useCard('egg');
  useCard('masashige');
  endTurn();
  useCard('masashige');
  return {battle,store:loadStore()};
`;

const run = new Function('document', 'localStorage', 'confirm', `${match[1]}\n${testFlow}`);
const result = run(documentStub, localStorageStub, () => true);

assert.equal(result.battle.ended, true, 'battle should end');
assert.equal(result.battle.boss, 0, 'boss should be defeated');
assert.equal(result.battle.moveCost, 1, 'Kintetsu should reduce movement cost');
assert.equal(result.battle.attack, 26, 'Kunishige should buff Masashige attack');
assert.equal(result.battle.navy, true, 'Hakkenya should enable navy support');
assert.equal(result.battle.used.egg, true, 'Kanan egg should be consumable');
assert.equal(result.store.victoryCard, true, 'victory card should persist');
assert.equal(result.store.wins, 1, 'win count should persist');
assert.equal(result.store.bestTurns, 4, 'best turn count should persist');

console.log('battle-mvp-v20: PASS');
