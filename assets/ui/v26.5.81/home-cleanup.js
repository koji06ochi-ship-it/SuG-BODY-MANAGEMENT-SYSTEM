(function(){'use strict';
const V='26.5.81';
function isHome(){const active=document.querySelector('.panel.active');if(!active)return true;return /home|dashboard/i.test(active.id||active.dataset.panel||'')}
function cleanup(){
 const legacy=document.getElementById('sugInspectionPanel');
 if(legacy){legacy.querySelectorAll('img[src^="data:image"],.sugCharacterGuide,.sugTrainerClient,.character-guide').forEach(x=>x.remove());if(isHome())legacy.style.display='none'}
 document.querySelectorAll('section.card,div.card').forEach(el=>{const t=(el.textContent||'').replace(/\s+/g,' ').trim();if(/TRAINER SCREENING/.test(t)&&!el.closest('#sug80Folder')){el.querySelectorAll('img,svg').forEach(x=>x.remove());if(isHome())el.style.display='none'}});
 document.querySelectorAll('#sugSixNav .sug80Main').forEach(b=>{if(b.dataset.key==='inspection')b.setAttribute('aria-label','検査フォルダを開く')});
}
function patchInspection(){const btn=document.querySelector('#sugSixNav .sug80Main[data-key="inspection"]');if(!btn||btn.dataset.v815)return;btn.dataset.v815='1';btn.addEventListener('click',()=>{cleanup();setTimeout(()=>{const f=document.getElementById('sug80Folder');if(f){const h=f.querySelector('.sug80Head b');if(h)h.textContent='検査'}},0)},true)}
function apply(){cleanup();patchInspection()}
document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,400));new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});setInterval(apply,900);window.__SUG_HOME_CLEANUP__=V;
})();