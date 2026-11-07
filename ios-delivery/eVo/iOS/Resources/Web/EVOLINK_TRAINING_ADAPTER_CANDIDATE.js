/* EVOLINK TRAINING -> COACH/ADAPT context adapter; read-only */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EVOLINK_TRAINING_ADAPTER=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const valid=x=>x!==''&&x!==null&&x!==undefined&&Number.isFinite(Number(x))&&Number(x)>=0&&Number(x)<=10;
function build(records,form={}){
 const rows=Array.isArray(records)?records:[];
 const last=[...rows].reverse().find(x=>x&&Array.isArray(x.setDetails))||null;
 const sets=(last?.setDetails||[]).filter(x=>x&&valid(x.rir)).map(x=>({rir:String(x.rir)}));
 const target=valid(form.targetRir)?Number(form.targetRir):undefined;
 const pain=form.pain==='yes'?true:false;
 const painUnknown=form.pain!=='yes'&&form.pain!=='no';
 const recovery=['good','normal','poor'].includes(form.recovery)?form.recovery:undefined;
 return {sets,targetRir:target,recovery,pain,painUnknown,feeling:form.feeling||'unsure',choice:form.choice||null,words:form.words||'',recordCount:rows.length,source:'evolink_training_v2',lastRecord: last?{date:last.date??null,setCount:last.setDetails.length}:null};
}
return Object.freeze({build});
});
