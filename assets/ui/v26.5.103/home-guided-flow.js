(()=>{
'use strict';
const STYLE=`<style id="sug-guided-style">
body.sug-focus-mode .panel.active .card{opacity:.18;filter:grayscale(1);transition:opacity .18s ease,filter .18s ease}
body.sug-focus-mode .panel.active .card.sug-active-step{opacity:1;filter:none;pointer-events:auto;box-shadow:0 0 0 3px #2f9bff,0 0 28px rgba(47,155,255,.35)!important;border-color:#2f9bff!important}
body.sug-focus-mode .panel.active .card:not(.sug-active-step){pointer-events:none}
.sug-active-step{position:relative}
.sug-step-badge{display:inline-block;margin-bottom:9px;padding:6px 10px;border-radius:999px;background:#0f5f9e;color:#fff;font-size:11px;font-weight:900;letter-spacing:.05em}
.sug-input-focus{outline:3px solid #2f9bff!important;outline-offset:3px!important;box-shadow:0 0 0 6px rgba(47,155,255,.17)!important}
#sug-guided-flow{margin:14px 18px 18px;padding:18px;border:1px solid #8b6a20;border-radius:20px;background:linear-gradient(145deg,#15140f,#0c0c0e);color:#fff;font-family:inherit}
#sug-guided-flow .eyebrow{color:#d8b34b;font-size:12px;font-weight:800;letter-spacing:.08em}#sug-guided-flow h2{font-size:24px;margin:7px 0 4px}#sug-guided-flow p{color:#aaa;margin:0 0 14px;line-height:1.55}#sug-guided-flow button{width:100%;border:0;border-radius:14px;padding:17px 12px;background:linear-gradient(#f0cf69,#c99a27);font-size:18px;font-weight:900;color:#111}
</style>`;
function member(){try{return typeof m==='function'?m():null}catch(e){return null}}
function hasIdeal(){const g=member()?.goalPlan||{};return !!g.idealVisionType}
function clearFocus(){document.body.classList.remove('sug-focus-mode');document.querySelectorAll('.sug-active-step').forEach(x=>x.classList.remove('sug-active-step'));document.querySelectorAll('.sug-input-focus').forEach(x=>x.classList.remove('sug-input-focus'));document.querySelectorAll('.sug-step-badge').forEach(x=>x.remove())}
function focusCard(card,control,label){clearFocus();if(!card)return;document.body.classList.add('sug-focus-mode');card.classList.add('sug-active-step');if(control)control.classList.add('sug-input-focus');const b=document.createElement('div');b.className='sug-step-badge';b.textContent=label||'今はここだけ';card.prepend(b);setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'center'}),80)}
function focusAfterIdeal(){const card=document.getElementById('idealTodayCard');const btn=document.getElementById('simpleHomeStart');focusCard(card,btn,'STEP 2｜ここだけ押す')}
function focusNextVisibleInput(){setTimeout(()=>{const panel=document.querySelector('.panel.active')||document.body;const controls=[...panel.querySelectorAll('input:not([type="hidden"]),select,textarea,button.primary')].filter(el=>el.offsetParent!==null&&!el.disabled);const c=controls[0];if(!c){clearFocus();return}const card=c.closest('.card')||c.parentElement;focusCard(card,c,'次に入力する場所')},180)}
function closeIdealAndAdvance(){try{window.closeIdealVision?.()}catch(e){}sessionStorage.setItem('sug_today_started','1');sessionStorage.removeItem('sug_waiting_ideal');document.getElementById('sug-guided-flow')?.remove();try{window.renderSugCurrentIdealV26541?.()}catch(e){}requestAnimationFrame(()=>focusAfterIdeal())}
function openIdeal(){sessionStorage.setItem('sug_waiting_ideal','1');clearFocus();if(typeof window.openIdealVision==='function'){window.openIdealVision();return}const native=document.querySelector('#idealVisionLaunchCard button[onclick*="openIdealVision"]');if(native)native.click()}
function mount(){if(document.getElementById('sug-guided-flow')||hasIdeal())return;const box=document.createElement('section');box.id='sug-guided-flow';box.innerHTML=`<div class="eyebrow">TODAY FLOW</div><h2>理想の身体を選ぶ</h2><p>体型を選んで「この体型を目標にする」を押したら、自動で次へ進みます。</p><button type="button">理想を選ぶ →</button>`;box.querySelector('button').onclick=openIdeal;const header=document.querySelector('header');if(header?.parentNode)header.insertAdjacentElement('afterend',box);else(document.querySelector('main')||document.body).prepend(box)}
function idealSaveWatcher(e){const btn=e.target.closest?.('.visionSelectBtn,.visionQuickAction button');if(!btn)return;setTimeout(()=>{if(hasIdeal())closeIdealAndAdvance()},120)}
function startWatcher(e){const btn=e.target.closest?.('#simpleHomeStart');if(!btn)return;clearFocus();setTimeout(focusNextVisibleInput,250)}
if(!document.getElementById('sug-guided-style'))document.head.insertAdjacentHTML('beforeend',STYLE);
document.addEventListener('click',idealSaveWatcher,true);document.addEventListener('click',startWatcher,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(mount),{once:true});else requestAnimationFrame(mount);
window.__SUG_GUIDED_HOME_VERSION__='26.5.108';
})();