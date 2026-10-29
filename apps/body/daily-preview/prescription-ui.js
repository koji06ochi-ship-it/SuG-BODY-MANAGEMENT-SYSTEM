'use strict';
// Extend the existing Today menu, preserving the existing data and recording flow.
const prescriptionControls=document.createElement('div');prescriptionControls.innerHTML='<label>提案方法<select id="prescriptionMode"><option value="regular">通常メニュー・前回実績から</option><option value="531">保存した5/3/1計画から</option></select></label><label>増量を試す場合の刻み kg<input id="prescriptionIncrement" type="number" min="0.25" max="10" step="0.25" value="2.5"></label><div id="prescription531" hidden><label>計画<select id="prescriptionPlan"></select></label><label>確認する週<select id="prescriptionWeek"><option value="0">Week 1 · 5回</option><option value="1">Week 2 · 3回</option><option value="2">Week 3 · 5/3/1回</option><option value="3">Week 4 · 軽い週</option></select></label></div>';
$('#buildDailyMenu').before(prescriptionControls);
const rationale=document.createElement('details');rationale.innerHTML='<summary>提案の理由・オーバーロード・5/3/1</summary><p>オーバーロードは毎回の増量ではなく、適応に合わせて刺激を調整する考え方です。通常候補では直近14日内かつ実施間隔14日以内の異なる2日で同じ条件・重量・セット数を確認し、各セットが候補回数より2回以上多く、余裕・フォーム・痛みの記録が揃った場合だけ刻み重量を提案します。上げ幅が10%を超えると据え置きます。これは保守的なアプリ内ルールで、個別に医学的検証された処方ではありません。</p><p>5/3/1はTMと週ごとの割合で負荷を変え、軽い週も含めて続ける方式です。通常の増量候補は重ねません。「＋」は限界までの強制ではなく、動作を保てる範囲の実績を記録します。週は自分で選び、保存しただけで次週・次周期に進めません。</p><p>目標が筋肉づくりなら既存メニューのセット数を基準に、その他の目標はまず2セットまで。30分枠は3種目まで。初回重量は体重から推定せず本人確認とします。</p><a href="https://acsm.org/resistance-training-guidelines-update-2026/" target="_blank" rel="noopener">ACSM 2026：目的・個人に合わせた負荷</a> ／ <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11209834/" target="_blank" rel="noopener">AHA：反復実績に応じた段階的増量</a>';
menuPanel.append(rationale);
let prescriptionPending=null;
const prescriptionConfirm=document.createElement('button');prescriptionConfirm.type='button';prescriptionConfirm.hidden=true;prescriptionConfirm.textContent='入力中の内容を置き換えて提案を呼び出す';menuPanel.append(prescriptionConfirm);
function applyPrescription(p){prescriptionPending=null;prescriptionConfirm.hidden=true;if(p.plan){loadPlanDraft(p.plan,p.week);show('training');return}clearWorkoutEditing();activePlanContext=null;drawPlanContext();form.reset();form.elements.date.value=day();form.elements.exercise.value=p.name;form.elements.condition.value=p.condition;form.elements.memo.value=('今日の提案：'+p.status+'。'+p.reason+' 参照ID：'+p.sourceIds.join(',')).slice(0,1000);$('#trainingSets').replaceChildren();for(const s of p.sets)addSet(s.kg===null?'':s.kg,s.reps);previewTraining();show('training');notify('提案を入力しました。実施した内容に直して保存してください。')}
function requestPrescription(p){const entered=form.elements.exercise.value||form.elements.condition.value||Array.from($('#trainingSets input')).some(x=>x.value!=='');if(entered){prescriptionPending=p;prescriptionConfirm.hidden=false;notify('入力中の内容があります。提案欄の置き換えボタンで確認してください。')}else applyPrescription(p)}
prescriptionConfirm.onclick=()=>{const p=prescriptionPending;prescriptionPending=null;prescriptionConfirm.hidden=true;if(p)applyPrescription(p)};
function prescriptionRow(title,description,action){const row=document.createElement('div'),h=document.createElement('b'),p=document.createElement('p');h.textContent=title;p.textContent=description;row.append(h,p);if(action){const b=document.createElement('button');b.type='button';b.textContent='内容を確認して実施記録へ';b.onclick=action;row.append(b)}$('#dailyMenuItems').append(row)}
function drawPrescription(){
 const area=$('#menuArea').value,minutes=Number($('#menuMinutes').value),goal=data.profile.goal;
 const entries=existingBodyMenu[area].slice(0,minutes<=30?3:4).map(([name,sets,reps])=>({name,sets:Math.min(sets,goal==='筋肉をつけたい'?(minutes<=30?3:sets):2),reps}));
 const out=BodyPrescription.build(data,day(),entries,$('#prescriptionIncrement').value);
 $('#dailyMenuItems').replaceChildren();prescriptionPending=null;prescriptionConfirm.hidden=true;
 text('#dailyMenuReason',out.reasons.join(' '));text('#planText',({input:'基本情報・回復を保存すると今日の提案が変わります。',care:'今日は痛みの確認を先に。',recovery:'今日は回復を優先する候補です。',light:'今日は増量を控え、量を抑える候補です。',normal:'目標と実績から、今日の内容と次回の調整を確認。'})[out.mode]);
 if(!['normal','light'].includes(out.mode)){prescriptionRow('先に確認すること',out.reasons.join(' '),()=>show(out.mode==='care'?'care':out.missing.includes('基本情報')?'record':'recovery'));return}
 if($('#prescriptionMode').value==='531'){
 const p=(data.trainingPlans||[]).find(x=>x.id===$('#prescriptionPlan').value),week=Number($('#prescriptionWeek').value);
 if(out.mode==='light'){prescriptionRow('今日は計画の重量を自動入力しません','回復・活動量の理由を確認し、休養や負荷の調整を検討してください。');return}
 if(!p){prescriptionRow('保存した計画がありません','TM・器具条件を確認して5/3/1計画を保存してください。',()=>{show('training');plan.open=true});return}
 const last=(data.workouts||[]).filter(r=>r.name===p.name&&r.condition===p.condition&&r.day<=day()).sort((a,b)=>b.day.localeCompare(a.day)||b.at.localeCompare(a.at))[0];
 if(last?.pain&&last.pain!=='なし'){prescriptionRow('この種目の痛みを先に確認','直近の実績に痛みがあるため、計画重量の呼び出しを止めています。',()=>show('care'));return}
 if((data.workouts||[]).some(r=>r.day===day()&&r.planId===p.id&&r.planWeek===String(week+1))){prescriptionRow('今日はこの週の実績を記録済み','追加実施を自動提案せず、保存した内容を確認します。',()=>show('record'));return}const sets=plannedSets(p.tm,week,p.increment);if(sets.some(s=>s.kg<=0)){prescriptionRow('計画の刻みを確認','切り下げ後の重量が0kgになるため、計画設定を見直してください。');return}prescriptionRow(p.name+' · Week '+(week+1),sets.map(s=>s.kg+'kg × '+s.reps+'回').join(' ／ ')+'。TM '+p.tm+'kg。端数は設定刻みで切り下げ。＋セットの実回数は実施後に記録。',()=>requestPrescription({plan:p,week}));return;
 }
 for(const entry of out.entries){const done=(data.workouts||[]).some(r=>r.day===day()&&r.name===entry.name);prescriptionRow(entry.name+' · '+(done?'今日は記録済み':entry.status),done?'今日の実績を保存済みです。重ねて提案せず、日別記録で確認してください。':entry.sets.map(s=>(s.kg===null?'重量確認':s.kg+'kg')+' × '+s.reps+'回').join(' ／ ')+'。'+entry.reason,done?()=>{show('record');$('#journalDate').value=day();drawJournal()}:entry.sets.length?()=>requestPrescription(entry):()=>show(entry.status==='ケア確認'?'care':'training'))}
}
function refreshPrescription(){const selected=$('#prescriptionPlan').value;$('#prescriptionPlan').replaceChildren();for(const p of data.trainingPlans||[]){const o=document.createElement('option');o.value=p.id;o.textContent=p.name+'／'+p.condition+'／TM '+p.tm+'kg';$('#prescriptionPlan').append(o)}if((data.trainingPlans||[]).some(p=>p.id===selected))$('#prescriptionPlan').value=selected;drawPrescription()}
$('#buildDailyMenu').onclick=drawPrescription;
for(const id of ['menuArea','menuMinutes','prescriptionMode','prescriptionIncrement','prescriptionPlan','prescriptionWeek'])$('#'+id).addEventListener('change',()=>{$('#prescription531').hidden=$('#prescriptionMode').value!=='531';drawPrescription()});
const renderBeforePrescription=render;render=function(){renderBeforePrescription();refreshPrescription()};
$('.training .chips span:last-child').textContent='記録に基づく提案';
refreshPrescription();
