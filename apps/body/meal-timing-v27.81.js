(()=>{
'use strict';
const VERSION='27.81';
const KEY='sug_meal_timing_v2781';
const n=v=>Number.isFinite(Number(v))?Number(v):null;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const defaults={plan:'none',time:'18:00',session:'strength',durationMinutes:60};
function plan(){return{...defaults,...read(KEY,{})}}
function savePlan(next){const p={...plan(),...next};write(KEY,p);window.dispatchEvent(new CustomEvent('sug:meal-plan',{detail:p}));render();return p}
function health(){return window.__SUG_NATIVE_HEALTH__||{} }
function nextMeal(){try{return window.SuGNextMeal?.analyze?.()||window.__SUG_NEXT_MEAL__||null}catch{return window.__SUG_NEXT_MEAL__||null}}
function minutesFromNow(hhmm){if(!/^\d{2}:\d{2}$/.test(String(hhmm||'')))return null;const [hh,mm]=hhmm.split(':').map(Number),now=new Date(),target=new Date(now);target.setHours(hh,mm,0,0);return Math.round((target-now)/60000)}
function gapValue(r,key){const v=n(r?.gaps?.[key]);return v!=null?Math.max(0,v):null}
function amount(label,base,gap,unit='g'){
  if(gap==null)return `${label} ${base}${unit}前後`;
  if(gap<=5)return `${label} 1日目標はほぼ達成`;
  return `${label} ${Math.round(Math.min(base,gap))}${unit}前後`;
}
function analyze(){
  const p=plan(),h=health(),meal=nextMeal(),recovery=n(h.recoveryScore),stress=n(h.stressScore),mins=minutesFromNow(p.time),duration=clamp(n(p.durationMinutes)||60,15,240);
  const carbGap=gapValue(meal,'carbsG'),proteinGap=gapValue(meal,'proteinG'),waterGap=gapValue(meal,'waterMl');
  let phase='REST',headline='今日は通常配分でOK',note='次の食事は1日の不足量を優先。';
  let carbBase=35,proteinBase=25,waterBase=400;
  if(p.session==='cardio'){carbBase=40;proteinBase=20}
  if(p.session==='stage'){carbBase=30;proteinBase=20}
  if(duration>=75)carbBase+=15;
  if(duration>=105)carbBase+=10;
  if(recovery!=null&&recovery<60)carbBase+=10;
  const items=[];
  if(p.plan==='none'){
    items.push('トレ予定なし：今日の残りPFC・水分を普段の食事で埋める');
    if((recovery!=null&&recovery<60)||(stress!=null&&stress>=70))items.unshift('回復低下中：さらに削るより、睡眠とエネルギー確保を優先');
  }else if(p.plan==='stage'){
    phase='STAGE';
    if(mins!=null&&mins>180){headline='本番3時間以上前';note='普段食べ慣れた食事を中心に、急な変更を避ける。'}
    else if(mins!=null&&mins>60){headline='本番1〜3時間前';note='消化しやすい炭水化物＋少量のたんぱく質を中心に。'}
    else if(mins!=null&&mins>=0){headline='本番60分以内';note='新しい食品・大量摂取は避け、必要なら少量で調整。'}
    else{headline='本番時刻を過ぎています';note='終了後は水分・食事を通常の回復へ戻す。'}
    items.push(amount('C',carbBase,carbGap));
    items.push(amount('P',proteinBase,proteinGap));
    items.push(amount('水分',waterBase,waterGap,'ml'));
    items.push('極端な水抜き・塩抜き・炭水化物カットは自動提案しない');
  }else{
    if(mins==null){phase='PLAN';headline='トレ時刻を設定';note='時刻を入れるとトレ前/後へ自動配分する。'}
    else if(mins>180){phase='EARLY';headline='トレ3時間以上前';note='通常の食事。直前用に炭水化物を一部残す。'}
    else if(mins>60){phase='PRE';headline='トレ1〜3時間前';note='炭水化物＋たんぱく質を優先。脂質は重くしすぎない。'}
    else if(mins>=0){phase='PRE_LIGHT';headline='トレ60分以内';note='消化しやすい少量の炭水化物中心。'}
    else if(mins>=-120){phase='POST';headline='トレ後2時間以内';note='たんぱく質＋炭水化物＋水分で回復へ。'}
    else{phase='POST_LATE';headline='トレ終了後';note='次の通常食で不足分を回収する。'}
    let c=carbBase,pb=proteinBase,w=waterBase;
    if(phase==='PRE_LIGHT'){c=Math.max(15,Math.round(c*.55));pb=Math.max(10,Math.round(pb*.55));w=300}
    if(phase==='POST'){c+=10;pb=Math.max(25,pb);w=500}
    if(phase==='EARLY'){c=Math.max(25,Math.round(c*.8));w=400}
    items.push(amount('C',c,carbGap));
    items.push(amount('P',pb,proteinGap));
    items.push(amount('水分',w,waterGap,'ml'));
    if((recovery!=null&&recovery<60)||(stress!=null&&stress>=70))items.push('回復低下中：トレ前後の食事を削って帳尻合わせしない');
  }
  const confidence=meal?.daily&&meal?.targets?'HIGH':meal?.daily||meal?.targets?'MEDIUM':'LOW';
  return{version:VERSION,plan:p,phase,headline,note,items:items.slice(0,5),minutesToEvent:mins,recovery,stress,confidence,generatedAt:new Date().toISOString()};
}
function style(){if(document.getElementById('sugMealTimingStyle2781'))return;const s=document.createElement('style');s.id='sugMealTimingStyle2781';s.textContent=`.sugMealTiming{margin-top:11px;border-top:1px solid #272a2f;padding-top:11px}.sugTimingHead{display:flex;justify-content:space-between;gap:8px;align-items:center}.sugTimingTitle{font-size:8px;font-weight:1000;letter-spacing:.12em;color:#59baff}.sugTimingBadge{border:1px solid #2b4d63;border-radius:999px;padding:5px 7px;background:#0b151c;color:#cfeeff;font-size:7px}.sugTimingMain{margin-top:7px;color:#f3f4f6;font-size:12px;font-weight:900}.sugTimingNote{margin-top:4px;color:#858791;font-size:8px;line-height:1.55}.sugTimingItems{display:flex;gap:6px;overflow:auto;margin-top:8px}.sugTimingChip{flex:0 0 auto;border:1px solid #49303c;border-radius:999px;background:#130e12;color:#ffd0e2;padding:6px 8px;font-size:8px}.sugTimingForm{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.sugTimingForm label{font-size:7px;color:#747781}.sugTimingForm select,.sugTimingForm input{width:100%;margin-top:4px;border:1px solid #303139;border-radius:9px;background:#0d0d10;color:#fff;padding:9px;font-size:10px}.sugTimingSave{width:100%;margin-top:8px;border:1px solid #31556d;border-radius:10px;background:#0d1820;color:#cfeeff;padding:10px;font-size:9px;font-weight:900}`;document.head.appendChild(s)}
function host(){return document.getElementById('sugNextMeal2780')||document.querySelector('#sugNutrition2778 .sugNutIn')||document.getElementById('sugNutrition2778')}
function mount(){style();const h=host();if(!h||document.getElementById('sugMealTiming2781'))return;const box=document.createElement('div');box.id='sugMealTiming2781';box.className='sugMealTiming';box.innerHTML=`<div class="sugTimingHead"><div class="sugTimingTitle">MEAL TIMING · いつ何を入れる？</div><span id="sugTimingBadge2781" class="sugTimingBadge">--</span></div><div id="sugTimingMain2781" class="sugTimingMain">予定を確認中</div><div id="sugTimingNote2781" class="sugTimingNote"></div><div id="sugTimingItems2781" class="sugTimingItems"></div><details class="details" style="margin-top:8px"><summary>今日の予定を設定</summary><div class="inside"><div class="sugTimingForm"><label>予定<select id="sugTimingPlan2781"><option value="none">休養 / 予定なし</option><option value="training">トレーニング</option><option value="stage">大会・撮影・本番</option></select></label><label>時刻<input id="sugTimingTime2781" type="time"></label><label>内容<select id="sugTimingSession2781"><option value="strength">筋トレ</option><option value="cardio">有酸素</option><option value="stage">本番調整</option></select></label><label>予定時間（分）<input id="sugTimingDuration2781" type="number" min="15" max="240" step="15"></label></div><button id="sugTimingSave2781" class="sugTimingSave">予定を保存</button></div></details>`;h.appendChild(box);document.getElementById('sugTimingSave2781').onclick=saveFromForm;fill();render()}
function fill(){const p=plan(),pairs=[['sugTimingPlan2781',p.plan],['sugTimingTime2781',p.time],['sugTimingSession2781',p.session],['sugTimingDuration2781',p.durationMinutes]];for(const [id,v] of pairs){const e=document.getElementById(id);if(e)e.value=v}}
function saveFromForm(){const val=id=>document.getElementById(id)?.value;savePlan({plan:val('sugTimingPlan2781')||'none',time:val('sugTimingTime2781')||'18:00',session:val('sugTimingSession2781')||'strength',durationMinutes:clamp(n(val('sugTimingDuration2781'))||60,15,240)})}
function render(){mount();const r=analyze(),main=document.getElementById('sugTimingMain2781'),note=document.getElementById('sugTimingNote2781'),items=document.getElementById('sugTimingItems2781'),badge=document.getElementById('sugTimingBadge2781');if(main)main.textContent=r.headline;if(note)note.textContent=r.note;if(badge)badge.textContent=r.phase;if(items)items.innerHTML=r.items.map(x=>`<span class="sugTimingChip">${x}</span>`).join('');window.__SUG_MEAL_TIMING__=r;window.dispatchEvent(new CustomEvent('sug:meal-timing',{detail:r}));return r}
const refresh=()=>setTimeout(render,40);window.addEventListener('sug:next-meal',refresh);window.addEventListener('sug:nutrition-analysis',refresh);window.addEventListener('sug:native-health',refresh);window.addEventListener('sug:food-photo-result',refresh);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(render,260),{once:true});else setTimeout(render,260);window.SuGMealTiming={VERSION,analyze,render,plan,savePlan};
})();