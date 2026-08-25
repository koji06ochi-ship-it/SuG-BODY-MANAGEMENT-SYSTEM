(function(){'use strict';
var queued=0;
function role(){try{return typeof currentRole!=='undefined'?currentRole:(window.currentRole||'member')}catch(_e){return window.currentRole||'member'}}
function hideCardByHeading(rx){[].slice.call(document.querySelectorAll('.card h2,.card h3')).forEach(function(h){if(rx.test((h.textContent||'').trim())){var c=h.closest('.card');if(c)c.style.display='none'}})}
function apply(){var trainer=role()==='trainer';document.documentElement.dataset.sugTrainerClinical=trainer?'1':'0';if(trainer){[].slice.call(document.querySelectorAll('[data-sug-trainer-only]')).forEach(function(e){e.style.display=''}) ;return;}
 var ai=document.getElementById('sugMovementAICard');if(ai)ai.remove();
 hideCardByHeading(/AROM\s*\/\s*PROM/i);
 hideCardByHeading(/肩甲上腕リズム|SHR/i);
 hideCardByHeading(/Joint\s*by\s*Joint|ジョイント\s*バイ\s*ジョイント/i);
 hideCardByHeading(/動作スクリーン|Movement\s*Screen/i);
 hideCardByHeading(/胸郭|胸椎|骨盤|横隔膜|呼吸.*評価/i);
}
function queue(ms){clearTimeout(queued);queued=setTimeout(apply,ms||80)}
function boot(){[200,600,1400,3000].forEach(function(t){setTimeout(apply,t)});window.addEventListener('sug:member-access-ready',function(){queue(40)});window.addEventListener('sug:member-access-changed',function(){queue(40)});window.addEventListener('pageshow',function(){queue(80)});document.addEventListener('visibilitychange',function(){if(!document.hidden)queue(80)})}
window.SUG_IS_TRAINER=function(){return role()==='trainer'};
window.__SUG_TRAINER_CLINICAL_GUARD_VERSION__='26.5.195';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();