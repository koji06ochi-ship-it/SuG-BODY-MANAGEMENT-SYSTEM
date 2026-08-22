(function () {
  "use strict";

  var PROFILES = {
    slim: {name: "SLIM", label: "スリム", range: "12〜18%", focus: ["姿勢", "肩", "後脚・臀部"]},
    athletic: {name: "ATHLETIC", label: "アスリート", range: "10〜15%", focus: ["前脚", "後脚・臀部", "背中"]},
    fitness: {name: "FITNESS", label: "フィットネス", range: "8〜13%", focus: ["肩", "胸", "背中"]},
    muscular: {name: "MUSCULAR", label: "マッスキュラー", range: "10〜15%", focus: ["胸", "肩", "腕"]},
    physique: {name: "PHYSIQUE", label: "フィジーク", range: "7〜12%", focus: ["肩", "背中", "胸"]}
  };

  function memberState() {
    try { return typeof m === "function" ? m() : null; } catch (_error) { return null; }
  }

  function selectedProfile(member) {
    var goal = member.goalPlan || {};
    return PROFILES[goal.idealVisionType] || null;
  }

  function bodyFatMidpoint(range) {
    var values = String(range || "").match(/\d+(?:\.\d+)?/g) || [];
    if (!values.length) return 0;
    return values.length > 1 ? (Number(values[0]) + Number(values[1])) / 2 : Number(values[0]);
  }

  function currentPartSets(member, part) {
    var total = 0, sessions = 0, latestAge = null;
    (member.training || []).forEach(function (row) {
      if (!row || !row.date) return;
      var age;
      try { age = dateAgeDays(row.date); } catch (_error) { return; }
      if (age < 0 || age > 6) return;
      var meta;
      try { meta = trainingMetaForRow(row); } catch (_error) { meta = {part: row.part || ""}; }
      if (meta.part !== part) return;
      var sets;
      try { sets = Number(trainingSetCount(row) || 0); } catch (_error) { sets = Number(row.sets || 0); }
      total += Math.max(0, sets);
      sessions += 1;
      if (latestAge === null || age < latestAge) latestAge = age;
    });
    return {actual: total, sessions: sessions, latestAge: latestAge};
  }

  function goalPartTarget(member, part, rank) {
    var saved = Number(member.goalPlan && member.goalPlan.lastPlan && member.goalPlan.lastPlan.sets && member.goalPlan.lastPlan.sets[part] || 0);
    if (saved > 0) return saved;
    var goal = String(member.goalPlan && member.goalPlan.goalType || member.profile && member.profile.goal || "");
    var base = goal === "健康維持" || goal === "姿勢・動作改善" ? 6 : goal === "減量" ? 8 : 10;
    return Math.max(4, Math.min(18, base + (rank === 0 ? 4 : rank === 1 ? 2 : rank === 2 ? 1 : 0)));
  }

  function medicalFor(part) {
    try { return medicalGuidanceForPart(part); } catch (_error) { return null; }
  }

  function exerciseLimit(minutes, experience) {
    var limit = minutes <= 30 ? 3 : minutes <= 60 ? 5 : 7;
    return experience === "beginner" ? Math.min(limit, 4) : limit;
  }

  function planStrategy(profile, currentFat, targetFat, gap) {
    if (!profile) return "会員設定と回復状態に合わせて基礎メニューを構成。";
    if (!currentFat) return "体脂肪と身体計測を登録すると、理想との差を数値で追跡。";
    if (gap >= 4) return "体脂肪を段階的に落としながら、重点部位の筋量と筋力を維持。";
    if (gap >= 1.5) return "重点部位を育てながら、食事と活動量で体脂肪を緩やかに調整。";
    if (gap <= -2) return "過度な減量は避け、回復と食事を確保して重点部位の筋量を育てる。";
    return "体脂肪は目標帯に近いため、重点部位の形とパフォーマンスを優先。";
  }

  function planParts(member, profile, requested, care) {
    var goal = member.goalPlan || {}, preferred = [], skipped = [];
    if (requested && requested !== "auto" && requested !== "全身") preferred.push(requested);
    [goal.priority1, goal.priority2, goal.priority3].forEach(function (part) {
      if (part && part !== "全身") preferred.push(part);
    });
    if (profile) profile.focus.forEach(function (part) { preferred.push(part); });
    var profilePart = member.profile && member.profile.priorityPart;
    if (profilePart && profilePart !== "全身") preferred.push(profilePart);
    if (!preferred.length) preferred = ["胸", "背中", "前脚"];
    preferred = preferred.filter(function (part, index, rows) {
      return !!RULE_MENU[part] && rows.indexOf(part) === index;
    });

    var accepted = [];
    preferred.forEach(function (part, index) {
      var medical = medicalFor(part);
      if (medical && (medical.trainingStatus === "stop_all" || medical.trainingStatus === "stop_area")) {
        skipped.push({part: part, reason: "医療指示により中止"});
        return;
      }
      if (care.active && care.mode === "avoid" && careAffectsFocus(care, part)) {
        skipped.push({part: part, reason: care.areaLabel + "の痛みに配慮して除外"});
        return;
      }
      var recent = currentPartSets(member, part), target = goalPartTarget(member, part, index);
      var remaining = Math.max(0, target - recent.actual);
      var score = remaining / Math.max(1, target) + Math.max(0, 3 - index) * 0.2;
      if (recent.latestAge === 0) score -= 0.45;
      else if (recent.latestAge === 1) score -= 0.15;
      accepted.push({
        part: part, rank: index, target: target, actual: recent.actual,
        remaining: remaining, latestAge: recent.latestAge, score: score,
        medicalModified: !!medical && medical.trainingStatus === "modified"
      });
    });

    if (!accepted.length && care.active && care.fallback && RULE_MENU[care.fallback]) {
      var fallbackMedical = medicalFor(care.fallback);
      if (!fallbackMedical || !["stop_all", "stop_area"].includes(fallbackMedical.trainingStatus)) {
        var fallbackRecent = currentPartSets(member, care.fallback);
        accepted.push({
          part: care.fallback, rank: 0, target: goalPartTarget(member, care.fallback, 0),
          actual: fallbackRecent.actual, remaining: Math.max(0, goalPartTarget(member, care.fallback, 0) - fallbackRecent.actual),
          latestAge: fallbackRecent.latestAge, score: 1, medicalModified: !!fallbackMedical && fallbackMedical.trainingStatus === "modified"
        });
      }
    }

    accepted.sort(function (left, right) {
      return right.score - left.score || left.rank - right.rank;
    });
    return {active: accepted.slice(0, 3), skipped: skipped};
  }

  function buildExercises(member, parts, state, care, minutes, experience) {
    var library = experience === "beginner" ? BEGINNER_RULE_MENU : RULE_MENU;
    var limit = exerciseLimit(minutes, experience);
    var sequence = [0, 1, 0, 2, 1, 0, 2, 1, 0, 2];
    var offsets = {}, used = {}, rows = [];

    sequence.forEach(function (partIndex) {
      if (rows.length >= limit || !parts[partIndex]) return;
      var part = parts[partIndex], options = library[part.part] || [];
      offsets[part.part] = offsets[part.part] || 0;
      while (offsets[part.part] < options.length && used[options[offsets[part.part]][0]]) offsets[part.part] += 1;
      var option = options[offsets[part.part]++];
      if (!option || used[option[0]]) return;
      used[option[0]] = true;

      var affected = care.active && careAffectsFocus(care, part.part);
      var localAdjusted = part.medicalModified || affected && (care.mode === "adjust" || care.mode === "return");
      var factor = Math.min(state.volume / 100, localAdjusted ? 0.6 : 1);
      var sets = Math.max(1, Math.round(Number(option[3] || 2) * factor));
      if (experience === "beginner") sets = Math.min(2, sets);
      var rir = Math.max(
        Number(option[4] || 2),
        experience === "beginner" || localAdjusted || state.volume <= 60 ? 3 : state.volume <= 80 ? 2 : 1
      );
      var last = null, next = null, target = null;
      try { last = lastTraining(option[0]); } catch (_error) {}
      try { next = nextOverload(option[0], option[2]); } catch (_error) {}
      try { target = currentTrainingTarget(option[0], option[2]); } catch (_error) {}
      rows.push({
        name: option[0], part: part.part, pof: option[1], reps: option[2], sets: sets,
        rir: rir, rest: /6-10|6-8|8-12/.test(option[2]) ? "120〜180秒" : "60〜120秒",
        help: experience === "beginner" ? BEGINNER_EXERCISE_HELP[option[0]] || "" : "",
        localAdjusted: localAdjusted, last: last ? {
          weight: Number(last.weight || 0), reps: Number(last.reps || 0),
          sets: Number(last.sets || 0), rir: Number(last.rir || 0)
        } : null,
        next: localAdjusted ? "痛みを増やさない軽負荷でフォームを確認" : String(next && next.txt || "フォームを優先して基準を作成"),
        target: localAdjusted ? "痛みなし・動作再現を優先" : String(target && target.txt || "無理のない重量で開始")
      });
    });
    return rows;
  }

  function buildPlan() {
    var member = memberState();
    if (!member) return null;
    var goal = member.goalPlan || {}, profile = selectedProfile(member);
    var state = smartRecoveryState(), care = smartCareState();
    var focusEl = document.getElementById("smartFocus");
    var requested = focusEl && focusEl.value || "auto";
    var minutesEl = document.getElementById("smartMinutes");
    var minutes = Number(minutesEl && minutesEl.value || goal.sessionMinutes || member.profile && member.profile.sessionMinutes || 60);
    var experience = member.profile && member.profile.experience || "beginner";
    var current = goalPlanCurrentMetrics();
    var targetFat = Number(goal.targetBodyFat || 0) || bodyFatMidpoint(profile && profile.range);
    var currentFat = Number(current && current.bodyFat || 0);
    var gap = currentFat && targetFat ? Math.round((currentFat - targetFat) * 10) / 10 : null;
    var listed = planParts(member, profile, requested, care);
    var medical = medicalFor("全身");
    var stopReason = "";
    if (medical && medical.trainingStatus === "stop_all") stopReason = "医療機関の運動中止指示を優先してください。";
    else if (state.volume === 0) stopReason = state.reason || "今日は回復・安全を優先してください。";
    else if (!listed.active.length) stopReason = "医療指示または痛みを避けられる部位がありません。CARE・状態確認を優先してください。";
    var rows = stopReason ? [] : buildExercises(member, listed.active, state, care, minutes, experience);
    if (!stopReason && !rows.length) stopReason = "安全に実施できる種目を確認してから再評価してください。";

    return {
      version: "26.5.21", date: today(), createdAt: new Date().toISOString(),
      idealType: goal.idealVisionType || "", idealName: profile ? profile.name : "未選択",
      idealLabel: profile ? profile.label : "会員設定", idealRange: profile ? profile.range : "",
      currentBodyFat: currentFat || null, targetBodyFat: targetFat || null, bodyFatGap: gap,
      strategy: planStrategy(profile, currentFat, targetFat, gap),
      status: stopReason ? "RECOVERY_FIRST" : care.active && care.mode === "avoid" ? "CARE_ADJUST" : state.volume < 100 ? "LOAD_ADJUST" : "READY",
      stopReason: stopReason, recoveryLabel: state.label, recoveryReason: state.reason,
      volume: Number(state.volume || 0), minutes: minutes, experience: experience,
      goal: goal.goalType || member.profile && member.profile.goal || "筋肥大",
      care: care.active ? {area: care.areaLabel, mode: care.mode, before: care.painBefore, after: care.painAfter} : null,
      priorities: listed.active, skipped: listed.skipped, exercises: rows
    };
  }

  function gapMarkup(plan) {
    var current = plan.currentBodyFat ? plan.currentBodyFat.toFixed(1) + "%" : "未記録";
    var target = plan.idealRange || (plan.targetBodyFat ? plan.targetBodyFat.toFixed(1) + "%" : "未設定");
    var delta = plan.bodyFatGap === null ? "" : "｜差 " + (plan.bodyFatGap > 0 ? "+" : "") + plan.bodyFatGap.toFixed(1) + "pt";
    return '<div class="idealTodayGap"><b>' + esc(plan.idealName) + "｜現在 " + esc(current) + " → 理想 " + esc(target) + esc(delta) +
      '</b><small>' + esc(plan.strategy) + '</small></div>';
  }

  function priorityMarkup(plan) {
    if (!plan.priorities.length) return "";
    return '<div class="idealTodayPriorities">' + plan.priorities.map(function (item, index) {
      return '<span class="idealTodayPriority">重点' + (index + 1) + " " + esc(item.part) +
        ' <small>今週 ' + item.actual + "/" + item.target + " SET</small></span>";
    }).join("") + "</div>";
  }

  function dashboardMarkup(plan) {
    var head = gapMarkup(plan) + priorityMarkup(plan);
    if (plan.stopReason) return head + '<div class="idealTodayStop"><b>今日はトレーニングより回復を優先</b><br>' + esc(plan.stopReason) + "</div>";
    var rows = plan.exercises.slice(0, 4).map(function (row, index) {
      return '<div class="idealTodayExercise"><span class="idealTodayNo">' + (index + 1) +
        '</span><div><strong>' + esc(row.name) + '</strong><small>' + esc(row.part) + "｜" +
        esc(row.reps) + 'rep｜RIR ' + row.rir + '</small></div><span class="idealTodaySets">' + row.sets + ' SET</span></div>';
    }).join("");
    var more = plan.exercises.length > 4 ? "｜ほか " + (plan.exercises.length - 4) + " 種目" : "";
    var care = plan.care ? "｜CARE " + plan.care.area + " " + plan.care.before + "→" + plan.care.after + "/10" : "";
    return head + '<div class="idealTodayExercises">' + rows + '</div><div class="idealTodayMeta">' +
      esc(plan.minutes + "分｜回復 " + plan.recoveryLabel + "｜推奨ボリューム " + plan.volume + "%" + care + more) + "</div>";
  }

  function smartMarkup(plan) {
    var summary = document.getElementById("idealAutoPlanSummary");
    if (summary) {
      summary.innerHTML = gapMarkup(plan) + priorityMarkup(plan) + (plan.skipped.length ?
        '<div class="idealTodayMeta">安全調整：' + plan.skipped.map(function (item) {
          return esc(item.part + "＝" + item.reason);
        }).join("｜") + "</div>" : "");
    }
    var box = document.getElementById("smartMenuView");
    if (!box) return;
    if (plan.stopReason) {
      box.innerHTML = '<div class="smartWarn"><b>今日は高負荷メニューを生成しません。</b><br>' + esc(plan.stopReason) + "</div>";
      return;
    }
    var careNotice = plan.care ? '<div class="' + (plan.care.mode === "avoid" ? "smartWarn" : "notice") +
      '"><b>CARE連携｜' + esc(plan.care.area) + " " + plan.care.before + "→" + plan.care.after +
      '/10</b><br>' + esc(plan.skipped.length ? plan.skipped.map(function (item) {
        return item.part + "を除外";
      }).join(" / ") + "して安全な部位に変更。" : "症状のある部位はSET・RIRを調整。") + "</div>" : "";
    var notice = '<div class="notice">' + esc(plan.priorities.map(function (item) { return item.part; }).join(" + ")) +
      "｜" + plan.minutes + "分｜" + esc(plan.goal) + "｜推奨ボリューム " + plan.volume + "%</div>";
    box.innerHTML = careNotice + notice + plan.exercises.map(function (row) {
      var last = row.last ? "｜前回 " + row.last.weight + "kg × " + row.last.reps + "rep × " + row.last.sets + "set / RIR " + row.last.rir : "｜初回はフォーム優先";
      var help = row.help ? '<div class="smartPlanCue"><b>何をする？</b> ' + esc(row.help) + "</div>" : "";
      var action = plan.experience === "beginner" ?
        '<button class="secondary" type="button" style="width:100%;margin-top:7px" onclick="loadBeginnerExerciseToRecord(decodeURIComponent(\'' +
        encodeURIComponent(row.name) + '\'))">この種目を記録する</button>' :
        '<div class="smartPlanCue">次回方針：' + esc(row.next) + "</div>";
      return '<div class="smartPlanItem"><div class="smartPlanItemTop"><strong>' + esc(row.name) +
        '</strong><span class="badge">' + esc(row.part + "｜" + row.pof) + "</span></div>" + help +
        '<div class="smartPlanMeta">' + esc(row.reps) + "rep × " + row.sets + "set｜RIR " + row.rir +
        "｜REST " + esc(row.rest) + esc(last) + '</div><div class="smartPlanCue">' + esc(row.target) + "</div>" + action + "</div>";
    }).join("");
  }

  function renderPlan(existing) {
    var member = memberState();
    if (!member) return null;
    var plan = existing || buildPlan();
    if (!plan) return null;
    var dashboard = document.getElementById("idealTodayDashboard");
    if (dashboard) dashboard.innerHTML = dashboardMarkup(plan);
    smartMarkup(plan);
    return plan;
  }

  function generatePlan(options) {
    var member = memberState();
    if (!member) return null;
    var plan = buildPlan();
    if (!plan) return null;
    member.goalPlan = member.goalPlan || {};
    member.goalPlan.dailyPlan = plan;
    renderPlan(plan);
    if (!options || options.persist !== false) persist();
    return plan;
  }

  window.buildIdealDailyPlan = buildPlan;
  window.renderIdealDailyPlan = renderPlan;
  window.generateIdealDailyPlan = generatePlan;
  window.__SUG_IDEAL_DAILY_PROFILES__ = PROFILES;

  document.addEventListener("DOMContentLoaded", function () {
    if (memberState()) renderPlan();
  });
})();
