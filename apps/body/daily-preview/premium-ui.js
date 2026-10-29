'use strict';
// Official S.u.G BODY presentation layer matched to the approved 2026-10-27 screens.
// Existing nodes, listeners, storage, service states, MAP and access checks stay authoritative.
(() => {
  const byId = id => document.getElementById(id);
  const logoPath = 'assets/body-approved-main-transparent.png';
  const screens = {
    today: ['今日の自分に、\nちょうどいい一歩。','記録済みの内容だけを表示します。','assets/otohime-trainer-original.jpg','利用者提供の音姫トレーナー衣装原本'],
    map: ['歩くことを、\n今日の発見へ。','既存WALK・SAFE・SOSをひとつの地図で確認します。','assets/walker.jpeg','提供済みWALKキャラクター'],
    food: ['食べたものを、\n無理なく整える。','写真・検索・履歴から、少ない操作で今日の食事を記録します。','assets/baby-gold.jpeg','提供済み善くん金衣装原本'],
    training: ['できることから、\n続けていこう！','前回の記録と今日の状態を確認し、実施した内容だけを残します。','assets/zenn-trainer-cutout.png','善くんトレーナー衣装原本を使った表示素材'],
    recovery: ['整えて、\n回復して、次へ。','睡眠・疲労・ストレス・痛みを分けて、今日の回復を確かめます。','assets/otohime-trainer-original.jpg','利用者提供の音姫トレーナー衣装原本','assets/baby-gold.jpeg'],
    record: ['積み重ねを、\n見える化する。','食事・運動・歩行・回復を同じ期間で振り返ります。','assets/otohime-trainer-original.jpg','利用者提供の音姫トレーナー衣装原本','assets/baby-gold.jpeg'],
    settings: ['自分のこと。\nつながる記録。','身体情報・目標・連携・利用権限を本人が確認します。','assets/otohime-trainer-original.jpg','利用者提供の音姫トレーナー衣装原本','assets/baby-gold.jpeg']
  };
  const screenLabels={today:'S.u.G BODY · TODAY',map:'S.u.G BODY · WALK / SAFE',food:'S.u.G BODY · FOOD',training:'S.u.G BODY · TRAINING',recovery:'S.u.G BODY · RECOVERY',record:'S.u.G BODY · PROGRESS',settings:'S.u.G BODY · PROFILE'};
  const officialIcons={
    food:'<svg class="official-icon-svg" data-body-icon="food" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 3v5M8 3v5M11 3v5M5 8c0 2 1.3 3 3 3s3-1 3-3M8 11v10M16 3v18M16 3c2.5 1.5 4 4 4 7h-4"/></svg>',
    training:'<svg class="official-icon-svg" data-body-icon="training" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 8v8M4.5 9.5v5M2.5 11v2M7 12h10M17 8v8M19.5 9.5v5M21.5 11v2"/></svg>'
  };

  function todayLabel() {
    const value = byId('date')?.textContent?.trim();
    return value || new Intl.DateTimeFormat('ja-JP',{month:'long',day:'numeric',weekday:'short'}).format(new Date());
  }
  function action(label,{page,focus,icon='',note='',className='official-action'}={}) {
    const node=document.createElement('button'); node.type='button'; node.className=className;
    node.innerHTML=`${icon?`<span aria-hidden="true">${icon}</span>`:''}<b>${label}</b>${note?`<small>${note}</small>`:''}`;
    if(page)node.dataset.page=page;if(focus)node.dataset.focus=focus;return node;
  }
  function hero(id,meta) {
    const node=document.createElement('section');node.className=`official-hero official-hero-${id}`;node.dataset.officialHero=id;
    node.innerHTML=`<img class="official-hero-logo" src="${logoPath}" alt="承認済みS.u.G BODY正式ロゴ"><p class="official-hero-kicker">${screenLabels[id]}</p><p class="official-hero-date">${todayLabel()}</p><h1></h1><p class="official-hero-copy"></p><div class="official-hero-art"><img src="${meta[2]}" alt="${meta[3]}"></div>`;
    node.querySelector('h1').textContent=meta[0];node.querySelector('.official-hero-copy').textContent=meta[1];
    if(meta[4]){const img=document.createElement('img');img.className='official-hero-secondary';img.src=meta[4];img.alt='提供済み善くん金衣装原本';node.querySelector('.official-hero-art').append(img)}
    const settings=action('設定',{page:'settings',className:'official-settings-button'});settings.setAttribute('aria-label','プロフィール・連携設定を開く');node.append(settings);
    return node;
  }
  function actionStrip(items,label) {
    const node=document.createElement('section');node.className='official-action-strip official-surface';
    node.innerHTML=`<h2><span aria-hidden="true">✦</span> ${label}</h2><div class="official-action-grid"></div>`;
    items.forEach(item=>node.lastElementChild.append(action(item.label,item)));return node;
  }
  function mirror(id,fallback='未取得'){const node=document.createElement('span');node.className='official-live-value';node.dataset.mirror=id;node.textContent=fallback;return node}

  function foodOverview() {
    const node=document.createElement('section');node.className='official-overview official-food-overview';
    const card=document.createElement('article');card.className='official-surface official-nutrition-summary';
    card.innerHTML=`<div class="official-summary-heading"><span class="official-round-icon">${officialIcons.food}</span><div><small>今日の食事</small><h2>カロリー・PFC</h2></div></div>`;
    const total=document.createElement('div');total.className='official-big-number';total.append(mirror('foodTotal'));
    const macros=document.createElement('p');macros.className='official-macro-line';macros.append(mirror('foodMacros','P — / F — / C —'));card.append(total,macros);
    node.append(card,actionStrip([
      {label:'写真から候補',note:'本人確認後に保存',icon:'▣',focus:'photo'},
      {label:'食品検索',note:'既存62食品',icon:'⌕',focus:'foodSearchPanel'},
      {label:'履歴から再登録',note:'保存済み記録',icon:'↻',focus:'foodHistoryPanel'},
      {label:'お気に入り',note:'定番メニュー',icon:'★',focus:'favoriteFoodPanel'},
      {label:'手入力',note:'量とPFCを確認',icon:'✎',focus:'foodForm'}
    ],'かんたんに食事を記録'));return node;
  }
  function trainingOverview() {
    const node=document.createElement('section');node.className='official-overview official-training-overview';
    node.innerHTML=`<article class="official-surface official-training-card"><header><span class="official-round-icon">${officialIcons.training}</span><div><small>今週のトレーニング</small><h2>予定と実績を分けて記録</h2></div></header><div class="official-training-row"><span>今日の予定</span><b data-training="plan">未設定</b><i>›</i></div><div class="official-training-row"><span>前回の負荷</span><b data-training="previous">記録なし</b><i>›</i></div><div class="official-training-row"><span>今日の記録</span><b data-training="today">未記録</b><i>›</i></div></article>`;
    node.append(actionStrip([
      {label:'今日の記録',icon:'＋',focus:'trainingForm'},{label:'前回を呼出',icon:'↻',focus:'repeatTraining'},
      {label:'5/3/1計画',icon:'531',focus:'body531Plan'},{label:'負荷推移',icon:'⌁',focus:'trainingHistory'}
    ],'今日のトレーニング'));return node;
  }
  function recoveryState() {
    const source=safeData(),saved=source.days?.[day()]||{};
    const sleep=saved.sleep??'',fatigue=saved.fatigue??'',stress=saved.stress??'',pain=saved.pain??'';let score=100,count=0;
    if(sleep!==''){score-=Math.max(0,7-Number(sleep))*8;count++}if(fatigue){score-=fatigue==='強い'?24:fatigue==='いつも通り'?10:0;count++}
    if(stress){score-=stress==='強い'?20:stress==='いつも通り'?8:0;count++}if(pain){score-=pain==='あり'?22:0;count++}
    const complete=sleep!==''&&fatigue!==''&&stress!==''&&pain!=='';
    if(!count||!complete)return{score:'—',state:'未記録',sleep:sleep!==''?`${sleep}時間`:'未取得',fatigue:fatigue||'未記録',stress:stress||'未記録',pain:pain||'未記録'};score=Math.max(0,Math.round(score));
    return{score,state:score>=75?'良好':score>=50?'確認':'休養を検討',sleep:sleep!==''?`${sleep}時間`:'未取得',fatigue:fatigue||'未記録',stress:stress||'未記録',pain:pain||'未記録'};
  }
  function recoveryOverview() {
    const node=document.createElement('section');node.className='official-overview official-recovery-overview';
    node.innerHTML='<article class="official-surface official-recovery-score"><div class="official-score-ring"><b data-recovery="score">—</b><small>/100</small></div><div><small>今日の回復スコア</small><h2 data-recovery="state">未記録</h2><p>本人入力と取得済みデータだけで確認します。</p></div></article><div class="official-recovery-grid"><button type="button" class="official-surface" data-focus="recoveryForm"><small>☾ 睡眠</small><b data-recovery="sleep">未取得</b><span>本人入力／HealthKit候補</span></button><button type="button" class="official-surface" data-focus="recoveryForm"><small>ϟ 疲労</small><b data-recovery="fatigue">未記録</b><span>本人入力</span></button><button type="button" class="official-surface" data-focus="recoveryForm"><small>◉ ストレス</small><b data-recovery="stress">未記録</b><span>本人入力</span></button><button type="button" class="official-surface" data-focus="care"><small>◒ 痛み</small><b data-recovery="pain">未記録</b><span>原因は断定しません</span></button></div>';
    node.append(actionStrip([{label:'回復を記録',icon:'♡',focus:'recoveryForm'},{label:'ケア・再確認',icon:'✓',focus:'care'},{label:'取得値を確認',icon:'⌁',focus:'recoveryHealthReview'}],'今日のケア'));return node;
  }
  function miniChart(title,icon,key) {
    const card=document.createElement('article');card.className='official-surface official-chart-card';card.dataset.chart=key;
    card.innerHTML=`<header><span class="official-round-icon">${icon}</span><h2>${title}</h2><i>›</i></header><b class="official-chart-value">記録後に表示</b><div class="official-bars" aria-label="記録がある場合に推移を表示"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><small>未入力・欠測・0を区別</small>`;return card;
  }
  function recordOverview() {
    const node=document.createElement('section');node.className='official-overview official-record-overview';const grid=document.createElement('div');grid.className='official-chart-grid';
    grid.append(miniChart('体重推移','▣','weight'),miniChart('食事サマリー',officialIcons.food,'food'),miniChart('トレーニング',officialIcons.training,'training'),miniChart('歩行記録','⌁','walk'),miniChart('睡眠・回復','☾','recovery'),miniChart('特典・ポイント','★','benefit'));
    node.append(grid,actionStrip([{label:'写真を記録',icon:'▣',focus:'bodyPhotoSlots'},{label:'記録を一覧',icon:'▤',focus:'recordList'},{label:'特典を確認',icon:'♕',focus:'memberBenefitCard'}],'積み重ねを確認'));return node;
  }
  function settingsOverview() {
    const node=document.createElement('section');node.className='official-overview official-settings-overview';
    node.innerHTML='<article class="official-surface official-profile-summary" data-focus="profileForm"><div class="official-profile-avatar"><img src="assets/otohime-trainer-original.jpg" alt="利用者提供の音姫トレーナー衣装原本"></div><div><small>基本情報</small><h2 data-profile="name">未設定</h2><p><span data-profile="age">年齢未設定</span>　<span data-profile="height">身長未設定</span>　<span data-profile="weight">体重未設定</span></p></div><i>›</i></article><div class="official-settings-grid"><button type="button" class="official-surface" data-focus="profileForm"><span class="official-round-icon">◎</span><b>目標設定</b><small>身体情報と目的</small><i>›</i></button><button type="button" class="official-surface" data-focus="accessDecision"><span class="official-round-icon">♕</span><b>会員情報</b><small>利用権限を確認</small><i>›</i></button><button type="button" class="official-surface" data-focus="healthIntake"><span class="official-round-icon">♥</span><b>HealthKit</b><small>実機同期は未確認</small><i>›</i></button><button type="button" class="official-surface" data-focus="energyProfilePanel"><span class="official-round-icon">↻</span><b>活動量・同期</b><small>推定条件と取得元</small><i>›</i></button><button type="button" class="official-surface" data-focus="privacySettings"><span class="official-round-icon">◇</span><b>データ権限</b><small>本人同意を確認</small><i>›</i></button><button type="button" class="official-surface" data-focus="accessDecision"><span class="official-round-icon">▣</span><b>購入権限</b><small>本番Square未接続</small><i>›</i></button></div>';return node;
  }
  const overviewFor=id=>id==='food'?foodOverview():id==='training'?trainingOverview():id==='recovery'?recoveryOverview():id==='record'?recordOverview():id==='settings'?settingsOverview():null;

  function decorateNav() {
    document.querySelector('header')?.classList.add('official-source-header');const nav=document.querySelector('.bottom');if(!nav)return;
    const labels={today:['⌂','今日'],map:['⌖','マップ'],food:[officialIcons.food,'食事'],training:[officialIcons.training,'トレーニング'],recovery:['♡','回復＋'],record:['▤','記録・特典'],settings:['♙','プロフィール']};
    nav.querySelectorAll('[data-page]').forEach(node=>{const value=labels[node.dataset.page];if(!value||node.dataset.officialNav)return;node.dataset.officialNav='1';node.innerHTML=`<span>${value[0]}</span><small>${value[1]}</small>`});
  }
  function decoratePage(id) {
    const target=byId(id),meta=screens[id];if(!target||!meta)return;target.classList.add('official-page',`official-page-${id}`);
    target.querySelectorAll(':scope > .premium-stage').forEach(node=>node.remove());let top=target.querySelector(`:scope > [data-official-hero="${id}"]`);
    if(!top)top=hero(id,meta);
    if(target.firstElementChild!==top)target.prepend(top);
    for(const node of Array.from(target.children)){
      if(node===top)continue;
      if(node.id==='date'||node.matches(':scope > .eyebrow, :scope > h1, :scope > .lead, :scope > .title-row, :scope > .guide'))node.classList.add('official-legacy-intro');
      else node.classList.remove('official-legacy-intro');
    }
    let overview=target.querySelector(`:scope > [data-official-overview="${id}"]`);
    if(!overview){overview=overviewFor(id);if(overview)overview.dataset.officialOverview=id}
    if(overview&&top.nextElementSibling!==overview)top.after(overview);
  }
  function decorateToday() {
    const target=byId('today'),top=target?.querySelector('[data-official-hero="today"]'),board=byId('automaticDashboard');if(!target||!top||!board)return;
    target.querySelectorAll(':scope > #date, :scope > .eyebrow, :scope > h1, :scope > .lead, :scope > .title-row, :scope > .guide').forEach(node=>node.classList.add('official-legacy-intro'));
    board.classList.add('official-dashboard','official-today-dashboard');if(top.nextElementSibling!==board)top.after(board);
    const labels=['歩数','摂取カロリー','総消費カロリー','消費 − 摂取','回復状態','PFC'];
    board.querySelectorAll('.automatic-metric').forEach((card,index)=>{
      card.dataset.todayMetric=String(index+1);const label=card.querySelector('small'),value=card.querySelector('b'),source=card.querySelector('span');
      if(index===1&&!card.querySelector('[data-body-icon="food"]')){
        card.insertAdjacentHTML('afterbegin',officialIcons.food);card.classList.add('has-official-icon');
      }
      if(label&&labels[index])label.textContent=labels[index];
      const raw=value?.textContent.trim()||'';let missing=/^(未取得|未算出|未入力|未記録|—)$/.test(raw);
      card.classList.remove('is-partial');
      if(index===5&&/^P\s/.test(raw)){
        const parts=raw.match(/^P\s*([^/]+)\/\s*F\s*([^/]+)\/\s*C\s*(.+)$/);
        if(parts){
          const values=parts.slice(1).map(part=>part.trim().replace(/\s*g$/,''));missing=values.every(part=>part==='—'||part==='未記録');
          if(!missing&&value){value.textContent=['P','F','C'].map((key,i)=>`${key} ${values[i]==='—'||values[i]==='未記録'?'未記録':values[i]+'g'}`).join(' / ');card.classList.toggle('is-partial',values.some(part=>part==='—'||part==='未記録'))}
        }
      }
      card.classList.toggle('is-missing',missing);
      if(missing&&value&&value.textContent!=='未記録')value.textContent='未記録';
      if(missing&&source&&source.textContent!=='入力・取得なし')source.textContent='入力・取得なし';
    });
    let next=target.querySelector('[data-official-today-actions]');
    if(!next){next=actionStrip([{label:'食事',icon:officialIcons.food,page:'food'},{label:'運動',icon:officialIcons.training,page:'training'},{label:'回復',icon:'☾',page:'recovery'}],'今日の記録');next.dataset.officialTodayActions='1';board.after(next)}
    next.classList.add('official-today-actions');
    if(!next.querySelector('.official-today-record-primary')){
      const record=action('睡眠・疲れを記録する',{page:'recovery',icon:'✎',note:'ストレス・痛みも同じ画面で記録',className:'official-today-record-primary'});
      next.querySelector('h2')?.after(record);
    }
  }
  function decorateMap() {
    const target=byId('map'),top=target?.querySelector('[data-official-hero="map"]'),safe=byId('bodySafeMapConnection');if(!target||!top||!safe)return;safe.classList.add('official-map-primary');if(top.nextElementSibling!==safe)top.after(safe);
    const heading=safe.querySelector('h2');if(heading)heading.textContent='MAP・SAFE・SOS';const sos=safe.querySelector('h3');if(sos)sos.id='mapSosAnchor';
    if(!safe.querySelector('.official-map-tools')){const tools=document.createElement('div');tools.className='official-map-tools';tools.append(action('MAP',{focus:'activateSafeMap'}),action('SAFE',{focus:'activateSafeMap'}),action('SOS',{focus:'mapSosAnchor',className:'official-action official-danger'}));safe.prepend(tools)}
  }
  function activateMap() {
    const target=byId('map'),open=byId('activateSafeMap'),canvas=byId('bodySafeMapCanvas');if(!target||target.hidden||!open||!canvas)return;
    // OSM tiles are an external request. Keep the existing activation button as
    // the explicit consent boundary instead of opening the map on navigation.
    if(canvas.hidden)return;
    const load=byId('safeRegionLoad'),select=byId('safeRegionSelect');if(load&&select&&select.options.length<2&&!load.dataset.officialRequested){load.dataset.officialRequested='1';load.click()}
    if(select&&select.options.length>1&&!select.value&&!select.dataset.officialInitial){select.dataset.officialInitial='1';select.value=select.options[1].value;select.dispatchEvent(new Event('change',{bubbles:true}))}
    const status=byId('bodySafeMapStatus');
    const moveToRegisteredRegion=()=>{
      if(!select||select.options.length<2||select.dataset.officialMoved)return false;
      if(!select.value)select.value=select.options[1].value;
      if(!/表示できます|表示しました|利用できます/.test(status?.textContent||''))return false;
      select.dataset.officialMoved='1';byId('safeRegionGo')?.click();return true;
    };
    if(!moveToRegisteredRegion()&&status&&!status.dataset.officialRegionWatch){
      status.dataset.officialRegionWatch='1';
      const watch=new MutationObserver(()=>{if(moveToRegisteredRegion())watch.disconnect()});
      watch.observe(status,{childList:true,subtree:true,characterData:true});
    }
  }
  function safeData(){try{return typeof data==='object'&&data?data:{}}catch{return{}}}
  function updateTraining() {
    const source=safeData(),workouts=Array.isArray(source.workouts)?source.workouts:[],plans=Array.isArray(source.weeklyMenus)?source.weeklyMenus:[],today=day();
    const planned=plans.filter(x=>x.day===today),done=workouts.filter(x=>x.day===today),previous=workouts.filter(x=>x.day<today).sort((a,b)=>b.day.localeCompare(a.day)||b.at.localeCompare(a.at))[0];
    const values={plan:planned.length?`${planned.length}件・予定`:'未設定',previous:previous?`${previous.name} ${previous.sets?.[0]?.kg??'—'}kg`:'記録なし',today:done.length?`${done.length}件・${done.reduce((sum,x)=>sum+(x.sets?.length||0),0)}セット`:'未記録'};
    document.querySelectorAll('[data-training]').forEach(node=>node.textContent=values[node.dataset.training]||'未記録');
  }
  function updateCharts() {
    const source=safeData(),workouts=Array.isArray(source.workouts)?source.workouts:[],foods=Array.isArray(source.foods)?source.foods:Array.isArray(source.meals)?source.meals:[],days=source.days&&typeof source.days==='object'?Object.values(source.days):[];
    const foodByDay=new Map();foods.forEach(x=>{const value=Number(x.kcal);if(Number.isFinite(value))foodByDay.set(x.day,(foodByDay.get(x.day)||0)+value)});
    const weights=(Array.isArray(source.weights)?source.weights:[]).map(x=>Number(x.weight)).filter(Number.isFinite);const profileWeight=Number(source.profile?.weight);if(!weights.length&&Number.isFinite(profileWeight))weights.push(profileWeight);
    const entries={weight:{value:weights.length?`${weights.at(-1)} kg`:'',values:weights},food:{value:foods.length?`${foods.length}件`:'',values:Array.from(foodByDay.values()).slice(-7)},training:{value:workouts.length?`${workouts.length}回`:'',values:workouts.slice(-7).map(x=>Array.isArray(x.sets)?x.sets.reduce((s,y)=>s+Number(y.kg||0)*Number(y.reps||0),0):0)},walk:{value:byId('stepsMetric')?.textContent?.trim(),values:days.map(x=>Number(x.steps)).filter(Number.isFinite)},recovery:{value:recoveryState().state==='未記録'?'':recoveryState().state,values:days.map(x=>Number(x.sleep)).filter(Number.isFinite)},benefit:{value:'',values:[]}};
    Object.entries(entries).forEach(([key,entry])=>{const card=document.querySelector(`[data-chart="${key}"]`);if(!card)return;card.querySelector('.official-chart-value').textContent=entry.value&&!/^—$/.test(entry.value)?entry.value:'記録後に表示';const bars=Array.from(card.querySelectorAll('.official-bars i')),values=entry.values.slice(-bars.length),top=Math.max(0,...values);bars.forEach((bar,index)=>{const current=values[index-(bars.length-values.length)];bar.style.height=top&&Number.isFinite(current)?`${Math.max(8,current/top*100)}%`:'8%';bar.classList.toggle('has-value',Number.isFinite(current))})});
  }
  function update() {
    document.querySelectorAll('[data-mirror]').forEach(node=>{const value=byId(node.dataset.mirror)?.textContent?.trim();if(value)node.textContent=value});
    const state=recoveryState();document.querySelectorAll('[data-recovery]').forEach(node=>node.textContent=state[node.dataset.recovery]);
    const recoveryMetric=document.querySelector('#automaticMetricGrid .automatic-metric:nth-child(5) b');if(recoveryMetric&&state.score!=='—')recoveryMetric.textContent=`${state.state} ${state.score}`;
    const source=safeData(),profile=source.profile||{},energy=source.energyProfile||{},values={name:profile.name||'未設定',age:energy.age?`${energy.age}歳`:'年齢未設定',height:profile.height?`身長 ${profile.height}cm`:'身長未設定',weight:profile.weight?`体重 ${profile.weight}kg`:'体重未設定'};
    document.querySelectorAll('[data-profile]').forEach(node=>node.textContent=values[node.dataset.profile]);updateTraining();updateCharts();
  }
  function decorate() {
    document.body.classList.remove('body-premium-v3');document.body.classList.add('body-official-reference');document.body.dataset.currentScreen=Array.from(document.querySelectorAll('.page')).find(node=>!node.hidden)?.id||'today';decorateNav();Object.keys(screens).forEach(decoratePage);decorateToday();decorateMap();update();activateMap();
  }
  if(typeof show==='function'&&!show.officialWrapped){const previous=show;const wrapped=function(id){const result=previous(id);document.body.dataset.currentScreen=id==='care'?'recovery':id;requestAnimationFrame(()=>{decorate();if(id==='map')activateMap()});return result};wrapped.officialWrapped=true;show=wrapped}
  document.addEventListener('click',event=>{const control=event.target.closest('button');if(control){control.classList.add('is-pressed');setTimeout(()=>control.classList.remove('is-pressed'),180)}requestAnimationFrame(update)});
  document.addEventListener('input',()=>requestAnimationFrame(update));document.addEventListener('change',()=>requestAnimationFrame(update));
  let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}).observe(document.body,{childList:true,subtree:true});
  decorate();window.addEventListener('load',decorate,{once:true});
})();
