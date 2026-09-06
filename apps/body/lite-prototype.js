(()=>{'use strict';
const V='0.4.0',HEALTH='sug_native_health_v1',DAILY='sug_body_lite_daily_v1',PREF='sug_body_lite_pref_v1',QUEST='sug_walk_quest_v1',WATCH='sug_body_lite_watch_v1',LIFE='sug_body_lite_lifestyle_v1',FRAG='sug_body_lite_fragments_v1',CARDS='sug_body_lite_month_cards_v1',PHOTO_DB='sug_body_lite_photos_v1',PHOTO_STORE='photos';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const j=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const localDay=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=()=>localDay();
const monthKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const prevMonth=()=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);return monthKey(d)};
const n=v=>v===null||v===undefined||v===''?null:(Number.isFinite(Number(v))?Number(v):null);
let health=j(HEALTH,{}),pref=j(PREF,{mode:'community',watch:false}),watchState=j(WATCH,{lastLocation:null,lastActivityAt:null}),lifeAll=j(LIFE,{}),watchId=null,lastQuestSignature='';
const prior=j(DAILY,[]).find(x=>x.date===today())||{};
let condition={fatigue:prior.condition?.fatigue??null,pain:prior.condition?.pain??null,subjective:prior.condition?.subjective??null};
let lifestyle={stretchMinutes:0,waterL:0,nutrition:'',...(lifeAll[today()]||{})};
const TREASURES=[
{id:'okitsu',name:'沖津鏡',icon:'◉',label:'歩数',desc:'今日の歩みを映す鏡。',test:r=>(n(r.health?.steps)||0)>=5000},
{id:'hetsu',name:'辺津鏡',icon:'◎',label:'外出',desc:'外の世界へ踏み出した証。',test:r=>!!r.watch?.locationRecorded||(n(r.quest?.routeCount)||0)>0},
{id:'yatsuka',name:'八握剣',icon:'⚔',label:'ストレッチ',desc:'身体を整え、動く力をつくる剣。',test:r=>(n(r.lifestyle?.stretchMinutes)||0)>=5},
{id:'ikutama',name:'生玉',icon:'●',label:'水分',desc:'生命を巡らせる玉。',test:r=>(n(r.lifestyle?.waterL)||0)>=1.5},
{id:'shikaeshi',name:'死返玉',icon:'◍',label:'栄養',desc:'使った力を取り戻す玉。',test:r=>r.lifestyle?.nutrition==='good'},
{id:'tarutama',name:'足玉',icon:'◆',label:'QUEST参加',desc:'目的地へ向かう力を宿す玉。',test:r=>!!r.quest?.participated},
{id:'michikaeshi',name:'道返玉',icon:'◇',label:'睡眠',desc:'乱れた身体を元の道へ戻す玉。',test:r=>(n(r.health?.sleepHours)||0)>=6.5},
{id:'hebi',name:'蛇比礼',icon:'〰',label:'疲労管理',desc:'無理を見極め、身体を守る比礼。',test:r=>n(r.condition?.fatigue)!=null&&n(r.condition?.fatigue)<=3},
{id:'hachi',name:'蜂比礼',icon:'✦',label:'痛み管理',desc:'身体の小さな警告に気づく比礼。',test:r=>n(r.condition?.pain)!=null&&n(r.condition?.pain)<=2},
{id:'kusagusa',name:'品物之比礼',icon:'❖',label:'体調',desc:'今日の身体全体を整える比礼。',test:r=>n(r.condition?.subjective)!=null&&n(r.condition?.subjective)>=3}
];
const RANKS=[
{min:0,title:'星を見上げる旅人',story:'今日の一歩が、物語の始まり。',chapter:'第一章'},
{min:3.5,title:'継続の勇者',story:'続けた日数が、自分の力になる。',chapter:'第二章'},
{min:5.5,title:'神宝の守り手',story:'身体を知り、行動を選べる者。',chapter:'第三章'},
{min:7.5,title:'星導の武者',story:'星を標に、己の道を進む。',chapter:'第四章'},
{min:9,title:'十種神宝の継承者',story:'十の神宝を整え、自らの物語を歩む者。',chapter:'終章'}
];
function db(){return new Promise((res,rej)=>{const r=indexedDB.open(PHOTO_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(PHOTO_STORE))r.result.createObjectStore(PHOTO_STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function photoPut(k,v){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(PHOTO_STORE,'readwrite');t.objectStore(PHOTO_STORE).put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
async function photoGet(k){const d=await db();return new Promise((res,rej)=>{const r=d.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).get(k);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
async function photoDel(k){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(PHOTO_STORE,'readwrite');t.objectStore(PHOTO_STORE).delete(k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
function healthValue(...keys){for(const k of keys){if(health?.[k]!=null&&n(health[k])!=null)return n(health[k])}return null}
function rawQuest(){const q=j(QUEST,{});return String(q.date||'')===today()?q:{date:today(),steps:0,points:0,checkins:[],route:[],event:false}}
function quest(){const q=rawQuest(),route=Array.isArray(q.route)?q.route:[],last=route.length?route[route.length-1]:null,checkins=Array.isArray(q.checkins)?q.checkins:[];return {date:q.date,checkins:checkins.length,checkinIds:checkins,points:n(q.points)||0,steps:n(q.steps),distanceKm:n(q.distanceKm),exerciseMinutes:n(q.exerciseMinutes),event:!!q.event,routeCount:route.length,lastLocation:last&&n(last.lat)!=null&&n(last.lng)!=null?{lat:n(last.lat),lng:n(last.lng),t:n(last.t)}:null,participated:checkins.length>0||(n(q.points)||0)>0||!!q.event}}
function latestLocation(){const own=watchState.lastLocation,q=quest().lastLocation;if(own&&q)return (n(own.t)||0)>=(n(q.t)||0)?own:q;return own||q||null}
function isTodayLocation(loc){const t=n(loc?.t);return t!=null&&localDay(new Date(t))===today()}
function lastActivityAt(){const candidates=[watchState.lastActivityAt,health?.syncedAt,quest().lastLocation?.t].map(v=>typeof v==='number'?v:Date.parse(v||'')).filter(Number.isFinite);return candidates.length?Math.max(...candidates):null}
function currentHealth(){return {steps:healthValue('steps','stepCount'),distanceKm:healthValue('distanceKm'),exerciseMinutes:healthValue('exerciseMinutes'),activeEnergyKcal:healthValue('activeEnergyKcal'),sleepHours:healthValue('sleep','sleepHours'),heartRate:healthValue('heartRate','latestHeartRate'),restingHeartRate:healthValue('restingHeartRate'),hrvMs:healthValue('hrv','hrvMs'),weightKg:healthValue('weight','weightKg')}}
function record(){const q=quest(),loc=latestLocation();return {date:today(),mode:pref.mode,health:currentHealth(),condition:{...condition},lifestyle:{...lifestyle},quest:{checkins:q.checkins,points:q.points,participated:q.participated,event:q.event,routeCount:q.routeCount},watch:{enabled:!!pref.watch,lastActivityAt:lastActivityAt(),locationRecorded:isTodayLocation(loc)},syncedAt:health?.syncedAt||new Date().toISOString()}}
function treasureState(r=record()){const states=TREASURES.map(t=>({...t,on:!!t.test(r)}));return {states,count:states.filter(x=>x.on).length}}
function rankFor(avg){let rank=RANKS[0];for(const r of RANKS)if(avg>=r.min)rank=r;return {...rank,level:RANKS.indexOf(rank)+1}}
function stars(level){return `${'★'.repeat(level)}${'☆'.repeat(5-level)}`}
function saveDaily(){const r=record(),all=j(DAILY,[]).filter(x=>x.date!==r.date);all.unshift(r);localStorage.setItem(DAILY,JSON.stringify(all.slice(0,365)));window.dispatchEvent(new CustomEvent('sug:body-lite-change',{detail:r}))}
function saveLifestyle(){lifeAll={...j(LIFE,{}),[today()]:{...lifestyle}};localStorage.setItem(LIFE,JSON.stringify(lifeAll));saveDaily();renderAll()}
function saveWatch(){localStorage.setItem(WATCH,JSON.stringify(watchState));window.dispatchEvent(new CustomEvent('sug:body-lite-watch-change',{detail:{...watchState,enabled:pref.watch}}))}
function avg(xs,key){const vs=xs.map(x=>key.split('.').reduce((o,k)=>o?.[k],x)).map(n).filter(v=>v!=null);return vs.length?vs.reduce((a,b)=>a+b,0)/vs.length:null}
function monthStats(key){const xs=j(DAILY,[]).filter(x=>String(x.date||'').startsWith(key));const stateRows=xs.map(x=>treasureState(x).states);const treasureCounts=stateRows.map(s=>s.filter(x=>x.on).length);const rates={};TREASURES.forEach(t=>{rates[t.id]=stateRows.length?stateRows.filter(row=>row.find(x=>x.id===t.id)?.on).length/stateRows.length:0});const top=[...TREASURES].sort((a,b)=>(rates[b.id]||0)-(rates[a.id]||0))[0]||null;return {days:xs.length,steps:avg(xs,'health.steps'),exercise:avg(xs,'health.exerciseMinutes'),sleep:avg(xs,'health.sleepHours'),weight:avg(xs,'health.weightKg'),questDays:xs.filter(x=>x.quest?.participated).length,outsideDays:xs.filter(x=>x.watch?.locationRecorded||x.quest?.routeCount>0).length,treasureAvg:treasureCounts.length?treasureCounts.reduce((a,b)=>a+b,0)/treasureCounts.length:null,treasureRates:rates,topTreasure:top&&stateRows.length?{id:top.id,name:top.name,label:top.label,rate:rates[top.id]}:null}}
function delta(cur,prev,digits=0){if(cur==null||prev==null)return '--';const d=cur-prev;return `${d>=0?'+':''}${d.toFixed(digits)}`}
function fmt(v,suffix='',digits=0){return v==null?'--':`${Number(v).toFixed(digits)}${suffix}`}
function modeLabel(){return ({community:'地域・健康',senior:'高齢者・見守り',sports:'スポーツ'})[pref.mode]||'地域・健康'}
function renderHealth(){const h=currentHealth();$('#mSteps').textContent=h.steps==null?'--':Math.round(h.steps).toLocaleString();$('#mDistance').textContent=fmt(h.distanceKm,' km',2);$('#mExercise').textContent=fmt(h.exerciseMinutes,' 分');$('#mSleep').textContent=fmt(h.sleepHours,' 時間',1);$('#mHeart').textContent=fmt(h.restingHeartRate??h.heartRate,' bpm');$('#mWeight').textContent=fmt(h.weightKg,' kg',1);$('#syncStatus').textContent=health?.syncedAt?`最終同期 ${new Date(health.syncedAt).toLocaleString('ja-JP')}`:'Healthデータ未同期'}
function renderLifestyle(){$('#stretchMinutes').value=lifestyle.stretchMinutes||'';$('#waterL').value=lifestyle.waterL||'';$('#nutrition').value=lifestyle.nutrition||''}
function renderTreasures(){const {states,count}=treasureState();$('#treasureGrid').innerHTML=states.map(t=>`<div class="treasure ${t.on?'on':''}"><div class="relic">${t.icon}</div><div><b>${t.name}</b><small>${t.label}｜${t.desc}</small><div class="ok">${t.on?'● 本日装備':'○ まだ眠っている'}</div></div></div>`).join('');$('#treasureCount').textContent=`${count}/10`;$('#treasureProgress').style.width=`${count*10}%`;const level=Math.max(1,Math.min(5,Math.ceil(count/2)));$('#todayStars').textContent=stars(level);$('#todayRank').textContent=count===10?'十種神宝、すべて装備':`${count}つの神宝が目覚めています`;const missing=states.filter(x=>!x.on).slice(0,3).map(x=>x.label).join('・');$('#todayHint').textContent=count===10?'今日は十の神宝がすべてそろいました。':missing?`次に狙う：${missing}`:'今日の行動で神宝が光ります。'}
function renderQuest(){const q=quest();$('#qCheckins').textContent=q.checkins;$('#qPoints').textContent=q.points.toLocaleString();$('#qStatus').textContent=q.participated?'参加あり':'本日未参加';$('#qRoute').textContent=q.routeCount?`${q.routeCount}地点`:'未記録'}
function renderWatch(){const loc=latestLocation(),at=lastActivityAt();$('#watch').checked=!!pref.watch;$('#watchState').textContent=pref.watch?(watchId!=null?'ON｜位置更新中':'ON｜許可待ち/停止中'):'OFF';$('#lastActivity').textContent=at?new Date(at).toLocaleString('ja-JP'):'--';$('#lastLocation').textContent=loc?`${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`:'--';$('#locationAccuracy').textContent=loc?.accuracy!=null?`精度 約${Math.round(loc.accuracy)}m`:'QUEST位置を含む';$('#openMap').disabled=!loc}
function renderMonth(){const c=monthStats(monthKey()),p=monthStats(prevMonth()),rank=rankFor(c.treasureAvg??0);$('#monthTreasureAvg').textContent=c.treasureAvg==null?'--':`${c.treasureAvg.toFixed(1)}/10`;$('#monthSteps').textContent=c.steps==null?'--':Math.round(c.steps).toLocaleString();$('#monthStepsDelta').textContent=`前月比 ${delta(c.steps,p.steps,0)} 歩/日`;$('#monthQuest').textContent=c.questDays;$('#monthQuestDelta').textContent=`前月 ${p.questDays}日`;$('#monthOutside').textContent=c.outsideDays;$('#monthOutsideDelta').textContent=`前月 ${p.outsideDays}日`;$('#monthStars').textContent=stars(rank.level);$('#monthTitle').textContent=rank.title;$('#monthStory').textContent=rank.story;$('#monthRarity').textContent=rank.chapter;$('#monthRelics').innerHTML=TREASURES.map(t=>`<div class="relicDot ${(c.treasureRates[t.id]||0)>=.5?'on':''}" title="${t.name} ${Math.round((c.treasureRates[t.id]||0)*100)}%">${t.icon}</div>`).join('')}
function renderMode(){$('#mode').value=pref.mode;$('#modeBadge').textContent=modeLabel();renderWatch()}
function renderCondition(){for(const key of ['fatigue','pain','subjective'])$$(`[data-key="${key}"]`).forEach(b=>b.classList.toggle('on',condition[key]===+b.dataset.v))}
async function renderPhotos(){const m=monthKey();for(const view of ['front','side','back']){const img=$(`#photo_${view}`),blob=await photoGet(`${m}:${view}`);if(blob){img.src=URL.createObjectURL(blob);img.classList.add('has')}else{img.removeAttribute('src');img.classList.remove('has')}}const hero=await photoGet(`hero:${m}`),heroImg=$('#heroPortrait'),ph=$('#portraitPlaceholder');if(hero){heroImg.src=URL.createObjectURL(hero);heroImg.classList.add('has');ph.style.display='none'}else{heroImg.removeAttribute('src');heroImg.classList.remove('has');ph.style.display='block'}}
function renderFragment(){const all=j(FRAG,{}),value=all[monthKey()]||'';if(document.activeElement!==$('#fragmentInput'))$('#fragmentInput').value=value;$('#fragmentStatus').textContent=value?'今月の人生の断片を保存済み':'まだ今月の断片はありません'}
function cardSnapshot(){const m=monthKey(),c=monthStats(m),rank=rankFor(c.treasureAvg??0),frag=j(FRAG,{})[m]||'',current=treasureState();return {month:m,version:1,title:rank.title,story:rank.story,chapter:rank.chapter,stars:rank.level,treasureAvg:c.treasureAvg,treasureRates:c.treasureRates,topTreasure:c.topTreasure,avgSteps:c.steps,questDays:c.questDays,outsideDays:c.outsideDays,recordDays:c.days,fragment:frag,todayEquipped:current.count,mode:pref.mode,savedAt:new Date().toISOString()}}
function cardText(s=cardSnapshot()){return [`S.u.G BODY Lite｜${s.month}`,`${stars(s.stars)} ${s.title}`,s.story,`平均神宝: ${s.treasureAvg==null?'--':s.treasureAvg.toFixed(1)} / 10`,`平均歩数: ${s.avgSteps==null?'--':Math.round(s.avgSteps).toLocaleString()} 歩/日`,`QUEST参加: ${s.questDays}日`,`外出: ${s.outsideDays}日`,s.topTreasure?`今月もっとも輝いた神宝: ${s.topTreasure.name}（${Math.round(s.topTreasure.rate*100)}%）`:null,s.fragment?`人生の断片: ${s.fragment}`:null].filter(Boolean).join('\n')}
function saveMonthCard(){const all=j(CARDS,{}),s=cardSnapshot();all[s.month]=s;localStorage.setItem(CARDS,JSON.stringify(all));$('#cardSaveStatus').textContent=`${s.month} のカードを家族の宝箱へ保存しました`;renderArchive()}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function renderArchive(){const box=$('#archiveGrid'),cards=Object.values(j(CARDS,{})).sort((a,b)=>String(b.month).localeCompare(String(a.month)));if(!cards.length){box.innerHTML='<div class="emptyBox" style="grid-column:1/-1">まだカードはありません。<br>今月のカードを保存すると、ここから人生の物語が始まります。</div>';return}box.innerHTML=cards.map(s=>`<article class="archiveCard"><div class="archiveMonth">${esc(s.month)}</div><div class="archiveStars">${stars(Math.max(1,Math.min(5,n(s.stars)||1)))}</div><div class="archiveTitle">${esc(s.title)}</div><div class="archiveMeta">神宝 ${s.treasureAvg==null?'--':Number(s.treasureAvg).toFixed(1)}/10<br>QUEST ${n(s.questDays)||0}日・外出 ${n(s.outsideDays)||0}日${s.topTreasure?`<br>最も輝いた神宝 ${esc(s.topTreasure.name)}`:''}</div>${s.fragment?`<div class="archiveFrag">「${esc(s.fragment)}」</div>`:''}</article>`).join('')}
function summary(){return cardText(cardSnapshot())}
function renderAll(){renderHealth();renderLifestyle();renderTreasures();renderQuest();renderMode();renderCondition();renderMonth();renderFragment();renderArchive();renderPhotos()}
function applyHealth(p){if(!p||typeof p!=='object')return;health={...health,...p};try{localStorage.setItem(HEALTH,JSON.stringify(health))}catch{};watchState.lastActivityAt=Date.now();saveWatch();saveDaily();renderAll()}
function stopWatch(){if(watchId!=null&&navigator.geolocation){navigator.geolocation.clearWatch(watchId);watchId=null}renderWatch()}
function startWatch(){if(!pref.watch)return stopWatch();if(!navigator.geolocation){$('#watchError').textContent='この端末では位置情報を利用できません';return}if(watchId!=null)return;$('#watchError').textContent='位置情報の許可を確認しています';watchId=navigator.geolocation.watchPosition(pos=>{watchState.lastLocation={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy,t:Date.now()};watchState.lastActivityAt=Date.now();saveWatch();saveDaily();$('#watchError').textContent='位置情報を更新しました';renderAll()},err=>{$('#watchError').textContent=err.code===1?'位置情報が許可されていません':'位置情報を取得できません';stopWatch()},{enableHighAccuracy:false,maximumAge:60000,timeout:15000});renderWatch()}
function questChanged(){const q=rawQuest(),sig=JSON.stringify({date:q.date,steps:q.steps,points:q.points,checkins:q.checkins,route:q.route,event:q.event});if(sig===lastQuestSignature)return;lastQuestSignature=sig;saveDaily();renderAll();window.dispatchEvent(new CustomEvent('sug:quest-change',{detail:quest()}))}
function boot(){
  $('#mode').onchange=e=>{pref.mode=e.target.value;localStorage.setItem(PREF,JSON.stringify(pref));saveDaily();renderAll()};
  $('#watch').onchange=e=>{pref.watch=!!e.target.checked;localStorage.setItem(PREF,JSON.stringify(pref));if(pref.watch)startWatch();else stopWatch();saveDaily();renderAll()};
  $('#refreshLocation').onclick=()=>{if(!pref.watch){$('#watchError').textContent='見守りモードをONにしてください';return}stopWatch();startWatch()};
  $('#openMap').onclick=()=>{const p=latestLocation();if(!p)return;window.open(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`,'_blank')};
  $$('.scale button').forEach(b=>b.onclick=()=>{condition[b.dataset.key]=+b.dataset.v;saveDaily();renderAll()});
  $('#stretchMinutes').onchange=e=>{lifestyle.stretchMinutes=Math.max(0,n(e.target.value)||0);saveLifestyle()};
  $('#waterL').onchange=e=>{lifestyle.waterL=Math.max(0,n(e.target.value)||0);saveLifestyle()};
  $('#nutrition').onchange=e=>{lifestyle.nutrition=e.target.value;saveLifestyle()};
  $('#saveFragment').onclick=()=>{const all=j(FRAG,{}),v=$('#fragmentInput').value.trim();all[monthKey()]=v;localStorage.setItem(FRAG,JSON.stringify(all));renderFragment()};
  $('#heroPhotoInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;await photoPut(`hero:${monthKey()}`,f);$('#cardSaveStatus').textContent='主人公写真を登録しました。イラスト化AI接続時の元画像として使えます。';renderPhotos()};
  $('#saveMonthCard').onclick=saveMonthCard;
  $('#copyCard').onclick=async()=>{const t=cardText();try{await navigator.clipboard.writeText(t);$('#cardSaveStatus').textContent='カード内容をコピーしました'}catch{$('#cardSaveStatus').textContent=t}};
  $$('input[type=file][data-view]').forEach(inp=>inp.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;await photoPut(`${monthKey()}:${e.target.dataset.view}`,f);renderPhotos()});
  $$('[data-del-photo]').forEach(b=>b.onclick=async()=>{await photoDel(`${monthKey()}:${b.dataset.delPhoto}`);renderPhotos()});
  $('#copyReport').onclick=async()=>{const t=summary();try{await navigator.clipboard.writeText(t);$('#copyStatus').textContent='月次サマリーをコピーしました'}catch{$('#copyStatus').textContent=t}};
  window.addEventListener('sug:native-health',e=>applyHealth(e.detail));
  window.addEventListener('storage',e=>{if([HEALTH,QUEST,DAILY,PREF,WATCH,LIFE,FRAG,CARDS].includes(e.key)){if(e.key===HEALTH)health=j(HEALTH,{});if(e.key===PREF)pref=j(PREF,pref);if(e.key===WATCH)watchState=j(WATCH,watchState);if(e.key===LIFE){lifeAll=j(LIFE,{});lifestyle={stretchMinutes:0,waterL:0,nutrition:'',...(lifeAll[today()]||{})}}questChanged();renderAll()}});
  window.addEventListener('pageshow',()=>{questChanged();if(pref.watch)startWatch();renderAll()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopWatch();else if(pref.watch)startWatch()});
  applyHealth(window.__SUG_NATIVE_HEALTH__||j(HEALTH,{}));
  questChanged();if(pref.watch)startWatch();setInterval(questChanged,2000);renderAll();
}
window.SuGBodyLite={version:V,receiveNative:applyHealth,render:renderAll,summary,record,quest,latestLocation,treasureState,rankFor,cardSnapshot,saveMonthCard,startWatch,stopWatch};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();