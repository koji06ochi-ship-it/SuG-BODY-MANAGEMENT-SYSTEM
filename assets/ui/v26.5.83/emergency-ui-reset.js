(function(){'use strict';
const V='26.5.85';
function hideLegacy(){
 const nav=document.getElementById('sugSixNav');
 if(nav){
  nav.style.cssText='display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin:14px 16px 18px!important;position:relative!important;left:auto!important;top:auto!important;width:auto!important;height:auto!important;overflow:visible!important';
  nav.querySelectorAll('.sug80Main').forEach(b=>b.style.cssText='display:block!important;position:static!important;width:auto!important;height:86px!important;border-radius:18px!important;padding:10px!important;font-size:16px!important;writing-mode:horizontal-tb!important;transform:none!important');
 }
 // Old folder/navigation layers must never render beside the canonical six-category navigation.
 ['sugPrimaryNavigation','sugFolderNav','sugAppFolderOverlay','sugFolderOverlay'].forEach(id=>{const e=document.getElementById(id);if(e&&id!=='sugPrimaryNavigation')e.remove()});
 document.querySelectorAll('.sugFolderOverlay').forEach(e=>e.remove());
 // Remove the legacy V26.5.77/78 TRAINER SCREENING card by identifying the card itself,
 // not a parent container whose text merely contains those words.
 const candidates=[...document.querySelectorAll('section,article,.card,div')];
 for(const e of candidates){
  if(e.closest('#sug80Folder'))continue;
  const direct=[...e.children].map(x=>(x.textContent||'').replace(/\s+/g,' ').trim()).join(' | ');
  const txt=(e.textContent||'').replace(/\s+/g,' ').trim();
  const isLegacy=/TRAINER SCREENING/.test(direct)||(/TRAINER SCREENING/.test(txt)&&/V26\.5\.7[78]/.test(txt));
  if(isLegacy){
   const nested=[...e.children].some(c=>/TRAINER SCREENING/.test((c.textContent||''))&&c.matches('section,article,.card'));
   if(!nested)e.remove();
  }
 }
 // Any legacy inspection wrapper or injected character artwork is removed, not just hidden.
 document.querySelectorAll('#sugInspectionPanel,.trainer-screening,.sugTrainerScreening,.sugRealHY,.sugHYRoles,.sugHYRoleGuide').forEach(e=>e.remove());
 // Kill stray old category tabs outside canonical nav.
 document.querySelectorAll('button.tab').forEach(b=>{if(b.closest('#sugSixNav,#sug80Folder'))return;const t=(b.textContent||'').trim();if(['HOME','トレ','検査','生活','分析','管理'].includes(t))b.style.setProperty('display','none','important')});
}
function apply(){hideLegacy()}
document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,100));new MutationObserver(()=>requestAnimationFrame(apply)).observe(document.documentElement,{childList:true,subtree:true});setInterval(apply,500);window.__SUG_UI_RESET__=V})();