/* Reference-screen content adapter. Original calculators, forms and storage own all writes. */
(()=>{'use strict';
const $=s=>document.querySelector(s),app=()=>window.EVOLINK_APP;
const supported=new Set(['home','training','nutrition','mirror','coach','adapt']);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={home:'M3 11 12 3l9 8v10h-6v-7H9v7H3z',training:'M3 9v6m4-9v12m10-12v12m4-9v6M7 12h10',nutrition:'M4 3v7m3-7v18m3-18v7M4 10h6m8-7v18m0-18c6 3 6 9 0 10',mirror:'M3 7h5l2-3h4l2 3h5v14H3z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',coach:'M21 11c0 5-4 8-9 8H9l-6 3 2-6a8 8 0 0 1-2-5c0-5 4-8 9-8s9 3 9 8z M8 11h.1m3.9 0h.1m3.9 0h.1',adapt:'M3 21v-6h4v6m4 0V11h4v10m4 0V7h3v14 M3 10l6-5 5 2 7-5m-5 0h5v5',settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',calendar:'M3 5h18v16H3zM7 2v6m10-6v6M3 10h18',record:'M5 4h14v17H5zM8 8h8m-8 4h8m-8 4h6',rest:'M3 8v13m0-5h18v5M6 10h6v6H6zm7-2h8v8h-8z'};
Object.assign(icons,{steps:'M10 7c-2-4 2-6 3-3 1 2 0 4-1 5z M8 11l3 2-2 7H6l2-6-3-1 1-4m7 1 3 4h4m-8 0 4 7',flame:'M13 2c2 7-4 8-2 12 3-1 5-4 5-6 8 10 2 15-4 15S1 18 5 11c0 4 2 4 2 4-1-5 3-8 6-13z',balance:'M12 3v18m-7 0h14M4 7h16M5 7l-4 8h8zm14 0-4 8h8z'});
function icon(k){return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="${icons[k]||icons.record}"/></svg>`}
const action=(label,detail,attrs='',k='record')=>`<button type="button" class="aligned-action" ${attrs}>${icon(k)}<b${/^(Log|Plan|1RM|5\/3\/1|TRAIN|EAT|RECOVER|TRAINING|NUTRITION|MIRROR|COACH|ADAPT)$/.test(label)?' data-evolink-original':''}>${label}</b>${detail?`<small>${detail}</small>`:''}</button>`;
const card=(title,body,cls='')=>`<section class="aligned-card ${cls}"><h2>${title}</h2>${body}</section>`;
const no='Not recorded',unset='Not set';
let lastPage='',remembered='',trainingView='overview',trainingDraft=null,trainingNavigation=false;const adaptOpenSections=new Set();let adaptActive='adapt-records';const audit={version:1,pages:{},externalRequests:0,originalFormsRetained:true};window.EVOLINK_CONTENT_ALIGNMENT=audit;
function header(page){const subtitles={home:'Training Dashboard',training:'Method / Record / Plan / Analysis',nutrition:trainingText('BODY参照 / 日常管理はBODYで','BODY reference / Daily management in BODY'),mirror:'カラダの変化を見える化 / 写真比較・測定記録',coach:trainingText('トレーニング相談 / 記憶 / 本人の選択','Training dialogue / Memory / Your choice'),adapt:'振り返り・分析・次の行動'};return `<header class="aligned-header"><canvas class="aligned-landscape" width="780" height="550" aria-hidden="true"></canvas><a class="aligned-back" href="${page==='home'?'/top':'/#home'}" ${page==='home'?'':'data-align-home'} aria-label="${page==='home'?'TOP':'HOME'}">‹</a><img class="aligned-logo" src="/assets/EVOLINK_FORMAL_LOGO_ORIGINAL.png" alt="S.u.G EVOLINK official logo"><button class="aligned-settings" type="button" data-align="settings" aria-label="Settings and data">${icon('settings')}</button><canvas class="aligned-otohime" width="1086" height="1448" role="img" aria-label="Official Otohime original"></canvas><div class="aligned-language" role="group" aria-label="Language"><button type="button" data-locale="ja">JP</button><button type="button" data-locale="en">EN</button></div><div class="aligned-heading"><h1 translate="no">${page.toUpperCase()}</h1><p>${subtitles[page]}</p></div></header>`}
function navigation(page){return `<nav class="aligned-navigation" aria-label="Main screens">${['home','training','nutrition','mirror','coach','adapt'].map(k=>`<button type="button" data-nav="${k}" ${page===k?'aria-current="page"':''}>${icon(k)}<span data-evolink-original>${k==='nutrition'?'BODY':k.toUpperCase()}</span></button>`).join('')}</nav>`}
function nativeClick(selector){const e=$('#aligned-native '+selector)||$(selector);if(!e)return false;e.click();return true}
function reveal(selector){const e=selector?$(selector):$('#aligned-native');if(!e)return false;for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS'){p.open=true;if(document.body.dataset.evoPage==='adapt'&&p.classList.contains('adapt-data-section'))adaptOpenSections.add(p.id);}requestAnimationFrame(()=>e.scrollIntoView({block:'start',behavior:'instant'}));return true}
function legacyHome(data,state){const rows=state.nutrition.meals.filter(x=>x.day===data.selectedDate),t=data.homeTotals;const metrics=[['steps','Not connected','Steps'],['nutrition',rows.length?Math.round(t.k).toLocaleString('en-US')+' kcal':no,'Intake'],['flame','Not connected','Expenditure'],['balance','Unavailable','Balance']];return `<div class="aligned-date"><button type="button" data-home-date="-1" aria-label="Previous date">‹</button>${icon('calendar')}<time datetime="${data.selectedDate}">${esc(data.selectedDate)}</time><button type="button" data-home-date="1" ${data.selectedDate>=data.today?'disabled':''} aria-label="Next date">›</button></div>`+card(data.selectedDate===data.today?'TODAY’S STATUS':'SELECTED DAY’S STATUS',`<div class="aligned-rings">${metrics.map(([i,v,l],n)=>`<div class="aligned-ring ring-${n}">${icon(i)}<strong>${v}</strong><small>${l}</small></div>`).join('')}</div><div class="aligned-pfc"><b>PFC</b>${['p','f','c'].map(k=>`<span>${k.toUpperCase()} <strong>${rows.length?Math.round(t[k])+' g':no}</strong></span>`).join('')}</div><p class="aligned-note">${rows.length?rows.length+' food entries · reference-food estimates':'No food entries for this date.'} Training: ${state.logs.some(x=>x.date===data.selectedDate)?'Recorded':no} · Measurements: ${state.bodyRecords.some(x=>x.date===data.selectedDate)?'Recorded':no}</p>`)+card('NEXT ACTION',`<div class="aligned-actions three-actions">${action('TRAIN','Go to TRAINING','data-nav="training"','training')}${action('EAT','Go to NUTRITION','data-nav="nutrition"','nutrition')}${action('RECOVER','ADAPT · Recovery log','data-align="recovery"','rest')}</div>`)+card('WEEKLY RECORD',`<div class="aligned-week">${['Training','Nutrition','Recovery'].map((label,i)=>{const key=['trainingDays','foodDays','recoveryDays'][i],value=data.weekly[key];return `<p><span>${label}</span><strong>${value?value+' / 7 recorded days':'— / —'}</strong></p>`}).join('')}</div><p class="aligned-note">7 days ending ${esc(data.selectedDate)}. Weekly goals and growth rate are not set. Missing records do not mean rest or zero intake.</p>`)+card('QUICK ACCESS',`<div class="aligned-actions five-actions">${['training','nutrition','mirror','coach','adapt'].map(k=>action(k.toUpperCase(),'','data-nav="'+k+'"',k)).join('')}</div>`)}

function home(data,state){return window.EVOLINK_FOCUS?.home(data,state)||legacyHome(data,state);}
const trainingPurposes=[
 ['strength','筋力を伸ばしたい','Get stronger','同じ種目を繰り返し、回数と重量の伸びを確かめます。','Repeat key lifts and track progress in reps and weight.',['ダブルプログレッション','5×5','5/3/1']],
 ['muscle','筋肉をつけたい','Build muscle','回数・重量・セット数を記録し、無理なく積み上げます。','Record reps, weight and sets, then build gradually.',['ダブルプログレッション','テンポコントロール','トップセット＋バックオフ']],
 ['plan','計画的に鍛えたい','Train with a plan','週や期間ごとに練習内容を分け、続けられる計画を選びます。','Choose a repeatable plan that varies training across days or weeks.',['5×5','5/3/1','DUP','線形ピリオダイゼーション','ブロックピリオダイゼーション']],
 ['date','目標日に合わせたい','Prepare for a target date','目標日までの準備と直前の疲労調整を分けます。方式を選んだ後、プランで日付の配置案を保存できます。','Separate preparation from pre-event fatigue reduction. After choosing a method, save a dated outline in Plan.',['線形ピリオダイゼーション','ブロックピリオダイゼーション','テーパー（試合前調整）']],
 ['fatigue','疲労に合わせて調整したい','Adjust for fatigue','その日の余力や疲労を記録して、負荷を調整する方法を選びます。','Record readiness and fatigue, then choose how to adjust training stress.',['RPE/RIR','デロード（負荷軽減週）']]
];
let trainingPurpose='';
const trainingText=(ja,en)=>window.EVOLINK_LOCALE?.language==='en'?en:ja;
function trainingEntry(){return card(trainingText('どんなトレーニングをしたい？','What kind of training would you like to do?'),'<div class="training-purpose-entries" data-evolink-original>'+trainingPurposes.map(([id,ja,en],i)=>'<button type="button" class="aligned-action" data-training-purpose="'+id+'"><span class="purpose-number">0'+(i+1)+'</span><b>'+esc(trainingText(ja,en))+'</b><span aria-hidden="true">›</span></button>').join('')+'</div><button type="button" class="secondary training-direct" data-align="training-plan" data-evolink-original>'+trainingText('経験者向け · 30方式から直接選択','Experienced lifters · Choose directly from 30 methods')+'</button><p class="aligned-note" data-evolink-original>'+trainingText('目的 → 方法の説明 → 選択 → 実践記録 → 分析','Purpose → Explanation → Selection → Practice log → Analysis')+'</p>');}
function training(data,state){return '<nav class="aligned-tabs" aria-label="Training sections">'+action('Log','入力・履歴・セット詳細','data-align="training-log"')+action('Plan','週間プラン / 30方式','data-align="training-plan"','calendar')+action('分析','履歴・前回比較・推移','data-align="training-analysis"','adapt')+'</nav>'+trainingEntry()+card(trainingText('続きから始める','Continue your training'),'<div class="aligned-actions three-actions">'+action('実施記録','重量・回数・セット・RIR','data-align="training-log"','training')+action('プラン・30方式','4分類・30方式','data-align="training-plan"','calendar')+action('分析','履歴・前回比較・推移','data-align="training-analysis"','adapt')+'</div>')+card('その他の機能','<div class="aligned-actions training-utilities">'+action('1RM','Epley / Brzycki','data-align="one-rm"','adapt')+action('5/3/1','TM・週別重量','data-align="five-three-one"','record')+action('設定','目的・経験・確認条件','data-align="training-settings"','settings')+action('JP / EN','固定UIのみ切替','data-align="language"','record')+'</div>')+card(trainingText('保存済み記録','Saved records'),'<p data-evolink-original>'+state.logs.length+trainingText('件のトレーニング記録',' training entries')+'</p><div class="aligned-records">'+state.logs.slice(-3).reverse().map(l=>'<article data-evolink-original><b>'+esc(l.exercise)+'</b><small>'+esc(l.date)+' · '+esc(l.method||trainingText('方式未指定','Method unspecified'))+'</small></article>').join('')+'</div>');}
const trainingBeginnerGuidance={
  "ダブルプログレッション": [
    [
      "回数と重さを少しずつ伸ばします。",
      "Gradually improve repetitions and weight."
    ],
    [
      "同じ重さで決めた回数の範囲を練習し、上限まで安定してできたら重さを少し上げます。",
      "Practise within a chosen repetition range at the same weight. Once you can reliably reach the upper end, increase the weight a little."
    ],
    [
      "重さと回数を一度に増やさず、動きが崩れたら増量を見送ります。",
      "Avoid increasing weight and repetitions together. Wait before adding weight if your technique becomes inconsistent."
    ]
  ],
  "5×5": [
    [
      "基本の種目を繰り返し、力と動きの安定を育てます。",
      "Build strength and consistent technique by repeating key exercises."
    ],
    [
      "同じ種目を5回ずつ5セット行い、各セットの重さとできた回数を記録します。",
      "Perform five sets of five repetitions of the same exercise. Record the weight and completed repetitions for each set."
    ],
    [
      "最初は軽めにし、5セットを安定して終え、疲労が回復してから重さを増やします。",
      "Start light. Increase weight only after completing all five sets with consistent technique and recovering adequately."
    ]
  ],
  "5/3/1": [
    [
      "週ごとの計画に沿って、基本種目の筋力を伸ばします。",
      "Build strength in key lifts using a weekly plan."
    ],
    [
      "計算の基準となる重さ（TM）を設定し、既存プランに表示される週別の重さ・回数を確認して進めます。",
      "Set a training max (TM), the reference weight used for calculations. Follow the weekly weights and repetitions shown in the existing plan."
    ],
    [
      "基本動作が安定している方向けです。TMを高くしすぎず、追加の反復も限界まで無理に続けません。",
      "Suitable for lifters with established technique. Avoid setting TM too high or forcing extra repetitions to failure."
    ]
  ],
  "テンポコントロール": [
    [
      "動作を丁寧に行い、狙った動きを身につけます。",
      "Practise controlled movement and consistent technique."
    ],
    [
      "下ろす・止める・上げる時間を決め、軽めの重さから動作時間と回数を記録します。",
      "Choose how long to lower, pause and lift. Start with a light weight and record movement timing and repetitions."
    ],
    [
      "ゆっくり動くほど負担も変わります。いつもの重さに固執せず、姿勢を保てる範囲で行います。",
      "Changing movement speed changes the effort required. Use a weight that lets you maintain your position."
    ]
  ],
  "トップセット＋バックオフ": [
    [
      "重めの練習と、軽めで回数を積む練習を組み合わせます。",
      "Combine a heavier set with lighter follow-up practice."
    ],
    [
      "準備運動の後に主となるセットを行い、重さを下げて追加セットを行います。各セットを分けて記録します。",
      "After warming up, perform the main set, then lower the weight for follow-up sets. Record each set separately."
    ],
    [
      "重いセットを限界まで追い込まず、追加セットでも動きが崩れない重さを選びます。",
      "Do not force the heavy set to failure. Keep follow-up weights manageable enough for consistent technique."
    ]
  ],
  "DUP": [
    [
      "曜日ごとに練習の狙いを変え、力や筋肉を計画的に育てます。",
      "Vary the focus across training days to develop strength and muscle."
    ],
    [
      "週の中で、重め・回数多め・動作練習などの日を分け、それぞれの重さと回数を記録します。",
      "Assign different days to heavier work, higher repetitions or technique practice. Record the weight and repetitions for each day."
    ],
    [
      "毎回きつい練習にせず、次の練習までに疲労が回復するか確認します。",
      "Avoid making every day demanding. Check whether you recover before the next session."
    ]
  ],
  "線形ピリオダイゼーション": [
    [
      "期間を区切り、目標に向けて段階的に練習を変えます。",
      "Change training gradually across planned periods toward a goal."
    ],
    [
      "最初は回数や練習量を確保し、その後は段階的に重さを増やすなど、期間ごとの狙いを決めます。",
      "Set a focus for each period, such as building repetitions or training volume first, then gradually increasing weight."
    ],
    [
      "予定より疲労が強いときは進行を見直します。日付の配置案から重さを自動変更することはありません。",
      "Review progression if fatigue exceeds expectations. The calendar outline never changes training weights automatically."
    ]
  ],
  "ブロックピリオダイゼーション": [
    [
      "一度にすべてを狙わず、期間ごとに重点を決めます。",
      "Focus on one priority at a time across planned periods."
    ],
    [
      "基礎を積む期間、力を伸ばす期間、成果を発揮する期間などに分け、記録を見て次へ進みます。",
      "Separate training into periods for building a base, developing strength and expressing performance. Review your records before moving on."
    ],
    [
      "段階を進めることを急がず、回復と基本動作を確認します。日付だけで次の段階を決めません。",
      "Check recovery and technique before progressing. A calendar date alone is not a reason to move to the next period."
    ]
  ],
  "テーパー（試合前調整）": [
    [
      "本番前に疲労を減らし、練習してきた動きを保ちます。",
      "Reduce fatigue before an event while maintaining practised skills."
    ],
    [
      "本番が近づいたらセット数や練習時間を減らし、慣れた動作の質と体調を記録します。",
      "As the event approaches, reduce sets or training duration. Track the quality of familiar movements and how you feel."
    ],
    [
      "直前に新しい高負荷の練習を追加しません。調整の期間や量は本人の記録を見て判断します。",
      "Avoid introducing unfamiliar demanding work just before the event. Use your records to decide the duration and amount of adjustment."
    ]
  ],
  "RPE/RIR": [
    [
      "その日の余力に合わせて、無理のない重さを選びます。",
      "Choose a manageable weight based on your readiness that day."
    ],
    [
      "きつさの目安（RPE）や、あと何回できそうか（RIR）をセットごとに記録し、重さの調整を考えます。",
      "Record perceived effort (RPE) or how many more repetitions you could perform (RIR) for each set, then consider adjusting the weight."
    ],
    [
      "余力は主観的な目安です。数字だけで無理をせず、動きや体調も確認します。",
      "Readiness ratings are subjective. Check technique and how you feel rather than relying on the number alone."
    ]
  ],
  "デロード（負荷軽減週）": [
    [
      "たまった疲労を減らし、次の練習に備えます。",
      "Reduce accumulated fatigue and prepare for the next phase of training."
    ],
    [
      "一時的に重さやセット数を減らし、疲労や動きの変化を記録して、通常の練習へ戻す時期を考えます。",
      "Temporarily reduce weight or sets. Track fatigue and movement quality before deciding when to resume normal training."
    ],
    [
      "疲労や痛みが続くときは、軽くしただけで解決したと判断しません。",
      "Do not assume a lighter training week has resolved fatigue or pain that persists."
    ]
  ]
};
function paintTrainingPurpose(root){
 let section=root.querySelector('.training-purpose-panel');if(trainingView!=='purpose'){section?.remove();return;}
 const purpose=trainingPurposes.find(r=>r[0]===trainingPurpose);if(!purpose)return;
 if(!section){section=document.createElement('section');section.className='training-purpose-panel';section.setAttribute('data-evolink-original','');root.querySelector('.training-toolbar').after(section);}
 const language=window.EVOLINK_LOCALE?.language||'ja';if(section.dataset.purpose===trainingPurpose&&section.dataset.language===language)return;
 section.dataset.purpose=trainingPurpose;section.dataset.language=language;
 section.innerHTML='<h2>'+esc(trainingText(purpose[1],purpose[2]))+'</h2><p>'+esc(trainingText(purpose[3],purpose[4]))+'</p><p class="aligned-note">'+trainingText('説明を読んで、自分に合う候補を選びましょう。選択だけでは実施記録になりません。','Read the explanation and choose a suitable option. Selecting a method does not log a workout.')+'</p><div class="training-purpose-options">'+purpose[5].map(name=>{const method=window.EVOLINK_METHOD_DETAILS?.find(r=>r.name===name);if(!method)return '';const ja=window.EVOLINK_LOCALE?.translateFixed(name,'ja')||name,en=window.EVOLINK_LOCALE?.translateFixed(name,'en')||name;const guide=trainingBeginnerGuidance[name];if(!guide)return '';return '<article><h3>'+esc(trainingText(ja,en))+'</h3>'+guide.map((text,i)=>'<p data-training-guidance="'+['purpose','steps','caution'][i]+'"><strong>'+trainingText(['目的','進め方','注意点'][i],['Purpose','How to proceed','Things to watch'][i])+'</strong><br>'+esc(trainingText(...text))+'</p>').join('')+'<button type="button" class="secondary" data-training-pick="'+esc(name)+'">'+trainingText('この方法を選ぶ','Choose this method')+'</button></article>';}).join('')+'</div><button type="button" class="secondary" data-align="training-plan">'+trainingText('30方式をすべて見る','View all 30 methods')+'</button>';
}
document.addEventListener('click',e=>{const purpose=e.target.closest('[data-training-purpose]'),pick=e.target.closest('[data-training-pick]');if(purpose){trainingPurpose=purpose.dataset.trainingPurpose;showTrainingWorkspace('purpose');}if(pick){const name=pick.dataset.trainingPick;if(!window.EVOLINK_METHOD_DETAILS?.some(r=>r.name===name))return;showTrainingWorkspace('program');queueMicrotask(()=>{nativeClick('[data-ev6-method-group="すべて"]');nativeClick('[data-method="'+CSS.escape(name)+'"]');queueMicrotask(()=>{mount();trainingPosition('#smg-evolink');});});}});
window.addEventListener('evolink:locale',()=>{if(document.body.dataset.evoPage!=='training')return;const root=$('#evolink-aligned-screen');if(!root)return;const old=root.querySelector('.training-purpose-entries')?.closest('.aligned-card');if(old){const box=document.createElement('div');box.innerHTML=trainingEntry();old.replaceWith(box.firstElementChild);}paintTrainingPurpose(root);trainingLayout(root);});

function legacyNutrition(data,state){const rows=state.nutrition.meals.filter(m=>m.day===data.today),t=data.nutritionTotals,m=data.targets;const targetKeys={p:'protein',f:'fat',c:'carb'};return `<nav class="aligned-tabs" aria-label="Nutrition sections">${action('記録','食事入力','data-align="food-log"'+(data.nutritionSub==='log'?' aria-current="page"':''),'nutrition')}${action('PFC','目標設定・計算','data-align="food-target"'+(data.nutritionSub==='plan'&&remembered!=='#aligned-sample-menu'?' aria-current="page"':''),'adapt')}${action('食事例','目的別・参考献立','data-align="food-sample"'+(data.nutritionSub==='plan'&&remembered==='#aligned-sample-menu'?' aria-current="page"':''),'nutrition')}${action('分析','ADAPTで振り返る','data-align="food-analysis"','adapt')}</nav>`+card('今日の栄養バランス',`<div class="aligned-date">${icon('calendar')}<time datetime="${data.today}">${esc(data.today)}</time><span>目的：${esc(({cut:'減量',bulk:'増量',maintain:'維持',sport:'競技力'})[state.goal]||'未設定')}</span></div><div class="aligned-nutrition"><div class="aligned-intake"><small>摂取カロリー</small><strong>${rows.length?Math.round(t.k)+' kcal':no}</strong><small>目標：${m?m.cal+' kcal':unset}</small></div><div class="aligned-macros"><b>PFC（目標 / 摂取 / 差）</b>${Object.keys(targetKeys).map(k=>`<div><strong>${k.toUpperCase()}</strong><span>目標：${m?m[targetKeys[k]]+' g':unset}<br>摂取：${rows.length?Math.round(t[k])+' g':no}<br>差：${m&&rows.length?Math.round((m[targetKeys[k]]-t[k])*10)/10+' g':'Unavailable'}</span></div>`).join('')}</div></div><div class="aligned-summary"><span>収支<b>Unavailable</b><small>消費未連携</small></span><span>水分<b>未対応</b></span><span>食物繊維<b>未対応</b></span></div><p class="aligned-note">入力した食品の概算。未記録分を補完しません。日付を指定した食事入力は下の記録フォームで行えます。</p>`)+card('食事の記録',`<p class="aligned-note">朝食・昼食・夕食・間食の分類保存：未実装。保存済みの食事記録を分類したようには表示しません。</p><div class="aligned-actions two-actions">${action('食品選択・数量入力','既存カタログから記録','data-align="food-log"','nutrition')}${action('写真で記録','AI写真入力：未対応','disabled','mirror')}</div>`)+card('目的・設定・戦略メニュー',`<div class="aligned-actions five-actions">${action('目標設定','体重・kcal・PFC','data-align="food-target"','adapt')}${action('栄養戦略','9種類','data-align="food-strategy"','record')}${action('大会調整','大会日程・栄養戦略','data-align="food-event"','calendar')}${action('履歴・削除','食事記録へ','data-align="food-log"','record')}${action('参考献立','目的別メニュー参考','data-align="food-sample"','nutrition')}</div>`)+card('クイックメニュー',`<div class="aligned-actions four-actions">${action('PFC計算','kcal → PFC','data-align="food-target"','adapt')}${action('カーボアップ','栄養戦略へ','data-align="food-strategy"','record')}${action('目的別食事例','参考献立','data-align="food-sample"','nutrition')}${action('再登録','よく使うメニュー：未対応','disabled','record')}</div>`)}
function nutrition(data,state){return '<div data-focus-body-slot>'+window.EVOLINK_FOCUS.nutrition()+'</div><details class="focus-legacy"><summary data-evolink-original>'+trainingText('詳細：以前の栄養機能（9戦略・計算・履歴を保全）','Details: legacy nutrition (9 strategies, calculations and history preserved)')+'</summary>'+legacyNutrition(data,state)+'</details>';}
function mirror(){return `<nav class="aligned-tabs" aria-label="Mirror sections">${action('測定比較','Before / After','data-align="photo" aria-current="page"','mirror')}${action('測定記録','体重・腹囲','data-align="measure"','record')}${action('推移','ADAPTの記録比較','data-align="body-trend"','adapt')}${action('ADAPT','目標・プランへ','data-nav="adapt"','adapt')}</nav>`+card('写真比較','<div id="aligned-photo-slot"></div><p class="aligned-note">写真は比較用の一時利用。画面を離れると破棄し、永続保存・AI送信はしません。重ね合わせは既存の表示範囲スライダーです。</p>')+'<details class="focus-legacy"><summary data-evolink-original>'+trainingText('詳細：以前の測定記録（BODYとの自動同期なし）','Details: legacy measurements (not synced with BODY)')+'</summary>'+card('身体測定の記録','<div id="aligned-measure-slot"></div><div id="aligned-body-history"></div>')+'</details>';}
function coach(){return '<nav class="aligned-tabs coach-primary-tabs" aria-label="COACH sections">'+action('対話','相談・問いかけ','data-align="coach-talk" aria-current="page"','coach')+action('記憶','本人同意・参照範囲','data-align="coach-memory"','record')+action('振り返り','本人選択・保存・修正','data-align="coach-review"','calendar')+action('ADAPTへ','保存済み振り返り・次の行動','data-align="coach-adapt"','adapt')+'</nav><div class="aligned-connection" role="status"></div><details class="coach-history-evidence"><summary>過去の実AI接続記録</summary><p class="aligned-note aligned-history-note" data-historical-only="true"></p></details><div id="aligned-coach-slot"></div>'+card('記録・学習','<div class="aligned-actions three-actions coach-learning">'+action('対話履歴','保存した会話の確認・修正','data-align="coach-history"','record')+action('気づきメモ','本人が残す記憶','data-align="coach-notes"','coach')+action('学習カルテ','記憶・振り返りの整理','data-align="coach-profile"','adapt')+'</div><p class="aligned-note">保存は本人の選択。学習カルテは保存済み記憶と振り返りを確認する入口です。自動の性格判定・成長スコアではありません。</p>','coach-learning-card')+'<div id="aligned-reflections-slot"></div><details class="coach-tools"><summary>同意・履歴・指導者下書き・データ管理</summary><div class="aligned-actions two-actions">'+action('参照同意','身体記録4分野・写真送信なし','data-align="coach-reference"','settings')+action('指導者向け下書き','既存のメモ・共有下書き','data-align="coach-draft"','record')+action('JSONバックアップ','記憶は本人が含める項目を選択','data-align="coach-backup"','record')+action('JSON復元','復元前の差分・同意を確認','data-align="coach-restore"','record')+'</div></details>';}
function coachLayout(root){
 const live=root.querySelector('#ai-dialogue-panel');if(!live||live.dataset.coachLayout)return;
 live.dataset.coachLayout='formal-reference';
 const title=live.querySelector('h3');if(title){title.textContent='音姫 COACH';title.classList.add('coach-title');const portrait=document.createElement('canvas');portrait.width=96;portrait.height=96;portrait.className='aligned-otohime coach-avatar';portrait.setAttribute('role','img');portrait.setAttribute('aria-label','Official Otohime original');title.prepend(portrait);paintArt(root);}
 const form=live.querySelector('#ai-dialogue-form'),transcript=live.querySelector('#ai-transcript'),status=live.querySelector('#ai-status');
 if(!form||!transcript)return;
 const welcome=document.createElement('aside');welcome.className='coach-welcome';welcome.innerHTML='<b>今日はどんなことを話す？</b><p>トレーニングの計画・実施・回復・気づきを自由に入力できます。食事などの日常管理の正本はBODYです。</p><small>入力ガイドです。AI応答・保存済み会話ではありません。</small>';
 form.before(welcome);form.before(transcript);if(status)welcome.before(status);
 const settings=document.createElement('details');settings.id='coach-dialogue-settings';settings.className='coach-dialogue-settings';settings.innerHTML='<summary>同意・体調・本人選択（送信前に確認）</summary>';
 const lead=live.querySelector('p.detail');if(lead)settings.append(lead);
 for(const el of [...form.children])if(el.matches('.checkline,.form-row'))settings.append(el);
 form.append(settings);
 const label=form.querySelector('label[for="ai-user-message"]');if(label)label.classList.add('coach-input-label');
 const field=form.querySelector('#ai-user-message');field.setAttribute('placeholder','ここに入力…（記録は原文のまま保存）');field.rows=2;const compose=document.createElement('div');compose.className='coach-compose';field.before(compose);compose.append(field);const send=form.querySelector('#ai-send');if(send){send.setAttribute('aria-label',send.textContent);compose.append(send);}const actions=form.querySelector('.actions');if(actions)settings.append(actions);
 const topics=document.createElement('div');topics.className='coach-topics';topics.setAttribute('aria-label','Conversation topics');topics.innerHTML=[['goal','目標・計画'],['training','トレーニング'],['nutrition','栄養・食事'],['recovery','回復・体調'],['habit','練習の習慣'],['other','その他']].map(([key,label])=>'<button type="button" data-coach-topic="'+key+'">'+label+'</button>').join('');
 settings.before(topics);const notice=document.createElement('p');notice.id='coach-topic-notice';notice.className='tiny';notice.setAttribute('role','status');topics.after(notice);
 const updateWelcome=()=>{welcome.hidden=!!transcript.childElementCount;};new MutationObserver(updateWelcome).observe(transcript,{childList:true});updateWelcome();
 const review=live.querySelector('.final-review');if(review){const details=document.createElement('details');details.className='coach-review-details';details.innerHTML='<summary>本人選択・振り返り</summary>';review.before(details);const summary=live.querySelector('#ai-adapt-summary');if(summary)details.append(summary);details.append(review);const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.dataset.align='coach-profile';edit.textContent='保存済み振り返りを修正・削除';review.append(edit);}
 const head=root.querySelector('.aligned-heading p');if(head){head.innerHTML='<strong>Talk &amp; Learn</strong><span>対話で気づき、学び、行動につなげる</span>';}
}
function adapt(data,state){
 const ready=data.recordReadStatus==='ready',readState=data.recordReadStatus==='blocked'?'failed':'unverified';
 const lastDate=(rows,key)=>rows.map(x=>x[key]).filter(x=>typeof x==='string').sort().at(-1)||'';
 const latestRecovery=[...state.recoveryLogs].sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
 const rows=[['トレーニング',state.logs.length,lastDate(state.logs,'date')],['栄養・食事',state.nutrition.meals.length,lastDate(state.nutrition.meals,'day')],['回復・睡眠',state.recoveryLogs.length,lastDate(state.recoveryLogs,'date')],['体調・疲労',state.recoveryLogs.length,latestRecovery?.date||'']];
 const hasRecords=rows.some(x=>x[1]>0),status=ready?'保存記録を読込済み。未記録をゼロ・良好とは扱いません。':readState==='failed'?'読込失敗。保存データを保護し、記録の有無・評価は表示しません。':'読込状態未確認。記録の有無・評価は表示しません。';
 const section=(id,title,slot,note='')=>'<details id="'+id+'" class="aligned-card adapt-data-section"><summary>'+title+'</summary>'+(note?'<p class="aligned-note">'+note+'</p>':'')+'<div id="'+slot+'"></div></details>';
 const overview='<div id="adapt-read-status" class="adapt-status-line" role="status" data-read-state="'+(ready?'ready':readState)+'">'+status+'</div><div class="adapt-overview-grid"><div class="adapt-record-summary"><h3>記録の充足</h3><dl>'+rows.map(([label,n,date])=>'<div><dt>'+label+'</dt><dd>'+(ready?(n?'記録あり':'Not recorded'):(readState==='failed'?'読込失敗':'読込状態未確認'))+(ready&&date?'<time>'+esc(date)+'</time>':'')+'</dd></div>').join('')+'</dl></div><div class="adapt-rating-summary"><h3>総合評価</h3><div class="adapt-evaluation">'+(ready?'未評価':'読込未確認')+'</div><small>評価点は算出しません</small></div><div class="adapt-comparison-summary"><h3>前回との比較</h3><strong>'+(ready?(hasRecords?'条件を確認':'算出不可'):'読込未確認')+'</strong><p>別日・同条件の記録を詳細で確認</p>'+action('記録を比較','前7日・直近7日','data-align="adapt-records"','adapt')+'</div></div><p class="aligned-note">保存済み記録のみ。体調・疲労は自己申告です。</p>';
 return '<nav class="aligned-tabs adapt-primary-tabs" aria-label="ADAPT sections">'+action('分析','記録の振り返り','data-align="adapt-records" aria-current="page"','adapt')+action('評価','週次レビュー','data-align="adapt-weekly"','record')+action('最適化','候補・本人承認','data-align="adapt-approval"','settings')+action('次の行動','本人が選ぶ','data-align="adapt-next"','training')+'</nav>'+
 card('今の記録と評価',overview,'adapt-condition-card')+
 card('課題と確認ポイント','<div class="adapt-review-grid"><div><h3>記録を確認</h3><p>未記録の分野・比較条件を確認してください。</p>'+'</div><div><h3>本人が判断</h3><p>継続・変更は週次レビューで検討します。</p><p class="adapt-safe-note">痛み・不調・条件不足は保留</p>'+'</div></div>','adapt-review-card adapt-quick-menu adapt-data-section')+
 card('次のアクションプラン','<div class="aligned-actions three-actions">'+action('週次を見直す','目標・理由・本人選択','data-align="adapt-weekly"','record')+action('プランを調整','次回候補・本人承認','data-align="adapt-approval"','settings')+action('BODY回復参照','日常管理はBODYで','data-nav="nutrition"','rest')+'</div><p class="aligned-note">本人承認なしに重量・食事・目標を変更しません。</p>','adapt-next-card adapt-quick-menu adapt-data-section').replace('class="aligned-card adapt-next-card','id="adapt-next-actions" class="aligned-card adapt-next-card')+
 card('履歴・レポート','<div class="aligned-actions four-actions">'+action('推移グラフ','実測体重・4 / 8 / 12週','data-align="adapt-trends"','adapt')+action('適用履歴','既存の食事変更・承認済み予定','data-align="adapt-history"','record')+action('振り返りメモ','本人選択・保存原文','data-align="adapt-reflection"','coach')+action('データ出力','既存JSONバックアップ','data-align="adapt-backup"','record')+'</div><p class="aligned-note">PDF / CSV出力は未対応。負荷の過去適用一覧は未保存です。</p>','adapt-reports-card adapt-quick-menu adapt-data-section')+
 section('aligned-adapt-analysis','現状分析・記録の統合','aligned-adapt-analysis-slot','未記録はゼロ摂取・休養・良好とは扱いません。比較条件とデータ不足を確認してください。')+
 section('aligned-adapt-weekly','週次レビュー','aligned-adapt-weekly-slot',state.weeklyReview?'保存済みの検討案あり。適用状態と記録条件は詳細で確認してください。':'週次レビューは未保存・未評価です。入力・保存は詳細から行えます。')+
 section('aligned-adapt-plan','ADAPTプラン・本人承認','aligned-adapt-plan-slot','痛み・不調・条件不足は保留。重量・食事・目標を自動変更しません。')+
 section('aligned-adapt-recovery','回復記録','aligned-adapt-recovery-slot')+section('aligned-adapt-trends','4 / 8 / 12週の長期推移','aligned-adapt-trends-slot')+
 section('aligned-adapt-reflection','本人選択・振り返り','aligned-adapt-reflection-slot')+section('aligned-adapt-history','適用履歴','aligned-adapt-history-slot','食事目標の変更履歴を表示します。負荷調整は現在の承認済み次回予定を確認できます。過去の負荷適用一覧は保存されていません。');
}
function placeAdaptPanels(root){
 const move=(selector,slot)=>{const el=root.querySelector(selector),target=root.querySelector(slot);if(el&&target&&!target.contains(el))target.append(el);};
 move('#crossAnalytics','#aligned-adapt-analysis-slot');move('#weeklyDecisionPanel','#aligned-adapt-weekly-slot');move('#adaptDecision','#aligned-adapt-plan-slot');
 move('#recoveryPanel','#aligned-adapt-recovery-slot');move('#recoveryHistory','#aligned-adapt-recovery-slot');move('#longTermTrend','#aligned-adapt-trends-slot');move('#kcalAuditTrail','#aligned-adapt-history-slot');
 const manual=root.querySelector('#reviewNote')?.closest('.panel');if(manual&&!root.querySelector('#aligned-adapt-reflection-slot').contains(manual))root.querySelector('#aligned-adapt-reflection-slot').append(manual);
 move('#ai-dialogue-panel','#aligned-adapt-reflection-slot');move('#completion-saved-reflections','#aligned-adapt-reflection-slot');
 for(const section of root.querySelectorAll('details.adapt-data-section'))if(adaptOpenSections.has(section.id))section.open=true;for(const tab of root.querySelectorAll('.adapt-primary-tabs [data-align]')){if(tab.dataset.align===adaptActive)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');}
 const status=root.querySelector('#adapt-read-status'),blocked=status?.dataset.readState!=='ready';root.classList.toggle('adapt-read-blocked',blocked);for(const b of root.querySelectorAll('.adapt-primary-tabs button,.adapt-quick-menu button'))b.disabled=blocked;
 if(blocked)root.querySelector('.adapt-evaluation').textContent=status?.dataset.readState==='failed'?'読込失敗':'読込状態未確認';
}
function placePanels(root,page){if(page==='adapt'){placeAdaptPanels(root);return;}if(page==='coach'){const slot=root.querySelector('#aligned-coach-slot'),live=$('#ai-dialogue-panel');if(slot&&live&&!slot.contains(live))slot.append(live);const history=$('#completion-saved-reflections'),historySlot=root.querySelector('#aligned-reflections-slot');if(history&&historySlot&&!historySlot.contains(history))historySlot.append(history);const status=root.querySelector('.aligned-connection'),mode=window.EVOLINK_MODE||'offline',text=window.EVOLINK_CONNECTION?.route==='responses'?window.EVOLINK_COACH_CONNECTION.label():mode==='responses-recorded'?'保存済み実AI応答の再表示・新規通信なし':mode==='mock'?'模擬AI・実API通信なし':mode==='responses-fixture'?'応答形式の模擬検証・実API通信なし':'オフライン・新規AI応答の送信は無効';if(status&&(status.dataset.connectionMode!==mode||window.EVOLINK_CONNECTION?.route==='responses')){status.dataset.connectionMode=mode;status.textContent=text;}if(mode==='offline'&&live){const lead=live.querySelector('p.detail');const note='オフラインです。入力と記憶の管理は利用できます。新しいAI応答は送信しません。';if(lead&&lead.textContent!==note&&!lead.dataset.offlineNote){lead.textContent=note;lead.dataset.offlineNote='true';}const send=$('#ai-send');if(send)send.disabled=true;if(!live.dataset.offlineLabels){const consent=$('#ai-consent')?.parentElement;if(consent)for(const n of consent.childNodes)if(n.nodeType===3)n.textContent=' この端末で入力・記憶を確認する（外部送信なし）';if(send)send.textContent='オフライン・送信無効';live.dataset.offlineLabels='true';}}}}
let artPromise;
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image;im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
function getArt(){return artPromise||(artPromise=Promise.all([loadImage('/assets/oto.png'),loadImage('/assets/EVOLINK_TOP_REFERENCE.jpg')]).then(([im,land])=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height),p=pixels.data,w=c.width,h=c.height,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let read=0,write=0;const add=n=>{if(seen[n])return;seen[n]=1;const i=n*4,r=p[i],g=p[i+1],b=p[i+2];if(Math.min(r,g,b)>=232&&Math.max(r,g,b)-Math.min(r,g,b)<15){p[i+3]=0;queue[write++]=n}};for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}while(read<write){const n=queue[read++],x=n%w,y=(n/w)|0;if(x)add(n-1);if(x<w-1)add(n+1);if(y)add(n-w);if(y<h-1)add(n+w)}ctx.putImageData(pixels,0,0);return {character:c,land}}))}
function paintArt(root){getArt().then(({character,land})=>{if(!root.isConnected)return;for(const oto of root.querySelectorAll('.aligned-otohime')){const ctx=oto.getContext('2d');ctx.clearRect(0,0,oto.width,oto.height);if(oto.classList.contains('coach-avatar'))ctx.drawImage(character,350,0,370,370,0,0,96,96);else ctx.drawImage(character,0,0);}const c=root.querySelector('.aligned-landscape'),ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,550);g.addColorStop(0,'#001b13');g.addColorStop(.55,'#0a3534');g.addColorStop(1,'#001b13');ctx.fillStyle=g;ctx.fillRect(0,0,780,550);const scene=document.createElement('canvas');scene.width=780;scene.height=340;const sc=scene.getContext('2d');sc.drawImage(land,0,425*land.height/1280,325*land.width/714,190*land.height/1280,0,0,780,340);sc.globalCompositeOperation='destination-in';const blend=sc.createLinearGradient(0,0,0,340);blend.addColorStop(0,'#0000');blend.addColorStop(.24,'#000');blend.addColorStop(.85,'#000');blend.addColorStop(1,'#0000');sc.fillStyle=blend;sc.fillRect(0,0,780,340);ctx.drawImage(scene,0,230);const shade=ctx.createLinearGradient(0,0,0,550);shade.addColorStop(0,'#001b13');shade.addColorStop(.5,'#001b1300');shade.addColorStop(.95,'#001b1310');shade.addColorStop(1,'#001b13');ctx.fillStyle=shade;ctx.fillRect(0,0,780,550);audit.pages[document.body.dataset.evoPage].officialArtLoaded=true}).catch(()=>{audit.artError='Official artwork could not be loaded';const p=document.createElement('p');p.className='aligned-note';p.textContent=audit.artError;root.prepend(p)})}
function mount(){const page=document.body.dataset.evoPage;if(page!=='training')document.body.removeAttribute('data-training-focus');const toolsDialog=$('#aligned-data-tools-dialog');if(toolsDialog?.open&&toolsDialog.dataset.ownerPage!==page)toolsDialog.close();document.body.classList.toggle('content-aligned',supported.has(page));if(!supported.has(page))return;const main=$('#mainContent');if(!main||!app()?.contentData)return;let root=$('#evolink-aligned-screen');if(root){const native=$('#aligned-native');for(const child of [...main.children])if(child!==root)native.append(child);placePanels(root,page);if(page==='training')trainingLayout(root);if(page==='mirror')mirrorLayout(root);if(page==='coach'){coachLayout(root);window.EVOLINK_COACH_CONNECTION?.render();}return}const data=app().contentData(),state=app().snapshot(),old=[...main.childNodes];root=document.createElement('section');root.id='evolink-aligned-screen';root.className='aligned-shell';root.innerHTML=header(page)+({home,training,nutrition,mirror,coach,adapt}[page])(data,state)+`<details id="aligned-native" class="aligned-native"><summary>${page==='home'?'既存記録・目的・データ管理':page==='training'?'既存の入力・方式・計算・全履歴':page==='nutrition'?'既存の食事入力・計算・献立・戦略':page==='coach'?'指導者向けメモ・共有下書き':page==='adapt'?'記録・回復・推移・本人承認の全機能':'比較条件・既存の説明'}</summary></details>`+navigation(page);main.append(root);const native=root.querySelector('#aligned-native');for(const node of old)native.append(node);if(page==='mirror'){const photo=$('#photoBefore')?.closest('.panel'),form=$('#bodyForm')?.closest('.panel');if(photo)$('#aligned-photo-slot').append(photo);if(form)$('#aligned-measure-slot').append(form);const history=native.querySelector('[data-delete-body]')?.closest('.loglist');if(history)$('#aligned-body-history').append(history);else $('#aligned-body-history').innerHTML='<p class="aligned-note">測定履歴：Not recorded</p>'}
if(page==='nutrition'){const sample=$('#aligned-native [data-swap-meal]')?.closest('.panel');if(sample)sample.id='aligned-sample-menu'}
placePanels(root,page);if(page==='mirror')mirrorLayout(root);if(page==='coach'){coachLayout(root);window.EVOLINK_COACH_CONNECTION?.render();}if(page==='adapt')native.open=false;
audit.pages[page]={mounted:true,source:'existing EVOLINK_APP snapshot and native calculations',originalFormsRetained:true};paintArt(root);window.EVOLINK_LOCALE?.update();if(lastPage!==page){remembered='';if(page==='training')trainingView='overview';lastPage=page}if(page==='training')trainingLayout(root);if(page==='nutrition'&&remembered)native.open=true;if(page==='nutrition'){const legacy=root.querySelector('.focus-legacy');if(legacy&&!legacy.contains(native))legacy.append(native);}}
function mirrorLayout(root){
 const panel=root.querySelector('#aligned-photo-slot>.panel');if(!panel)return;
 for(const id of ['photoBefore','photoAfter']){const input=panel.querySelector('#'+id),photo=input?.parentElement.querySelector('.photo');if(photo&&photo.parentElement.tagName!=='LABEL'){const label=document.createElement('label');label.className='mirror-photo-picker';label.htmlFor=id;photo.before(label);label.append(photo);}}
 let help=panel.querySelector('.mirror-input-help');const drops=[...panel.querySelectorAll('[id="drop-before"],[id="drop-after"]')];if(drops.length){if(!help){help=document.createElement('details');help.className='mirror-input-help';const summary=document.createElement('summary');summary.textContent='写真の貼付・ドラッグ操作';help.append(summary);panel.querySelector('.actions')?.before(help);}for(const drop of drops)if(!help.contains(drop))help.append(drop);}
}
function openRM(){let d=$('#aligned-rm-dialog');if(!d){d=document.createElement('dialog');d.id='aligned-rm-dialog';d.className='completion-dialog';d.innerHTML='<h2>推定1RM · Epley / Brzycki</h2><p>既存計算式を使用。計算のみで実績・TM・週間計画は変更しません。</p><form id="aligned-rm-form"><label>重量 kg<input id="aligned-rm-weight" type="number" required min="0.5" max="600" step="0.5"></label><label>回数（1〜10）<input id="aligned-rm-reps" type="number" required min="1" max="10" step="1"></label><button type="submit">計算</button></form><output id="aligned-rm-output" aria-live="polite">未算出</output><form method="dialog"><button>閉じる</button></form>';document.body.append(d);d.querySelector('#aligned-rm-form').oninput=()=>{d.querySelector('output').textContent='入力変更・未算出';};d.querySelector('#aligned-rm-form').onsubmit=e=>{e.preventDefault();const out=d.querySelector('output');try{const kg=Number($('#aligned-rm-weight').value),reps=Number($('#aligned-rm-reps').value),engine=window.SUGOverload;out.textContent='Epley '+(Math.round(engine.epley(kg,reps)*100)/100)+' kg / Brzycki '+(Math.round(engine.brzycki(kg,reps)*100)/100)+' kg · 計算のみ・未保存';}catch(error){out.textContent='計算を停止：'+error.message}};}d.showModal();}


function openDataToolsDialog(){const tools=$('#dataTools');if(!tools)return;const existing=$('#aligned-data-tools-dialog');if(existing?.open)return;const parent=tools.parentNode,next=tools.nextSibling,d=document.createElement('dialog');d.id='aligned-data-tools-dialog';d.dataset.ownerPage=document.body.dataset.evoPage;d.className='completion-dialog';const title=document.createElement('h2');title.textContent=document.body.dataset.evoPage.toUpperCase()+' › '+(window.EVOLINK_LOCALE?.translateFixed('データの管理')||'データの管理');const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent=window.EVOLINK_LOCALE?.translateFixed('閉じて戻る')||'閉じて戻る';close.onclick=()=>d.close();d.append(title,close,tools);d.addEventListener('close',()=>{parent.insertBefore(tools,next?.isConnected?next:null);d.remove();},{once:true});document.body.append(d);d.showModal();window.EVOLINK_LOCALE?.update();}

function captureTrainingDraft(){const form=$('#trainingForm');if(!form)return;trainingDraft={baseCount:trainingDraft?.baseCount??app().snapshot().logs.length,fields:[...form.elements].filter(e=>e.id&&!['submit','button','file'].includes(e.type)).map(e=>({id:e.id,value:e.value,checked:e.checked})),techniques:[...form.querySelectorAll('.technique-check:checked')].map(e=>e.value)};}
function restoreTrainingDraft(){const form=$('#trainingForm');if(!form||!trainingDraft)return;if(app().snapshot().logs.length>trainingDraft.baseCount){trainingDraft=null;return}for(const item of trainingDraft.fields){const e=document.getElementById(item.id);if(!e||!form.contains(e))continue;if(e.type==='checkbox'||e.type==='radio')e.checked=!!item.checked;else if(e.tagName!=='SELECT'||[...e.options].some(o=>o.value===item.value))e.value=item.value;}for(const e of form.querySelectorAll('.technique-check'))e.checked=trainingDraft.techniques.includes(e.value);}
function trainingLayout(root){if(!root||document.body.dataset.evoPage!=='training')return;let toolbar=root.querySelector('.training-toolbar');if(!toolbar){const tabs=root.querySelector(':scope > .aligned-tabs');if(!tabs)return;toolbar=document.createElement('div');toolbar.className='training-toolbar';toolbar.innerHTML='<div class="training-context-row"><p><span data-evolink-original>TRAINING</span><span aria-hidden="true"> › </span><strong class="training-context-label"></strong></p><button type="button" class="secondary" data-training-overview>一覧へ戻る</button></div>';tabs.before(toolbar);toolbar.append(tabs);}root.dataset.trainingView=trainingView;document.body.toggleAttribute('data-training-focus',['records','program','analysis'].includes(trainingView));const data=app().contentData(),labels={overview:'一覧',purpose:trainingText('方法の説明・選択','Explanation / Selection'),records:trainingText('記録を入力・履歴','Record / History'),program:trainingText(data.method==='5/3/1'?'計画・5/3/1':'計画・方式選択',data.method==='5/3/1'?'Plan / 5/3/1':'Plan / Methods'),analysis:trainingText('記録を分析','Analyze records'),settings:'設定'};const label=toolbar.querySelector('.training-context-label'),text=window.EVOLINK_LOCALE?.translateFixed(labels[trainingView])||labels[trainingView];label.setAttribute('data-evolink-original','');if(label.textContent!==text)label.textContent=text;toolbar.querySelector('[data-training-overview]').hidden=trainingView==='overview';const native=root.querySelector('#aligned-native');native.hidden=['overview','purpose'].includes(trainingView);native.open=!native.hidden;paintTrainingPurpose(root);for(const tab of toolbar.querySelectorAll('[data-align]')){const active=trainingView==='records'&&tab.dataset.align==='training-log'||trainingView==='analysis'&&tab.dataset.align==='training-analysis'||trainingView==='program'&&tab.dataset.align===(data.method==='5/3/1'?'five-three-one':'training-plan');if(active)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');}restoreTrainingDraft();window.EVOLINK_LOCALE?.update();}
function trainingPosition(selector){const toolbar=$('.training-toolbar'),target=$(selector)||$('#aligned-native');if(!toolbar||!target)return;for(let p=target;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;requestAnimationFrame(()=>{const scroller=$('#aligned-native');if(document.body.hasAttribute('data-training-focus')&&scroller?.contains(target)){const box=target.getBoundingClientRect(),frame=scroller.getBoundingClientRect(),offset=selector.includes('button')?Math.max(16,(frame.height-box.height)/2):16;scroller.scrollTo({top:target===scroller?0:Math.max(0,scroller.scrollTop+box.top-frame.top-offset),behavior:'instant'});window.scrollTo({top:0,behavior:'instant'});return;}const height=toolbar.getBoundingClientRect().height,box=target.getBoundingClientRect();window.scrollTo({top:Math.max(0,scrollY+box.top-height-18),behavior:'instant'});});}
function showTrainingWorkspace(kind,selector){captureTrainingDraft();trainingView=kind;if(['records','program','analysis'].includes(kind)&&app().contentData().trainingSub!==kind){trainingNavigation=true;try{nativeClick('[data-tsub="'+kind+'"]')}finally{trainingNavigation=false}}queueMicrotask(()=>{mount();trainingLayout($('#evolink-aligned-screen'));if(['overview','purpose'].includes(kind))window.scrollTo({top:0,behavior:'instant'});else trainingPosition(selector||'#aligned-native');});}
document.addEventListener('click',e=>{if(document.body.dataset.evoPage!=='training')return;if(e.target.closest('[data-focus-phase]')&&document.body.hasAttribute('data-training-focus'))requestAnimationFrame(()=>requestAnimationFrame(()=>trainingPosition('#four-period-panel')));if(e.target.closest('[data-training-overview]')){showTrainingWorkspace('overview');return}},true);
document.addEventListener('click',e=>{if(document.body.dataset.evoPage!=='training')return;const tab=e.target.closest('[data-tsub]');if(!tab||!['records','program','analysis'].includes(tab.dataset.tsub))return;captureTrainingDraft();trainingView=tab.dataset.tsub;if(!trainingNavigation)queueMicrotask(()=>{mount();trainingLayout($('#evolink-aligned-screen'));trainingPosition(trainingView==='records'?'#trainingForm':'.evo-training-content');});},true);
for(const type of ['input','change'])document.addEventListener(type,e=>{if(document.body.dataset.evoPage==='training'&&e.target.closest('#trainingForm'))captureTrainingDraft();},true);

function trainingRecordEntry(selector){showTrainingWorkspace('records',selector);}
function legacySection(kind,selector){if(document.body.dataset.evoPage==='training'&&['records','program','analysis'].includes(kind)){showTrainingWorkspace(kind,selector);return}if(kind==='records'||kind==='program'||kind==='analysis')nativeClick('[data-tsub="'+kind+'"]');else nativeClick('[data-nsub="'+kind+'"]');remembered=selector||'#aligned-native';queueMicrotask(()=>{mount();reveal(remembered)})}
document.addEventListener('click',e=>{const topic=e.target.closest('[data-coach-topic]');if(!topic)return;const field=$('#ai-user-message');if(!field)return;const prompts={goal:['目標や計画について考えたいです。','I want to think about my goals and plans.'],training:['トレーニングについて振り返りたいです。','I want to reflect on my training.'],nutrition:['栄養や食事について考えたいです。','I want to think about nutrition and meals.'],recovery:['回復や体調について話したいです。','I want to talk about recovery and how I feel.'],habit:['考え方や習慣について整理したいです。','I want to reflect on my thinking and habits.'],other:['自由に話して整理したいです。','I want to talk things through in my own words.']};if(!field.value.trim()){field.value=prompts[topic.dataset.coachTopic][window.EVOLINK_LOCALE?.language==='en'?1:0];field.dispatchEvent(new Event('input',{bubbles:true}));}const notice=$('#coach-topic-notice');if(notice)notice.textContent='入力内容を確認・修正してから送信できます。自動送信はしません。';reveal('#ai-user-message');field.focus();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-align]');if(!b||document.body.dataset.evoPage!=='coach')return;const key=b.dataset.align;if(key.startsWith('coach-')){const active=b.closest('.coach-primary-tabs')?key:['coach-history','coach-notes','coach-profile','coach-reference'].includes(key)?'coach-memory':null;if(active)for(const tab of document.querySelectorAll('.coach-primary-tabs [data-align]')){if(tab.dataset.align===active)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');}if(key==='coach-memory'){reveal('#coach-dialogue-settings');reveal('#coach-memory-controls');}if(key==='coach-review'){reveal('#coach-dialogue-settings');reveal('#ai-reflection');}if(key==='coach-history')reveal('#coach-memory-history');if(key==='coach-notes')reveal('#coach-memory-notes');if(key==='coach-profile'){reveal('#coach-saved-memory');for(const item of document.querySelectorAll('#coach-saved-memory>details'))item.open=true;}if(key==='coach-draft')reveal('#aligned-native');if(key==='coach-backup')nativeClick('[data-act="backup"]');if(key==='coach-restore')nativeClick('[data-act="import"]');if(key==='coach-adapt'){nativeClick('[data-nav="adapt"]');requestAnimationFrame(()=>reveal('#completion-saved-reflections'));}}});
window.addEventListener('evolink:connection',()=>{const status=$('.aligned-connection');if(status&&window.EVOLINK_COACH_CONNECTION)status.textContent=window.EVOLINK_COACH_CONNECTION.label();window.EVOLINK_COACH_CONNECTION?.render();});
document.addEventListener('submit',e=>{if(e.target.id==='ai-dialogue-form'&&window.EVOLINK_MODE==='offline'){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('click',e=>{if(e.target.closest('#ai-dialogue-panel')&&window.EVOLINK_MODE==='offline')setTimeout(()=>{const send=$('#ai-send');if(send)send.disabled=true;},0);const homeLink=e.target.closest('[data-align-home]');if(homeLink){e.preventDefault();nativeClick('[data-nav="home"]');return}const b=e.target.closest('[data-align]');if(!b)return;const k=b.dataset.align;e.preventDefault();if(document.body.dataset.evoPage==='adapt'&&b.closest('.adapt-primary-tabs')){adaptActive=k;}if(document.body.dataset.evoPage==='adapt'&&b.closest('.adapt-primary-tabs'))for(const tab of document.querySelectorAll('.adapt-primary-tabs [data-align]')){if(tab===b)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');}if(document.body.dataset.evoPage==='mirror'&&b.closest('.aligned-tabs'))for(const tab of document.querySelectorAll('.aligned-tabs [data-align]')){if(tab===b)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');}if(k==='settings'){const manager=$('#ev6-data-manager');if(manager){reveal('#ev6-data-manager')}else openDataToolsDialog();return}if(k==='language'){const locale=window.EVOLINK_LOCALE;locale?.set(locale.language==='ja'?'en':'ja');return}if(k==='coach-talk'){reveal('#ai-user-message');return}if(k==='coach-memory'){reveal('#coach-memory-controls');return}if(k==='coach-reference'){reveal('#coach-scope-training');return}if(k==='coach-review'){reveal('#ai-reflection');return}if(k==='adapt-next'){reveal('#adapt-next-actions');return}if(k==='adapt-backup'){nativeClick('[data-act="backup"]');return}if(k==='adapt-records'){reveal('#crossAnalytics');return}if(k==='adapt-weekly'){reveal('#weeklyDecisionPanel');return}if(k==='adapt-history'){reveal('#kcalAuditTrail');return}if(k==='adapt-reflection'){reveal('#aligned-adapt-reflection');return}if(k==='adapt-recovery'){reveal('#recoveryPanel');return}if(k==='adapt-trends'){reveal('#longTermTrend');return}if(k==='adapt-approval'){reveal('#adaptDecision');return}if(k==='recovery'||k==='body-trend'||k==='food-analysis'){nativeClick('[data-nav="adapt"]');requestAnimationFrame(()=>reveal(k==='recovery'?'#recoveryPanel':k==='body-trend'?'#longTermTrend':'#crossAnalytics'));return}if(k==='training-save'){trainingRecordEntry('#trainingForm button[type="submit"]');return}if(k==='training-log'||k==='exercise'){trainingRecordEntry(k==='exercise'?'#exercise':'#trainingForm');return}if(k==='training-plan'){legacySection('program','.ev6-method-catalog');return}if(k==='method-details'){legacySection('program','#smg-evolink');return}if(k==='training-analysis'){legacySection('analysis','.evo-training-content');return}if(k==='five-three-one'){nativeClick('[data-tsub="program"]');nativeClick('[data-method="5/3/1"]');queueMicrotask(()=>{mount();showTrainingWorkspace('program','#oneRM')});return}if(k==='one-rm'){openRM();return}if(k==='training-settings'){showTrainingWorkspace('settings','#s30-training-panel');return}if(k==='photo'){reveal('#photoBefore');return}if(k==='measure'){reveal('#bodyForm');return}if(k==='food-log'){legacySection('log','#foodForm');return}if(k==='food-target'){legacySection('plan','#nutritionForm');return}if(k==='food-sample'){legacySection('plan','#aligned-sample-menu');return}if(k==='food-strategy'||k==='food-event'){legacySection('strategy',k==='food-event'?'#eventForm':'#aligned-native');return}});
document.addEventListener('toggle',e=>{const d=e.target;if(d.isConnected&&d.matches('details.adapt-data-section')){if(d.open)adaptOpenSections.add(d.id);else adaptOpenSections.delete(d.id);}},true);
let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;observer.disconnect();try{mount()}finally{observer.observe($('#mainContent'),{childList:true})}},30)});observer.observe($('#mainContent'),{childList:true});mount();
})();

/* Presentation-only finishing layer. No persistence, calculation or record writes. */
(()=>{'use strict';
const t=(ja,en)=>window.EVOLINK_LOCALE?.language==='en'?en:ja;
let helperId=0;
const canvas=document.createElement('canvas'),measure=canvas.getContext('2d');
function decorate(){
 const root=document.querySelector('#evolink-aligned-screen');
 if(root){
  if(document.body.dataset.evoPage==='nutrition'){const title=root.querySelector('.aligned-heading h1');if(title&&title.textContent!=='BODY')title.textContent='BODY';}
  for(const [key,ja,en]of [['training-log','記録','Record'],['training-plan','計画','Plan'],['training-analysis','分析','Analysis']]){
   const button=root.querySelector('.training-toolbar [data-align="'+key+'"]'),label=button?.querySelector('b');
   if(label){label.setAttribute('data-evolink-original','');const text=t(ja,en);if(label.textContent!==text)label.textContent=text;button.setAttribute('aria-label',text);}
  }
  const toolbar=root.querySelector('.training-toolbar');if(toolbar){const size=Math.ceil(toolbar.getBoundingClientRect().height);if(size>0&&document.documentElement.style.getPropertyValue('--evo-toolbar-height')!==size+'px')document.documentElement.style.setProperty('--evo-toolbar-height',size+'px');}
  for(const input of root.querySelectorAll('#four-wave-form input[id*="-rir-"],#four-period-rir')){
   const parent=input.parentElement;let help=parent.querySelector('.visual-field-help');if(!help){help=document.createElement('small');help.className='visual-field-help';help.setAttribute('data-evolink-original','');parent.append(help);}
   const text=t('あと何回できる余力を残すか','Repetitions left in reserve');if(help.textContent!==text)help.textContent=text;
  }
 }
 for(const dialog of document.querySelectorAll('dialog.completion-dialog')){
  if(!dialog.querySelector('.visual-dialog-head')){
   const title=[...dialog.children].find(e=>e.tagName==='H2'),close=[...dialog.children].find(e=>e.tagName==='BUTTON')||dialog.querySelector('form[method="dialog"]');
   if(title&&close){const head=document.createElement('header');head.className='visual-dialog-head';dialog.prepend(head);head.append(title,close);}
  }
  const title=dialog.querySelector('.visual-dialog-head h2'),close=dialog.querySelector('.visual-dialog-head button');
  if(title){const text=dialog.id==='aligned-rm-dialog'?t('推定1RM · Epley / Brzycki','Estimated 1RM · Epley / Brzycki'):dialog.querySelector('#completion-import-json')?t('バックアップを復元','Restore a backup'):dialog.querySelector('#completion-backup-json')?t('完全バックアップをダウンロード','Download a complete backup'):null;if(text){title.setAttribute('data-evolink-original','');if(title.textContent!==text)title.textContent=text;}}
  if(close){const text=t('閉じる','Close');close.setAttribute('data-evolink-original','');if(close.textContent!==text)close.textContent=text;}
  for(const [id,ja,en]of [['completion-validate','バックアップを検証','Validate backup'],['completion-restore','選択した差分と記録を復元','Restore validated backup'],['completion-download','JSONバックアップをダウンロード','Download JSON backup']]){const el=dialog.querySelector('#'+id);if(el){el.setAttribute('data-evolink-original','');const text=t(ja,en);if(el.textContent!==text)el.textContent=text;}}
  const diffTitle=dialog.querySelector('#completion-restore-differences>h3');if(diffTitle){diffTitle.setAttribute('data-evolink-original','');const text=t('復元する差分を確認','Review before restoring');if(diffTitle.textContent!==text)diffTitle.textContent=text;}
  for(const [id,ja,en]of [['completion-include-memory',' 保存済みCOACH会話と記憶メモを含める',' Include saved COACH conversation and memory notes'],['completion-replace',' このバックアップで既存記録を復元し、任意項目はチェックした差分だけを適用する',' Restore existing records from this backup and apply only the checked optional differences'],['completion-restore-memory',' 含まれるCOACHの会話・記憶も復元対象にする',' Also restore included COACH conversation and memory notes']]){const input=dialog.querySelector('#'+id),label=input?.parentElement;if(label){label.setAttribute('data-evolink-original','');const nodes=[...label.childNodes].filter(n=>n.nodeType===3);if(nodes.length){const text=t(ja,en);if(nodes[0].data!==text)nodes[0].data=text;for(const node of nodes.slice(1))if(node.data)node.data='';}}}
  for(const article of dialog.querySelectorAll('#completion-restore-differences>article')){
   let details=article.querySelector('.visual-diff-values');
   if(!details){details=document.createElement('details');details.className='visual-diff-values';const summary=document.createElement('summary');summary.setAttribute('data-evolink-original','');details.append(summary);for(const child of [...article.children])if(child.tagName!=='LABEL')details.append(child);article.append(details);}
   const summary=details.querySelector('summary'),text=t('現在とバックアップの内容を見る','Review current and backup values');if(summary.textContent!==text)summary.textContent=text;
  }
 }
 for(const select of document.querySelectorAll('.aligned-shell select,.completion-dialog select')){
  if(!select.getClientRects().length||!measure)continue;measure.font=getComputedStyle(select).font;const text=select.selectedOptions[0]?.textContent||'',needed=measure.measureText(text).width>select.clientWidth-48;
  let help=select.nextElementSibling?.classList.contains('visual-selected-caption')?select.nextElementSibling:null;
  if(needed){if(!help){help=document.createElement('small');help.className='visual-selected-caption';help.setAttribute('data-evolink-original','');help.id='evo-selected-caption-'+(++helperId);select.after(help);select.setAttribute('aria-describedby',[select.getAttribute('aria-describedby'),help.id].filter(Boolean).join(' '));}if(help.textContent!==text)help.textContent=text;}
  else if(help){const ids=(select.getAttribute('aria-describedby')||'').split(/\s+/).filter(x=>x!==help.id);if(ids.length)select.setAttribute('aria-describedby',ids.join(' '));else select.removeAttribute('aria-describedby');help.remove();}
 }
}
let scheduled=false;const observer=new MutationObserver(schedule);
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;observer.disconnect();try{decorate()}finally{observer.observe(document.body,{childList:true,subtree:true});}});}
window.addEventListener('evolink:locale',schedule);window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);document.addEventListener('change',schedule);observer.observe(document.body,{childList:true,subtree:true});decorate();
})();


/* Unsubmitted editor drafts: tab-local only; never persists or changes calculations. */
(()=>{'use strict';
 const groups=[
  {ids:['planExercise','planDays','planWeek','planReference'],revision:()=>{const s=window.EVOLINK_APP.snapshot();return JSON.stringify([s.method,s.trainingPlan]);}},
  {ids:['coach-memory-notes'],revision:()=>localStorage.getItem(window.EVOLINK_COACH_MEMORY.KEY)},
  {ids:['reviewNote'],revision:()=>JSON.stringify(window.EVOLINK_APP.snapshot().review)}
 ];
 const drafts=new Map();let scheduled=false;
 function remember(group){try{const fields=group.ids.map(id=>document.getElementById(id));if(fields.every(Boolean))drafts.set(group,{revision:group.revision(),fields:fields.map(e=>({id:e.id,value:e.value}))});}catch{}}
 function enforceOffline(){if(window.EVOLINK_MODE==='offline'){const send=document.getElementById('ai-send');if(send&&!send.disabled)send.disabled=true;const help=document.querySelector('#ai-dialogue-panel>p.detail');if(help){const text=window.EVOLINK_LOCALE?.language==='en'?'Offline · real AI sending is disabled. Use your own input and saved records. Dialogue never changes weights or plans automatically.':'オフライン・実AI送信停止。本人入力と保存済み記録を扱います。対話から重量・計画を自動変更しません。';help.setAttribute('data-evolink-original','');if(help.textContent!==text)help.textContent=text;}}}
 function restore(){for(const group of groups){const draft=drafts.get(group);if(!draft)continue;try{if(draft.revision!==group.revision()){drafts.delete(group);continue;}for(const field of draft.fields){const e=document.getElementById(field.id);if(e&&e.value!==field.value)e.value=field.value;}}catch{}}enforceOffline();}
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;restore();});}
 for(const type of ['input','change'])document.addEventListener(type,e=>{const group=groups.find(g=>g.ids.includes(e.target.id));if(group)queueMicrotask(()=>{if(e.target.isConnected)remember(group);});});
 document.addEventListener('submit',e=>{if(window.EVOLINK_MODE==='offline'&&e.target.id==='ai-dialogue-form'){e.preventDefault();e.stopImmediatePropagation();enforceOffline();}},true);
 const main=document.getElementById('mainContent');if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
 window.addEventListener('evolink:locale',schedule);
 window.addEventListener('evolink:coach-memory-restored',()=>drafts.clear());
 enforceOffline();
})();

