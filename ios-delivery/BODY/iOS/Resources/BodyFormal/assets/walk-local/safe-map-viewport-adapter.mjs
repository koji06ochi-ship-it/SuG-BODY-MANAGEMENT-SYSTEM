// Viewport adapter for SAFE data providers. It never performs network access itself.
// The provider decides which prepared datasets may be read.
export const PILOT_VALIDATION_TARGETS = Object.freeze([
  { prefecture: '奈良県', area: '奈良市' }, { prefecture: '奈良県', area: '橿原市' },
  { prefecture: '兵庫県', area: '神戸市' }, { prefecture: '兵庫県', area: '西宮市' },
  { prefecture: '埼玉県', area: 'さいたま市' }, { prefecture: '埼玉県', area: '川越市' },
  { prefecture: '神奈川県', area: '横浜市' }, { prefecture: '神奈川県', area: '相模大野駅周辺（相模原市南区）' },
  { prefecture: '三重県', area: '津市' }, { prefecture: '三重県', area: '四日市市' }, { prefecture: '三重県', area: '伊勢市' },
  { prefecture: '滋賀県', area: '大津市' }, { prefecture: '滋賀県', area: '草津市' }, { prefecture: '滋賀県', area: '彦根市' }
]);

const point = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
export function normalizeBounds(bounds, maxSpan = 0.08) {
  const sw = bounds?.southWest || bounds?._southWest || bounds?.getSouthWest?.() || (Number.isFinite(bounds?.south) ? {lat:bounds.south,lng:bounds.west} : null);
  const ne = bounds?.northEast || bounds?._northEast || bounds?.getNorthEast?.() || (Number.isFinite(bounds?.north) ? {lat:bounds.north,lng:bounds.east} : null);
  if (!point(sw) || !point(ne) || sw.lat > ne.lat || sw.lng > ne.lng || ne.lat - sw.lat > maxSpan || ne.lng - sw.lng > maxSpan) {
    throw new Error('地図範囲が不正か広すぎます。拡大してから検索してください');
  }
  return Object.freeze({ south: sw.lat, west: sw.lng, north: ne.lat, east: ne.lng });
}
export function boundsCenter(b) { return { lat: (b.south + b.north) / 2, lng: (b.west + b.east) / 2 }; }
export function insideBounds(p, b) { return point(p) && p.lat >= b.south && p.lat <= b.north && p.lng >= b.west && p.lng <= b.east; }
function boundsKey(b) { return [b.south,b.west,b.north,b.east].map(n => n.toFixed(4)).join(','); }

const REGISTERED_MUNICIPALITIES = Object.freeze([
  ['nara-park-', '奈良市'], ['kobe-', '神戸市'], ['nishinomiya-', '西宮市'],
  ['saitama-', 'さいたま市'], ['sagamihara-sagami-ono', '相模大野周辺'],
  ['tsu-', '津市'], ['yokkaichi-', '四日市市'], ['ise-', '伊勢市'], ['otsu-', '大津市']
]);

// Select a real existing sample center nearest the group's centroid; never invent a map coordinate.
export function buildPreparedRegionOptions(regions) {
  if (!Array.isArray(regions)) return [];
  const options = [];
  for (const [prefix, name] of REGISTERED_MUNICIPALITIES) {
    const samples = regions.filter(r => typeof r?.id === 'string' && r.id.startsWith(prefix) && point(r));
    if (!samples.length) continue;
    const mean = samples.reduce((sum, r) => ({lat:sum.lat+r.lat/samples.length,lng:sum.lng+r.lng/samples.length}), {lat:0,lng:0});
    const center = samples.reduce((best, r) => {
      const score = (r.lat-mean.lat)**2 + (r.lng-mean.lng)**2;
      return score < best.score ? {score, region:r} : best;
    }, {score:Infinity,region:samples[0]}).region;
    options.push({id:prefix,name,lat:center.lat,lng:center.lng,samples:samples.length});
  }
  return options;
}

export function createViewportFacilityAdapter({ provider, now = Date.now, minIntervalMs = 5000, cacheSize = 8 } = {}) {
  if (!provider || (typeof provider.get !== 'function' && typeof provider.getViewport !== 'function')) throw new TypeError('施設データ提供元が必要です');
  const cache = new Map();
  let lastRequestAt = -Infinity, inFlight = null;
  return {
    async get(input) {
      const bounds = normalizeBounds(input), key = boundsKey(bounds), cached = cache.get(key);
      if (cached) return { ...cached, cached: true };
      if (inFlight) return inFlight;
      const wait = minIntervalMs - (now() - lastRequestAt);
      if (wait > 0) throw new Error(`施設検索はあと${Math.ceil(wait / 1000)}秒待ってください`);
      lastRequestAt = now();
      inFlight = (async () => {
        const raw = typeof provider.getViewport === 'function'
          ? await provider.getViewport(bounds)
          : await provider.get(boundsCenter(bounds));
        const seen = new Set(), data = [];
        for (const f of Array.isArray(raw?.data) ? raw.data : []) {
          const identity = f?.id || f?.source || `${f?.lat},${f?.lng},${f?.name}`;
          if (!insideBounds(f, bounds) || seen.has(identity)) continue;
          seen.add(identity); data.push(f);
        }
        const value = {
          ...raw, data: data.slice(0, 80),
          status: raw?.status === 'unprepared' ? 'unprepared' : 'insufficient',
          bounds, retrievedAt: raw?.at || now(), partial: true,
          coverageComplete: false,
          message: raw?.status === 'unprepared' ? 'この地図範囲は未取得です' : '登録情報の一部です。情報が不十分な場合があります'
        };
        cache.set(key, value);
        while (cache.size > cacheSize) cache.delete(cache.keys().next().value);
        return value;
      })();
      try { return await inFlight; } finally { inFlight = null; }
    }
  };
}
