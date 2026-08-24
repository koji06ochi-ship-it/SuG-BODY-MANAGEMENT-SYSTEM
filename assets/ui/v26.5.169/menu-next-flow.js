(()=>{
'use strict';
const V='26.5.169';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let lastSig='',busy=false;
function menuBox(){return $('#s149AutoMenu')||$('#sugAutoMenu')||$$('section,div').find(x=>/理想体型から逆算\s*[｜|]\s*今日の自動メニュー/.test(x.textContent||''));}
function cards(box){if(!box)return[];return $$('div',box).filter(x=>/\brep\s*[×x]\s*\d+\s*set/i.test(x.textContent||'')&&/今回目標/.test(x.textContent||''));}
function sig(box){const c=cards(box);return c.length?c.map(x=>(x.textContent||'').trim().slice(0,80)).join('|'):'';}
function nextTarget(box){const candidates=[$('#nextOverload'),$('#nextOverloadCandidate'),$('#sugNextOverload'),$('#todayFood'),$('#sugTodayFood')].filter(Boolean);if(candidates.length)return candidates[0];let n=box?.nextElementSibling;while(n){if(/次回オーバーロード候補|今日優先する食べ物|トレーニングを開始|記録を開始/.test(n.textContent||''))return n;n=n.nextElementSibling}return null;}
function ensureCTA(box){if(!box||!cards(box).length)return;let wrap=$('#sug169Next');if(!wrap){wrap=document.createElement('div');wrap.id='sug169Next';wrap.style.cssText='position:sticky;bottom:max(12px,env(safe-area-inset-bottom));z-index:2147482000;margin:18px 12px 8px;padding:10px;border:1px solid #7b6329;border-radius:18px;background:rgba(8,8,9,.96);box.appendChild(wrap)}wrap.innerHTML='<button id="sug169NextBtn" style="width:100%;min-height:58px;border:0;border-radius:14px;background:linear-gradient(180deg,#f5d45d,#d6a91f);color:#111;font-weight:900;font-size:17px">メニュー確認完了　次へ →</button>';
$('#sug169NextBtn').onclick=()=>{const t=nextTarget(box);if(t){t.scrollIntoView({behavior:'smooth',block:'start'});return}const train=$$('.tab,button,a').find(x=>/トレーニングを開始|記録を開始|今日のトレ/.test(x.textContent||''));if(train){train.click();setTimeout(()=>train.scrollIntoView?.({behavior:'smooth',block:'center'}),80)}};
}
function advance(box){const s=sig(box);if(!s||s===lastSig||busy)return;lastSig=s;busy=true;ensureCTA(box);setTimeout(()=>{const t=nextTarget(box);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});else $('#sug169Next')?.scrollIntoView({behavior:'smooth',block:'end'});busy=false},350)}
function hook(e){const b=e.target?.closest?.('button');if(!b)return;if(/再生成|メニュー生成|判定をメニューへ反映/.test(b.textContent||'')){lastSig='';setTimeout(()=>{const box=menuBox();ensureCTA(box);advance(box)},250)}}
function tick(){const box=menuBox();ensureCTA(box);advance(box)}
window.addEventListener('click',hook,true);const boot=()=>{tick();new MutationObserver(()=>requestAnimationFrame(tick)).observe(document.body,{childList:true,subtree:true,characterData:true});[300,800,1500,3000].forEach(t=>setTimeout(tick,t))};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.__SUG_MENU_NEXT_FLOW_VERSION__=V;
})();