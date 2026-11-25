/* S.u.G SWAG (formerly BODY) Renewal Core Logic
   Preserves Schema v2, Storage Keys, Legacy Auto-Migration, Recovery Score, Alcohol,
   Comprehensive Avatar EXP/Growth, Training + RIR + Progressive Overload, RESET + YouTube Links,
   12-Domain Psychology AI Coach, HealthKit Write-Confirmation Semantics, and WALK Privacy-Safe Bridge */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.SuGBodyCore = api;
    root.SuGSwagCore = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCHEMA_VERSION = 2;
  var STORAGE_KEY = 'sug_body_renewal_v2';
  var LEGACY_PREVIEW_KEY = 'sug_body_pink_preview_v1';

  function round1(n) {
    return Math.round(Number(n) * 10) / 10;
  }

  function clamp(v, min, max) {
    var n = Number(v);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function isoToday(d) {
    var dt = d ? new Date(d) : new Date();
    var y = dt.getFullYear();
    var m = String(dt.getMonth() + 1).padStart(2, '0');
    var day = String(dt.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function isOfficialYouTubeUrl(url) {
    if (typeof url !== 'string') return false;
    try {
      var u = new URL(url.trim());
      if (u.protocol !== 'https:') return false;
      var h = u.hostname.toLowerCase();
      return h === 'www.youtube.com' || h === 'youtube.com' || h === 'm.youtube.com' || h === 'youtu.be';
    } catch (e) {
      return false;
    }
  }

  function createEmptyDay(dateKey) {
    return {
      date: dateKey || isoToday(),
      todayIntent: '',
      mood: '',
      todayGoal: '',
      steps: null,
      distanceKm: null,
      walkMinutes: null,
      outdoorMinutes: null,
      morningLight: false,
      recoveryState: {
        sleepHours: null,
        sleepQuality: null,
        sleepRegularity: null,
        bedTime: '',
        wakeTime: '',
        nightWakings: null,
        napMinutes: null,
        restingHr: null,
        hrvMs: null,
        physicalFatigue: null,
        muscleSoreness: null,
        exerciseLoad: null,
        mentalFatigue: null,
        stress: null,
        bodyStiffness: null,
        subjectiveEnergy: null
      },
      recoveryBehaviors: {
        bath: false,
        rest: false,
        walk: false,
        sunlight: false,
        breathing: false,
        stretch: false,
        mindfulness: false,
        meals: false,
        hydration: false,
        alcoholFree: false,
        hobby: false,
        holidayEnjoy: false
      },
      bathLog: { durationMin: null, tempC: null, type: '', timing: '', postChange: '' },
      hydrationMl: null,
      sweatLevel: '',
      electrolytes: false,
      workoutHydrationMl: null,
      gut: {
        bowelCount: null,
        bristolScale: null,
        bloating: null,
        fermentedFood: false
      },
      alcohol: {
        status: '',
        drinks: []
      },
      meals: [],
      trainingLogs: [],
      resetLogs: [],
      bodyMetrics: {
        weightKg: null,
        bodyFatPct: null,
        painSites: [],
        romNote: '',
        menstrualPhase: ''
      }
    };
  }

  function createDefaultStore() {
    var today = isoToday();
    var days = {};
    days[today] = createEmptyDay(today);
    return {
      schemaVersion: SCHEMA_VERSION,
      profile: {
        name: 'ゲスト',
        avatarId: 'pink-bear',
        goal: '身体もしなやかに、心もしなやかに。',
        heightCm: null,
        targetWeightKg: null,
        healthKitConnected: false,
        aiApiConnected: false,
        walkSyncConsent: false,
        aiSendConsent: false
      },
      baselines: {
        sleepHours14d: null,
        restingHr14d: null,
        hrvMs14d: null,
        chronicLoad28d: null
      },
      youtubeBookmarks: [],
      officialTitles100: [],
      days: days
    };
  }

  function migrateStore(raw) {
    if (!raw || typeof raw !== 'object') return createDefaultStore();
    var base = createDefaultStore();
    if (raw.schemaVersion === SCHEMA_VERSION && raw.days) {
      base.profile = Object.assign(base.profile, raw.profile || {});
      base.baselines = Object.assign(base.baselines, raw.baselines || {});
      base.youtubeBookmarks = Array.isArray(raw.youtubeBookmarks)
        ? raw.youtubeBookmarks.filter(function (x) { return x && isOfficialYouTubeUrl(x.url); })
        : [];
      base.officialTitles100 = Array.isArray(raw.officialTitles100) ? raw.officialTitles100.slice(0, 100) : [];
      Object.keys(raw.days).forEach(function (k) {
        var d = createEmptyDay(k);
        var src = raw.days[k] || {};
        Object.assign(d, src);
        d.recoveryState = Object.assign(createEmptyDay(k).recoveryState, src.recoveryState || {});
        d.recoveryBehaviors = Object.assign(createEmptyDay(k).recoveryBehaviors, src.recoveryBehaviors || {});
        d.bathLog = Object.assign(createEmptyDay(k).bathLog, src.bathLog || {});
        d.gut = Object.assign(createEmptyDay(k).gut, src.gut || {});
        d.alcohol = Object.assign(createEmptyDay(k).alcohol, src.alcohol || {});
        if (!Array.isArray(d.alcohol.drinks)) d.alcohol.drinks = [];
        if (!Array.isArray(d.meals)) d.meals = [];
        if (!Array.isArray(d.trainingLogs)) d.trainingLogs = [];
        if (!Array.isArray(d.resetLogs)) d.resetLogs = [];
        d.bodyMetrics = Object.assign(createEmptyDay(k).bodyMetrics, src.bodyMetrics || {});
        if (src.recoveryRefreshV1) {
          var rr = src.recoveryRefreshV1;
          if (rr.sleepQuality != null && d.recoveryState.sleepQuality == null) d.recoveryState.sleepQuality = Number(rr.sleepQuality);
          if (rr.energy != null && d.recoveryState.subjectiveEnergy == null) d.recoveryState.subjectiveEnergy = Number(rr.energy);
          if (rr.calm != null && d.recoveryState.stress == null) d.recoveryState.stress = 6 - Number(rr.calm);
          if (rr.drink === 'none' && !d.alcohol.status) d.alcohol.status = 'none';
          if (rr.drink === 'yes' && d.alcohol.drinks.length === 0 && rr.ml && rr.pct) {
            d.alcohol.status = 'yes';
            d.alcohol.drinks.push({ id: 'legacy-1', name: rr.drinkName || '飲酒記録', ml: Number(rr.ml), abv: Number(rr.pct), timing: '' });
          }
        }
        base.days[k] = d;
      });
      return base;
    }
    return base;
  }

  /* Alcohol pure ethanol grams: ml * abv% / 100 * 0.8 */
  function calcDrinkPureAlcoholG(ml, abv) {
    var m = Number(ml);
    var a = Number(abv);
    if (!Number.isFinite(m) || !Number.isFinite(a) || m <= 0 || a < 0) return 0;
    return round1(m * a / 100 * 0.8);
  }

  function calcDayAlcoholSummary(dayObj) {
    var alc = (dayObj && dayObj.alcohol) || { status: '', drinks: [] };
    if (alc.status === '') {
      return { recorded: false, isAlcoholFree: null, totalGrams: null, drinkCount: 0, label: '未記録' };
    }
    if (alc.status === 'none') {
      return { recorded: true, isAlcoholFree: true, totalGrams: 0, drinkCount: 0, label: '休肝日 (0g)' };
    }
    var drinks = Array.isArray(alc.drinks) ? alc.drinks : [];
    var total = drinks.reduce(function (sum, item) {
      return sum + calcDrinkPureAlcoholG(item.ml, item.abv);
    }, 0);
    total = round1(total);
    return {
      recorded: true,
      isAlcoholFree: total === 0,
      totalGrams: total,
      drinkCount: drinks.length,
      label: total === 0 ? '休肝日 (0g)' : '純アルコール ' + total + 'g (' + drinks.length + '杯)'
    };
  }

  function calcAlcoholStreak(daysMap, refDate) {
    var keys = Object.keys(daysMap || {}).sort().reverse();
    var todayKey = refDate || isoToday();
    var consecutiveDrinking = 0;
    var alcoholFree7d = 0;
    var recorded7d = 0;
    var totalGrams7d = 0;
    var totalGrams28d = 0;

    var refMs = new Date(todayKey + 'T00:00:00').getTime();
    keys.forEach(function (k) {
      var diffDays = Math.round((refMs - new Date(k + 'T00:00:00').getTime()) / 86400000);
      if (diffDays < 0 || diffDays >= 28) return;
      var s = calcDayAlcoholSummary(daysMap[k]);
      if (!s.recorded) return;
      totalGrams28d += s.totalGrams || 0;
      if (diffDays < 7) {
        recorded7d += 1;
        totalGrams7d += s.totalGrams || 0;
        if (s.isAlcoholFree) alcoholFree7d += 1;
      }
    });

    for (var i = 0; i < 30; i++) {
      var d = new Date(refMs - i * 86400000);
      var k = isoToday(d);
      var s = calcDayAlcoholSummary(daysMap[k]);
      if (!s.recorded || s.isAlcoholFree) break;
      consecutiveDrinking += 1;
    }

    return {
      consecutiveDrinkingDays: consecutiveDrinking,
      alcoholFree7d: alcoholFree7d,
      recorded7d: recorded7d,
      totalGrams7d: round1(totalGrams7d),
      totalGrams28d: round1(totalGrams28d)
    };
  }

  /* 12-Condition Evidence-Informed Recovery Score Engine */
  function scoreLikertPositive(v) {
    if (v == null || v === '') return null;
    return clamp((Number(v) - 1) * 25, 0, 100);
  }

  function scoreLikertInverse(v) {
    if (v == null || v === '') return null;
    return clamp((5 - Number(v)) * 25, 0, 100);
  }

  function computeRecoveryScore(dayObj, baselines) {
    var d = dayObj || createEmptyDay();
    var rs = d.recoveryState || {};
    var rb = d.recoveryBehaviors || {};
    var bl = baselines || {};

    var domains = [];

    // 1. Sleep & Circadian (Weight 25)
    var sleepParts = [];
    if (rs.sleepHours != null && rs.sleepHours !== '') {
      var h = Number(rs.sleepHours);
      var target = bl.sleepHours14d || 7.5;
      var diff = Math.abs(h - target);
      var sHours = h >= 7 && h <= 9 ? 95 : clamp(100 - diff * 18, 15, 95);
      sleepParts.push({ label: '睡眠時間', val: sHours, type: '実測/入力' });
    }
    if (rs.sleepQuality != null && rs.sleepQuality !== '') {
      sleepParts.push({ label: '睡眠満足度', val: scoreLikertPositive(rs.sleepQuality), type: '主観' });
    }
    if (rs.sleepRegularity != null && rs.sleepRegularity !== '') {
      sleepParts.push({ label: '睡眠リズム', val: scoreLikertPositive(rs.sleepRegularity), type: '主観' });
    }
    domains.push({
      id: 'sleep',
      name: '睡眠・概日リズム',
      weight: 25,
      available: sleepParts.length > 0,
      score: sleepParts.length ? Math.round(sleepParts.reduce(function (a, b) { return a + b.val; }, 0) / sleepParts.length) : null,
      sourceType: sleepParts.some(function (p) { return p.type === '実測/入力'; }) ? '実測+主観' : '主観',
      note: sleepParts.length ? sleepParts.map(function (p) { return p.label + ':' + Math.round(p.val); }).join(' / ') : '未取得'
    });

    // 2. Physical Fatigue & Load (Weight 20)
    var physParts = [];
    if (rs.physicalFatigue != null && rs.physicalFatigue !== '') physParts.push(scoreLikertInverse(rs.physicalFatigue));
    if (rs.muscleSoreness != null && rs.muscleSoreness !== '') physParts.push(scoreLikertInverse(rs.muscleSoreness));
    if (rs.exerciseLoad != null && rs.exerciseLoad !== '') physParts.push(scoreLikertInverse(rs.exerciseLoad));
    if (rs.bodyStiffness != null && rs.bodyStiffness !== '') physParts.push(scoreLikertInverse(rs.bodyStiffness));
    domains.push({
      id: 'physical',
      name: '身体疲労・筋痛・負荷',
      weight: 20,
      available: physParts.length > 0,
      score: physParts.length ? Math.round(physParts.reduce(function (a, b) { return a + b; }, 0) / physParts.length) : null,
      sourceType: '主観',
      note: physParts.length ? physParts.length + '項目入力' : '未取得'
    });

    // 3. HR & HRV (Weight 15)
    var hrParts = [];
    var hrBaselineNote = [];
    if (rs.hrvMs != null && rs.hrvMs !== '') {
      var hrv = Number(rs.hrvMs);
      if (bl.hrvMs14d && bl.hrvMs14d > 0) {
        var ratio = hrv / bl.hrvMs14d;
        hrParts.push(clamp(75 + (ratio - 1) * 100, 15, 100));
        hrBaselineNote.push('HRV比 ' + round1(ratio * 100) + '%');
      } else {
        hrBaselineNote.push('HRV ' + hrv + 'ms(個人基準値確立中)');
      }
    }
    if (rs.restingHr != null && rs.restingHr !== '') {
      var rhr = Number(rs.restingHr);
      if (bl.restingHr14d && bl.restingHr14d > 0) {
        var rRatio = rhr / bl.restingHr14d;
        hrParts.push(clamp(78 - (rRatio - 1) * 140, 15, 100));
        hrBaselineNote.push('安静時心拍比 ' + round1(rRatio * 100) + '%');
      } else {
        hrBaselineNote.push('RHR ' + rhr + 'bpm(個人基準値確立中)');
      }
    }
    domains.push({
      id: 'autonomic',
      name: '心拍・HRV (自律神経)',
      weight: 15,
      available: hrParts.length > 0,
      score: hrParts.length ? Math.round(hrParts.reduce(function (a, b) { return a + b; }, 0) / hrParts.length) : null,
      sourceType: '実測/Wearable',
      note: hrParts.length ? hrBaselineNote.join(' / ') : (hrBaselineNote.length ? hrBaselineNote.join(' / ') : '未取得 (HealthKit連携待ち)')
    });

    // 4. Mental & Stress (Weight 15)
    var mentalParts = [];
    if (rs.mentalFatigue != null && rs.mentalFatigue !== '') mentalParts.push(scoreLikertInverse(rs.mentalFatigue));
    if (rs.stress != null && rs.stress !== '') mentalParts.push(scoreLikertInverse(rs.stress));
    if (rs.subjectiveEnergy != null && rs.subjectiveEnergy !== '') mentalParts.push(scoreLikertPositive(rs.subjectiveEnergy));
    domains.push({
      id: 'mental',
      name: '精神疲労・ストレス・元気さ',
      weight: 15,
      available: mentalParts.length > 0,
      score: mentalParts.length ? Math.round(mentalParts.reduce(function (a, b) { return a + b; }, 0) / mentalParts.length) : null,
      sourceType: '主観',
      note: mentalParts.length ? mentalParts.length + '項目入力' : '未取得'
    });

    // 5. Nutrition & Hydration (Tracked separately as lifestyle behavior)
    domains.push({
      id: 'nutrition',
      name: '食事・水分補給',
      weight: 10,
      available: false,
      score: null,
      sourceType: '生活行動',
      note: '生活行動として別管理（回復状態スコアへ自動加算しません）'
    });

    // 6. Breathing & Movement (Tracked separately as lifestyle behavior)
    domains.push({
      id: 'movement',
      name: '呼吸・身体連動・歩数',
      weight: 10,
      available: false,
      score: null,
      sourceType: '生活行動',
      note: '生活行動として別管理（回復状態スコアへ自動加算しません）'
    });

    // 7. Gut Condition (Weight 5)
    var gutParts = [];
    var gut = d.gut || {};
    if (gut.bristolScale != null && gut.bristolScale !== '') {
      var bs = Number(gut.bristolScale);
      gutParts.push(bs === 4 ? 100 : (bs === 3 || bs === 5) ? 85 : 55);
    }
    if (gut.bloating != null && gut.bloating !== '') {
      gutParts.push(scoreLikertInverse(gut.bloating));
    }
    domains.push({
      id: 'gut',
      name: '腸内環境コンディション',
      weight: 5,
      available: gutParts.length > 0,
      score: gutParts.length ? Math.round(gutParts.reduce(function (a, b) { return a + b; }, 0) / gutParts.length) : null,
      sourceType: '主観',
      note: gutParts.length ? '便・膨満感入力済み' : '未取得'
    });

    var activeDomains = domains.filter(function (dm) { return dm.available; });
    var activeWeight = activeDomains.reduce(function (s, dm) { return s + dm.weight; }, 0);
    var coveragePct = activeWeight;

    var score = null;
    var status = '未評価';
    var confidenceLabel = 'データ不足';
    if (activeDomains.length >= 2 && coveragePct >= 25) {
      var weightedSum = activeDomains.reduce(function (s, dm) { return s + dm.score * dm.weight; }, 0);
      score = Math.round(weightedSum / activeWeight);
      if (coveragePct >= 60) {
        status = score >= 80 ? '回復良好' : score >= 60 ? '概ね安定' : score >= 45 ? 'やや疲労' : '回復優先';
        confidenceLabel = coveragePct >= 80 ? '高 (本評価)' : '中 (本評価)';
      } else {
        status = '暫定スコア';
        confidenceLabel = '低 (暫定・入力不足)';
      }
    }

    var behaviorKeys = Object.keys(rb);
    var behaviorDone = behaviorKeys.filter(function (k) { return !!rb[k]; }).length;

    return {
      score: score,
      status: status,
      coveragePct: coveragePct,
      confidenceLabel: confidenceLabel,
      isProvisional: coveragePct > 0 && coveragePct < 60,
      isUnassessed: score === null,
      domains: domains,
      behaviorDone: behaviorDone,
      behaviorTotal: behaviorKeys.length,
      disclaimer: 'ウェルネス参考値であり、医学的診断ではありません。'
    };
  }

  /* Progressive Overload Comparison: compare current exercise against most recent prior entry */
  function findPreviousTrainingEntry(daysMap, todayKey, exerciseName, excludeId) {
    var target = String(exerciseName || '').trim().toLowerCase();
    if (!target) return null;
    var keys = Object.keys(daysMap || {}).sort().reverse();
    for (var i = 0; i < keys.length; i++) {
      var dk = keys[i];
      if (dk > todayKey) continue;
      var logs = (daysMap[dk] && daysMap[dk].trainingLogs) || [];
      for (var j = logs.length - 1; j >= 0; j--) {
        var t = logs[j];
        if (!t || t.id === excludeId) continue;
        if (String(t.exercise || '').trim().toLowerCase() === target) {
          return { day: dk, entry: t };
        }
      }
    }
    return null;
  }

  /* Comprehensive Avatar Growth (Training + Rest + Sleep + Nutrition + Walk + Breathing + Lifestyle) */
  function computeAvatarGrowthExp(store) {
    var breakdown = {
      training: 0,
      recovery: 0,
      nutrition: 0,
      walk: 0,
      reset: 0,
      lifestyle: 0
    };
    var days = (store && store.days) || {};
    Object.keys(days).forEach(function (dk) {
      var d = days[dk] || {};
      breakdown.training += (Array.isArray(d.trainingLogs) ? d.trainingLogs.length : 0) * 15;
      if (d.recoveryState && d.recoveryState.sleepHours != null && d.recoveryState.sleepHours >= 6.5) breakdown.recovery += 12;
      var rb = d.recoveryBehaviors || {};
      if (rb.rest || rb.bath) breakdown.recovery += 10;
      breakdown.nutrition += Math.min(3, Array.isArray(d.meals) ? d.meals.length : 0) * 6;
      if (d.hydrationMl != null && d.hydrationMl >= 1200) breakdown.nutrition += 6;
      if ((d.steps != null && d.steps >= 5000) || (d.walkMinutes != null && d.walkMinutes >= 15)) breakdown.walk += 12;
      breakdown.reset += (Array.isArray(d.resetLogs) ? d.resetLogs.length : 0) * 12;
      var behCount = Object.keys(rb).filter(function (k) { return !!rb[k]; }).length;
      breakdown.lifestyle += behCount * 4;
    });
    var totalExp = breakdown.training + breakdown.recovery + breakdown.nutrition + breakdown.walk + breakdown.reset + breakdown.lifestyle;
    var level = Math.floor(totalExp / 100) + 1;
    var intoLevel = totalExp % 100;
    return {
      totalExp: totalExp,
      level: level,
      intoLevel: intoLevel,
      nextLevelRemaining: 100 - intoLevel,
      breakdown: breakdown
    };
  }

  function computeAvatarState(store, todayKey) {
    var k = todayKey || isoToday();
    var d = (store && store.days && store.days[k]) || createEmptyDay(k);
    var rec = computeRecoveryScore(d, store && store.baselines);
    var exp = computeAvatarGrowthExp(store);
    var trainCount = Array.isArray(d.trainingLogs) ? d.trainingLogs.length : 0;
    var restChecked = !!(d.recoveryBehaviors && (d.recoveryBehaviors.rest || d.recoveryBehaviors.bath || d.recoveryBehaviors.mindfulness));

    var stage = '整えビギナー';
    var expression = 'おだやか';
    var outfit = 'ピンク・ゴールドパーカー';
    var action = '今日の気分を選んでスタート';
    var message = '身体もしなやかに、心もしなやかに。今日も自分のペースでいこう。';

    if (trainCount >= 2 && !restChecked && rec.score !== null && rec.score < 50) {
      stage = 'ムキムキ横臥モード';
      expression = 'やりすぎ脱力';
      outfit = 'ゴールドリストバンド＋休息マット';
      action = 'ムキムキだけど横になって休養中';
      message = '筋肉は頑張った！今は横になって回復を育てる時間だよ。';
    } else if (rec.score !== null && rec.score >= 80 && rec.behaviorDone >= 4) {
      stage = 'ゴールデン・バランス';
      expression = 'きらきら笑顔';
      outfit = 'ゴールド王冠・ネオンピンク';
      action = '休日・外出プランを楽しめる好調モード';
      message = '心と身体の余白が整ってる！OWN YOUR STYLEで新しい体験へ出かけよう。';
    } else if (restChecked) {
      stage = 'リカバリー育成中';
      expression = 'ほっと安心';
      outfit = 'リラックスウェア';
      action = '休養・呼吸で回復ポイントを蓄積中';
      message = '休むことも立派な身体づくり。しなやかな選択だね。';
    } else if (trainCount >= 1) {
      stage = 'アクティブ・グロウ';
      expression = 'きりっと集中';
      outfit = 'トレーニングギア';
      action = '運動後の栄養・水分・睡眠へつなぐ';
      message = 'ナイスワーク！この後のケアまでがSWAGスタイルだよ。';
    }

    return {
      avatarId: (store && store.profile && store.profile.avatarId) || 'pink-bear',
      stage: stage,
      outfit: outfit,
      title: stage,
      expression: expression,
      action: action,
      message: message,
      exp: exp,
      updatedAt: new Date().toISOString(),
      disclaimer: 'アバターの見た目・状態は習慣のゲーム的表現であり、実際の身体的予測ではありません。'
    };
  }

  /* WALK Shared Avatar Payload (strictly excludes health/worry/medical logs) */
  function buildWalkSharePayload(store, todayKey) {
    var av = computeAvatarState(store, todayKey);
    var prog = (typeof self !== 'undefined' && self.SuGSwagProgression) ? self.SuGSwagProgression.computeWalletAndExp(store) : null;
    var coins = prog ? prog.totalCoins : Math.floor(av.exp.totalExp / 5);
    return {
      app: 'S.u.G SWAG',
      avatarId: av.avatarId,
      growthStage: av.stage,
      level: prog ? prog.level : av.exp.level,
      totalExp: prog ? prog.totalExp : av.exp.totalExp,
      coins: coins,
      outfit: (store && store.profile && store.profile.selectedOutfitName) || av.outfit,
      title: av.title,
      expression: av.expression,
      action: av.action,
      updatedAt: av.updatedAt
    };
  }

  /* AI Coach System Prompt & Offline Psychology-Grounded Consultation (All 12 Domains) */
  var AI_COACH_SYSTEM_PROMPT = [
    'あなたはS.u.G SWAG（エスユージー スワッグ）の専属AI COACH oToです。',
    'スローガンは「OWN YOUR STYLE. LIVE YOUR LIFE.」、コンセプトは「身体もしなやかに、心もしなやかに。」。',
    '1. 筋肥大や健康管理そのものをゴールにせず、身体能力・回復・心理的柔軟性・仕事・恋愛・人間関係・将来・自信・趣味・休日の充実を支援してください。',
    '2. 心理学・行動科学・健康心理学・認知行動的アプローチ（CBT、認知的再評価、リフレーミング、自己決定理論、自己効力感、実装意図If-Then、行動活性化）を活用してください。',
    '3. 全肯定せず、共感＋客観的視点のバランスを保ってください。医療・精神科の診断は行いません。',
    '4. 自傷・強い希死念慮や深刻な危機が示唆された場合は、専門相談窓口（よりそいホットライン・こころの健康相談統一ダイヤル等）を案内してください。',
    '5. 回復スコアが低い日（<45）は、無理な運動負荷の増加を勧めず、休養・呼吸・散歩など低負荷の選択肢を提案してください。'
  ].join('\n');

  function generateOfflineCoachReply(topic, userText, rec) {
    var scoreText = rec && rec.score != null ? '現在の回復スコアは ' + rec.score + ' 点（' + rec.status + '）' : '回復スコアは未評価';
    var crisis = /(死にたい|消えたい|自殺|自傷)/.test(userText || '');
    if (crisis) {
      return {
        mode: 'offline-safety',
        reply: 'とてもつらいお気持ちを話してくれてありがとうございます。ここでは医療・専門的対応ができないため、一人で抱え込まず専門窓口へご相談ください。\n・よりそいホットライン: 0120-279-338（24時間・通話無料）\n・こころの健康相談統一ダイヤル: 0570-064-556\n今すぐ安全で落ち着ける場所でお過ごしください。'
      };
    }

    var map = {
      training: '【漸進性×回復連動】' + scoreText + '。' + (rec && rec.score != null && rec.score < 45 ? '回復優先サインのため重量増加は控え、360度呼吸・胸椎モビリティ・軽めの動作チェックに留めましょう。' : '「前回より1回だけ丁寧に／RIR2〜3を残す」など自己効力感が育つ小さなステップで進めると、しなやかに強くなれます。'),
      nutrition: '【行動科学×栄養ケア】完璧な食事を目指すより「たんぱく質を毎食手のひら1枚分＋水分をこまめに」など、1つだけ再現性の高い行動に絞ると継続率が上がります。',
      sleep: '【概日リズム×睡眠衛生】就寝時刻の固定と朝の光曝露がリズムを整えます。眠れない夜に自分を責めず「横になって目を閉じるだけでも休息になる」と認知を再評価しましょう。',
      fatigue: '【回復状態と行動の分離】' + scoreText + '。疲労が強い日は「気合いで乗り切る」のではなく、負荷を下げる判断そのものがプロフェッショナルな調整力です。',
      stress: '【CBT・リフレーミング】ストレス源を「自分で変えられること」と「変えられないこと」に紙へ書き出して仕分けし、まず呼吸を6秒吐くことから自律神経を落ち着かせましょう。',
      relationships: '【認知的再評価・境界線】相手の反応は相手自身の状態による部分が大きいです。事実と解釈を分け、自分の価値と切り離しながら誠実な一言だけを選んでみましょう。',
      romance: '【自己決定×安心感】相手に合わせすぎず「自分が心地よい距離感・スタイル」を大切にすることが、結果的に魅力的な関係につながります。焦らず今日できる小さな自分磨きに意識を戻しましょう。',
      work: '【自己効力感×タスク分割】大きな課題ほど先延ばしが起きます。「最初の5分だけ着手する最小ステップ」を決めると脳の抵抗が下がり、流れが生まれます。',
      future: '【価値観ベース設計】10年後の完璧な正解を探すより、「今月どんな身体と心で毎日を過ごしたいか」という価値観から逆算して小さな実験を1つ始めましょう。',
      confidence: '【スモールウィン・自己効力感】自信は結果の前ではなく「約束した小さな行動（例：3分呼吸・10分散歩）を守れた経験」の積み重ねから育ちます。',
      habit: '【実装意図（If-Thenプラン）】「もし帰宅してソファに座る前に、まず白湯を1杯飲んで3分だけ360度呼吸する」のようにトリガーを具体化すると意志力に頼らず続きます。',
      holiday: '【行動活性化・休日の充実】' + scoreText + '。' + (rec && rec.score != null && rec.score < 50 ? '今日は詰め込みすぎず、近所の公園やカフェへ15分散歩して五感を休める休日にしましょう。' : '好調なコンディション！S.u.G WALKで気になっていた街や店舗・スポットを巡り、心身の余白を満たしましょう。')
    };

    var advice = map[topic] || map.habit;
    return {
      mode: 'offline-local',
      reply: '[オフライン心理・行動ガイド／外部AI未接続] ' + advice + '\n※ライブAI応答は既存API接続・本人同意・トークン設定後に有効化されます。'
    };
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORAGE_KEY: STORAGE_KEY,
    LEGACY_PREVIEW_KEY: LEGACY_PREVIEW_KEY,
    AI_COACH_SYSTEM_PROMPT: AI_COACH_SYSTEM_PROMPT,
    isoToday: isoToday,
    isOfficialYouTubeUrl: isOfficialYouTubeUrl,
    createEmptyDay: createEmptyDay,
    createDefaultStore: createDefaultStore,
    migrateStore: migrateStore,
    calcDrinkPureAlcoholG: calcDrinkPureAlcoholG,
    calcDayAlcoholSummary: calcDayAlcoholSummary,
    calcAlcoholStreak: calcAlcoholStreak,
    computeRecoveryScore: computeRecoveryScore,
    findPreviousTrainingEntry: findPreviousTrainingEntry,
    computeAvatarGrowthExp: computeAvatarGrowthExp,
    computeAvatarState: computeAvatarState,
    buildWalkSharePayload: buildWalkSharePayload,
    generateOfflineCoachReply: generateOfflineCoachReply
  };
});


(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  var C = window.SuGBodyCore;
  function esc(v) { return String(v ?? '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]); }); }
  var LEGACY_FORMAL_KEY = 'sug_body_daily_candidate_20261026_v1';
  var store = loadStore();
  var todayKey = C.isoToday();
  if (!store.days[todayKey]) store.days[todayKey] = C.createEmptyDay(todayKey);

  function migrateLegacyFormalInto(targetStore) {
    try {
      var legFormalRaw = localStorage.getItem(LEGACY_FORMAL_KEY);
      if (legFormalRaw) {
        var lf = JSON.parse(legFormalRaw);
        if (lf && typeof lf === 'object') {
          if (lf.profile && lf.profile.goal && (targetStore.profile.goal === '身体を整えて日常を豊かにする' || targetStore.profile.goal === '身体もしなやかに、心もしなやかに。')) {
            targetStore.profile.goal = String(lf.profile.goal);
          }
          if (lf.days && typeof lf.days === 'object') {
            Object.keys(lf.days).forEach(function (dk) {
              var srcDay = lf.days[dk] || {};
              if (!targetStore.days[dk]) targetStore.days[dk] = C.createEmptyDay(dk);
              var dst = targetStore.days[dk];
              if (dst.steps == null && srcDay.steps != null && srcDay.steps !== '') dst.steps = Number(srcDay.steps);
              if (dst.distanceKm == null && srcDay.distance != null && srcDay.distance !== '') dst.distanceKm = Number(srcDay.distance);
              if (dst.recoveryState.sleepHours == null && srcDay.sleep != null && srcDay.sleep !== '') dst.recoveryState.sleepHours = Number(srcDay.sleep);
              if (dst.bodyMetrics.weightKg == null && srcDay.weight != null && srcDay.weight !== '') dst.bodyMetrics.weightKg = Number(srcDay.weight);
            });
          }
          if (Array.isArray(lf.foods)) {
            lf.foods.forEach(function (fd) {
              var dk = (fd && fd.day) || C.isoToday();
              if (!targetStore.days[dk]) targetStore.days[dk] = C.createEmptyDay(dk);
              var id = 'leg-f-' + (fd.id || fd.name || Math.random());
              if (!targetStore.days[dk].meals.some(function (m) { return m.id === id; })) {
                targetStore.days[dk].meals.push({
                  id: id,
                  dish: String(fd.name || fd.dish || '食事'),
                  kcal: Number(fd.kcal || 0),
                  p: Number(fd.protein || fd.p || 0),
                  f: Number(fd.fat || fd.f || 0),
                  c: Number(fd.carbs || fd.c || 0),
                  fiber: Number(fd.fiber || 0),
                  time: String(fd.time || ''),
                  hungerNote: ''
                });
              }
            });
          }
          if (Array.isArray(lf.workouts)) {
            lf.workouts.forEach(function (wk) {
              var dk = (wk && wk.day) || C.isoToday();
              if (!targetStore.days[dk]) targetStore.days[dk] = C.createEmptyDay(dk);
              var id = 'leg-w-' + (wk.id || wk.exercise || Math.random());
              if (!targetStore.days[dk].trainingLogs.some(function (t) { return t.id === id; })) {
                var rpeVal = Number(wk.rpe || 7);
                targetStore.days[dk].trainingLogs.push({
                  id: id,
                  exercise: String(wk.exercise || wk.name || 'トレーニング'),
                  part: String(wk.part || 'HYROX・機能的トレーニング'),
                  weightKg: Number(wk.weight || wk.weightKg || 0),
                  reps: Number(wk.reps || 0),
                  sets: Number(wk.sets || 1),
                  rpe: rpeVal,
                  rir: Math.max(0, 10 - rpeVal),
                  intervalSec: 90,
                  memo: ''
                });
              }
            });
          }
        }
      }
      var legRaw = localStorage.getItem(C.LEGACY_PREVIEW_KEY);
      if (legRaw) {
        var leg = JSON.parse(legRaw);
        var tk = C.isoToday();
        if (!targetStore.days[tk]) targetStore.days[tk] = C.createEmptyDay(tk);
        if (leg && leg.steps != null && targetStore.days[tk].steps == null) targetStore.days[tk].steps = Number(leg.steps);
        if (leg && leg.weight != null && targetStore.days[tk].bodyMetrics.weightKg == null) targetStore.days[tk].bodyMetrics.weightKg = Number(leg.weight);
      }
    } catch (e) {}
    return targetStore;
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(C.STORAGE_KEY);
      var st = raw ? C.migrateStore(JSON.parse(raw)) : C.createDefaultStore();
      if (!st.profile.legacyMigrated) {
        migrateLegacyFormalInto(st);
        st.profile.legacyMigrated = true;
      }
      return st;
    } catch (e) {}
    return migrateLegacyFormalInto(C.createDefaultStore());
  }

  function saveStore(msg) {
    try {
      localStorage.setItem(C.STORAGE_KEY, JSON.stringify(store));
    } catch (e) { showToast('保存失敗：空き容量・設定を確認'); return; }
    renderAll();
    if (msg) showToast(msg);
  }

  function showToast(msg) {
    var el = document.getElementById('toastBox');
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { el.style.display = 'none'; }, 2400);
  }

  function dispatchHealthWriteSafe(fnName, payload) {
    var h = window.SuGBodyHealthKit;
    if (!h || !h.isNativeAvailable() || typeof h[fnName] !== 'function') return;
    var res = h[fnName](payload);
    if (res && res.pending && !res.confirmed) {
      var st = document.getElementById('hkStatus');
      if (st) st.textContent = 'HealthKit: 書込要求を送信（結果通知待ち）';
    }
  }

  function goPage(name) {
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.toggle('active', p.id === 'page-' + name);
    });
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-go') === name);
    });
    window.scrollTo(0, 0);
  }

  document.querySelectorAll('[data-go]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      goPage(btn.getAttribute('data-go'));
    });
  });

  document.querySelectorAll('#lifestyleTabs .subtab-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var sub = b.getAttribute('data-sub');
      document.querySelectorAll('#lifestyleTabs .subtab-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
      document.querySelectorAll('#page-lifestyle .subpanel').forEach(function (p) { p.classList.toggle('active', p.id === 'sub-' + sub); });
    });
  });

  document.querySelectorAll('#intentChips .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      document.getElementById('todayIntentInput').value = c.getAttribute('data-intent');
    });
  });

  document.getElementById('saveTodayBtn').addEventListener('click', function () {
    var d = store.days[todayKey];
    d.todayIntent = document.getElementById('todayIntentInput').value.trim();
    d.mood = document.getElementById('todayMoodSelect').value;
    var st = document.getElementById('todayStepsInput').value;
    d.steps = st === '' ? null : Number(st);
    if (d.mood) {
      var moodValence = { '爽快・前向き': 0.75, 'おだやか': 0.35, '少し疲れ気味': -0.25, '緊張・ストレスあり': -0.55 }[d.mood];
      if (typeof moodValence === 'number') {
        dispatchHealthWriteSafe('writeStateOfMind', {
          syncId: 'swag-som-' + todayKey + '-' + d.mood,
          dateISO: new Date().toISOString(),
          kind: 'dailyMood',
          valence: moodValence,
          labels: [d.mood]
        });
      }
    }
    saveStore('今日の状態を保存しました');
  });

  var BEHAVIOR_LABELS = {
    bath: '入浴', rest: '休養', walk: '散歩', sunlight: '日光',
    breathing: '呼吸エクササイズ', stretch: 'ストレッチ', mindfulness: 'マインドフルネス',
    meals: '食事ケア', hydration: '水分補給', alcoholFree: '休肝日',
    hobby: '趣味', holidayEnjoy: '休日の充実'
  };

  document.getElementById('saveRecStateBtn').addEventListener('click', function () {
    var rs = store.days[todayKey].recoveryState;
    function numOrNull(id) { var v = document.getElementById(id).value; return v === '' ? null : Number(v); }
    rs.sleepHours = numOrNull('recSleepHours');
    rs.sleepQuality = numOrNull('recSleepQual');
    rs.sleepRegularity = numOrNull('recSleepReg');
    rs.restingHr = numOrNull('recRhr');
    rs.hrvMs = numOrNull('recHrv');
    rs.physicalFatigue = numOrNull('recPhysFatigue');
    rs.muscleSoreness = numOrNull('recSoreness');
    rs.exerciseLoad = numOrNull('recExLoad');
    rs.mentalFatigue = numOrNull('recMentFatigue');
    rs.stress = numOrNull('recStress');
    rs.bodyStiffness = numOrNull('recStiff');
    rs.subjectiveEnergy = numOrNull('recEnergy');
    saveStore('回復状態を保存しました');
  });

  document.getElementById('saveRecBehBtn').addEventListener('click', function () {
    var rb = store.days[todayKey].recoveryBehaviors;
    document.querySelectorAll('#recBehaviorGrid input[data-beh]').forEach(function (inp) {
      rb[inp.getAttribute('data-beh')] = inp.checked;
    });
    saveStore('回復行動を保存しました');
  });

  var PRINCIPLES = [
    ['過負荷', '日常より少し高い負荷を与えることで適応が起きます。ただし回復不足日は増やしません。'],
    ['漸進性', '体力向上に合わせて重量・回数・質を段階的に少しずつ高めます。'],
    ['特異性', '目的に応じた動き・刺激を選ぶことで、狙った機能が高まります。'],
    ['可逆性', '運動を長期間休むと適応は緩やかに戻ります。無理なく続ける設計が鍵です。'],
    ['個別性', '年齢・体格・回復力・生活リズムに合わせて負荷を調整します。'],
    ['継続性', '100点の日より、60点でも続けられるリズムが身体を変えます。'],
    ['全面性', '筋力だけでなく、柔軟性・持久力・呼吸・動作効率までバランスよく育てます。'],
    ['意識性', 'どこを動かしているかを感じながら行うと質と安全性が高まります。']
  ];
  var pChips = document.getElementById('principleChips');
  PRINCIPLES.forEach(function (item, idx) {
    var btn = document.createElement('button');
    btn.className = 'chip' + (idx === 0 ? ' active' : '');
    btn.textContent = item[0];
    btn.addEventListener('click', function () {
      pChips.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('principleDetail').textContent = item[0] + '：' + item[1];
    });
    pChips.appendChild(btn);
  });
  document.getElementById('principleDetail').textContent = PRINCIPLES[0][0] + '：' + PRINCIPLES[0][1];

  var rpeInput = document.getElementById('trRpe');
  var rirPreview = document.getElementById('trRirPreview');
  function updateRirPreview() {
    if (!rpeInput || !rirPreview) return;
    var v = rpeInput.value;
    if (v === '' || !Number.isFinite(Number(v))) {
      rirPreview.textContent = 'RIR --';
    } else {
      var rir = Math.max(0, Math.min(9, 10 - Number(v)));
      rirPreview.textContent = 'RIR ' + rir;
    }
  }
  if (rpeInput) rpeInput.addEventListener('input', updateRirPreview);

  document.getElementById('saveTrainingBtn').addEventListener('click', function () {
    var ex = document.getElementById('trExercise').value.trim();
    if (!ex) return showToast('種目名を入力してください');
    var wKg = Number(document.getElementById('trWeight').value || 0);
    var reps = Number(document.getElementById('trReps').value || 0);
    var sets = Number(document.getElementById('trSets').value || 1);
    var rpeVal = Number(document.getElementById('trRpe').value || 7);
    var distKmRaw = document.getElementById('trDistanceKm') ? document.getElementById('trDistanceKm').value : '';
    var durMinRaw = document.getElementById('trDurationMin') ? document.getElementById('trDurationMin').value : '';
    var distKm = distKmRaw === '' ? null : Number(distKmRaw);
    var durMin = durMinRaw === '' ? null : Number(durMinRaw);
    var zone = document.getElementById('trZone') ? document.getElementById('trZone').value : '';
    var part = document.getElementById('trPart').value;
    var est1RM = window.SuGSwagTraining ? window.SuGSwagTraining.calcEpley1RM(wKg, reps) : null;
    var paceObj = window.SuGSwagTraining ? window.SuGSwagTraining.calcPaceMinPerKm(distKm, durMin) : null;
    var now = Date.now();
    var entry = {
      id: 'tr-' + now,
      mode: currentTrMode,
      exercise: ex,
      part: part,
      weightKg: wKg,
      reps: reps,
      sets: sets,
      rpe: rpeVal,
      rir: Math.max(0, 10 - rpeVal),
      est1RM: est1RM,
      distanceKm: distKm,
      durationMin: durMin,
      pace: paceObj ? paceObj.formatted : '',
      zone: zone,
      intervalSec: Number(document.getElementById('trInterval').value || 90),
      memo: (document.getElementById('trMemo') && document.getElementById('trMemo').value.trim()) || ''
    };
    store.days[todayKey].trainingLogs.push(entry);
    var workoutMin = (durMin && durMin > 0) ? durMin : Math.max(5, sets * 3);
    dispatchHealthWriteSafe('writeWorkout', {
      syncId: 'swag-workout-' + entry.id,
      activityType: window.SuGSwagTraining ? window.SuGSwagTraining.mapModeToHealthKitActivity(currentTrMode, part) : 'strength',
      startDateISO: new Date(now - workoutMin * 60000).toISOString(),
      endDateISO: new Date(now).toISOString(),
      distanceMeters: distKm != null ? Math.round(distKm * 1000) : null,
      energyKcal: null
    });
    document.getElementById('trExercise').value = '';
    if (document.getElementById('trMemo')) document.getElementById('trMemo').value = '';
    if (document.getElementById('trDistanceKm')) document.getElementById('trDistanceKm').value = '';
    if (document.getElementById('trDurationMin')) document.getElementById('trDurationMin').value = '';
    updatePacePreview();
    saveStore('トレーニングを記録しました');
  });

  document.getElementById('aiMenuProposalBtn').addEventListener('click', function () {
    var rec = C.computeRecoveryScore(store.days[todayKey], store.baselines);
    var box = document.getElementById('aiMenuOutput');
    box.style.display = 'block';
    if (rec.score !== null && rec.score < 45) {
      box.textContent = '[オフライン提案／回復優先] 回復スコアが ' + rec.score + ' 点のため高負荷は控え「360度呼吸 3分 + 胸椎回旋モビリティ + 15分散歩」を提案します。';
    } else {
      box.textContent = '[オフライン提案／総合身体能力] 回復状態に合わせて「ゴブレットスクワット 10回×3(RPE7/RIR3) + ケトルベルスイング/ローイング 12回×3 + ゾーン2ジョグ15分」を提案します。';
    }
  });

  document.getElementById('saveMealBtn').addEventListener('click', function () {
    var dish = document.getElementById('mealDish').value.trim();
    if (!dish) return showToast('料理名を入力してください');
    var item = {
      id: 'm-' + Date.now(),
      dish: dish,
      kcal: Number(document.getElementById('mealKcal').value || 0),
      p: Number(document.getElementById('mealP').value || 0),
      f: Number(document.getElementById('mealF').value || 0),
      c: Number(document.getElementById('mealC').value || 0),
      fiber: Number(document.getElementById('mealFiber').value || 0),
      time: document.getElementById('mealTime').value,
      hungerNote: document.getElementById('mealHunger').value.trim()
    };
    store.days[todayKey].meals.push(item);
    dispatchHealthWriteSafe('writeNutrition', {
      syncId: 'swag-meal-' + item.id,
      dateISO: new Date().toISOString(),
      kcal: item.kcal || null,
      proteinG: item.p || null,
      fatG: item.f || null,
      carbsG: item.c || null,
      fiberG: item.fiber || null
    });
    document.getElementById('mealDish').value = '';
    saveStore('食事を記録しました');
  });

  document.getElementById('saveHydBtn').addEventListener('click', function () {
    var d = store.days[todayKey];
    var v = document.getElementById('hydMl').value;
    d.hydrationMl = v === '' ? null : Number(v);
    d.sweatLevel = document.getElementById('hydSweat').value.trim();
    d.electrolytes = document.getElementById('hydElec').checked;
    if (d.hydrationMl != null && d.hydrationMl > 0) {
      dispatchHealthWriteSafe('writeNutrition', {
        syncId: 'swag-water-' + todayKey + '-' + d.hydrationMl,
        dateISO: new Date().toISOString(),
        waterMl: d.hydrationMl
      });
    }
    saveStore('水分記録を保存しました');
  });

  document.getElementById('saveSleepDetailBtn').addEventListener('click', function () {
    var rs = store.days[todayKey].recoveryState;
    rs.bedTime = document.getElementById('slBed').value;
    rs.wakeTime = document.getElementById('slWake').value;
    rs.nightWakings = document.getElementById('slWaking').value === '' ? null : Number(document.getElementById('slWaking').value);
    rs.napMinutes = document.getElementById('slNap').value === '' ? null : Number(document.getElementById('slNap').value);
    saveStore('睡眠詳細を保存しました');
  });

  document.getElementById('saveBathBtn').addEventListener('click', function () {
    var b = store.days[todayKey].bathLog;
    b.type = document.getElementById('bathType').value;
    b.tempC = document.getElementById('bathTemp').value === '' ? null : Number(document.getElementById('bathTemp').value);
    b.durationMin = document.getElementById('bathMin').value === '' ? null : Number(document.getElementById('bathMin').value);
    b.postChange = document.getElementById('bathChange').value.trim();
    saveStore('入浴記録を保存しました');
  });

  document.getElementById('saveSunWalkBtn').addEventListener('click', function () {
    var d = store.days[todayKey];
    d.walkMinutes = document.getElementById('swWalkMin').value === '' ? null : Number(document.getElementById('swWalkMin').value);
    d.outdoorMinutes = document.getElementById('swOutMin').value === '' ? null : Number(document.getElementById('swOutMin').value);
    d.morningLight = document.getElementById('swMorningLight').checked;
    saveStore('日光・散歩を保存しました');
  });

  document.getElementById('saveGutBtn').addEventListener('click', function () {
    var g = store.days[todayKey].gut;
    g.bowelCount = document.getElementById('gutCount').value === '' ? null : Number(document.getElementById('gutCount').value);
    g.bristolScale = document.getElementById('gutBristol').value === '' ? null : Number(document.getElementById('gutBristol').value);
    g.bloating = document.getElementById('gutBloat').value === '' ? null : Number(document.getElementById('gutBloat').value);
    g.fermentedFood = document.getElementById('gutFerm').checked;
    saveStore('腸内環境を保存しました');
  });

  document.getElementById('alcSetNoneBtn').addEventListener('click', function () {
    store.days[todayKey].alcohol = { status: 'none', drinks: [] };
    saveStore('休肝日 (0g) として記録しました');
  });
  document.getElementById('alcSetUnrecBtn').addEventListener('click', function () {
    store.days[todayKey].alcohol = { status: '', drinks: [] };
    saveStore('飲酒記録を未記録に戻しました');
  });
  document.getElementById('addDrinkBtn').addEventListener('click', function () {
    var name = document.getElementById('alcName').value.trim() || 'お酒';
    var ml = Number(document.getElementById('alcMl').value);
    var abv = Number(document.getElementById('alcAbv').value);
    if (!Number.isFinite(ml) || ml <= 0 || ml > 10000 || document.getElementById('alcAbv').value === '' || !Number.isFinite(abv) || abv < 0 || abv > 100) return showToast('飲酒量 (ml) と度数を入力してください');
    var alc = store.days[todayKey].alcohol;
    alc.status = 'yes';
    var entry = { id: 'alc-' + Date.now(), name: name, ml: ml, abv: abv || 0, timing: document.getElementById('alcTime').value.trim() };
    alc.drinks.push(entry);
    var pureG = C.calcDrinkPureAlcoholG(ml, abv);
    dispatchHealthWriteSafe('writeAlcoholBeverages', {
      syncId: 'swag-alc-' + entry.id,
      dateISO: new Date().toISOString(),
      standardDrinks: Math.round((pureG / 14) * 100) / 100
    });
    document.getElementById('alcMl').value = '';
    saveStore('飲料を追加・合算しました');
  });

  var timerSec = 60;
  var remainingSec = 60;
  var pacerInterval = null;
  document.querySelectorAll('#timerDurChips .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('#timerDurChips .chip').forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
      timerSec = Number(c.getAttribute('data-min')) * 60;
      remainingSec = timerSec;
      updateTimerUI(false);
    });
  });
  function updateTimerUI(running) {
    var m = String(Math.floor(remainingSec / 60)).padStart(2, '0');
    var s = String(remainingSec % 60).padStart(2, '0');
    document.getElementById('pacerTimer').textContent = m + ':' + s;
    var circle = document.getElementById('pacerCircle');
    if (!running) {
      document.getElementById('pacerPhase').textContent = '準備';
      circle.style.transform = 'scale(1)';
      return;
    }
    var cycle = (timerSec - remainingSec) % 10;
    if (cycle < 4) {
      document.getElementById('pacerPhase').textContent = '360°吸う';
      circle.style.transform = 'scale(1.16)';
    } else {
      document.getElementById('pacerPhase').textContent = '長く吐く';
      circle.style.transform = 'scale(0.92)';
    }
  }
  document.getElementById('pacerStartBtn').addEventListener('click', function () {
    if (pacerInterval) return;
    updateTimerUI(true);
    pacerInterval = setInterval(function () {
      remainingSec -= 1;
      if (remainingSec <= 0) {
        clearInterval(pacerInterval);
        pacerInterval = null;
        remainingSec = 0;
        updateTimerUI(false);
        showToast('RESETタイマーが完了しました');
      } else {
        updateTimerUI(true);
      }
    }, 1000);
  });
  document.getElementById('pacerStopBtn').addEventListener('click', function () {
    clearInterval(pacerInterval);
    pacerInterval = null;
    remainingSec = timerSec;
    updateTimerUI(false);
  });

  document.getElementById('saveResetBtn').addEventListener('click', function () {
    var now = Date.now();
    var durMin = Math.max(1, Math.round(timerSec / 60));
    var entry = {
      id: 'res-' + now,
      type: document.getElementById('resetExerciseSelect').value,
      durationMin: durMin,
      beforeLightness: Number(document.getElementById('resBefore').value || 3),
      afterLightness: Number(document.getElementById('resAfter').value || 4),
      note: document.getElementById('resNote').value.trim()
    };
    store.days[todayKey].resetLogs.push(entry);
    dispatchHealthWriteSafe('writeMindfulSession', {
      syncId: 'swag-mindful-' + entry.id,
      startDateISO: new Date(now - durMin * 60000).toISOString(),
      endDateISO: new Date(now).toISOString(),
      exerciseType: entry.type
    });
    document.getElementById('resNote').value = '';
    saveStore('RESET記録を保存しました');
  });

  var addYtBtn = document.getElementById('addYtLinkBtn');
  if (addYtBtn) {
    addYtBtn.addEventListener('click', function () {
      var title = (document.getElementById('ytTitleInput').value || '').trim();
      var url = (document.getElementById('ytUrlInput').value || '').trim();
      if (!title) return showToast('動画タイトルを入力してください');
      if (!C.isOfficialYouTubeUrl(url)) return showToast('公式YouTube URL (https://www.youtube.com/... または https://youtu.be/...) のみ登録できます');
      if (!Array.isArray(store.youtubeBookmarks)) store.youtubeBookmarks = [];
      var ytCat = (document.getElementById('ytCatSelect') && document.getElementById('ytCatSelect').value) || 'ストレッチ';
      store.youtubeBookmarks.push({ id: 'yt-' + Date.now(), title: title, category: ytCat, url: url });
      document.getElementById('ytTitleInput').value = '';
      document.getElementById('ytUrlInput').value = '';
      saveStore('公式YouTubeリンクを登録しました');
    });
  }

  var currentTopic = 'training';
  document.querySelectorAll('#coachTopicChips .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('#coachTopicChips .chip').forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
      currentTopic = c.getAttribute('data-topic');
    });
  });
  function appendCoachBubble(cls, text) {
    var log = document.getElementById('coachChatLog');
    var el = document.createElement('div');
    el.className = 'chat-bubble ' + cls;
    el.textContent = text;
    log.appendChild(el);
  }

  var aiConsentChk = document.getElementById('aiSendConsentChk');
  var aiCostChk = document.getElementById('aiCostApprovedChk');
  var aiEndpointInp = document.getElementById('aiEndpointInput');
  var aiTokenInp = document.getElementById('aiTokenInput');
  if (aiConsentChk) {
    aiConsentChk.checked = !!store.profile.aiSendConsent;
    aiConsentChk.addEventListener('change', function () {
      store.profile.aiSendConsent = aiConsentChk.checked;
      saveStore();
    });
  }
  if (aiCostChk) {
    aiCostChk.checked = !!store.profile.aiCostApproved;
    aiCostChk.addEventListener('change', function () {
      store.profile.aiCostApproved = aiCostChk.checked;
      saveStore();
    });
  }
  if (aiEndpointInp) {
    aiEndpointInp.value = store.profile.aiEndpoint || '';
    aiEndpointInp.addEventListener('change', function () {
      var val = aiEndpointInp.value.trim();
      store.profile.aiEndpoint = /^https:\/\//.test(val) ? val : '';
      saveStore();
    });
  }
  if (aiTokenInp) {
    try { aiTokenInp.value = sessionStorage.getItem('sug_ai_session_token') || ''; } catch (e) {}
    aiTokenInp.addEventListener('change', function () {
      try { sessionStorage.setItem('sug_ai_session_token', aiTokenInp.value.trim()); } catch (e) {}
    });
  }

  document.getElementById('coachSendBtn').addEventListener('click', async function () {
    var txt = document.getElementById('coachInput').value.trim();
    if (!txt) return showToast('相談内容を入力してください');
    appendCoachBubble('user', txt);
    document.getElementById('coachInput').value = '';
    var rec = C.computeRecoveryScore(store.days[todayKey], store.baselines);
    var token = '';
    try { token = sessionStorage.getItem('sug_ai_session_token') || ''; } catch (e) {}
    var endpoint = store.profile.aiEndpoint || '';
    var canLiveAi = !!(window.BodyAiClient && store.profile.aiSendConsent && store.profile.aiCostApproved && /^https:\/\//.test(endpoint) && token.length >= 20 && navigator.onLine);
    if (canLiveAi) {
      try {
        var client = window.BodyAiClient.create({
          enabled: true,
          costApproved: true,
          endpoint: endpoint,
          accessToken: function () { return token; }
        }, window.fetch.bind(window));
        var hkCtx = window.SuGBodyHealthKit ? window.SuGBodyHealthKit.buildConsentedAiHealthContext(window.__SUG_NATIVE_HEALTH__ || {}, store.days[todayKey], true) : { allowed: true, context: {} };
        var liveRes = await client({
          topic: currentTopic,
          question: txt,
          systemPrompt: C.AI_COACH_SYSTEM_PROMPT,
          recoveryScore: rec.score,
          recoveryStatus: rec.status,
          sendConsent: store.profile.aiSendConsent === true,
          costApproved: store.profile.aiCostApproved === true,
          healthContext: hkCtx.context
        }, true);
        store.profile.aiApiConnected = true;
        saveStore();
        var liveLines = [liveRes.summary || 'AI応答を受信しました。'];
        if (Array.isArray(liveRes.observations) && liveRes.observations.length) liveLines.push('【観測】' + liveRes.observations.join(' / '));
        if (Array.isArray(liveRes.suggestions) && liveRes.suggestions.length) liveLines.push('【次の1手】' + liveRes.suggestions.join(' / '));
        if (liveRes.provider) liveLines.push('(' + liveRes.provider + (liveRes.model ? ' / ' + liveRes.model : '') + ')');
        appendCoachBubble('coach', liveLines.join('\n'));
        return;
      } catch (err) {
        store.profile.aiApiConnected = false;
        saveStore();
        var fallback = C.generateOfflineCoachReply(currentTopic, txt, rec);
        appendCoachBubble('coach', '[接続不可のためオフラインガイドへ切替: ' + (err && err.message ? err.message : '通信エラー') + ']\n' + fallback.reply);
        return;
      }
    }
    var res = C.generateOfflineCoachReply(currentTopic, txt, rec);
    appendCoachBubble('coach', res.reply);
  });

  document.getElementById('saveBodyMetricsBtn').addEventListener('click', function () {
    var bm = store.days[todayKey].bodyMetrics;
    bm.weightKg = document.getElementById('mbWeight').value === '' ? null : Number(document.getElementById('mbWeight').value);
    bm.bodyFatPct = document.getElementById('mbBodyFat').value === '' ? null : Number(document.getElementById('mbBodyFat').value);
    bm.romNote = document.getElementById('mbPainNote').value.trim();
    if (bm.weightKg != null || bm.bodyFatPct != null) {
      dispatchHealthWriteSafe('writeBodyMetrics', {
        syncId: 'swag-bm-' + todayKey + '-' + (bm.weightKg || '') + '-' + (bm.bodyFatPct || ''),
        dateISO: new Date().toISOString(),
        weightKg: bm.weightKg,
        bodyFatPct: bm.bodyFatPct
      });
    }
    saveStore('身体記録を保存しました');
  });

  document.getElementById('exportJsonBtn').addEventListener('click', function () {
    var jsonText = JSON.stringify(store, null, 2);
    if (window.SuGNativeTransport && typeof window.SuGNativeTransport.exportJSON === 'function') {
      window.SuGNativeTransport.exportJSON(jsonText);
      showToast('iOSファイルへJSON書き出しを送信しました');
      return;
    }
    var blob = new Blob([jsonText], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sug-swag-backup-' + todayKey + '.json';
    a.click();
    showToast('JSONをダウンロードしました');
  });

  document.getElementById('resetDemoBtn').addEventListener('click', function () {
    showToast('データ保護のため初期化を停止しています');
  });

  document.getElementById('importJsonFile').addEventListener('change', function (ev) {
    var file = ev.target.files && ev.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        store = C.migrateStore(JSON.parse(String(reader.result || '{}')));
        saveStore('JSONから復元しました');
      } catch (err) {
        showToast('JSONの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  });

  function renderAll() {
    var d = store.days[todayKey];
    for (const [field, key] of [['sleepHours', 'sleepHours14d'], ['restingHr', 'restingHr14d'], ['hrvMs', 'hrvMs14d']]) {
      const vals = Object.keys(store.days).filter(function (k) {
        const n = (Date.parse(todayKey) - Date.parse(k)) / 86400000;
        return n > 0 && n <= 14;
      }).map(function (k) { return store.days[k].recoveryState?.[field]; }).filter(function (v) { return Number.isFinite(v) && v > 0; });
      store.baselines[key] = vals.length >= 7 ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : null;
    }
    var rec = C.computeRecoveryScore(d, store.baselines);
    var av = C.computeAvatarState(store, todayKey);
    var alcSum = C.calcDayAlcoholSummary(d);
    var alcStreak = C.calcAlcoholStreak(store.days, todayKey);

    document.getElementById('ribbonDate').textContent = todayKey + ' · SWAG v2保存';
    var rc = document.getElementById('ribbonConn');
    if (rc) rc.textContent = 'HealthKit: ' + (store.profile.healthKitConnected ? '連携中' : 'iPhone検証待ち') + ' / AI: ' + (store.profile.aiApiConnected ? '接続中' : '未接続(ガイド)');
    var tw = document.getElementById('todayWalkState');
    if (tw) tw.textContent = store.profile.walkSyncConsent ? (store.profile.walkLastSyncedAt ? '同期済み' : '同意済み・待機') : 'オフライン待機';
    var cBox = document.getElementById('coachStatusBox');
    if (cBox) {
      cBox.textContent = (store.profile.aiSendConsent && store.profile.aiCostApproved && /^https:\/\//.test(store.profile.aiEndpoint || ''))
        ? 'AI接続条件が有効です（会員トークン入力時に既存APIへ送信）。未接続・通信不可時はオフライン心理・行動ガイドを表示します。'
        : '外部AI APIは未接続です。未接続時はオフライン心理・行動ガイドを表示し、架空のライブAI応答は生成しません。';
    }

    function setVal(id, val) { var el = document.getElementById(id); if (el && document.activeElement !== el) el.value = (val != null && val !== '') ? val : ''; }
    setVal('recSleepHours', d.recoveryState.sleepHours);
    setVal('recSleepQual', d.recoveryState.sleepQuality);
    setVal('recSleepReg', d.recoveryState.sleepRegularity);
    setVal('recRhr', d.recoveryState.restingHr);
    setVal('recHrv', d.recoveryState.hrvMs);
    setVal('recPhysFatigue', d.recoveryState.physicalFatigue);
    setVal('recSoreness', d.recoveryState.muscleSoreness);
    setVal('recExLoad', d.recoveryState.exerciseLoad);
    setVal('recMentFatigue', d.recoveryState.mentalFatigue);
    setVal('recStress', d.recoveryState.stress);
    setVal('recStiff', d.recoveryState.bodyStiffness);
    setVal('recEnergy', d.recoveryState.subjectiveEnergy);
    setVal('hydMl', d.hydrationMl);
    setVal('hydSweat', d.sweatLevel);
    var heEl = document.getElementById('hydElec'); if (heEl) heEl.checked = !!d.electrolytes;
    setVal('slBed', d.recoveryState.bedTime);
    setVal('slWake', d.recoveryState.wakeTime);
    setVal('slWaking', d.recoveryState.nightWakings);
    setVal('slNap', d.recoveryState.napMinutes);
    setVal('bathType', d.bathLog.type);
    setVal('bathTemp', d.bathLog.tempC);
    setVal('bathMin', d.bathLog.durationMin);
    setVal('bathChange', d.bathLog.postChange);
    setVal('swWalkMin', d.walkMinutes);
    setVal('swOutMin', d.outdoorMinutes);
    var swMlEl = document.getElementById('swMorningLight'); if (swMlEl) swMlEl.checked = !!d.morningLight;
    setVal('gutCount', d.gut.bowelCount);
    setVal('gutBristol', d.gut.bristolScale);
    setVal('gutBloat', d.gut.bloating);
    var gfEl = document.getElementById('gutFerm'); if (gfEl) gfEl.checked = !!d.gut.fermentedFood;
    setVal('mbWeight', d.bodyMetrics.weightKg);
    setVal('mbBodyFat', d.bodyMetrics.bodyFatPct);
    setVal('mbPainNote', d.bodyMetrics.romNote);
    document.getElementById('todayIntentInput').value = d.todayIntent || '';
    document.getElementById('todayMoodSelect').value = d.mood || '';
    document.getElementById('todayStepsInput').value = d.steps != null ? d.steps : '';

    document.getElementById('todayScoreNum').textContent = rec.score != null ? rec.score : '--';
    document.getElementById('todayScoreStatus').textContent = rec.status;
    document.getElementById('todayAvatarStage').textContent = av.stage;
    document.getElementById('todayAvatarMsg').textContent = av.message;
    document.getElementById('todayCoverageChip').textContent = 'カバー率 ' + rec.coveragePct + '%';
    document.getElementById('todayBehaviorChip').textContent = '回復行動 ' + rec.behaviorDone + '/' + rec.behaviorTotal;
    var expChip = document.getElementById('todayExpChip');
    if (expChip) expChip.textContent = 'Lv.' + av.exp.level + ' · ' + av.exp.totalExp + ' EXP';
    document.getElementById('todaySleepVal').textContent = d.recoveryState.sleepHours != null ? d.recoveryState.sleepHours + 'h' : '未取得';
    document.getElementById('todayFatigueVal').textContent = d.recoveryState.physicalFatigue != null ? 'Lv.' + d.recoveryState.physicalFatigue : '未取得';
    document.getElementById('todayStressSub').textContent = 'ストレス: ' + (d.recoveryState.stress != null ? 'Lv.' + d.recoveryState.stress : '未取得');
    document.getElementById('todayRecAction').textContent = av.action;
    document.getElementById('todayCoachMsg').textContent = av.message;

    document.getElementById('recScoreNum').textContent = rec.score != null ? rec.score : '--';
    document.getElementById('recScoreBadge').textContent = rec.status;
    var hkRel = window.SuGBodyHealthKit ? window.SuGBodyHealthKit.analyzeMindLifestyleRelations(window.__SUG_NATIVE_HEALTH__ || {}, d) : null;
    if (hkRel && document.getElementById('recMindRelationBox')) {
      document.getElementById('recMindRelationBox').innerHTML = '<strong>心身・歩行・日光相関観測（HealthKit連携対応）</strong><br>' + hkRel.observations.join('<br>') + '<br><span class="muted">' + hkRel.note + '</span>';
    }

    var trendEl = document.getElementById('recTrendChart');
    if (trendEl) {
      var bars = [];
      var refMs = new Date(todayKey + 'T00:00:00').getTime();
      var sum7 = 0, cnt7 = 0, sum28 = 0, cnt28 = 0;
      for (var i = 27; i >= 0; i--) {
        var dk = C.isoToday(new Date(refMs - i * 86400000));
        var dr = store.days[dk] ? C.computeRecoveryScore(store.days[dk], store.baselines) : null;
        if (dr && dr.score != null) {
          sum28 += dr.score; cnt28++;
          if (i < 7) { sum7 += dr.score; cnt7++; }
        }
        if (i < 7) bars.push({ dk: dk.slice(5), sc: dr && dr.score != null ? dr.score : 0, has: !!(dr && dr.score != null) });
      }
      var svgBars = bars.map(function (b, idx) {
        var h = b.has ? Math.max(6, Math.round(b.sc * 0.55)) : 4;
        var y = 60 - h;
        var fill = b.has ? '#FF007F' : '#FFC2E8';
        return '<rect x="' + (idx * 36 + 6) + '" y="' + y + '" width="22" height="' + h + '" rx="5" fill="' + fill + '"/>' +
               '<text x="' + (idx * 36 + 17) + '" y="73" font-size="9" text-anchor="middle" fill="#7A2E58">' + b.dk + '</text>';
      }).join('');
      trendEl.innerHTML = '<div class="muted" style="margin-bottom:4px">7日平均: ' + (cnt7 ? Math.round(sum7 / cnt7) + '点' : '未評価') + ' / 28日平均: ' + (cnt28 ? Math.round(sum28 / cnt28) + '点' : '未評価') + '</div>' +
        '<svg viewBox="0 0 260 78" style="width:100%;height:78px;background:#FFF4FA;border-radius:12px">' + svgBars + '</svg>';
    }
    var alcNextEl = document.getElementById('recAlcoholNextDay');
    if (alcNextEl) {
      var yKey = C.isoToday(new Date(new Date(todayKey + 'T00:00:00').getTime() - 86400000));
      var yDay = store.days[yKey];
      var yAlc = yDay ? C.calcDayAlcoholSummary(yDay) : { recorded: false, label: '未記録' };
      alcNextEl.innerHTML = '<strong>前日(' + yKey + ')の飲酒と本日の反応</strong><br><span class="muted">前日飲酒: ' + yAlc.label + ' → 本日睡眠: ' + (d.recoveryState.sleepHours != null ? d.recoveryState.sleepHours + 'h' : '未取得') + ' / 安静時心拍: ' + (d.recoveryState.restingHr != null ? d.recoveryState.restingHr + 'bpm' : '未取得') + ' / HRV: ' + (d.recoveryState.hrvMs != null ? d.recoveryState.hrvMs + 'ms' : '未取得') + '</span>';
    }

    document.getElementById('recConfText').textContent = '信頼度: ' + rec.confidenceLabel + ' (カバー率 ' + rec.coveragePct + '%)';

    var bd = document.getElementById('recDomainBreakdown');
    bd.innerHTML = '';
    rec.domains.forEach(function (dm) {
      var row = document.createElement('div');
      row.className = 'list-row';
      row.innerHTML = '<strong>' + dm.name + ' (重み' + dm.weight + '%)</strong> — ' +
        (dm.available ? (dm.score + '点 [' + dm.sourceType + ']') : '未取得') +
        '<br><span class="muted">' + dm.note + '</span>';
      bd.appendChild(row);
    });

    var bg = document.getElementById('recBehaviorGrid');
    bg.innerHTML = '';
    Object.keys(BEHAVIOR_LABELS).forEach(function (k) {
      var lbl = document.createElement('label');
      lbl.className = 'check-item';
      var inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.setAttribute('data-beh', k);
      inp.checked = !!d.recoveryBehaviors[k];
      lbl.appendChild(inp);
      lbl.appendChild(document.createTextNode(' ' + BEHAVIOR_LABELS[k]));
      bg.appendChild(lbl);
    });

    var warn = document.getElementById('trainRecoveryWarn');
    if (rec.score !== null && rec.score < 45) {
      warn.style.display = 'block';
      warn.textContent = '回復スコアが低め (' + rec.score + '点) のため、本日の負荷増加は推奨しません。休養・フォーム確認・呼吸を優先してください。';
    } else {
      warn.style.display = 'none';
    }

    var wVol = {};
    Object.keys(store.days).filter(function (k) {
      const n = (Date.parse(todayKey) - Date.parse(k)) / 86400000;
      return n >= 0 && n < 7;
    }).flatMap(function (k) { return store.days[k].trainingLogs || []; }).forEach(function (t) {
      wVol[t.part] = (wVol[t.part] || 0) + (t.sets || 1);
    });
    var wvEl = document.getElementById('weeklyVolumeList');
    wvEl.innerHTML = Object.keys(wVol).length
      ? Object.keys(wVol).map(function (p) { return '<div class="list-row"><strong>' + esc(p) + '</strong>: ' + wVol[p] + ' セット（直近7日）</div>'; }).join('')
      : '<div class="muted">まだ運動記録がありません。</div>';

    var tlEl = document.getElementById('trainingLogList');
    tlEl.innerHTML = d.trainingLogs.length
      ? d.trainingLogs.map(function (t) {
          var prev = C.findPreviousTrainingEntry(store.days, todayKey, t.exercise, t.id);
          var diffHtml = '';
          if (prev && prev.entry) {
            var curVol = (t.weightKg || 0) * (t.reps || 0) * (t.sets || 1);
            var prevVol = (prev.entry.weightKg || 0) * (prev.entry.reps || 0) * (prev.entry.sets || 1);
            var dVol = Math.round((curVol - prevVol) * 10) / 10;
            diffHtml = '<span class="overload-pill">前回(' + esc(prev.day.slice(5)) + ')比 ' + (dVol >= 0 ? '+' : '') + dVol + 'kg</span>';
          }
          var rirTxt = 'RIR ' + (t.rir != null ? t.rir : Math.max(0, 10 - (t.rpe || 7)));
          return '<div class="list-row"><strong>' + esc(t.exercise) + '</strong> (' + esc(t.part) + ')' + diffHtml + '<br>' +
            (t.distanceKm != null || t.durationMin != null ? ((t.distanceKm != null ? t.distanceKm + 'km ' : '') + (t.durationMin != null ? t.durationMin + '分 ' : '') + (t.pace ? '[' + esc(t.pace) + '] ' : '') + (t.zone ? esc(t.zone) + ' ' : '') + '(RPE ' + t.rpe + ')') : (t.weightKg + 'kg × ' + t.reps + '回 × ' + t.sets + 'set (RPE ' + t.rpe + ' / ' + rirTxt + (t.est1RM ? ' / 推定1RM ' + t.est1RM + 'kg' : '') + ')')) +
            (t.memo ? '<br><span class="muted">メモ: ' + esc(t.memo) + '</span>' : '') + '</div>';
        }).join('')
      : '<div class="muted">今日のトレーニングはまだ記録されていません。</div>';

    var resListEl = document.getElementById('resetLogList');
    if (resListEl) {
      resListEl.innerHTML = d.resetLogs.length
        ? d.resetLogs.map(function (r) {
            var delta = (r.afterLightness || 0) - (r.beforeLightness || 0);
            var sign = delta >= 0 ? '+' : '';
            return '<div class="list-row"><strong>' + esc(r.type) + '</strong> (' + (r.durationMin || 1) + '分) — 軽さ ' + r.beforeLightness + ' → ' + r.afterLightness + ' (' + sign + delta + ')' + (r.note ? '<br><span class="muted">' + esc(r.note) + '</span>' : '') + '</div>';
          }).join('')
        : '<div class="muted">本日のRESET記録はまだありません。</div>';
    }

    var ytListEl = document.getElementById('ytBookmarkList');
    if (ytListEl) {
      var bms = store.youtubeBookmarks || [];
      ytListEl.innerHTML = bms.length
        ? bms.map(function (b) {
            var embedUrl = window.SuGSwagYouTube ? window.SuGSwagYouTube.buildNoCookieEmbedUrl(b.url) : null;
            return '<div class="list-row">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
              '<div><span class="overload-pill">' + esc(b.category || 'ストレッチ') + '</span> <strong>' + esc(b.title) + '</strong><br>' +
              '<a href="' + esc(b.url) + '" target="_blank" rel="noopener noreferrer" style="color:var(--pink-deep);font-weight:800">公式YouTubeで開く ↗</a>' +
              (embedUrl ? ' <button class="chip" data-embed-yt="' + esc(embedUrl) + '" data-embed-target="yt-emb-' + esc(b.id) + '">埋め込み再生</button>' : '') +
              '</div><button class="chip" data-del-yt="' + esc(b.id) + '">削除</button></div>' +
              '<div id="yt-emb-' + esc(b.id) + '" style="margin-top:6px"></div></div>';
          }).join('')
        : '<div class="muted">登録済みのマイYouTubeリンクはまだありません。</div>';
      ytListEl.querySelectorAll('[data-embed-yt]').forEach(function (eb) {
        eb.addEventListener('click', function () {
          var target = document.getElementById(eb.getAttribute('data-embed-target'));
          if (!target) return;
          if (target.innerHTML) { target.innerHTML = ''; return; }
          var src = eb.getAttribute('data-embed-yt');
          target.innerHTML = '<iframe src="' + esc(src) + '" style="width:100%;height:190px;border:0;border-radius:12px" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
        });
      });
      ytListEl.querySelectorAll('[data-del-yt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-del-yt');
          store.youtubeBookmarks = (store.youtubeBookmarks || []).filter(function (x) { return x.id !== id; });
          saveStore('YouTubeリンクを削除しました');
        });
      });
    }

    var mKcal = d.meals.reduce(function (s, m) { return s + (m.kcal || 0); }, 0);
    var mP = d.meals.reduce(function (s, m) { return s + (m.p || 0); }, 0);
    document.getElementById('mealSummaryList').innerHTML = d.meals.length
      ? '<div class="list-row"><strong>合計: ' + mKcal + ' kcal / P ' + Math.round(mP) + 'g (' + d.meals.length + '食)</strong></div>' +
        d.meals.map(function (m) { return '<div class="list-row">' + esc(m.time || '--:--') + ' ' + esc(m.dish) + ' (' + m.kcal + 'kcal)</div>'; }).join('')
      : '<div class="muted">本日の食事は未記録です。</div>';

    document.getElementById('alcSummaryBox').innerHTML =
      '<strong>本日の判定: ' + alcSum.label + '</strong><br>' +
      '<span class="muted">直近7日休肝日: ' + alcStreak.alcoholFree7d + '日 / 連続飲酒: ' + alcStreak.consecutiveDrinkingDays + '日 / 7日純アルコール: ' + alcStreak.totalGrams7d + 'g</span>';
    document.getElementById('alcDrinksList').innerHTML = (d.alcohol.drinks || []).map(function (dr) {
      return '<div class="list-row">' + esc(dr.name) + ' ' + dr.ml + 'ml (' + dr.abv + '%) → 純アルコール ' + C.calcDrinkPureAlcoholG(dr.ml, dr.abv) + 'g</div>';
    }).join('');

    var prog = window.SuGSwagProgression ? window.SuGSwagProgression.computeWalletAndExp(store) : null;
    var coinChip = document.getElementById('todayCoinChip');
    if (coinChip && prog) coinChip.textContent = prog.totalCoins + ' COIN';

    var endEl = document.getElementById('weeklyEnduranceSummary');
    if (endEl && window.SuGSwagTraining) {
      var ew = window.SuGSwagTraining.summarizeWeeklyEndurance(store.days, todayKey);
      endEl.innerHTML = '<strong>週間持久力・機能的集計（直近7日）</strong><br>' +
        '<span class="muted">ラン距離: ' + ew.weeklyDistanceKm + ' km（' + ew.runCount + '回） / 合計時間: ' + ew.weeklyDurationMin + '分 / HYROX: ' + ew.hyroxCount + '件 / 動作効率: ' + ew.mobilityCount + '件</span>';
    }

    var activeOutfitName = (store.profile && store.profile.selectedOutfitName) || av.outfit;
    document.getElementById('myAvatarTitle').textContent = av.stage;
    document.getElementById('myAvatarSub').textContent = '表情: ' + av.expression + ' / 衣装: ' + activeOutfitName;
    var expText = document.getElementById('myAvatarExpText');
    if (expText) {
      var lv = prog ? prog.level : av.exp.level;
      var tx = prog ? prog.totalExp : av.exp.totalExp;
      var rem = prog ? prog.nextLevelRemaining : av.exp.nextLevelRemaining;
      var cn = prog ? prog.totalCoins : Math.floor(tx / 5);
      expText.textContent = 'Lv.' + lv + ' · 総合 ' + tx + ' EXP · ' + cn + ' COIN（次Lvまで ' + rem + '）';
    }
    var expBar = document.getElementById('myAvatarExpBar');
    if (expBar) expBar.style.width = (prog ? prog.intoLevel : av.exp.intoLevel) + '%';
    var expBd = document.getElementById('myAvatarGrowthBreakdown');
    if (expBd) {
      var b = prog ? prog.breakdown : av.exp.breakdown;
      expBd.innerHTML =
        '<span class="chip">運動 ' + b.training + '</span>' +
        '<span class="chip">休養・睡眠 ' + b.recovery + '</span>' +
        '<span class="chip">栄養 ' + b.nutrition + '</span>' +
        '<span class="chip">散歩 ' + b.walk + '</span>' +
        '<span class="chip">呼吸 ' + b.reset + '</span>' +
        '<span class="chip gold">習慣 ' + b.lifestyle + '</span>';
    }
    var outSel = document.getElementById('myOutfitSelect');
    if (outSel && prog) {
      var curId = store.profile.selectedOutfitId || prog.unlockedOutfits[0].id;
      outSel.innerHTML = prog.outfits.map(function (o) {
        var unlocked = prog.unlockedOutfits.some(function (u) { return u.id === o.id; });
        return '<option value="' + esc(o.id) + '"' + (o.id === curId ? ' selected' : '') + (unlocked ? '' : ' disabled') + '>' +
          esc(o.name) + (unlocked ? '（解放済み）' : '（Lv.' + o.minLevel + ' / ' + o.minCoins + ' COINで解放）') + '</option>';
      }).join('');
    }
    var tSlot = document.getElementById('titles100Slot');
    var tList = document.getElementById('unlockedTitlesList');
    if (tSlot && window.SuGSwagProgression) {
      var evT = window.SuGSwagProgression.evaluateOfficialTitles(store);
      if (evT.total > 0) {
        tSlot.innerHTML = '<strong>ステータス：公式称号マスター読込済み（' + evT.unlockedCount + ' / ' + evT.total + ' 解放）</strong>';
        if (tList) {
          tList.innerHTML = evT.unlocked.length
            ? evT.unlocked.map(function (t) { return '<span class="chip gold" style="margin:2px">' + esc(t.name) + '</span>'; }).join('')
            : '<div class="muted">条件達成で称号が解放されます。</div>';
        }
      }
    }
    document.getElementById('walkPayloadPreview').textContent = JSON.stringify(C.buildWalkSharePayload(store, todayKey), null, 2);
  }

  var walkConsentChk = document.getElementById('walkSyncConsentChk');
  var syncWalkBtn = document.getElementById('syncWalkBtn');
  if (walkConsentChk) {
    walkConsentChk.checked = !!store.profile.walkSyncConsent;
    walkConsentChk.addEventListener('change', function () {
      store.profile.walkSyncConsent = walkConsentChk.checked;
      saveStore();
    });
  }
  function syncWithWalk(interactive) {
    if (!store.profile.walkSyncConsent) {
      if (interactive) showToast('S.u.G WALKとの送受信に同意してください');
      return;
    }
    var payload = C.buildWalkSharePayload(store, todayKey);
    try {
      localStorage.setItem('sug_body_to_walk_v1', JSON.stringify(payload));
      var walkRaw = localStorage.getItem('sug_walk_quest_v1');
      if (walkRaw) {
        var wObj = JSON.parse(walkRaw);
        if (wObj && wObj.date === todayKey) {
          var d = store.days[todayKey];
          var hkActive = !!(d.nativeSnapshot && d.nativeSnapshot.source === 'healthkit' && d.nativeSnapshot.steps != null);
          if (!hkActive && Number.isFinite(Number(wObj.steps)) && d.steps == null) {
            d.steps = Number(wObj.steps);
          }
          if (!hkActive && Number.isFinite(Number(wObj.distanceKm)) && d.distanceKm == null) {
            d.distanceKm = Number(wObj.distanceKm);
          }
        }
      }
      store.profile.walkLastSyncedAt = new Date().toISOString();
      var stEl = document.getElementById('walkSyncStatus');
      if (stEl) stEl.textContent = '同期済み (' + store.profile.walkLastSyncedAt.slice(11, 19) + ')';
      if (interactive) saveStore('S.u.G WALKと送受信しました');
    } catch (e) {
      if (interactive) showToast('WALK同期に失敗しました');
    }
  }
  if (syncWalkBtn) syncWalkBtn.addEventListener('click', function () { syncWithWalk(true); });

  function receiveNative(p) {
    if (!p || p.localDay !== todayKey) return;
    const d = store.days[todayKey]; const rs = d.recoveryState;
    for (const [k, v] of Object.entries({ sleepHours: p.sleepHours, restingHr: p.restingHeartRate, hrvMs: p.hrvMs })) if (Number.isFinite(v)) rs[k] = v;
    if (Number.isFinite(p.steps)) d.steps = p.steps;
    if (Number.isFinite(p.distanceKm)) d.distanceKm = p.distanceKm;
    if (Number.isFinite(p.weightKg) && d.bodyMetrics.weightKg == null) d.bodyMetrics.weightKg = p.weightKg;
    if (Number.isFinite(p.bodyFatPercentage) && d.bodyMetrics.bodyFatPct == null) d.bodyMetrics.bodyFatPct = p.bodyFatPercentage;
    if (Number.isFinite(p.timeInDaylightMinutes)) d.outdoorMinutes = p.timeInDaylightMinutes;
    if (Number.isFinite(p.dietaryWaterMlToday) && d.hydrationMl == null) d.hydrationMl = Math.round(p.dietaryWaterMlToday);
    d.nativeSnapshot = {
      syncedAt: p.syncedAt,
      source: 'healthkit',
      steps: p.steps ?? null,
      mindfulMinutesToday: p.mindfulMinutesToday ?? null,
      timeInDaylightMinutes: p.timeInDaylightMinutes ?? null,
      latestStateOfMindValence: p.latestStateOfMindValence ?? null,
      walkingSpeedKmh: p.walkingSpeedKmh ?? null,
      walkingStepLengthCm: p.walkingStepLengthCm ?? null,
      walkingAsymmetryPercent: p.walkingAsymmetryPercent ?? null,
      walkingSteadinessPercent: p.walkingSteadinessPercent ?? null,
      dietaryEnergyKcalToday: p.dietaryEnergyKcalToday ?? null,
      dietaryProteinGToday: p.dietaryProteinGToday ?? null,
      dietaryFatGToday: p.dietaryFatGToday ?? null,
      dietaryCarbsGToday: p.dietaryCarbsGToday ?? null,
      dietaryFiberGToday: p.dietaryFiberGToday ?? null,
      dietaryWaterMlToday: p.dietaryWaterMlToday ?? null,
      alcoholicBeveragesToday: p.alcoholicBeveragesToday ?? null
    };
    store.profile.healthKitConnected = !!p.authorizationRequestCompleted;
    window.__SUG_NATIVE_HEALTH__ = p;
    document.getElementById('hkStatus').textContent = 'HealthKit: 同期データ受信（未取得項目は0にせず未取得表示）';
    saveStore();
  }
  window.addEventListener('sug:native-health', function (e) { receiveNative(e.detail); });
  document.getElementById('hkConnect').onclick = function () {
    const h = window.SuGBodyHealthKit;
    if (h && h.isNativeAvailable()) {
      h.requestAuthorization();
      document.getElementById('hkStatus').textContent = 'HealthKit: 権限・同期要求を送信（結果待ち）';
    } else {
      showToast('Apple HealthKitはiPhoneアプリ上で利用できます');
    }
  };
  document.getElementById('hkRefresh').onclick = function () {
    const h = window.SuGBodyHealthKit;
    if (h && h.isNativeAvailable()) {
      h.refreshToday();
      document.getElementById('hkStatus').textContent = 'HealthKit: 同期要求を送信（結果待ち）';
    } else {
      showToast('Apple HealthKitはiPhoneアプリ上で利用できます');
    }
  };
  window.addEventListener('sug:healthkit-result', function (e) {
    store.profile.healthKitConnected = !!(e.detail && e.detail.ok);
    document.getElementById('hkStatus').textContent = (e.detail && e.detail.ok)
      ? 'HealthKit: 処理完了（読取許可は個別に判定不可）'
      : 'HealthKit: 処理失敗（' + ((e.detail && e.detail.error) || '不明') + '）';
    renderAll();
  });
  window.addEventListener('sug:native-health-write-result', function (e) {
    if (e.detail && e.detail.ok) {
      document.getElementById('hkStatus').textContent = 'HealthKit: 保存完了 (' + e.detail.action + ')';
      showToast('ヘルスケアへ保存しました (' + e.detail.action + ')');
    } else if (e.detail) {
      document.getElementById('hkStatus').textContent = 'HealthKit: 保存失敗 (' + (e.detail.error || e.detail.action || 'error') + ')';
      showToast('ヘルスケア保存に失敗しました');
    }
  });

  /* === S.u.G SWAG Integrated Engines Wiring === */
  var currentTrMode = 'strength';
  var trModeChips = document.querySelectorAll('#trModeChips .chip');
  var hyroxWrap = document.getElementById('hyroxPresetWrap');
  var hyroxChipsEl = document.getElementById('hyroxStationChips');
  if (hyroxChipsEl && window.SuGSwagTraining) {
    window.SuGSwagTraining.HYROX_STATIONS.forEach(function (st) {
      var b = document.createElement('button');
      b.className = 'chip';
      b.textContent = st.name;
      b.addEventListener('click', function () {
        document.getElementById('trExercise').value = st.name;
        document.getElementById('trPart').value = 'HYROX・機能的トレーニング';
      });
      hyroxChipsEl.appendChild(b);
    });
  }
  trModeChips.forEach(function (c) {
    c.addEventListener('click', function () {
      trModeChips.forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
      currentTrMode = c.getAttribute('data-trmode') || 'strength';
      if (hyroxWrap) hyroxWrap.style.display = currentTrMode === 'hyrox' ? 'block' : 'none';
      var partEl = document.getElementById('trPart');
      if (partEl) {
        if (currentTrMode === 'running') partEl.value = 'ランニング・持久力';
        else if (currentTrMode === 'hyrox') partEl.value = 'HYROX・機能的トレーニング';
        else if (currentTrMode === 'mobility') partEl.value = '柔軟性・動作効率';
      }
    });
  });

  function updatePacePreview() {
    var dEl = document.getElementById('trDistanceKm');
    var tEl = document.getElementById('trDurationMin');
    var pEl = document.getElementById('trPacePreview');
    if (!dEl || !tEl || !pEl || !window.SuGSwagTraining) return;
    var pace = window.SuGSwagTraining.calcPaceMinPerKm(dEl.value, tEl.value);
    pEl.textContent = pace ? pace.formatted : '--:-- /km';
  }
  var trDistEl = document.getElementById('trDistanceKm');
  var trDurEl = document.getElementById('trDurationMin');
  if (trDistEl) trDistEl.addEventListener('input', updatePacePreview);
  if (trDurEl) trDurEl.addEventListener('input', updatePacePreview);

  var outfitSel = document.getElementById('myOutfitSelect');
  if (outfitSel) {
    outfitSel.addEventListener('change', function () {
      var opt = outfitSel.options[outfitSel.selectedIndex];
      if (!opt) return;
      store.profile.selectedOutfitId = opt.value;
      store.profile.selectedOutfitName = opt.textContent;
      saveStore('アバター衣装を変更しました');
    });
  }

  var titlesFileInp = document.getElementById('importTitles100File');
  if (titlesFileInp) {
    titlesFileInp.addEventListener('change', function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file || !window.SuGSwagProgression) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = window.SuGSwagProgression.parseOfficialTitlesInput(String(reader.result || ''));
          store.officialTitles100 = parsed;
          saveStore('公式称号データ ' + parsed.length + '件を読み込みました');
        } catch (err) {
          showToast('称号データ読込失敗: ' + (err && err.message ? err.message : '形式エラー'));
        }
      };
      reader.readAsText(file);
    });
  }

  var openWalkBtn = document.getElementById('openWalkAppBtn');
  if (openWalkBtn) {
    openWalkBtn.addEventListener('click', function () {
      var payload = C.buildWalkSharePayload(store, todayKey);
      if (window.SuGNativeTransport && typeof window.SuGNativeTransport.openWalkApp === 'function') {
        window.SuGNativeTransport.openWalkApp(payload);
        showToast('S.u.G WALKを起動しています');
      } else {
        window.location.href = 'sug-walk://swag-sync?level=' + encodeURIComponent(payload.level) + '&coins=' + encodeURIComponent(payload.coins);
      }
    });
  }

  window.addEventListener('sug:walk-incoming', function (e) {
    var detail = e.detail || {};
    var params = detail.params || {};
    var incomingCoins = Number(params.coins);
    if (Number.isFinite(incomingCoins) && incomingCoins >= 0) {
      store.profile.walkSyncedCoins = Math.floor(incomingCoins);
    }
    var incomingSteps = Number(params.steps);
    var d = store.days[todayKey];
    var hkActive = !!(d.nativeSnapshot && d.nativeSnapshot.source === 'healthkit' && d.nativeSnapshot.steps != null);
    if (!hkActive && Number.isFinite(incomingSteps) && incomingSteps > 0 && d.steps == null) {
      d.steps = Math.floor(incomingSteps);
    }
    store.profile.walkLastSyncedAt = new Date().toISOString();
    saveStore('S.u.G WALKからの連携データを受信しました');
  });

  renderAll();
})();
