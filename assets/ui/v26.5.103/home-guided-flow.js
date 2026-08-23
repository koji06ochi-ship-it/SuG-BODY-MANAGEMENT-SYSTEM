(()=>{
'use strict';
const STYLE=`<style id="sug-guided-style">
body.sug-focus-mode .panel.active .card{opacity:.14;transition:opacity .08s linear}
body.sug-focus-mode .panel.active .card.sug-active-step{opacity:1;pointer-events:auto;box-shadow:0 0 0 3px #2f9bff,0 0 16px rgba(47,155,255,.22)!important;border-color:#2f9bff!important}
body.sug-focus-mode .panel.active .card:not(.sug-active-step){pointer-events:none}
.sug-active-step{position:relative!important;overflow:visible!important;margin-top:18px!important;padding-top:28px!important}
.sug-step-badge{display:block;width:max-content;max-width:calc(100% - 12px);margin:0 0 12px;padding:7px 12px;border-radius:999px;background:#0f70bd;color:#fff;font-size:12px;font-weight:900}
.sug-input-focus{outline:4px solid #2f9bff!important;outline-offset:2px!important;box-shadow:0 0 0 5px rgba(47,155,255,.12)!important;opacity:1!important;position:relative;z-index:3}
.sug-dim-control,.sug-dim-block{opacity:.14!important;pointer-events:none!important}
.sug-broken-wrap{display:none!important}
#idealTodayCard{overflow:visible!important}
#idealTodayCard.sug-active-step h2,#idealTodayCard.sug-active-step h3{margin-top:0!important}
#sug-guided-flow{margin:14px 18px 18px;padding:18px;border:1px solid #8b6a20;border-radius:20px;background:linear-gradient(145deg,#15140f,#0c0c0e);color:#fff;font-family:inherit}
#sug-guided-flow .eyebrow{color:#d8b34b;font-size:12px;font-weight:800}#sug-guided-flow h2{font-size:24px;margin:7px 0 4px}#sug-guided-flow p{color:#aaa;line-height:1.55}#sug-guided-flow button{width:100%;border:0;border-radius:14px;padding:17px 12px;background:linear-gradient(#f0cf69,#c99a27);font-size:18px;font-weight:900;color:#111}
</style>`;
function member(){try{return typeof m==='function'?m():null}catch(e){return null}}
function hasIdeal(){return !!(member()?.goalPlan||{}).idealVisionType}
function meaningful(el){const v=String(el?.value??'').trim();return !!v&&v!=='未選択'&&v!=='選択してください'}
function clearFocus(){document.body.classList.remove('sug-focus-mode');document.querySelectorAll('.sug-active-step,.sug-input-focus,.sug-dim-control,.sug-dim-block').forEach(x=>x.classList.remove('sug-active-step','sug-input-focus','sug-dim-control','sug-dim-block'));document.querySelectorAll('.sug-step-badge').forEach(x=>x.remove())}
function focusCard(card,control,label){clearFocus();if(!card)return;document.body.classList.add('sug-focus-mode');card.classList.add('sug-active-step');if(control)control.classList.add('sug-input-focus');const b=document.createElement('div');b.className='sug-step-badge';b.textContent=label||'今はここだけ';card.prepend(b);requestAnimationFrame(()=>{const y=card.getBoundingClientRect().top+scrollY-115;scrollTo(0,Math.max(0,y))})}
function todayControls(){const card=document.getElementById('idealTodayCard');if(!card)return null;const selects=[...card.querySelectorAll('select')].filter(x=>x.offsetParent!==null&&!x.disabled);const buttons=[...card.querySelectorAll('button')].filter(x=>x.offsetParent!==null&&!x.disabled);const recalc=buttons.find(b=>/再計算|現在データ|計算/.test(b.textContent||''))||buttons.find(b=>b.classList.contains('primary'))||null;return {card,selects,recalc}}
function blockFor(el){return el?.closest('.grid2>div,.grid3>div,.row>div,label')||el?.parentElement}
function focusTodayStep(step){const t=todayControls();if(!t)return;const {card,selects,recalc}=t;if(step===0&&selects[0]){focusCard(card,selects[0],'① 今日の食欲');[...selects.slice(1),recalc].filter(Boolean).forEach(x=>{x.classList.add('sug-dim-control');blockFor(x)?.classList.add('sug-dim-block')});return}if(step===1&&selects[1]){focusCard(card,selects[1],'② 今日の予定');[selects[0],recalc].filter(Boolean).forEach(x=>{x.classList.add('sug-dim-control');blockFor(x)?.classList.add('sug-dim-block')})}}
function nextSection(){clearFocus();const card=document.getElementById('idealTodayCard');let next=card?.nextElementSibling;while(next&&next.offsetParent===null)next=next.nextElementSibling;if(!next)next=document.querySelector('#dash .card:not(#idealTodayCard)');if(next){next.classList.add('sug-active-step');document.body.classList.add('sug-focus-mode');requestAnimationFrame(()=>scrollTo(0,Math.max(0,next.getBoundingClientRect().top+scrollY-115)))}else scrollBy(0,Math.round(innerHeight*.65))}
function runRecalc(){const t=todayControls();if(!t||t.card.dataset.sugDone==='1')return;t.card.dataset.sugDone='1';clearFocus();if(t.recalc){try{t.recalc.click()}catch(e){}}setTimeout(nextSection,500)}
function resolveTodayState(){const t=todayControls();if(!t||t.selects.length<2)return false;const a=meaningful(t.selects[0]),p=meaningful(t.selects[1]);if(a&&p){runRecalc();return true}if(a){focusTodayStep(1);return true}focusTodayStep(0);return true}
function onChange(e){const t=todayControls();if(!t)return;if(e.target===t.selects[0]){if(meaningful(t.selects[1]))setTimeout(runRecalc,60);else setTimeout(()=>focusTodayStep(1),60);return}if(e.target===t.selects[1])setTimeout(runRecalc,60)}
function waitToday(n=0){if(resolveTodayState())return;if(n<30)setTimeout(()=>waitToday(n+1),120)}
function closeIdealAndAdvance(){try{window.closeIdealVision?.()}catch(e){}sessionStorage.removeItem('sug_waiting_ideal');document.getElementById('sug-guided-flow')?.remove();try{window.renderIdealTodayV26527?.()}catch(e){}setTimeout(()=>waitToday(0),220)}
function waitIdeal(n=0){if(hasIdeal())return closeIdealAndAdvance();if(n<40)setTimeout(()=>waitIdeal(n+1),100)}
function openIdeal(){sessionStorage.setItem('sug_waiting_ideal','1');clearFocus();if(typeof window.openIdealVision==='function')window.openIdealVision()}
function idealClick(e){if(!e.target.closest?.('.visionSelectBtn,.visionQuickAction button'))return;setTimeout(()=>waitIdeal(0),40)}
function mount(){if(hasIdeal()){setTimeout(()=>waitToday(0),220);return}if(document.getElementById('sug-guided-flow'))return;const box=document.createElement('section');box.id='sug-guided-flow';box.innerHTML='<div class="eyebrow">TODAY FLOW</div><h2>理想の身体を選ぶ</h2><p>初回だけ設定。選択後は自動で次へ進みます。</p><button type="button">理想を選ぶ →</button>';box.querySelector('button').onclick=openIdeal;(document.querySelector('header')||document.body).insertAdjacentElement('afterend',box)}
function hideBroken(img){if(!img)return;img.style.display='none';if(img.parentElement&&!img.parentElement.textContent.trim())img.parentElement.classList.add('sug-broken-wrap')}
function boot(){mount();document.querySelectorAll('img').forEach(i=>{if(i.complete&&i.naturalWidth===0)hideBroken(i)})}
if(!document.getElementById('sug-guided-style'))document.head.insertAdjacentHTML('beforeend',STYLE);
document.addEventListener('change',onChange,true);document.addEventListener('click',idealClick,true);document.addEventListener('error',e=>{if(e.target?.tagName==='IMG')hideBroken(e.target)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.focusSugTodayStep=focusTodayStep;window.__SUG_GUIDED_HOME_VERSION__='26.5.114';
})();