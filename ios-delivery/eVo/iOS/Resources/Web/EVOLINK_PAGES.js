/* Page-only presentation adapter. Existing calculators, storage, consent and restore code own all writes. */
(()=>{'use strict';
const $=s=>document.querySelector(s),all=(s,r=document)=>Array.from(r.querySelectorAll(s)),app=()=>window.EVOLINK_APP,t=(ja,en)=>window.EVOLINK_LOCALE?.language==='en'?en:ja;
const pages={};
function page(id,section,ja,en,back,next,sub){pages[id]={id,section,ja,en,back,next,sub};}
page('home','home','ホーム','Home',null,null);
page('training','training','方式を選ぶ','Choose an approach','home',null,'overview');
page('training-candidates','training','目的に合う方法の候補','Methods for your purpose','training',null,'purpose');
page('training-methods','training','経験者向け：30方式・4分類','Experienced: 30 methods / 4 categories','training',null,'program');
page('training-explanation','training','方法の説明','Method explanation','training-methods','training-plan','program');
page('training-plan','training','計画設定','Set a weekly plan','training-explanation','training-record','program');
page('training-record','training','実施記録','Log actual training','training-plan','training-analysis','records');
page('training-history','training','実施履歴','Training history','training-record',null,'records');
page('training-analysis','training','記録の分析','Analyze training','training-record',null,'analysis');
page('training-tools','training','続き・詳細を選ぶ','Continue / choose a detail','training',null,'overview');
page('training-531','training','5/3/1：TMと週別重量','5/3/1: TM and weekly weights','training-tools','training-plan','program');
page('training-rm','training','推定1RM','Estimated 1RM','training-tools',null,'overview');
page('training-settings','training','方式別の計算・確認条件','Method calculations / checks','training-tools',null,'settings');
page('training-preview','training','選んだ方式の設定・計算','Selected method settings / calculations','training-explanation','training-plan','program');
page('training-overload','training','次回負荷の検討','Review next load','training-tools',null,'records');
page('training-cycle','training','周期・目標日の設定','Cycle / target date','training-tools',null,'program');
page('training-period','training','期間の負荷・本人承認','Period prescription / approval','training-cycle','training-plan','program');
page('training-wave','training','ウェーブローディングの説明','Wave-loading explanation','training-tools','training-wave-plan','program');
page('training-wave-plan','training','ウェーブ：独立計画','Wave: independent plan','training-wave','training-record','program');
page('training-wave-analysis','training','ウェーブの実績分析','Wave performance analysis','training-analysis',null,'analysis');
page('body','nutrition','BODY参照','BODY reference','home','body-settings');
page('body-settings','nutrition','読み取り専用の連携設定','Read-only reference settings','body',null);
page('body-legacy','nutrition','保全した栄養機能','Preserved nutrition tools','body',null);
page('body-food','nutrition','以前の食事記録','Legacy food log','body-legacy',null,'log');
page('body-target','nutrition','以前のPFC計算','Legacy PFC calculator','body-legacy',null,'plan');
page('body-menu','nutrition','以前の参考献立','Legacy sample menus','body-legacy',null,'plan');
page('body-strategy','nutrition','以前の9栄養戦略','Legacy 9 nutrition strategies','body-legacy',null,'strategy');
page('body-event','nutrition','以前の栄養日程','Legacy nutrition schedule','body-legacy',null,'strategy');
page('mirror','mirror','写真比較','Photo comparison','home',null);
page('mirror-measure','mirror','以前の測定記録','Legacy measurements','mirror',null);
page('mirror-history','mirror','以前の測定履歴','Legacy measurement history','mirror-measure',null);
page('mirror-conditions','mirror','写真の比較条件','Photo comparison conditions','mirror',null);
page('coach','coach','対話','Dialogue','home','coach-review');
page('coach-settings','coach','同意・体調の確認','Consent / condition','coach',null);
page('coach-memory','coach','記憶の同意・参照範囲','Memory consent / scope','coach',null);
page('coach-notes','coach','気づきメモ','Memory notes','coach-memory',null);
page('coach-history','coach','保存した対話履歴','Saved dialogue','coach-memory',null);
page('coach-profile','coach','保存した記憶','Saved memory','coach-memory',null);
page('coach-review','coach','本人選択・振り返り','My choice / reflection','coach','coach-reflections');
page('coach-reflections','coach','保存した振り返り','Saved reflections','coach-review',null);
page('coach-draft','coach','指導者向け下書き','Draft for a human coach','coach',null);
page('coach-report','coach','共有前の確認','Review before sharing','coach-draft',null);
page('coach-evidence','coach','過去の接続記録','Historical connection record','coach',null);
page('adapt','adapt','記録の充足・確認','Record coverage','home','adapt-analysis');
page('adapt-analysis','adapt','記録の統合分析','Analyze linked records','adapt','adapt-weekly');
page('adapt-weekly','adapt','週次レビュー','Weekly review','adapt-analysis','adapt-approval');
page('adapt-approval','adapt','次回負荷・本人承認','Next load / personal approval','adapt-weekly','adapt-next');
page('adapt-next','adapt','次の行動を選ぶ','Choose a next action','adapt-approval',null);
page('adapt-recovery','adapt','回復記録','Recovery log','adapt',null);
page('adapt-recovery-history','adapt','回復履歴','Recovery history','adapt-recovery',null);
page('adapt-trends','adapt','長期推移','Long-term trends','adapt',null);
page('adapt-reflection','adapt','振り返りメモ','Reflection note','adapt',null);
page('adapt-reflections','adapt','保存した本人選択','Saved choices / reflections','adapt',null);
page('adapt-history','adapt','適用履歴','Application history','adapt',null);
page('adapt-methods','adapt','方式別の比較','Compare methods','adapt-analysis',null);
page('adapt-combination','adapt','併用技法の比較','Compare combined techniques','adapt-analysis',null);
page('data','home','データ管理','Data management','home',null);
page('data-backup','home','JSONバックアップ','JSON backup','data',null);
page('data-import','home','JSON復元：入力','Restore JSON: input','data',null);
page('data-confirm','home','JSON復元：差分と本人確認','Restore JSON: differences / consent','data-import',null);
page('data-result','home','JSON復元：結果','Restore JSON: result','data',null);
page('data-goal','home','既存の目的設定','Existing goal settings','data',null);
page('data-storage','home','保存状態の管理','Manage browser storage','data',null);
const aliases={nutrition:'body'},trainingSections=new Set(['training','training-candidates','training-methods','training-explanation','training-plan','training-record','training-history','training-analysis']);
let current='home',context={},bridge=false,transition=0,rendering=false,pending=false,validationRequested=false,restoreSucceeded=false,bootReady=false;
let historyPosition=Number(history.state?.evolinkUX?.position)||0;
const drafts=new Map();
const groups=[['record','#trainingForm',()=>JSON.stringify(app().snapshot().logs)],['plan','#weeklyPlanForm',()=>JSON.stringify([app().snapshot().method,app().snapshot().trainingPlan])],['cycle','#focus-cycle-form',()=>JSON.stringify(window.EVOLINK_FOCUS?.cycle)],['wave','#four-wave-form',()=>JSON.stringify(window.EVOLINK_STRATEGIES?.state.wave)],['period','#four-period-form',()=>JSON.stringify([$('#four-period-select')?.value,window.EVOLINK_STRATEGIES?.state.periods])],['talk','#ai-dialogue-form',()=>JSON.stringify([window.EVOLINK_COACH_MEMORY?.KEY&&localStorage.getItem(window.EVOLINK_COACH_MEMORY.KEY),app().snapshot().coachSessions])],['memory','#coach-memory-controls',()=>localStorage.getItem(window.EVOLINK_COACH_MEMORY.KEY)],['review','#reviewNote',()=>JSON.stringify(app().snapshot().review)],['reflection','.final-review',()=>JSON.stringify(app().snapshot().coachSessions)],['weekly','#weeklyReviewForm',()=>JSON.stringify(app().snapshot().weeklyReview)],['measure','#bodyForm',()=>JSON.stringify(app().snapshot().bodyRecords)],['recovery','#recoveryForm',()=>JSON.stringify(app().snapshot().recoveryLogs)],['coachDraft','#coachForm',()=>JSON.stringify(app().snapshot().coachNotes)],['tm','#oneRM',()=>JSON.stringify(app().snapshot().tm)]];
function capture(){for(const [key,selector,revision]of groups){const root=$(selector);if(!root)continue;const fields=(root.matches('input,textarea,select')?[root]:all('input,select,textarea',root)).filter(e=>e.id&&e.type!=='file');if(!fields.length)continue;try{drafts.set(key,{revision:revision(),fields:fields.map(e=>({id:e.id,value:e.value,checked:e.checked})),period:$('#four-period-select')?.value});}catch{}}}
function restoreDrafts(){for(const [key,selector,revision]of groups){const d=drafts.get(key),root=$(selector);if(!d||!root)continue;try{if(d.revision!==revision()){drafts.delete(key);continue;}for(const f of d.fields){const el=document.getElementById(f.id);if(!el||!root.contains(el)||el.type==='file')continue;if(el.type==='checkbox'||el.type==='radio')el.checked=f.checked;else if(el.tagName!=='SELECT'||all('option',el).some(o=>o.value===f.value))el.value=f.value;}}catch{}}const mode=$('#focus-cycle-mode');if(mode){const target=mode.value==='target';$('#focus-cycle-regular').hidden=target;$('#focus-cycle-target-fields').hidden=!target;$('#focus-cycle-target').required=target;}}
function nativeClick(selector){const e=$(selector);if(!e)return false;bridge=true;try{e.click();}finally{bridge=false;}return true;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(section,isCurrent=()=>true){if(!isCurrent())return false;if(document.body.dataset.evoPage!==section)nativeClick('[data-nav="'+section+'"]');for(let i=0;i<80;i++){if(!isCurrent())return false;if(document.body.dataset.evoPage===section&&$('#evolink-aligned-screen'))return true;await sleep(20);}if(!isCurrent())return false;throw Error('Screen unavailable: '+section);}
async function prepare(id,ctx,isCurrent=()=>true){const p=pages[id];if(!await ready(p.section,isCurrent)||!isCurrent())return;if(p.section==='training'){
 if(p.sub==='purpose'){if(!$('.training-purpose-panel')||$('.training-purpose-panel').dataset.purpose!==ctx.purpose)nativeClick('[data-training-purpose="'+(ctx.purpose||'strength')+'"]');}
 else if(p.sub==='overview'){if($('#evolink-aligned-screen').dataset.trainingView!=='overview')nativeClick('[data-training-overview]');}
 else {const kind=p.sub==='settings'?'settings':p.sub,button={program:'training-plan',records:'training-log',analysis:'training-analysis',settings:'training-settings'}[kind];if($('#evolink-aligned-screen').dataset.trainingView!==kind)nativeClick('[data-align="'+button+'"]');}
 await sleep(120);if(!isCurrent())return;
 if(id==='training-531'&&app().snapshot().method!=='5/3/1')nativeClick('[data-method="5/3/1"]');
 if(id==='training-explanation'&&ctx.method&&app().snapshot().method!==ctx.method){nativeClick('[data-ev6-method-group="すべて"]');nativeClick('[data-method="'+CSS.escape(ctx.method)+'"]');}
 if(id==='training-rm'&&!$('#aligned-rm-dialog')?.open)nativeClick('[data-align="one-rm"]');
 if(id==='training-overload')nativeClick('#sug-overload-launch');
 }else if(p.section==='nutrition'&&p.sub&&app().contentData().nutritionSub!==p.sub)nativeClick('[data-nsub="'+p.sub+'"]');
 if(id.startsWith('data-')&&['data-backup','data-import','data-confirm','data-result'].includes(id)){
 let d=$('#completion-dialog'),same=id==='data-backup'?!!d?.querySelector('#completion-backup-json'):!!d?.querySelector('#completion-import-json');
 if(!same){nativeClick('[data-act="'+(id==='data-backup'?'backup':'import')+'"]');await sleep(80);if(!isCurrent())return;d=$('#completion-dialog');}
 if(d&&!d.open)d.showModal();
 }
}
function stateFor(id,ctx){return {evolinkUX:{version:1,route:id,position:historyPosition,context:{purpose:ctx.purpose||'',method:ctx.method||''}}};}
function resetPageTop(token){if(token!==transition)return;const root=$('#evolink-aligned-screen');for(const el of [root,$('#mainContent'),$('.ux-scroll'),...all('dialog[open]')])if(el)el.scrollTop=0;window.scrollTo({top:0,left:0,behavior:'instant'});viewport();}
async function go(id,options={}){id=aliases[id]||id;if(!pages[id])id='home';const same=current===id,token=++transition;capture();const focused=document.activeElement;if(focused?.matches('input,textarea,select'))focused.blur();current=id;context={...context,...options.context};validationRequested=false;
 if(!options.pop){const replace=options.replace||same;if(!replace)historyPosition++;const u=new URL(location.href);u.searchParams.set('view',id);u.hash=pages[id].section;history[replace?'replaceState':'pushState'](stateFor(id,context),'',u.pathname+u.search+u.hash);}
 bridge=true;try{for(const d of all('dialog[open]'))if(!(id==='training-rm'&&d.id==='aligned-rm-dialog')&&!(id.startsWith('data-')&&d.id==='completion-dialog'))d.close();}finally{bridge=false;}
 if(id!=='training-overload')$('#sug-overload-layer')?.classList.remove('open');
 try{await Promise.resolve();if(token!==transition)return;if(!options.prepared)await prepare(id,context,()=>token===transition);if(token!==transition)return;render();resetPageTop(token);requestAnimationFrame(()=>{resetPageTop(token);if(!document.querySelector('dialog[open]'))$('.ux-location h2')?.focus({preventScroll:true});requestAnimationFrame(()=>resetPageTop(token));});}catch(error){if(token!==transition)return;window.EVOLINK_PAGES.lastError=error.message;render();}
}
function back(){if(current==='data-result'){go('data',{replace:true});return;}if(history.state?.evolinkUX&&historyPosition>0)history.back();else go(pages[current].back||'home',{replace:true});}
const menuItems={
 home:[['training','トレーニングを始める','Start training'],['body','BODYを参照','View BODY'],['mirror','写真を比較','Compare photos'],['coach','COACHで振り返る','Reflect in COACH'],['adapt','記録を見直す','Review records']],
 training:[['training-tools','続き・計算・周期・独立戦略','Continue / calculators / cycles / strategies']],
 'training-tools':[['training-plan','週間計画','Weekly plan'],['training-record','実施記録','Log training'],['training-history','実施履歴','History'],['training-analysis','分析','Analysis'],['training-531','5/3/1','5/3/1'],['training-rm','推定1RM','Estimated 1RM'],['training-cycle','周期・目標日・ピーキング','Cycle / target date / peaking'],['training-wave','独立ウェーブローディング','Independent wave loading'],['training-settings','方式別の計算・確認条件','Method calculations / checks'],['training-overload','実績から次回負荷を検討','Review next load from records']],
 'training-explanation':[['training-preview','この方式の設定・計算を見る','View this method’s settings / calculations']],
 'training-methods':[['training-wave','追加の独立戦略：ウェーブローディング','Additional independent strategy: wave loading']],
 'training-plan':[['training-cycle','周期・目標日を設定','Set a cycle / target date'],['training-531','5/3/1の重量を確認','Review 5/3/1 weights']],
 'training-record':[['training-history','保存した履歴を見る','View saved history']],
 'training-analysis':[['training-wave-analysis','独立ウェーブの分析','Independent wave analysis'],['adapt-methods','方式別の比較','Compare methods'],['adapt-combination','併用技法の比較','Compare techniques']],
 'training-cycle':[['training-period','期間ごとの負荷・本人承認','Period prescriptions / approval']],
 body:[['body-legacy','以前の栄養機能（保全領域）','Preserved legacy nutrition']],
 'body-legacy':[['body-food','以前の食事記録','Legacy food log'],['body-target','以前のPFC計算','Legacy PFC calculator'],['body-menu','以前の参考献立','Legacy menus'],['body-strategy','以前の9栄養戦略','Legacy 9 strategies'],['body-event','以前の栄養日程','Legacy nutrition schedule']],
 'coach-draft':[['coach-report','共有前の確認','Review before sharing']],
 mirror:[['mirror-conditions','写真の比較条件','Comparison conditions'],['mirror-measure','以前の測定記録（BODY同期なし）','Legacy measurements (not synced with BODY)']],
 'mirror-measure':[['mirror-history','以前の測定履歴','Legacy measurement history']],
 coach:[['coach-settings','同意・体調を確認','Review consent / condition'],['coach-memory','記憶の同意・管理','Memory consent / management'],['coach-draft','指導者向け下書き','Draft for a human coach'],['coach-evidence','過去の接続記録','Historical connection record']],
 'coach-memory':[['coach-notes','気づきメモ','Memory notes'],['coach-history','対話履歴','Dialogue history'],['coach-profile','保存した記憶','Saved memory']],
 adapt:[['adapt-recovery','回復記録','Recovery log'],['adapt-trends','長期推移','Long-term trends'],['adapt-reflection','振り返りメモ','Reflection note'],['adapt-reflections','保存した本人選択','Saved reflections'],['adapt-history','適用履歴','Application history']],
 'adapt-recovery':[['adapt-recovery-history','回復履歴','Recovery history']],
 data:[['data-backup','JSONを書き出す','Export JSON'],['data-import','JSONを復元する','Restore JSON'],['data-goal','既存の目的設定','Existing goal settings'],['data-storage','保存状態の管理','Manage browser storage']]
};
function label(el,text){if(el.textContent!==text)el.textContent=text;}
function button(route,ja,en){const b=document.createElement('button');b.type='button';b.className='secondary';b.dataset.uxGo=route;b.textContent=t(ja,en);return b;}
function ensureShell(root){let scroller=root.querySelector(':scope>.ux-scroll');if(!scroller){const header=root.querySelector(':scope>.aligned-header'),nav=root.querySelector(':scope>.aligned-navigation');scroller=document.createElement('div');scroller.className='ux-scroll';for(const e of [...root.children])if(e!==header&&e!==nav)scroller.append(e);const bar=document.createElement('header');bar.className='ux-page-header';bar.dataset.evolinkOriginal='';bar.innerHTML='<div class="ux-location"><small></small><h2 tabindex="-1"></h2></div><div class="ux-pager"><button type="button" class="secondary" data-ux-back></button><button type="button" class="secondary" data-ux-next></button></div>';if(header)header.after(bar);else root.prepend(bar);bar.after(scroller);const menu=document.createElement('section');menu.id='ux-task-links';menu.className='ux-task-links';menu.dataset.evolinkOriginal='';scroller.append(menu);const note=document.createElement('p');note.id='ux-empty';note.className='aligned-note';note.dataset.evolinkOriginal='';scroller.append(note);}
 return scroller;}
function leaf(selector){return $(selector);}
function parentPanel(selector){return $(selector)?.closest('.panel');}
function recordHistory(){const c=$('.evo-training-content');if(!c)return [];const form=$('#trainingForm')?.closest('.panel');const a=Array.from(c.children),i=a.indexOf(form);return a.slice(i+1).filter(e=>e.id!=='sug-overload-launch');}
function targets(id){switch(id){
 case 'home':return [$('[data-focus-home-slot] .focus-card')];
 case 'training':return [$('[data-training-purpose]')?.closest('.aligned-card')];
 case 'training-candidates':return [$('.training-purpose-panel')];
 case 'training-methods':return [$('.focus-method-details')];
 case 'training-explanation':return [$('#smg-evolink')];
 case 'training-plan':return [parentPanel('#weeklyPlanForm')];
 case 'training-record':return [parentPanel('#trainingForm')];
 case 'training-history':return recordHistory();
 case 'training-analysis':return [$('.evo-training-content')];
 case 'training-531':return [parentPanel('#oneRM')];
 case 'training-preview':return [$('#smg-evolink')?.nextElementSibling];
 case 'training-settings':return [$('#s30-training-panel')];
 case 'training-cycle':return [$('.focus-cycle')];
 case 'training-period':return [$('#four-period-slot')];
 case 'training-wave':if($('#ux-wave-reading'))return [$('#ux-wave-reading')];return all('#four-wave-details>h3,#four-wave-details>p:not([id])').filter(e=>!e.textContent.includes('ID:'));
 case 'training-wave-plan':return [$('#four-wave-form'),$('#four-wave-message'),...all('#four-wave-details>ol')];
 case 'training-wave-analysis':return [$('#four-analysis-slot')];
 case 'body':return [$('[data-focus-body-slot]>.focus-card')];
 case 'body-settings':return [$('.focus-body-settings')];
 case 'body-food':return [parentPanel('#foodForm'),...all('#aligned-native .loglist')];
 case 'body-target':{const form=parentPanel('#nutritionForm');return form?[form,...Array.from(form.parentElement.children).slice(Array.from(form.parentElement.children).indexOf(form)+1).filter(e=>!e.matches('#aligned-sample-menu,.headingbar,.chipset,.actions,p'))]:[];}
 case 'body-menu':return [$('#aligned-sample-menu')];
 case 'body-strategy':return all('#aligned-native [data-strategy]').map(e=>e.closest('.panel')||e.parentElement);
 case 'body-event':return [parentPanel('#eventForm')];
 case 'mirror':return [$('#aligned-photo-slot')?.closest('.aligned-card')];
 case 'mirror-measure':return [$('#aligned-measure-slot')];
 case 'mirror-history':return [$('#aligned-body-history')];
 case 'mirror-conditions':return [$('#aligned-native .two')?.closest('.panel')];
 case 'coach':return [$('#ai-dialogue-panel')];
 case 'coach-settings':return [$('#coach-dialogue-settings')];
 case 'coach-memory':{const m=$('#coach-memory-controls');return m?Array.from(m.children).filter(e=>e.matches('p,label.checkline,fieldset')&&!e.querySelector('#coach-save-transcript')).concat([$('#coach-memory-save'),$('#coach-memory-status')]):[];}
 case 'coach-notes':return [$('#coach-memory-notes')?.previousElementSibling,$('#coach-memory-notes'),$('#coach-keep-notes')?.closest('label'),$('#coach-memory-save'),$('#coach-memory-status')];
 case 'coach-history':return [$('#coach-memory-history')];
 case 'coach-profile':return [$('#coach-saved-memory')];
 case 'coach-review':return [$('.coach-review-details')];
 case 'coach-reflections':return [$('#completion-saved-reflections')];
 case 'coach-draft':return [parentPanel('#coachForm')];
 case 'coach-report':return [$('#coachReportPanel')];
 case 'coach-evidence':return [$('.coach-history-evidence')];
 case 'adapt':return [$('.adapt-condition-card')];
 case 'adapt-analysis':return [$('#crossAnalytics')];
 case 'adapt-weekly':return [$('#weeklyDecisionPanel')];
 case 'adapt-approval':return [$('#adaptDecision')];
 case 'adapt-next':return [$('#adapt-next-actions')];
 case 'adapt-recovery':return [$('#recoveryPanel')];
 case 'adapt-recovery-history':return [$('#recoveryHistory')];
 case 'adapt-trends':return [$('#longTermTrend')];
 case 'adapt-reflection':return [parentPanel('#reviewNote')];
 case 'adapt-reflections':return [$('#completion-saved-reflections')];
 case 'adapt-history':return [$('#kcalAuditTrail')];
 case 'adapt-methods':return [$('#methodComparison')];
 case 'adapt-combination':return [$('#combinationPanel')];
 case 'data-goal':return all('#ev6-data-manager .ev6-manage-inner>h3,#ev6-data-manager .ev6-manage-inner>.chipset');
 case 'data-storage':return [$('#ev6-data-manager [data-act="storage-check"]'),$('#ev6-data-manager [data-act="erase-data"]'),$('#ux-storage-output')];
 default:return [];
}}
function mask(container,selected){const set=new Set(selected.filter(e=>e&&container.contains(e)));function walk(e){const keep=set.has(e),path=[...set].some(s=>e.contains(s));e.toggleAttribute('data-ux-hidden',!keep&&!path);e.toggleAttribute('data-ux-path',!keep&&path);e.toggleAttribute('data-ux-active',keep);if(!keep&&path){if(e.tagName==='DETAILS')e.open=true;for(const c of e.children)walk(c);}else if(keep){for(const c of all('[data-ux-hidden],[data-ux-path],[data-ux-active]',e)){c.removeAttribute('data-ux-hidden');c.removeAttribute('data-ux-path');c.removeAttribute('data-ux-active');}if(e.tagName==='DETAILS')e.open=true;}}
 for(const c of container.children)walk(c);
}
function render(){if(rendering)return;const root=$('#evolink-aligned-screen');if(!root||!pages[current]||document.body.dataset.evoPage!==pages[current].section)return;rendering=true;try{
 document.body.dataset.evoUx=current;const scroller=ensureShell(root),bar=root.querySelector('.ux-page-header'),p=pages[current],menu=$('#ux-task-links'),items=menuItems[current]||[],sig=current+'|'+(window.EVOLINK_LOCALE?.language||'ja');if(menu.dataset.signature!==sig){menu.replaceChildren(...items.map(r=>button(...r)));menu.dataset.signature=sig;}
 let name=t(p.ja,p.en);if(current==='training-explanation')name=(window.EVOLINK_LOCALE?.translateFixed(app().snapshot().method)||app().snapshot().method);if(current==='training-period'){const row=window.EVOLINK_STRATEGIES?.periodRows().find(r=>r.id===$('#four-period-select')?.value);if(row)name=t(row.ja,row.en)+' · '+t('負荷設定','Prescription');}
 label(bar.querySelector('h2'),name);label(bar.querySelector('small'),progressLabel());bar.querySelector('.ux-location').setAttribute('aria-live','polite');label(bar.querySelector('[data-ux-back]'),t('‹ 戻る','‹ Back'));bar.querySelector('[data-ux-back]').hidden=!p.back;label(bar.querySelector('[data-ux-next]'),t('次へ ›','Next ›'));bar.querySelector('[data-ux-next]').hidden=!p.next;
 if(current==='data-storage'){let out=$('#ux-storage-output');if(!out){out=document.createElement('p');out.id='ux-storage-output';out.className='aligned-note';out.setAttribute('role','status');out.setAttribute('data-evolink-original','');scroller.append(out);}label(out,$('#storageDiagnosticResult')?.textContent||t('保存状態の診断はまだ実施していません。','Storage diagnostic has not been run.'));}
 const selected=targets(current).filter(Boolean),help=beginnerHelp(scroller);if(help)selected.unshift(help);const additionalReading=unifiedContext(scroller);if(additionalReading)selected.push(additionalReading);const scope=readingScope(scroller);if(scope)selected.push(scope);if(items.length)selected.push(menu);const empty=$('#ux-empty');const emptyHistory=['coach-history','coach-profile','coach-reflections','adapt-reflections','mirror-history','adapt-recovery-history'].includes(current)&&selected.filter(e=>e!==help&&e!==scope).every(e=>!e.textContent.trim());if(emptyHistory){label(empty,t('保存した記録はまだありません。','No saved records yet.'));selected.push(empty);}else if(!selected.length&&!['training-rm','training-overload','data-backup','data-import','data-confirm','data-result'].includes(current)){label(empty,t('この画面に表示できる記録はありません。','No records to display on this page.'));selected.push(empty);}mask(scroller,selected);
 if(current==='home')for(const e of all('[data-focus-home-slot] .focus-card:first-child .focus-actions'))e.setAttribute('data-ux-hidden','');
 if(current==='body')$('.focus-body-settings')?.setAttribute('data-ux-hidden','');
 if(current==='training-analysis')for(const e of all('#methodComparison,#combinationPanel,.evo-training-content>.actions,#sug-overload-launch'))e.setAttribute('data-ux-hidden','');
 if(current==='coach')for(const e of all('#coach-dialogue-settings,#coach-memory-controls,.coach-review-details'))e.setAttribute('data-ux-hidden','');
 for(const e of all('.ux-scroll .eyebrow,.ux-scroll .s30-eyebrow,.ux-scroll .evo-training-index'))e.setAttribute('data-ux-hidden','');
 restoreDrafts();for(const [id,ja,en]of [['home','ホーム','HOME'],['training','運動','TRAIN'],['nutrition','BODY','BODY'],['mirror','ミラー','MIRROR'],['coach','コーチ','COACH'],['adapt','振り返り','ADAPT']]){const span=root.querySelector('.aligned-navigation [data-nav="'+id+'"] span');if(span){span.setAttribute('data-evolink-original','');label(span,t(ja,en));}}
 if(window.EVOLINK_MODE==='offline'&&$('#ai-send'))$('#ai-send').disabled=true;
 const status=$('#ai-status');if(status&&window.EVOLINK_MODE==='offline'){status.setAttribute('data-evolink-original','');label(status,t('オフライン：実AI送信は停止中です。','Offline: real AI sending is disabled.'));}
 for(const [selector,ja,en]of [['.evo-training-content>.headingbar:first-child h2','トレーニング実績','Training performance']]){const h=$(selector);if(h&&current==='training-analysis'){h.setAttribute('data-evolink-original','');label(h,t(ja,en));}}
 if(current==='training-overload'){const close=$('#sug-overload-panel .so-close');if(close){close.setAttribute('data-evolink-original','');label(close,t('戻る','Back'));}}
 decorateFields();readablePresentation();recordInputHelp();readingFeedback();renderDialog();unifiedPresentation();viewport();
 }finally{rendering=false;}}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render();});}
