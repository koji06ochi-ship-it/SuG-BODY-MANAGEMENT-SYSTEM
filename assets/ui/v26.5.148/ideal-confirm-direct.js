(()=>{
'use strict';
const original=window.saveIdealVisionType;
if(typeof original!=='function')return;
if(window.__SUG_IDEAL_CONFIRM_DIRECT_INSTALLED__)return;
window.__SUG_IDEAL_CONFIRM_DIRECT_INSTALLED__=true;

window.__SUG149_CORE_SAVE__=original;

window.saveIdealVisionType=function(i){
  const realAlert=window.alert;
  try{
    window.alert=()=>{};
    original.call(window,i);
  }finally{
    window.alert=realAlert;
  }

  try{window.closeIdealVision?.()}catch(_e){}

  // flow-controller owns the guided transition when it is installed.
  // Do not compete with its ideal-confirm interception.
  if(typeof window.SUG_START_TODAY_FLOW==='function'){
    setTimeout(()=>window.SUG_START_TODAY_FLOW?.(),80);
    return;
  }

  try{
    if(typeof window.openTab==='function')window.openTab('smart');
    else document.querySelector('.tab[data-tab="smart"]')?.click();
  }catch(_e){}

  setTimeout(()=>{
    const appetite=document.getElementById('smartAppetite');
    if(appetite){
      appetite.scrollIntoView({behavior:'auto',block:'center'});
      try{appetite.focus({preventScroll:true})}catch(_e){}
    }
  },180);
};
window.__SUG_IDEAL_CONFIRM_DIRECT_VERSION__='26.5.228';
})();