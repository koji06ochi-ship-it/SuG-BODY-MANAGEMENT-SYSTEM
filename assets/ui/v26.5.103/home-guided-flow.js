(()=>{
const STYLE=`<style id="sug-guided-style">
#sug-guided-flow{margin:14px 18px 18px;padding:18px;border:1px solid #8b6a20;border-radius:20px;background:linear-gradient(145deg,#15140f,#0c0c0e);color:#fff;font-family:inherit}
#sug-guided-flow .eyebrow{color:#d8b34b;font-size:12px;font-weight:800;letter-spacing:.08em}
#sug-guided-flow h2{font-size:24px;margin:7px 0 4px}
#sug-guided-flow p{color:#aaa;margin:0 0 14px;line-height:1.55}
#sug-guided-flow button{width:100%;border:0;border-radius:14px;padding:17px 12px;background:linear-gradient(#f0cf69,#c99a27);font-size:18px;font-weight:900;color:#111}
#sug-guided-flow .sub{margin-top:9px;background:#18181d;color:#e5ca78;border:1px solid #66531f}
#sug-guided-flow .steps{display:flex;gap:5px;margin-top:14px}
#sug-guided-flow .dot{height:5px;flex:1;border-radius:9px;background:#333}
#sug-guided-flow .dot.on{background:#d7aa36}
</style>`;
function member(){try{return typeof m==='function'?m():null}catch(e){return null}}
function goal(){return member()?.goalPlan||{}}
function ideal(){const g=goal();return g.idealVisionType||g.idealVisionName||localStorage.getItem('sug_ideal_type')||localStorage.getItem('idealType')||localStorage.getItem('selectedIdeal')||''}
function started(){return sessionStorage.getItem('sug_today_started')==='1'}
function getStep(){if(!ideal())return{n:1,t:'理想の身体を選ぶ',d:'最初に目標だけ決めます。選んだ理想はHOMEに表示します。',action:'ideal'};if(!started())return{n:2,t:'今日をスタート',d:'ここから今日必要な項目だけ順番に確認します。',action:'start'};return{n:3,t:'今日必要な確認へ',d:'睡眠・疲労・痛みなど、今日必要なものだけ確認します。',action:'today'}}
function candidates(){return[...document.querySelectorAll('button,a,[role="button"],.tab')].filter(e=>e&&e.offsetParent!==null)}
function findIdealButton(){return candidates().find(e=>{const t=(e.textContent||'').replace(/\s+/g,'');const h=(e.getAttribute('href')||'').toLowerCase();const tab=(e.dataset?.tab||'').toLowerCase();return /理想(の身体|体型|を選|設定|変更)?/.test(t)||h.includes('ideal')||tab.includes('ideal')})}
function openIdeal(){const direct=findIdealButton();if(direct){direct.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>direct.click(),220);return}const smart=document.querySelector('.tab[data-tab="smart"]');if(smart){smart.click();setTimeout(()=>{const b=findIdealButton();if(b){b.scrollIntoView({behavior:'smooth',block:'center'});b.click()}else location.hash='ideal'},350);return}location.hash='ideal'}
function openToday(){const health=document.querySelector('.tab[data-tab="health"]')||candidates().find(e=>/生活|今日の状態/.test((e.textContent||'').replace(/\s+/g,'')));if(health){health.click();health.scrollIntoView({behavior:'smooth',block:'start'});return}location.hash='sug-health'}
function render(){document.getElementById('sug-guided-flow')?.remove();const host=document.querySelector('main')||document.body,s=getStep(),box=document.createElement('section');box.id='sug-guided-flow';box.innerHTML=`<div class="eyebrow">TODAY FLOW · STEP ${s.n}</div><h2>${s.t}</h2><p>${s.d}</p><button type="button" data-main>${s.t} →</button>${s.n===2?'<button type="button" class="sub" data-ideal>理想を変更する</button>':''}<div class="steps">${[1,2,3].map(i=>`<i class="dot ${i<=s.n?'on':''}"></i>`).join('')}</div>`;box.querySelector('[data-main]').onclick=()=>{if(s.action==='ideal')return openIdeal();if(s.action==='start'){sessionStorage.setItem('sug_today_started','1');render();return}openToday()};box.querySelector('[data-ideal]')?.addEventListener('click',openIdeal);const nav=document.querySelector('nav')||document.querySelector('header');if(nav&&nav.parentNode)nav.parentNode.insertBefore(box,nav.nextSibling);else host.prepend(box)}
if(!document.getElementById('sug-guided-style'))document.head.insertAdjacentHTML('beforeend',STYLE);
window.refreshSugGuidedHome=render;
addEventListener('DOMContentLoaded',()=>setTimeout(render,700));setTimeout(render,1400);addEventListener('storage',()=>setTimeout(render,100));
})();