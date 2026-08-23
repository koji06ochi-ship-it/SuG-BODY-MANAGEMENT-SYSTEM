(()=>{
'use strict';
function openIdeal(){
  const fn=window.openIdealVision;
  if(typeof fn==='function'){fn();return true}
  return false
}
function continueAfterIdealSave(){
  if(typeof window.closeIdealVision==='function')window.closeIdealVision();
  if(typeof window.openTab==='function')window.openTab('smart');
  else document.querySelector('.tab[data-tab="smart"]')?.click();
  setTimeout(()=>{
    const appetite=document.getElementById('smartAppetite');
    if(appetite){appetite.scrollIntoView({behavior:'smooth',block:'center'});try{appetite.focus({preventScroll:true})}catch(_e){}}
  },220)
}
function savedIdeal(){try{return !!(typeof m==='function'&&m()?.goalPlan?.idealVisionType)}catch(_e){return false}}
document.addEventListener('click',e=>{
  const launch=e.target.closest?.('#sug-guided-flow button,#idealVisionLaunchCard button');
  if(launch){e.preventDefault();e.stopImmediatePropagation();openIdeal();return}
  const confirm=e.target.closest?.('.visionQuickAction button,.visionSelectBtn');
  if(!confirm)return;
  const inline=confirm.getAttribute('onclick')||'';
  const match=inline.match(/saveIdealVisionType\((\d+)?\)/);
  if(!match)return;
  e.preventDefault();e.stopImmediatePropagation();
  const idx=match[1]==null?undefined:Number(match[1]);
  if(typeof window.saveIdealVisionType!=='function')return;
  try{idx==null?window.saveIdealVisionType():window.saveIdealVisionType(idx)}catch(_e){return}
  const wait=()=>{if(savedIdeal())continueAfterIdealSave();else setTimeout(wait,80)};
  setTimeout(wait,80)
},true);
window.__SUG_IDEAL_CONFIRM_NEXT_VERSION__='26.5.147';
})();