/* S.u.G EVOLINK: native HealthKit adapter. No remote transmission; no automatic localStorage writes. */
(function () {
  'use strict';
  var latest = null;
  var accepted = ['steps','distanceKm','activeEnergyKcal','sleepHours','heartRate','restingHeartRate','hrvMs'];
  function receive(payload) {
    if (!payload || payload.source !== 'healthkit_native_evolink' || payload.verifiedMeasurement !== true || !payload.metrics) return false;
    var metrics = {};
    accepted.forEach(function (key) {
      var n = payload.metrics[key];
      if (typeof n === 'number' && Number.isFinite(n) && n >= 0) metrics[key] = n;
    });
    if (!Object.keys(metrics).length) return false;
    latest = Object.freeze({source:payload.source, syncedAt:payload.syncedAt, metrics:Object.freeze(metrics)});
    window.dispatchEvent(new CustomEvent('sug:evolink-native-health', {detail:latest}));
    render();
    return true;
  }
  function clear() {
    latest = null;
    var old = document.getElementById('sug-evolink-health-inline');
    if (old) old.remove();
    window.dispatchEvent(new CustomEvent('sug:evolink-native-health-cleared', {detail:null}));
  }
  function render() {
    var target = document.getElementById('mainContent');
    if (!target) return;
    var inScope = /\b(ADAPT|TRAINING|NUTRITION)\b/i.test(document.title || '');
    var old = document.getElementById('sug-evolink-health-inline');
    if (!inScope) {if (old) old.remove(); return;}
    if (!latest) return;
    var signature = (document.title || "") + "|" + JSON.stringify(latest.metrics);
    if (old && old.dataset && old.dataset.signature === signature) return;
    if (!old) {
      old = document.createElement('section'); old.id='sug-evolink-health-inline';
      old.style.cssText='margin:12px 0;padding:12px;border:1px solid #b99854;border-radius:12px;background:#0b302b;color:#f5e6c1;font:13px/1.65 sans-serif';
      target.insertBefore(old, target.firstChild);
    }
    if (old.dataset) old.dataset.signature = signature;
    old.replaceChildren();
    var h = document.createElement('strong'); h.textContent='Appleヘルスケア｜実測値'; old.appendChild(h);
    var p = document.createElement('p');
    p.textContent = Object.entries(latest.metrics).map(function (pair) {return pair[0]+': '+pair[1];}).join(' / ');
    old.appendChild(p);
    var note=document.createElement('small');
    note.textContent='記録の確認表示です。既存の運動負荷・栄養計算を自動変更しません。'; old.appendChild(note);
  }
  window.SuGEvolinkNativeHealth = Object.freeze({receive:receive, clear:clear, snapshot:function(){return latest;}, requestRefresh:function(){
    if(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.sugEvolinkHealth)
      window.webkit.messageHandlers.sugEvolinkHealth.postMessage({action:'refresh'});
  }});
  var observer = new MutationObserver(function(){render();});
  function start(){observer.observe(document.documentElement,{childList:true,subtree:true});render();}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
