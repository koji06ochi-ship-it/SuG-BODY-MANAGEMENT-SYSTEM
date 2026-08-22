(function(){
  'use strict';
  var booting=false, savingQuick=false;

  function mm(){try{return typeof m==='function'?m():null}catch(_e){return null}}
  function e(v){try{return typeof esc==='function'?esc(String(v??'')):String(v??'')}catch(_e){return String(v??'')}}
  function role(){try{return typeof currentRole!=='undefined'?currentRole:''}catch(_e){return ''}}
  function currentMemberId(){try{return typeof db!=='undefined'&&db?db.current:null}catch(_e){return null}}
  function goal(){return mm()?.goalPlan||{}}
  function isFemale(){return /^female_/.test(String(goal().idealVisionType||''))}
  function baseKey(){return String(goal().idealVisionType||'').replace(/^female_/,'')}
  function latestFront(){
    var rows=(mm()?.photos||[]).filter(function(x){return !x.view||x.view==='front'}).slice();
    rows.sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''))});
    return rows.length?rows[rows.length-1]:null;
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

  function idealAnchor(home){
    return document.getElementById('memberHomeIdealCard') ||
      document.querySelector('#dash .idealTodayCard') ||
      document.querySelector('#dash [data-simple-home]') ||
      document.getElementById('simpleHomeSignal')?.closest('.card') ||
      home.querySelector('.card');
  }

  async function renderCompare(){
    var mem=mm(), home=document.getElementById('dash');
    if(!mem||!home)return false;
    var g=goal(), key=baseKey();
    if(!g.idealVisionType||!key)return false;
    var anchor=idealAnchor(home); if(!anchor)return false;
    var card=document.getElementById('memberBodyGapCard');
    if(!card){
      card=document.createElement('div'); card.id='memberBodyGapCard'; card.className='card';
      card.style.border='1px solid #6b5724'; card.style.background='linear-gradient(180deg,#18150e,#101012)';
      anchor.insertAdjacentElement('afterend',card);
    }
    var ph=latestFront(), cur=await photoUrl(ph), ideal=idealUrl(), tops=top3();
    var face=isFemale()?'おかめ':'ひょっとこ';
    var name=g.idealVisionName||key.toUpperCase();
    card.innerHTML=''
      +'<div style="font-size:10px;color:#d8b35b;font-weight:900;letter-spacing:.06em">CURRENT ↔ IDEAL</div>'
      +'<div style="font-size:19px;font-weight:900;margin-top:4px">今の体 ↔ 理想'+face+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">'
      +'<div style="overflow:hidden;border:1px solid #303038;border-radius:12px;background:#0c0c0f">'
      +(cur?'<img src="'+cur+'" style="display:block;width:100%;aspect-ratio:3/4;object-fit:cover" alt="今の体">':'<div style="aspect-ratio:3/4;display:grid;place-items:center;color:#888;text-align:center;padding:10px">正面写真<br>未登録</div>')
      +'<div style="padding:8px;font-size:10px;color:#aaa"><b style="display:block;color:#f3d98b">今の体</b>'+(ph?e(ph.date||'最新写真'):'写真を登録してください')+'</div></div>'
      +'<div style="overflow:hidden;border:1px solid #303038;border-radius:12px;background:#0c0c0f">'
      +(ideal?'<img src="'+ideal+'?v=26.5.38" style="display:block;width:100%;aspect-ratio:3/4;object-fit:cover" alt="理想'+face+'">':'')
      +'<div style="padding:8px;font-size:10px;color:#aaa"><b style="display:block;color:#f3d98b">理想'+face+'</b>'+e(name)+'</div></div>'
      +'</div>'
      +'<div style="margin-top:10px;padding:10px;border:1px solid #39301c;border-radius:10px;background:#0d0d10"><span style="font-size:9px;color:#999">GAP｜優先部位 TOP3</span><b style="display:block;color:#f3d98b;font-size:15px;margin-top:4px">'+e(tops.join('・')||'評価待ち')+'</b></div>'
      +(!cur?'<button class="secondary" type="button" style="width:100%;margin-top:9px" onclick="openMemberCurrentPhoto()">今の体を撮影・登録する</button>':'')
      +'<button class="primary" type="button" style="width:100%;margin-top:8px" onclick="openMemberGapMenu()">このGAPから今日のメニューを見る</button>';
    return true;
  }

  function upcomingForCurrent(){
    try{
      if(typeof upcomingScheduled==='function'){
        var id=currentMemberId();
        return upcomingScheduled().find(function(a){return a.member_id===id;})||null;
      }
    }catch(_e){}
    try{
      var id2=currentMemberId();
      var rows=(typeof appointments!=='undefined'&&Array.isArray(appointments)?appointments:[]).filter(function(a){return a&&a.status==='scheduled'&&a.member_id===id2&&new Date(a.start_at).getTime()>=Date.now()-60000;});
      rows.sort(function(a,b){return new Date(a.start_at)-new Date(b.start_at)}); return rows[0]||null;
    }catch(_e){return null}
  }
  function localParts(a){
    try{if(typeof apptLocalParts==='function')return apptLocalParts(a.start_at)}catch(_e){}
    var d=new Date(a.start_at); return {full:d.toLocaleString('ja-JP',{month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'}),time:d.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})};
  }
  function tomorrowDefault(){
    var d=new Date(); d.setDate(d.getDate()+7); d.setMinutes(Math.ceil(d.getMinutes()/30)*30,0,0);
    return {date:[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),time:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
  }

  function renderReservation(){
    var mem=mm(), home=document.getElementById('dash'); if(!mem||!home)return false;
    var anchor=document.getElementById('memberBodyGapCard')||idealAnchor(home); if(!anchor)return false;
    var card=document.getElementById('memberNextReservationCard');
    if(!card){card=document.createElement('div');card.id='memberNextReservationCard';card.className='card';card.style.border='1px solid #3b3b42';anchor.insertAdjacentElement('afterend',card);}
    var next=upcomingForCurrent(), p=next?localParts(next):null, trainer=role()==='trainer';
    var d=tomorrowDefault();
    card.innerHTML=''
      +'<div style="font-size:10px;color:#d8b35b;font-weight:900;letter-spacing:.06em">NEXT RESERVATION</div>'
      +'<div style="font-size:18px;font-weight:900;margin-top:4px">次回予約</div>'
      +(next?'<div style="margin-top:9px;padding:11px;border:1px solid #365a43;background:#0d1510;border-radius:11px"><b style="font-size:16px;color:#86d7a8">'+e(p.full)+'</b><span style="display:block;color:#aaa;font-size:10px;margin-top:4px">'+Number(next.duration_minutes||60)+'分｜ROOM '+Number(next.room||1)+'</span></div>':'<div style="margin-top:9px;padding:11px;border:1px solid #393939;background:#0d0d10;border-radius:11px;color:#aaa;font-size:11px">次回予約はまだ登録されていません。</div>')
      +(trainer?'<div style="margin-top:10px;padding:10px;border:1px solid #39301c;border-radius:11px;background:#11100d">'
        +'<b style="display:block;color:#f3d98b;font-size:12px;margin-bottom:8px">この会員の次回予約をすぐ登録</b>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px"><input id="quickApptDate" type="date" value="'+d.date+'"><input id="quickApptTime" type="time" value="'+d.time+'"></div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px"><select id="quickApptDuration"><option value="30">30分</option><option value="60" selected>60分</option><option value="90">90分</option></select><select id="quickApptRoom"><option value="1">ROOM 1</option><option value="2">ROOM 2</option></select></div>'
        +'<button id="quickApptSave" class="primary" type="button" style="width:100%;margin-top:8px" onclick="saveQuickNextReservation()">この日時で予約する</button><div id="quickApptMsg" style="min-height:16px;color:#aaa;font-size:10px;margin-top:6px"></div>'
        +'</div>':'');
    return true;
  }

  async function saveQuickNextReservation(){
    if(savingQuick||role()!=='trainer')return;
    var id=currentMemberId(), date=document.getElementById('quickApptDate')?.value, time=document.getElementById('quickApptTime')?.value;
    var duration=Number(document.getElementById('quickApptDuration')?.value||60), room=Number(document.getElementById('quickApptRoom')?.value||1), msg=document.getElementById('quickApptMsg'), btn=document.getElementById('quickApptSave');
    if(!id||!date||!time){if(msg)msg.textContent='日付と時間を選んでください。';return;}
    savingQuick=true; if(btn){btn.disabled=true;btn.textContent='登録中...';} if(msg)msg.textContent='';
    try{
      if(typeof apptMember==='undefined'||typeof apptDate==='undefined'||typeof apptTime==='undefined'||typeof saveAppointment!=='function')throw new Error('予約機能を読み込めませんでした');
      apptMember.value=id; apptDate.value=date; apptTime.value=time;
      if(typeof apptDuration!=='undefined')apptDuration.value=String(duration);
      if(typeof apptRoom!=='undefined')apptRoom.value=String(room);
      try{if(typeof editingAppointmentId!=='undefined')editingAppointmentId=null}catch(_e){}
      await saveAppointment();
      try{if(typeof refreshAppointments==='function')await refreshAppointments()}catch(_e){}
      try{if(typeof renderNextAppointment==='function')renderNextAppointment()}catch(_e){}
      renderReservation();
      if(msg)msg.textContent='次回予約へ反映しました。';
    }catch(err){console.error(err);if(msg)msg.textContent='予約登録に失敗しました。';}
    finally{savingQuick=false;if(btn){btn.disabled=false;btn.textContent='この日時で予約する';}}
  }
  window.saveQuickNextReservation=saveQuickNextReservation;

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
    try{document.title='S.u.G BODY MANAGEMENT SYSTEM V26.5.38'}catch(_e){}
    document.querySelectorAll('.idealTodayCard .badge').forEach(function(x){x.textContent='V26.5.38'});
  }
  async function tick(){
    markVersion(); await restoreSession();
    try{if(typeof refreshAppointments==='function'&&typeof accessToken!=='undefined'&&accessToken)await refreshAppointments()}catch(_e){}
    await renderCompare(); renderReservation();
  }
  window.renderMemberBodyGapV26538=renderCompare;
  window.renderMemberReservationV26538=renderReservation;
  document.addEventListener('DOMContentLoaded',function(){setTimeout(tick,150);setTimeout(tick,900);setTimeout(tick,2200)});
  setInterval(function(){renderCompare();renderReservation();markVersion();},3000);
  setTimeout(tick,100);
})();