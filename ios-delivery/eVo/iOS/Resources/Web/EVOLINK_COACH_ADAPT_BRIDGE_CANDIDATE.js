/* EVOLINK COACH ↔ ADAPT isolated bridge; read-only and no network. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./EVOLINK_ADAPT_PSYCHOLOGY_CANDIDATE.js'):root.EVOLINK_ADAPT_PSYCHOLOGY);if(typeof module==='object'&&module.exports)module.exports=api;else root.EVOLINK_COACH_ADAPT_BRIDGE=api;})(typeof globalThis!=='undefined'?globalThis:this,function(psychology){
'use strict';
function build(input={}){
 const data={sets:Array.isArray(input.sets)?input.sets:[],targetRir:input.targetRir,recovery:input.recovery,pain:input.pain===true,painUnknown:input.painUnknown===true,feeling:input.feeling,choice:input.choice,words:input.words};
 const p=psychology.plan(data);
 const warning=p.physical.status==='caution';
 const options=warning?p.dialogue.options:p.dialogue.options;
 return Object.freeze({coach:{opening:p.dialogue.opening,question:p.dialogue.question,options,mode:'rule_based'},adapt:{status:p.physical.status,direction:p.physical.direction,reasons:p.physical.reasons,options:p.physical.options,meanRir:p.physical.meanRir??null},reflection:p.reflection,principle:p.principle,automaticallyApplied:false,generativeAIConnected:false});
}
return Object.freeze({build});
});
