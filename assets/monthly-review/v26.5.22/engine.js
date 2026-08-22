(function () {
  "use strict";

  var VERSION = "26.5.22";
  var VIEWS = [
    {key: "front", label: "正面"},
    {key: "side", label: "側面"},
    {key: "back", label: "背面"}
  ];
  var PARTS = ["肩", "背中", "胸", "腕", "前脚", "後脚・臀部", "姿勢"];
  var PART_MAP = {
    "肩": {view: "front", field: "shoulderCirc", label: "肩周径", threshold: 0.4},
    "背中": {view: "back", field: "", label: "背面写真・同一種目", threshold: 0},
    "胸": {view: "side", field: "chestCirc", label: "胸囲", threshold: 0.4},
    "腕": {view: "front", field: "upperArmCirc", label: "上腕囲", threshold: 0.2},
    "前脚": {view: "front", field: "thighCirc", label: "大腿囲", threshold: 0.4},
    "後脚・臀部": {view: "side", field: "thighCirc", label: "大腿囲参考", threshold: 0.4, proxy: true},
    "姿勢": {view: "side", field: "", label: "側面写真", threshold: 0}
  };
  var STATES = {
    IMPROVED: {label: "伸びた部位", css: "improved"},
    MAINTAIN: {label: "維持", css: "maintain"},
    LAGGING: {label: "停滞・重点", css: "lagging"},
    RESTRICTED: {label: "CARE / 制限", css: "restricted"},
    DATA_LOW: {label: "DATA LOW", css: "data-low"}
  };
  var photoRenderToken = 0;

  function memberState() {
    try { return typeof m === "function" ? m() : null; } catch (_error) { return null; }
  }

  function html(value) {
    if (typeof esc === "function") return esc(value);
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (value) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[value];
    });
  }

  function currentMonth() {
    try { return typeof monthNow === "function" ? monthNow() : new Date().toISOString().slice(0, 7); }
    catch (_error) { return new Date().toISOString().slice(0, 7); }
  }

  function validMonth(value) {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || "")) ? String(value) : currentMonth();
  }

  function monthShift(month, shift) {
    var parts = validMonth(month).split("-");
    return new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1 + shift, 1)).toISOString().slice(0, 7);
  }

  function monthLimits(month) {
    var selected = validMonth(month);
    var next = monthShift(selected, 1);
    var end = new Date(Date.parse(next + "-01T12:00:00Z") - 86400000).toISOString().slice(0, 10);
    return {month: selected, start: selected + "-01", end: end, previousMonth: monthShift(selected, -1)};
  }

  function photoView(photo) {
    var explicit = String(photo && photo.view || "").toLowerCase();
    if (explicit === "front" || explicit === "side" || explicit === "back") return explicit;
    var memo = String(photo && photo.memo || "");
    if (/正面|前面|\bfront\b/i.test(memo)) return "front";
    if (/側面|横向|真横|横姿|\bside\b/i.test(memo)) return "side";
    if (/背面|後ろ|後面|\bback\b/i.test(memo)) return "back";
    return "unknown";
  }

  function viewLabel(photoOrView) {
    var key = typeof photoOrView === "string" ? photoOrView : photoView(photoOrView);
    for (var index = 0; index < VIEWS.length; index += 1) {
      if (VIEWS[index].key === key) return VIEWS[index].label;
    }
    return "";
  }

  function photoReference(photo, index) {
    if (!photo) return null;
    return {
      date: String(photo.date || ""),
      path: String(photo.path || ""),
      memo: String(photo.memo || ""),
      view: photoView(photo),
      index: index
    };
  }

  function matchingPhotos(member, limits) {
    var indexed = (member.photos || []).map(function (photo, index) {
      return {photo: photo, index: index};
    }).filter(function (item) {
      return item.photo && /^\d{4}-\d{2}-\d{2}$/.test(String(item.photo.date || ""));
    }).sort(function (a, b) {
      return String(a.photo.date).localeCompare(String(b.photo.date)) || a.index - b.index;
    });
    return VIEWS.map(function (view) {
      var same = indexed.filter(function (item) { return photoView(item.photo) === view.key; });
      var after = same.filter(function (item) {
        return item.photo.date >= limits.start && item.photo.date <= limits.end;
      }).at(-1) || null;
      var before = same.filter(function (item) {
        if (item.photo.date >= limits.start) return false;
        var difference = Math.round((Date.parse(limits.start + "T12:00:00Z") - Date.parse(item.photo.date + "T12:00:00Z")) / 86400000);
        return difference >= 1 && difference <= 90;
      }).at(-1) || null;
      var status = after && before ? "MATCHED" : !after && !before ? "BOTH_MISSING" : !after ? "AFTER_MISSING" : "BEFORE_MISSING";
      return {
        view: view.key,
        label: view.label,
        before: before ? photoReference(before.photo, before.index) : null,
        after: after ? photoReference(after.photo, after.index) : null,
        status: status,
        matched: status === "MATCHED"
      };
    });
  }

  function latest(rows, start, end, field) {
    return (rows || []).filter(function (row) {
      return row && row.date && (!start || row.date >= start) && row.date <= end &&
        (!field || Number(row[field] || 0) > 0);
    }).slice().sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date));
    }).at(-1) || null;
  }

  function numberOrNull(value) {
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function metric(current, previous, field, unit, weightFallback) {
    var now = numberOrNull(current && current[field]);
    var then = numberOrNull(previous && previous[field]);
    if (weightFallback) {
      if (now === null) now = numberOrNull(weightFallback.current && weightFallback.current.fat);
      if (then === null) then = numberOrNull(weightFallback.previous && weightFallback.previous.fat);
    }
    return {
      current: now,
      previous: then,
      delta: now !== null && then !== null ? Math.round((now - then) * 10) / 10 : null,
      unit: unit
    };
  }

  function bodyMetrics(member, limits) {
    var previousEnd = limits.previousMonth + "-" +
      String(new Date(Date.UTC(Number(limits.previousMonth.slice(0, 4)), Number(limits.previousMonth.slice(5, 7)), 0)).getUTCDate()).padStart(2, "0");
    var previousFloor = monthShift(limits.month, -4) + "-01";
    var currentMeasurement = latest(member.bodyMeasurements, limits.start, limits.end);
    var previousMeasurement = latest(member.bodyMeasurements, previousFloor, previousEnd);
    var currentWeight = latest(member.weights, limits.start, limits.end);
    var previousWeight = latest(member.weights, previousFloor, previousEnd);
    return {
      currentMeasurement: currentMeasurement,
      previousMeasurement: previousMeasurement,
      currentWeight: currentWeight,
      previousWeight: previousWeight,
      weight: metric(currentWeight, previousWeight, "weight", "kg"),
      bodyFat: metric(currentMeasurement, previousMeasurement, "bodyFat", "%", {current: currentWeight, previous: previousWeight}),
      waist: metric(currentMeasurement, previousMeasurement, "waistCirc", "cm"),
      leanMass: metric(currentMeasurement, previousMeasurement, "leanMass", "kg")
    };
  }

  function medicalFor(part) {
    try { return typeof medicalGuidanceForPart === "function" ? medicalGuidanceForPart(part) : null; }
    catch (_error) { return null; }
  }

  function careState() {
    try { return typeof smartCareState === "function" ? smartCareState() : {active: false, mode: "none"}; }
    catch (_error) { return {active: false, mode: "none"}; }
  }

  function careFor(care, part) {
    if (!care || !care.active || care.mode !== "avoid") return false;
    try {
      return typeof careAffectsFocus === "function" ?
        !!careAffectsFocus(care, part) : (care.conflicts || []).indexOf(part) >= 0;
    } catch (_error) {
      return (care.conflicts || []).indexOf(part) >= 0;
    }
  }

  function trainingMetrics(member, part, limits) {
    try {
      if (typeof responseWindowMetrics === "function") {
        var observed = responseWindowMetrics(part, limits.start, limits.end);
        return {
          sets: Number(observed.sets || 0),
          sessions: Number(observed.sessions || 0),
          performancePct: Number.isFinite(observed.performancePct) && observed.performancePct !== null ? Number(observed.performancePct) : null,
          comparableExercises: Number(observed.comparableExercises || 0),
          recovery: observed.recovery || null
        };
      }
    } catch (_error) {
      // Fall back to saved rows when the optional response engine is not available.
    }
    var rows = (member.training || []).filter(function (row) {
      if (!row || !row.date || row.date < limits.start || row.date > limits.end) return false;
      var actual = row.part || "";
      try { if (typeof trainingMetaForRow === "function") actual = trainingMetaForRow(row).part; } catch (_error) {}
      return actual === part;
    });
    var byExercise = {};
    rows.forEach(function (row) {
      var key = String(row.exercise || "");
      if (!key) return;
      if (!byExercise[key]) byExercise[key] = [];
      byExercise[key].push(row);
    });
    var changes = [];
    Object.keys(byExercise).forEach(function (exercise) {
      var list = byExercise[exercise].slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
      if (list.length < 2) return;
      var first = typeof e1rm === "function" ? e1rm(list[0]) : Number(list[0].weight || 0) * (1 + Number(list[0].reps || 0) / 30);
      var last = typeof e1rm === "function" ? e1rm(list.at(-1)) : Number(list.at(-1).weight || 0) * (1 + Number(list.at(-1).reps || 0) / 30);
      if (first > 0) changes.push((last - first) / first * 100);
    });
    return {
      sets: rows.reduce(function (sum, row) { return sum + Number(row.sets || 0); }, 0),
      sessions: Array.from(new Set(rows.map(function (row) { return row.date; }))).length,
      performancePct: changes.length ? changes.reduce(function (sum, value) { return sum + value; }, 0) / changes.length : null,
      comparableExercises: changes.length,
      recovery: null
    };
  }

  function changeText(value, unit) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return "--";
    return (Number(value) > 0 ? "+" : "") + Number(value).toFixed(1) + String(unit || "");
  }

  function partReview(member, part, rank, limits, pairByView, metrics, care) {
    var spec = PART_MAP[part];
    var pair = pairByView[spec.view] || {matched: false};
    var current = numberOrNull(metrics.currentMeasurement && metrics.currentMeasurement[spec.field]);
    var previous = numberOrNull(metrics.previousMeasurement && metrics.previousMeasurement[spec.field]);
    var delta = spec.field && current !== null && previous !== null ? Math.round((current - previous) * 10) / 10 : null;
    var training = trainingMetrics(member, part, limits);
    var medical = medicalFor(part);
    var medicalStopped = !!(medical && /^stop/.test(String(medical.trainingStatus || "")));
    var restricted = medicalStopped || careFor(care, part);
    var evidence = [];
    if (delta !== null) evidence.push(spec.label + " " + changeText(delta, "cm") + (spec.proxy ? "（臀部単独の変化ではありません）" : ""));
    if (training.performancePct !== null) evidence.push("月内e1RM " + changeText(training.performancePct, "%") + "（同一種目参考）");
    if (training.sets > 0) evidence.push(training.sets + " SET / " + training.sessions + "日");
    if (pair.matched) evidence.push(spec.view === "back" ? "背面写真を並べて確認" : viewLabel(spec.view) + "写真を並べて確認");
    else evidence.push(viewLabel(spec.view) + " BEFORE / AFTER不足");
    var state = "DATA_LOW";
    var reason = "同じ方向の写真・計測・同一種目の記録が不足";
    if (restricted) {
      state = "RESTRICTED";
      reason = medicalStopped ? "医療機関の指示を優先" : "CARE対象部位の高負荷を回避";
    } else if (spec.proxy && delta !== null && training.performancePct === null) {
      state = training.sets > 0 ? "MAINTAIN" : "DATA_LOW";
      reason = "大腿囲は参考値。臀部・後脚単独の増減は判定しません";
    } else if (delta !== null && delta >= spec.threshold && spec.threshold > 0) {
      state = "IMPROVED";
      reason = spec.label + "が前回計測より増加";
    } else if (training.performancePct !== null && training.performancePct >= 3 && (delta === null || delta > -0.4)) {
      state = "IMPROVED";
      reason = "同一種目の月内トレーニング反応が上向き";
    } else if (delta !== null && Math.abs(delta) <= 0.3 && (training.performancePct === null || training.performancePct >= 1)) {
      state = rank >= 0 && training.performancePct === null ? "LAGGING" : "MAINTAIN";
      reason = state === "LAGGING" ? "理想の重点部位で計測変化が小さい" : "計測と記録は概ね維持";
    } else if ((delta !== null && delta < 0) || (training.performancePct !== null && training.performancePct <= 0)) {
      state = "LAGGING";
      reason = metrics.bodyFat.delta !== null && metrics.bodyFat.delta < -0.5 ?
        "減量の影響もあるため写真・同一種目・計測を再確認" : "計測または同一種目の反応が停滞";
    } else if (training.sets > 0 && pair.matched) {
      state = "MAINTAIN";
      reason = "写真と実施記録あり。数値変化は次回計測で確認";
    }
    var score = rank >= 0 ? [50, 38, 27][Math.min(rank, 2)] : 0;
    if (state === "LAGGING") score += 38;
    if (state === "DATA_LOW") score += rank >= 0 ? 12 : 0;
    if (state === "MAINTAIN") score -= 6;
    if (state === "IMPROVED") score -= 22;
    if (pair.matched) score += 5;
    if (restricted) score = -1000;
    return {
      part: part,
      idealRank: rank,
      view: spec.view,
      photoMatched: !!pair.matched,
      metricLabel: spec.label,
      metricDelta: delta,
      proxy: !!spec.proxy,
      performancePct: training.performancePct === null ? null : Math.round(training.performancePct * 10) / 10,
      comparableExercises: training.comparableExercises,
      sets: training.sets,
      sessions: training.sessions,
      state: state,
      stateLabel: STATES[state].label,
      reason: reason,
      evidence: evidence,
      restricted: restricted,
      score: score
    };
  }

  function recoverySummary(member, limits) {
    var rows = (member.recovery || []).filter(function (row) {
      return row && row.date >= limits.start && row.date <= limits.end;
    });
    if (!rows.length) return {count: 0, score: null, pain: null};
    var scores = rows.map(function (row) {
      try { return typeof recScore === "function" ? recScore(row) : null; } catch (_error) { return null; }
    }).filter(function (score) { return score !== null && Number.isFinite(Number(score)); });
    var pains = rows.map(function (row) { return Number(row.pain || 0); });
    return {
      count: rows.length,
      score: scores.length ? Math.round(scores.reduce(function (sum, score) { return sum + Number(score); }, 0) / scores.length) : null,
      pain: Math.round(pains.reduce(function (sum, value) { return sum + value; }, 0) / pains.length * 10) / 10
    };
  }

  function buildReview(month) {
    var member = memberState();
    if (!member) return null;
    var limits = monthLimits(month || selectedMonth());
    var goal = member.goalPlan || {};
    var profiles = window.__SUG_IDEAL_DAILY_PROFILES__ || {};
    var profile = profiles[goal.idealVisionType] || null;
    var focus = profile ? profile.focus.slice() : [goal.priority1, goal.priority2, goal.priority3].filter(Boolean);
    var care = careState();
    var globalMedical = medicalFor("全身");
    var globalStop = !!(globalMedical && globalMedical.trainingStatus === "stop_all");
    var pairs = matchingPhotos(member, limits);
    var pairByView = {};
    pairs.forEach(function (pair) { pairByView[pair.view] = pair; });
    var matched = pairs.filter(function (pair) { return pair.matched; }).length;
    var metrics = bodyMetrics(member, limits);
    var parts = PARTS.map(function (part) {
      return partReview(member, part, focus.indexOf(part), limits, pairByView, metrics, care);
    });
    var priorities = globalStop ? [] : parts.filter(function (part) {
      return !part.restricted;
    }).slice().sort(function (a, b) {
      return b.score - a.score || (a.idealRank < 0 ? 9 : a.idealRank) - (b.idealRank < 0 ? 9 : b.idealRank);
    }).slice(0, 3).map(function (part) {
      return {part: part.part, state: part.state, reason: part.reason, score: part.score};
    });
    var missing = pairs.filter(function (pair) {
      return !pair.after || !pair.before;
    }).map(function (pair) {
      return pair.label + (!pair.after && !pair.before ? "（今月・過去とも未撮影）" : !pair.after ? "（今月未撮影）" : "（過去写真なし）");
    });
    return {
      version: VERSION,
      month: limits.month,
      previousMonth: limits.previousMonth,
      createdAt: new Date().toISOString(),
      idealType: goal.idealVisionType || "",
      idealName: profile ? profile.name : "理想タイプ未選択",
      idealLabel: profile ? profile.label : "",
      idealFocus: focus,
      pairs: pairs,
      matchedViews: matched,
      photoConfidence: matched >= 3 ? "HIGH" : matched === 2 ? "MEDIUM" : matched === 1 ? "LOW" : "DATA_LOW",
      missingViews: missing,
      metrics: {
        weight: metrics.weight,
        bodyFat: metrics.bodyFat,
        waist: metrics.waist,
        leanMass: metrics.leanMass,
        currentMeasurementDate: metrics.currentMeasurement && metrics.currentMeasurement.date || "",
        previousMeasurementDate: metrics.previousMeasurement && metrics.previousMeasurement.date || ""
      },
      recovery: recoverySummary(member, limits),
      care: care.active ? {mode: care.mode, area: care.areaLabel || "", detail: care.detail || ""} : null,
      globalStop: globalStop,
      parts: parts,
      improved: parts.filter(function (part) { return part.state === "IMPROVED"; }).map(function (part) { return part.part; }),
      maintained: parts.filter(function (part) { return part.state === "MAINTAIN"; }).map(function (part) { return part.part; }),
      lagging: parts.filter(function (part) { return part.state === "LAGGING"; }).map(function (part) { return part.part; }),
      restricted: parts.filter(function (part) { return part.restricted; }).map(function (part) { return part.part; }),
      nextPriorities: priorities
    };
  }

  function metricMarkup(label, data) {
    var value = data.current === null ? "--" : Number(data.current).toFixed(1) + data.unit;
    var delta = data.delta === null ? "前回比較なし" : "前回比 " + changeText(data.delta, data.unit);
    return '<div class="monthlyMetric"><span>' + html(label) + "</span><b>" + html(value) + "</b><small>" + html(delta) + "</small></div>";
  }

  function confidenceMarkup(review) {
    return '<div class="monthlyConfidence"><strong>' + html(review.month) + "｜" + html(review.idealName) +
      '</strong><span class="badge">' + html(review.photoConfidence) + '</span><span class="badge">写真 ' +
      review.matchedViews + '/3方向</span></div>' +
      (review.missingViews.length ? '<div class="monthlyReviewNote">不足：' + html(review.missingViews.join(" / ")) + "</div>" : "") +
      (review.care ? '<div class="monthlyReviewNote">CARE：' + html(review.care.area + "｜" + (review.care.detail || review.care.mode)) + "</div>" : "");
  }

  function prioritiesMarkup(review) {
    if (review.globalStop) return '<div class="monthlyReviewStop">医療機関の指示に従い、トレーニングの重点は反映しません。</div>';
    if (!review.nextPriorities.length) return '<div class="monthlyReviewNote">安全に反映できる重点部位がありません。</div>';
    return '<div class="monthlyTopGrid">' + review.nextPriorities.map(function (item, index) {
      return '<div class="monthlyTop"><span>NEXT MONTH #' + (index + 1) + "</span><strong>" +
        html(item.part) + "</strong><small>" + html(item.reason) + "</small></div>";
    }).join("") + "</div>";
  }

  function partMarkup(parts) {
    return '<div class="monthlyPartList">' + parts.map(function (part) {
      return '<div class="monthlyPart"><div class="monthlyPartHead"><strong>' + html(part.part) +
        '</strong><span class="monthlyPartStatus ' + STATES[part.state].css + '">' + html(part.stateLabel) +
        '</span></div><div class="monthlyPartEvidence">' + html(part.evidence.join("｜")) +
        "<br>" + html(part.reason) + "</div></div>";
    }).join("") + "</div>";
  }

  function summaryMarkup(review, full) {
    var metricCards = '<div class="monthlyMetricGrid">' +
      metricMarkup("体重", review.metrics.weight) + metricMarkup("体脂肪", review.metrics.bodyFat) +
      metricMarkup("腹囲", review.metrics.waist) + metricMarkup("除脂肪量", review.metrics.leanMass) + "</div>";
    var lists = '<div class="monthlyReviewNote">伸び：' + html(review.improved.join(" / ") || "--") +
      "｜維持：" + html(review.maintained.join(" / ") || "--") +
      "｜停滞：" + html(review.lagging.join(" / ") || "--") +
      (review.restricted.length ? "｜制限：" + html(review.restricted.join(" / ")) : "") + "</div>";
    var response = review.recovery.count ? '<div class="monthlyReviewNote">月間回復：' +
      html((review.recovery.score === null ? "--" : review.recovery.score + "点") + "｜痛み " + review.recovery.pain +
      "/10｜" + review.recovery.count + "件") + "</div>" : "";
    var disclaimer = '<div class="monthlyReviewNote">写真は同じ方向の見た目を本人・コーチが確認するために表示。部位判定は身体計測と同一種目の記録を使用し、写真の画素を自動診断しません。</div>';
    return confidenceMarkup(review) + metricCards + lists + prioritiesMarkup(review) +
      (full ? partMarkup(review.parts) + response + disclaimer : "");
  }

  function resolvePhoto(reference) {
    var member = memberState();
    if (!member || !reference) return null;
    var rows = member.photos || [];
    var indexed = rows[reference.index];
    if (indexed && indexed.date === reference.date && photoView(indexed) === reference.view &&
      (!reference.path || indexed.path === reference.path)) return indexed;
    return rows.filter(function (photo) {
      return photo && photo.date === reference.date && photoView(photo) === reference.view &&
        (!reference.path || photo.path === reference.path);
    }).at(-1) || null;
  }

  async function photoColumn(reference, tag) {
    if (!reference) {
      return '<div class="monthlyViewPhoto"><div class="monthlyViewMissing">' + html(tag) +
        "<br>この方向の写真がありません</div></div>";
    }
    var photo = resolvePhoto(reference);
    var url = "";
    try {
      if (photo && typeof getPhotoSignedUrl === "function") url = await getPhotoSignedUrl(photo);
      else if (photo) url = photo.data || "";
    } catch (_error) {
      url = "";
    }
    var image = url ? '<img src="' + html(url) + '" alt="' + html(tag + " " + viewLabel(reference.view)) + '">' :
      '<div class="monthlyViewMissing">写真を読み込めませんでした</div>';
    return '<div class="monthlyViewPhoto"><b>' + html(tag) + "</b>" + image +
      "<small>" + html(reference.date) + "</small></div>";
  }

  async function renderPhotoPairs(review) {
    var box = document.getElementById("monthlyReviewPhotoPairs");
    if (!box) return;
    var token = ++photoRenderToken;
    var result = await Promise.all(review.pairs.map(async function (pair) {
      var photos = await Promise.all([photoColumn(pair.before, "BEFORE"), photoColumn(pair.after, "AFTER")]);
      var badge = pair.matched ? "同方向で比較" : "DATA LOW";
      return '<div class="monthlyViewPair"><div class="monthlyViewTitle"><span>' + html(pair.label) +
        '</span><span class="badge">' + html(badge) + '</span></div><div class="monthlyViewPhotos">' +
        photos.join("") + "</div></div>";
    }));
    if (token === photoRenderToken) box.innerHTML = result.join("");
  }

  function selectedMonth() {
    var photoMonth = document.getElementById("monthlyReviewPhotoMonth");
    var report = document.getElementById("reportMonth");
    return validMonth(photoMonth && photoMonth.value || report && report.value || currentMonth());
  }

  function renderReview(month) {
    var member = memberState();
    if (!member) return null;
    var selected = validMonth(month || selectedMonth());
    var photoMonth = document.getElementById("monthlyReviewPhotoMonth");
    var reportMonthInput = document.getElementById("reportMonth");
    if (photoMonth) photoMonth.value = selected;
    if (reportMonthInput) reportMonthInput.value = selected;
    var review = buildReview(selected);
    if (!review) return null;
    var home = document.getElementById("monthlyReviewHome");
    var report = document.getElementById("monthlyReviewReport");
    var status = document.getElementById("monthlyReviewPhotoStatus");
    var analysis = document.getElementById("monthlyReviewPhotoAnalysis");
    if (home) home.innerHTML = summaryMarkup(review, false);
    if (report) report.innerHTML = summaryMarkup(review, true);
    if (status) status.innerHTML = confidenceMarkup(review);
    if (analysis) analysis.innerHTML = '<div class="monthlyMetricGrid">' +
      metricMarkup("体重", review.metrics.weight) + metricMarkup("体脂肪", review.metrics.bodyFat) +
      metricMarkup("腹囲", review.metrics.waist) + metricMarkup("除脂肪量", review.metrics.leanMass) +
      "</div>" + prioritiesMarkup(review) + partMarkup(review.parts) +
      '<div class="monthlyReviewNote">写真の見た目は本人・コーチが確認し、数値判定には周径・体組成・同一種目の記録を使用します。</div>';
    renderPhotoPairs(review).catch(function (error) { console.error("月次写真の読み込み", error); });
    return review;
  }

  function generateReview(month) {
    var member = memberState();
    if (!member) return null;
    var review = buildReview(month || selectedMonth());
    if (!review) return null;
    member.goalPlan = member.goalPlan || {};
    member.goalPlan.monthlyReview = review;
    if (typeof persist === "function") persist();
    renderReview(review.month);
    return review;
  }

  function applyPriorities() {
    var member = memberState();
    if (!member) return null;
    var review = buildReview(selectedMonth());
    if (!review || review.globalStop || !review.nextPriorities.length) {
      if (typeof alert === "function") alert("医療・CARE制限を確認してください。安全な重点部位を反映できません。");
      return null;
    }
    var goal = member.goalPlan = member.goalPlan || {};
    var top = review.nextPriorities.map(function (item) { return item.part; });
    goal.priority1 = top[0] || goal.priority1;
    goal.priority2 = top[1] || top[0] || goal.priority2;
    goal.priority3 = top[2] || top[1] || top[0] || goal.priority3;
    review.appliedAt = new Date().toISOString();
    goal.monthlyReview = review;
    if (member.profile) member.profile.priorityPart = top[0];
    if (member.coachPlan) {
      member.coachPlan.weeklyFocus = top.join(" / ");
      member.coachPlan.nextAction = "月次写真・身体計測の見直し｜翌月重点 " + top.join(" → ");
      member.coachPlan.updatedAt = new Date().toISOString();
    }
    try { if (typeof goalPlanLoadInputs === "function") goalPlanLoadInputs(true); } catch (_error) {}
    try { if (typeof window.generateIdealDailyPlan === "function") window.generateIdealDailyPlan({persist: false}); }
    catch (error) { console.error("翌月重点メニュー生成", error); }
    if (typeof persist === "function") persist();
    renderReview(review.month);
    return review;
  }

  function reviewText(month) {
    var review = buildReview(month || selectedMonth());
    if (!review) return "";
    return [
      "対象：" + review.month + "｜理想 " + review.idealName,
      "写真比較：" + review.matchedViews + "/3方向｜" + review.photoConfidence,
      "不足写真：" + (review.missingViews.join(" / ") || "なし"),
      "体脂肪：" + changeText(review.metrics.bodyFat.delta, "%") + "｜腹囲：" + changeText(review.metrics.waist.delta, "cm"),
      "伸びた部位：" + (review.improved.join(" / ") || "--"),
      "維持部位：" + (review.maintained.join(" / ") || "--"),
      "停滞・重点：" + (review.lagging.join(" / ") || "--"),
      "CARE / 医療制限：" + (review.restricted.join(" / ") || "なし"),
      "翌月重点TOP3：" + (review.nextPriorities.map(function (item) { return item.part; }).join(" → ") || "医療指示を優先")
    ].join("\n");
  }

  function openReview(target) {
    var section = target === "report" ? "report" : "photos";
    var tab = document.querySelector('.tab[data-tab="' + section + '"]');
    if (tab && typeof tab.click === "function") tab.click();
    renderReview(selectedMonth());
    var card = document.getElementById(section === "report" ? "monthlyReviewReportCard" : "monthlyReviewPhotoCard");
    if (card && typeof card.scrollIntoView === "function") card.scrollIntoView({behavior: "smooth", block: "start"});
  }

  window.monthlyPhotoView = photoView;
  window.monthlyPhotoViewLabel = viewLabel;
  window.buildMonthlyBodyReview = buildReview;
  window.renderMonthlyBodyReview = renderReview;
  window.generateMonthlyBodyReview = generateReview;
  window.applyMonthlyReviewPriorities = applyPriorities;
  window.monthlyReviewText = reviewText;
  window.openMonthlyReview = openReview;

  document.addEventListener("DOMContentLoaded", function () {
    if (memberState()) renderReview(currentMonth());
  });
})();
