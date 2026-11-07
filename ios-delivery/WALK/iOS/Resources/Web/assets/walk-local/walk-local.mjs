import {validateSession} from './walk-backup-core.mjs';
import {createNativeSessionReceiver} from './walk-native-session.mjs';
import {arrangeWalkUI} from './walk-ui-v2.mjs';
import {createSafeMap} from './walk-safe-map.mjs';
import {createMapView} from './walk-map-view.mjs';
import {TEST_MODE,SPOTS,PREFIX,validFix,arrived,createDistanceTracker,claim,routeURL,mapsSearchURL,mapsRouteURL,distance} from './walk-core.mjs';
const nativeOwner=window.__SUG_NATIVE_WALK_OWNER__;
const nativeMode=!!nativeOwner;
const acceptNative=createNativeSessionReceiver(nativeOwner);
const host=document.createElement('section');host.id='localWalk';
host.innerHTML=`<div class="eyebrow">S.u.G / WALK × BODY × CARD · 先行版</div><h1>どこでも、歩こう。</h1><p class="subtle">全国で現在地・歩行距離・時間を記録。ご当地カードは大阪・天満周辺の3地点で利用できます。</p>
<p id="walkMapLabel">日本の地図（現在地は未取得）</p><div class="walkMapWrap"><div id="walkMap" aria-label="散歩の地図"></div></div><p id="walkMapStatus" class="subtle" role="status" aria-live="polite">地図を準備しています。</p><p class="subtle">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a></p><div class="controls"><button id="walkMapRetry" type="button">地図を再読込</button><a id="walkMapExternal" class="action" target="_blank" rel="noopener">外部地図を開く ↗</a></div><div class="controls"><button id="walkCurrentMap" disabled>現在地へ戻る</button><button id="walkSelectDestination" type="button">地図で目的地を指定</button></div><p class="subtle">最初のGPS取得時に現在地を表示します。地図操作を始めた後は自動で中心を変えません。移動後は「現在地へ戻る」を押してください。</p>
<div id="walkDestinationForm" class="walkDestination"><label for="walkDestinationInput">全国の目的地（施設名・住所）</label><input id="walkDestinationInput" type="search" maxlength="200" autocomplete="street-address" placeholder="例：京都駅、東京都庁"><label for="walkTravelMode">移動方法</label><select id="walkTravelMode"><option value="walking">徒歩</option><option value="bicycling">自転車</option><option value="transit">公共交通</option></select><div class="controls"><a id="walkDestinationSearch" class="action" target="_blank" rel="noopener" aria-disabled="true">Google Mapsで検索</a><a id="walkDestinationRoute" class="action" target="_blank" rel="noopener" aria-disabled="true">経路を開く</a></div><p id="walkDestinationStatus" class="subtle" role="status">施設名・住所は外部Google Mapsで検索します。地図をタップすると座標の目的地を設定できます。</p><p class="subtle">経路は外部Google Mapsの案内です。徒歩・自転車・公共交通の利用可否や経路は地域・サービス側の対応に依存します。アプリ内の直線距離を経路距離として表示しません。</p></div>
<details id="walkTenma"><summary>天満周辺の3スポット・徒歩経路</summary><div class="spotList">${SPOTS.map((s,i)=>`<button class="destination" data-spot="${i}" aria-pressed="${i===0}">${i+1}. ${s.name}<small>${s.address}</small></button>`).join('')}</div>
<div class="controls"><button id="walkDestinationMap">選んだ目的地の地図</button><a class="action" id="walkRoute" target="_blank" rel="noopener">徒歩経路を開く ↗</a></div></details>
<p class="subtle">経路案内はGoogle Mapsで開きます。戻ったらGPSを再開してください。地図が読み込めない場合も経路リンクを利用できます。</p>
<div id="walkNotice" role="status" aria-live="polite">「GPSを開始」で現在地と到着を確認します。</div><p id="walkFix" class="subtle">現在地：未取得</p>
<div class="controls"><button id="walkStart" class="primary">GPSを開始</button><button id="walkPause" disabled>一時停止・保存</button></div><div class="metrics"><div class="metric">歩行距離（GPS推定）<strong id="walkDistance">0 m</strong></div><div class="metric">記録時間<strong id="walkDuration">00:00</strong></div></div><div class="controls"><button id="walkFinish">この歩行を記録</button></div>
<p class="subtle">画面を開いている間だけ記録します。画面ロック・別アプリ・別タブへの移動で一時停止します。距離はGPS誤差を含み、停止中の移動は加算しません。</p>
<h2>ご当地カード <span id="walkCount">0 / 3</span></h2><div id="walkCards">${SPOTS.map((s,i)=>`<button class="collect" data-card="${i}" disabled><img src="./assets/walk-local/${s.art}" alt="${s.title}" loading="lazy"><span>${s.title}</span><span class="state">到着待ち</span></button>`).join('')}</div>
<p class="subtle">100m圏内でGPS精度も確認して表示します。道路を横断して取りに行ったり、私有地へ入る必要はありません。</p>
<label class="subtle"><input type="checkbox" id="walkKeepRoute">経路の座標をこの端末に保存する（任意・最大5,000点）</label><h2>歩数・ヘルスデータ</h2><p id="walkHealth" class="subtle">ヘルスデータ：未受信</p><a class="action" href="./apps/body/" target="_top">BODYを開く →</a><p class="subtle">既存BODYの健康管理を利用します。GPS距離を歩数やHealthKitデータへ換算・上書きしません。</p><h2>歩行の記録</h2><ul id="walkHistory"></ul>
<details><summary>保存・地点情報について</summary><p class="subtle">カードと歩行記録はこの端末・このブラウザに保存します。通常の再起動後も残りますが、サイトデータの削除や端末変更では引き継がれません。保存できない場合は取得完了にしません。</p><p class="subtle">地点は既存QUESTの確認済み地点資料を再利用しています。現地での入口・測位精度は未検証です。営業時間や休憩場所の提供を保証する案内ではありません。</p></details>`;
document.querySelector('.top').after(host);
const $=id=>document.getElementById(id), store=()=>window.localStorage;
const mapView=createMapView();
let selectedDestinationPoint=null;
const mapController=createSafeMap({element:$('walkMap'),status:$('walkMapStatus'),retry:$('walkMapRetry'),external:$('walkMapExternal'),onManual:()=>mapView.manual(),onDestination:setDestinationPoint});
let selected=SPOTS[0],fix=null,watch=null,running=false,lastTick=0;
const tracker=createDistanceTracker();
let session={meters:0,ms:0},storageOK=true;
const note=t=>{$('walkNotice').textContent=t;};
function destinationValue(){return selectedDestinationPoint||$('walkDestinationInput').value.trim();}
function updateDestinationLinks(){const value=destinationValue(),search=$('walkDestinationSearch'),route=$('walkDestinationRoute');if(!value){search.removeAttribute('href');route.removeAttribute('href');search.setAttribute('aria-disabled','true');route.setAttribute('aria-disabled','true');return;}try{search.href=mapsSearchURL(value);route.href=mapsRouteURL(value,$('walkTravelMode').value,validFix(fix)?fix:null);search.setAttribute('aria-disabled','false');route.setAttribute('aria-disabled','false');}catch{search.removeAttribute('href');route.removeAttribute('href');search.setAttribute('aria-disabled','true');route.setAttribute('aria-disabled','true');}}
function setDestinationPoint(p){selectedDestinationPoint=p.lat.toFixed(6)+','+p.lng.toFixed(6);$('walkDestinationInput').value=selectedDestinationPoint;$('walkDestinationStatus').textContent='地図上の目的地：'+selectedDestinationPoint+'。ピンを地図に表示しました。';updateDestinationLinks();}
try{const raw=nativeMode?null:store().getItem(PREFIX+'session');if(raw){const v=validateSession(JSON.parse(raw));session=v;}}
catch{storageOK=false;note('保存済み歩行データを読めません。元データは保持しています。カードの保存状態もご確認ください。');}
function persist(){if(nativeMode)return true;if(!storageOK)return false;try{store().setItem(PREFIX+'session',JSON.stringify(session));return true;}catch{storageOK=false;note('端末に保存できません。空き容量・ブラウザ設定を確認してください。記録は画面を閉じると失われる可能性があります。');return false;}}
function tick(){if(nativeMode)return;const now=performance.now();if(running){session.ms+=Math.max(0,now-lastTick);lastTick=now;} }
function cards(){let count=0;host.querySelectorAll('[data-card]').forEach(b=>{const s=SPOTS[Number(b.dataset.card)];let owned=false;try{owned=store().getItem(PREFIX+'card:'+s.id)!==null;}catch{storageOK=false;}
const ready=running&&arrived(fix,s);if(owned)count++;b.disabled=owned||!ready||!storageOK;b.classList.toggle('owned',owned);b.classList.toggle('ready',ready&&!owned);b.querySelector('.state').textContent=owned?'取得済み ✓':ready?'到着！タップして取得':'到着待ち';});$('walkCount').textContent=count+' / 3';}
function render(){tick();$('walkDistance').textContent=Math.round(session.meters)+' m';const sec=Math.floor(session.ms/1000);$('walkDuration').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');$('walkStart').disabled=running;$('walkPause').disabled=!running;$('walkCurrentMap').disabled=!validFix(fix);$('walkRoute').href=routeURL(selected,fix);updateDestinationLinks();cards();}
function map(s,label,overview=false){mapController.show(s,overview);$('walkMapLabel').textContent=label;}
function pause(message){tick();running=false;if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;}fix=null;mapController.updateFix(null);tracker.reset();persist();render();if(message&&storageOK)note(message);}
function receive(p){if(!running||document.hidden)return;const next={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,t:p.timestamp};if(!validFix(next)){fix=null;mapController.updateFix(null);tracker.reset();note('GPSの精度または更新時刻を確認できません。空の見える安全な場所でお待ちください。');render();return;}
session.hasValidFix=true;if(!nativeMode&&$('walkKeepRoute').checked){session.route=session.route||[];if(session.route.length<5000&&session.route.at(-1)?.t!==next.t)session.route.push({lat:next.lat,lng:next.lng,t:next.t});}if(!nativeMode)session.meters+=tracker.push(next);fix=next;mapController.updateFix(next);if(mapView.locate())map(next,'現在地の地図（GPS取得時点）');tick();persist();$('walkFix').textContent=`現在地：${next.lat.toFixed(6)}, ${next.lng.toFixed(6)} / 精度 ±${Math.round(next.accuracy)}m / ${new Date(next.t).toLocaleTimeString('ja-JP')}`;
if(storageOK)note(arrived(next,selected)?`${selected.name}に接近しました。カードをタップして取得できます。`:distance(next,selected)<=3000?`GPS記録中。${selected.name}まで直線約${Math.round(distance(next,selected))}m（徒歩経路の距離ではありません）。`:'GPS記録中。全国で歩行距離・時間を記録できます。ご当地カードは天満周辺限定です。');render();}
$('walkStart').onclick=()=>{if(TEST_MODE){note('隔離テストでは実GPSを開始しません。実測記録とは別です。');return;}if(nativeMode){note('iOSアプリ上部の「開始・再開」を使用してください。');return;}if(!window.isSecureContext){note('GPSにはHTTPS接続が必要です。HTTPSのS.u.GをSafariで開いてください。');return;}if(!navigator.geolocation){note('このブラウザは位置情報に対応していません。Safariで開いてください。');return;}running=true;lastTick=performance.now();fix=null;mapController.updateFix(null);tracker.reset();note('位置情報の許可を待っています…');render();try{watch=navigator.geolocation.watchPosition(receive,e=>{pause();note(e.code===1?'位置情報が許可されていません。iPhoneの設定でSafariの位置情報と「正確な位置情報」を確認し、再度GPSを開始してください。':e.code===3?'位置情報の取得がタイムアウトしました。安全な場所で再試行してください。':'位置情報を取得できません。通信・位置情報設定を確認し、再試行してください。');},{enableHighAccuracy:true,maximumAge:0,timeout:15000});}catch{pause('位置情報を開始できません。ブラウザの権限を確認してください。');}};
$('walkPause').onclick=()=>{if(nativeMode){note('iOSアプリ上部の「一時停止」を使用してください。');return;}pause('一時停止しました。再開すると新しい現在地から記録します。');};
host.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>{selected=SPOTS[Number(b.dataset.spot)];host.querySelectorAll('[data-spot]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));mapView.manual();map(selected,selected.name+'の地図');render();});
$('walkDestinationMap').onclick=()=>{mapView.manual();map(selected,selected.name+'の地図');};$('walkCurrentMap').onclick=()=>{if(validFix(fix)){mapView.current();map(fix,'現在地の地図（表示時点）');}};$('walkSelectDestination').onclick=()=>mapController.selectDestination();$('walkDestinationInput').addEventListener('input',()=>{selectedDestinationPoint=null;$('walkDestinationStatus').textContent='入力した目的地を外部Google Mapsで検索できます。地図上の座標指定は地図ボタンを使用してください。';updateDestinationLinks();});$('walkTravelMode').addEventListener('change',updateDestinationLinks);updateDestinationLinks();
host.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{if(!running||!storageOK)return;try{const result=claim(store(),SPOTS[Number(b.dataset.card)],fix);note(result==='saved'?'カードを保存しました。再起動後もこのブラウザで確認できます。':result==='owned'?'このカードは取得済みです。':'現在の到着を確認できません。GPSを更新してください。');}catch{storageOK=false;note('カードを保存できませんでした。取得完了にはしていません。ブラウザの保存設定を確認してください。');}cards();});
function history(){const ul=$('walkHistory');ul.replaceChildren();try{const entries=[];for(let i=0;i<store().length;i++){const key=store().key(i);if(key.startsWith(PREFIX+'walk:')){try{const x=JSON.parse(store().getItem(key));if(Number.isFinite(x.meters)&&Number.isFinite(x.ms))entries.push(x);}catch{}}}entries.sort((a,b)=>b.endedAt.localeCompare(a.endedAt)).slice(0,20).forEach(x=>{const li=document.createElement('li');li.textContent=`${new Date(x.endedAt).toLocaleString('ja-JP')} · ${Math.round(x.meters)}m · ${Math.floor(x.ms/60000)}分`;ul.append(li);});if(!entries.length)ul.textContent='記録はまだありません。';}catch{ul.textContent='保存済み記録を読み込めません。';}}
$('walkFinish').onclick=()=>{if(nativeMode){note('iOSアプリ上部の「停止・保存」を使用してください。');return;}pause();if(!storageOK||session.ms<1000){note('保存可能な歩行記録がありません。');return;}if(!session.hasValidFix){note('GPSの有効な現在地を取得していないため、歩行履歴には保存しません。GPSを再開して測位してください。');return;}try{const id=session.id||('walk:'+Date.now()+'-'+Math.random().toString(36).slice(2));session.id=id;if(!persist())return;const result={meters:session.meters,ms:session.ms,endedAt:new Date().toISOString(),source:'web-gps',route:session.route||[],routeLimited:(session.route?.length||0)>=5000};store().setItem(PREFIX+id,JSON.stringify(result));session={meters:0,ms:0};persist();history();render();if(storageOK)note('歩行を保存しました。次の歩行を開始できます。');}catch{note('歩行を保存できませんでした。現在の記録を保持しています。');}};
function health(){if(TEST_MODE)return;try{const p=JSON.parse(store().getItem('sug_native_health_v1')||'null');if(!p)return;const d=new Date(p.syncedAt),v=p.steps??p.stepCount;if(Number.isFinite(Number(v))&&v!==null&&Number.isFinite(d.getTime()))$('walkHealth').textContent=`既存ヘルスデータ：${Number(v).toLocaleString()}歩 / 同期 ${d.toLocaleString('ja-JP')}（現在の歩数とは限りません）`;}catch{}}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause('画面を離れたため一時停止しました。GPSを開始して再開できます。');});window.addEventListener('pagehide',()=>pause());window.addEventListener('storage',()=>{cards();history();health();});window.addEventListener('sug:native-health',health);
setInterval(()=>{render();if(running)persist();},1000);map(null,'日本の地図（現在地は未取得）',true);render();history();health();

