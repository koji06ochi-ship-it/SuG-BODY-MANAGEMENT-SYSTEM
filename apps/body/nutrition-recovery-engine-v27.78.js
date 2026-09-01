(()=>{
'use strict';
const VERSION='27.78';
const KEY='sug_nutrition_v2778';
const state={daily:null,targets:null,health:null};
const n=v=>Number.isFinite(Number(v))?Number(v):null;
const ratio=(v,t)=>{v=n(v);t=n(t);return v!=null&&t>0?v/t:null};
const pct=r=>r==null?'--':Math.round(r*100)+'%';
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x){state.daily=x.daily||null;state.targets=x.targets||null}}catch(_){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({daily:state.daily,targets:state.targets}))}catch(_){}}
function get(d,...keys){for(const k of keys){const v=n(d?.[k]);if(v!=null)return v}return null}
function getTarget(...keys){return get(state.targets,...keys)}
function labFlag(names){const labs=state.health?.recentLabResults||state.health?.labResults||[];if(!Array.isArray(labs))return null;const hit=labs.find(x=>names.some(k=>String(x?.name||'').toLowerCase().includes(k)));if(!hit)return null;const i=String(hit.interpretation||'').toLowerCase();const abnormal=/high|low|abnormal|positive|h\b|l\b|高|低|異常/.test(i);return abnormal?hit:null}
function analyze(){const d=state.daily||{},h=state.health||{};const t=state.targets||{};const rows=[
['エネルギー','kcal',['kcal','energyKcal'],['kcal','energyKcal','targetKcal']],
['たんぱく質','g',['proteinG','protein'],['proteinG','protein','targetProteinG']],
['脂質','g',['fatG','fat'],['fatG','fat','targetFatG']],
['炭水化物','g',['carbsG','carbs'],['carbsG','carbs','targetCarbsG']],
['食物繊維','g',['fiberG','fiber'],['fiberG','fiber','targetFiberG']],
['水分','ml',['waterMl','fluidMl'],['waterMl','fluidMl','targetWaterMl']],
['カリウム','mg',['potassiumMg'],['potassiumMg','targetPotassiumMg']],
['カルシウム','mg',['calciumMg'],['calciumMg','targetCalciumMg']],
['マグネシウム','mg',['magnesiumMg'],['magnesiumMg','targetMagnesiumMg']],
['鉄','mg',['ironMg'],['ironMg','targetIronMg']],
['亜鉛','mg',['zincMg'],['zincMg','targetZincMg']],
['ビタミンD','µg',['vitaminDUg','vitaminDug'],['vitaminDUg','vitaminDug','targetVitaminDUg']]
];
const nutrients=[];const deficits=[];for(const [label,unit,vk,tk] of rows){const v=get(d,...vk);let target=null;for(const k of tk){target=getTarget(k);if(target!=null)break}const r=ratio(v,target);nutrients.push({label,unit,value:v,target,ratio:r});if(r!=null&&r<.8)deficits.push({label,ratio:r,severity:r<.6?'high':'moderate'})}
const notes=[];const swellingFactors=[];const kcal=nutrients[0],protein=nutrients[1],fat=nutrients[2],carbs=nutrients[3],water=nutrients[5];const rec=n(h.recoveryScore),stress=n(h.stressScore),exercise=n(h.exerciseMinutes),sodium=get(d,'sodiumMg','saltSodiumMg');const sodiumTarget=getTarget('sodiumMg','targetSodiumMg');
if(kcal.ratio!=null&&kcal.ratio<.8)notes.push('エネルギー摂取が目標より少ない。回復・パフォーマンス低下の候補として確認');
if(carbs.ratio!=null&&carbs.ratio<.75&&((exercise||0)>=30||(rec!=null&&rec<70)))notes.push('炭水化物が目標より少なく、運動/回復条件も考慮するとグリコーゲン回復不足の候補');
if(protein.ratio!=null&&protein.ratio<.8)notes.push('たんぱく質が目標未満。修復材料の不足候補として確認');
if(fat.ratio!=null&&fat.ratio<.7)notes.push('脂質が目標よりかなり少ない。長く続けず全体摂取を確認');
if(water.ratio!=null&&water.ratio<.8)notes.push('水分摂取が目標未満。むくみだけを理由にさらに水分を減らさない');
const sr=ratio(sodium,sodiumTarget);if(sr!=null&&sr>1.3)swellingFactors.push('塩分量が普段/目標より多い可能性 → 一時的な水分変動の候補');
if(carbs.ratio!=null&&carbs.ratio>1.25)swellingFactors.push('炭水化物量が多い日 → グリコーゲンと水分による一時的な体重・張り変化の候補');
if((stress!=null&&stress>=70)||(rec!=null&&rec<60))swellingFactors.push('回復不足/高ストレス → 張り・疲労感が残る背景として確認');
const labLinks=[];if(deficits.some(x=>x.label==='鉄')){const l=labFlag(['ferritin','フェリチン','iron','鉄','hemoglobin','ヘモグロビン','hb']);if(l)labLinks.push('鉄摂取不足候補＋血液検査にも要確認サインあり')}
if(deficits.some(x=>x.label==='ビタミンD')){const l=labFlag(['25-oh','vitamin d','ビタミンd']);if(l)labLinks.push('ビタミンD摂取不足候補＋血液検査にも要確認サインあり')}
if(!state.daily)notes.push('食事データ未連携。写真AI/手入力からkcal・PFC・水分・微量栄養素を受け取る準備済み');
if(!state.targets)notes.push('目標値未設定。個人目標を設定すると不足栄養素を「目標比」で判定');
return{version:VERSION,nutrients,deficits,notes,swellingFactors,labLinks,generatedAt:new Date().toISOString()}}
function style(){if(document.getElementById('sugNutritionStyle2778'))return;const s=document.createElement('style');s.id='sugNutritionStyle2778';s.textContent=`.sugNut{margin-top:12px;border:1px solid #34404a;border-radius:14px;background:#0d1013;overflow:hidden}.sugNut summary{list-style:none;cursor:pointer;padding:12px 13px;font-size:10px;font-weight:900;color:#cfe8f7}.sugNut summary::-webkit-details-marker{display:none}.sugNut summary:after{content:'＋';float:right;color:#71818c}.sugNut[open] summary:after{content:'−'}.sugNutIn{padding:0 13px 13px}.sugNutTop{display:flex;gap:6px;overflow:auto}.sugNutChip{flex:0 0 auto;border:1px solid #2e4b5e;border-radius:999px;padding:7px 9px;background:#0b151c;color:#bcd9e8;font-size:8px}.sugNutLead{margin:10px 0 5px;color:#f0cc77;font-size:9px;font-weight:900}.sugNutItem{padding:7px 0;border-top:1px solid #24292d;color:#b5b9bd;font-size:9px;line-height:1.5}.sugNutBad{color:#ffc2d8}.sugNutFoot{margin-top:7px;color:#696d72;font-size:8px;line-height:1.5}`;document.head.appendChild(s)}
function target(){const panel=[...document.querySelectorAll('.panel')].find(p=>/RECOVERY/.test(p.textContent||''));return panel?.querySelector('.card')||panel||null}
function mount(){style();const t=target();if(!t||document.getElementById('sugNutrition2778'))return;const d=document.createElement('details');d.className='sugNut';d.id='sugNutrition2778';d.innerHTML=`<summary>食事・水分・不足栄養素</summary><div class="sugNutIn"><div class="sugNutTop" id="sugNutTop"></div><div class="sugNutLead">不足候補 / 回復への影響</div><div id="sugNutNotes"></div><div class="sugNutLead">むくみ・体重変動の候補</div><div id="sugNutSwelling"></div><div class="sugNutLead">血液検査とのクロスチェック</div><div id="sugNutLabs"></div><div class="sugNutFoot">不足は「摂取量÷個人目標」の目安。病気や欠乏症の診断はせず、検査値や症状がある場合は医療確認を優先します。</div></div>`;const ctx=document.getElementById('sugBodyContext2777');if(ctx)ctx.insertAdjacentElement('afterend',d);else t.appendChild(d)}
function render(){mount();const r=analyze();const top=document.getElementById('sugNutTop');if(top){const picks=['エネルギー','たんぱく質','炭水化物','水分'];top.innerHTML=picks.map(label=>{const x=r.nutrients.find(n=>n.label===label);return `<span class="sugNutChip">${label} ${pct(x?.ratio)}</span>`}).join('')}
const notes=[...r.deficits.slice(0,4).map(x=>`${x.label}：目標の${Math.round(x.ratio*100)}%`),...r.notes].slice(0,7);const set=(id,a,empty)=>{const e=document.getElementById(id);if(e)e.innerHTML=(a.length?a:[empty]).map(x=>`<div class="sugNutItem">${x}</div>`).join('')};set('sugNutNotes',notes,'大きな不足候補は未検出 / データ待ち');set('sugNutSwelling',r.swellingFactors,'食事由来の強い水分変動候補は未検出 / データ待ち');set('sugNutLabs',r.labLinks,'血液検査とのクロスチェック対象なし / データ待ち');try{window.SuGBodyContext?.setNutrition?.(r)}catch(_){}window.dispatchEvent(new CustomEvent('sug:nutrition-analysis',{detail:r}));return r}
function setDaily(p){state.daily=p||null;save();return render()}
function setTargets(p){state.targets=p||null;save();return render()}
function receiveHealth(p){state.health=p||null;return render()}
load();window.SuGNutrition={VERSION,setDaily,setTargets,receiveHealth,analyze,render};window.addEventListener('sug:native-health',e=>receiveHealth(e.detail));window.addEventListener('sug:nutrition',e=>setDaily(e.detail));if(window.__SUG_NATIVE_HEALTH__)state.health=window.__SUG_NATIVE_HEALTH__;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();