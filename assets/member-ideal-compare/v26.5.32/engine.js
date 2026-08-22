(function(){
  "use strict";
  function member(){try{return typeof m==="function"?m():null}catch(_e){return null}}
  function escx(v){try{return typeof esc==="function"?esc(String(v??"")):String(v??"")}catch(_e){return String(v??"")}}
  function typeKey(mem){return String(mem?.goalPlan?.idealVisionType||"").replace(/^female_/,"")}
  function profile(mem){var all=window.__SUG_IDEAL_DAILY_PROFILES__||{};return all[mem?.goalPlan?.idealVisionType]||{}}
  function latestFront(mem){var rows=(mem?.photos||[]).filter(function(x){return !x.view||x.view==="front"});rows.sort(function(a,b){return String(a.date||"").localeCompare(String(b.date||""))});return rows.at(-1)||null}
  async function signed(ph){try{if(typeof getPhotoSignedUrl==="function")return await getPhotoSignedUrl(ph);if(ph?.data)return ph.data}catch(_e){}return ""}
  function priorities(mem){try{if(typeof window.generateIdealDailyPlan==="function"){var p=window.generateIdealDailyPlan();if(Array.isArray(p?.priorities)&&p.priorities.length)return p.priorities.map(function(x){return x?.part}).filter(Boolean).slice(0,3)}}catch(_e){}
    var g=mem?.goalPlan||{},out=[];[g.priority1,g.priority2,g.priority3].forEach(function(x){if(x&&x!=="全身"&&!out.includes(x))out.push(x)});if(!out.length){var f=profile(mem);if(Array.isArray(f.focus))out=f.focus.slice(0,3)}return out.slice(0,3)
  }
  async function render(){
    var mem=member(),home=document.getElementById("dash");if(!mem||!home)return;
    var goal=mem.goalPlan||{},key=typeKey(mem);if(!goal.idealVisionType||!key)return;
    var card=document.getElementById("memberBodyGapCard");
    if(!card){card=document.createElement("div");card.id="memberBodyGapCard";card.className="card";card.style.borderColor="#5a4a25";card.style.background="linear-gradient(180deg,#18150e,#101012)";var anchor=document.getElementById("memberHomeIdealCard")||home.querySelector(".card");anchor?.insertAdjacentElement("afterend",card)}
    if(!card)return;
    var ph=latestFront(mem),cur=await signed(ph),ideal=key+"-front.jpg",tops=priorities(mem),name=goal.idealVisionName||profile(mem).name||key.toUpperCase();
    card.innerHTML='<div style="font-size:10px;color:#d8b35b;font-weight:900;letter-spacing:.06em">CURRENT → IDEAL → GAP</div>'+ 
      '<h2 style="margin:5px 0 8px">今の体と理想の体</h2>'+ 
      '<div class="photoCompareGrid">'+
        '<div class="photoCompareBox">'+(cur?'<img src="'+cur+'" alt="current">':'<div style="aspect-ratio:3/4;display:grid;place-items:center;color:#888">正面写真未登録</div>')+'<div class="photoCompareMeta"><span class="photoCompareTag">CURRENT</span>'+(ph?escx(ph.date||""):'身体写真から正面を保存')+'</div></div>'+ 
        '<div class="photoCompareBox"><img src="./'+ideal+'?v=26.5.32" alt="ideal"><div class="photoCompareMeta"><span class="photoCompareTag">IDEAL</span>ひょっとこ｜'+escx(name)+'</div></div>'+ 
      '</div>'+ 
      '<div style="margin-top:10px;padding:10px;background:#0d0d10;border:1px solid #2d2a22;border-radius:10px"><span style="font-size:9px;color:#999">GAP｜優先部位 TOP3</span><b style="display:block;color:#f3d98b;font-size:15px;margin-top:4px">'+escx(tops.join("・")||"評価待ち")+'</b></div>'+ 
      (!cur?'<button class="secondary" style="width:100%;margin-top:10px" type="button" onclick="openTab(\'photos\')">今の体を撮影・登録する</button>':'')+
      '<button class="primary" style="width:100%;margin-top:8px" type="button" onclick="openMemberMenu()">このGAPから今日のメニューを見る</button>';
  }
  window.renderMemberBodyGap=render;
  document.addEventListener("DOMContentLoaded",function(){setTimeout(render,700)});
  setTimeout(render,1200);
})();