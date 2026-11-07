(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.WHYContracts=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const domains=Array.from({length:10},(_,i)=>"P"+String(i+1).padStart(2,"0"));
const modes=["answer","clarify","listen","compare","plan","reflect","hold","end","safety","acknowledge-correction","respect-refusal","revisit-purpose"];
const controls=["none","correct","refuse-question","refuse-advice","end","purpose-change","no-action","concise","safety"];
const topics=["adaptation","overload","rir-fatigue","programming","energy","nutrition","recovery","beliefs"];
const ensure=(v,m)=>{if(!v)throw Error(m);},clone=x=>JSON.parse(JSON.stringify(x));
function object(x,keys){ensure(x&&typeof x==="object"&&!Array.isArray(x),"object");ensure(Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k)),"fields");}
function text(x,max=2000){ensure(typeof x==="string"&&x.length>0&&x.length<=max,"text");}
function evidence(e,messages){
 object(e,["messageId","start","end","quote"]);const m=messages.find(x=>x.id===e.messageId&&x.status==="current"&&x.role==="user");ensure(m,"evidence-not-current-user");
 ensure(Number.isInteger(e.start)&&Number.isInteger(e.end)&&e.start>=0&&e.end>e.start&&e.end<=m.text.length,"span-range");
 ensure(m.text.slice(e.start,e.end)===e.quote,"span-quote-mismatch");return e;
}
function validateInterpretation(value,{turnId,messages}){
 const errors=[];try{
 object(value,["turnId","observations","hypotheses","unknowns","control","risk","knowledgeRequests"]);
 ensure(value.turnId===turnId,"turn-id");
 ensure(Array.isArray(value.observations)&&value.observations.length<=20,"observations");
 for(const x of value.observations){object(x,["kind","subject","time","evidence"]);ensure(["fact","feeling","value","interpretation","prediction","unknown"].includes(x.kind),"kind");ensure(["self","other","unknown"].includes(x.subject),"subject");ensure(["past","current","future","unknown"].includes(x.time),"time");evidence(x.evidence,messages);}
 ensure(Array.isArray(value.hypotheses)&&value.hypotheses.length<=6,"hypotheses");
 for(const h of value.hypotheses){object(h,["id","description","domainIds","evidence","status"]);text(h.id,100);text(h.description,500);ensure(["candidate","checking","unresolved"].includes(h.status),"hypothesis-not-fact");ensure(Array.isArray(h.domainIds)&&h.domainIds.length>0&&h.domainIds.every(x=>domains.includes(x)),"domains");ensure(Array.isArray(h.evidence)&&h.evidence.length>0,"hypothesis-evidence");h.evidence.forEach(e=>evidence(e,messages));}
 ensure(Array.isArray(value.unknowns)&&value.unknowns.length<=6,"unknowns");for(const u of value.unknowns){object(u,["questionReason","expectedDifference"]);text(u.questionReason,200);text(u.expectedDifference,300);}
 object(value.control,["type","evidence"]);ensure(controls.includes(value.control.type),"control");if(value.control.type!=="none")evidence(value.control.evidence,messages);else ensure(value.control.evidence===null,"none-evidence");
 object(value.risk,["needsReview","evidence"]);ensure(typeof value.risk.needsReview==="boolean"&&Array.isArray(value.risk.evidence),"risk");value.risk.evidence.forEach(e=>evidence(e,messages));if(value.risk.needsReview)ensure(value.risk.evidence.length>0,"risk-evidence-required");
 ensure(Array.isArray(value.knowledgeRequests)&&value.knowledgeRequests.length<=8,"knowledgeRequests");
 for(const q of value.knowledgeRequests){object(q,["topic","purpose"]);ensure(topics.includes(q.topic),"topic");ensure(["definition","comparison","safety","personal-guidance"].includes(q.purpose),"knowledge-purpose");}
 }catch(e){errors.push(e.message);}
 return{ok:!errors.length,errors,meaningVerified:false};
}
function resolveKnowledge(catalogue,requests,{now=Date.now(),ageGroup="unknown",symptoms=false,treatment=false,production=false}={}){
 const accepted=[],denied=[];
 for(const request of requests)for(const k of catalogue.filter(x=>x.topicId===request.topic)){
 let reason=null;
 if(Date.parse(k.reviewDue)<=now)reason="review-due";
 if(production&&!k.deploymentEligible)reason="not-expert-approved";
 if(request.purpose==="personal-guidance"&&(ageGroup!=="adult"||symptoms||treatment))reason="outside-personal-guidance-scope";
 if(reason)denied.push({id:k.id,reason});else if(!accepted.some(x=>x.id===k.id))accepted.push(clone(k));
 }
 return{accepted,denied,semanticRelevanceVerified:false};
}
function validateResponse(d,{turnId,ownerId,revision,policy,references,messageIds=[],rejectedHypothesisIds=[]}){
 const errors=[];try{
 object(d,["turnId","ownerId","revision","mode","text","questions","citations","hypotheses","proposals"]);
 ensure(d.turnId===turnId&&d.ownerId===ownerId&&d.revision===revision,"stale-or-other-owner");
 ensure(modes.includes(d.mode)&&d.mode===policy.mode,"policy-mode");text(d.text,policy.maxChars||1200);
 ensure(Array.isArray(d.questions)&&d.questions.length<=Math.min(1,policy.maxQuestions),"question-limit");
 d.questions.forEach(q=>text(q,200));ensure(Array.isArray(d.citations),"citations");if(policy.requiresKnowledge)ensure(d.citations.length>0,"knowledge-citation-required");
 for(const c of d.citations){object(c,["knowledgeId","claimId","version","responseStart","responseEnd"]);const k=references.find(k=>k.id===c.knowledgeId&&k.claimId===c.claimId&&k.version===c.version);ensure(k,"unknown-or-versioned-claim");ensure(Number.isInteger(c.responseStart)&&Number.isInteger(c.responseEnd)&&c.responseStart>=0&&c.responseEnd>c.responseStart&&c.responseEnd<=d.text.length,"response-span");}
 ensure(Array.isArray(d.hypotheses)&&d.hypotheses.length<=6,"hypotheses");
 for(const h of d.hypotheses){object(h,["id","description","domainIds","evidenceMessageIds","status"]);text(h.id,100);text(h.description,500);ensure(!rejectedHypothesisIds.includes(h.id),"rejected-hypothesis");ensure(["candidate","checking","unresolved"].includes(h.status),"not-confirmed-fact");ensure(Array.isArray(h.domainIds)&&h.domainIds.every(x=>domains.includes(x))&&h.domainIds.length>0,"domain");ensure(Array.isArray(h.evidenceMessageIds)&&h.evidenceMessageIds.length>0&&h.evidenceMessageIds.every(x=>messageIds.includes(x)),"unknown-message");}
 ensure(Array.isArray(d.proposals)&&(!d.proposals.length||policy.allowProposals===true),"unsolicited-proposal");
 for(const p of d.proposals){object(p,["id","title","status"]);text(p.id,100);text(p.title,300);ensure(p.status==="draft","only-user-selects");}
 ensure(!/https?:\/\/|必ず(痩せ|治|成功)|あなたは[^。\n]{0,20}(病です|障害です)/.test(d.text),"limited-content-guard");
 }catch(e){errors.push(e.message);}
 return{ok:!errors.length,errors,semanticSafetyVerified:false,claimEntailmentVerified:false};
}
class Turn{
 constructor({id,ownerId,revision}){this.id=id;this.ownerId=ownerId;this.revision=revision;this.stage="received";this.repairs=0;this.events=[];}
 advance(stage,payload={}){const next={received:"interpreted",interpreted:"referenced",referenced:"planned",planned:"drafted",drafted:"reviewed",reviewed:"presented"};ensure(next[this.stage]===stage,"invalid-stage-transition");if(stage==="interpreted"||stage==="reviewed")ensure(payload.ok===true,"validation-required");this.stage=stage;this.events.push({stage});return this.stage;}
 repair(){ensure(this.stage==="drafted"&&this.repairs===0,"repair-limit");this.repairs++;return"one-repair";}
 fail(reason){this.stage="failed";this.events.push({stage:"failed",reason});return{mode:"hold",text:"応答を確認できませんでした。入力を保持し、今は保留できます。",stateChanged:false};}
 cancel(){this.stage="cancelled";this.revision++;this.events.push({stage:"cancelled"});}
 acceptEnvelope(d){return !["cancelled","failed","presented"].includes(this.stage)&&d.turnId===this.id&&d.ownerId===this.ownerId&&d.revision===this.revision;}
}
function correct(state,{origin,messageId,replacement}){
 ensure(origin==="user","only-user-corrects");const s=clone(state),m=s.messages.find(x=>x.id===messageId&&x.status==="current");ensure(m,"current-message-required");m.status="superseded";s.messages.push({...clone(replacement),status:"current",replacesId:messageId});s.hypotheses=s.hypotheses.map(h=>h.evidenceMessageIds.includes(messageId)?{...h,status:"rejected"}:h);s.plans=s.plans.map(p=>({...p,needsReview:true}));s.revision++;return s;
}
function productionTransport(){return{status:"blocked",callsMade:0};}
return{domains,topics,evidence,validateInterpretation,resolveKnowledge,validateResponse,Turn,correct,productionTransport};
});

