(()=>{
'use strict';
if(window.__SUG_MEMBER_SCROLL_STABILITY__)return;
window.__SUG_MEMBER_SCROLL_STABILITY__='26.5.251';
const nativeScrollIntoView=Element.prototype.scrollIntoView;
let userScrollWindowUntil=0;
const markUserIntent=e=>{if(e?.isTrusted)userScrollWindowUntil=performance.now()+2000};
['pointerdown','touchstart','mousedown','keydown','click'].forEach(type=>document.addEventListener(type,markUserIntent,true));
Element.prototype.scrollIntoView=function(...args){
  const now=performance.now();
  const modalOpen=!!document.querySelector('#idealVisionModal.open,.visionModal.open,[aria-modal="true"].open');
  const explicit=document.body?.dataset?.sugAllowAutoScroll==='1';
  if(now<userScrollWindowUntil||modalOpen||explicit)return nativeScrollIntoView.apply(this,args);
};
})();
