(()=>{
'use strict';
const VERSION='26.5.158';
function user(){try{return sessionUser||window.sessionUser||null}catch(_e){return window.sessionUser||null}}
function profiles(){try{return Array.isArray(accessibleProfiles)?accessibleProfiles:(Array.isArray(window.accessibleProfiles)?window.accessibleProfiles:[])}catch(_e){return Array.isArray(window.accessibleProfiles)?window.accessibleProfiles:[]}}
function selfProfile(){const u=user();if(!u?.id)return null;return profiles().find(p=>String(p?.id||'')===String(u.id))||null}
function role(){const p=selfProfile();return p?.role?String(p.role):''}
function hide(el){if(el)el.style.setProperty('display','none','important')}
function show(el){if(el)el.style.removeProperty('display')}
function adminTargets(){return [document.querySelector('#sugCanonicalNav .sug98Card[data-key="manage"]'),document.querySelector('.tab[data-tab="adminBoard"]'),document.getElementById('adminBoard'),document.getElementById('exerciseMasterTab'),document.getElementById('exerciseMaster')]}
function memberMode(){
  document.documentElement.classList.add('sug-customer-mode');document.documentElement.classList.remove('sug-trainer-mode');
  adminTargets().forEach(hide);
  ['memberSelect','memberSelector','adminMemberSelect','adminMemberSelector','profileSelector'].forEach(id=>hide(document.getElementById(id)));
  document.querySelectorAll('[data-role="trainer-only"],.trainerOnly,.trainer-only,.adminOnly,.admin-only').forEach(hide);
  document.querySelectorAll('#sugCanonicalFolder .sug98App').forEach(b=>{if(/種目マスタ|会員管理|会員共有|全体バックアップ|セキュリティ/.test((b.textContent||'').trim()))hide(b)});
  const active=document.querySelector('.panel.active');if(active&&(active.id==='adminBoard'||active.id==='exerciseMaster')){try{window.openTab?.('dash')}catch(_e){}const d=document.getElementById('dash');if(d){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));d.classList.add('active');d.style.setProperty('display','block','important');window.scrollTo(0,0)}}
}
function trainerMode(){document.documentElement.classList.add('sug-trainer-mode');document.documentElement.classList.remove('sug-customer-mode');adminTargets().forEach(show)}
function label(r){const h=document.querySelector('.headActions');if(!h)return;let s=document.getElementById('sug158Mode');if(!s){s=document.createElement('span');s.id='sug158Mode';s.style.cssText='font-size:9px;color:#f3d98b;border:1px solid #5a4a25;border-radius:999px;padding:5px 8px;white-space:nowrap';h.prepend(s)}s.textContent=r==='member'?'会員モード':r==='trainer'?'管理者モード':'';s.style.display=s.textContent?'inline-block':'none'}
function apply(){const r=role();if(!r)return;if(r==='member')memberMode();else if(r==='trainer')trainerMode();label(r)}
document.addEventListener('click',e=>{if(role()!=='member')return;const t=e.target.closest?.('#sugCanonicalNav .sug98Card[data-key="manage"],.tab[data-tab="adminBoard"],#exerciseMasterTab');if(t){e.preventDefault();e.stopImmediatePropagation();try{window.openTab?.('dash')}catch(_e){}}},true);
const mo=new MutationObserver(apply);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mo.observe(document.body,{childList:true,subtree:true});apply()},{once:true});else{mo.observe(document.body,{childList:true,subtree:true});apply()}setInterval(apply,700);window.__SUG_CUSTOMER_UI_VERSION__=VERSION;
})();