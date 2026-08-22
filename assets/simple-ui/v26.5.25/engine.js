(function () {
  "use strict";

  function memberState() {
    try { return typeof m === "function" ? m() : null; } catch (_error) { return null; }
  }

  function escapeText(value) {
    if (typeof esc === "function") return esc(String(value == null ? "" : value));
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[character];
    });
  }

  function todayValue() {
    try { return typeof today === "function" ? today() : ""; } catch (_error) { return ""; }
  }

  function recoveryState() {
    try { return typeof smartRecoveryState === "function" ? smartRecoveryState() : null; }
    catch (_error) { return null; }
  }

  function openSugTab(name) {
    var tab = document.querySelector('.tab[data-tab="' + String(name || "") + '"]');
    if (!tab || typeof tab.click !== "function") return false;
    tab.click();
    return true;
  }

  function toggleNavigation() {
    var navigation = document.getElementById("sugPrimaryNavigation");
    var button = document.getElementById("simpleNavMore");
    if (!navigation || !button) return false;
    var expanded = navigation.classList.toggle("sug-nav-expanded");
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded ? "閉じる" : "その他";
    return expanded;
  }

  function toggleHomeDetails() {
    var home = document.getElementById("dash");
    var button = document.getElementById("simpleHomeDetailsToggle");
    if (!home || !button) return false;
    var expanded = home.classList.toggle("sug-home-expanded");
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded ? "４週間プラン・分析・詳細を閉じる" : "４週間プラン・分析・詳細を開く";
    return expanded;
  }

  function idealProfileFor(member) {
    var goal = member && member.goalPlan || {};
    var profiles = window.__SUG_IDEAL_DAILY_PROFILES__ || {};
    var key = String(goal.idealVisionType || "");
    return { key: key, profile: profiles[key] || {}, goal: goal };
  }

  function idealLabel(member) {
    var current = idealProfileFor(member);
    var key = current.key;
    var profile = current.profile;
    var goal = current.goal;
    var selected = goal.idealVisionName || profile.name || "未設定";
    if (!key) return selected;
    return (key.indexOf("female_") === 0 ? "おかめ" : "ひょっとこ") + "｜" + selected;
  }

  function openMemberIdealVision() {
    var member = memberState();
    if (!member) return false;
    if (typeof window.openIdealVision === "function") {
      window.openIdealVision();
      return true;
    }
    openSugTab("dash");
    return false;
  }

  function openMemberCheckin() {
    return openSugTab("recovery");
  }

  function openMemberMenu() {
    return openSugTab("smart");
  }

  function renderSmartIdealEntry() {
    var member = memberState();
    var panel = document.getElementById("smart");
    if (!member || !panel) return null;
    var hero = panel.querySelector(".smartHero") || panel.querySelector(".card");
    if (!hero) return null;
    var box = document.getElementById("smartMemberIdealVision");
    if (!box) {
      box = document.createElement("div");
      box.id = "smartMemberIdealVision";
      box.className = "card";
      box.style.borderColor = "#6b5724";
      box.style.background = "linear-gradient(180deg,#18150e,#101012)";
      box.style.marginTop = "0";
      hero.insertAdjacentElement("afterend", box);
    }
    var label = idealLabel(member);
    var configured = !!(member.goalPlan && member.goalPlan.idealVisionType);
    box.innerHTML = '<div style="font-size:11px;color:#d8b35b;font-weight:900;letter-spacing:.06em">この会員の理想設定</div>' +
      '<div style="font-size:17px;font-weight:900;color:#fff;margin-top:5px">' + escapeText(label) + '</div>' +
      '<div style="font-size:10px;color:#aaa;line-height:1.55;margin-top:4px">理想から重点部位・SET・今日のメニューを自動調整します。</div>' +
      '<button type="button" class="primary" style="width:100%;margin-top:10px" onclick="openMemberIdealVision()">' +
      (configured ? '理想を変更する' : '理想のひょっとこを選ぶ') + '</button>';
    return {configured: configured, label: label};
  }

  function homeSignal(state) {
    var box = document.getElementById("simpleHomeSignal");
    if (!box) return;
    var volume = state && Number(state.volume);
    var stopped = state && volume <= 0;
    var adjusted = state && volume > 0 && volume < 100;
    var tone = stopped ? "bad" : adjusted ? "warn" : "ok";
    var label = !state ? "今日の状態を確認中" : stopped ? "今日は回復を優先" : adjusted ? "体調に合わせて負荷を調整" : "いつもどおり開始できます";
    var reason = state && state.reason || "回復・痛み・疲労から無理のない進め方を表示します。";
    box.classList.remove("ok", "warn", "bad");
    box.classList.add(tone);
    box.innerHTML = "<b>" + escapeText(label) + "</b><small>" + escapeText(reason) + "</small>";
  }

  function homeGoal(member) {
    var box = document.getElementById("simpleHomeGoal");
    if (!box) return;
    var goal = member.goalPlan || {};
    var key = String(goal.idealVisionType || "");
    var profiles = window.__SUG_IDEAL_DAILY_PROFILES__ || {};
    var profile = profiles[key] || {};
    var gender = key.indexOf("female_") === 0 ? "女性｜おかめ" : key ? "男性｜ひょっとこ" : "";
    var selected = goal.idealVisionName || profile.name || "まだ未設定";
    box.innerHTML = '<span>理想体型：<b>' + escapeText(gender ? gender + " " + selected : selected) + '</b></span>';
  }

  function renderMemberHomeIdeal(member) {
    var home = document.getElementById("dash");
    if (!home || !member) return null;
    var anchor = document.getElementById("simpleHomeSignal") || home.querySelector(".card");
    if (!anchor) return null;
    var card = document.getElementById("memberHomeIdealCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "memberHomeIdealCard";
      card.className = "card";
      card.style.borderColor = "#5a4a25";
      card.style.background = "linear-gradient(180deg,#18150e,#101012)";
      var host = anchor.closest && anchor.closest(".card");
      if (host) host.insertAdjacentElement("afterend", card); else anchor.insertAdjacentElement("afterend", card);
    }
    var goal = member.goalPlan || {};
    if (!goal.idealVisionType) {
      card.innerHTML = '<div style="font-size:10px;color:#d8b35b;font-weight:900">はじめに</div><div style="font-size:18px;font-weight:900;margin-top:5px">担当者が理想を設定します</div><div style="font-size:10px;color:#aaa;margin-top:5px">設定後は、今日の状態を入力するだけでメニューが自動で決まります。</div>';
      return {configured:false};
    }
    var plan = null;
    try { if (typeof window.generateIdealDailyPlan === "function") plan = window.generateIdealDailyPlan(); } catch (_error) {}
    var priorities = [];
    if (plan && Array.isArray(plan.priorities)) priorities = plan.priorities.map(function (x) { return x && x.part; }).filter(Boolean).slice(0,3);
    if (!priorities.length) {
      [goal.priority1, goal.priority2, goal.priority3].forEach(function (x) { if (x && x !== "全身" && priorities.indexOf(x) < 0) priorities.push(x); });
    }
    var focus = priorities.length ? priorities.join("・") : "全身バランス";
    var state = recoveryState();
    var volume = state && Number(state.volume);
    var todayText = volume <= 0 ? "今日は回復を優先" : volume < 100 ? "体調に合わせて調整" : "トレーニング可能";
    card.innerHTML = '<div style="font-size:10px;color:#d8b35b;font-weight:900;letter-spacing:.06em">TODAY FLOW</div>' +
      '<div style="font-size:19px;font-weight:900;color:#fff;margin-top:5px">あなたの理想：' + escapeText(idealLabel(member)) + '</div>' +
      '<div style="margin-top:10px;display:grid;gap:7px">' +
        '<button type="button" class="secondary" style="width:100%;text-align:left;padding:12px" onclick="openMemberCheckin()"><b style="display:block;color:#f3d98b;font-size:13px">① 今日の状態を入力</b><small style="display:block;color:#aaa;margin-top:4px">睡眠・疲労・痛み・回復状態を入力</small></button>' +
        '<button type="button" class="primary" style="width:100%;text-align:left;padding:12px" onclick="openMemberMenu()"><b style="display:block;font-size:13px">② 今日のメニューを見る</b><small style="display:block;margin-top:4px;opacity:.75">理想＋今日の状態から自動作成</small></button>' +
        '<button type="button" class="secondary" style="width:100%;text-align:left;padding:12px" onclick="openTab(\'training\')"><b style="display:block;color:#f3d98b;font-size:13px">③ トレーニングを記録</b><small style="display:block;color:#aaa;margin-top:4px">実施した重量・REP・SET・RIRを保存</small></button>' +
      '</div>' +
      '<div style="margin-top:10px;padding:9px;background:#0d0d10;border:1px solid #2d2a22;border-radius:10px"><span style="font-size:9px;color:#999">今日の重点</span><b style="display:block;font-size:15px;color:#f3d98b;margin-top:3px">' + escapeText(focus) + '</b><small style="display:block;color:#aaa;margin-top:4px">' + escapeText(todayText) + '</small></div>';
    return {configured:true, focus:focus};
  }

  function countForToday(rows, date) {
    return (Array.isArray(rows) ? rows : []).filter(function (row) { return row && String(row.date || "") === date; }).length;
  }

  function homeRecords(member) {
    var box = document.getElementById("simpleHomeRecordSummary");
    if (!box) return;
    var date = todayValue();
    var trained = countForToday(member.training, date);
    var meals = countForToday(member.meals, date);
    var weighed = countForToday(member.weights, date) > 0;
    box.innerHTML = '<div class="simpleRecordCell"><span>トレーニング</span><b>' + trained + '種目</b></div><div class="simpleRecordCell"><span>食事</span><b>' + meals + '件</b></div><div class="simpleRecordCell"><span>体重</span><b>' + (weighed ? "記録済" : "未記録") + '</b></div>';
  }

  function homeAction(member, state) {
    var button = document.getElementById("simpleHomeStart");
    var hint = document.getElementById("simpleHomeActionHint");
    if (!button || !hint) return;
    var goal = member.goalPlan || {};
    var selected = !!goal.idealVisionType;
    var stopped = selected && state && Number(state.volume) <= 0;
    button.textContent = stopped ? "今日の回復状態を確認する" : "今日のメニューを始める";
    hint.textContent = !selected ? "担当者が理想を設定するとメニューが自動で準備されます。" : stopped ? "痛み・疲労・休養予定を優先します。" : "上の①→②→③の順に進めればOKです。";
  }

  function renderHome() {
    var member = memberState();
    if (!member) return null;
    var state = recoveryState();
    homeSignal(state);
    homeGoal(member);
    homeRecords(member);
    homeAction(member, state);
    renderSmartIdealEntry();
    renderMemberHomeIdeal(member);
    return {selected: !!(member.goalPlan && member.goalPlan.idealVisionType), volume: state ? state.volume : null};
  }

  function renderTrainingProgress() {
    var box = document.getElementById("simpleTrainingQueue");
    if (!box) return null;
    var queue = typeof trainingSessionQueue === "undefined" ? [] : trainingSessionQueue;
    var cursor = typeof trainingQueueCursor === "undefined" ? -1 : trainingQueueCursor;
    if (!queue.length || cursor < 0) { box.classList.remove("active"); box.innerHTML = ""; return {total:0,current:0,done:false}; }
    var done = cursor >= queue.length;
    var current = done ? queue.length : cursor + 1;
    var row = done ? null : queue[cursor];
    box.classList.add("active");
    box.innerHTML = done ? '<b>今日のメニュー完了｜' + queue.length + '種目</b><small>すべての種目を記録しました。</small>' : '<b>今日のメニュー｜' + current + ' / ' + queue.length + '</b><small>' + escapeText(row.exercise) + '｜' + Number(row.sets || 0) + 'セット × ' + Number(row.reps || 0) + '回｜記録すると次へ進みます。</small>';
    return {total:queue.length,current:current,done:done};
  }

  function parseRestSeconds(row) {
    if (Number(row.restSeconds || 0) >= 10) return Number(row.restSeconds);
    var match = String(row.rest || "").match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  function planTemplate(row) {
    var last = row.last || {};
    var reps = String(row.reps || "").match(/\d+/);
    return {exercise:String(row.name || row.exercise || ""),part:String(row.part || ""),pof:String(row.pof || ""),setMethod:"straight",setGroup:"",weight:Number(last.weight || 0),reps:reps ? Number(reps[0]) : Number(last.reps || 10),sets:Math.max(1,Number(row.sets || 1)),rir:Number(row.rir == null ? 2 : row.rir),plannedRestSec:parseRestSeconds(row),setDetails:[],memo:""};
  }

  function clearExerciseFilters() {
    ["trainingExerciseSearch","trainingExercisePart"].forEach(function (id) { var input=document.getElementById(id); if(input) input.value=""; });
  }

  function startDailyTraining() {
    var member=memberState();
    if(!member) return {status:"NO_MEMBER"};
    var goal=member.goalPlan || {};
    if(!goal.idealVisionType){ if(typeof window.openIdealVision==="function") window.openIdealVision(); return {status:"VISION_REQUIRED"}; }
    if(typeof window.generateIdealDailyPlan!=="function") return {status:"PLAN_UNAVAILABLE"};
    var plan=window.generateIdealDailyPlan();
    if(!plan) return {status:"PLAN_UNAVAILABLE"};
    if(plan.stopReason || Number(plan.volume)<=0 || !Array.isArray(plan.exercises) || !plan.exercises.length){ renderHome(); openSugTab("recovery"); return {status:"RECOVERY_FIRST",reason:plan.stopReason || plan.recoveryReason || "今日は回復を優先してください。"}; }
    clearExerciseFilters();
    trainingSessionQueue=plan.exercises.map(planTemplate);
    trainingQueueCursor=0;
    trainingQueueLabel="今日のメニュー｜"+String(plan.idealName || goal.idealVisionName || "理想体型");
    if(typeof applyTrainingTemplate==="function") applyTrainingTemplate(trainingSessionQueue[0]);
    if(typeof renderTrainingQueue==="function") renderTrainingQueue(); else renderTrainingProgress();
    openSugTab("training"); renderTrainingProgress(); renderHome();
    return {status:"STARTED",total:trainingSessionQueue.length,exercise:trainingSessionQueue[0].exercise};
  }

  function installPlanRefresh() {
    var original=window.generateIdealDailyPlan;
    if(typeof original!=="function" || original.__sugSimpleHomeWrapped) return;
    function refreshedPlan(){ var plan=original.apply(this,arguments); return plan; }
    refreshedPlan.__sugSimpleHomeWrapped=true;
    window.generateIdealDailyPlan=refreshedPlan;
  }

  window.openTab=openSugTab;
  window.toggleSugNavigation=toggleNavigation;
  window.toggleSugHomeDetails=toggleHomeDetails;
  window.renderSugSimpleHome=renderHome;
  window.renderSugTrainingProgress=renderTrainingProgress;
  window.renderSmartIdealEntry=renderSmartIdealEntry;
  window.renderMemberHomeIdeal=renderMemberHomeIdeal;
  window.openMemberIdealVision=openMemberIdealVision;
  window.openMemberCheckin=openMemberCheckin;
  window.openMemberMenu=openMemberMenu;
  window.startSugDailyTraining=startDailyTraining;
  window.__SUG_SIMPLE_UI_VERSION__="26.5.31";

  installPlanRefresh(); renderHome(); renderTrainingProgress(); renderSmartIdealEntry();
  document.addEventListener("DOMContentLoaded",function(){ installPlanRefresh(); renderHome(); renderTrainingProgress(); renderSmartIdealEntry(); });
})();