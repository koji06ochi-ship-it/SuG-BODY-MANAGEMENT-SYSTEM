/* Native document-start adapter. Installed only in the bundled formal BODY WebView. */
(() => {
 'use strict';
 const handler=window.webkit?.messageHandlers?.sugBodyNative;
 if(!handler||!(location.protocol.startsWith('file')||(location.protocol==='http:'&&location.hostname==='127.0.0.1'&&location.port==='5411')))return;
 const assetHandler=window.webkit.messageHandlers.sugBodyAssets;
 const originalFetch=window.fetch.bind(window);
 window.fetch=async(input,options={})=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
  if(url.protocol!=='file:')return originalFetch(input,options);
  if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
  if((options.method||'GET').toUpperCase()!=='GET')throw new TypeError('Local assets are read only');
  const text=await assetHandler.postMessage({url:url.href});
  if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
  return new Response(text,{status:200,headers:{'Content-Type':'application/json'}});
 };
 const callbacks=new Map();let sequence=0;
 const post=message=>handler.postMessage(message);
 function begin(success,error,options={},watch=false){
  if(typeof success!=='function')throw new TypeError('成功コールバックが必要です');
  const id=++sequence;callbacks.set(id,{success,error,watch});
  post({kind:'gpsStart',id,watch,highAccuracy:options.enableHighAccuracy===true,timeout:Number.isFinite(options.timeout)?Math.max(0,options.timeout):30000});return id;
 }
 const geolocation={getCurrentPosition:(s,e,o)=>{begin(s,e,o,false)},watchPosition:(s,e,o)=>begin(s,e,o,true),clearWatch:id=>{callbacks.delete(id);post({kind:'gpsStop',id})}};
 Object.defineProperty(navigator,'geolocation',{value:geolocation,configurable:true});
 window.SuGNativeTransport={
  requestHealth:()=>post({kind:'healthRequest'}),
  exportJSON:json=>post({kind:'exportJSON',json}),
  receiveGPS(message){const c=callbacks.get(message.id);if(!c)return;if(message.error){c.error?.(message.error);callbacks.delete(message.id)}else{if(!c.watch)callbacks.delete(message.id);c.success(message.position)}}
 };
 window.addEventListener('pagehide',()=>{callbacks.clear();post({kind:'gpsStopAll'})});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const [id,c]of callbacks)c.error?.({code:2,message:'バックグラウンドのためGPSを停止しました'});callbacks.clear();post({kind:'gpsStopAll'})}});
})();
