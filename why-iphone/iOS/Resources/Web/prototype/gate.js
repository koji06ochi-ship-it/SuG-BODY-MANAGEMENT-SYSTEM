(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.WHYGate=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const copy=x=>JSON.parse(JSON.stringify(x)),ensure=(v,m)=>{if(!v)throw Error(m);};
const previewRegistry=new Map();let previewSequence=0;
const owners=["guest","demo-a","demo-b"],scopes=["turn-text","history","values","hypotheses"];
function owner(id){ensure(owners.includes(id),"Unknown local owner");return id;}
function auth(ownerId){owner(ownerId);return{ownerId,status:ownerId==="guest"?"unauthenticated":"demo-authenticated",realAuthenticated:false};}
function makePreview({ownerId,revision,text,history=[],confirmed=[],hypotheses=[],categories=[],modelId,modelVersion}){
 owner(ownerId);ensure(typeof text==="string"&&text.trim().length>0&&text.length<=2000,"確認する入力を1〜2000文字で記入してください。");
 ensure(Number.isInteger(revision)&&revision>=0,"Invalid revision");ensure(categories.every(x=>scopes.includes(x)),"Unknown scope");
 const data={current:categories.includes("turn-text")?{text,source:"user-input",confirmedExternally:false}:null,
 history:categories.includes("history")?history.filter(x=>x.status==="current").slice(-6).map(x=>({id:x.id,role:x.role,text:x.text,source:x.source})):[],
 confirmed:categories.includes("values")?confirmed.filter(x=>x.userConfirmed===true&&x.status==="current").map(x=>({id:x.id,text:x.text,source:"user-confirmed-report",confirmedExternally:false})):[],
 hypotheses:categories.includes("hypotheses")?hypotheses.filter(x=>x.status!=="withdrawn"&&x.status!=="rejected").map(x=>({id:x.id,description:x.description,evidenceMessageIds:x.evidenceMessageIds,trust:"unconfirmed"})):[],externalRecords:[]};
 const p={kind:"offline-preview",ownerId,revision,modelId,modelVersion,categories:[...categories],data,networkEnabled:false};
 const binding="offline-preview:"+ownerId+":"+revision+":"+(++previewSequence);previewRegistry.set(binding,JSON.stringify(p));if(previewRegistry.size>32)previewRegistry.delete(previewRegistry.keys().next().value);return{...p,binding};
}
function consent(preview,decision,now=Date.now()){
 ensure(["grant","refuse"].includes(decision),"Invalid decision");
 if(decision==="grant")ensure(preview.categories.includes("turn-text")&&preview.data.current,"今回の入力を含めない同意は作成できません。");
 return{kind:"simulation-consent",ownerId:preview.ownerId,binding:preview.binding,revision:preview.revision,modelId:preview.modelId,modelVersion:preview.modelVersion,categories:preview.categories,status:decision==="grant"?"granted":"refused",issuedAt:now,expiresAt:now+15*60*1000,realTransmissionConsent:false};
}
function revoke(c,now=Date.now()){if(c)previewRegistry.delete(c.binding);return c?{...copy(c),status:"revoked",revokedAt:now}:null;}
function validConsent(c,p,now=Date.now()){const base=copy(p);delete base.binding;return previewRegistry.get(p.binding)===JSON.stringify(base)&&!!c&&c.status==="granted"&&c.kind==="simulation-consent"&&c.ownerId===p.ownerId&&c.binding===p.binding&&c.expiresAt>now;}
function defaultModels(){return[
{id:"unset",label:"未設定（試算できません）",version:1,currency:"JPY",inputPerMillion:null,outputPerMillion:null,priceStatus:"unconfirmed",providerApproved:false},
{id:"trial-a",label:"試算A（架空単価）",version:1,currency:"JPY",inputPerMillion:1000,outputPerMillion:4000,priceStatus:"illustrative",providerApproved:false},
{id:"trial-b",label:"試算B（架空単価）",version:1,currency:"JPY",inputPerMillion:500,outputPerMillion:1500,priceStatus:"illustrative",providerApproved:false}
];}
function configureModel(model,{inputPerMillion,outputPerMillion}){
 for(const n of [inputPerMillion,outputPerMillion])ensure(Number.isSafeInteger(n)&&n>=0&&n<=1000000,"単価は0〜1000000の整数で指定してください。");
 return{...model,inputPerMillion,outputPerMillion,version:model.version+1,priceStatus:"user-unverified"};
}
function estimate(model,stages){
 ensure(model&&[model.inputPerMillion,model.outputPerMillion].every(n=>Number.isSafeInteger(n)&&n>=0),"単価未設定のため試算できません。");
 ensure(Array.isArray(stages)&&stages.length>0&&stages.length<=3,"最大3段階");
 const t=stages.reduce((a,s)=>{ensure(Number.isSafeInteger(s.input)&&s.input>=0&&s.input<=100000&&Number.isSafeInteger(s.output)&&s.output>=0&&s.output<=100000,"トークン数が不正です。");a.input+=s.input;a.output+=s.output;return a;},{input:0,output:0});
 const micros=t.input*model.inputPerMillion+t.output*model.outputPerMillion;ensure(Number.isSafeInteger(micros),"費用上限超過");
 return{inputTokens:t.input,outputTokens:t.output,micros,amount:micros/1000000,currency:model.currency,modelId:model.id,modelVersion:model.version,priceStatus:model.priceStatus,realBill:false,tokenCountKind:"manually-entered-upper-bound"};
}
function newLedger(ownerId,limits={turn:12000000,day:23000000,month:230000000}){owner(ownerId);return{ownerId,currency:"JPY",limits:copy(limits),entries:[],version:0};}
function periods(now){const d=new Date(now+9*60*60*1000);ensure(Number.isFinite(d.getTime()),"日時が不正");return{day:d.toISOString().slice(0,10),month:d.toISOString().slice(0,7)};}
function totals(l,now=Date.now()){
 const p=periods(now),active=l.entries.filter(e=>e.status==="reserved"||e.status==="settled");
 return{day:active.filter(e=>e.day===p.day).reduce((a,e)=>a+(e.status==="reserved"?e.reserved:e.actual),0),month:active.filter(e=>e.month===p.month).reduce((a,e)=>a+(e.status==="reserved"?e.reserved:e.actual),0),actual:l.entries.filter(e=>e.status==="settled").reduce((a,e)=>a+e.actual,0)};
}
function setLimits(l,limits,now=Date.now()){
 ensure(["turn","day","month"].every(k=>Number.isSafeInteger(limits[k])&&limits[k]>=0),"予算上限は0以上の整数単位で指定してください。");
 const t=totals(l,now);ensure(t.day<=limits.day&&t.month<=limits.month,"予約・精算済みの額を下回る上限には変更できません。");
 const activeMax=Math.max(0,...l.entries.filter(e=>e.status==="reserved").map(e=>e.reserved));ensure(activeMax<=limits.turn,"予約済みのターン上限を下回れません。");
 return{...copy(l),limits:copy(limits),version:l.version+1};
}
function reserve(l,{id,ownerId,quote,authState,consentRecord,preview,now=Date.now()}){
 ensure(ownerId===l.ownerId&&ownerId===preview.ownerId&&authState.ownerId===ownerId,"Owner mismatch");
 ensure(authState.status==="demo-authenticated"&&!authState.realAuthenticated,"試作内の利用者AまたはBを選んでください。本番認証ではありません。");
 ensure(validConsent(consentRecord,preview,now),"有効な試作内同意がありません。入力や範囲の変更後は再確認してください。");
 ensure(quote.modelId===preview.modelId&&quote.modelVersion===preview.modelVersion,"Model/version mismatch");
 ensure(Number.isSafeInteger(quote.micros)&&quote.micros>=0&&quote.realBill===false,"不正な試算");
 ensure(typeof id==="string"&&id.length>0,"Reservation ID required");
 const old=l.entries.find(e=>e.id===id);
 if(old){ensure(old.binding===preview.binding&&old.reserved===quote.micros,"Idempotency conflict");return{ledger:copy(l),entry:copy(old),idempotent:true};}
 const t=totals(l,now),cost=quote.micros;
 ensure(cost<=l.limits.turn&&t.day+cost<=l.limits.day&&t.month+cost<=l.limits.month,"予算上限に達しました。通信は行いません。");
 const p=periods(now),entry={id,ownerId,binding:preview.binding,modelId:quote.modelId,modelVersion:quote.modelVersion,priceStatus:quote.priceStatus,reserved:cost,actual:null,status:"reserved",day:p.day,month:p.month,createdAt:now,realBill:false};
 const n=copy(l);n.entries.push(entry);n.version++;return{ledger:n,entry:copy(entry),idempotent:false};
}
function settle(l,id,actual,{neverSent=false}={}){
 ensure(Number.isSafeInteger(actual)&&actual>=0,"Invalid actual");const n=copy(l),e=n.entries.find(x=>x.id===id);ensure(e,"Missing reservation");
 if(e.status==="settled"){ensure(e.actual===actual,"Settlement conflict");return n;}
 ensure(e.status==="reserved"&&actual<=e.reserved,"Invalid settlement");
 ensure(neverSent&&actual===0,"この試作では未送信・実費0だけを精算できます。");
 e.status="settled";e.actual=0;e.settledAt=Date.now();n.version++;return n;
}
function release(l,id,{neverSent=false}={}){
 ensure(neverSent,"未送信を確認できない枠は解放できません。");const n=copy(l),e=n.entries.find(x=>x.id===id);ensure(e,"Missing reservation");
 if(e.status==="released")return n;ensure(e.status==="reserved","Reservation not active");e.status="released";e.actual=0;n.version++;return n;
}
function offlineStore(getStorage,key,value){try{getStorage().setItem(key,JSON.stringify(value));return{ok:true};}catch(e){return{ok:false,code:e.name||"StorageError",retainedInMemory:true};}}

function restoreLedger(raw,ownerId){
 try{
 const l=JSON.parse(raw);ensure(l&&Object.keys(l).every(k=>["ownerId","currency","limits","entries","version"].includes(k)),"ledger fields");
 ensure(l.ownerId===owner(ownerId)&&l.currency==="JPY","ledger owner/currency");
 ensure(Number.isSafeInteger(l.version)&&l.version>=0&&Array.isArray(l.entries)&&l.entries.length<=1000,"ledger shape");
 ensure(Object.keys(l.limits).length===3&&["turn","day","month"].every(k=>Number.isSafeInteger(l.limits[k])&&l.limits[k]>=0),"limits");
 const ids=new Set();for(const e of l.entries){
 ensure(Object.keys(e).every(k=>["id","ownerId","binding","modelId","modelVersion","priceStatus","reserved","actual","status","day","month","createdAt","realBill","settledAt"].includes(k)),"unexpected entry fields");
 ensure(e.ownerId===ownerId&&typeof e.id==="string"&&!ids.has(e.id),"entry owner/id");ids.add(e.id);
 ensure(["reserved","settled","released"].includes(e.status)&&e.realBill===false&&typeof e.binding==="string"&&e.binding.startsWith("offline-preview:"+ownerId+":"),"entry status");
 ensure(Number.isSafeInteger(e.reserved)&&e.reserved>=0&&(e.actual===null||e.actual===0),"entry amount");
 ensure(e.status==="reserved"?e.actual===null:e.actual===0,"status/amount mismatch");
 ensure(/^\d{4}-\d{2}-\d{2}$/.test(e.day)&&/^\d{4}-\d{2}$/.test(e.month),"period");
 }return{ok:true,ledger:l};}catch(e){return{ok:false,error:"試算台帳を復元できません。現在の画面内データを保持します。",reason:e.message};}
}
function productionGate(){return{allowed:false,reasons:["real-provider-unapproved","real-authentication-not-implemented","real-prices-unconfirmed","real-transmission-consent-not-collected","transport-not-implemented"],callsMade:0};}
class LocalLedger{
 constructor(state){this.state=copy(state);}
 reserve(request){const r=reserve(this.state,request);this.state=r.ledger;return r;}
}
return{copy,owner,auth,makePreview,consent,revoke,validConsent,defaultModels,configureModel,estimate,newLedger,totals,setLimits,reserve,settle,release,offlineStore,restoreLedger,productionGate,LocalLedger};
});

