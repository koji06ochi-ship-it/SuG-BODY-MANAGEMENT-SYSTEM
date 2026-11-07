export const MEMORY_PREFIX = 'sug_otohime_memory_v1:';
export function confirmedUserId(authState) {
  const id = authState?.userId;
  if (authState?.status !== 'authenticated' || authState?.verified !== true ||
      typeof id !== 'string' || id.length === 0 || id.length > 200) return null;
  return id;
}

function storageKey(userId) {
  if (typeof userId !== 'string' || !userId || userId.length > 200) {
    throw new Error('ログインを確認できないため、呼び名を保存できません。');
  }
  return MEMORY_PREFIX + encodeURIComponent(userId);
}

function validRecord(value, userId) {
  return value && value.schema === 1 && value.userId === userId &&
    value.source === 'user_explicit' && value.confirmed === true &&
    typeof value.displayName === 'string' && value.displayName.length > 0 &&
    value.displayName.length <= 48 && Number.isFinite(Date.parse(value.createdAt)) &&
    Number.isFinite(Date.parse(value.updatedAt));
}

export function readPreferredName(storage, userId) {
  const key = storageKey(userId);
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    return validRecord(value, userId) ? value : null;
  } catch {
    return null;
  }
}

export function savePreferredName(storage, userId, input, now = new Date().toISOString()) {
  const key = storageKey(userId);
  const displayName = String(input ?? '').normalize('NFC').trim();
  if (!displayName || [...displayName].length > 48 || /[\u0000-\u001f\u007f]/u.test(displayName)) {
    throw new Error('呼び名は1〜48文字で入力してください。');
  }
  const previous = readPreferredName(storage, userId);
  const record = {
    schema: 1,
    userId,
    displayName,
    source: 'user_explicit',
    confirmed: true,
    createdAt: previous?.createdAt || now,
    updatedAt: now
  };
  storage.setItem(key, JSON.stringify(record));
  return record;
}

export function deletePreferredName(storage, userId) {
  storage.removeItem(storageKey(userId));
}
