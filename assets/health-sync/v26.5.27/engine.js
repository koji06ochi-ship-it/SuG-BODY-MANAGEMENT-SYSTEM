(function () {
  "use strict";

  var VERSION = "26.5.27";
  var PENDING_KEY = "sug-health-import-pending-v1";
  var MAX_PENDING_AGE = 30 * 60 * 1000;
  var pendingMemory = null;

  function memberState() {
    try { return typeof m === "function" ? m() : null; }
    catch (_error) { return null; }
  }

  function memberId() {
    try { return typeof db !== "undefined" && db.current ? String(db.current) : ""; }
    catch (_error) { return ""; }
  }

  function currentDate() {
    if (typeof today === "function") return today();
    var date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") +
      "-" + String(date.getDate()).padStart(2, "0");
  }

  function escapeHtml(value) {
    if (typeof esc === "function") return esc(String(value == null ? "" : value));
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[character];
    });
  }

  function setSyncStatus(message, tone) {
    var status = document.getElementById("sugHealthStatus");
    if (!status) return;
    status.textContent = String(message || "");
    status.classList.remove("ok", "bad");
    if (tone) status.classList.add(tone);
  }

  function rawValue(payload, names) {
    for (var index = 0; index < names.length; index += 1) {
      var value = payload[names[index]];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return null;
  }

  function numberValue(value, label, minimum, maximum, integer) {
    if (value == null || /^\[[^\]]+\]$/.test(String(value).trim())) return null;
    var cleaned = String(value).trim().replace(/[,\s]/g, "")
      .replace(/(?:歩|時間|kg|bpm|回\/分|kcal)$/i, "");
    if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(cleaned)) throw new Error(label + "の形式を確認してください。");
    var result = Number(cleaned);
    if (!Number.isFinite(result) || result < minimum || result > maximum) {
      throw new Error(label + "の値が範囲外です。");
    }
    return integer ? Math.round(result) : Math.round(result * 100) / 100;
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("ヘルスケアの連携データを読み取れませんでした。");
    }
    var date = rawValue(payload, ["date", "day"]) || currentDate();
    if (/^\[[^\]]+\]$/.test(String(date))) date = currentDate();
    date = String(date).trim();
    var parsedDate = new Date(date + "T12:00:00");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) ||
        parsedDate.getFullYear() + "-" + String(parsedDate.getMonth() + 1).padStart(2, "0") +
          "-" + String(parsedDate.getDate()).padStart(2, "0") !== date) {
      throw new Error("日付は YYYY-MM-DD 形式で指定してください。");
    }

    var sleepHours = numberValue(rawValue(payload, ["sleep", "sleepHours", "sleep_hours"]), "睡眠時間", 0, 24, false);
    var sleepMinutes = numberValue(rawValue(payload, ["sleepMinutes", "sleep_minutes"]), "睡眠時間", 0, 1440, false);
    if (sleepHours == null && sleepMinutes != null) sleepHours = Math.round(sleepMinutes / 60 * 100) / 100;

    var normalized = {
      member: String(rawValue(payload, ["member", "member_id", "memberId"]) || ""),
      date: date,
      steps: numberValue(rawValue(payload, ["steps", "step_count", "stepCount"]), "歩数", 0, 100000, true),
      sleep: sleepHours,
      heart: numberValue(rawValue(payload, ["heart", "heartRate", "heart_rate", "hr", "restingHeartRate", "resting_heart_rate"]), "心拍", 25, 240, true),
      weight: numberValue(rawValue(payload, ["weight", "weightKg", "weight_kg"]), "体重", 20, 350, false),
      hrv: numberValue(rawValue(payload, ["hrv", "heartRateVariability", "heart_rate_variability"]), "心拍変動", 1, 500, false),
      activeCalories: numberValue(rawValue(payload, ["activeCalories", "active_calories", "activeEnergy", "active_energy", "kcal"]), "活動消費", 0, 15000, true)
    };
    if ([normalized.steps, normalized.sleep, normalized.heart, normalized.weight, normalized.hrv,
      normalized.activeCalories].every(function (value) { return value == null; })) {
      throw new Error("歩数・睡眠・心拍・体重のうち、取り込む数値を設定してください。");
    }
    return normalized;
  }

  function parseHash(hash) {
    var value = String(hash || "").replace(/^#/, "");
    if (!/^sug-health(?:[?&=]|$)/.test(value)) return null;
    if (value.indexOf("sug-health=") === 0) {
      var encoded = value.slice("sug-health=".length);
      try { return JSON.parse(decodeURIComponent(encoded)); }
      catch (_error) { throw new Error("ヘルスケアの連携データ形式を確認してください。"); }
    }
    var query = value.replace(/^sug-health[?&]?/, "");
    var parameters = new URLSearchParams(query);
    var payload = {};
    parameters.forEach(function (parameter, key) { payload[key] = parameter; });
    return payload;
  }

  function savePending(payload) {
    pendingMemory = {payload: payload, savedAt: Date.now()};
    try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(pendingMemory)); }
    catch (_error) {}
    return pendingMemory;
  }

  function pendingImport() {
    if (pendingMemory) return pendingMemory;
    try {
      var raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      var value = JSON.parse(raw);
      if (!value || !value.payload || Date.now() - Number(value.savedAt || 0) > MAX_PENDING_AGE) {
        sessionStorage.removeItem(PENDING_KEY);
        return null;
      }
      pendingMemory = value;
      return value;
    } catch (_error) { return null; }
  }

  function clearPending() {
    pendingMemory = null;
    try { sessionStorage.removeItem(PENDING_KEY); }
    catch (_error) {}
  }

  function removeHealthFragment() {
    if (!window.history || typeof window.history.replaceState !== "function") return;
    window.history.replaceState(window.history.state || null, "", location.pathname + location.search);
  }

  function captureHash() {
    var payload;
    try { payload = parseHash(location.hash); }
    catch (error) {
      removeHealthFragment();
      setSyncStatus(error.message || "ヘルスケアデータを読み取れませんでした。", "bad");
      return null;
    }
    if (!payload) return null;
    savePending(payload);
    removeHealthFragment();
    return payload;
  }

  function upsertDate(rows, date, create) {
    var entry = null;
    for (var index = rows.length - 1; index >= 0; index -= 1) {
      if (String(rows[index].date || "") === date) { entry = rows[index]; break; }
    }
    if (!entry) {
      entry = create();
      rows.push(entry);
    }
    rows.sort(function (left, right) { return String(left.date || "").localeCompare(String(right.date || "")); });
    return entry;
  }

  function applyPayload(payload) {
    var member = memberState();
    if (!member) return {ok: false, pending: true, reason: "NO_MEMBER"};

    var normalized;
    try { normalized = normalizePayload(payload); }
    catch (error) {
      setSyncStatus(error.message, "bad");
      return {ok: false, reason: "INVALID_DATA", message: error.message};
    }
    if (normalized.member && normalized.member !== memberId()) {
      var mismatch = "連携URLの会員と現在表示している会員が一致しません。";
      setSyncStatus(mismatch, "bad");
      return {ok: false, reason: "MEMBER_MISMATCH", message: mismatch};
    }

    ["activity", "recovery", "weights", "healthVitals"].forEach(function (key) {
      if (!Array.isArray(member[key])) member[key] = [];
    });
    var syncedAt = new Date().toISOString();

    if (normalized.steps != null || normalized.activeCalories != null) {
      var activity = upsertDate(member.activity, normalized.date, function () {
        return {date: normalized.date, steps: 0, memo: "iPhoneヘルスケアから取り込み"};
      });
      if (normalized.steps != null) activity.steps = normalized.steps;
      if (normalized.activeCalories != null) activity.activeCalories = normalized.activeCalories;
      activity.healthSource = "apple_health";
      activity.healthSyncedAt = syncedAt;
    }

    if (normalized.sleep != null) {
      var recovery = upsertDate(member.recovery, normalized.date, function () {
        return {date: normalized.date, sleep: 0, fatigue: 0, stress: 0, pain: 0, memo: ""};
      });
      recovery.sleep = normalized.sleep;
      if (normalized.heart != null) recovery.heartRate = normalized.heart;
      recovery.healthSource = "apple_health";
      recovery.healthSyncedAt = syncedAt;
    }

    if (normalized.weight != null) {
      var weight = upsertDate(member.weights, normalized.date, function () {
        return {date: normalized.date, weight: 0, fat: null, memo: "iPhoneヘルスケアから取り込み"};
      });
      weight.weight = normalized.weight;
      weight.healthSource = "apple_health";
      weight.healthSyncedAt = syncedAt;
    }

    if (normalized.heart != null || normalized.hrv != null) {
      var vitals = upsertDate(member.healthVitals, normalized.date, function () {
        return {date: normalized.date, source: "apple_health"};
      });
      if (normalized.heart != null) vitals.heartRate = normalized.heart;
      if (normalized.hrv != null) vitals.hrv = normalized.hrv;
      vitals.syncedAt = syncedAt;
    }

    member.healthSync = {
      provider: "apple_health_shortcuts",
      lastSyncedAt: syncedAt,
      lastDate: normalized.date,
      steps: normalized.steps,
      sleep: normalized.sleep,
      heartRate: normalized.heart,
      weight: normalized.weight,
      hrv: normalized.hrv,
      activeCalories: normalized.activeCalories
    };

    clearPending();
    if (typeof persist === "function") persist();
    if (typeof renderAll === "function") renderAll();
    else renderSync();
    setSyncStatus("ヘルスケアのデータを取り込み、会員記録へ反映しました。", "ok");
    return {ok: true, date: normalized.date, values: normalized};
  }

  function cloudIsReady() {
    try { return typeof cloudReady !== "boolean" || cloudReady; }
    catch (_error) { return false; }
  }

  function consumePending() {
    var pending = pendingImport();
    if (!pending || !memberState() || !cloudIsReady()) return null;
    return applyPayload(pending.payload);
  }

  function lastForDate(rows, date) {
    if (!Array.isArray(rows)) return null;
    for (var index = rows.length - 1; index >= 0; index -= 1) {
      if (String(rows[index].date || "") === date) return rows[index];
    }
    return null;
  }

  function shortcutUrl() {
    var identifier = memberId();
    if (!identifier) return "";
    return location.origin + location.pathname + "#sug-health&member=" +
      encodeURIComponent(identifier) + "&steps=[歩数]&sleep=[睡眠時間]&heart=[心拍]&weight=[体重]";
  }

  function metricCell(label, value) {
    return '<div class="sugHealthMetric"><span>' + escapeHtml(label) +
      "</span><b>" + escapeHtml(value) + "</b></div>";
  }

  function renderSync() {
    var member = memberState();
    if (!member) return null;
    var sync = member.healthSync || {};
    var date = currentDate();
    var activity = lastForDate(member.activity, date);
    var recovery = lastForDate(member.recovery, date);
    var weight = lastForDate(member.weights, date);
    var vitals = lastForDate(member.healthVitals, date);
    var steps = activity && Number.isFinite(Number(activity.steps)) ? Number(activity.steps).toLocaleString() + "歩" : "--";
    var sleep = recovery && Number(recovery.sleep) > 0 ? Number(recovery.sleep).toFixed(1) + "h" : "--";
    var heart = vitals && Number(vitals.heartRate) > 0 ? Number(vitals.heartRate) + "回" : "--";
    var kilograms = weight && Number(weight.weight) > 0 ? Number(weight.weight).toFixed(1) + "kg" : "--";

    var metrics = document.getElementById("sugHealthMetrics");
    if (metrics) metrics.innerHTML = metricCell("歩数", steps) + metricCell("睡眠", sleep) +
      metricCell("心拍", heart) + metricCell("体重", kilograms);

    var badge = document.getElementById("sugHealthBadge");
    if (badge) {
      badge.textContent = sync.lastSyncedAt ? "連携済" : "未連携";
      badge.classList.remove("ok");
      if (sync.lastSyncedAt) badge.classList.add("ok");
    }

    var home = document.getElementById("sugHealthHomeSummary");
    if (home) {
      home.innerHTML = sync.lastSyncedAt ?
        "<strong>ヘルスケア連携済</strong>｜" + escapeHtml(steps) + "・" + escapeHtml(sleep) :
        "iPhoneヘルスケア：未連携";
    }

    var template = document.getElementById("sugHealthShortcutUrl");
    if (template) template.textContent = shortcutUrl() || "ログインすると会員専用の連携URLを表示します。";

    if (sync.lastSyncedAt) {
      var updated = new Date(sync.lastSyncedAt);
      var display = Number.isNaN(updated.getTime()) ? sync.lastDate :
        updated.getMonth() + 1 + "/" + updated.getDate() + " " +
        String(updated.getHours()).padStart(2, "0") + ":" + String(updated.getMinutes()).padStart(2, "0");
      setSyncStatus("最終取り込み：" + display + "｜歩数・睡眠・心拍・体重を既存の記録へ反映します。", "ok");
    }
    return {connected: !!sync.lastSyncedAt, steps: steps, sleep: sleep, heart: heart, weight: kilograms};
  }

  function openSetup() {
    if (typeof window.openTab === "function") window.openTab("activity");
    else {
      var tab = document.querySelector('.tab[data-tab="activity"]');
      if (tab && typeof tab.click === "function") tab.click();
    }
    var guide = document.getElementById("sugHealthGuide");
    if (guide) guide.open = true;
    var card = document.getElementById("sugHealthSyncCard");
    if (card && typeof card.scrollIntoView === "function") {
      card.scrollIntoView({behavior: "smooth", block: "start"});
    }
    renderSync();
    return true;
  }

  async function copyShortcutUrl() {
    var url = shortcutUrl();
    if (!url) {
      setSyncStatus("ログイン後に会員専用の連携URLを作成します。", "bad");
      return false;
    }
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(url);
      } else {
        var field = document.createElement("textarea");
        field.value = url;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.focus();
        field.select();
        if (!document.execCommand("copy")) throw new Error("copy failed");
        document.body.removeChild(field);
      }
      var guide = document.getElementById("sugHealthGuide");
      if (guide) guide.open = true;
      setSyncStatus("連携URLをコピーしました。ショートカットの「テキスト」に貼り付けてください。", "ok");
      return true;
    } catch (_error) {
      setSyncStatus("コピーできませんでした。手順内の連携URLを長押ししてコピーしてください。", "bad");
      return false;
    }
  }

  function openShortcuts() {
    location.href = "shortcuts://";
    return true;
  }

  window.openSugHealthSetup = openSetup;
  window.copySugHealthShortcutUrl = copyShortcutUrl;
  window.openSugShortcutsApp = openShortcuts;
  window.renderSugHealthSync = renderSync;
  window.consumeSugHealthImport = consumePending;
  window.importSugHealthPayload = applyPayload;
  window.__SUG_HEALTH_SYNC__ = {
    version: VERSION,
    parseHash: parseHash,
    normalizePayload: normalizePayload,
    applyPayload: applyPayload,
    captureHash: captureHash,
    consumePending: consumePending,
    shortcutUrl: shortcutUrl,
    render: renderSync
  };

  captureHash();
  consumePending();
  renderSync();
  if (typeof window.addEventListener === "function") {
    window.addEventListener("hashchange", function () {
      if (captureHash()) consumePending();
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    renderSync();
    consumePending();
  });
})();
