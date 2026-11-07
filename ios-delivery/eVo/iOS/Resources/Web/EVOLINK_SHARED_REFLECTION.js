(function(root,factory){const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;else root.EVOLINK_SHARED=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';const KEY='evolink_coach_adapt_reflection_v1';
function normalize(x={}){return {feeling:['frustrated','anxious','confident','neutral','unsure'].includes(x.feeling)?x.feeling:'unsure',words:typeof x.words==='string'?x.words.slice(0,600):'',choice:['continue','adjust','rest','unsure'].includes(x.choice)?x.choice:'unsure',reflection:typeof x.reflection==='string'?x.reflection.slice(0,600):'',targetRir:x.targetRir===''||x.targetRir==null?'':Number.isInteger(+x.targetRir)&&+x.targetRir>=0&&+x.targetRir<=10?String(x.targetRir):'',recovery:['good','normal','poor'].includes(x.recovery)?x.recovery:'',pain:['yes','no'].includes(x.pain)?x.pain:'unknown'};}
function read(storage){try{return normalize(JSON.parse(storage.getItem(KEY)||'{}'))}catch{return normalize()}}
function save(storage,data,consent){if(consent!==true)return {saved:false,reason:'consent_required'};storage.setItem(KEY,JSON.stringify(normalize(data)));return {saved:true}}
function clear(storage){storage.removeItem(KEY)}
return Object.freeze({KEY,normalize,read,save,clear});
});