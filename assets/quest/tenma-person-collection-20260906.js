(function(){
  'use strict';

  const DATA_URL='./assets/quest/tenma-persons-20260906.json?v=tenma-persons-20260906a';
  const ART_VERSION='tenma-persons-20260906a';
  const STATUS={active:'ACTIVE',available:'AVAILABLE',locked:'LOCK',get:'GET',clear:'CLEAR'};
  const originalActivate=window.activateArea;
  let cache=null;

  function escapeHtml(value){return String(value==null?'':value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

  function emblemMarkup(emblem){
    const e=emblem||{type:'SYMBOL',label:'歴史SYMBOL',mark:'◆'};
    const visual=e.asset
      ? '<img src="./assets/quest/'+escapeHtml(e.asset)+'?v='+ART_VERSION+'" alt="'+escapeHtml(e.label)+'">'
      : '<span class="tenmaMark" aria-label="'+escapeHtml(e.label)+'">'+escapeHtml(e.mark||'◆')+'</span>';
    return '<span class="emblemSlot tenmaEmblem"><span class="emblemType">'+escapeHtml(e.type)+'</span><span class="emblemMark">'+visual+'</span><span class="emblemLabel">'+escapeHtml(e.label)+'</span></span>';
  }

  function renderPersons(data){
    KANAN_PERSONS=data.persons;
    personList.innerHTML=data.persons.map(person=>{
      const visual=person.visual||{};
      return '<article class="personCard tenmaPersonCard '+escapeHtml(person.status)+'" data-person-id="'+escapeHtml(person.id)+'" aria-label="'+escapeHtml(person.name)+'、'+escapeHtml(person.region)+'">'
        +'<div class="personPortrait tenmaPortrait" style="--tenma-art:url(\'./'+escapeHtml(visual.asset)+'?v='+ART_VERSION+'\');--tenma-focal:'+escapeHtml(visual.focalY||'top')+'"></div>'
        +'<div class="personShade"></div>'
        +'<span class="state '+escapeHtml(person.status)+'">'+escapeHtml(STATUS[person.status]||person.status)+'</span>'
        +emblemMarkup(person.emblem)
        +'<div class="personInfo tenmaPersonInfo"><div class="personName">'+escapeHtml(person.name)+'</div><div class="personEra">'+escapeHtml(person.era)+'</div><div class="tenmaRegion">'+escapeHtml(person.region)+'</div><div class="personLine"><span class="certainty">'+escapeHtml(person.certainty)+' 史実確度</span><span class="tenmaClass">'+escapeHtml(person.emblem.type)+'</span></div></div>'
        +'</article>';
    }).join('');
    personCount.textContent='0/'+data.persons.length+' GET';
    if(window.SUGQuest&&window.SUGQuest.syncPersonCollection)window.SUGQuest.syncPersonCollection();
  }

  function renderSecret(data){
    const route=data.secretRoute;
    secretSection.style.display='';
    const title=secretSection.querySelector('h2');
    if(title)title.textContent='天満 SECRET ROUTE';
    secretCount.textContent='2 PERSON + 1 CLAN';
    const clan=route.clanCards[0];
    secretList.innerHTML='<article class="tenmaRouteCard"><div class="tenmaRouteKicker">LARGE SECRET ROUTE</div><h3>'+escapeHtml(route.title)+'</h3><div class="tenmaRouteChain">'+route.chain.map((item,index)=>'<span>'+escapeHtml(item)+'</span>'+(index<route.chain.length-1?'<b>↓</b>':'')).join('')+'</div><p>'+escapeHtml(route.caution)+'</p></article>'
      +'<article class="tenmaClanCard">'+emblemMarkup(clan.emblem)+'<div><small>'+escapeHtml(clan.classification)+'</small><h3>'+escapeHtml(clan.name)+'</h3><p>'+escapeHtml(clan.certainty)+' 系譜・氏族関係</p><div>'+escapeHtml(clan.chain)+'</div></div></article>'
      +route.persons.map(()=>'<div class="secretCard locked tenmaSecretLocked" aria-label="未解放SECRET PERSON"><div class="secretCore"><div class="secretUnknown">？？？</div><div class="secretLabel">SECRET PERSON</div></div></div>').join('');
  }

  function renderSpots(){
    const spots=[
      ['大阪天満宮','楼門・境内・梅から天神信仰を知る','梅'],
      ['天満寺内町・大川','秀吉期の町づくりと水運を追う','舟'],
      ['成正寺','大塩平八郎墓所と天満の記憶','義'],
      ['川端康成生誕之地碑','天神橋一丁目から文学へ進む','書'],
      ['渡辺津・大川','水辺の武士団と瀬戸内航路へつなぐ','津'],
      ['適塾・梅田 NEXT ROUTE','医学と鉄道都市へ章を広げる','次']
    ];
    spotList.innerHTML=spots.map(spot=>'<div class="row tenmaSpot"><div class="pic tenmaSpotMark">'+spot[2]+'</div><div class="rowText"><h3>'+spot[0]+'</h3><p>'+spot[1]+'</p></div><div class="badge"><small>ROUTE</small><b>→</b></div></div>').join('');
  }

  function refreshTenmaSummary(){
    document.querySelectorAll('#areaList .areaCard').forEach(card=>{
      if(!card.textContent.includes('天満エリア'))return;
      const values=card.querySelectorAll('.nums b');
      if(values[0])values[0].textContent='0/8枚';
      if(values[1])values[1].textContent='0%';
      const bar=card.querySelector('.prog i');if(bar)bar.style.width='0%';
    });
    document.querySelectorAll('#mini .mini').forEach(card=>{
      if(!card.textContent.includes('天満エリア'))return;
      const count=card.querySelector('span');if(count)count.textContent='0/8';
      const percent=card.querySelector('em');if(percent)percent.textContent='0%';
    });
  }

  async function loadTenma(){
    try{
      if(!cache){
        const response=await fetch(DATA_URL);
        if(!response.ok)throw new Error('HTTP '+response.status);
        cache=await response.json();
      }
      renderPersons(cache);
      renderSecret(cache);
    }catch(error){
      personList.innerHTML='<div class="mut">天満人物データを読み込めませんでした。</div>';
    }
  }

  window.activateArea=function(name){
    const isTenma=name==='天満';
    document.body.classList.toggle('tenmaArea',isTenma);
    if(!isTenma){
      areaHero.style.backgroundPosition='';
      const result=originalActivate(name);
      if(name==='河南町'&&typeof window.loadSecrets==='function')window.loadSecrets();
      return result;
    }
    originalActivate(name);
    refreshTenmaSummary();
    areaPageTitle.textContent='天満編';
    areaStoryTitle.textContent='学問・水運・反骨・都市';
    areaStoryChapter.textContent='天満――学問・水運・反骨・都市を歩く';
    areaHero.style.backgroundImage="linear-gradient(180deg,#0000 25%,#000d 100%),url('./assets/quest/tenma-michizane-20260906.webp?v="+ART_VERSION+"')";
    areaHero.style.backgroundPosition='center 18%';
    areaProgressBar.style.width='0%';
    areaProgressText.textContent='0/8枚（0%）';
    collectionTitle.textContent='天満 PERSON COLLECTION';
    renderSpots();
    loadTenma();
  };

  refreshTenmaSummary();
})();
