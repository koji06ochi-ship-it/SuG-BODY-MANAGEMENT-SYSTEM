(()=>{
'use strict';
const NEXT='assets/ui/v26.5.103/home-guided-flow.js';
let loaded=false;
function member(){try{return typeof m==='function'?m():null}catch(_e){return null}}
function hasIdeal(){return !!(member()?.goalPlan||{}).idealVisionType}
function loadGuided(){if(loaded)return;loaded=true;document.getElementById('sugIdealFirst')?.remove();const s=document.createElement('script');s.src='./'+NEXT+'?v=26.5.242';(document.body||document.documentElement).appendChild(s)}
function openIdeal(){try{if(typeof window.openIdealVision==='function'){window.openIdealVision();return}}catch(_e){}const modal=document.getElementById('idealVisionModal');if(modal){modal.classList.add('open');modal.style.display='block'}}
function mount(){if(document.getElementById('sugIdealFirst'))return;const box=document.createElement('section');box.id='sugIdealFirst';box.style.cssText='margin:14px 18px 18px;padding:18px;border:1px solid #8b6a20;border-radius:20px;background:linear-gradient(145deg,#15140f,#0c0c0e);color:#fff';box.innerHTML='<div style="color:#d8b34b;font-size:12px;font-weight:900;letter-spacing:.08em">TODAY FLOW</div><h2 style="font-size:24px;margin:7px 0 4px">理想の身体</h2><p style="color:#aaa;margin:0 0 14px;line-height:1.55">最初に理想を確認してから、今日の食欲・予定・判定へ進みます。</p><button type="button" data-ideal style="width:100%;border:0;border-radius:14px;padding:17px 12px;background:linear-gradient(#f0cf69,#c99a27);font-size:18px;font-weight:900;color:#111">理想を確認・変更する →</button>'+(hasIdeal()?'<button type="button" data-go style="width:100%;margin-top:9px;border:1px solid #66531f;border-radius:14px;padding:14px 12px;background:#18181d;color:#e5ca78;font-size:15px;font-weight:900">この理想で今日を始める →</button>':'');box.querySelector('[data-ideal]').onclick=openIdeal;box.querySelector('[data-go]')?.addEventListener('click',loadGuided);(document.querySelector('header')||document.body).insertAdjacentElement('afterend',box);setTimeout(openIdeal,180)}
document.addEventListener('click',e=>{if(e.target.closest?.('.visionSelectBtn,.visionQuickAction button'))setTimeout(loadGuided,120)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.__SUG_IDEAL_FIRST_VERSION__='26.5.242';
})();