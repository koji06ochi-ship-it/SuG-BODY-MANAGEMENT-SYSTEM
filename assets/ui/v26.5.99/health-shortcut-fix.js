(function(){'use strict';const V='26.5.99';
function install(){
 window.openSugShortcutsApp=function(){
   const name='S.u.G Health Sync';
   const run='shortcuts://run-shortcut?name='+encodeURIComponent(name);
   const app='shortcuts://';
   let fallback=setTimeout(()=>{location.href=app},1200);
   window.addEventListener('pagehide',()=>clearTimeout(fallback),{once:true});
   location.href=run;
 };
 const btn=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='ショートカットを開く');
 if(btn){btn.onclick=window.openSugShortcutsApp;btn.textContent='S.u.G連携を実行';}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setTimeout(install,500);window.__SUG_HEALTH_SHORTCUT_FIX__=V;})();