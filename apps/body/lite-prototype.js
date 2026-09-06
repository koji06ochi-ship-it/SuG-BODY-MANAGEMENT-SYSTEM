(()=>{'use strict';
const V='0.1.0',HEALTH='sug_native_health_v1',DAILY='sug_body_lite_daily_v1',PREF='sug_body_lite_pref_v1',QUEST='sug_walk_quest_v1',PHOTO_DB='sug_body_lite_photos_v1',PHOTO_STORE='photos';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const j=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const today=()=>new Date().toISOString().slice(0,10);
const monthKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const prevMonth=()=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);return monthKey(d)};
const n=v=>Number.isFinite(Number(v))?Number(v):null;
let health=j(HEALTH,{}),pref=j(PREF,{mode:'community',watch:false}),condition={fatigue:null,pain:null,subjective:null};
function db(){return new Promise((res,rej)=>{const r=indexedDB.open(PHOTO_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(PHOTO_STORE))r.result.createObjectStore(PHOTO_STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function photoPut(k,v){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(PHOTO_STORE,'readwrite');t.objectStore(PHOTO_STORE).put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
async function photoGet(k){const d=await db();return new Promise((res,rej)=>{const r=d.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).get(k);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
async function photoDel(k){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(PHOTO_STORE,'readwrite');t.objectStore(PHOTO_STORE).delete(k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
function healthValue(...keys){for(const k of keys){if(health?.[k]!=null&&n(health[k])!=null)return n(health[k])}return null}
function quest(){const q=j(QUEST,{});return {checkins:Array.isArray(q.checkins)?q.checkins.length:0,points:n(q.points)||0,steps:n(q.steps),distanceKm:n(q.distanceKm),exerciseMinutes:n(q.exerciseMinutes),participated:(Array.isArray(q.checkins)&&q.checkins.length>0)||(n(q.points)||0)>0}}
function record(){const q=quest();return {date:today(),mode:pref.mode,health:{steps:healthValue('steps','stepCount'),distanceKm:healthValue('distanceKm'),exerciseMinutes:healthValue('exerciseMinutes'),activeEnergyKcal:healthValue('activeEnergyKcal'),sleepHours:healthValue('sleep','sleepHours'),heartRate:healthValue('heartRate','latestHeartRate'),restingHeartRate:healthValue('restingHeartRate'),hrvMs:healthValue('hrv','hrvMs'),weightKg:healthValue('weight','weightKg')},condition:{...condition},quest:{checkins:q.checkins,points:q.points,participated:q.participated},syncedAt:health?.syncedAt||new Date().toISOString()}}
function saveDaily(){const r=record(),all=j(DAILY,[]).filter(x=>x.date!==r.date);all.unshift(r);localStorage.setItem(DAILY,JSON.stringify(all.slice(0,180)))}
function avg(xs,key){const vs=xs.map(x=>key.split('.').reduce((o,k)=>o?.[k],x)).map(n).filter(v=>v!=null);return vs.length?vs.reduce((a,b)=>a+b,0)/vs.length:null}
function monthStats(key){const xs=j(DAILY,[]).filter(x=>String(x.date||'').startsWith(key));return {days:xs.length,steps:avg(xs,'health.steps'),exercise:avg(xs,'health.exerciseMinutes'),sleep:avg(xs,'health.sleepHours'),weight:avg(xs,'health.weightKg'),questDays:xs.filter(x=>x.quest?.participated).length}}
function delta(cur,prev,digits=0){if(cur==null||prev==null)return '--';const d=cur-prev;return `${d>=0?'+':''}${d.toFixed(digits)}`}
function fmt(v,suffix='',digits=0){return v==null?'--':`${Number(v).toFixed(digits)}${suffix}`}
function modeLabel(){return ({community:'COMMUNITY',senior:'SENIOR',sports:'SPORTS'})[pref.mode]||'COMMUNITY'}
function renderHealth(){const vals={steps:healthValue('steps','stepCount'),distance:healthValue('distanceKm'),exercise:healthValue('exerciseMinutes'),sleep:healthValue('sleep','sleepHours'),heart:healthValue('restingHeartRate','heartRate','latestHeartRate'),weight:healthValue('weight','weightKg')};$('#mSteps').textContent=vals.steps==null?'--':Math.round(vals.steps).toLocaleString();$('#mDistance').textContent=fmt(vals.distance,' km',2);$('#mExercise').textContent=fmt(vals.exercise,' min');$('#mSleep').textContent=fmt(vals.sleep,' h',1);$('#mHeart').textContent=fmt(vals.heart,' bpm');$('#mWeight').textContent=fmt(vals.weight,' kg',1);$('#syncStatus').textContent=health?.syncedAt?`最終同期 ${new Date(health.syncedAt).toLocaleString('ja-JP')}`:'Healthデータ未同期'}
function renderQuest(){const q=quest();$('#qCheckins').textContent=q.checkins;$('#qPoints').textContent=q.points.toLocaleString();$('#qStatus').textContent=q.participated?'参加あり':'本日未参加';$('#qStatus').dataset.on=q.participated?'1':'0'}
function renderMonth(){saveDaily();const c=monthStats(monthKey()),p=monthStats(prevMonth());$('#monthDays').textContent=c.days;$('#monthSteps').textContent=c.steps==null?'--':Math.round(c.steps).toLocaleString();$('#monthStepsDelta').textContent=`前月比 ${delta(c.steps,p.steps,0)} 歩/日`;$('#monthExercise').textContent=fmt(c.exercise,' min');$('#monthExerciseDelta').textContent=`前月比 ${delta(c.exercise,p.exercise,0)} min/日`;$('#monthSleep').textContent=fmt(c.sleep,' h',1);$('#monthSleepDelta').textContent=`前月比 ${delta(c.sleep,p.sleep,1)} h`;$('#monthWeight').textContent=fmt(c.weight,' kg',1);$('#monthWeightDelta').textContent=`前月比 ${delta(c.weight,p.weight,1)} kg`;$('#monthQuest').textContent=c.questDays;$('#monthQuestDelta').textContent=`前月 ${p.questDays}日`}
function renderMode(){$('#mode').value=pref.mode;$('#modeBadge').textContent=modeLabel();$('#watch').checked=!!pref.watch;$('#watchState').textContent=pref.watch?'ON｜共有権限は別設定':'OFF'}
function renderCondition(){for(const key of ['fatigue','pain','subjective']){$$(`[data-key="${key}"]`).forEach(b=>b.classList.toggle('on',condition[key]===+b.dataset.v))}}
async function renderPhotos(){const m=monthKey();for(const view of ['front','side','back']){const img=$(`#photo_${view}`),blob=await photoGet(`${m}:${view}`);if(blob){img.src=URL.createObjectURL(blob);img.classList.add('has')}else{img.removeAttribute('src');img.classList.remove('has')}}}
function summary(){const c=monthStats(monthKey()),q=quest();return [`S.u.G BODY Lite｜${monthKey()}`,`MODE: ${modeLabel()}`,`平均歩数: ${c.steps==null?'--':Math.round(c.steps).toLocaleString()} 歩/日`,`平均活動: ${fmt(c.exercise,' min/日')}`,`平均睡眠: ${fmt(c.sleep,' h',1)}`,`平均体重: ${fmt(c.weight,' kg',1)}`,`QUEST参加日: ${c.questDays}日`,`本日チェックイン: ${q.checkins}`,`疲労: ${condition.fatigue??'--'} / 5`,`痛み: ${condition.pain??'--'} / 5`].join('\n')}
function renderAll(){renderHealth();renderQuest();renderMode();renderCondition();renderMonth();renderPhotos()}
function applyHealth(p){if(!p||typeof p!=='object')return;health={...health,...p};try{localStorage.setItem(HEALTH,JSON.stringify(health))}catch{};renderAll()}
function boot(){
  $('#mode').onchange=e=>{pref.mode=e.target.value;localStorage.setItem(PREF,JSON.stringify(pref));renderMode();saveDaily()};
  $('#watch').onchange=e=>{pref.watch=!!e.target.checked;localStorage.setItem(PREF,JSON.stringify(pref));renderMode()};
  $$('.scale button').forEach(b=>b.onclick=()=>{condition[b.dataset.key]=+b.dataset.v;renderCondition();saveDaily()});
  $$('input[type=file][data-view]').forEach(inp=>inp.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;await photoPut(`${monthKey()}:${e.target.dataset.view}`,f);renderPhotos()});
  $$('[data-del-photo]').forEach(b=>b.onclick=async()=>{await photoDel(`${monthKey()}:${b.dataset.delPhoto}`);renderPhotos()});
  $('#copyReport').onclick=async()=>{const t=summary();try{await navigator.clipboard.writeText(t);$('#copyStatus').textContent='月次サマリーをコピーしました'}catch{$('#copyStatus').textContent=t}};
  window.addEventListener('sug:native-health',e=>applyHealth(e.detail));
  window.addEventListener('storage',e=>{if([HEALTH,QUEST,DAILY,PREF].includes(e.key))renderAll()});
  applyHealth(window.__SUG_NATIVE_HEALTH__||j(HEALTH,{}));
  renderAll();
}
window.SuGBodyLite={version:V,receiveNative:applyHealth,render:renderAll,summary,record};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();