function renderDialog(){const d=$('#completion-dialog');if(!d?.open||!current.startsWith('data-'))return;d.dataset.uxDialog=current;let nav=d.querySelector('.ux-dialog-pager');if(!nav){nav=document.createElement('div');nav.className='ux-dialog-pager';nav.dataset.evolinkOriginal='';const b=button('data-import','‹ 戻る','‹ Back');b.removeAttribute('data-ux-go');b.dataset.uxBack='';nav.append(b);const location=document.createElement('strong');location.id='ux-dialog-title';nav.append(location);d.setAttribute('aria-labelledby',location.id);d.prepend(nav);}label(nav.querySelector('[data-ux-back]'),t('‹ 戻る','‹ Back'));const step={'data-import':1,'data-confirm':2,'data-result':3}[current];label(nav.querySelector('#ux-dialog-title'),(step?step+'/3 · ':'')+t(pages[current].ja,pages[current].en));const head=d.querySelector('.visual-dialog-head');if(head){const title=head.querySelector('h2');if(title)label(title,t(pages[current].ja,pages[current].en));const close=head.querySelector('button')||nav.querySelector('[data-ux-close]');if(close){close.dataset.uxClose='';label(close,t('閉じる','Close'));if(close.parentElement!==nav)nav.append(close);}}
 localizeDialog(d);
 if(current==='data-backup')return;
 const check=$('#completion-replace'),memory=$('#completion-restore-memory'),recover=$('#completion-recover'),confirm=$('#completion-recovery-confirm');const selectors=current==='data-import'?[leaf('#completion-import-file'),leaf('#completion-import-json'),leaf('#completion-validate'),leaf('#completion-validation')]:current==='data-confirm'?[leaf('#completion-restore-differences'),check?.closest('label'),memory?.closest('label'),leaf('#completion-restore'),leaf('#completion-validation')]:[leaf('#completion-validation')];selectors.push(nav,recover,confirm?.closest('label'));mask(d,selectors.filter(Boolean));
 const differences=$('#completion-restore-differences');if(validationRequested&&current==='data-import'&&differences?.childElementCount){validationRequested=false;go('data-confirm',{prepared:true});}
}
const dialogCopy=[
 ['No optional differences. Existing memory, reflections, cycles and BODY reference are kept.','任意項目の差分はありません。現在の記憶・振り返り・周期・BODY参照を保持します。'],
 ['Download JSON backup','JSONをダウンロード'],
 ['Preparing backup…','バックアップを準備しています…'],
 ['Keep this private. COACH memory is included only when selected above.','個人用に保管してください。COACH記憶は本人が選択した場合だけ含めます。'],
 ['Ready: saved COACH memory included.','準備完了：保存済みCOACH記憶を含みます。'],
 ['Ready: COACH conversation and memory notes excluded; deletion protection included.','準備完了：COACHの会話・メモは含めず、削除履歴の保護を含みます。'],
 ['Backup could not be prepared. Saved records have not changed. Check pending recovery or browser storage.','バックアップを準備できません。保存記録は変更していません。復旧待ちの状態またはブラウザーの保存状態を確認してください。']
];
function localizeDialog(d){for(const el of all(':scope>p,:scope>a,#completion-backup-status,#completion-restore-differences>p',d)){const entry=dialogCopy.find(([en,ja])=>el.textContent===en||el.textContent===ja);if(entry){el.setAttribute('data-evolink-original','');label(el,t(entry[1],entry[0]));}}const output=d.querySelector('#completion-validation');if(output){const text=output.textContent,parts=[['COACH memory kept.','現在のCOACH記憶を保持しました。'],['Selected COACH memory restored.','本人が選択したCOACH記憶を復元しました。'],['Older COACH memory was excluded; existing memory kept.','古いCOACH記憶を除外し、現在の記憶を保持しました。']];if(window.EVOLINK_LOCALE?.language==='ja')for(const [en,ja]of parts)if(output.textContent.includes(en))label(output,output.textContent.replace(en,ja));}}
const viewportState={width:innerWidth,baseline:Math.max(innerHeight,document.documentElement.clientHeight),keyboard:false};
const editing=()=>document.activeElement?.matches('textarea,select,input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=button]):not([type=submit])');
function viewport(){const vv=window.visualViewport,height=vv?.height||innerHeight,layout=Math.max(innerHeight,document.documentElement.clientHeight),focused=editing();if(Math.abs(innerWidth-viewportState.width)>40){viewportState.width=innerWidth;viewportState.baseline=Math.max(layout,height);}const keyboard=!!focused&&(vv?.scale||1)<1.08&&Math.max(layout,viewportState.baseline)-height>Math.max(120,viewportState.baseline*.18);if(!keyboard)viewportState.baseline=Math.max(layout,height);viewportState.keyboard=keyboard;document.body.toggleAttribute('data-ux-keyboard',keyboard);for(const [key,value]of [['--ux-height',height+'px'],['--ux-offset',(vv?.offsetTop||0)+'px']])if(document.documentElement.style.getPropertyValue(key)!==value)document.documentElement.style.setProperty(key,value);}
function keepFieldVisible(){const field=document.activeElement;if(!editing()||!field)return;const dialog=field.closest('dialog[open]'),scroller=dialog||field.closest('.ux-scroll');if(!scroller)return;const fixed=dialog?.querySelector('.ux-dialog-pager,.visual-dialog-head'),box=field.getBoundingClientRect(),frame=scroller.getBoundingClientRect(),vv=window.visualViewport,top=Math.max(frame.top,vv?.offsetTop||0)+(fixed?.getBoundingClientRect().height||0)+12,bottom=Math.min(frame.bottom,(vv?.offsetTop||0)+(vv?.height||innerHeight))-12;if(box.bottom>bottom)scroller.scrollTop+=box.bottom-bottom;else if(box.top<top)scroller.scrollTop-=top-box.top;}
let viewportFrame=false;function viewportChanged(){viewport();if(viewportFrame)return;viewportFrame=true;requestAnimationFrame(()=>{viewportFrame=false;keepFieldVisible();});}
function progressLabel(){const p=pages[current],section=p.section==='nutrition'?'BODY':p.section.toUpperCase();const training={'training':1,'training-methods':1,'training-candidates':1,'training-explanation':2,'training-preview':2,'training-wave':2,'training-plan':3,'training-531':3,'training-cycle':3,'training-period':3,'training-wave-plan':3,'training-record':4,'training-history':4,'training-analysis':5,'training-wave-analysis':5};const adapt=['adapt','adapt-analysis','adapt-weekly','adapt-approval','adapt-next'],restore=['data-import','data-confirm','data-result'];if(training[current])return section+' · '+training[current]+'/5 '+t(['方式選択','説明','計画','記録','分析'][training[current]-1],['Choose','Explain','Plan','Record','Analyze'][training[current]-1]);if(adapt.includes(current))return section+' · '+(adapt.indexOf(current)+1)+'/5';if(restore.includes(current))return t('データ復元','Data restore')+' · '+(restore.indexOf(current)+1)+'/3';return section+' · '+t('現在の作業','Current task');}
const plainMethods={
 '5/3/1':['TMという基準の重さから、週ごとに練習の重さと回数を変える方法です。ここでは既存の計算結果を確認します。','5/3/1 varies weight and reps each week using a reference weight called Training Max (TM). Review the existing calculations here.'],
 'DUP':['同じ週の中で、重さや回数の重点を日ごとに変えて計画する方法です。毎回すべてを重くする意味ではありません。','DUP plans different weight and repetition emphases on different days within a week. It does not mean making every session heavier.'],
 'ダブルプログレッション':['同じ重さで回数を伸ばし、決めた上限まで安定したら重さを少し増やす方法です。','Double progression increases reps at the same weight, then adds a little weight once the chosen upper rep limit is consistent.'],
 'RPE/RIR':['RPEはきつさの自己評価、RIRは「あと何回できそうか」の目安です。RIR 2は、あと約2回できると感じる状態です。','RPE rates perceived effort. RIR estimates how many reps remain. RIR 2 means you feel you could do about two more reps.']
};
// Readability presentation only: native forms, IDs, calculations and storage retain ownership.
const readingGuides={
 home:[['今日のトレーニングを選びます。','Choose what to work on today.'],['計画・記録・振り返りをここから開けます。','Open your plan, training log or review here.']],
 training:[['どんなトレーニングをしたいか選びます。','Choose the kind of training you want.'],['目的を選ぶと、方法の説明へ進めます。経験者は30方式から直接選べます。','Choose a purpose to see suitable methods. Experienced users can choose from all 30 methods.']],
 'training-candidates':[['候補を読み、自分に合う方法を選びます。','Read the candidates and choose a method.'],['選択だけでは記録されません。説明を読んでから計画へ進みます。','Choosing does not log a workout. Read the explanation, then make a plan.']],
 'training-methods':[['使いたい方法を1つ選びます。','Choose one method to explore.'],['方法の説明を開きます。選ぶだけで重量や記録は変わりません。','This opens its explanation. Choosing alone does not change weights or logs.']],
 'training-plan':[['1週間の実施例を設定します。','Set a weekly training example.'],['種目・週の回数・参考重量を確認し、保存を押します。実際の実施内容は次の記録画面で入力します。','Review the exercise, sessions per week and reference weight, then save. Log what you actually do on the next page.']],
 'training-record':[['実際に行った内容を記録します。','Log what you actually performed.'],['種目と日付を確認し、重量・回数・セット・余力を入力して保存します。','Check the exercise and date. Enter weight, reps, sets and reps left in reserve, then save.']],
 'training-analysis':[['保存した記録の変化を見ます。','Review changes in your saved logs.'],['重量・総挙上量・前回との差を確認します。記録がない項目は推測しません。','Review weight, total volume and changes from the previous entry. Missing records are not estimated.']],
 'training-531':[['5/3/1は、週ごとに重さと回数を変える計画です。','5/3/1 varies weight and reps across weeks.'],['推定1RMから基準重量（TM）を計算し、週を選んで確認します。TMは計画の基準で、毎回挑戦する最大重量ではありません。','Use estimated 1RM to calculate a training max (TM), then choose a week. TM is a planning reference, not a maximum attempt for every session.']],
 'training-rm':[['1RMは、1回だけ挙げられる重さの目安です。','1RM estimates the weight you could lift once.'],['実施したセットの重量と回数を入力して推定します。実際の最大重量テストではありません。','Enter the weight and reps of a completed set. This estimates 1RM; it is not a maximum-lift test.']],
 'training-cycle':[['通常の周期、または目標日からの配置案を作ります。','Create a regular cycle or work backwards from a target date.'],['大会参加は不要です。開始日と期間を選んで保存。重量の反映には別の本人承認が必要です。','Competition is optional. Choose the dates and save. Applying weights requires separate personal approval.']],
 'training-period':[['この期間の重量・回数・セット・余力を確認します。','Review weight, reps, sets and reserve for this period.'],['デロードは疲労軽減、テーパーは目標前の量の調整、ピーキングは目標日の実施計画です。承認するまで週間計画は変わりません。','Deload reduces training stress; taper adjusts volume before a target; peaking plans target-day performance. The weekly plan stays unchanged until approval.']],
 'training-wave':[['ウェーブは、段階ごとに重さと回数を変える方法です。','Wave loading varies weight and reps across stages.'],['3段階を本人が設定する独立計画です。5/3/1や曜日ごとに変えるDUPとは別に扱います。','You set three stages as an independent plan. It stays separate from 5/3/1 and day-to-day DUP.']],
 'training-wave-plan':[['3段階の練習内容を設定します。','Set the three stages of your training.'],['各段階の重量・回数・セット・RIRを入力します。下書き保存と、本人承認して保存を区別してください。','Enter weight, reps, sets and RIR for each stage. Saving a draft and approving a plan are separate actions.']],
 body:[['BODYの保存済み参照を確認します。','Review your saved BODY reference.'],['日常管理はBODYで行います。ここは読み取り専用で、未記録を0とは表示しません。','Manage daily records in BODY. This view is read-only and does not treat missing records as zero.']],
 'body-settings':[['同意したデータだけを読み取り専用で参照します。','Reference only the data you consent to read.'],['同じオリジンの記録を読むか、BODYのJSONを選びます。参照の保存でBODY正本は変わりません。','Read records at this origin or choose a BODY JSON file. Saving a reference does not change BODY source records.']],
 mirror:[['2枚の写真を一時的に比較します。','Temporarily compare two photos.'],['比較前・比較後の画像を選びます。写真はこの画面を離れると破棄され、保存・AI送信しません。','Choose before and after images. Leaving this screen discards them; they are not saved or sent to AI.']],
 coach:[['トレーニングの気づきを自分の言葉で書けます。','Write training observations in your own words.'],['実AI送信は停止中です。原文を保ち、端末内の記憶は同意と明示保存で管理します。','Real AI sending is disabled. Your wording is preserved; local memory requires consent and an explicit save.']],
 'coach-memory':[['保存する内容と参照範囲を選びます。','Choose what to keep and what may be referenced.'],['同意を確認して保存します。日英切替で本人の原文は翻訳しません。','Review consent, then save. Language switching does not translate your original text.']],
 'coach-notes':[['残したい気づきを原文のままメモします。','Keep observations in your own words.'],['保存する場合は同意と保存ボタンを確認。未保存のメモは同じタブの画面往復で保持します。','Check consent and use Save to retain it. Unsaved notes survive page changes within this tab.']],
 adapt:[['記録が判断に足りているか確認します。','Check whether records support a review.'],['固定ルールの候補です。実AIの評価や測定済みの回復度とは区別してください。','These are fixed-rule suggestions, separate from AI responses or measured recovery.']],
 'adapt-approval':[['次回候補を確認し、本人が反映を決めます。','Review the next-session suggestion and decide whether to apply it.'],['承認前に重量と体調を確認。痛み・不調・記録不足があれば保留します。','Check weights and your condition first. Pain, poor condition or missing evidence keeps the action on hold.']],
 data:[['保存データを書き出すか、復元します。','Export or restore saved data.'],['復元は差分と本人確認の後だけ実行します。','Restoration runs only after reviewing differences and confirming.']]
};
// Apply the approved reading system to other tasks. Never touch the two approved pages.
function unifiedContext(scroller){if(['training-explanation','training-record'].includes(current))return null;const note=$('#ux-beginner-help');if(!note)return null;const save=$('#weeklyPlanForm button[type="submit"]')?.textContent.trim();const brief={coach:t('気づきを原文で書きます。実AI送信は停止中です。','Write observations in your own words. Real AI sending is disabled.'),adapt:t('固定ルールの候補を確認します。計画への反映は本人承認後です。','Review fixed-rule suggestions. Applying a plan requires your approval.'),'training-plan':save?t('入力後「'+save+'」を押します。実施記録は次の画面です。','After entering your plan, choose “'+save+'”. Log actual training on the next page.'):null,'training-531':t('推定1RMを入力し、週別の練習重量を確認します。TMは計画用の基準重量です。','Enter estimated 1RM to review weekly training weights. TM is the reference weight for planning.'),'training-period':t('期間の重量・回数・セット・余力を確認します。反映は本人承認後です。','Review this period’s weight, reps, sets and reserve. Applying it requires your approval.') }[current];if(!brief)return null;let group=$('#ux-unified-context');if(!group){group=document.createElement('section');group.id='ux-unified-context';scroller.append(group);}const sig=note.dataset.reading;let lead=note.querySelector(':scope>p[data-unified-lead]');if(group.dataset.unifiedReading!==sig||!lead){const full=document.createElement('details');full.className='ux-reading-details';full.append(readingNode('summary',t('詳しく見る：操作とデータの扱い','Read more: instructions / data handling')));for(const child of Array.from(note.children))full.append(child);group.replaceChildren(full);lead=readingNode('p',brief);lead.dataset.unifiedLead=current;note.append(lead);group.dataset.unifiedReading=sig;}label(lead,brief);return group;}
function unifiedPresentation(){if(['training-explanation','training-record'].includes(current))return;for(const table of all('.ux-scroll table,dialog[open] table,#sug-overload-panel table')){if(table.classList.contains('ux-reading-table'))continue;const headings=all('thead th',table).map(e=>e.textContent.trim());if(headings.length<3)continue;table.classList.add('ux-unified-table');for(const row of all('tbody tr',table))all('td',row).forEach((cell,i)=>{const text=headings[i]||'';if(cell.dataset.unifiedLabel!==text)cell.dataset.unifiedLabel=text;});}}
function readingFeedback(){const root=$('#evolink-aligned-screen'),source=$('#toast'),nav=root?.querySelector(':scope>.aligned-navigation');if(!root||!source||!nav)return;let row=root.querySelector(':scope>.ux-reading-feedback');if(!row){row=document.createElement('p');row.className='ux-reading-feedback';row.setAttribute('aria-hidden','true');row.dataset.evolinkOriginal='';nav.before(row);}label(row,source.textContent);row.hidden=source.classList.contains('hide')||!source.textContent.trim();}
function readingScope(scroller){const note=$('#focus-training-scope');if(!note)return null;let group=$('#ux-reading-scope');if(!group){group=document.createElement('section');group.id='ux-reading-scope';const detail=document.createElement('details');detail.className='ux-reading-details';const summary=readingNode('summary','');detail.append(summary,note);group.append(detail);scroller.append(group);}label(group.querySelector('summary'),t('詳しく見る：固定ルールと実AIの違い','Read more: fixed rules and real AI'));return group;}
function readingNode(tag,text){const e=document.createElement(tag);e.dataset.evolinkOriginal='';e.textContent=text;return e;}
// Two-page polish: preserve full wording; emphasize only selected method/action phrases.
function explanationParagraph(text,index,method){const p=readingNode('p',text);if(current!=='training-explanation')return p;const meaning={'ダブルプログレッション':t('同じ重さで回数を伸ばし','increases reps at the same weight'),'5/3/1':t('週ごとに','each week'),'DUP':t('日ごとに','different days'),'RPE/RIR':t('あと何回できそうか','how many reps remain')},phrases=index===0?[meaning[method]]:index===2?[t('「次へ」','Next')]:index===3?[t('回数だけ','sound technique'),t('痛み','pain')]:[];const phrase=phrases.find(x=>x&&text.includes(x));if(!phrase)return p;const start=text.indexOf(phrase);p.replaceChildren(document.createTextNode(text.slice(0,start)),readingNode('strong',phrase),document.createTextNode(text.slice(start+phrase.length)));return p;}
function beginnerHelp(scroller){if(['home','body'].includes(current))return null;let lines=readingGuides[current],method=app().snapshot().method;
 if(['training-explanation','training-preview'].includes(current)){const fields=all('#smg-evolink .smg-card dd'),how=plainMethods[method]||[fields[0]?.textContent||'',fields[0]?.textContent||''];lines=[t(...how),fields[1]?.textContent||'',t('内容が合えば「次へ」で計画を設定します。','If it fits your purpose, choose Next to set a plan.')];const caution=$('#smg-evolink .smg-note')?.textContent||'';lines.push(caution.replace(/^(注意：|Caution:)\s*/,''));}
 else if(lines)lines=lines.map(pair=>t(...pair));if(current==='coach')lines=[t('トレーニングの気づきを原文で入力できます。実AI送信は停止中。端末の記憶は同意と明示保存で管理し、計画は自動変更しません。','Write training observations in your own words. Real AI sending is disabled. Local memory requires consent and Save; plans never change automatically.')];if(current==='mirror')lines=[t('比較前・比較後の写真を選びます。この画面を離れると写真は破棄します。','Choose before and after photos. Leaving this screen discards them.')];if(current==='training-record')lines=[t('入力後「実際の内容を記録」で保存。','Use “Save actual workout” to save.')];
 if(!lines)return null;let note=$('#ux-beginner-help');if(!note){note=document.createElement('aside');note.id='ux-beginner-help';note.className='ux-beginner-help';note.dataset.evolinkOriginal='';scroller.prepend(note);}const sig=current+'|'+method+'|'+(window.EVOLINK_LOCALE?.language||'ja')+'|'+lines.join('|');if(note.dataset.reading!==sig){note.replaceChildren();const titles=lines.length===1?['']:lines.length>2?[t('行うこと','What you do'),t('ねらい','Why it helps'),t('操作','How to proceed'),t('注意','Caution')]:[t('この画面で行うこと','On this page'),''];lines.forEach((text,i)=>{if(!text)return;if(titles[i])note.append(readingNode('h3',titles[i]));note.append(current==='training-explanation'?explanationParagraph(text,i,method):readingNode('p',text));});note.dataset.reading=sig;}return note;
}
function readingFold(root,nodes,key,title){if(!root||root.querySelector('[data-reading-fold="'+key+'"]'))return;nodes=nodes.filter(e=>e&&root.contains(e));if(!nodes.length)return;const d=document.createElement('details');d.className='ux-reading-details';d.dataset.readingFold=key;const summary=readingNode('summary',title);d.append(summary);nodes[0].before(d);for(const e of nodes)d.append(e);}
function readablePresentation(){const wave=$('#four-wave-details');if(wave&&!$('#ux-wave-reading')){const original=all(':scope>h3,:scope>p:not([id])',wave).filter(e=>!e.textContent.includes('ID:'));if(original.length){const group=document.createElement('section');group.id='ux-wave-reading';original[0].before(group);const detail=document.createElement('details');detail.className='ux-reading-details';detail.dataset.readingFold='method';detail.append(readingNode('summary',t('詳しく見る：方法の特徴・確認する指標','Read more: method features / what to check')));group.append(detail);for(const node of original){if(node.textContent.includes(t('注意点','Caution')))group.append(node);else detail.append(node);}}}const tm=parentPanel('#oneRM');if(tm)readingFold(tm,all(':scope>p.detail',tm),'weekly',t('詳しく見る：計画と計算の対応範囲','Read more: planning / calculation scope'));const overload=$('#smg-overload');if(overload)readingFold(overload,Array.from(overload.children),'method',t('詳しく見る：方法の特徴・確認する指標','Read more: method features / what to check'));const trend=$('#longTermTrend table');if(trend){trend.classList.add('ux-reading-table');const headings=all('thead th',trend).map(e=>e.textContent);for(const row of all('tbody tr',trend))all('td',row).forEach((cell,i)=>{const name=headings[i]||'',value=cell.textContent.trim();if(cell.dataset.readingLabel!==name)cell.dataset.readingLabel=name;const aria=name+': '+value;if(cell.getAttribute('aria-label')!==aria)cell.setAttribute('aria-label',aria);});}const form=$('#trainingForm'),extra=form?.querySelector('#recordTechniques')?.closest('details'),method=$('#recordMethod')?.closest('div');if(form&&extra&&method&&form.contains(method)&&!extra.contains(method)){extra.querySelector('summary').after(method);}if(extra?.querySelector('summary')){const summary=extra.querySelector('summary');summary.removeAttribute('data-focus-detail-label');summary.dataset.evolinkOriginal='';label(summary,t('詳しく見る：方式・併用した技法','Read more: method / combined techniques'));}const rm=$('#aligned-rm-dialog');if(rm){let intro=$('#ux-reading-rm-intro');if(!intro){intro=readingNode('p','');intro.id='ux-reading-rm-intro';rm.querySelector('.visual-dialog-head')?.after(intro);}label(intro,t('1RMは、1回だけ挙げられる重さの目安です。実施したセットの重量と回数から推定します。','1RM estimates the weight you could lift once, using the weight and reps of a completed set.'));}const guide=$('#smg-evolink');if(guide)readingFold(guide,Array.from(guide.children),'method',t('詳しく見る：方法の特徴・確認する指標','Read more: method features / what to check'));
 const cycle=$('.focus-cycle');if(cycle)readingFold(cycle,all(':scope>p.aligned-note',cycle),'cycle',t('詳しく見る：周期案の考え方と対応範囲','Read more: how cycle outlines work / limits'));
 const plan=parentPanel('#weeklyPlanForm');if(plan)readingFold(plan,all(':scope>p.detail',plan),'weekly',t('詳しく見る：計画と計算の対応範囲','Read more: planning / calculation scope'));
 const body=$('.focus-body-settings');if(body)readingFold(body,all(':scope>p:first-of-type',body),'body',t('詳しく見る：接続方法と保存範囲','Read more: connection / storage scope'));
 const help=[['weight','使った重さをkgで入力。','Enter the weight used, in kg.'],['reps','1セットで行った回数。','Repetitions completed in one set.'],['sets','同じ動作を繰り返した組数。','How many sets you performed.'],['rir','あと何回できそうか。例：2＝あと約2回。','Reps left in reserve. Example: 2 means about two more reps.'],['oneRM','1RM＝1回だけ挙げられる重さの推定値。','1RM estimates the weight you could lift once.'],['aligned-rm-weight','実施したセットの重さを入力。','Enter the weight of a completed set.'],['aligned-rm-reps','そのセットで実施した回数を入力。','Enter the reps completed in that set.']];
 for(const id of ['four-period-rir','four-wave-rir-0','four-wave-rir-1','four-wave-rir-2'])help.push([id,'RIR＝あと何回できそうか。','RIR = repetitions left in reserve.']);for(const[id,ja,en]of help){const input=document.getElementById(id);if(!input)continue;const hintId='ux-reading-'+id;let hint=document.getElementById(hintId);if(!hint){hint=readingNode('p','');hint.id=hintId;hint.className='ux-field-help';input.after(hint);}label(hint,t(ja,en));const ids=new Set((input.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(hintId);const value=[...ids].join(' ');if(input.getAttribute('aria-describedby')!==value)input.setAttribute('aria-describedby',value);}
 for(const d of all('.ux-reading-details')){const kind=d.dataset.readingFold,text={method:t('詳しく見る：方法の特徴・確認する指標','Read more: method features / what to check'),cycle:t('詳しく見る：周期案の考え方と対応範囲','Read more: how cycle outlines work / limits'),weekly:t('詳しく見る：計画と計算の対応範囲','Read more: planning / calculation scope'),body:t('詳しく見る：接続方法と保存範囲','Read more: connection / storage scope')}[kind];if(text)label(d.querySelector('summary'),text);}
}

// Two-page visual review only. Reparent existing help; native fields and handlers stay intact.
function recordInputHelp(){if(current!=='training-record')return;const form=$('#trainingForm'),row=$('#weight')?.closest('.form-row');if(!form||!row)return;let help=$('#ux-record-input-help');if(!help){help=document.createElement('details');help.id='ux-record-input-help';help.className='ux-reading-details';help.append(readingNode('summary',''));row.after(help);}if(row.nextElementSibling!==help)row.after(help);label(help.querySelector('summary'),t('入力項目の意味を見る','What do these fields mean?'));for(const[id,ja,en]of [['weight','重量','Weight'],['reps','回数','Reps'],['sets','セット数','Sets'],['rir','余力（RIR）','Reps left (RIR)']]){const hint=$('#ux-reading-'+id);if(!hint)continue;let item=help.querySelector('[data-input-help="'+id+'"]');if(!item){item=document.createElement('div');item.dataset.inputHelp=id;item.append(readingNode('strong',''));help.append(item);}label(item.querySelector('strong'),t(ja,en));if(hint.parentElement!==item)item.append(hint);}}
function decorateFields(){const compact=current==='training-record';for(const [id,ja,en]of [['weight','重量（kg）','Weight (kg)'],['reps',compact?'回数':'回数（REP）',compact?'Reps':'Repetitions (reps)'],['sets',compact?'セット数':'セット数（SET）',compact?'Sets':'Number of sets'],['rir',compact?'余力（RIR）':current==='training-explanation'?'RIR（余力回数）':'RIR（あと何回できそう？）',compact?'Reps left (RIR)':current==='training-explanation'?'RIR (reps in reserve)':'RIR (repetitions left in reserve)']]){const el=$('label[for="'+id+'"]');if(el){el.setAttribute('data-evolink-original','');label(el,t(ja,en));}}const selected=all('#s30-training-panel>p').find(e=>/^(選択|Selected method)/.test(e.textContent));if(selected){selected.setAttribute('data-evolink-original','');label(selected,t('選択した方法：','Selected method: ')+(window.EVOLINK_LOCALE?.translateFixed(app().snapshot().method)||app().snapshot().method));}}
const alignMap={'training-plan':'training-methods','method-details':'training-explanation','training-log':'training-record','training-save':'training-record','exercise':'training-record','training-analysis':'training-analysis','five-three-one':'training-531','one-rm':'training-rm','training-settings':'training-settings','coach-talk':'coach','coach-memory':'coach-memory','coach-reference':'coach-memory','coach-notes':'coach-notes','coach-history':'coach-history','coach-profile':'coach-profile','coach-review':'coach-review','coach-draft':'coach-draft','coach-adapt':'adapt-reflections','coach-backup':'data-backup','coach-restore':'data-import','adapt-records':'adapt-analysis','adapt-weekly':'adapt-weekly','adapt-approval':'adapt-approval','adapt-next':'adapt-next','adapt-reflection':'adapt-reflection','adapt-history':'adapt-history','adapt-recovery':'adapt-recovery','adapt-trends':'adapt-trends','adapt-backup':'data-backup','photo':'mirror','measure':'mirror-measure','body-trend':'adapt-trends','recovery':'adapt-recovery','food-analysis':'adapt-analysis','food-log':'body-food','food-target':'body-target','food-sample':'body-menu','food-strategy':'body-strategy','food-event':'body-event','settings':'data'};
window.addEventListener('click',e=>{if(bridge)return;const b=e.target.closest('button,a,summary');if(!b)return;let route=null,ctx={};
 if(b.hasAttribute('data-ux-back')){e.preventDefault();e.stopImmediatePropagation();back();return;}
 if(b.hasAttribute('data-ux-next'))route=pages[current]?.next;
 else if(b.dataset.uxGo)route=b.dataset.uxGo;
 else if(b.hasAttribute('data-ux-close'))route='data';
 else if(b.dataset.nav)route=aliases[b.dataset.nav]||b.dataset.nav;
 else if(b.hasAttribute('data-align-home'))route='home';
 else if(b.dataset.align&&alignMap[b.dataset.align])route=alignMap[b.dataset.align];
 else if(b.dataset.trainingPurpose){route='training-candidates';ctx.purpose=b.dataset.trainingPurpose;}
 else if(b.dataset.trainingPick||b.dataset.method){route='training-explanation';ctx.method=b.dataset.trainingPick||b.dataset.method;ctx.explanationBack=current==='training-candidates'?'training-candidates':'training-methods';}
 else if(b.hasAttribute('data-training-overview'))route='training';
 else if(b.dataset.tsub)route=({records:'training-record',program:'training-methods',analysis:'training-analysis'})[b.dataset.tsub];
 else if(b.dataset.nsub)route=({log:'body-food',plan:'body-target',strategy:'body-strategy'})[b.dataset.nsub];
 else if(b.dataset.evoTarget){const [section,target]=b.dataset.evoTarget.split(':');route=section==='training'?({program:'training-methods',records:'training-record',analysis:'training-analysis'})[target]:section==='mirror'?'mirror-measure':aliases[section]||section;}
 else if(b.hasAttribute('data-focus-phase')){e.preventDefault();e.stopImmediatePropagation();const index=b.dataset.focusPhase;queueMicrotask(()=>{nativeClick('[data-focus-phase="'+index+'"]');go('training-period',{prepared:true});});return;}
 else if(b.dataset.act==='backup')route='data-backup';else if(b.dataset.act==='import')route='data-import';
 else if(b.dataset.act==='quick-log')route='training-record';
 else if(b.hasAttribute('data-ev6-settings'))route='data';
 else if(b.classList.contains('so-close')&&current==='training-overload')route='training-tools';
 else if(b.tagName==='SUMMARY'&&b.parentElement.matches('.focus-body-settings'))route='body-settings';
 else if(b.tagName==='SUMMARY'&&b.parentElement.matches('.focus-legacy'))route=document.body.dataset.evoPage==='mirror'?'mirror-measure':'body-legacy';
 if(route){e.preventDefault();e.stopImmediatePropagation();go(route,{context:ctx});return;}
 if(b.id==='completion-validate'){restoreSucceeded=false;validationRequested=true;}
 if(b.id==='completion-restore'){setTimeout(()=>{const text=$('#completion-validation')?.textContent||'';if(/^(復元しました|Restore complete)/.test(text)){restoreSucceeded=true;go('data-result',{prepared:true});}});}
},true);
// Plain typing only captures drafts. DOM mutations and committed selections schedule presentation updates.
for(const type of ['input','change'])window.addEventListener(type,e=>{if(e.target.matches('input,select,textarea'))queueMicrotask(()=>{capture();if(type==='change')schedule();});},true);
window.addEventListener('evolink:locale',()=>{capture();schedule();});
window.addEventListener('evolink:coach-memory-restored',()=>{drafts.clear();schedule();});
window.addEventListener('popstate',e=>{const s=e.state?.evolinkUX,id=s?.route||new URL(location.href).searchParams.get('view')||aliases[location.hash.slice(1)]||location.hash.slice(1)||'home';historyPosition=Number(s?.position)||0;if(id==='data-confirm'&&restoreSucceeded)go('data-import',{replace:true,context:s?.context||{}});else go(id,{pop:true,context:s?.context||{}});});
document.addEventListener('close',e=>{if(bridge)return;if(e.target.id==='completion-dialog'&&current.startsWith('data-'))go('data',{replace:true});if(e.target.id==='aligned-rm-dialog'&&current==='training-rm')go('training-tools',{replace:true});},true);
window.addEventListener('resize',viewportChanged);window.visualViewport?.addEventListener('resize',viewportChanged);window.visualViewport?.addEventListener('scroll',viewportChanged);document.addEventListener('focusin',viewportChanged);document.addEventListener('focusout',()=>setTimeout(viewportChanged,80));
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});const toastForReading=$('#toast');if(toastForReading)new MutationObserver(schedule).observe(toastForReading,{attributes:true,attributeFilter:['class']});
window.EVOLINK_PAGES={version:2,get ready(){return bootReady},get current(){return current},get context(){return {...context}},get routes(){return Object.keys(pages)},get viewport(){return {...viewportState}},get historyPosition(){return historyPosition},go,back,render,get drafts(){return Array.from(drafts.keys())},storageFormatChanged:false,automaticSaves:false};
requestAnimationFrame(()=>requestAnimationFrame(()=>{if(transition){bootReady=true;return;}const initial=new URL(location.href).searchParams.get('view')||aliases[document.body.dataset.evoPage]||document.body.dataset.evoPage||'home';go(initial,{replace:true,context:history.state?.evolinkUX?.context||{}}).finally(()=>{bootReady=true;});}));
})();
