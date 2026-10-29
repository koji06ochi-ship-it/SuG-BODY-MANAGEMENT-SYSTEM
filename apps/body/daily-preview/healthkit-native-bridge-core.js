(function(root){'use strict';
const VERSION='1.0.0';
const ACTIONS=Object.freeze({STATUS:'status',AUTHORIZE:'requestAuthorization',READ_DAILY:'readDailySnapshot'});
const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?value:'';
const finite=(value,min,max,integer=false)=>{if(value===null||value===undefined||value==='')return null;const n=Number(value);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw Error('HEALTHKIT_VALUE_INVALID');return n};
function normalizeSnapshot(input,allowFixture=false,expectedDay=''){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('HEALTHKIT_SNAPSHOT_REQUIRED');
 const source=String(input.source||'');
 if(source!=='healthkit_native'&&!(allowFixture&&source==='development-fixture'))throw Error('HEALTHKIT_SOURCE_INVALID');
 const coverageStart=iso(input.coverageStart),coverageEnd=iso(input.coverageEnd),syncedAt=iso(input.syncedAt);
 if(!coverageStart||!coverageEnd||Date.parse(coverageEnd)<Date.parse(coverageStart))throw Error('HEALTHKIT_COVERAGE_INVALID');
 const day=String(input.day||'').slice(0,10),timeZone=String(input.timeZone||'').slice(0,80);
 if(day&&!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('HEALTHKIT_DAY_INVALID');
 if(expectedDay&&day&&day!==expectedDay)throw Error('HEALTHKIT_DAY_MISMATCH');
 const values={steps:finite(input.steps??input.stepCount,0,200000,true),heartRate:finite(input.heartRate,0,250),sleepHours:finite(input.sleepHours??input.sleep,0,24),activeEnergyKcal:finite(input.activeEnergyKcal,0,10000),restingEnergyKcal:finite(input.restingEnergyKcal??input.basalEnergyKcal,0,10000)};
 if(Object.values(values).every(value=>value===null))throw Error('HEALTHKIT_EMPTY_SNAPSHOT');
 const sampleIdsByField={};
 for(const [key,list] of Object.entries(input.sampleIdsByField||{})){
  if(!['steps','heart','sleep','energy','restingEnergy'].includes(key)||!Array.isArray(list))continue;
  sampleIdsByField[key]=[...new Set(list.map(String).filter(Boolean))].slice(0,500);
 }
 return{source,day,timeZone,syncedAt,coverageStart,coverageEnd,isComplete:input.isComplete===true,steps:values.steps,heartRate:values.heartRate,sleepHours:values.sleepHours,activeEnergyKcal:values.activeEnergyKcal,restingEnergyKcal:values.restingEnergyKcal,sampleIdsByField,bridgeVersion:String(input.bridgeVersion||VERSION).slice(0,40)};
}
function create(options={}){
 const post=options.postMessage,timeoutMs=Math.max(1000,Math.min(60000,Number(options.timeoutMs)||15000));
 const timers={set:options.setTimer||((fn,ms)=>setTimeout(fn,ms)),clear:options.clearTimer||(id=>clearTimeout(id))},pending=new Map();let sequence=0;
 const available=()=>typeof post==='function';
 function request(action,payload={}){
  if(!Object.values(ACTIONS).includes(action))return Promise.reject(Error('HEALTHKIT_ACTION_INVALID'));
  if(!available())return Promise.reject(Error('HEALTHKIT_NATIVE_BRIDGE_UNAVAILABLE'));
  const requestId='hk-'+Date.now().toString(36)+'-'+(++sequence).toString(36);
  return new Promise((resolve,reject)=>{
   const timer=timers.set(()=>{pending.delete(requestId);reject(Error('HEALTHKIT_NATIVE_TIMEOUT'))},timeoutMs);
   pending.set(requestId,{resolve,reject,timer,action});
   try{post({version:VERSION,requestId,action,payload})}catch(error){timers.clear(timer);pending.delete(requestId);reject(error)}
  });
 }
 function receive(message){
  const requestId=String(message?.requestId||''),row=pending.get(requestId);if(!row)return false;
  timers.clear(row.timer);pending.delete(requestId);
  if(message.ok!==true){row.reject(Error(String(message?.error?.code||message?.error||'HEALTHKIT_NATIVE_FAILED')));return true}
  row.resolve(message.result??{});return true;
 }
 return{version:VERSION,actions:ACTIONS,available,request,receive,pendingCount:()=>pending.size,normalizeSnapshot};
}
root.BodyHealthKitNativeBridge={VERSION,ACTIONS,create,normalizeSnapshot};
if(typeof module!=='undefined')module.exports=root.BodyHealthKitNativeBridge;
})(typeof globalThis!=='undefined'?globalThis:this);
