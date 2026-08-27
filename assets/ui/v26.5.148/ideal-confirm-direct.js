(()=>{
'use strict';
const DISPLAY_VERSION='V26.5.228';
const original=window.saveIdealVisionType;
if(typeof original!=='function')return;
if(window.__SUG_IDEAL_CONFIRM_DIRECT_INSTALLED__)return;
window.__SUG_IDEAL_CONFIRM_DIRECT_INSTALLED__=true;

function syncVisibleVersion(){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let n;
  while((n=walker.nextNode())){
    if(/V26\.5\.28\b/i.test(n.nodeValue||'')) n.nodeValue=n.nodeValue.replace(/V26\.5\.28\b/gi,DISPLAY_VERSION);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncVisibleVersion,{once:true});
else syncVisibleVersion();
setTimeout(syncVisibleVersion,300);

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
  try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(_e){}
};
window.__SUG_IDEAL_CONFIRM_DIRECT_VERSION__='26.5.248';
})();