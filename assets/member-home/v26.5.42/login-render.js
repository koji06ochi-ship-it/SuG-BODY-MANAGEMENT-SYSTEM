(function(){
'use strict';
function rerender(){try{if(typeof window.renderSugSimpleHome==='function')window.renderSugSimpleHome();}catch(_e){}try{if(typeof window.renderMemberHomeIdeal==='function'&&typeof m==='function')window.renderMemberHomeIdeal(m());}catch(_e){}try{if(typeof window.renderMemberBodyGap==='function'&&typeof m==='function')window.renderMemberBodyGap(m());}catch(_e){}try{if(typeof window.renderSugCurrentIdealV26541==='function')window.renderSugCurrentIdealV26541();}catch(_e){}}
function hookRenderAll(){try{if(typeof window.renderAll!=='function'||window.renderAll.__sugMemberHomeHooked)return;var original=window.renderAll;function wrapped(){var out=original.apply(this,arguments);requestAnimationFrame(rerender);return out;}wrapped.__sugMemberHomeHooked=true;window.renderAll=wrapped;}catch(_e){}}
function hookLoadMember(){try{if(typeof window.loadMember!=='function'||window.loadMember.__sugMemberHomeHooked)return;var original=window.loadMember;async function wrapped(){var out=await original.apply(this,arguments);requestAnimationFrame(rerender);return out;}wrapped.__sugMemberHomeHooked=true;window.loadMember=wrapped;}catch(_e){}}
function install(){hookRenderAll();hookLoadMember();rerender();}
window.__SUG_MEMBER_HOME_LOGIN_RENDER_VERSION__='26.5.104';
document.addEventListener('DOMContentLoaded',function(){install();setTimeout(install,300);});
})();