(function(){
  'use strict';
  const STORAGE_KEY='sug_quest_person_progress_v1';
  const STATUS_TEXT={active:'ACTIVE',available:'AVAILABLE',locked:'LOCK',get:'GET',clear:'CLEAR'};
  let currentArea='kanan';
  let activePerson=null;
  let totalSteps=readTotalSteps();
  let progress=readProgress();

  function readTotalSteps(){
    try{
      const native=window.__SUG_NATIVE_HEALTH__||JSON.parse(localStorage.getItem('sug_native_health_v1')||'null');
      if(native&&Number.isFinite(+native.steps))return Math.round(+native.steps);
    }catch(e){}
    const shown=document.getElementById('steps');
    return shown?Number(String(shown.textContent).replace(/[^0-9]/g,''))||0:0;
  }
  function emptyProgress(){return {version:1,activeQuest:null,persons:{}}}
  function readProgress(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(saved&&saved.persons)return saved;
    }catch(e){}
    return emptyProgress();
  }
  function saveProgress(){localStorage.setItem(STORAGE_KEY,JSON.stringify(progress))}
  function keyFor(area,id){return area+':'+id}
  function stateFor(area,id,create){
    const key=keyFor(area,id);
    if(!progress.persons[key]&&create!==false){
      progress.persons[key]={questStartSteps:null,regionalSteps:0,gpsChecks:[],whyClear:false,got:false,regionVerified:false,regionStepBaseline:null,regionalAtBaseline:0,startedAt:null};
    }
    return progress.persons[key]||null;
  }
  function isGot(area,p){const s=stateFor(area,p.id,false);return !!((s&&s.got)||p.status==='get'||p.status==='clear')}
  function resolvedStatus(area,p){
    if(isGot(area,p))return 'get';
    if(progress.activeQuest&&progress.activeQuest.area===area&&progress.activeQuest.id===p.id)return 'active';
    if(p.status==='active')return 'active';
    if(p.status==='available')return 'available';
    if(p.unlockAfter){const parent=KANAN_PERSONS.find(x=>x.name===p.unlockAfter);if(!parent||!isGot(area,parent))return 'locked'}
    return 'available';
  }
  function areaLabel(area){return area==='taishi'?'太子町':'河南町'}
  function requiredGps(p){return /2地点/.test(p.gps||'')?2:1}
  function conditions(p,s){return {walk:Number(s.regionalSteps||0)>=Number(p.steps||0),gps:(s.gpsChecks||[]).length>=requiredGps(p),why:s.whyClear===true}}
  function escapeHtml(value){return String(value==null?'':value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function portraitMarkup(p,index,area){
    if(area==='taishi'){
      const spriteIndex=Number(p.visual&&p.visual.spriteIndex!=null?p.visual.spriteIndex:index),x=(spriteIndex%5)*25,y=[0,93.46][Math.floor(spriteIndex/5)]||0;
      return '<div class="personPortrait taishiPortrait" style="background-position:'+x+'% '+y+'%"></div>';
    }
    const x=[0,49.21,98.41][index%3],y=[0,50,100][Math.floor(index/3)]||0;
    return '<div class="personPortrait" style="background-position:'+x+'% '+y+'%"></div>';
  }
  function syncCollectionStates(){
    const cards=document.querySelectorAll('#personList .personCard');
    if(!cards.length||!KANAN_PERSONS.length)return;
    let got=0;
    cards.forEach((card,index)=>{
      const p=KANAN_PERSONS[index];if(!p)return;
      const status=resolvedStatus(currentArea,p);if(status==='get')got++;
      card.classList.remove('active','available','locked','get','clear');card.classList.add(status);
      const tag=card.querySelector('.state');if(tag){tag.className='state '+status;tag.textContent=STATUS_TEXT[status]||status.toUpperCase()}
    });
    const count=document.getElementById('personCount');if(count)count.textContent=got+'/'+KANAN_PERSONS.length+' GET';
  }
  function renderDetail(){
    if(!activePerson)return;
    const p=activePerson.person,area=activePerson.area,index=activePerson.index,s=stateFor(area,p.id),status=resolvedStatus(area,p),locked=status==='locked',started=s.questStartSteps!==null,c=conditions(p,s),gpsCount=(s.gpsChecks||[]).length,gpsNeed=requiredGps(p);
    document.getElementById('pdArt').innerHTML=portraitMarkup(p,index,area)+'<div class="personShade"></div>';
    document.getElementById('pdName').textContent=p.name;
    document.getElementById('pdEra').textContent=p.era+'　'+p.certainty+' 史実確度';
    document.getElementById('pdCert').textContent=p.certainty+' '+p.certaintyNote;
    document.getElementById('pdSummary').textContent=p.certaintyNote;
    document.getElementById('pdRelation').innerHTML='<b>WHY</b><br>'+escapeHtml(p.why)+'<br><br><b>現地QUEST</b><br>'+escapeHtml(p.quest);
    document.getElementById('pdGrid').innerHTML='<div class="detailBox"><b>関連地点</b>'+escapeHtml(p.place)+'</div><div class="detailBox"><b>必要歩数</b>'+areaLabel(area)+'内 '+Number(p.steps).toLocaleString()+'歩</div><div class="detailBox"><b>GPS条件</b>'+escapeHtml(p.gps)+'</div><div class="detailBox"><b>解放条件</b>'+(p.unlockAfter?escapeHtml(p.unlockAfter)+'取得後':'開始時から挑戦可')+'</div>';
    document.getElementById('pdGet').innerHTML='<b>GET条件</b><br>'+escapeHtml(p.get)+'<br><small>地域内最低歩数 + GPS + WHY / QUEST CLEAR の3条件が必須です。</small>';
    document.getElementById('pdProgress').innerHTML=metric('REGIONAL WALK',(started?Number(s.regionalSteps||0).toLocaleString():'0')+' / '+Number(p.steps).toLocaleString()+'歩',c.walk)+metric('GPS',gpsCount+' / '+gpsNeed,c.gps)+metric('WHY',c.why?'QUEST CLEAR':'未回答',c.why);
    const walk=document.getElementById('pdWalkBtn'),gps=document.getElementById('pdGpsBtn'),get=document.getElementById('pdGetBtn');
    walk.disabled=locked||s.got;walk.innerHTML=locked?'前の人物を取得すると解放':(started?'WALK 計測中':'この人物を探しに行く<br>WALK START');
    gps.disabled=!started||locked||s.got;gps.textContent=c.gps?'GPS CLEAR':'GPS CHECK';
    get.disabled=!(c.walk&&c.gps&&c.why)||s.got;get.textContent=s.got?'CARD GET済み':'CARD GET';
    renderWhy(p,s,started&&!locked&&c.gps);
    const notice=document.getElementById('pdNotice');
    if(locked){notice.className='questNotice';notice.textContent=p.unlockAfter+'のカード取得後に解放されます。'}
    else if(s.got){notice.className='questNotice ok';notice.textContent='CARD GET済み。取得状態はこの端末に保存されています。'}
    else if(!started){notice.className='questNotice';notice.textContent='WALK START後、地域確認済みの歩数だけを計測します。日全体の歩数では解除されません。'}
    else if(!s.regionVerified){notice.className='questNotice';notice.textContent='地域確認待ち。GPS CHECKまたはnative地域判定後から地域内歩数を計測します。'}
    else{notice.className='questNotice'+(c.walk?' ok':'');notice.textContent=c.walk?'必要な地域内歩数を達成しました。':'地域内歩数を計測中です。'}
  }
  function metric(label,value,done){return '<div class="questMetric'+(done?' done':'')+'"><b>'+(done?'✓ ':'')+label+'</b><span>'+value+'</span></div>'}
  function choicesFor(p){
    const wrong1='現地に到着した事実だけで、人物との関係が証明される。';
    const wrong2='人物名や地名が似ていれば、史実として断定できる。';
    const list=[{text:p.certaintyNote,correct:true},{text:wrong1,correct:false},{text:wrong2,correct:false}];
    const shift=KANAN_PERSONS.findIndex(x=>x.id===p.id)%3;return list.slice(shift).concat(list.slice(0,shift));
  }
  function renderWhy(p,s,enabled){
    const host=document.getElementById('pdWhy');
    if(s.whyClear){host.innerHTML='<h3>WHY?</h3><div class="whyCert">'+p.certainty+' 史実確度</div><div class="whyQuestion">'+escapeHtml(p.why)+'</div><div class="whyResult ok">✓ QUEST CLEAR<br>'+escapeHtml(p.certaintyNote)+'</div>';return}
    const choices=choicesFor(p).map((choice,i)=>'<button class="whyChoice" data-correct="'+choice.correct+'" onclick="answerPersonWhy(this)"'+(enabled?'':' disabled')+'>'+String.fromCharCode(65+i)+'. '+escapeHtml(choice.text)+'</button>').join('');
    host.innerHTML='<h3>WHY?</h3><div class="whyCert">'+p.certainty+' 史実確度を保ったまま答える</div><div class="whyQuestion">'+escapeHtml(p.why)+'</div><div class="whyChoices">'+choices+'</div><div id="whyResult" class="whyResult">'+(enabled?'1つ選んでください。':'GPS CLEAR後に回答できます。')+'</div>';
  }
  function updateRegionalFromHealth(payload){
    if(payload&&Number.isFinite(+payload.steps))totalSteps=Math.round(+payload.steps);
    if(!progress.activeQuest)return;
    const aq=progress.activeQuest,s=stateFor(aq.area,aq.id,false);if(!s||s.questStartSteps===null)return;
    let direct;
    if(payload&&payload.regionalSteps&&typeof payload.regionalSteps==='object')direct=payload.regionalSteps[aq.area];
    else if(payload&&payload.area===aq.area&&Number.isFinite(+payload.regionalSteps))direct=payload.regionalSteps;
    if(direct!==undefined&&direct!==null&&Number.isFinite(+direct))s.regionalSteps=Math.max(0,Math.round(+direct));
    else if(s.regionVerified&&Number.isFinite(+s.regionStepBaseline))s.regionalSteps=Math.max(Number(s.regionalAtBaseline||0),Number(s.regionalAtBaseline||0)+Math.max(0,totalSteps-Number(s.regionStepBaseline)));
    saveProgress();if(activePerson&&activePerson.person.id===aq.id&&activePerson.area===aq.area)renderDetail();
  }
  function markGpsCheck(args){
    args=args||{};if(!activePerson)return false;
    const p=activePerson.person,area=activePerson.area;if(args.personId&&args.personId!==p.id)return false;if(args.area&&args.area!==area)return false;if(args.verified!==true)return false;
    const s=stateFor(area,p.id);if(s.questStartSteps===null)return false;
    if(!s.regionVerified){s.regionVerified=true;s.regionStepBaseline=totalSteps;s.regionalAtBaseline=Number(s.regionalSteps||0)}
    const id=String(args.spotId||p.gps||('gps-'+((s.gpsChecks||[]).length+1)));if(!s.gpsChecks.includes(id))s.gpsChecks.push(id);
    saveProgress();renderDetail();return true;
  }
  function distanceMeters(lat1,lon1,lat2,lon2){const r=6371000,a1=lat1*Math.PI/180,a2=lat2*Math.PI/180,da=(lat2-lat1)*Math.PI/180,doa=(lon2-lon1)*Math.PI/180,a=Math.sin(da/2)**2+Math.cos(a1)*Math.cos(a2)*Math.sin(doa/2)**2;return 2*r*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
  function gpsPoints(p){return Array.isArray(p.gpsPoints)?p.gpsPoints.filter(x=>Number.isFinite(+x.lat)&&Number.isFinite(+x.lng)):[]}

  window.openPerson=function(id){
    const index=KANAN_PERSONS.findIndex(x=>x.id===id);if(index<0)return;
    activePerson={area:currentArea,person:KANAN_PERSONS[index],index:index};renderDetail();go('personDetail');
  };
  window.startPersonWalk=function(){
    if(!activePerson)return;const p=activePerson.person,area=activePerson.area;if(resolvedStatus(area,p)==='locked')return;
    const s=stateFor(area,p.id);s.questStartSteps=totalSteps;s.regionalSteps=0;s.gpsChecks=[];s.whyClear=false;s.got=false;s.regionVerified=false;s.regionStepBaseline=null;s.regionalAtBaseline=0;s.startedAt=new Date().toISOString();progress.activeQuest={area:area,id:p.id};saveProgress();syncCollectionStates();renderDetail();
  };
  window.checkPersonGps=function(){
    if(!activePerson)return;const p=activePerson.person,points=gpsPoints(p),notice=document.getElementById('pdNotice');
    if(!navigator.geolocation){notice.className='questNotice';notice.textContent='この端末では位置情報を取得できません。';return}
    notice.className='questNotice';notice.textContent='現在地を確認しています…';
    navigator.geolocation.getCurrentPosition(pos=>{
      if(!points.length){notice.className='questNotice';notice.textContent='現在地は取得しましたが、このGPS地点は座標未設定です。偽座標では判定しません。';return}
      const unchecked=points.filter(point=>!stateFor(activePerson.area,p.id).gpsChecks.includes(String(point.id||point.name)));
      const matched=unchecked.find(point=>distanceMeters(pos.coords.latitude,pos.coords.longitude,+point.lat,+point.lng)<=Number(point.radiusMeters||100));
      if(matched){markGpsCheck({personId:p.id,area:activePerson.area,spotId:String(matched.id||matched.name),verified:true});notice.className='questNotice ok';notice.textContent='GPS CHECK完了：'+String(matched.name||p.gps)}
      else{notice.className='questNotice';notice.textContent='指定地点の範囲外です。関連SPOTで再確認してください。'}
    },()=>{notice.className='questNotice';notice.textContent='位置情報を取得できませんでした。端末の位置情報許可を確認してください。'},{enableHighAccuracy:true,timeout:12000,maximumAge:0});
  };
  window.answerPersonWhy=function(button){
    if(!activePerson||button.disabled)return;const s=stateFor(activePerson.area,activePerson.person.id),result=document.getElementById('whyResult');
    if(button.dataset.correct==='true'){s.whyClear=true;saveProgress();button.classList.add('correct');result.className='whyResult ok';result.textContent='✓ QUEST CLEAR';setTimeout(renderDetail,260)}
    else{button.classList.add('wrong');result.className='whyResult';result.textContent='不正解。ヒント：'+activePerson.person.certainty+' の確度を守り、到着や名称一致だけで断定しない選択肢を選んでください。';setTimeout(()=>button.classList.remove('wrong'),550)}
  };
  window.getPersonCard=function(){
    if(!activePerson)return;const p=activePerson.person,s=stateFor(activePerson.area,p.id),c=conditions(p,s);if(!(c.walk&&c.gps&&c.why))return;
    s.got=true;s.gotAt=new Date().toISOString();if(progress.activeQuest&&progress.activeQuest.area===activePerson.area&&progress.activeQuest.id===p.id)progress.activeQuest=null;saveProgress();syncCollectionStates();document.getElementById('clearPersonArt').innerHTML=portraitMarkup(p,activePerson.index,activePerson.area)+'<div class="personShade"></div>';document.getElementById('clearPersonName').textContent=p.name;go('personClear');
  };
  window.openNextPerson=function(){
    if(!activePerson){go('area');return}const current=activePerson.person;let next=KANAN_PERSONS.find(x=>x.unlockAfter===current.name&&!isGot(activePerson.area,x));if(!next)next=KANAN_PERSONS[activePerson.index+1];if(next)openPerson(next.id);else go('area');
  };
  window.returnToPersonCollection=function(){syncCollectionStates();go('area')};
  window.SUGQuest=Object.assign(window.SUGQuest||{}, {
    recordGpsCheck:markGpsCheck,
    updateRegionalPresence:function(args){args=args||{};if(!progress.activeQuest||args.inside!==true||args.area!==progress.activeQuest.area)return false;const s=stateFor(progress.activeQuest.area,progress.activeQuest.id);if(!s.regionVerified){s.regionVerified=true;s.regionStepBaseline=totalSteps;s.regionalAtBaseline=Number(s.regionalSteps||0);saveProgress();if(activePerson)renderDetail()}return true},
    getPersonProgress:function(){return JSON.parse(JSON.stringify(progress))}
  });
  function installDemoControls(){
    if(new URLSearchParams(location.search).get('demo')!=='person-flow')return;
    const panel=document.createElement('div');panel.id='personFlowDemo';panel.style.cssText='position:fixed;z-index:99;right:8px;bottom:72px;display:grid;gap:5px;padding:7px;border:1px solid #8b682e;border-radius:8px;background:#050403ee';
    panel.innerHTML='<button id="demoGps" class="whyChoice">DEMO GPS</button><button id="demoSteps" class="whyChoice">DEMO REQUIRED STEPS</button>';
    document.body.appendChild(panel);
    panel.querySelector('#demoGps').onclick=()=>{if(activePerson)markGpsCheck({personId:activePerson.person.id,area:activePerson.area,spotId:'demo:'+activePerson.person.gps,verified:true})};
    panel.querySelector('#demoSteps').onclick=()=>{if(activePerson)updateRegionalFromHealth({steps:totalSteps+Number(activePerson.person.steps||0)})};
  }
  installDemoControls();
  const originalActivate=window.activateArea;
  window.activateArea=function(name){currentArea=name==='太子町'?'taishi':'kanan';const result=originalActivate(name);setTimeout(syncCollectionStates,0);return result};
  const personListNode=document.getElementById('personList');if(personListNode)new MutationObserver(syncCollectionStates).observe(personListNode,{childList:true});
  window.addEventListener('sug:quest-gps',event=>markGpsCheck(event.detail||{}));
  window.addEventListener('sug:native-health',event=>updateRegionalFromHealth(event.detail||{}));
  try{const initial=window.__SUG_NATIVE_HEALTH__||JSON.parse(localStorage.getItem('sug_native_health_v1')||'null');if(initial)updateRegionalFromHealth(initial)}catch(e){}
  setTimeout(syncCollectionStates,0);
})();