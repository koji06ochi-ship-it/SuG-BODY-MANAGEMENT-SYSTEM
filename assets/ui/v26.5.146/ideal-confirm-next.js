(()=>{
'use strict';
function isIdealConfirmButton(target){return !!target?.closest?.('.visionQuickAction button,.visionSelectBtn')}
function continueAfterIdealSave(){
  try{window.closeIdealVision?.()}catch(_e){}
  try{window.openTab?.('smart')}catch(_e){try{document.querySelector('.tab[data-tab="smart"]')?.click()}catch(__e){}}
  setTimeout(()=>{
    try{
      const appetite=document.getElementById('smartAppetite');
      if(appetite){
        appetite.scrollIntoView({behavior:'smooth',block:'center'});
        appetite.focus({preventScroll:true});
      }
    }catch(_e){}
  },220)
}
document.addEventListener('click',e=>{
  if(!isIdealConfirmButton(e.target))return;
  setTimeout(()=>{
    let saved=false;
    try{saved=!!(typeof m==='function'&&m()?.goalPlan?.idealVisionType)}catch(_e){}
    if(saved)continueAfterIdealSave();
  },120)
},true);
window.__SUG_IDEAL_CONFIRM_NEXT_VERSION__='26.5.146';
})();