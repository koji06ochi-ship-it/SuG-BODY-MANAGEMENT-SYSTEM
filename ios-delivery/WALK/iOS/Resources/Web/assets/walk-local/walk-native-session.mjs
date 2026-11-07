// Pure validation for the optional native owner; no storage or geolocation access.
export function createNativeSessionReceiver(owner, now=()=>Date.now()) {
  let sequence=-1;
  return payload=>{
    if(!owner||owner.schema!==1||typeof owner.streamId!=='string'||!payload||payload.schema!==1||payload.source!=='ios-core-location'||payload.streamId!==owner.streamId)return null;
    if(!Number.isSafeInteger(payload.sequence)||payload.sequence<=sequence||typeof payload.sessionId!=='string'||!payload.sessionId||payload.sessionId.length>64)return null;
    if(!['ready','recording','paused','interrupted','finished'].includes(payload.phase)||!Number.isFinite(payload.meters)||payload.meters<0||!Number.isFinite(payload.elapsedMs)||payload.elapsedMs<0||!Number.isFinite(payload.sentAt)||now()-payload.sentAt>10000||now()-payload.sentAt< -5000)return null;
    sequence=payload.sequence;
    const f=payload.fix;
    const fix=payload.phase==='recording'&&f&&Number.isFinite(f.lat)&&Math.abs(f.lat)<=90&&Number.isFinite(f.lng)&&Math.abs(f.lng)<=180&&Number.isFinite(f.accuracy)&&f.accuracy>=0&&f.accuracy<=50&&Number.isFinite(f.t)&&now()-f.t<=20000&&now()-f.t>=-5000?{lat:f.lat,lng:f.lng,accuracy:f.accuracy,t:f.t}:null;
    return {sessionId:payload.sessionId,phase:payload.phase,meters:payload.meters,ms:payload.elapsedMs,fix,message:typeof payload.message==='string'?payload.message.slice(0,400):'ネイティブ記録を表示しています。'};
  };
}
