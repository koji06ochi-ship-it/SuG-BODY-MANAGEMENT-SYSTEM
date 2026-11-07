const PREFIX = 'sug_otohime_84b_v1:';
const MAX_FACTS = 30;
const MAX_TEXT = 1000;
const MAX_BYTES = 120000;
const CATEGORIES = new Set(['preference', 'habit', 'personal']);

function verifiedUserId(getAuthState) {
  const state = getAuthState();
  const id = state?.userId;
  if (state?.status !== 'authenticated' || state.verified !== true ||
      typeof id !== 'string' || !id.trim() || id.length > 200) {
    throw new Error('AUTH_NOT_VERIFIED');
  }
  return id;
}

function storageKey(userId) {
  return PREFIX + encodeURIComponent(userId);
}

function validText(value) {
  if (typeof value !== 'string') throw new Error('INVALID_TEXT');
  const text = value.normalize('NFC').trim();
  if (!text || [...text].length > MAX_TEXT || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)) {
    throw new Error('INVALID_TEXT');
  }
  return text;
}

function emptyRecord(userId) {
  return { version: 1, userId, turns: [], facts: [] };
}

function validTurn(turn) {
  return turn && typeof turn.id === 'string' && turn.id.length <= 128 &&
    (turn.speaker === 'user' || turn.speaker === 'otohime') &&
    typeof turn.text === 'string' && turn.text.length > 0 && turn.text.length <= MAX_TEXT &&
    Number.isFinite(Date.parse(turn.at));
}

function validFact(fact) {
  return fact && typeof fact.id === 'string' && fact.id.length <= 128 &&
    CATEGORIES.has(fact.category) && typeof fact.text === 'string' &&
    fact.text.length > 0 && fact.text.length <= MAX_TEXT &&
    fact.source === 'user_confirmed' && fact.confirmed === true &&
    Number.isFinite(Date.parse(fact.createdAt)) && Number.isFinite(Date.parse(fact.updatedAt));
}

function byteLength(text) {
  return new TextEncoder().encode(text).byteLength;
}

function load(storage, userId) {
  const raw = storage.getItem(storageKey(userId));
  if (!raw) return emptyRecord(userId);
  if (byteLength(raw) > MAX_BYTES) throw new Error('STORAGE_LIMIT');
  const data = JSON.parse(raw);
  if (data?.version !== 1 || data.userId !== userId || !Array.isArray(data.turns) ||
      !Array.isArray(data.facts) || data.facts.length > MAX_FACTS ||
      !data.turns.every(validTurn) || !data.facts.every(validFact)) {
    throw new Error('INVALID_RECORD');
  }
  return data;
}

function save(storage, userId, data, getAuthState) {
  if (verifiedUserId(getAuthState) !== userId) throw new Error('AUTH_CHANGED');
  const raw = JSON.stringify(data);
  if (byteLength(raw) > MAX_BYTES) throw new Error('STORAGE_LIMIT');
  storage.setItem(storageKey(userId), raw);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createOtohimeMemory({ storage, getAuthState, now = () => new Date().toISOString(), createId = () => crypto.randomUUID() }) {
  if (!storage || typeof getAuthState !== 'function') throw new Error('MISSING_DEPENDENCY');

  function withUser(callback) {
    const userId = verifiedUserId(getAuthState);
    const data = load(storage, userId);
    if (verifiedUserId(getAuthState) !== userId) throw new Error('AUTH_CHANGED');
    return callback(data, userId);
  }

  function appendPair(data, userId, userText, otohimeText) {
    const firstAt = now();
    const secondAt = now();
    const first = { id: createId(), speaker: 'user', text: validText(userText), at: firstAt };
    const second = { id: createId(), speaker: 'otohime', text: validText(otohimeText), at: secondAt };
    data.turns.push(first, second);
    save(storage, userId, data, getAuthState);
    return [first.id, second.id];
  }

  function saveFact(data, userId, { category, text, confirmed }, factId = null) {
    if (confirmed !== true) throw new Error('CONSENT_REQUIRED');
    if (!CATEGORIES.has(category)) throw new Error('INVALID_CATEGORY');
    const cleanText = validText(text);
    const timestamp = now();
    let fact;
    if (factId) {
      const index = data.facts.findIndex(item => item.id === factId);
      if (index < 0) throw new Error('FACT_NOT_FOUND');
      fact = { ...data.facts[index], category, text: cleanText, source: 'user_confirmed', confirmed: true, updatedAt: timestamp };
      data.facts[index] = fact;
    } else {
      if (data.facts.length >= MAX_FACTS) throw new Error('FACT_LIMIT');
      fact = { id: createId(), category, text: cleanText, source: 'user_confirmed', confirmed: true, createdAt: timestamp, updatedAt: timestamp };
      data.facts.push(fact);
    }
    save(storage, userId, data, getAuthState);
    return fact.id;
  }

  return Object.freeze({
    read() { return withUser(data => clone(data)); },
    appendTurn({ speaker, text }) {
      if (speaker !== 'user' && speaker !== 'otohime') throw new Error('INVALID_SPEAKER');
      return withUser((data, userId) => {
        const turn = { id: createId(), speaker, text: validText(text), at: now() };
        data.turns.push(turn);
        save(storage, userId, data, getAuthState);
        return turn.id;
      });
    },
    appendExchange({ userText, otohimeText }) {
      return withUser((data, userId) => appendPair(data, userId, userText, otohimeText));
    },
    deleteTurn(turnId) {
      return withUser((data, userId) => {
        data.turns = data.turns.filter(turn => turn.id !== turnId);
        save(storage, userId, data, getAuthState);
      });
    },
    clearTurns() {
      return withUser((data, userId) => {
        data.turns = [];
        save(storage, userId, data, getAuthState);
      });
    },
    saveApprovedFact(input) {
      return withUser((data, userId) => saveFact(data, userId, input));
    },
    updateApprovedFact(input) {
      return withUser((data, userId) => saveFact(data, userId, input, input?.factId));
    },
    deleteFact(factId) {
      return withUser((data, userId) => {
        data.facts = data.facts.filter(fact => fact.id !== factId);
        save(storage, userId, data, getAuthState);
      });
    },
    clearFacts() {
      return withUser((data, userId) => {
        data.facts = [];
        save(storage, userId, data, getAuthState);
      });
    },
    clearAll() {
      const userId = verifiedUserId(getAuthState);
      if (verifiedUserId(getAuthState) !== userId) throw new Error('AUTH_CHANGED');
      storage.removeItem(storageKey(userId));
    }
  });
}

export const OTOHIME_MEMORY_LIMITS = Object.freeze({ turns: null, facts: MAX_FACTS, bytes: MAX_BYTES });
