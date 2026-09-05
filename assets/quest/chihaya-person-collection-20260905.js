(function(){
  'use strict';
  const DATA_URL='./assets/quest/chihaya-persons-20260905.json?v=chihaya-persons-20260905a';
  const STATUS={active:'ACTIVE',available:'AVAILABLE',locked:'LOCK',get:'GET',clear:'CLEAR'};
  const originalActivate=window.activateArea;
  let cache=null;

  function escapeHtml(value){return String(value==null?'':value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function emblemMarkup(e){
    e=e||{type:'SYMBOL',label:'歴史シンボル',mark:'◆',review:true};
    const visual=e.asset?'<img src="./assets/quest/'+escapeHtml(e.asset)+'?v=canonical-20260904b" alt="'+escapeHtml(e.label)+'">':'<span class="taishiMark" aria-label="'+escapeHtml(e.label)+'">'+escapeHtml(e.mark||'◆')+'</span>';
    return '<span class="emblemSlot'+(e.review?' review':'')+'"><span class="emblemType">'+escapeHtml(e.type)+'</span><span class="emblemMark">'+visual+'</span><span class="emblemLabel">'+escapeHtml(e.label)+'</span></span>';
  }
  function renderPersons(data){
    KANAN_PERSONS=data.persons;
    personList.innerHTML=data.persons.map(p=>'<button class="personCard '+escapeHtml(p.status)+'" onclick="openPerson(\''+escapeHtml(p.id)+'\')"><div class="personPortrait chihayaPortrait" style="--chihaya-art:url(\'./'+escapeHtml(p.visual.asset)+'?v=chihaya-persons-20260905a\');background-position:center,'+escapeHtml(p.visual.focalY||'top')+'"></div><div class="personShade"></div><span class="state '+escapeHtml(p.status)+'">'+escapeHtml(STATUS[p.status]||p.status)+'</span>'+emblemMarkup(p.emblem)+'<div class="personInfo"><div class="personName">'+escapeHtml(p.name)+'</div><div class="personEra">'+escapeHtml(p.era)+'</div><div class="personLine"><span class="certainty">'+escapeHtml(p.certainty)+' 史実確度</span><span class="stepsTag">'+Number(p.steps).toLocaleString()+'歩</span></div></div></button>').join('');
    personCount.textContent=data.persons.filter(p=>p.status==='get'||p.status==='clear').length+'/'+data.persons.length+' GET';
    if(window.SUGQuest&&window.SUGQuest.syncPersonCollection)window.SUGQuest.syncPersonCollection();
  }
  function renderSecret(){
    secretSection.style.display='';
    const title=secretSection.querySelector('h2');if(title)title.textContent='千早赤阪村 SECRET';
    secretCount.textContent='0/1 REVEALED';
    secretList.innerHTML='<div class="secretCard locked"><div class="secretCore"><div class="secretUnknown">？？？</div><div class="secretLabel">SECRET</div></div></div>';
  }
  function renderSpots(){
    const spots=[
      ['楠公誕生地','生誕伝承と中世館跡を分けて追う','誕','https://www.vill.chihayaakasaka.osaka.jp/material/images/group/10/tanjouchi.jpg'],
      ['建水分神社','楠木氏の氏神と再興伝承を知る','水','https://www.vill.chihayaakasaka.osaka.jp/material/images/group/10/11.jpg'],
      ['下赤阪城跡','棚田の地形から正成の戦いを読む','城','https://www.vill.chihayaakasaka.osaka.jp/material/images/group/10/shimoakasaka.jpg'],
      ['千早城跡','山城史跡（通常PERSONの必須GPS外）','砦','']
    ];
    spotList.innerHTML=spots.map(s=>'<button class="row" onclick="go(\'map\')"><div class="pic'+(s[3]?'':' chihayaSpotMark')+'"'+(s[3]?' style="background-image:url(\''+s[3]+'\')"':'')+'>'+(s[3]?'':s[2])+'</div><div class="rowText"><h3>'+s[0]+'</h3><p>'+s[1]+'</p></div><div class="badge"><small>QUEST</small><b>0/1</b></div></button>').join('');
  }
  function resetKananSecret(){const title=secretSection.querySelector('h2');if(title)title.textContent='河南町 SECRET'}
  async function loadChihaya(){
    try{
      if(!cache){const response=await fetch(DATA_URL);if(!response.ok)throw new Error('HTTP '+response.status);cache=await response.json()}
      renderPersons(cache);
    }catch(error){personList.innerHTML='<div class="mut">千早赤阪村人物データを読み込めませんでした。</div>'}
  }
  window.activateArea=function(name){
    document.body.classList.toggle('chihayaArea',name==='千早赤阪村');
    if(name!=='千早赤阪村'){
      const result=originalActivate(name);
      if(name==='河南町')resetKananSecret();
      return result;
    }
    areaPageTitle.textContent='千早赤阪村編';
    areaStoryTitle.textContent='楠木一族と南朝';
    areaStoryChapter.textContent='楠木一族と南朝――千早赤阪から始まる物語';
    areaHero.style.backgroundImage="linear-gradient(180deg,#0000 25%,#000d 100%),url('./assets/quest/chihaya-masashige-20260905.png?v=chihaya-persons-20260905a')";
    areaHero.style.backgroundPosition='center 24%';
    areaProgressBar.style.width='0%';
    areaProgressText.textContent='0/5枚（0%）';
    collectionTitle.textContent='千早赤阪村 PERSON COLLECTION';
    renderSecret();
    renderSpots();
    loadChihaya();
  };
})();
