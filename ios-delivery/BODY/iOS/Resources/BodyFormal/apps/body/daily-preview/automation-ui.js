'use strict';
(()=>{
 const A=BodyAutomation;
 const article=(parent,id,html,where='append')=>{const n=document.createElement('article');n.id=id;n.className='panel management-panel';n.innerHTML=html;const p=$(parent);where==='prepend'?p.prepend(n):p.append(n);return n};
 article('#today','automaticDashboard',`
  <div class="automatic-heading"><div><span class="eyebrow">TODAY STATUS</span><h2>今日の身体管理</h2></div><div class="automation-badges"><span>ルールベース</span><span>実AI未接続</span></div></div>
  <div id="automaticMetricGrid" class="automatic-metric-grid"></div>
  <div id="targetEnergyGap" class="target-energy-gap" role="status"></div>
  <div class="day-mode-switch" aria-label="今日の活動区分"><span>今日</span><button type="button" data-activity-mode="workday">勤務日</button><button type="button" data-activity-mode="holiday">休日</button></div>
  <details class="automatic-detail"><summary>計算根拠・改善候補</summary><p id="totalEnergyBasis" class="management-status"></p><div id="automaticInsights"></div><p class="note">日中の値は途中経過です。診断や原因の断定ではありません。自動取得・推定・本人入力・未取得を区別します。</p></details>`,'prepend');
 article('#recovery','automaticRecovery','<span class="eyebrow">CHECK TOGETHER</span><h2>睡眠・主観記録からの確認候補</h2><div id="recoveryAutomaticRows"></div><p class="note">ルールベースの候補です。心拍・HRV・痛みから診断しません。</p>');
 article('#record','automaticWeekly','<span class="eyebrow">7 DAYS REVIEW</span><h2>週間振り返り</h2><p id="automaticWeeklyText"></p><p class="note">現在はルールベース。実AI・会員別クラウド分析は未接続です。</p>','prepend');
 article('#settings','energyProfilePanel',`
  <span class="eyebrow">ENERGY ESTIMATE</span><h2>初回プロフィール・活動量</h2>
  <form id="energyProfileForm">
   <div class="form-grid">
    <label>年齢<input name="age" type="number" min="10" max="120" step="1"></label>
    <label>計算に使う身体条件<select name="sexForFormula"><option value="">未設定</option><option value="male">男性式</option><option value="female">女性式</option></select></label>
   </div>
   <label>仕事・主な活動<select name="occupation"><option value="">未設定</option><option>医師</option><option>看護師</option><option>デスクワーク</option><option>受付</option><option>販売</option><option>力仕事</option><option>アスリート</option><option>学生</option><option>介護士</option><option>家事・主婦／主夫</option><option>ドライバー</option><option>警察</option><option>消防</option><option>その他</option></select></label>
   <label>その他の職業名<input name="customOccupation" maxlength="80"></label>
   <div class="form-grid"><label>勤務時間／日<input name="workHours" type="number" min="0" max="24" step="0.5"></label><label>通常日の初期値<select name="defaultDayMode"><option value="">未設定</option><option value="workday">勤務日</option><option value="holiday">休日</option></select></label></div>
   <label>活動割合のかんたん設定<select name="workActivity"><option value="">個別に設定</option><option value="seated">座位中心</option><option value="standing">立位中心</option><option value="walking">歩行中心</option><option value="heavy">身体作業中心</option></select></label>
   <fieldset class="activity-ratios"><legend>勤務中の割合（合計100%）</legend><label>座位<input name="seatedPct" type="number" min="0" max="100" step="1" inputmode="numeric"><span>%</span></label><label>立位<input name="standingPct" type="number" min="0" max="100" step="1" inputmode="numeric"><span>%</span></label><label>歩行<input name="walkingPct" type="number" min="0" max="100" step="1" inputmode="numeric"><span>%</span></label><label>身体作業<input name="heavyPct" type="number" min="0" max="100" step="1" inputmode="numeric"><span>%</span></label><output id="activityRatioTotal">合計 —</output></fieldset>
   <div class="form-grid"><label>勤務日の仕事外<select name="dailyActivity"><option value="">未設定</option><option value="low">少なめ</option><option value="standard">標準</option><option value="high">多め</option></select></label><label>休日の活動傾向<select name="holidayActivity"><option value="">未設定</option><option value="low">少なめ</option><option value="standard">標準</option><option value="high">多め</option></select></label></div>
   <button type="submit">初回設定を保存</button>
  </form>
  <p id="energyProfileResult" class="management-status"></p>
  <p class="note">職業名だけでは計算しません。Mifflin-St Jeor式または体重×22の安静時目安に、勤務・休日の活動増分を加えます。HealthKit実測がある期間は同じ仕事・歩行・運動を重ねて加算しません。</p>`,'prepend');
 article('#settings','squareReadiness','<span class="eyebrow">ACCESS & SQUARE</span><h2>月額利用・権限の接続状態</h2><p class="management-status">一般向け：月額1,480円（税込）／Sandbox Catalog 4オブジェクト確認済み</p><ol><li>S.u.G OSAKA対象会員：会員特典</li><li>一般購入者：body_generalのみ</li><li>Sandbox既存契約：DEACTIVATED</li><li>Invoice・Payment：0件</li><li>Production・Webhook公開・本番DB：未接続</li></ol><p>区分：会員本人／一般BODY購入者／指導者／管理者</p><p class="note">決済完了画面だけでは権限を付けません。購入ボタン・秘密鍵・本番接続はこの候補に置いていません。</p>');
 const voice=document.createElement('button');voice.type='button';voice.textContent='音声入力候補';voice.onclick=()=>{show('food');const dish=$('#foodForm').elements.dish;dish.focus();dish.scrollIntoView({block:'center'});text('#foodEntryStatus','iPhoneキーボードのマイクで料理名を入力できます。BODYは音声を録音・送信しません。')};$('#foodQuickEntry .food-actions').append(voice);
 const catalogNote=$('#foodSearchPanel .note');catalogNote.textContent=`日本食品標準成分表（八訂）増補2023年の確認済み${BodyFoodCatalog.foods.length}食品を端末内で検索。可食部100g当たりの値です。食品状態（生・ゆで等）を確認し、商品・外食の表示値は手入力してください。`;
 function filterRecipes(){const goal=$('#recipeGoal').value,byName=new Map(BodyFoodCatalog.recipes.map(x=>[x.name,x]));for(const row of Array.from($('#foodExamples').children)){const recipe=byName.get(row.querySelector('b')?.textContent);if(recipe&&recipe.goal!=='共通'&&recipe.goal!==goal)row.remove()}}
 for(const id of ['recipeGoal','recipeScene','recipeSlot'])$('#'+id).addEventListener('change',filterRecipes);filterRecipes();
 const form=$('#energyProfileForm'),fields=()=>Array.from(form.elements).filter(x=>x.name);let rendered=new Map(fields().map(x=>[x,x.value]));
 function updateRatioTotal(){const names=['seatedPct','standingPct','walkingPct','heavyPct'],values=names.map(n=>form.elements[n].value).filter(v=>v!=='').map(Number),total=values.length===4?values.reduce((a,b)=>a+b,0):null,out=$('#activityRatioTotal');out.textContent=total===null?'合計 —':`合計 ${total}%`;out.classList.toggle('invalid',total!==null&&total!==100)}
 function fillEnergy(){for(const x of fields())x.value=data.energyProfile?.[x.name]??'';rendered=new Map(fields().map(x=>[x,x.value]));updateRatioTotal()}
 const presets={seated:[80,15,5,0],standing:[20,60,20,0],walking:[10,25,60,5],heavy:[10,20,30,40]};
 form.elements.workActivity.addEventListener('change',()=>{const p=presets[form.elements.workActivity.value];if(p)['seatedPct','standingPct','walkingPct','heavyPct'].forEach((n,i)=>form.elements[n].value=p[i]);updateRatioTotal()});
 for(const n of ['seatedPct','standingPct','walkingPct','heavyPct'])form.elements[n].addEventListener('input',updateRatioTotal);
 const metric=(host,title,value,unit,source,state='')=>{const card=document.createElement('div');card.className='automatic-metric';const small=document.createElement('small'),b=document.createElement('b'),meta=document.createElement('span');small.textContent=title;b.textContent=value===null||value===undefined||value===''?'未取得':String(value)+(unit?' '+unit:'');meta.textContent=[state,source].filter(Boolean).join(' ／ ')||'未取得';card.append(small,b,meta);host.append(card)};
 function draw(){
  const board=A.dashboard(data,day()),e=board.energy,m=board.metrics,grid=$('#automaticMetricGrid');grid.replaceChildren();
  metric(grid,'歩数',m.steps.value===null?null:Number(m.steps.value).toLocaleString('ja-JP'),m.steps.unit,m.steps.source,m.steps.source==='healthkit_native'?'自動取得':m.steps.value===null?'':'本人入力');
  metric(grid,'摂取',m.intake.value===null?null:Number(m.intake.value).toLocaleString('ja-JP'),m.intake.unit,m.intake.source,board.food.complete?'完了確認済み':'記録途中');
  metric(grid,'総消費',e.value===null?null:Number(e.value).toLocaleString('ja-JP'),e.unit,e.source,e.label);
  metric(grid,'消費 − 摂取',m.balance.value===null?null:(m.balance.value>0?'+':'')+Number(m.balance.value).toLocaleString('ja-JP'),m.balance.unit,m.balance.source,m.balance.state);
  metric(grid,'回復',m.recovery.value,'',m.recovery.source,m.recovery.value===null?'':m.recovery.state||'主観');
  metric(grid,'PFC',m.pfc.value,m.pfc.unit,m.pfc.source,board.food.complete?'完了確認済み':'記録途中');
  const gap=$('#targetEnergyGap');gap.textContent=m.difference.value===null?'目標との差：食事完了後に表示':`目標との差：${m.difference.value>=0?'残り':'超過'} ${Math.abs(m.difference.value).toLocaleString('ja-JP')} kcal`;gap.classList.toggle('ready',m.difference.value!==null);
  const parts=e.value===null?'':[`安静時 ${e.restingEnergy??'—'} kcal`,`活動 ${e.activeEnergy??'—'} kcal`,e.workEnergy!==undefined?`勤務増分 ${e.workEnergy} kcal`:'',e.dailyEnergy!==undefined?`生活増分 ${e.dailyEnergy} kcal`:''].filter(Boolean).join(' ／ '),period=e.coverageStart||e.coverageEnd?` ／ 集計 ${e.coverageStart||'不明'}〜${e.coverageEnd||'不明'}`:'';
  text('#totalEnergyBasis',e.value===null?e.reason:`${e.label} ／ ${parts}${period}\n${e.reason}`);
  text('#energyProfileResult',e.value===null?e.reason:`${e.label} ${e.value.toLocaleString('ja-JP')} ${e.unit} ／ ${e.reason}`);
  const mode=data.days?.[day()]?.activityMode||data.energyProfile?.defaultDayMode||'';document.querySelectorAll('[data-activity-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.activityMode===mode);b.setAttribute('aria-pressed',String(b.dataset.activityMode===mode))});
  const rows=$('#automaticInsights');rows.replaceChildren();for(const x of A.insights(data,day())){const row=document.createElement('div');row.className='management-row';const b=document.createElement('b'),p=document.createElement('p');b.textContent=x.title;p.textContent=x.text;row.append(b,p);rows.append(row)}const recoveryRows=$('#recoveryAutomaticRows');recoveryRows.replaceChildren(...Array.from(rows.children).filter(x=>x.textContent.includes('回復')||x.textContent.includes('症状')).map(x=>x.cloneNode(true)));if(!recoveryRows.children.length){const p=document.createElement('p');p.textContent='回復に関する強い変更候補は現在の記録からは出ていません。未取得項目は判断に使っていません。';recoveryRows.append(p)}text('#automaticWeeklyText',A.weekly(data,day()).text);filterRecipes()
 }
 document.querySelectorAll('[data-activity-mode]').forEach(button=>button.addEventListener('click',()=>{const n=nextData();n.days[day()]={...(n.days[day()]||{}),activityMode:button.dataset.activityMode,activityModeSource:'manual',updatedAt:new Date().toISOString()};if(save(n))notify(button.textContent+'として消費推定を更新しました')}));
 form.onsubmit=e=>{e.preventDefault();const n=nextData(),v=Object.fromEntries(new FormData(form)),ratios=['seatedPct','standingPct','walkingPct','heavyPct'].map(k=>v[k]).filter(x=>x!=='').map(Number);if(ratios.length&& (ratios.length!==4||ratios.reduce((a,b)=>a+b,0)!==100)){notify('勤務中の活動割合は合計100%にしてください');return}n.energyProfile={...v,updatedAt:new Date().toISOString()};if(save(n))notify('初回プロフィールと活動量を保存しました')};
 const priorRender=render;render=function(){const pending=fields().filter(x=>rendered.has(x)&&x.value!==rendered.get(x)).map(x=>[x,x.value]);priorRender();fillEnergy();for(const[x,v]of pending)x.value=v;updateRatioTotal();draw()};fillEnergy();draw();
})();

