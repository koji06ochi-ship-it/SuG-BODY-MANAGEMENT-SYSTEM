/* S.u.G SWAG Training Engine: Strength (1RM/RIR/Overload), Running (Pace/Zone/Weekly km), HYROX (8 Stations), Mobility */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SuGSwagTraining = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HYROX_STATIONS = [
    { id: 'skierg', name: 'SkiErg (1,000m)', defaultUnit: '1000m' },
    { id: 'sled_push', name: 'Sled Push (50m)', defaultUnit: '50m' },
    { id: 'sled_pull', name: 'Sled Pull (50m)', defaultUnit: '50m' },
    { id: 'burpee_broad_jump', name: 'Burpee Broad Jumps (80m)', defaultUnit: '80m' },
    { id: 'rowing', name: 'Rowing (1,000m)', defaultUnit: '1000m' },
    { id: 'farmers_carry', name: 'Farmers Carry (200m)', defaultUnit: '200m' },
    { id: 'sandbag_lunges', name: 'Sandbag Lunges (100m)', defaultUnit: '100m' },
    { id: 'wall_balls', name: 'Wall Balls (75/100 reps)', defaultUnit: '100reps' }
  ];

  function calcEpley1RM(weightKg, reps) {
    var w = Number(weightKg);
    var r = Number(reps);
    if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) return null;
    if (r === 1) return Math.round(w * 10) / 10;
    return Math.round(w * (1 + r / 30) * 10) / 10;
  }

  function calcRir(rpe) {
    var v = Number(rpe);
    if (!Number.isFinite(v)) return null;
    return Math.max(0, Math.min(9, Math.round((10 - v) * 10) / 10));
  }

  function calcPaceMinPerKm(distanceKm, durationMin) {
    var d = Number(distanceKm);
    var m = Number(durationMin);
    if (!Number.isFinite(d) || !Number.isFinite(m) || d <= 0 || m <= 0) return null;
    var totalSec = Math.round((m * 60) / d);
    var min = Math.floor(totalSec / 60);
    var sec = totalSec % 60;
    return {
      secPerKm: totalSec,
      formatted: min + ':' + String(sec).padStart(2, '0') + ' /km'
    };
  }

  function summarizeWeeklyEndurance(daysMap, todayKey) {
    var refMs = Date.parse(todayKey);
    var totalKm = 0;
    var totalMin = 0;
    var runCount = 0;
    var hyroxCount = 0;
    var mobilityCount = 0;
    Object.keys(daysMap || {}).forEach(function (dk) {
      var diff = (refMs - Date.parse(dk)) / 86400000;
      if (diff < 0 || diff >= 7) return;
      var logs = (daysMap[dk] && daysMap[dk].trainingLogs) || [];
      logs.forEach(function (t) {
        if (t.mode === 'running' || t.part === 'ランニング・持久力') {
          runCount += 1;
          if (Number.isFinite(Number(t.distanceKm))) totalKm += Number(t.distanceKm);
          if (Number.isFinite(Number(t.durationMin))) totalMin += Number(t.durationMin);
        } else if (t.mode === 'hyrox' || t.part === 'HYROX・機能的トレーニング') {
          hyroxCount += 1;
          if (Number.isFinite(Number(t.durationMin))) totalMin += Number(t.durationMin);
        } else if (t.mode === 'mobility' || t.part === '柔軟性・動作効率') {
          mobilityCount += 1;
        }
      });
    });
    return {
      weeklyDistanceKm: Math.round(totalKm * 100) / 100,
      weeklyDurationMin: Math.round(totalMin),
      runCount: runCount,
      hyroxCount: hyroxCount,
      mobilityCount: mobilityCount
    };
  }

  function mapModeToHealthKitActivity(mode, part) {
    if (mode === 'running' || part === 'ランニング・持久力') return 'running';
    if (mode === 'hyrox' || part === 'HYROX・機能的トレーニング') return 'hyrox';
    if (mode === 'mobility' || part === '柔軟性・動作効率') return 'mobility';
    return 'strength';
  }

  return {
    HYROX_STATIONS: HYROX_STATIONS,
    calcEpley1RM: calcEpley1RM,
    calcRir: calcRir,
    calcPaceMinPerKm: calcPaceMinPerKm,
    summarizeWeeklyEndurance: summarizeWeeklyEndurance,
    mapModeToHealthKitActivity: mapModeToHealthKitActivity
  };
});
