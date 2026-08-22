(function () {
  "use strict";

  var VERSION = "26.5.23";
  var BODY_PARTS = ["肩", "背中", "胸", "腕", "前脚", "後脚・臀部", "姿勢"];
  var selectedWeek = 0;

  function memberState() {
    try { return typeof m === "function" ? m() : null; } catch (_error) { return null; }
  }

  function html(value) {
    if (typeof esc === "function") return esc(value);
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[character];
    });
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value || minimum)));
  }

  function nextMonth(month) {
    var value = /^\d{4}-\d{2}$/.test(String(month || "")) ? String(month) :
      (typeof today === "function" ? today().slice(0, 7) : new Date().toISOString().slice(0, 7));
    return new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)), 1)).toISOString().slice(0, 7);
  }

  function shiftDate(date, days) {
    return new Date(Date.parse(date + "T12:00:00Z") + days * 86400000).toISOString().slice(0, 10);
  }

  function currentRecovery() {
    try {
      var state = typeof smartRecoveryState === "function" ? smartRecoveryState() : null;
      return state || {volume: 80, label: "データ確認", reason: "回復記録を確認"};
    } catch (_error) {
      return {volume: 80, label: "データ確認", reason: "回復記録を確認"};
    }
  }

  function currentCare() {
    try { return typeof smartCareState === "function" ? smartCareState() : {active: false, mode: "none"}; }
    catch (_error) { return {active: false, mode: "none"}; }
  }

  function medicalFor(part) {
    try { return typeof medicalGuidanceForPart === "function" ? medicalGuidanceForPart(part) : null; }
    catch (_error) { return null; }
  }

  function careAffects(care, part) {
    if (!care || !care.active) return false;
    try {
      return typeof careAffectsFocus === "function" ? !!careAffectsFocus(care, part) :
        (care.conflicts || []).indexOf(part) >= 0;
    } catch (_error) {
      return (care.conflicts || []).indexOf(part) >= 0;
    }
  }

  function partSafety(part, care) {
    var medical = medicalFor(part);
    var stop = !!(medical && /^stop/.test(String(medical.trainingStatus || "")));
    var avoid = !!(care && care.mode === "avoid" && careAffects(care, part));
    return {
      part: part,
      blocked: stop || avoid,
      modified: !!(medical && medical.trainingStatus === "modified") ||
        !!(care && (care.mode === "adjust" || care.mode === "return") && careAffects(care, part)),
      reason: stop ? "医療機関の指示" : avoid ? "CARE｜" + (care.areaLabel || part) : ""
    };
  }

  function monthlyReview(options, member) {
    if (options && options.review) return options.review;
    try {
      if (typeof window.buildMonthlyBodyReview === "function") {
        var live = window.buildMonthlyBodyReview();
        if (live) return live;
      }
    } catch (_error) {}
    return member.goalPlan && member.goalPlan.monthlyReview || null;
  }

  function resolveFocus(member, review, care) {
    var goal = member.goalPlan || {};
    var profiles = window.__SUG_IDEAL_DAILY_PROFILES__ || {};
    var profile = profiles[goal.idealVisionType] || null;
    var desired = [];
    if (review && review.nextPriorities) {
      review.nextPriorities.forEach(function (item) {
        if (item && item.part) desired.push(item.part);
      });
    }
    [goal.priority1, goal.priority2, goal.priority3].forEach(function (part) {
      if (part) desired.push(part);
    });
    if (profile) profile.focus.forEach(function (part) { desired.push(part); });
    if (care.active && care.fallback && care.fallback !== "全身") desired.push(care.fallback);
    BODY_PARTS.forEach(function (part) { desired.push(part); });
    var blocked = [];
    var accepted = [];
    desired.forEach(function (part) {
      if (!part || part === "全身" || accepted.indexOf(part) >= 0 ||
        blocked.some(function (item) { return item.part === part; })) return;
      var library = typeof RULE_MENU !== "undefined" ? RULE_MENU : {};
      if (!library[part]) return;
      var safety = partSafety(part, care);
      if (safety.blocked) {
        blocked.push({part: part, reason: safety.reason});
        return;
      }
      accepted.push(part);
    });
    return {priorities: accepted.slice(0, 3), safeParts: accepted, blocked: blocked, profile: profile};
  }

  function configuration(member, options) {
    var goal = member.goalPlan || {};
    var profile = member.profile || {};
    var frequencyControl = document.getElementById("fourWeekFrequency");
    var minutesControl = document.getElementById("fourWeekMinutes");
    var requestedFrequency = options && options.frequency ||
      (frequencyControl && frequencyControl.dataset && frequencyControl.dataset.userChanged === "1" ? frequencyControl.value : 0) ||
      goal.trainingDays || profile.trainingDays || 4;
    var requestedMinutes = options && options.minutes ||
      (minutesControl && minutesControl.dataset && minutesControl.dataset.userChanged === "1" ? minutesControl.value : 0) ||
      goal.sessionMinutes || profile.sessionMinutes || 60;
    var experience = profile.experience || "beginner";
    var frequency = clamp(Math.round(Number(requestedFrequency || 4)), 1, experience === "beginner" ? 4 : 6);
    var rawMinutes = Number(requestedMinutes || 60);
    var minutes = rawMinutes <= 30 ? 30 : rawMinutes <= 60 ? 60 : 90;
    return {
      frequency: frequency,
      requestedFrequency: Number(requestedFrequency || frequency),
      minutes: minutes,
      experience: experience,
      goal: goal.goalType || profile.goal || "筋肥大",
      maxExercises: experience === "beginner" ?
        Math.min(minutes <= 30 ? 3 : minutes <= 60 ? 4 : 5, 5) :
        minutes <= 30 ? 3 : minutes <= 60 ? 5 : 7,
      maxParts: experience === "beginner" ? 2 : minutes <= 30 ? 2 : minutes <= 60 ? 3 : 4
    };
  }

  function baselineTarget(member, part, rank, config, care) {
    var saved = Number(member.goalPlan && member.goalPlan.lastPlan &&
      member.goalPlan.lastPlan.sets && member.goalPlan.lastPlan.sets[part] || 0);
    var base = config.goal === "健康維持" || config.goal === "姿勢・動作改善" ? 6 :
      config.goal === "減量" ? 8 : 10;
    if (rank === 0) base += 4;
    else if (rank === 1) base += 2;
    else if (rank === 2) base += 1;
    if (saved > 0) base = saved;
    try {
      if (typeof responseSweetSpot === "function") {
        var observed = responseSweetSpot(part);
        if (observed && observed.ready) {
          var low = Math.max(4, Math.round(Number(observed.min || 0)));
          var high = Math.max(low, Math.round(Number(observed.max || low)));
          base = rank === 0 ? Math.min(high, Math.max(low, base)) :
            rank >= 0 ? Math.round((low + Math.min(high, base)) / 2) : low;
        }
      }
    } catch (_error) {}
    if (rank < 0) base = config.experience === "beginner" ? 4 : Math.min(base, 6);
    if (config.experience === "beginner") base = Math.min(base, rank >= 0 ? 9 : 5);
    var safety = partSafety(part, care);
    if (safety.blocked) return 0;
    if (safety.modified) base = Math.min(base, 6);
    return clamp(Math.round(base), 3, config.experience === "beginner" ? 10 : 18);
  }

  function sortParts(parts, priorities) {
    return parts.slice().sort(function (left, right) {
      var l = priorities.indexOf(left), r = priorities.indexOf(right);
      return (l < 0 ? 8 : l) - (r < 0 ? 8 : r);
    });
  }

  function scheduleParts(config, focus) {
    var template;
    try {
      template = typeof goalPlanTemplate === "function" ?
        goalPlanTemplate(config.frequency, focus.priorities) : null;
    } catch (_error) { template = null; }
    if (!Array.isArray(template) || !template.length) {
      template = Array.from({length: config.frequency}, function (_value, day) {
        return [focus.priorities[day % focus.priorities.length], focus.priorities[(day + 1) % focus.priorities.length]];
      });
    }
    var days = Array.from({length: config.frequency}, function (_unused, index) {
      var raw = template[index] || [];
      if (raw.indexOf("全身") >= 0) raw = focus.priorities.concat(focus.safeParts.slice(3, 5));
      return sortParts(raw.filter(function (part, position, rows) {
        return focus.safeParts.indexOf(part) >= 0 && rows.indexOf(part) === position;
      }), focus.priorities).slice(0, config.maxParts);
    });
    focus.priorities.forEach(function (part, rank) {
      var wanted = rank === 0 && config.frequency >= 3 ? 2 :
        rank === 1 && config.frequency >= 4 ? 2 : 1;
      var count = days.filter(function (day) { return day.indexOf(part) >= 0; }).length;
      while (count < wanted) {
        var candidates = days.map(function (parts, index) {
          if (parts.indexOf(part) >= 0) return null;
          var replace = parts.length >= config.maxParts;
          var removable = replace ? parts.filter(function (existing) {
            return focus.priorities.indexOf(existing) < 0 ||
              days.filter(function (day) { return day.indexOf(existing) >= 0; }).length > 1;
          }).at(-1) : null;
          if (replace && !removable) return null;
          return {index: index, replace: removable, size: parts.length};
        }).filter(Boolean).sort(function (a, b) { return a.size - b.size || a.index - b.index; });
        if (!candidates.length) break;
        var chosen = days[candidates[0].index];
        if (candidates[0].replace) chosen.splice(chosen.indexOf(candidates[0].replace), 1);
        chosen.push(part);
        days[candidates[0].index] = sortParts(chosen, focus.priorities);
        count += 1;
      }
    });
    days.forEach(function (parts, index) {
      if (!parts.length && focus.priorities.length) {
        parts.push(focus.priorities[index % focus.priorities.length]);
      }
    });
    return days;
  }

  function phases(recovery, review, config) {
    var recoveryVolume = clamp(Number(recovery.volume == null ? 80 : recovery.volume), 0, 100);
    var reduced = recoveryVolume <= 60;
    var noBaseline = !review || !(review.parts || []).some(function (part) {
      return part.metricDelta !== null || part.comparableExercises > 0;
    });
    var reviewRecoveryLow = !!(review && review.recovery && review.recovery.score !== null &&
      review.recovery.score !== undefined && Number(review.recovery.score) < 65);
    var needsDeload = reduced || reviewRecoveryLow || config.experience === "beginner";
    var factor = recoveryVolume < 100 ? Math.max(0.55, recoveryVolume / 100) : 1;
    return [
      {number: 1, key: "BASE", label: "基準づくり", detail: "フォーム・REST・RIRの条件をそろえる", factor: 0.85 * factor, rir: config.experience === "beginner" ? 3 : 2},
      {number: 2, key: "BUILD", label: "反復を積む", detail: noBaseline ? "同条件の記録を増やす" : "同じ種目・RESTでREPを確認", factor: 0.98 * factor, rir: config.experience === "beginner" ? 3 : 2},
      {number: 3, key: "PROGRESS", label: "重点を伸ばす", detail: reduced || noBaseline ? "増量を急がず反応を確認" : "回復良好なら重点部位を微増", factor: (reduced || noBaseline || config.experience === "beginner" ? 1 : 1.1) * factor, rir: config.experience === "beginner" || reduced ? 3 : 1},
      {
        number: 4,
        key: needsDeload ? "DELOAD" : "REVIEW",
        label: needsDeload ? "回復・調整" : "再評価・次月準備",
        detail: needsDeload ? "SETを落として疲労・痛み・フォームを確認" : "体型写真・周径・e1RMを再評価",
        factor: (needsDeload ? 0.62 : 0.9) * factor,
        rir: needsDeload ? 4 : 2
      }
    ];
  }

  function exerciseBlocked(name, part, care) {
    var involved = [part];
    try {
      if (typeof inferSecondaryParts === "function") {
        inferSecondaryParts(name, part).forEach(function (other) {
          if (involved.indexOf(other) < 0) involved.push(other);
        });
      }
    } catch (_error) {}
    return involved.some(function (affected) {
      return partSafety(affected, care).blocked;
    });
  }

  function availableRows(part, config, care) {
    var standard = typeof RULE_MENU !== "undefined" ? RULE_MENU : {};
    var basic = typeof BEGINNER_RULE_MENU !== "undefined" ? BEGINNER_RULE_MENU : standard;
    var rows = (config.experience === "beginner" ? basic[part] : standard[part]) || [];
    return rows.filter(function (row) {
      return row && row[0] && !exerciseBlocked(row[0], part, care);
    });
  }

  function restSeconds(repRange, experience, modified) {
    var lower = Number(String(repRange || "").match(/\d+/)?.[0] || 12);
    if (modified) return lower <= 8 ? 150 : 90;
    if (lower <= 8) return experience === "beginner" ? 150 : 180;
    if (lower <= 12) return 120;
    return 75;
  }

  function distributeSets(total, count, position, cap) {
    var base = Math.floor(total / count);
    var remainder = total % count;
    return Math.max(1, Math.min(cap, base + (position < remainder ? 1 : 0)));
  }

  function buildSession(member, config, focus, care, phase, weekIndex, dayIndex, parts, counts, targets, offsets, start) {
    var eligible = parts.filter(function (part) {
      return !partSafety(part, care).blocked && availableRows(part, config, care).length;
    });
    var allocation = eligible.map(function (part) {
      var occurrence = Math.max(1, counts[part] || 1);
      var weekly = Math.max(1, Math.round(targets[part] * phase.factor));
      var order = offsets[part] || 0;
      var perDay = Math.max(1, Math.floor(weekly / occurrence) + (order < weekly % occurrence ? 1 : 0));
      offsets[part] = order + 1;
      return {part: part, total: perDay, slots: 1};
    });
    var remaining = Math.max(0, config.maxExercises - allocation.length);
    while (remaining > 0) {
      var candidates = allocation.filter(function (item) {
        return item.total > item.slots * (config.experience === "beginner" ? 2 : 3) &&
          availableRows(item.part, config, care).length > item.slots;
      }).sort(function (a, b) {
        var left = focus.priorities.indexOf(a.part);
        var right = focus.priorities.indexOf(b.part);
        return (left < 0 ? 9 : left) - (right < 0 ? 9 : right);
      });
      if (!candidates.length) break;
      candidates[0].slots += 1;
      remaining -= 1;
    }
    var used = {};
    var exercises = [];
    allocation.forEach(function (item) {
      var rows = availableRows(item.part, config, care);
      var safety = partSafety(item.part, care);
      var maxSet = config.experience === "beginner" || safety.modified ? 2 : 4;
      for (var slot = 0; slot < item.slots && exercises.length < config.maxExercises; slot += 1) {
        var position = (dayIndex + slot) % rows.length;
        var row = rows[position];
        var retry = 0;
        while (used[row[0]] && retry < rows.length) {
          position = (position + 1) % rows.length;
          row = rows[position];
          retry += 1;
        }
        if (!row || used[row[0]]) continue;
        used[row[0]] = true;
        var rest = restSeconds(row[2], config.experience, safety.modified);
        var rir = Math.max(Number(row[4] || 2), phase.rir, safety.modified ? 3 : 1, config.experience === "beginner" ? 3 : 1);
        var sets = distributeSets(item.total, item.slots, slot, maxSet);
        var cue = phase.key === "BASE" ? "フォーム・RIR・RESTを基準化" :
          phase.key === "BUILD" ? "同重量・同RESTでREPを確認" :
          phase.key === "PROGRESS" ? "痛みなし・RIR確保ならREPまたは負荷を微調整" :
          phase.key === "DELOAD" ? "負荷を抑え、疲労・痛み・可動域を確認" :
          "写真・周径・同一種目e1RMを再確認";
        if (safety.modified) cue = "医療・CARE指示を優先し、痛みの出ない軽負荷";
        exercises.push({
          name: row[0],
          part: item.part,
          pof: row[1],
          reps: row[2],
          sets: sets,
          rir: rir,
          restSeconds: rest,
          rest: rest + "秒",
          modified: safety.modified,
          cue: cue,
          help: config.experience === "beginner" && typeof BEGINNER_EXERCISE_HELP !== "undefined" ?
            BEGINNER_EXERCISE_HELP[row[0]] || "" : ""
        });
      }
    });
    var date = shiftDate(start, weekIndex * 7 + Math.floor(dayIndex * 7 / config.frequency));
    return {
      day: dayIndex + 1,
      date: date,
      label: "DAY " + (dayIndex + 1),
      parts: Array.from(new Set(exercises.map(function (exercise) { return exercise.part; }))),
      exercises: exercises,
      totalSets: exercises.reduce(function (sum, exercise) { return sum + exercise.sets; }, 0)
    };
  }

  function buildWeeks(member, config, focus, care, recovery, review, month) {
    var pattern = scheduleParts(config, focus);
    var counts = {};
    pattern.forEach(function (parts) {
      parts.forEach(function (part) { counts[part] = Number(counts[part] || 0) + 1; });
    });
    var targets = {};
    Object.keys(counts).forEach(function (part) {
      targets[part] = baselineTarget(member, part, focus.priorities.indexOf(part), config, care);
    });
    var start = month + "-01";
    return phases(recovery, review, config).map(function (phase, index) {
      var offsets = {};
      var sessions = pattern.map(function (parts, day) {
        return buildSession(member, config, focus, care, phase, index, day, parts, counts, targets, offsets, start);
      }).filter(function (session) { return session.exercises.length > 0; });
      var partSets = {};
      sessions.forEach(function (session) {
        session.exercises.forEach(function (exercise) {
          partSets[exercise.part] = Number(partSets[exercise.part] || 0) + exercise.sets;
        });
      });
      return {
        number: phase.number,
        key: phase.key,
        label: phase.label,
        detail: phase.detail,
        startDate: shiftDate(start, index * 7),
        endDate: shiftDate(start, index * 7 + 6),
        volumeFactor: Math.round(phase.factor * 100),
        rir: phase.rir,
        sessions: sessions,
        partSets: partSets,
        totalSets: sessions.reduce(function (sum, session) { return sum + session.totalSets; }, 0)
      };
    });
  }

  function buildProgram(options) {
    var member = memberState();
    if (!member) return null;
    var config = configuration(member, options || {});
    var care = currentCare();
    var recovery = currentRecovery();
    var review = monthlyReview(options || {}, member);
    var focus = resolveFocus(member, review, care);
    var medical = medicalFor("全身");
    var medicalStop = !!(medical && medical.trainingStatus === "stop_all") || !!(review && review.globalStop);
    var recoveryStop = Number(recovery.volume) <= 0;
    var stopReason = medicalStop ? "医療機関の運動中止指示を優先してください。" :
      recoveryStop ? "今日は回復を優先。痛み・睡眠・体調を再評価してから再生成してください。" :
      !focus.priorities.length ? "医療・CARE制限を避けられる部位がありません。" : "";
    var month = nextMonth(review && review.month || (typeof today === "function" ? today().slice(0, 7) : ""));
    var weeks = stopReason ? [] : buildWeeks(member, config, focus, care, recovery, review, month);
    var totalSessions = weeks.reduce(function (sum, week) { return sum + week.sessions.length; }, 0);
    return {
      version: VERSION,
      createdAt: new Date().toISOString(),
      month: month,
      sourceMonth: review && review.month || "",
      idealType: member.goalPlan && member.goalPlan.idealVisionType || "",
      idealName: focus.profile ? focus.profile.name : "理想タイプ未選択",
      goal: config.goal,
      experience: config.experience,
      frequency: config.frequency,
      requestedFrequency: config.requestedFrequency,
      minutes: config.minutes,
      priorities: focus.priorities,
      blocked: focus.blocked,
      photoConfidence: review && review.photoConfidence || "DATA_LOW",
      status: stopReason ? medicalStop ? "MEDICAL_STOP" : "RECOVERY_FIRST" :
        care.active && care.mode === "avoid" ? "CARE_ADJUST" :
        Number(recovery.volume) < 100 ? "RECOVERY_ADJUST" : "READY",
      stopReason: stopReason,
      recovery: {volume: Number(recovery.volume || 0), label: recovery.label || "", reason: recovery.reason || ""},
      care: care.active ? {mode: care.mode, area: care.areaLabel || "", detail: care.detail || ""} : null,
      weeks: weeks,
      totalSessions: totalSessions,
      totalSets: weeks.reduce(function (sum, week) { return sum + week.totalSets; }, 0)
    };
  }

  function focusMarkup(program) {
    return '<div class="fourWeekFocus">' + program.priorities.map(function (part, index) {
      return "<span>#" + (index + 1) + " " + html(part) + "</span>";
    }).join("") + "</div>";
  }

  function kpis(program) {
    return '<div class="fourWeekSummary">' +
      '<div class="fourWeekKpi"><span>対象月</span><strong>' + html(program.month) + "</strong><small>" + html(program.idealName) + "</small></div>" +
      '<div class="fourWeekKpi"><span>週トレ回数</span><strong>' + program.frequency + "回</strong><small>" + program.minutes + "分 / 回</small></div>" +
      '<div class="fourWeekKpi"><span>４週間</span><strong>' + program.totalSessions + " SESSION</strong><small>" + program.totalSets + " SET</small></div>" +
      '<div class="fourWeekKpi"><span>判定</span><strong>' + html(program.status) + "</strong><small>写真 " + html(program.photoConfidence) + "</small></div></div>";
  }

  function warningMarkup(program) {
    if (program.stopReason) return '<div class="fourWeekNotice warning">' + html(program.stopReason) + "</div>";
    var notices = [];
    if (program.blocked.length) {
      notices.push("除外：" + program.blocked.map(function (item) {
        return item.part + "（" + item.reason + "）";
      }).join(" / "));
    }
    if (program.experience === "beginner" && program.requestedFrequency > program.frequency) {
      notices.push("初心者は週" + program.frequency + "回までに調整");
    }
    if (program.recovery.volume < 100) {
      notices.push("回復 " + program.recovery.volume + "%｜" + program.recovery.reason);
    }
    return notices.length ? '<div class="fourWeekNotice">' + html(notices.join("｜")) + "</div>" : "";
  }

  function phaseMarkup(program, compact) {
    if (!program.weeks.length) return "";
    return '<div class="fourWeekPhaseGrid">' + program.weeks.map(function (week, index) {
      var active = index === selectedWeek ? " active" : "";
      return '<div class="fourWeekPhase' + active + '"><b>WEEK ' + week.number + "</b><strong>" +
        html(week.label) + "</strong><small>" + html(compact ? week.totalSets + " SET / " +
        week.sessions.length + "回" : week.detail) + "</small></div>";
    }).join("") + "</div>";
  }

  function sessionMarkup(program, weekIndex, session) {
    var rows = session.exercises.map(function (exercise, index) {
      return '<div class="fourWeekExercise"><span class="fourWeekNo">' + (index + 1) +
        '</span><div><strong>' + html(exercise.name) + "</strong><small>" +
        html(exercise.part + "｜" + exercise.pof + (exercise.help ? "｜" + exercise.help : "")) +
        "<br>" + html(exercise.cue) + '</small></div><div class="fourWeekDose">' +
        exercise.sets + " SET<small>" + html(exercise.reps + " REP") +
        "</small><small>RIR " + exercise.rir + "｜" + exercise.restSeconds + "秒</small></div></div>";
    }).join("");
    return '<div class="fourWeekDay"><div class="fourWeekDayHead"><div><b>' + html(session.label) +
      "</b><small>" + html(session.date + "｜" + session.parts.join(" / ")) +
      '</small></div><span class="badge">' + session.totalSets + " SET</span></div>" + rows +
      '<button class="secondary" type="button" style="width:100%;margin-top:8px" onclick="loadFourWeekSession(' +
      weekIndex + "," + (session.day - 1) + ')">このDAYをトレーニング記録へ</button></div>';
  }

  function tabsMarkup(program) {
    return program.weeks.map(function (week, index) {
      return '<button class="fourWeekTab' + (index === selectedWeek ? " active" : "") +
        '" type="button" onclick="selectFourWeekWeek(' + index + ')">WEEK ' + week.number + "</button>";
    }).join("");
  }

  function renderProgram(existing) {
    var member = memberState();
    if (!member) return null;
    var program = existing || member.goalPlan && member.goalPlan.fourWeekProgram || null;
    var frequencyControl = document.getElementById("fourWeekFrequency");
    var minutesControl = document.getElementById("fourWeekMinutes");
    var goal = member.goalPlan || {};
    if (frequencyControl && (!frequencyControl.dataset || frequencyControl.dataset.userChanged !== "1")) {
      frequencyControl.value = String(program && program.frequency || goal.trainingDays || member.profile && member.profile.trainingDays || 4);
    }
    if (minutesControl && (!minutesControl.dataset || minutesControl.dataset.userChanged !== "1")) {
      minutesControl.value = String(program && program.minutes || goal.sessionMinutes || member.profile && member.profile.sessionMinutes || 60);
    }
    if (!program) return null;
    selectedWeek = Math.min(Math.max(0, selectedWeek), Math.max(0, program.weeks.length - 1));
    var home = document.getElementById("fourWeekHomeSummary");
    var summary = document.getElementById("fourWeekProgramSummary");
    var report = document.getElementById("fourWeekReportSummary");
    var overview = document.getElementById("fourWeekPhaseOverview");
    var tabs = document.getElementById("fourWeekWeekTabs");
    var detail = document.getElementById("fourWeekWeekDetail");
    var brief = kpis(program) + focusMarkup(program) + warningMarkup(program);
    if (home) home.innerHTML = brief + phaseMarkup(program, true);
    if (summary) summary.innerHTML = brief;
    if (report) report.innerHTML = brief + phaseMarkup(program, true);
    if (overview) overview.innerHTML = phaseMarkup(program, false);
    if (tabs) tabs.innerHTML = tabsMarkup(program);
    if (detail) {
      var week = program.weeks[selectedWeek];
      detail.innerHTML = week ? '<div class="fourWeekNotice"><b>WEEK ' + week.number + "｜" +
        html(week.label) + "</b><br>" + html(week.detail + "｜RIR " + week.rir +
        "以上｜" + week.totalSets + " SET") + "</div>" + week.sessions.map(function (session) {
        return sessionMarkup(program, selectedWeek, session);
      }).join("") : "";
    }
    return program;
  }

  function generateProgram(options) {
    var member = memberState();
    if (!member) return null;
    var program = buildProgram(options || {});
    if (!program) return null;
    member.goalPlan = member.goalPlan || {};
    member.goalPlan.fourWeekProgram = program;
    if (!program.stopReason && program.priorities.length) {
      member.goalPlan.priority1 = program.priorities[0] || member.goalPlan.priority1;
      member.goalPlan.priority2 = program.priorities[1] || member.goalPlan.priority2;
      member.goalPlan.priority3 = program.priorities[2] || member.goalPlan.priority3;
      member.goalPlan.trainingDays = program.frequency;
      member.goalPlan.sessionMinutes = program.minutes;
      if (member.profile) {
        member.profile.priorityPart = program.priorities[0];
        member.profile.trainingDays = program.frequency;
        member.profile.sessionMinutes = program.minutes;
      }
      if (member.coachPlan) {
        member.coachPlan.weeklyFocus = program.priorities.join(" / ");
        member.coachPlan.nextAction = program.month + "｜４週間プログラム WEEK1 " +
          (program.weeks[0] && program.weeks[0].label || "");
        member.coachPlan.targetTrainingDays = program.frequency;
        member.coachPlan.updatedAt = new Date().toISOString();
      }
      try { if (typeof goalPlanLoadInputs === "function") goalPlanLoadInputs(true); } catch (_error) {}
      try {
        if (typeof window.generateIdealDailyPlan === "function") window.generateIdealDailyPlan({persist: false});
      } catch (error) { console.error("４週間プログラム｜今日のメニュー連携", error); }
    }
    if (!options || options.persist !== false) {
      if (typeof persist === "function") persist();
    }
    renderProgram(program);
    return program;
  }

  function selectWeek(index) {
    selectedWeek = Math.max(0, Math.min(3, Number(index || 0)));
    return renderProgram();
  }

  function loadSession(weekIndex, dayIndex) {
    var member = memberState();
    var program = member && member.goalPlan && member.goalPlan.fourWeekProgram;
    var week = program && program.weeks[Number(weekIndex)];
    var session = week && week.sessions.find(function (item) { return item.day === Number(dayIndex) + 1; });
    if (!session) return null;
    var recovery = currentRecovery();
    var medical = medicalFor("全身");
    if (Number(recovery.volume) <= 0 || medical && medical.trainingStatus === "stop_all") {
      if (typeof alert === "function") alert("今日は医療指示・回復状態を優先し、トレーニングを読み込みません。");
      return null;
    }
    var care = currentCare();
    var safe = session.exercises.filter(function (exercise) {
      return !partSafety(exercise.part, care).blocked && !exerciseBlocked(exercise.name, exercise.part, care);
    });
    if (!safe.length) {
      if (typeof alert === "function") alert("CARE・医療指示を避けられる種目がありません。");
      return null;
    }
    var queue = safe.map(function (exercise) {
      var previous = null;
      try { if (typeof lastTraining === "function") previous = lastTraining(exercise.name); } catch (_error) {}
      var reps = Number(String(exercise.reps || "").match(/\d+/)?.[0] || 10);
      var safety = partSafety(exercise.part, care);
      return {
        exercise: exercise.name,
        part: exercise.part,
        pof: exercise.pof,
        setMethod: "straight",
        setGroup: "",
        weight: Number(previous && previous.weight || 0),
        reps: reps,
        sets: safety.modified ? Math.min(2, exercise.sets) : exercise.sets,
        rir: Math.max(exercise.rir, safety.modified ? 3 : 1),
        plannedRestSec: exercise.restSeconds,
        setDetails: [],
        memo: ""
      };
    });
    try {
      if (typeof trainingSessionQueue !== "undefined") trainingSessionQueue = queue;
      if (typeof trainingQueueCursor !== "undefined") trainingQueueCursor = 0;
      if (typeof trainingQueueLabel !== "undefined") trainingQueueLabel = "４週間プラン｜WEEK " +
        week.number + " / " + session.label;
      if (queue.length && typeof applyTrainingTemplate === "function") applyTrainingTemplate(queue[0]);
      if (typeof renderTrainingQueue === "function") renderTrainingQueue();
      var tab = document.querySelector('.tab[data-tab="training"]');
      if (tab && typeof tab.click === "function") tab.click();
      if (queue.length && typeof applyTrainingTemplate === "function") applyTrainingTemplate(queue[0]);
      if (typeof renderTrainingQueue === "function") renderTrainingQueue();
    } catch (error) {
      console.error("４週間プログラム｜SESSION読込", error);
      if (typeof alert === "function") alert("トレーニング記録を開けませんでした。");
      return null;
    }
    return {week: week.number, day: session.day, exercises: queue, skipped: session.exercises.length - queue.length};
  }

  function programText(options) {
    var member = memberState();
    var program = member && member.goalPlan && member.goalPlan.fourWeekProgram;
    if (!program) return "";
    var lines = [
      "対象：" + program.month + "｜理想 " + program.idealName,
      "重点：" + program.priorities.join(" → "),
      "頻度：週" + program.frequency + "回｜" + program.minutes + "分｜合計" + program.totalSessions + " SESSION",
      "安全：" + (program.stopReason || program.blocked.map(function (item) { return item.part + "除外"; }).join(" / ") || "通常")
    ];
    program.weeks.forEach(function (week) {
      lines.push("WEEK " + week.number + "｜" + week.label + "｜" + week.totalSets + " SET");
      if (options && options.summaryOnly) return;
      week.sessions.forEach(function (session) {
        lines.push("  " + session.label + " " + session.date + "｜" + session.parts.join(" / "));
        session.exercises.forEach(function (exercise) {
          lines.push("    " + exercise.name + "｜" + exercise.reps + "rep × " + exercise.sets +
            "set｜RIR " + exercise.rir + "｜REST " + exercise.restSeconds + "秒");
        });
      });
    });
    return lines.join("\n");
  }

  async function copyProgram() {
    var text = programText();
    if (!text) {
      if (typeof alert === "function") alert("先に４週間プログラムを作成してください。");
      return "";
    }
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (typeof alert === "function") alert("４週間プログラムをコピーしました。");
    } catch (_error) {
      if (typeof prompt === "function") prompt("４週間プログラムをコピーしてください", text);
    }
    return text;
  }

  function openProgram() {
    var tab = document.querySelector('.tab[data-tab="smart"]');
    if (tab && typeof tab.click === "function") tab.click();
    renderProgram();
    var card = document.getElementById("fourWeekProgramCard");
    if (card && typeof card.scrollIntoView === "function") card.scrollIntoView({behavior: "smooth", block: "start"});
  }

  function connectMonthlyApply() {
    if (typeof window.applyMonthlyReviewPriorities !== "function") return;
    var previous = window.applyMonthlyReviewPriorities;
    if (previous.__sugFourWeekLinked) return;
    var linked = function () {
      var review = previous.apply(this, arguments);
      if (review && !review.globalStop) generateProgram({review: review});
      return review;
    };
    linked.__sugFourWeekLinked = true;
    window.applyMonthlyReviewPriorities = linked;
  }

  window.buildFourWeekProgram = buildProgram;
  window.generateFourWeekProgram = generateProgram;
  window.renderFourWeekProgram = renderProgram;
  window.selectFourWeekWeek = selectWeek;
  window.loadFourWeekSession = loadSession;
  window.fourWeekProgramText = programText;
  window.copyFourWeekProgram = copyProgram;
  window.openFourWeekProgram = openProgram;
  connectMonthlyApply();

  document.addEventListener("DOMContentLoaded", function () {
    connectMonthlyApply();
    if (memberState()) renderProgram();
  });
})();
