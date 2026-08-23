(()=>{
'use strict';
const STYLE=`<style id="sug-guided-style">
body.sug-focus-mode .panel.active .card{opacity:.10;filter:grayscale(1);transition:opacity .16s ease,filter .16s ease}
body.sug-focus-mode .panel.active .card.sug-active-step{opacity:1;filter:none;pointer-events:auto;box-shadow:0 0 0 3px #2f9bff,0 0 30px rgba(47,155,255,.38)!important;border-color:#2f9bff!important}
body.sug-focus-mode .panel.active .card:not(.sug-active-step){pointer-events:none}
.sug-active-step{position:relative}
.sug-step-badge{display:block;width:max-content;max-width:100%;margin:0 0 14px;padding:8px 13px;border-radius:999px;background:#0f70bd;color:#fff;font-size:12px;font-weight:900;letter-spacing:.03em}
.sug-input-focus{outline:4px solid #2f9bff!important;outline-offset:4px!important;box-shadow:0 0 0 8px rgba(47,155,255,.18)!important;opacity:1!important;filter:none!important;position:relative;z-index:3}
.sug-dim-control{opacity:.12!important;filter:grayscale(1)!important;pointer-events:none!important}
.sug-dim-block{opacity:.14!important;filter:grayscale(1)!important;pointer-events:none!important}
.sug-broken-wrap{display:none!important}
#sug-guided-flow{margin:14px 18px 18px;padding:18px;border:1px solid #8b6a20;border-radius:20px;background:linear-gradient(145deg,#15140f,#0c0c0e);color:#fff;font-family:inherit}
#sug-guided-flow .eyebrow{color:#d8b34b;font-size:12px;font-weight:800;letter-spacing:.08em}#sug-guided-flow h2{font-size:24px;margin:7px 0 4px}#sug-guided-flow p{color:#aaa;margin:0 0 14px;line-height:1.55}#sug-guided-flow button{width:100%;border:0;border-radius:14px;padding:17px 12px;background:linear-gradient(#f0cf69,#c99a27);font-size:18px;font-weight:900;color:#111}
</style>`;
function member(){try{return typeof m==='function'?m():null}catch(e){return null}}
function hasIdeal(){const g=member()?.goalPlan||{};return !!g.idealVisionType}
function clearFocus(){document.body.classList.remove('sug-focus-mode');document.querySelectorAll('.sug-active-step').forEach(x=>x.classList.remove('sug-active-step'));document.querySelectorAll('.sug-input-focus').forEach(x=>x.classList.remove('sug-input-focus'));document.querySelectorAll('.sug-dim-control').forEach(x=>x.classList.remove('sug-dim-control'));document.querySelectorAll('.sug-dim-block').forEach(x=>x.classList.remove('sug-dim-block'));document.querySelectorAll('.sug-step-badge').forEach(x=>x.remove())}
function focusCard(card,control,label){clearFocus();if(!card)return;document.body.classList.add('sug-focus-mode');card.classList.add('sug-active-step');if(control)control.classList.add('sug-input-focus');const b=document.createElement('div');b.className='sug-step-badge';b.textContent=label||'今はここだけ';card.prepend(b);setTimeout(()=>{try{(control||card).scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}},100)}
function todayControls(){const card=document.getElementById('idealTodayCard');if(!card)return null;const selects=[...card.querySelectorAll('select')].filter(x=>x.offsetParent!==null&&!x.disabled);const buttons=[...card.querySelectorAll('button')].filter(x=>x.offsetParent!==null&&!x.disabled);const recalc=buttons.find(b=>/再計算|現在データ|計算/.test(b.textContent||''))||buttons.find(b=>b.classList.contains('primary'))||null;return {card,selects,recalc}}
function blockFor(el){if(!el)return null;return el.closest('.grid2>div,.grid3>div,.row>div,label')||el.parentElement}
function focusTodayStep(step=0){const t=todayControls();if(!t||!t.card){focusNextVisibleInput();return}const {card,selects,recalc}=t;
 if(step===0&&selects[0]){focusCard(card,selects[0],'① 今日の食欲だけ入力');[...selects.slice(1),recalc].filter(Boolean).forEach(x=>{x.classList.add('sug-dim-control');blockFor(x)?.classList.add('sug-dim-block')});return}
 if(step===1&&selects[1]){focusCard(card,selects[1],'② 次に「今日の予定」を入力');[selects[0],recalc].filter(Boolean).forEach(x=>{x.classList.add('sug-dim-control');blockFor(x)?.classList.add('sug-dim-block')});return}
 if(recalc){focusCard(card,recalc,'入力完了。自動で計算します');selects.forEach(x=>{x.classList.add('sug-dim-control');blockFor(x)?.classList.add('sug-dim-block')});return}
 focusNextVisibleInput();}
function focusNextVisibleInput(){setTimeout(()=>{const panel=document.querySelector('.panel.active')||document.body;const all=[...panel.querySelectorAll('input:not([type="hidden"]),select,textarea,button.primary')].filter(el=>el.offsetParent!==null&&!el.disabled&&!document.getElementById('idealTodayCard')?.contains(el));const c=all[0];if(!c){clearFocus();return}focusCard(c.closest('.card')||c.parentElement,c,'次に入力する場所')},220)}
function closeIdealAndAdvance(){try{window.closeIdealVision?.()}catch(e){}sessionStorage.setItem('sug_today_started','1');sessionStorage.removeItem('sug_waiting_ideal');document.getElementById('sug-guided-flow')?.remove();try{window.renderSugCurrentIdealV26541?.()}catch(e){}try{window.renderIdealTodayV26527?.()}catch(e){}setTimeout(()=>focusTodayStep(0),260)}
function waitIdealAndAdvance(n=0){if(hasIdeal()){closeIdealAndAdvance();return}if(n<30)setTimeout(()=>waitIdealAndAdvance(n+1),100)}
function openIdeal(){sessionStorage.setItem('sug_waiting_ideal','1');clearFocus();if(typeof window.openIdealVision==='function'){window.openIdealVision();return}const native=document.querySelector('#idealVisionLaunchCard button[onclick*="openIdealVision"]');if(native)native.click()}
function waitReturningFlow(n=0){if(!hasIdeal())return;try{window.renderSugCurrentIdealV26541?.()}catch(e){}try{window.renderIdealTodayV26527?.()}catch(e){}const t=todayControls();if(t&&t.selects.length){focusTodayStep(0);return}if(n<35)setTimeout(()=>waitReturningFlow(n+1),120)}
function mount(){if(document.getElementById('sug-guided-flow'))return;if(hasIdeal()){setTimeout(()=>waitReturningFlow(0),180);return}const box=document.createElement('section');box.id='sug-guided-flow';box.innerHTML=`<div class="eyebrow">TODAY FLOW</div><h2>理想の身体を選ぶ</h2><p>初回だけ設定します。体型を決めたら、×を押さずに自動で次へ進みます。</p><button type="button">理想を選ぶ →</button>`;box.querySelector('button').onclick=openIdeal;const header=document.querySelector('header');if(header?.parentNode)header.insertAdjacentElement('afterend',box);else(document.querySelector('main')||document.body).prepend(box)}
function idealSaveWatcher(e){const btn=e.target.closest?.('.visionSelectBtn,.visionQuickAction button');if(!btn)return;sessionStorage.setItem('sug_waiting_ideal','1');setTimeout(()=>waitIdealAndAdvance(0),40)}
function autoRunRecalc(){const t=todayControls();if(!t||!t.recalc)return;const {selects,recalc,card}=t;if(selects.length<2)return;const ready=selects[0].value!==''&&selects[1].value!=='';if(!ready)return;focusCard(card,recalc,'入力完了。自動で今日の内容を計算中…');recalc.disabled=true;setTimeout(()=>{recalc.disabled=false;try{recalc.click()}catch(e){}clearFocus();setTimeout(focusNextVisibleInput,420)},220)}
function fieldWatcher(e){const t=todayControls();if(!t)return;if(e.target===t.selects[0]){setTimeout(()=>focusTodayStep(1),100);return}if(e.target===t.selects[1]){setTimeout(autoRunRecalc,120);return}}
function clickWatcher(e){const t=todayControls();if(!t)return;if(t.recalc&&e.target.closest?.('button')===t.recalc){clearFocus();setTimeout(focusNextVisibleInput,320)}}
function hideBrokenImage(img){if(!img||img.dataset.sugBrokenHandled)return;img.dataset.sugBrokenHandled='1';img.style.display='none';const p=img.parentElement;if(p&&!p.textContent.trim())p.classList.add('sug-broken-wrap')}
function scanBroken(){document.querySelectorAll('img').forEach(img=>{if(img.complete&&img.naturalWidth===0)hideBrokenImage(img)})}
function boot(){mount();scanBroken();setTimeout(scanBroken,350);setTimeout(scanBroken,1200)}
if(!document.getElementById('sug-guided-style'))document.head.insertAdjacentHTML('beforeend',STYLE);
document.addEventListener('click',idealSaveWatcher,true);document.addEventListener('change',fieldWatcher,true);document.addEventListener('click',clickWatcher,true);document.addEventListener('error',e=>{if(e.target?.tagName==='IMG')hideBrokenImage(e.target)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(boot),{once:true});else requestAnimationFrame(boot);
window.focusSugTodayStep=focusTodayStep;window.__SUG_GUIDED_HOME_VERSION__='26.5.111';
})();