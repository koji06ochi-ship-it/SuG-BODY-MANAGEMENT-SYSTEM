(()=>{
'use strict';
const STYLE=`<style id="sug-guided-style">
body.sug-today-flow #sugPrimaryNavigation,body.sug-today-flow #sugCanonicalNav{display:none!important}
body.sug-focus-mode .panel.active .card{opacity:1;pointer-events:auto}
body.sug-focus-mode .panel.active .card.sug-active-step{box-shadow:0 0 0 3px #2f9bff,0 0 16px rgba(47,155,255,.22)!important;border-color:#2f9bff!important}
.sug-active-step{position:relative!important;overflow:visible!important;margin-top:18px!important;padding-top:28px!important}
.sug-step-badge{display:block;width:max-content;max-width:calc(100% - 12px);margin:0 0 12px;padding:7px 12px;border-radius:999px;background:#0f70bd;color:#fff;font-size:12px;font-weight:900}
.sug-input-focus{outline:4px solid #2f9bff!important;outline-offset:2px!important;box-shadow:0 0 0 5px rgba(47,155,255,.12)!important;opacity:1!important;position:relative;z-index:3}
.sug-dim-control,.sug-dim-block{opacity:.18!important;pointer-events:none!important}
#sug-guided-flow{margin:14px 18px 18px;padding:18px;border:1px solid #8b6a20;border-radius:20px;background:#11100d;color:#fff}
#sug-guided-flow .eyebrow{color:#d8b34b;font-size:12px;font-weight:800}#sug-guided-flow h2{font-size:24px;margin:7px 0 4px}#sug-guided-flow p{color:#aaa;line-height:1.55}#sug-guided-flow button{width:100%;border:0;border-radius:14px;padding:17px 12px;background:linear-gradient(#f0cf69,#c99a27);font-size:18px;font-weight:900;color:#111}
</style>`;
function member(){try{return typeof m==='function'?m():null}catch(e){return null}}
function hasIdeal(){return !!(member()?.goalPlan||{}).idealVisionType}
function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function contextIsToday(){const u=member()?.smartContext?.updatedAt;if(!u)return false;const d=new Date(u);if(Number.isNaN(d.getTime()))return false;return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`===todayKey()}
function hasValue(el){const v=String(el?.value??'').trim();return !!v&&v!=='未選択'&&v!=='選択してください'}
function clearFocus(){document.body.classList.remove('sug-focus-mode');document.querySelectorAll('.sug-active-step,.sug-input-focus,.sug-dim-control,.sug-dim-block').forEach(x=>x.classList.remove('sug-active-step','sug-input-focus','sug-dim-control','sug-dim-block'));document.querySelectorAll('.sug-step-badge').forEach(x=>x.remove())}
function hideHub(){document.body.classList.add('sug-today-flow');document.getElementById('sugCanonicalNav')?.style.setProperty('display','none','important')}
function openSmart(){try{if(typeof window.openTab==='function')window.openTab('smart');else document.querySelector('.tab[data-tab="smart"]')?.click()}catch(e){}}
function blockFor(el){return el?.closest('.grid2>div,.grid3>div,.row>div,label')||el?.parentElement}
function todayControls(){const appetite=document.getElementById('smartAppetite'),day=document.getElementById('smartDayType');if(!appetite||!day)return null;const card=appetite.closest('.card')||document.querySelector('#smart .smartHero');const buttons=[...(document.querySelectorAll('#smart button')||[])];const recalc=buttons.find(b=>/再計算|現在データ|計算/.test(b.textContent||''))||null;return{card,appetite,day,recalc}}
function ensurePlaceholder(select,text){if(!select)return;let o=[...select.options].find(x=>x.value==='');if(!o){o=document.createElement('option');o.value='';o.textContent=text;select.insertBefore(o,select.firstChild)}else o.textContent=text}
function resetForNewDay(){const t=todayControls();if(!t)return false;ensurePlaceholder(t.appetite,'選択してください');ensurePlaceholder(t.day,'選択してください');t.appetite.value='';t.day.value='';return true}
function focusCard(card,control,label){clearFocus();hideHub();if(!card)return;document.body.classList.add('sug-focus-mode');card.classList.add('sug-active-step');control?.classList.add('sug-input-focus');const b=document.createElement('div');b.className='sug-step-badge';b.textContent=label;card.prepend(b);requestAnimationFrame(()=>scrollTo(0,Math.max(0,card.getBoundingClientRect().top+scrollY-105)))}
function focusTodayStep(step){const t=todayControls();if(!t)return false;const{card,appetite,day,recalc}=t;if(step===0){focusCard(card,appetite,'① 今日の食欲を選ぶ');[day,recalc].filter(Boolean).forEach(x=>{x.classList.add('sug-dim-control');blockFor(x)?.classList.add('sug-dim-block')})}else{focusCard(card,day,'② 今日の予定を選ぶ');[appetite,recalc].filter(Boolean).forEach(x=>{x.classList.add('sug-dim-control');blockFor(x)?.classList.add('sug-dim-block')})}return true}
function nextSection(){clearFocus();document.getElementById('sug-guided-flow')?.remove();const panel=document.getElementById('smart');const hero=todayControls()?.card;let next=hero?.nextElementSibling;while(next&&next.offsetParent===null)next=next.nextElementSibling;if(!next)next=[...(panel?.querySelectorAll('.card')||[])].find(x=>x!==hero&&x.offsetParent!==null);if(next){next.classList.add('sug-active-step');const b=document.createElement('div');b.className='sug-step-badge';b.textContent='③ 今日の判定・メニュー';next.prepend(b);requestAnimationFrame(()=>scrollTo(0,Math.max(0,next.getBoundingClientRect().top+scrollY-105)))}}
function runRecalc(){const t=todayControls();if(!t)return;clearFocus();try{if(t.recalc)t.recalc.click();else if(typeof window.generateIdealDailyPlan==='function')window.generateIdealDailyPlan({persist:true})}catch(e){}setTimeout(nextSection,450)}
function routeToday(){const t=todayControls();if(!t)return setTimeout(routeToday,120);const a=hasValue(t.appetite),d=hasValue(t.day);if(contextIsToday()&&a&&d)return runRecalc();if(!contextIsToday()){resetForNewDay();return focusTodayStep(0)}if(!a)return focusTodayStep(0);if(!d)return focusTodayStep(1);runRecalc()}
function startToday(){hideHub();openSmart();setTimeout(routeToday,180)}
function onChange(e){const t=todayControls();if(!t)return;if(e.target===t.appetite){if(!hasValue(t.appetite))return;setTimeout(()=>hasValue(t.day)?runRecalc():focusTodayStep(1),40)}else if(e.target===t.day){if(!hasValue(t.day))return;setTimeout(runRecalc,40)}}
function closeIdealAndAdvance(){try{window.closeIdealVision?.()}catch(e){}document.getElementById('sug-guided-flow')?.remove();setTimeout(startToday,120)}
function waitIdeal(n=0){if(hasIdeal())return closeIdealAndAdvance();if(n<60)setTimeout(()=>waitIdeal(n+1),80)}
function openIdeal(){clearFocus();window.openIdealVision?.()}
function idealClick(e){if(!e.target.closest?.('.visionSelectBtn,.visionQuickAction button'))return;setTimeout(()=>waitIdeal(),20)}
function mount(){hideHub();if(hasIdeal()){document.getElementById('sug-guided-flow')?.remove();setTimeout(startToday,180);return}if(document.getElementById('sug-guided-flow'))return;const box=document.createElement('section');box.id='sug-guided-flow';box.innerHTML='<div class="eyebrow">TODAY FLOW</div><h2>理想の身体を選ぶ</h2><p>初回だけ設定。選んだら自動で次へ進みます。</p><button type="button">理想を選ぶ →</button>';box.querySelector('button').onclick=openIdeal;(document.querySelector('header')||document.body).insertAdjacentElement('afterend',box)}
function boot(){mount();[50,200,800].forEach(ms=>setTimeout(hideHub,ms))}
if(!document.getElementById('sug-guided-style'))document.head.insertAdjacentHTML('beforeend',STYLE);
document.addEventListener('change',onChange,true);document.addEventListener('click',idealClick,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.__SUG_GUIDED_HOME_VERSION__='26.5.121';
})();