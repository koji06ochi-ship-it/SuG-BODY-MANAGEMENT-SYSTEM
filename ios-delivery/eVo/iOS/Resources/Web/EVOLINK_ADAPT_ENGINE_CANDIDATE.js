/* EVOLINK ADAPT candidate: pure decision engine, no storage writes or medical diagnosis. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EVOLINK_ADAPT=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const validRir=x=>x!==''&&x!==null&&x!==undefined&&Number.isFinite(Number(x))&&Number(x)>=0&&Number(x)<=10;
function decide(input={}){
 const sets=Array.isArray(input.sets)?input.sets:[];
 const rirs=sets.map(s=>s&&s.rir).filter(validRir).map(Number);
 const target=validRir(input.targetRir)?Number(input.targetRir):null;
 const recovery=['good','normal','poor'].includes(input.recovery)?input.recovery:null;
 const pain=input.pain===true;
 const result={status:'insufficient',direction:'review',reasons:[],options:[],automaticallyApplied:false};
 if(input.painUnknown===true){result.reasons.push('痛みの有無が未回答');result.options=['痛みの有無を確認する'];return result;}
 if(pain){result.status='caution';result.direction='review';result.reasons.push('痛みの申告あり');result.options=['負荷を増やさず状態を確認する','必要に応じて専門家に相談する'];return result;}
 if(recovery==='poor'){result.status='caution';result.direction='reduce_or_rest';result.reasons.push('回復状態が低い');result.options=['休息を選ぶ','負荷を軽くして様子を見る'];return result;}
 if(!rirs.length||target===null){result.reasons.push('RIR記録または目標RIRが不足');result.options=['セットごとのRIRと目標RIRを記録する'];return result;}
 const mean=rirs.reduce((a,b)=>a+b,0)/rirs.length;
 result.meanRir=Number(mean.toFixed(2));result.status='suggestion';
 if(mean>=target+2){result.direction='consider_increase';result.reasons.push('実測RIRが目標より2以上高い');result.options=['次回の負荷増加を検討する','現在の負荷を維持する'];}
 else if(mean<=target-2){result.direction='consider_reduce';result.reasons.push('実測RIRが目標より2以上低い');result.options=['次回の負荷軽減を検討する','休息とフォームを確認する'];}
 else{result.direction='hold';result.reasons.push('実測RIRが目標付近');result.options=['現在の負荷を維持する','次回もRIRを記録する'];}
 if(recovery===null){result.status='insufficient';result.direction='review';result.reasons.push('回復状態は未記録のため負荷増加を保留');result.options=['回復状態を確認する'];}
 return result;
}
return Object.freeze({decide,validRir});
});
