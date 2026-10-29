(function(root){'use strict';
 const finite=(value,min,max)=>{const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error('GPS_COORDINATE_INVALID');return n};
 function normalize(position,options={}){
  const coords=position?.coords||position||{},lat=finite(coords.latitude??coords.lat,-90,90),lng=finite(coords.longitude??coords.lng,-180,180),accuracy=Number(coords.accuracy),maxAccuracy=Math.max(10,Math.min(1000,Number(options.maxAccuracy)||100));
  if(!Number.isFinite(accuracy)||accuracy<0)throw Error('GPS_ACCURACY_INVALID');
  if(accuracy>maxAccuracy)throw Error('GPS_ACCURACY_LOW');
  const timestamp=Number(position?.timestamp||Date.now()),maxAge=Math.max(0,Number(options.maxAgeMs)||60000);
  if(!Number.isFinite(timestamp)||Date.now()-timestamp>maxAge)throw Error('GPS_POSITION_STALE');
  return{lat,lng,accuracy,at:new Date(timestamp).toISOString()};
 }
 function message(error){
  const code=String(error?.message||error||'');
  if(error?.code===1||code==='GPS_PERMISSION_DENIED')return'位置情報が許可されていません。端末設定を確認してください。';
  if(error?.code===2||code==='GPS_POSITION_UNAVAILABLE')return'現在地を取得できません。通信・GPS状態を確認してください。';
  if(error?.code===3||code==='GPS_TIMEOUT')return'現在地の取得が時間切れになりました。';
  if(code==='GPS_ACCURACY_LOW')return'位置精度が不足しています。空が見える場所で再取得してください。';
  if(code==='GPS_POSITION_STALE')return'取得済み位置が古いため使用しませんでした。';
  return'現在地を確認できません。';
 }
 root.BodyMapGps={normalize,message};
 if(typeof module!=='undefined')module.exports=root.BodyMapGps;
})(typeof globalThis!=='undefined'?globalThis:this);
