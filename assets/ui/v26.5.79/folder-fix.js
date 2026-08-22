(function(){'use strict';
function apply(){
 if(!document.getElementById('sugV26579Css')){const s=document.createElement('style');s.id='sugV26579Css';s.textContent=`
 .sugFolderOverlay{background:rgba(0,0,0,.48)!important;backdrop-filter:blur(18px)!important;padding:16px!important;align-items:center!important}
 .sugFolderSheet{width:min(330px,88vw)!important;border-radius:22px!important;padding:16px!important;background:rgba(30,30,34,.94)!important;border:1px solid #555!important;box-shadow:0 18px 60px rgba(0,0,0,.65)!important}
 .sugFolderHead{margin-bottom:12px!important}.sugFolderHead b{font-size:18px!important;color:#f3d98b!important}.sugFolderClose{width:34px!important;height:34px!important;font-size:18px!important}
 .sugFolderGrid{grid-template-columns:repeat(3,1fr)!important;gap:14px 8px!important}
 .sugFolderIcon span{width:58px!important;height:58px!important;border-radius:14px!important;font-size:25px!important}.sugFolderIcon small{font-size:11px!important;margin-top:6px!important}
 #sugInspectionPanel img[src^="data:image"],#sugInspectionPanel .sugCharacterGuide,#sugInspectionPanel .sugTrainerClient,#sugInspectionPanel .character-guide{display:none!important}
 `;document.head.appendChild(s)}
 const panel=document.getElementById('sugInspectionPanel');if(panel){panel.querySelectorAll('img[src^="data:image"]').forEach(x=>x.remove());panel.querySelectorAll('svg').forEach(svg=>{const t=(svg.parentElement?.textContent||'');if(/TRAINER SCREENING|触れる場所|誘導方向|抵抗方向/.test(t))svg.remove()})}
 document.querySelectorAll('.sugFolderHead b').forEach(b=>{if(b.textContent.includes('生活・コンディション'))b.textContent='生活';if(b.textContent.includes('分析・レポート'))b.textContent='分析'});
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,300));new MutationObserver(apply).observe(document.documentElement,{subtree:true,childList:true});setInterval(apply,1000);window.__SUG_FOLDER_FIX__='26.5.79';})();