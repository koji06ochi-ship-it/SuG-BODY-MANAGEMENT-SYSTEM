'use strict';
// Reorganise existing DOM: listeners, draft values, and storage stay with their nodes.
(() => {
  const screens = [['today','今日','◉'],['map','マップ','⌖'],['food','食事','◫'],['training','トレーニング','＋'],['recovery','回復＋','♡'],['record','記録・特典','▤'],['settings','プロフィール・連携設定','⚙']];
  const settings = document.createElement('section');
  settings.id='settings';settings.className='page';settings.hidden=true;
  settings.innerHTML='<span class="eyebrow">PROFILE & CONNECTIONS</span><h1>自分のこと。<br>つながる記録。</h1><p class="lead">目標と基本情報、データの受け取りをここで。</p>';
  $('main').insertBefore(settings,$('footer'));
  settings.append($('#profileForm').closest('details'));
  const connections=document.createElement('article');connections.className='panel';
  connections.innerHTML='<span class="eyebrow">HEALTHCARE</span><h2>ヘルスケア連携</h2><p class="connection-state">実機接続：未確認</p><p>歩数・睡眠・体重は、受信済みデータを確認してから取り込めます。</p><dl class="connection-list"><dt>歩数・睡眠・体重</dt><dd>取込口あり／実機受信は未確認</dd><dt>歩行距離・体脂肪率・活動エネルギー</dt><dd>この受入口には未接続</dd><dt>HealthKitの許可状態</dt><dd>この画面では取得していません</dd><dt>最終同期日時</dt><dd>未取得</dd></dl><p class="note">受信データの確認日時と、HealthKitの同期日時は別です。未取得値を0に置き換えません。</p>';
  settings.append(connections,$('#healthIntake'));
  const care=$('#care');care.classList.remove('page');care.hidden=false;
  $('#recovery').append(care);
  $('#recovery h1').textContent='確かめて、整えて、もう一度。';
  const careHeading=care.querySelector('h1');const h2=document.createElement('h2');h2.textContent=careHeading.textContent;careHeading.replaceWith(h2);
  const recoveryTabs=document.createElement('div');recoveryTabs.className='screen-actions';
  recoveryTabs.innerHTML='<button type="button" data-focus="recoveryForm">今日の調子</button><button type="button" data-focus="care">痛み・ケア・再確認</button>';
  $('#recovery h1').after(recoveryTabs);
  const nav=$('.bottom');nav.replaceChildren();
  for(const[id,label,icon]of screens){
    const button=document.createElement('button');button.type='button';button.dataset.page=id;
    const mark=document.createElement('span');mark.textContent=icon;button.append(mark,document.createTextNode(label));nav.append(button);
  }
  const avatar=$('header .avatar');avatar.dataset.page='settings';avatar.textContent='設定';avatar.setAttribute('aria-label','プロフィール・連携設定を開く');
  const originalShow=show;
  show=function(id){const target=id==='care'?'recovery':id;originalShow(target);if(id==='care')care.scrollIntoView({block:'start'});};
  const actions=(html)=>{const el=document.createElement('article');el.className='panel tool-entry';el.innerHTML=html;return el;};
  $('#food .cast-guide').after(actions('<span class="eyebrow">FOOD TOOLS</span><h2>目安を調べる・一食を残す。</h2><a class="tool-link" href="https://s-u-g-body-calculator.vercel.app/" target="_blank" rel="noopener noreferrer">カロリー・PFCを調べる ↗</a><p class="note">既存ツールを別タブで開きます。計算結果の自動取込みは未接続です。</p><button type="button" class="wide" data-focus="foodForm">写真・手入力で食事を記録 ↓</button>'));
  const trainingChoices=actions('<span class="eyebrow">PLAN → PRACTICE → RECORD</span><h2>今日のメニューを組もう。</h2><p>プランを作り、実際に行った内容を残す。</p><a class="tool-link" href="https://koji06ochi-ship-it.github.io/-SuG-TRAINING-PLAN-GENERATOR/" target="_blank" rel="noopener noreferrer">既存ツールでプランを作る ↗</a><p class="note">別タブで開きます。作成結果の自動取込みは未接続です。</p><div class="screen-actions"><button type="button" data-focus="body531Plan">5/3/1で計画</button><button type="button" data-focus="trainingForm">メニューを記入</button><button type="button" data-page="today">今日の提案を見る</button></div><p class="note">計画と実績は別の記録。5/3/1の進行と通常の増量提案も分けて扱います。</p>');
  $('#training h1').after(trainingChoices);
  $('#planTM').closest('details').id='body531Plan';
  // Keep the existing plan, its explanation and listeners intact; bring it near the choice.
  trainingChoices.after($('#body531Plan'));
  const screenIndex=document.createElement('nav');screenIndex.className='screen-index';screenIndex.setAttribute('aria-label','7画面の一覧');
  const title=document.createElement('h2');title.textContent='BODYでできること';screenIndex.append(title);
  for(const[id,label]of screens){const button=document.createElement('button');button.type='button';button.dataset.page=id;button.textContent=label+' →';screenIndex.append(button);}
  $('#today .point-strip').before(screenIndex);
  const memberBack=document.createElement('a');memberBack.href='../../../member-hub.html';memberBack.className='tool-link';memberBack.textContent='会員HUBへ戻る（BODY・QUEST・WALK・会員証） ↗';settings.append(memberBack);
  $('#weightMetric').closest('button').dataset.page='settings';
  // Existing callers that deliberately point to record are preserved; settings also has a direct entry there.
  const profileShortcut=document.createElement('button');profileShortcut.type='button';profileShortcut.className='wide';profileShortcut.dataset.page='settings';profileShortcut.textContent='プロフィール・連携設定 →';$('#record .cast-guide').after(profileShortcut);
  document.addEventListener('click',event=>{const button=event.target.closest('[data-focus]');if(!button)return;const node=document.getElementById(button.dataset.focus);if(!node)return;for(let parent=node;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;node.scrollIntoView({behavior:'smooth',block:'start'});});
  const refreshLabel=()=>{const route=connectionRoute(data.profile,data.days[day()]||{});if(route.page==='record'&&(!data.profile.goal||!data.profile.weight))$('#dailyNextAction').onclick=()=>show('settings');text('#planText','今日の状態に合わせた候補を下で確認できます。予定と実施記録は別に残します。');const chip=$('.training .chips span:last-child');if(chip)chip.textContent='入力からの候補・本人が確認';};
  // A save redraws every screen. Keep edits in the other profile/day forms
  // without treating those edits as saved records. Reload still reads saved data.
  const draftFields=()=>['profileForm','walkForm','recoveryForm'].flatMap(id=>Array.from(document.getElementById(id).elements).filter(field=>field.name));
  let renderedValues=new Map(draftFields().map(field=>[field,field.value]));
  let renderedDate=day();
  const originalRender=render;render=function(){
    const pending=renderedDate===day()?draftFields().filter(field=>renderedValues.has(field)&&field.value!==renderedValues.get(field)).map(field=>[field,field.value]):[];
    originalRender();refreshLabel();
    renderedValues=new Map(draftFields().map(field=>[field,field.value]));renderedDate=day();
    for(const[field,value]of pending)field.value=value;
  };refreshLabel();
  show((window.BodyTrainingInitialHash||location.hash).slice(1));
})();
