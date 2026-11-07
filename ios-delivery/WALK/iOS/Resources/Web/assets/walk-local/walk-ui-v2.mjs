// Presentation only: preserve existing elements, event handlers and storage logic.
export function arrangeWalkUI(host){
 const nodes=new Map([...document.querySelectorAll("[id]")].map(n=>[n.id,n]));
 const $=id=>nodes.get(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const original=[...host.children],wrap=document.querySelector('.wrap');
 const legacy=el('details','walkLegacy');legacy.id='walkLegacy';legacy.append(el('summary','','開発中・その他'));
 legacy.append(el('p','subtle','旧QUEST・イベント・ポイント・QR・デモ機能を保全しています。動作未確認のため、実用機能としての提供は準備中です。'));
 const legacyBody=el('div','legacyBody');legacy.append(legacyBody);
 for(const n of [...wrap.children])if(n!==host)legacyBody.append(n);
 const oldFoot=document.querySelector('nav.foot');if(oldFoot)legacyBody.append(oldFoot);
 const header=el('header','walkHeader');header.innerHTML='<a class="walkBrand" href="#walk">S.u.G <span>WALK</span></a><span class="walkEdition">歩く。街を見つける。</span>';
 const location=el('p','walkLocation');location.id='walkLocation';location.textContent='現在地は未取得';header.append(location);
 const map=el('section','walkMapSection');map.setAttribute('aria-label','現在地と街の地図');map.append(host.querySelector('.walkMapWrap'));
 const mapTools=el('div','walkMapTools');mapTools.append($('walkCurrentMap'),$('walkSelectDestination'));map.append(mapTools);
 const mapInfo=el('details','walkMapInfo');mapInfo.append(el('summary','','地図の状態・表示設定'),$('walkMapLabel'),$('walkFix'));
 const mapActions=el('div','controls');mapActions.append($('walkMapRetry'),$('walkMapExternal'));mapInfo.append(mapActions);map.append(mapInfo,$('walkMapStatus'));$('walkMapStatus').style.cssText='font-size:16px;padding:10px 20px;margin:0;color:#e8d49d';
 const home=el('section','walkView');home.id='walkHome';const heading=el('div','walkSectionTitle');heading.innerHTML='<h1>今日の散歩</h1><span>YOUR DAILY WALK</span>';home.append(heading);
 home.append(host.querySelector('#walkDestinationForm'));
 const metrics=host.querySelector('.metrics');const cardMetric=el('div','metric');cardMetric.append(document.createTextNode('カード'),$('walkCount'));home.append(metrics);metrics.append(cardMetric);
 const record=el('div','walkRecordControls');record.append($('walkStart'),$('walkPause'),$('walkFinish'));home.append(record,$('walkNotice'));
 $('walkPause').textContent='一時停止';$('walkFinish').textContent='記録を保存';
 home.append(el('p','walkRecordingHint','画面を開いている間だけ記録。ロック・別アプリへの移動で一時停止します。'));
 const quick=el('div','walkQuick');quick.setAttribute('aria-label','クイック機能');home.append(quick);
 const facilities=el('section','walkView');facilities.id='walkFacilities';facilities.append(host.querySelector('.safeMapPanel'));
 const safe=facilities.firstElementChild;const safeNotes=el('details','walkNotes');safeNotes.append(el('summary','','施設情報・出典について'));for(const p of [...safe.querySelectorAll(':scope > p.subtle')])safeNotes.append(p);safe.append(safeNotes);
 const discover=el('section','walkView');discover.id='walkDiscover';discover.innerHTML='<div class="walkSectionTitle"><h2>街を発見</h2><span>LOCAL DISCOVERY</span></div><p class="subtle">ご当地カードは大阪・天満周辺の3地点限定。全国の散歩記録はどこでも利用できます。</p>';
 discover.append($('walkTenma'));$('walkTenma').open=true;discover.append(el('h2','','天満のカード'),$('walkCards'));discover.append(el('p','subtle','購入・入店は不要。安全な公道から、GPS精度を確認して到着判定します。'));
 const records=el('section','walkView');records.id='walkRecords';records.append(el('h2','','マイ記録'),$('walkHistory'));
 const health=el('details','walkNotes');health.append(el('summary','','BODY・ヘルスデータ'),$('walkHealth'));const bodyLink=host.querySelector('a[href="./apps/body/"]');bodyLink.removeAttribute('href');bodyLink.textContent='BODYとの実連携は未成立。別製品の記録は自動取得しません。';health.append(bodyLink);records.append(health);
 const notes=el('details','walkNotes');notes.append(el('summary','','使い方・保存・地点情報'));
 // Retain all original explanatory text in a disclosure, without duplicating live controls.
 for(const n of original){if(n.tagName==='P'&&n.parentElement===host)notes.append(n);if(n.tagName==='DETAILS'&&n.parentElement===host&&n.id!=='walkTenma')notes.append(n);}
 home.append(notes);
 const nav=el('nav','walkBottomNav');nav.setAttribute('aria-label','WALKナビゲーション');
 const views={walk:home,facilities,discover,records};const labels={walk:'WALK',facilities:'周辺施設',discover:'街を発見',records:'マイ記録'};const icons={walk:'↗',facilities:'◎',discover:'◇',records:'▤'};
 const buttons=[];
 function activate(key,scroll=true){for(const [k,v]of Object.entries(views))v.hidden=k!==key;for(const b of buttons){b.setAttribute('aria-pressed',String(b.dataset.view===key));}if(scroll)window.scrollTo({top:0,behavior:'auto'});}
 function button(key,container){const b=el('button','walkNavButton');b.type='button';b.dataset.view=key;b.innerHTML='<span aria-hidden="true">'+icons[key]+'</span><span>'+labels[key]+'</span>';b.onclick=()=>activate(key);buttons.push(b);container.append(b);}
 for(const key of Object.keys(views))button(key,nav);
 button('facilities',quick);button('discover',quick);const body=el('a','walkNavButton');body.textContent='歩数はネイティブ取得時のみ';body.className='subtle';button('records',quick);
 header.querySelector('a').onclick=e=>{e.preventDefault();activate('walk');};
 // The original handlers have already been registered; moving nodes preserves them.
 host.replaceChildren(header,map,home,facilities,discover,records,nav);
 document.body.classList.add('walkUIv2');
 const sync=()=>{const text=$('walkFix').textContent;location.textContent=text.includes('未取得')?'現在地は未取得':text.replace('現在地：',$('walkStart').disabled?'現在地 ':'最終取得 ').split(' / ')[0];const active=$('walkStart').disabled;$('walkStart').textContent=active?'GPS記録中':'GPSを開始';$('walkPause').hidden=!active;};
 new MutationObserver(sync).observe($('walkFix'),{childList:true,subtree:true});new MutationObserver(sync).observe($('walkStart'),{attributes:true,attributeFilter:['disabled']});sync();activate('walk',false);
}
