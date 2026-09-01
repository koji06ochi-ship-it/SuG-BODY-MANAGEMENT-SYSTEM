(()=>{
'use strict';
const VERSION='27.77';
const KEY='sug_body_context_v2777';
const state={health:null,feel:{swelling:false,tightness:false,soreness:false},nutrition:null,cycle:null};
const n=v=>Number.isFinite(Number(v))?Number(v):null;
const dayKey=d=>new Date(d||Date.now()).toISOString().slice(0,10);
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x?.feel)state.feel={...state.feel,...x.feel};if(x?.nutrition)state.nutrition=x.nutrition;if(x?.cycle)state.cycle=x.cycle}catch(_){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({feel:state.feel,nutrition:state.nutrition,cycle:state.cycle}))}catch(_){}}
function weightHistory(){try{return JSON.parse(localStorage.getItem('sug_weight_history_v2777')||'[]')}catch(_){return[]}}
function rememberWeight(h){const w=n(h?.weightKg??h?.weight);if(w==null)return;let a=weightHistory();const k=dayKey();a=a.filter(x=>x?.date&&x.date!==k);a.push({date:k,weight:w});a=a.slice(-14);try{localStorage.setItem('sug_weight_history_v2777',JSON.stringify(a))}catch(_){}}
function previousWeight(){const a=weightHistory();if(a.length<2)return null;const current=a[a.length-1];for(let i=a.length-2;i>=0;i--){if(a[i].date!==current.date)return n(a[i].weight)}return null}
function recentWorkout(h){const list=h?.recentWorkouts||h?.workouts||[];const now=Date.now();return Array.isArray(list)&&list.some(w=>{const t=Date.parse(w?.endDate||w?.startDate||'');return Number.isFinite(t)&&now-t>=0&&now-t<=48*3600*1000})}
function analyze(){const h=state.health||{};const candidates=[];const actions=[];const w=n(h.weightKg??h.weight);const prev=previousWeight();const delta=w!=null&&prev!=null?w-prev:null;const steps=n(h.steps);const ex=n(h.exerciseMinutes);const rec=n(h.recoveryScore);const stress=n(h.stressScore);const sleep=n(h.sleepHours??h.sleep);
if(delta!=null&&Math.abs(delta)>=0.4)candidates.push(`体重 ${delta>0?'+':''}${delta.toFixed(1)}kg：短期変動は脂肪だけでなく、水分・グリコーゲン・食事量なども候補`);
if(recentWorkout(h))candidates.push('直近48時間のトレーニング：刺激後の炎症・修復に伴う局所的な水分変化や張りを候補');
if((steps!=null&&steps>=15000)||(ex!=null&&ex>=60))candidates.push('活動量が高い：歩行・運動量による下肢疲労や張りを候補');
if((rec!=null&&rec<60)||(stress!=null&&stress>=70)||(sleep!=null&&sleep<6.5))candidates.push('回復条件に注意：睡眠不足・高ストレス時は張りや疲労感が残る可能性を考える');
if(state.feel.swelling)candidates.push('本人入力：むくみ感あり → 水分・塩分・炭水化物・ホルモン変動・活動量などを横断して確認');
if(state.feel.tightness)candidates.push('本人入力：張りあり → トレーニング後の局所反応や使い過ぎを確認');
if(state.feel.soreness)candidates.push('本人入力：筋肉痛あり → 回復状況と直近トレーニング負荷を確認');
if(!candidates.length)candidates.push('大きなサインは未検出。1日の見た目や体重だけで脂肪増加と判断しない');
actions.push('体重は1日ではなく週平均・中長期推移で見る');
actions.push('むくみだけを理由に炭水化物を即カットしない');
if((rec!=null&&rec<60)||(stress!=null&&stress>=70))actions.push('今日は負荷を落とす / CARE / 睡眠確保を優先候補にする');
return{version:VERSION,candidates,actions,weightDeltaKg:delta,generatedAt:new Date().toISOString()};}
function style(){if(document.getElementById('sugContextStyle2777'))return;const s=document.createElement('style');s.id='sugContextStyle2777';s.textContent=`.sugCtx{margin-top:12px;border:1px solid #3a3036;border-radius:14px;background:#0e0d10;overflow:hidden}.sugCtx summary{list-style:none;cursor:pointer;padding:12px 13px;font-size:10px;font-weight:900;color:#d9c7cf}.sugCtx summary::-webkit-details-marker{display:none}.sugCtx summary:after{content:'＋';float:right;color:#7f7f88}.sugCtx[open] summary:after{content:'−'}.sugCtxIn{padding:0 13px 13px}.sugCtxBtns{display:flex;gap:6px;flex-wrap:wrap}.sugCtxBtn{appearance:none;border:1px solid #49303c;border-radius:999px;background:#130e12;color:#cfa0b4;padding:8px 10px;font-size:9px}.sugCtxBtn.on{border-color:#ff78ad;color:#ffe0ec;background:#21131b}.sugCtxLead{margin:10px 0 6px;color:#f0cc77;font-size:10px;font-weight:900}.sugCtxItem{font-size:9px;line-height:1.55;color:#b8b2b7;padding:7px 0;border-top:1px solid #262329}.sugCtxItem:first-of-type{border-top:0}.sugCtxFoot{margin-top:8px;font-size:8px;line-height:1.55;color:#6f717a}`;document.head.appendChild(s)}
function target(){const recoveryPanel=[...document.querySelectorAll('.panel')].find(p=>/RECOVERY/.test(p.textContent||''));if(!recoveryPanel)return null;return recoveryPanel.querySelector('.card')||recoveryPanel}
function mount(){style();const t=target();if(!t||document.getElementById('sugBodyContext2777'))return;const d=document.createElement('details');d.className='sugCtx';d.id='sugBodyContext2777';d.innerHTML=`<summary>体重・むくみ・張りを確認</summary><div class="sugCtxIn"><div class="sugCtxBtns"><button class="sugCtxBtn" data-k="swelling">むくみ感</button><button class="sugCtxBtn" data-k="tightness">張り</button><button class="sugCtxBtn" data-k="soreness">筋肉痛</button></div><div class="sugCtxLead">原因候補</div><div id="sugCtxCandidates"></div><div class="sugCtxLead">今日の見方</div><div id="sugCtxActions"></div><div class="sugCtxFoot">体重増加＝脂肪、むくみ＝水の飲み過ぎ、張り＝筋肉がついた、とは限りません。単一の現象ではなく回復・活動・食事・水分などを合わせて判断します。</div></div>`;const score=t.querySelector('.scoregrid');if(score)score.insertAdjacentElement('afterend',d);else t.appendChild(d);d.querySelectorAll('[data-k]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.k;state.feel[k]=!state.feel[k];save();render()}));render()}
function render(){mount();const r=analyze();document.querySelectorAll('#sugBodyContext2777 [data-k]').forEach(b=>b.classList.toggle('on',!!state.feel[b.dataset.k]));const c=document.getElementById('sugCtxCandidates'),a=document.getElementById('sugCtxActions');if(c)c.innerHTML=r.candidates.map(x=>`<div class="sugCtxItem">${x}</div>`).join('');if(a)a.innerHTML=r.actions.map(x=>`<div class="sugCtxItem">→ ${x}</div>`).join('');window.dispatchEvent(new CustomEvent('sug:body-context',{detail:r}));return r}
function receiveHealth(p){state.health=p||null;rememberWeight(state.health);return render()}
function setNutrition(p){state.nutrition=p||null;save();return render()}
function setCycle(p){state.cycle=p||null;save();return render()}
load();window.SuGBodyContext={VERSION,receiveHealth,setNutrition,setCycle,analyze,render};window.addEventListener('sug:native-health',e=>receiveHealth(e.detail));if(window.__SUG_NATIVE_HEALTH__)receiveHealth(window.__SUG_NATIVE_HEALTH__);else{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render()}
})();