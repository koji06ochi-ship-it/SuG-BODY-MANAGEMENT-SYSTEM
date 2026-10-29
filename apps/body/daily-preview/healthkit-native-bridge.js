'use strict';
(()=>{
 const Core=globalThis.BodyHealthKitNativeBridge;if(!Core)return;
 const isTest=typeof TEST!=='undefined'&&TEST===true,params=new URLSearchParams(location.search),mockEnabled=isTest&&params.get('healthMock')==='1';
 const nativeHandler=globalThis.webkit?.messageHandlers?.sugHealthKit;
 const mockPost=message=>setTimeout(()=>{
  if(message.action===Core.ACTIONS.STATUS)return globalThis.sugBodyHealthKitReceive({requestId:message.requestId,ok:true,result:{available:true,mode:'development-fixture'}});
  if(message.action===Core.ACTIONS.AUTHORIZE)return globalThis.sugBodyHealthKitReceive({requestId:message.requestId,ok:true,result:{requested:true,mode:'development-fixture'}});
  if(message.action===Core.ACTIONS.READ_DAILY)return globalThis.sugBodyHealthKitReceive({requestId:message.requestId,ok:true,result:{source:'development-fixture',bridgeVersion:Core.VERSION,day:'2026-10-29',timeZone:'Asia/Tokyo',syncedAt:'2026-10-29T00:30:00+09:00',coverageStart:'2026-10-29T00:00:00+09:00',coverageEnd:'2026-10-29T00:30:00+09:00',isComplete:false,steps:4321,heartRate:72,sleepHours:7.2,activeEnergyKcal:280,restingEnergyKcal:1320,sampleIdsByField:{steps:['fixture-step-1'],heart:['fixture-heart-1'],sleep:['fixture-sleep-1'],energy:['fixture-active-1'],restingEnergy:['fixture-resting-1']}}})
 },0);
 const post=mockEnabled?mockPost:nativeHandler&&typeof nativeHandler.postMessage==='function'?message=>nativeHandler.postMessage(message):null;
 const bridge=Core.create({postMessage:post});
 globalThis.sugBodyHealthKitReceive=message=>bridge.receive(message);
 globalThis.SUGBodyHealthKit=bridge;
 const host=document.querySelector('#recovery');if(!host)return;
 const panel=document.createElement('article');panel.id='healthKitNativeBridge';panel.className='panel management-panel healthkit-native-panel';
 panel.innerHTML='<span class="eyebrow">APPLE HEALTHKIT</span><h2>Appleヘルスケア連携</h2><p id="healthKitBridgeState" class="management-status"></p><div class="healthkit-actions"><button id="healthKitAuthorize" type="button">読取許可を確認</button><button id="healthKitReadToday" type="button">今日の実測値を取得</button></div><div id="healthKitBridgeValues" class="healthkit-values"></div><p class="note">歩数・心拍・睡眠・活動エネルギー・安静時エネルギーを読取対象にします。取得値は候補として表示し、本人が項目を選んで反映します。歩数やエネルギーを既存記録へ加算しません。</p>';
 host.append(panel);
 const state=panel.querySelector('#healthKitBridgeState'),authorize=panel.querySelector('#healthKitAuthorize'),read=panel.querySelector('#healthKitReadToday'),values=panel.querySelector('#healthKitBridgeValues');
 const setState=value=>{state.textContent=value};
 function render(snapshot){values.replaceChildren();for(const [label,value,unit] of [['歩数',snapshot.steps,'歩'],['心拍',snapshot.heartRate,'bpm'],['睡眠',snapshot.sleepHours,'時間'],['活動エネルギー',snapshot.activeEnergyKcal,'kcal'],['安静時エネルギー',snapshot.restingEnergyKcal,'kcal']]){const card=document.createElement('div');card.innerHTML='<small></small><b></b><span></span>';card.querySelector('small').textContent=label;card.querySelector('b').textContent=value===null?'未取得':String(value);card.querySelector('span').textContent=value===null?'':unit;values.append(card)}}
 const renderNative=payload=>{try{const snapshot=Core.normalizeSnapshot(payload,false);render(snapshot);setState('iOSホストからHealthKit実測値を受信しました。BODYへの反映は下の項目選択で行います。')}catch(error){setState('HealthKit受信値を確認できません：'+error.message)}};
 globalThis.addEventListener('sug:native-health',event=>renderNative(event.detail));
 if(globalThis.__SUG_NATIVE_HEALTH__)renderNative(globalThis.__SUG_NATIVE_HEALTH__);
 else if(!bridge.available()){setState(params.get('native')==='ios'?'iOSホストからのHealthKit受信を待っています。許可はiPhoneのシステム画面で確認します。':'このWindowsブラウザーにはiOS HealthKitブリッジがありません。手入力と既存推定を維持します。');authorize.disabled=true;read.disabled=true}else setState(mockEnabled?'開発モック接続。実HealthKit・実機許可ではありません。':'iOSネイティブブリッジを検出しました。読取は本人操作後だけ開始します。');
 authorize.onclick=async()=>{try{authorize.disabled=true;setState('iPhoneの許可画面を確認しています。');await bridge.request(Core.ACTIONS.AUTHORIZE,{readOnly:true});setState(mockEnabled?'開発モックの許可境界を通過しました。実機許可ではありません。':'許可要求が完了しました。項目ごとの読取結果は取得時に確認します。')}catch(error){setState('HealthKit許可を確認できません：'+error.message)}finally{authorize.disabled=!bridge.available()}};
 read.onclick=async()=>{try{read.disabled=true;setState('今日のHealthKitデータを取得しています。');const requestedDay=typeof day==='function'?day():'',raw=await bridge.request(Core.ACTIONS.READ_DAILY,{day:requestedDay,fields:['steps','heartRate','sleepAnalysis','activeEnergyBurned','basalEnergyBurned']}),snapshot=Core.normalizeSnapshot(raw,mockEnabled,requestedDay);render(snapshot);setState((mockEnabled?'開発モック':'HealthKit実測')+'を受信しました。対象日 '+(snapshot.day||requestedDay||'不明')+'／'+(snapshot.timeZone||'端末時間帯')+'。まだBODY記録へ反映していません。');globalThis.dispatchEvent(new CustomEvent('sug:healthkit-snapshot',{detail:snapshot}))}catch(error){setState('HealthKitデータを取得できません：'+error.message)}finally{read.disabled=!bridge.available()}};
})();
