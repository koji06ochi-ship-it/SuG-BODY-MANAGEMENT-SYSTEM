/* S.u.G SWAG Progression Engine: Comprehensive EXP, Level, S.u.G COIN Wallet, Outfits, and Official 100-Titles Importer/Evaluator */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SuGSwagProgression = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var OUTFITS = [
    { id: 'pink-gold-hoodie', name: 'ピンク・ゴールドパーカー', minLevel: 1, minCoins: 0 },
    { id: 'recovery-robe', name: 'リカバリー・リラックスウェア', minLevel: 1, minCoins: 20 },
    { id: 'neon-runner', name: 'ネオンランナー・セットアップ', minLevel: 2, minCoins: 50 },
    { id: 'hiphop-street', name: 'ヒップホップ・ゴールドジャケット', minLevel: 3, minCoins: 100 },
    { id: 'swag-crown', name: 'SWAGゴールドクラウン正装', minLevel: 5, minCoins: 200 }
  ];

  function computeMetrics(store) {
    var days = (store && store.days) || {};
    var m = {
      trainingCount: 0,
      runningKm: 0,
      hyroxCount: 0,
      goodSleepDays: 0,
      restDays: 0,
      mealCount: 0,
      hydrationDays: 0,
      walkDays: 0,
      totalSteps: 0,
      resetCount: 0,
      behaviorChecks: 0,
      alcoholFreeDays: 0,
      loggedDays: Object.keys(days).length
    };
    Object.keys(days).forEach(function (dk) {
      var d = days[dk] || {};
      var tr = Array.isArray(d.trainingLogs) ? d.trainingLogs : [];
      m.trainingCount += tr.length;
      tr.forEach(function (t) {
        if (Number.isFinite(Number(t.distanceKm))) m.runningKm += Number(t.distanceKm);
        if (t.mode === 'hyrox' || t.part === 'HYROX・機能的トレーニング') m.hyroxCount += 1;
      });
      if (d.recoveryState && d.recoveryState.sleepHours != null && Number(d.recoveryState.sleepHours) >= 6.5) m.goodSleepDays += 1;
      var rb = d.recoveryBehaviors || {};
      if (rb.rest || rb.bath) m.restDays += 1;
      m.mealCount += Array.isArray(d.meals) ? d.meals.length : 0;
      if (d.hydrationMl != null && Number(d.hydrationMl) >= 1200) m.hydrationDays += 1;
      if ((d.steps != null && Number(d.steps) >= 5000) || (d.walkMinutes != null && Number(d.walkMinutes) >= 15)) m.walkDays += 1;
      if (d.steps != null && Number.isFinite(Number(d.steps))) m.totalSteps += Number(d.steps);
      m.resetCount += Array.isArray(d.resetLogs) ? d.resetLogs.length : 0;
      m.behaviorChecks += Object.keys(rb).filter(function (k) { return !!rb[k]; }).length;
      if (d.alcohol && d.alcohol.status === 'none') m.alcoholFreeDays += 1;
    });
    m.runningKm = Math.round(m.runningKm * 100) / 100;
    return m;
  }

  function computeWalletAndExp(store) {
    var m = computeMetrics(store);
    var breakdown = {
      training: m.trainingCount * 15,
      recovery: m.goodSleepDays * 12 + m.restDays * 10,
      nutrition: Math.min(m.mealCount, m.loggedDays * 3) * 6 + m.hydrationDays * 6,
      walk: m.walkDays * 12,
      reset: m.resetCount * 12,
      lifestyle: m.behaviorChecks * 4 + m.alcoholFreeDays * 8
    };
    var totalExp = breakdown.training + breakdown.recovery + breakdown.nutrition + breakdown.walk + breakdown.reset + breakdown.lifestyle;
    var level = Math.floor(totalExp / 100) + 1;
    var intoLevel = totalExp % 100;

    // S.u.G COIN earned strictly from real logged actions (never dummy starting balance)
    var earnedCoins = Math.floor(totalExp / 5) + m.walkDays * 3 + m.resetCount * 2;
    var walkBonusCoins = Number((store && store.profile && store.profile.walkSyncedCoins) || 0);
    if (!Number.isFinite(walkBonusCoins) || walkBonusCoins < 0) walkBonusCoins = 0;
    var totalCoins = earnedCoins + Math.floor(walkBonusCoins);

    var unlockedOutfits = OUTFITS.filter(function (o) {
      return level >= o.minLevel && totalCoins >= o.minCoins;
    });

    return {
      metrics: m,
      breakdown: breakdown,
      totalExp: totalExp,
      level: level,
      intoLevel: intoLevel,
      nextLevelRemaining: 100 - intoLevel,
      earnedCoins: earnedCoins,
      walkBonusCoins: Math.floor(walkBonusCoins),
      totalCoins: totalCoins,
      outfits: OUTFITS,
      unlockedOutfits: unlockedOutfits
    };
  }

  /* Parse official 100-titles list from user-supplied JSON or CSV (NEVER fabricates fake 100 titles) */
  function parseOfficialTitlesInput(rawText) {
    var txt = String(rawText || '').trim();
    if (!txt) throw new Error('称号データが空です');
    var items = [];
    if (txt.startsWith('[') || txt.startsWith('{')) {
      var parsed = JSON.parse(txt);
      var arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : []);
      items = arr.map(function (x, i) {
        return {
          id: String((x && x.id) || ('title-' + (i + 1))),
          name: String((x && (x.name || x.title)) || '').trim(),
          category: String((x && x.category) || '一般').trim(),
          metric: String((x && x.metric) || '').trim(),
          threshold: Number((x && x.threshold) || 1)
        };
      }).filter(function (x) { return !!x.name; });
    } else {
      var lines = txt.split(/\r?\n/).filter(function (l) { return l.trim(); });
      lines.forEach(function (line, idx) {
        if (idx === 0 && /id|name|称号/i.test(line)) return;
        var cols = line.split(',').map(function (c) { return c.trim(); });
        if (cols.length >= 2 && cols[1]) {
          items.push({
            id: cols[0] || ('title-' + idx),
            name: cols[1],
            category: cols[2] || '一般',
            metric: cols[3] || '',
            threshold: Number(cols[4] || 1)
          });
        }
      });
    }
    if (!items.length) throw new Error('有効な称号行が見つかりませんでした');
    return items.slice(0, 100);
  }

  function evaluateOfficialTitles(store) {
    var list = (store && Array.isArray(store.officialTitles100)) ? store.officialTitles100 : [];
    if (!list.length) {
      return {
        status: 'AWAITING_OFFICIAL_100_TITLES_MASTER',
        total: 0,
        unlockedCount: 0,
        unlocked: []
      };
    }
    var m = computeMetrics(store);
    var unlocked = list.filter(function (t) {
      if (!t.metric || !Object.prototype.hasOwnProperty.call(m, t.metric)) return false;
      return Number(m[t.metric]) >= Number(t.threshold || 1);
    });
    return {
      status: list.length >= 100 ? 'OFFICIAL_100_LOADED' : 'PARTIAL_MASTER_LOADED',
      total: list.length,
      unlockedCount: unlocked.length,
      unlocked: unlocked
    };
  }

  return {
    OUTFITS: OUTFITS,
    computeMetrics: computeMetrics,
    computeWalletAndExp: computeWalletAndExp,
    parseOfficialTitlesInput: parseOfficialTitlesInput,
    evaluateOfficialTitles: evaluateOfficialTitles
  };
});
