/* S.u.G SWAG (formerly BODY) Apple HealthKit WKWebView Bridge & Mind-Lifestyle Correlation Analyzer */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.SuGBodyHealthKit = api;
    root.SuGSwagHealthKit = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function isNativeAvailable() {
    return !!(
      typeof window !== 'undefined' &&
      window.webkit &&
      window.webkit.messageHandlers &&
      window.webkit.messageHandlers.sugBodyNative
    );
  }

  /* NOTE: Posting a request to WKWebView only marks it as pending (confirmed: false).
     Actual success/failure MUST be determined from native callback event `sug:native-health-write-result` or `sug:healthkit-result`. */
  function postAction(action, payload) {
    if (!isNativeAvailable()) {
      return { ok: false, pending: false, confirmed: false, reason: 'NATIVE_BRIDGE_UNAVAILABLE', action: action };
    }
    var msg = (action === 'requestAuthorization' || action === 'refreshToday')
      ? { kind: 'healthRequest', action: action }
      : { kind: 'healthWrite', action: action, payload: payload || {} };
    window.webkit.messageHandlers.sugBodyNative.postMessage(msg);
    return { ok: true, pending: true, confirmed: false, action: action };
  }

  function requestAuthorization() {
    return postAction('requestAuthorization', {});
  }

  function refreshToday() {
    return postAction('refreshToday', {});
  }

  function writeMindfulSession(opts) {
    if (!opts || !opts.startDateISO || !opts.endDateISO) {
      return { ok: false, pending: false, confirmed: false, reason: 'INVALID_DATES' };
    }
    return postAction('writeMindfulSession', {
      syncId: String(opts.syncId || ('body-mindful-' + opts.startDateISO)),
      startDateISO: String(opts.startDateISO),
      endDateISO: String(opts.endDateISO),
      exerciseType: String(opts.exerciseType || '360_breathing')
    });
  }

  function writeStateOfMind(opts) {
    if (!opts || typeof opts.valence !== 'number') {
      return { ok: false, pending: false, confirmed: false, reason: 'INVALID_VALENCE' };
    }
    return postAction('writeStateOfMind', {
      syncId: String(opts.syncId || ('body-som-' + Date.now())),
      dateISO: String(opts.dateISO || new Date().toISOString()),
      kind: opts.kind === 'dailyMood' ? 'dailyMood' : 'momentaryEmotion',
      valence: Math.max(-1, Math.min(1, opts.valence)),
      labels: Array.isArray(opts.labels) ? opts.labels.slice(0, 6) : [],
      associations: Array.isArray(opts.associations) ? opts.associations.slice(0, 6) : []
    });
  }

  function writeNutrition(opts) {
    if (!opts) return { ok: false, pending: false, confirmed: false, reason: 'EMPTY_PAYLOAD' };
    return postAction('writeNutrition', {
      syncId: String(opts.syncId || ('body-meal-' + Date.now())),
      dateISO: String(opts.dateISO || new Date().toISOString()),
      kcal: opts.kcal != null ? Number(opts.kcal) : null,
      proteinG: opts.proteinG != null ? Number(opts.proteinG) : null,
      fatG: opts.fatG != null ? Number(opts.fatG) : null,
      carbsG: opts.carbsG != null ? Number(opts.carbsG) : null,
      fiberG: opts.fiberG != null ? Number(opts.fiberG) : null,
      waterMl: opts.waterMl != null ? Number(opts.waterMl) : null
    });
  }

  function writeBodyMetrics(opts) {
    if (!opts || (opts.weightKg == null && opts.bodyFatPct == null)) {
      return { ok: false, pending: false, confirmed: false, reason: 'EMPTY_BODY_METRICS' };
    }
    return postAction('writeBodyMetrics', {
      syncId: String(opts.syncId || ('body-metrics-' + Date.now())),
      dateISO: String(opts.dateISO || new Date().toISOString()),
      weightKg: opts.weightKg != null ? Number(opts.weightKg) : null,
      bodyFatPct: opts.bodyFatPct != null ? Number(opts.bodyFatPct) : null
    });
  }

  function writeWorkout(opts) {
    if (!opts || !opts.startDateISO || !opts.endDateISO) {
      return { ok: false, pending: false, confirmed: false, reason: 'INVALID_WORKOUT_DATES' };
    }
    return postAction('writeWorkout', {
      syncId: String(opts.syncId || ('swag-workout-' + opts.startDateISO)),
      activityType: String(opts.activityType || 'strength'),
      startDateISO: String(opts.startDateISO),
      endDateISO: String(opts.endDateISO),
      distanceMeters: opts.distanceMeters != null ? Number(opts.distanceMeters) : null,
      energyKcal: opts.energyKcal != null ? Number(opts.energyKcal) : null
    });
  }

  function writeAlcoholBeverages(opts) {
    if (!opts || !(Number(opts.standardDrinks) >= 0)) {
      return { ok: false, pending: false, confirmed: false, reason: 'INVALID_DRINK_COUNT' };
    }
    return postAction('writeAlcoholBeverages', {
      syncId: String(opts.syncId || ('body-alc-' + Date.now())),
      dateISO: String(opts.dateISO || new Date().toISOString()),
      standardDrinks: Number(opts.standardDrinks)
    });
  }

  /* Analyze relationship between HKStateOfMind, Sleep, Activity, Daylight, Walking Metrics, MindfulSession
     (within-user observation only; missing data is NEVER treated as 0; no medical claims) */
  function analyzeMindLifestyleRelations(nativePayload, dayObj) {
    var p = nativePayload || {};
    var observations = [];
    var valence = typeof p.latestStateOfMindValence === 'number' ? p.latestStateOfMindValence : null;
    var sleepH = typeof p.sleepHours === 'number' ? p.sleepHours : (dayObj && dayObj.recoveryState && dayObj.recoveryState.sleepHours != null ? dayObj.recoveryState.sleepHours : null);
    var daylightMin = typeof p.timeInDaylightMinutes === 'number' ? p.timeInDaylightMinutes : null;
    var mindfulMin = typeof p.mindfulMinutesToday === 'number' ? p.mindfulMinutesToday : null;
    var steps = typeof p.steps === 'number' ? p.steps : (dayObj && dayObj.steps != null ? dayObj.steps : null);
    var walkSpeed = typeof p.walkingSpeedKmh === 'number' ? p.walkingSpeedKmh : null;
    var walkStepLen = typeof p.walkingStepLengthCm === 'number' ? p.walkingStepLengthCm : null;
    var walkAsym = typeof p.walkingAsymmetryPercent === 'number' ? p.walkingAsymmetryPercent : null;
    var walkSteady = typeof p.walkingSteadinessPercent === 'number' ? p.walkingSteadinessPercent : null;

    if (valence === null) {
      observations.push('心の状態（HKStateOfMind）: 未取得（iOS 18+・許可後に連携）');
    } else {
      observations.push('心の状態（HKStateOfMind Valence）: ' + valence.toFixed(2) + '（-1.0〜+1.0）');
    }

    if (sleepH !== null && valence !== null) {
      observations.push(
        sleepH >= 7
          ? '睡眠 ' + sleepH.toFixed(1) + 'h と心の状態が同日に記録されています（良好な睡眠帯）。'
          : '睡眠 ' + sleepH.toFixed(1) + 'h（短め）と同日の心の状態を並べて観測中です。'
      );
    }
    if (daylightMin !== null) {
      observations.push('日光時間（timeInDaylight）: ' + Math.round(daylightMin) + '分' + (daylightMin >= 20 ? '（日中の光曝露あり）' : '（室内中心の日）'));
    } else {
      observations.push('日光時間（timeInDaylight）: 未取得（Apple Watch / iOS 17+ で自動計測）');
    }
    if (mindfulMin !== null) {
      observations.push('マインドフルネス（mindfulSession）: ' + Math.round(mindfulMin) + '分');
    }
    if (steps !== null) {
      observations.push('歩数: ' + Math.round(steps).toLocaleString() + '歩');
    }
    if (walkSpeed !== null || walkStepLen !== null || walkAsym !== null || walkSteady !== null) {
      var wm = [];
      if (walkSpeed !== null) wm.push('速度 ' + walkSpeed.toFixed(1) + 'km/h');
      if (walkStepLen !== null) wm.push('歩幅 ' + Math.round(walkStepLen) + 'cm');
      if (walkAsym !== null) wm.push('非対称性 ' + walkAsym.toFixed(1) + '%');
      if (walkSteady !== null) wm.push('安定性 ' + walkSteady.toFixed(0) + '%');
      observations.push('歩行指標: ' + wm.join(' / '));
    } else {
      observations.push('歩行指標（速度・歩幅・非対称性・安定性）: 未取得');
    }

    return {
      hasStateOfMind: valence !== null,
      observations: observations,
      note: '個人内の同時観測記録であり、因果関係や医療的診断を示すものではありません。未取得項目は0として扱いません。'
    };
  }

  /* Build minimal AI-safe context ONLY when explicit user consent is true */
  function buildConsentedAiHealthContext(nativePayload, dayObj, hasExplicitConsent) {
    if (!hasExplicitConsent) {
      return { allowed: false, reason: 'CONSENT_REQUIRED', context: null };
    }
    var p = nativePayload || {};
    return {
      allowed: true,
      context: {
        sleepHours: typeof p.sleepHours === 'number' ? p.sleepHours : null,
        steps: typeof p.steps === 'number' ? p.steps : null,
        timeInDaylightMinutes: typeof p.timeInDaylightMinutes === 'number' ? p.timeInDaylightMinutes : null,
        mindfulMinutesToday: typeof p.mindfulMinutesToday === 'number' ? p.mindfulMinutesToday : null,
        stateOfMindValence: typeof p.latestStateOfMindValence === 'number' ? p.latestStateOfMindValence : null,
        recoveryStatus: (dayObj && dayObj.recoveryStatus) || null
      }
    };
  }

  return {
    isNativeAvailable: isNativeAvailable,
    requestAuthorization: requestAuthorization,
    refreshToday: refreshToday,
    writeMindfulSession: writeMindfulSession,
    writeStateOfMind: writeStateOfMind,
    writeNutrition: writeNutrition,
    writeBodyMetrics: writeBodyMetrics,
    writeWorkout: writeWorkout,
    writeAlcoholBeverages: writeAlcoholBeverages,
    analyzeMindLifestyleRelations: analyzeMindLifestyleRelations,
    buildConsentedAiHealthContext: buildConsentedAiHealthContext
  };
});
