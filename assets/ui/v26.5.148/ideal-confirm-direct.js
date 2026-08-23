(()=>{
'use strict';
const original=window.saveIdealVisionType;
if(typeof original!=='function')return;
window.saveIdealVisionType=function(i){
  const realAlert=window.alert;
  try{window.alert=()=>{};original.call(window,i)}finally{window.alert=realAlert}
  try{window.closeIdealVision?.()}catch(_e){}
  try{if(typeof window.openTab==='function')window.openTab('smart');else document.querySelector('.tab[data-tab="smart"]')?.click()}catch(_e){}
  setTimeout(()=>{
    const appetite=document.getElementById('smartAppetite');
    if(appetite){
      appetite.scrollIntoView({behavior:'smooth',block:'center'});
      try{appetite.focus({preventScroll:true})}catch(_e){}
    }
  },180);
};
window.__SUG_IDEAL_CONFIRM_DIRECT_VERSION__='26.5.148';
})();