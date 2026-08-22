(function(){
  'use strict';
  var booting=false;

  function mm(){try{return typeof m==='function'?m():null}catch(_e){return null}}
  function e(v){try{return typeof esc==='function'?esc(String(v??'')):String(v??'')}catch(_e){return String(v??'')}}
  function goal(){return mm()?.goalPlan||{}}
  function isFemale(){return /^female_/.test(String(goal().idealVisionType||''))}
  function baseKey(){return String(goal().idealVisionType||'').replace(/^female_/,'')}
  function latestFront(){
    var rows=(mm()?.photos||[]).filter(function(x){return !x.view||x.view==='front'}).slice();
    rows.sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''))});
    return rows.at(-1)||null;
  }
  async function photoUrl(ph){
    if(!ph)return '';
    try{if(typeof getPhotoSignedUrl==='function')return await getPhotoSignedUrl(ph)}catch(_e){}
    if(ph.data)return ph.data;
    if(ph.path&&typeof sb!=='undefined'&&sb){
      try{var r=await sb.storage.from('body-photos').createSignedUrl(ph.path,3600);return r?.data?.signedUrl||''}catch(_e){}
    }
    return '';
  }
  function idealUrl(){
    var k=baseKey();if(!k)return '';
    return isFemale()?('assets/ideal-vision/v26.5.24/okame-'+k+'.webp'):('assets/ideal-vision/v26.5.20/'+k+'.webp');
  }
  function top3(){
    var g=goal(), out=[];
    [g.priority1,g.priority2,g.priority3].forEach(function(x){if(x&&x!=='全身'&&!out.includes(x))out.push(x)});
    try{
      if(typeof window.generateIdealDailyPlan==='function'){
        var p=window.generateIdealDailyPlan();
        if(Array.isArray(p?.priorities)&&p.priorities.length){
          var z=p.priorities.map(function(x){return x?.part}).filter(Boolean).slice(0,3);
          if(z.length)out=z;
        }
      }
    }catch(_e){}
    return out.slice(0,3);
  }
  function openPhotos(){try{document.querySelector('.tab[data-tab="photos"]')?.click()}catch(_e){}}
  function openMenu(){try{document.querySelector('.tab[data-tab="smart"]')?.click()}catch(_e){}}
  window.openMemberCurrentPhoto=openPhotos;
  window.openMemberGapMenu=openMenu;

  async function renderCompare(){
    var mem=mm(), home=document.getElementById('dash');
    if(!mem||!home)return false;
    var g=goal(), key=baseKey();
    if(!g.idealVisionType||!key)return false;
    var anchor=document.querySelector('#dash .idealTodayCard')||document.getElementById('memberHomeIdealCard')||document.querySelector('#dash .card');
    if(!anchor)return false;
    var card=document.getElementById('memberBodyGapCard');
    if(!card){
      card=document.createElement('div');card.id='memberBodyGapCard';card.className='card';
      card.style.border='1px solid #6b5724';card.style.background='linear-gradient(180deg,#18150e,#101012)';
      anchor.insertAdjacentElement('afterend',card);
    }
    var ph=latestFront(), cur=await photoUrl(ph), ideal=idealUrl(), tops=top3();
    var face=isFemale()?'おかめ':'ひょっとこ';
    var name=g.idealVisionName||key.toUpperCase();
    card.innerHTML=''
      +'<div style="font-size:10px;color:#d8b35b;font-weight:900;letter-spacing:.06em">CURRENT ↔ IDEAL</div>'
      +'<div style="font-size:19px;font-weight:900;margin-top:4px">今の体 ↔ 理想'+face+'</div>'
      +'<div class="photoCompareGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">'
      +'<div class="photoCompareBox" style="overflow:hidden;border:1px solid #303038;border-radius:12px;background:#0c0c0f">'
      +(cur?'<img src="'+cur+'" style="display:block;width:100%;aspect-ratio:3/4;object-fit:cover" alt="今の体">':'<div style="aspect-ratio:3/4;display:grid;place-items:center;color:#888;text-align:center;padding:10px">正面写真<br>未登録</div>')
      +'<div style="padding:8px;font-size:10px;color:#aaa"><b style="display:block;color:#f3d98b">今の体</b>'+(ph?e(ph.date||''):'写真を登録してください')+'</div></div>'
      +'<div class="photoCompareBox" style="overflow:hidden;border:1px solid #303038;border-radius:12px;background:#0c0c0f">'
      +(ideal?'<img src="'+ideal+'?v=26.5.37" style="display:block;width:100%;aspect-ratio:3/4;object-fit:cover" alt="理想'+face+'">':'')
      +'<div style="padding:8px;font-size:10px;color:#aaa"><b style="display:block;color:#f3d98b">理想'+face+'</b>'+e(name)+'</div></div>'
      +'</div>'
      +'<div style="margin-top:10px;padding:10px;border:1px solid #39301c;border-radius:10px;background:#0d0d10"><span style="font-size:9px;color:#999">GAP｜優先部位 TOP3</span><b style="display:block;color:#f3d98b;font-size:15px;margin-top:4px">'+e(tops.join('・')||'評価待ち')+'</b></div>'
      +(!cur?'<button class="secondary" type="button" style="width:100%;margin-top:9px" onclick="openMemberCurrentPhoto()">今の体を撮影・登録する</button>':'')
      +'<button class="primary" type="button" style="width:100%;margin-top:8px" onclick="openMemberGapMenu()">このGAPから今日のメニューを見る</button>';
    return true;
  }

  async function restoreSession(){
    if(booting)return;
    try{
      if(typeof sb==='undefined'||!sb||typeof onSignedIn!=='function')return;
      if(typeof sessionUser!=='undefined'&&sessionUser)return;
      var r=await sb.auth.getSession(), s=r?.data?.session;
      if(!s?.user||!s?.access_token)return;
      booting=true;
      try{accessToken=s.access_token}catch(_e){}
      try{sessionUser=s.user}catch(_e){}
      await onSignedIn(s.user);
    }catch(_e){}finally{booting=false}
  }

  function markVersion(){
    try{document.title='S.u.G BODY MANAGEMENT SYSTEM V26.5.37'}catch(_e){}
    document.querySelectorAll('.idealTodayCard .badge').forEach(function(x){x.textContent='V26.5.37'});
  }

  async function tick(){
    markVersion();
    await restoreSession();
    await renderCompare();
  }
  window.renderMemberBodyGapV26537=renderCompare;
  document.addEventListener('DOMContentLoaded',function(){setTimeout(tick,150);setTimeout(tick,800);setTimeout(tick,1800)});
  setInterval(tick,2500);
  setTimeout(tick,100);
})();