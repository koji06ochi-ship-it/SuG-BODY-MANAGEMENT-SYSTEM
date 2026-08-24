(()=>{
'use strict';
const VERSION='26.5.156';
function role(){try{return String(currentRole||'')}catch(_e){return String(window.currentRole||'')}}
function isMember(){return role()==='member'}
function isTrainer(){return role()==='trainer'}
function hide(el){if(el)el.style.setProperty('display','none','important')}
function show(el){if(el)el.style.removeProperty('display')}
function hideTrainerOnly(){
  if(!isMember())return;
  document.documentElement.classList.add('sug-customer-mode');
  document.documentElement.classList.remove('sug-trainer-mode');
  hide(document.querySelector('#sugCanonicalNav .sug98Card[data-key="manage"]'));
  hide(document.querySelector('.tab[data-tab="adminBoard"]'));
  hide(document.getElementById('adminBoard'));
  hide(document.getElementById('exerciseMasterTab'));
  hide(document.getElementById('exerciseMaster'));
  ['memberSelect','memberSelector','adminMemberSelect','adminMemberSelector','profileSelector'].forEach(id=>hide(document.getElementById(id)));
  document.querySelectorAll('[data-role="trainer-only"],.trainerOnly,.trainer-only,.adminOnly,.admin-only').forEach(hide);
  document.querySelectorAll('#sugCanonicalFolder .sug98App').forEach(b=>{
    const t=(b.textContent||'').trim();
    if(/種目マスタ|会員管理|会員共有|全体バックアップ|セキュリティ/.test(t))hide(b);
  });
  const active=document.querySelector('.panel.active');
  if(active&&(active.id==='adminBoard'||active.id==='exerciseMaster')){
    try{window.openTab?.('dash')}catch(_e){}
    const dash=document.getElementById('dash');
    if(dash){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));dash.classList.add('active');dash.style.setProperty('display','block','important');window.scrollTo(0,0)}
  }
}
function restoreTrainer(){
  if(!isTrainer())return;
  document.documentElement.classList.add('sug-trainer-mode');
  document.documentElement.classList.remove('sug-customer-mode');
  show(document.querySelector('#sugCanonicalNav .sug98Card[data-key="manage"]'));
  show(document.getElementById('adminBoard'));
  show(document.getElementById('exerciseMasterTab'));
  show(document.getElementById('exerciseMaster'));
}
function labelMode(){
  const h=document.querySelector('.headActions');if(!h||document.getElementById('sug156Mode'))return;
  const s=document.createElement('span');s.id='sug156Mode';s.style.cssText='font-size:9px;color:#f3d98b;border:1px solid #5a4a25;border-radius:999px;padding:5px 8px;white-space:nowrap';s.textContent=isMember()?'会員モード':isTrainer()?'管理者モード':'';if(s.textContent)h.prepend(s)
}
function apply(){const r=role();if(!r)return;if(r==='member')hideTrainerOnly();else if(r==='trainer')restoreTrainer();labelMode()}
const mo=new MutationObserver(()=>apply());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mo.observe(document.body,{childList:true,subtree:true});apply()},{once:true});else{mo.observe(document.body,{childList:true,subtree:true});apply()}
setInterval(apply,700);
window.__SUG_CUSTOMER_UI_VERSION__=VERSION;
})();