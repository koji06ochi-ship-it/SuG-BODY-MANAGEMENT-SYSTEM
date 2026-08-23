(()=>{
'use strict';
const VERSION='26.5.136';
let advancing=false;
function isIdealConfirm(target){
  if(!target)return false;
  const el=target.closest?.('button,[role="button"],a,.visionSelectBtn,.visionQuickAction')||target;
  const text=((el?.textContent||target?.textContent||'')+'').replace(/\s+/g,' ').trim();
  if(/この体型を目標にする|この体型を選ぶ|目標にする/.test(text))return true;
  if(el?.classList?.contains('visionSelectBtn'))return true;
  return false;
}
function proceed(){
  if(advancing)return;
  advancing=true;
  setTimeout(()=>{
    try{window.closeIdealVision?.()}catch(_e){}
    const modal=document.getElementById('idealVisionModal');
    if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
    document.body.style.overflow='';
    document.getElementById('sug-guided-flow')?.remove();
    try{
      const u=new URL(location.href);
      u.searchParams.set('v','26-5-136');
      location.replace(u.toString());
    }catch(_e){location.reload()}
  },320);
}
function handler(e){if(isIdealConfirm(e.target))proceed()}
document.addEventListener('click',handler,true);
document.addEventListener('pointerup',handler,true);
document.addEventListener('touchend',handler,true);
window.__SUG_IDEAL_ADVANCE_FIX_VERSION__=VERSION;
})();