const routeOption=$('walkKeepRoute').closest('label');
arrangeWalkUI(host);
if(nativeMode){ const bodyLink=host.querySelector('a[href="./apps/body/"]');if(bodyLink){bodyLink.href='sug-body://home';bodyLink.removeAttribute('target');} }

document.getElementById('walkHome').append(routeOption);if(TEST_MODE){const banner=document.createElement('p');banner.textContent='隔離テスト・架空記録／GPS実測ではありません';banner.style.cssText='position:sticky;top:0;z-index:999;background:#fff4c2;color:#222;padding:10px;text-align:center';document.body.prepend(banner);}
import('./walk-backup-ui.mjs').catch(()=>note('バックアップ操作を開けません。記録は変更していません。'));

// Native summaries do not write to web session/history or change card conditions.
if(nativeMode){
  host.querySelector('.walkRecordControls').hidden=true;
  host.querySelector('.walkRecordingHint').textContent='記録はiOSが担当します。画面ロック中の継続はOSの制約を受けます。開始・停止・保存はアプリ上部で操作してください。';
  const applyNative=payload=>{
    const value=acceptNative(payload);if(!value)return;
    running=value.phase==='recording';session={meters:value.meters,ms:value.ms};
    fix=null;mapController.updateFix(null);
    if(running&&value.fix)receive({coords:{latitude:value.fix.lat,longitude:value.fix.lng,accuracy:value.fix.accuracy},timestamp:value.fix.t});
    else $('walkFix').textContent='現在地：未取得';
    render();note(value.message+'（記録操作はiOSアプリ上部）');
  };
  window.addEventListener('sug:native-walk',e=>applyNative(e.detail));
  applyNative(window.__SUG_NATIVE_WALK_SNAPSHOT__);
  note('iOSネイティブ記録。開始・停止・保存はアプリ上部で操作してください。');
}
