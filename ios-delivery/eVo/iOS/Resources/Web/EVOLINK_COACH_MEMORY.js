/* Local, opt-in COACH memory and read-only record projection. No credentials or network. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EVOLINK_COACH_MEMORY=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const trainingData=()=>typeof module==='object'&&module.exports?require('./EVOLINK_TRAINING_DATA.js'):globalThis.EVOLINK_TRAINING_DATA;
const KEY='sug_evolink_coach_memory_v1',SCOPES=['training','nutrition','mirror','adapt'];
const clean=(x,n=600)=>typeof x==='string'?x.trim().slice(0,n):'';
const number=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
function policy(x={}){return {retainHistory:x.retainHistory===true,retainNotes:x.retainNotes===true,shareMemory:x.shareMemory===true,referenceReflections:x.referenceReflections===true,scopes:Object.fromEntries(SCOPES.map(k=>[k,x.scopes?.[k]===true]))};}
function messages(rows=[],limit=32){return (Array.isArray(rows)?rows:[]).filter(x=>x&&['user','assistant'].includes(x.role)&&clean(x.content)).slice(-limit).map(x=>({role:x.role,content:clean(x.content,x.role==='assistant'?1600:600)}));}
function initial(){return {version:1,policy:policy(),messages:[],notes:''};}
function normalize(x){if(!x||x.version!==1||!x.policy||!Array.isArray(x.messages)||typeof x.notes!=='string')throw Error('memory_format_invalid');const p=policy(x.policy);return {version:1,policy:p,messages:p.retainHistory?messages(x.messages):[],notes:p.retainNotes?clean(x.notes,800):''};}
function read(storage){try{if(storage.getItem(JOURNAL_KEY))throw Error('pending_restore');const raw=storage.getItem(KEY);return raw?{...normalize(JSON.parse(raw)),storageStatus:'ok'}:{...initial(),storageStatus:'ok'};}catch{return {...initial(),storageStatus:'blocked'};}}
function save(storage,state){if(storage.getItem(JOURNAL_KEY))throw Error('restore_recovery_required');const raw=storage.getItem(KEY);let old;if(raw){try{old=normalize(JSON.parse(raw))}catch{throw Error('memory_storage_blocked')}}const next=normalize(state);if(old&&(old.notes&&old.notes!==next.notes||old.messages.some(m=>!next.messages.some(n=>n.role===m.role&&n.content===m.content))))markDeletion(storage);storage.setItem(KEY,JSON.stringify(next));return next;}
function clear(storage){if(storage.getItem(JOURNAL_KEY))throw Error('restore_recovery_required');markDeletion(storage);storage.removeItem(KEY);}
function row(x,fields){const out={};for(const key of fields){if(typeof x?.[key]==='string')out[key]=clean(x[key],64);else if(typeof x?.[key]==='number'&&Number.isFinite(x[key]))out[key]=x[key];}return out;}
function projection(rows,convert){const selected=(Array.isArray(rows)?rows:[]).slice(-3).map(convert);return {status:selected.length?'recorded':'unrecorded',records:selected};}
function reflections(rows){return (Array.isArray(rows)?rows:[]).slice(-2).map(x=>({at:clean(x?.at,40),choice:clean(x?.choice,16),reflection:clean(x?.reflection,240),body:{status:clean(x?.body?.status,24),direction:clean(x?.body?.direction,24)}}));}
function records(snapshot={},selected={}){
 const p=policy({scopes:selected}).scopes,out={readOnly:true,photosIncluded:false,unrecordedMeansUnknown:true};
 for(const scope of SCOPES)if(!p[scope])out[scope]={status:'not_shared'};
 if(p.training)out.training=projection(snapshot.logs,x=>({...row(x,['date','exercise','exerciseId','method','rir','reps','weight','pain']),sets:(Array.isArray(x?.setDetails)?x.setDetails:[]).slice(-3).map(s=>row(s,['rir','reps','weight','pain']))}));
 if(p.nutrition)out.nutrition=projection(snapshot.nutrition?.meals,x=>row(x,['id','qty','day','date','at','meal','name','food','label','amount','kcal','protein','carbs','fat','p','c','f']));
 if(p.mirror)out.mirror=projection(snapshot.bodyRecords,x=>row(x,['date','at','weight','waist','bodyFat','bodyfat','fat','chest','hip','arm','thigh']));
 if(p.adapt){const saved=reflections(snapshot.coachSessions),recovery=projection(snapshot.recoveryLogs,x=>row(x,['date','sleep','sleepQuality','fatigue','soreness','stress']));out.adapt={status:saved.length||snapshot.review||snapshot.nextSessionPlan||recovery.records.length?'recorded':'unrecorded',reflections:saved,review:row(snapshot.review,['text','at']),recovery:recovery.records,nextSession:row(snapshot.nextSessionPlan,['date','exercise','action','weight','reps','sets','reason','approvedAt']),prescriptionChangeAllowed:false};}
 return out;
}
function memory(state={},saved=[]){const p=policy(state.policy);return p.shareMemory?{status:'shared',notes:p.retainNotes?clean(state.notes,800):'',previousReflections:p.referenceReflections?reflections(saved):[]}:{status:'not_shared'};}
function sanitizeRecords(input={}){
 // Re-project untrusted browser data on the server; never accept arbitrary nested properties.
 const selected={},snapshot={};
 for(const scope of SCOPES)selected[scope]=input?.[scope]?.status==='recorded'||input?.[scope]?.status==='unrecorded';
 snapshot.logs=input.training?.records;
 snapshot.nutrition={meals:input.nutrition?.records};
 snapshot.bodyRecords=input.mirror?.records;
 snapshot.coachSessions=input.adapt?.reflections;
 snapshot.review=input.adapt?.review;snapshot.nextSessionPlan=input.adapt?.nextSession;
 snapshot.recoveryLogs=input.adapt?.recovery;
 // Training arrives as a projected row, with sets rather than raw setDetails.
 snapshot.logs=(Array.isArray(snapshot.logs)?snapshot.logs:[]).map(x=>({...x,setDetails:x?.sets}));
 return records(snapshot,selected);
}
function sanitizeMemory(input={}){return input?.status==='shared'?{status:'shared',notes:clean(input.notes,800),previousReflections:reflections(input.previousReflections)}:{status:'not_shared'};}
const PRIVACY_KEY='sug_evolink_coach_deletions_v1',JOURNAL_KEY='sug_evolink_restore_pending_v1';
function validatePrivacy(x){
 if(!x||x.version!==1||!(x.epoch===null||typeof x.epoch==='string'&&/^[a-f0-9-]{36}$/i.test(x.epoch))||!Array.isArray(x.deletedReflectionIds)||x.deletedReflectionIds.length>2000||x.deletedReflectionIds.some(id=>typeof id!=='string'||!id||id.length>100)||x.deletedReflectionIds.length&&!x.epoch)throw Error('Deletion history is invalid; existing data was not changed.');
 return {version:1,epoch:x.epoch,deletedReflectionIds:[...new Set(x.deletedReflectionIds)]};
}
function privacy(storage){const raw=storage.getItem(PRIVACY_KEY);return raw?validatePrivacy(JSON.parse(raw)):{version:1,epoch:null,deletedReflectionIds:[]};}
function markDeletion(storage,id){
 const p=privacy(storage);p.epoch=crypto.randomUUID();if(id)p.deletedReflectionIds=[...new Set([...p.deletedReflectionIds,id])];validatePrivacy(p);storage.setItem(PRIVACY_KEY,JSON.stringify(p));return p;
}
function exactState(x){
 if(!x||x.version!==1||!x.policy||typeof x.notes!=='string'||x.notes.length>800||!Array.isArray(x.messages)||x.messages.length>32)throw Error('Invalid COACH memory structure.');
 for(const key of ['retainHistory','retainNotes','shareMemory','referenceReflections'])if(typeof x.policy[key]!=='boolean')throw Error('Invalid memory permission.');
 if(!x.policy.scopes||SCOPES.some(key=>typeof x.policy.scopes[key]!=='boolean'))throw Error('Invalid record permissions.');
 if(x.messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim()||m.content.length>(m.role==='assistant'?1600:600)))throw Error('Invalid conversation history.');
 if(!x.policy.retainHistory&&x.messages.length||!x.policy.retainNotes&&x.notes)throw Error('Memory exceeds its selected retention scope.');
 return normalize(x);
}
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
function filteredData(data,p){return {...data,coachSessions:(data.coachSessions||[]).filter(x=>!p.deletedReflectionIds.includes(x.id))};}
async function makeBackup(storage,data,includeMemory=false){
 if(storage.getItem(JOURNAL_KEY))throw Error('Finish recovery of the pending restore first.');
 const p=privacy(storage),raw=storage.getItem(KEY),state=includeMemory&&raw?exactState(JSON.parse(raw)):null;
 const body=filteredData(data,p),extension={version:1,included:includeMemory===true,state,privacy:p};
 const trainingExtension=trainingData().validate(trainingData().snapshot(storage),body);const bundle={format:'SUG_EVOLINK_BACKUP',version:4,exportedAt:new Date().toISOString(),sha256:await digest(JSON.stringify(body)),data:body,coachMemory:extension,coachMemorySHA256:await digest(JSON.stringify(extension)),trainingExtension,trainingExtensionSHA256:await digest(JSON.stringify(trainingExtension))};if(JSON.stringify(bundle).length>8300000)throw Error('Backup exceeds the 8.3 MB limit.');return bundle;
}
async function parseBackup(value,validate){
 if(typeof validate!=='function')throw Error('Record validation is unavailable.');
 const text=typeof value==='string'?value:JSON.stringify(value);if(text.length>8300000)throw Error('Backup is too large.');
 const obj=typeof value==='string'?JSON.parse(value):JSON.parse(text);let data=obj,extension=null,trainingExtension=null,legacy=true;
 if(obj?.format==='SUG_EVOLINK_BACKUP'){
  if(![3,4].includes(obj.version)||typeof obj.sha256!=='string'||await digest(JSON.stringify(obj.data))!==obj.sha256)throw Error('Backup checksum does not match.');
  data=obj.data;legacy=false;
  if(obj.version===4||obj.trainingExtension!==undefined||obj.trainingExtensionSHA256!==undefined){if(!obj.trainingExtension||typeof obj.trainingExtensionSHA256!=='string'||await digest(JSON.stringify(obj.trainingExtension))!==obj.trainingExtensionSHA256)throw Error('Training extension checksum is missing or invalid.');trainingExtension=trainingData().validate(obj.trainingExtension,data);}
  if(obj.coachMemory!==undefined||obj.coachMemorySHA256!==undefined){
   extension=obj.coachMemory;
   if(!extension||extension.version!==1||typeof extension.included!=='boolean'||typeof obj.coachMemorySHA256!=='string'||await digest(JSON.stringify(extension))!==obj.coachMemorySHA256)throw Error('COACH memory checksum does not match.');
   const p=validatePrivacy(extension.privacy);
   if(extension.state!==null)exactState(extension.state);
   if(!extension.included&&extension.state!==null)throw Error('Unselected memory cannot be restored.');
   extension={version:1,included:extension.included,state:extension.state===null?null:exactState(extension.state),privacy:p};
  }
 }
 if(!data||validate(data)!==true)throw Error('Backup records failed field validation.');
 return {data,coachMemory:extension,trainingExtension,legacy};
}
function restorePlan(storage,parsed,restoreMemory=false){
 const local=privacy(storage),imported=parsed.coachMemory?.privacy||{version:1,epoch:null,deletedReflectionIds:[]};
 const merged=validatePrivacy({version:1,epoch:local.epoch||imported.epoch,deletedReflectionIds:[...new Set([...local.deletedReflectionIds,...imported.deletedReflectionIds])]});
 const staleMemory=!!local.epoch&&parsed.coachMemory?.privacy.epoch!==local.epoch;
 const data=filteredData(parsed.data,merged);
 return {data,privacy:merged,memorySelected:restoreMemory===true&&parsed.coachMemory?.included===true,memoryAllowed:restoreMemory===true&&parsed.coachMemory?.included===true&&!staleMemory,memoryBlocked:restoreMemory===true&&parsed.coachMemory?.included===true&&staleMemory,excludedReflections:(parsed.data.coachSessions||[]).length-data.coachSessions.length,legacy:parsed.legacy};
}
function writeRaw(storage,key,value){if(value===null)storage.removeItem(key);else storage.setItem(key,value);}
function restoreDiff(storage,app,parsed){
 if(storage.getItem(JOURNAL_KEY))throw Error('Recover the interrupted restore before previewing another backup.');
 const current=app.snapshot(),raw=storage.getItem(KEY),state=raw?exactState(JSON.parse(raw)):initial(),base=restorePlan(storage,parsed,true),incoming=parsed.coachMemory?.state||initial(),items=[];
 const add=(id,kind,before,after,blocked=false)=>{if(JSON.stringify(before)!==JSON.stringify(after))items.push({id,kind,before,after,blocked});};
 if(parsed.coachMemory?.included){
  add('policy','memory-settings',state.policy,incoming.policy,base.memoryBlocked);
  add('notes','memory-note',state.notes,incoming.notes,base.memoryBlocked);
  for(let i=0;i<Math.max(state.messages.length,incoming.messages.length);i++)add('message:'+i,'conversation',state.messages[i]||null,incoming.messages[i]||null,base.memoryBlocked);
 }
 if(parsed.trainingExtension){const local=trainingData().snapshot(storage);for(const key of trainingData().KEYS)add('training:'+key,'training-extension',local.values[key],parsed.trainingExtension.values[key]);}
 const prior=filteredData(current,base.privacy).coachSessions,next=base.data.coachSessions;
 for(const rows of [prior,next])if(new Set(rows.map(x=>x.id)).size!==rows.length)throw Error('Duplicate reflection IDs prevent a safe item preview.');
 const a=new Map(prior.map(x=>[x.id,x])),b=new Map(next.map(x=>[x.id,x]));
 for(const id of new Set([...a.keys(),...b.keys()]))add('reflection:'+id,'adapt-reflection',a.get(id)||null,b.get(id)||null);
 return {items,token:JSON.stringify([current,raw,storage.getItem(PRIVACY_KEY),trainingData().raw(storage),parsed]),localDeletionHistoryAvailable:!!privacy(storage).epoch,memoryBlocked:base.memoryBlocked,excludedReflections:base.excludedReflections};
}
function selectedRestorePlan(storage,app,parsed,selection,restoreMemory){
 const diff=restoreDiff(storage,app,parsed);
 if(!selection||selection.previewToken!==diff.token||!Array.isArray(selection.ids)||new Set(selection.ids).size!==selection.ids.length)throw Error('Local records or the backup changed. Validate and review the differences again.');
 const byId=new Map(diff.items.map(x=>[x.id,x]));
 for(const id of selection.ids){const item=byId.get(id);if(!item||item.blocked||!['adapt-reflection','training-extension'].includes(item.kind)&&!restoreMemory)throw Error('An item is unavailable or lacks COACH memory consent.');}
 const plan=restorePlan(storage,parsed,restoreMemory);plan.trainingValues=trainingData().raw(storage);for(const item of diff.items)if(item.kind==='training-extension'&&selection.ids.includes(item.id)){const key=item.id.slice(9);plan.trainingValues[key]=item.after===null?null:JSON.stringify(item.after);}
 const raw=storage.getItem(KEY),old=raw?exactState(JSON.parse(raw)):initial(),next=JSON.parse(JSON.stringify(old));
 const chosen=new Set(selection.ids),incoming=parsed.coachMemory?.state||initial();
 if(chosen.has('policy'))next.policy=policy(incoming.policy);
 if(chosen.has('notes')){next.notes=incoming.notes;if(next.notes)next.policy.retainNotes=true;}
 const slots=old.messages.slice();
 for(const item of diff.items)if(item.kind==='conversation'&&chosen.has(item.id)){const index=Number(item.id.slice(8));slots[index]=item.after;if(item.after)next.policy.retainHistory=true;}
 next.messages=slots.filter(Boolean);exactState(next);
 const current=app.snapshot(),sessions=filteredData(current,plan.privacy).coachSessions.slice(),deleted=[];
 for(const item of diff.items)if(item.kind==='adapt-reflection'&&chosen.has(item.id)){
  const id=item.id.slice(11),index=sessions.findIndex(x=>x.id===id);
  if(item.after){if(index<0)sessions.push(item.after);else sessions[index]=item.after;}
  else {if(index>=0)sessions.splice(index,1);deleted.push(id);}
 }
 if(sessions.length>50)throw Error('Selected reflections exceed the 50-item limit. No data was changed.');
 const memoryChanged=JSON.stringify(old)!==JSON.stringify(next);
 if(deleted.length||memoryChanged&&(old.notes&&old.notes!==next.notes||old.messages.some(m=>!next.messages.some(n=>n.role===m.role&&n.content===m.content))))plan.privacy.epoch=crypto.randomUUID();
 plan.privacy=validatePrivacy({...plan.privacy,deletedReflectionIds:[...new Set([...plan.privacy.deletedReflectionIds,...deleted])]});
 plan.data={...plan.data,coachSessions:sessions};plan.memoryState=next;plan.memoryAllowed=memoryChanged;plan.selectedItems=chosen.size;
 return plan;
}
function recoverPending(storage,app){
 const raw=storage.getItem(JOURNAL_KEY);if(!raw)return false;
 const before=JSON.parse(raw);if(![1,2].includes(before.version)||app.validate(before.data)!==true||!(before.memory===null||typeof before.memory==='string')||!(before.privacy===null||typeof before.privacy==='string'))throw Error('Pending recovery cannot be validated.');
 if(before.version===2)trainingData().writeRaw(storage,before.trainingValues);writeRaw(storage,KEY,before.memory);writeRaw(storage,PRIVACY_KEY,before.privacy);app.restore(before.data);storage.removeItem(JOURNAL_KEY);return true;
}
function applyBackup(storage,app,parsed,{restoreMemory=false,selection}={}){
 if(storage.getItem(JOURNAL_KEY))throw Error('A previous restore needs recovery first.');
 const plan=selection?selectedRestorePlan(storage,app,parsed,selection,restoreMemory):restorePlan(storage,parsed,restoreMemory);if(app.validate(plan.data)!==true)throw Error('Backup records failed validation.');
 if(parsed.trainingExtension&&!selection)throw Error('Review and explicitly select training extension differences before restoring.');if(plan.trainingValues){const extension={version:1,values:Object.fromEntries(Object.entries(plan.trainingValues).map(([k,v])=>[k,v===null?null:JSON.parse(v)]))};trainingData().validate(extension,plan.data);}
 const before={version:2,data:app.snapshot(),memory:storage.getItem(KEY),privacy:storage.getItem(PRIVACY_KEY),trainingValues:trainingData().raw(storage)};
 storage.setItem(JOURNAL_KEY,JSON.stringify(before));
 try{
  if(plan.memoryAllowed)writeRaw(storage,KEY,plan.memoryState?JSON.stringify(exactState(plan.memoryState)):parsed.coachMemory.state===null?null:JSON.stringify(exactState(parsed.coachMemory.state)));
  if(plan.trainingValues)trainingData().writeRaw(storage,plan.trainingValues);storage.setItem(PRIVACY_KEY,JSON.stringify(plan.privacy));app.restore(plan.data);storage.removeItem(JOURNAL_KEY);
  return {restored:true,memoryRestored:plan.memoryAllowed,memoryBlocked:plan.memoryBlocked,excludedReflections:plan.excludedReflections};
 }catch{
  try{recoverPending(storage,app)}catch{throw Error('Restore stopped. Recovery data is retained; use Recover previous local state before another restore.');}
  throw Error('Restore stopped and previous records and memory were recovered.');
 }
}
function deleteReflection(storage,app,id){
 const before=storage.getItem(PRIVACY_KEY),data=app.snapshot();if(!(data.coachSessions||[]).some(x=>x.id===id))return;
 markDeletion(storage,id);
 try{app.restore({...data,coachSessions:data.coachSessions.filter(x=>x.id!==id)})}catch(e){writeRaw(storage,PRIVACY_KEY,before);throw e}
}
return Object.freeze({KEY,PRIVACY_KEY,JOURNAL_KEY,SCOPES,policy,messages,initial,read,save,clear,records,memory,sanitizeRecords,sanitizeMemory,reflections,makeBackup,parseBackup,restorePlan,restoreDiff,applyBackup,recoverPending,deleteReflection});
});

