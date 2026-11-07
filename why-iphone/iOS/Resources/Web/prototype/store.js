(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.WHYStore=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const KEY="sug-why-evidence-judgment-candidate",LIMIT=1048576,MAX=1000;
const enums={roles:["user","assistant"],messageStatus:["current","superseded","withdrawn"],types:["unclassified","user-reported-fact","feeling","value","interpretation","prediction"],planStatus:["draft","selected","held","paused","completed"],aspStatus:["undecided","exploring","confirmed"]};
function id(){return "w-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);}
function now(){return new Date().toISOString();}
function empty(){return {kind:"sug-why-prototype",schemaVersion:2,mode:"simulation",integrationState:"disconnected",preferences:{persist:false},sessions:[],messages:[],statements:[],verifiedRecords:[],hypotheses:[],aspirations:[],plans:[],experiences:[],history:[],drafts:[]};}
function clone(x){return JSON.parse(JSON.stringify(x));}
function assert(ok,msg){if(!ok)throw new Error(msg);}
function keys(o,allowed){assert(o&&typeof o==="object"&&!Array.isArray(o),"オブジェクト形式が不正です");assert(Object.keys(o).every(k=>allowed.includes(k)),"未対応の項目があります");}
function str(x,n=3000){assert(typeof x==="string"&&x.length<=n,"文字列の形式または長さが不正です");}
function bool(x){assert(typeof x==="boolean","真偽値が不正です");}
function choice(x,a){assert(a.includes(x),"状態が不正です");}
function scan(x){if(x&&typeof x==="object"){for(const k of Object.keys(x)){assert(!["__proto__","prototype","constructor"].includes(k),"危険なキーを含みます");scan(x[k]);}}}
const Drafts=typeof module==="object"&&module.exports?require("./drafts.js"):globalThis.WHYDrafts;
const defs={
drafts:{fields:["id","createdAt","kind","status","values","evidence","origin","reviewedFields","recordId","conversationId"],check:o=>Drafts.validate(o)},
sessions:{fields:["id","createdAt","status","topicId","branchId","step","adviceAllowed","rejectedTopics"],check:o=>{choice(o.status,["active","ended"]);assert(o.topicId===null||/^\d{2}$/.test(o.topicId),"話題IDが不正");assert(o.branchId===null||["A","B"].includes(o.branchId),"分岐IDが不正");assert(Number.isInteger(o.step)&&o.step>=0&&o.step<=3,"対話段階が不正");bool(o.adviceAllowed);assert(Array.isArray(o.rejectedTopics)&&o.rejectedTopics.length<=100,"拒否履歴が不正");o.rejectedTopics.forEach(x=>str(x,20));}},
messages:{fields:["id","createdAt","sessionId","role","text","status","source","replacesId"],check:o=>{choice(o.role,enums.roles);choice(o.status,enums.messageStatus);choice(o.source,["user-input","mock-template"]);str(o.text);str(o.sessionId,100);assert(o.replacesId===null||typeof o.replacesId==="string","訂正参照が不正");}},
statements:{fields:["id","createdAt","messageId","type","text","confirmed","status"],check:o=>{str(o.messageId,100);choice(o.type,enums.types);str(o.text);bool(o.confirmed);choice(o.status,["current","superseded","withdrawn"]);}},
hypotheses:{fields:["id","createdAt","sessionId","topicId","branchId","label","status","evidenceMessageIds","basis"],check:o=>{str(o.sessionId,100);str(o.topicId,20);str(o.branchId,20);str(o.label);choice(o.status,["tentative","withdrawn"]);choice(o.basis,["keyword-match-prototype"]);assert(Array.isArray(o.evidenceMessageIds)&&o.evidenceMessageIds.length<=100,"根拠が不正");o.evidenceMessageIds.forEach(x=>str(x,100));}},
aspirations:{fields:["id","createdAt","text","status","deleted"],check:o=>{str(o.text);choice(o.status,enums.aspStatus);bool(o.deleted);}},
plans:{fields:["id","createdAt","title","reason","when","where","amount","prediction","observe","stop","status","needsReview","sessionId","deleted"],check:o=>{["title","reason","when","where","amount","prediction","observe","stop"].forEach(k=>str(o[k]));choice(o.status,enums.planStatus);bool(o.needsReview);bool(o.deleted);assert(o.sessionId===null||typeof o.sessionId==="string","計画参照が不正");}},
experiences:{fields:["id","createdAt","planId","actual","observed","feeling","interpretation","insight","unknown","next","deleted"],check:o=>{["actual","observed","feeling","interpretation","insight","unknown","next"].forEach(k=>str(o[k]));assert(o.planId===null||typeof o.planId==="string","経験参照が不正");bool(o.deleted);}},
history:{fields:["id","createdAt","targetId","action","kind"],check:o=>{str(o.targetId,100);str(o.action,200);str(o.kind,100);}}
};
function validate(s){s=clone(s);if(s.schemaVersion===1){s.schemaVersion=2;s.drafts=[];}scan(s);keys(s,["kind","schemaVersion","mode","integrationState","preferences",...Object.keys(defs),"verifiedRecords"]);assert(s.kind==="sug-why-prototype"&&s.schemaVersion===2,"未対応のファイルまたはバージョンです");assert(s.mode==="simulation"&&s.integrationState==="disconnected","実データや接続状態は復元できません");keys(s.preferences,["persist"]);bool(s.preferences.persist);assert(Array.isArray(s.verifiedRecords)&&s.verifiedRecords.length===0,"外部確認記録の取込は未実装です");
const ids=new Set();for(const [group,d]of Object.entries(defs)){assert(Array.isArray(s[group])&&s[group].length<=MAX,"件数上限または配列形式が不正です");for(const o of s[group]){keys(o,d.fields);assert(d.fields.every(k=>Object.prototype.hasOwnProperty.call(o,k)),"必須項目が不足しています");str(o.id,100);str(o.createdAt,100);assert(Number.isFinite(Date.parse(o.createdAt)),"日時が不正です");assert(!ids.has(o.id),"IDが重複しています");ids.add(o.id);d.check(o);}}
const sessions=new Set(s.sessions.map(x=>x.id)),messages=new Set(s.messages.map(x=>x.id)),plans=new Set(s.plans.map(x=>x.id));
for(const m of s.messages){assert(sessions.has(m.sessionId),"会話参照がありません");if(m.replacesId!==null)assert(messages.has(m.replacesId),"訂正元がありません");}
for(const t of s.statements)assert(messages.has(t.messageId),"発言参照がありません");
for(const h of s.hypotheses){assert(sessions.has(h.sessionId),"仮説の会話参照がありません");h.evidenceMessageIds.forEach(x=>assert(messages.has(x),"仮説の根拠がありません"));}
for(const p of s.plans)if(p.sessionId!==null)assert(sessions.has(p.sessionId),"計画の会話参照がありません");
for(const e of s.experiences)if(e.planId!==null)assert(plans.has(e.planId),"経験の計画参照がありません");
return clone(s);}
function serialize(s){const text=JSON.stringify(validate(s),null,2);assert(new TextEncoder().encode(text).length<=LIMIT,"1MBの保存上限を超えています");return text;}
function parse(text){assert(typeof text==="string"&&new TextEncoder().encode(text).length<=LIMIT,"ファイルは1MB以内にしてください");let x;try{x=JSON.parse(text);}catch(e){throw new Error("JSONの形式が正しくありません");}return validate(x);}
function log(s,targetId,action,kind){s.history.push({id:id(),createdAt:now(),targetId,action,kind});}
function save(s,storage){try{storage.setItem(KEY,serialize(s));return {ok:true};}catch(e){return {ok:false,error:"保存できません。入力は画面内に残っています。JSONに書き出してください。"};}}
function load(storage){try{const raw=storage.getItem(KEY);return raw?{ok:true,state:parse(raw)}:{ok:true,state:null};}catch(e){return {ok:false,error:"保存データを自動復元できません。上書きせず、JSONからの復元を利用してください。"};}}
function revise(s,messageId,text,type){str(text);choice(type,enums.types);const old=s.messages.find(m=>m.id===messageId&&m.role==="user"&&m.status==="current");assert(old,"訂正できる発言がありません");old.status="superseded";s.statements.filter(t=>t.messageId===messageId).forEach(t=>t.status="superseded");s.hypotheses.filter(h=>h.evidenceMessageIds.includes(messageId)).forEach(h=>h.status="withdrawn");const replacement={...old,id:id(),createdAt:now(),text,status:"current",replacesId:messageId};s.messages.push(replacement);s.statements.push({id:id(),createdAt:now(),messageId:replacement.id,type,text,confirmed:type!=="unclassified",status:"current"});const se=s.sessions.find(x=>x.id===old.sessionId);if(se){se.topicId=null;se.branchId=null;se.step=0;}s.plans.filter(p=>p.sessionId===old.sessionId).forEach(p=>p.needsReview=true);log(s,messageId,"訂正。旧発言と根拠仮説を失効","message");return replacement;}
return {KEY,LIMIT,id,now,empty,clone,validate,serialize,parse,save,load,log,revise,enums};
});

