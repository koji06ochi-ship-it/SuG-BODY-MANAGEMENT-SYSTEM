(()=>{'use strict';
const WALLET_KEY='sug_points_v1',POM_KEY='sug_pom_v1',BUDGET_KEY='sug_points_budget_v1';
const now=()=>new Date();
const dayKey=(d=now())=>{const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
const monthKey=(d=now())=>dayKey(d).slice(0,7);
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function wallet(){const w=read(WALLET_KEY,{balance:0,lifetime:0,events:[]});w.events=Array.isArray(w.events)?w.events:[];w.balance=Number(w.balance||0);w.lifetime=Number(w.lifetime||0);return w}
function budget(){const b=read(BUDGET_KEY,null);if(b&&b.month===monthKey())return b;const x={month:monthKey(),maxCostYen:20000,usedCostYen:0};write(BUDGET_KEY,x);return x}
function award({id,points,category,label,meta}){points=Math.max(0,Math.round(Number(points)||0));if(!id||!points)return {ok:false,reason:'INVALID'};const w=wallet();if(w.events.some(e=>e.id===id))return {ok:false,reason:'DUPLICATE',wallet:w};const e={id,points,category:category||'ACTION',label:label||'',meta:meta||null,at:new Date().toISOString(),day:dayKey(),month:monthKey()};w.events.unshift(e);w.events=w.events.slice(0,500);w.balance+=points;w.lifetime+=points;write(WALLET_KEY,w);window.dispatchEvent(new CustomEvent('sug:points-change',{detail:{wallet:w,event:e}}));return {ok:true,wallet:w,event:e}}
function walkState(){return read('sug_walk_quest_v1',null)}
function syncWalk(){const s=walkState();if(!s||s.date!==dayKey())return;const steps=Number(s.steps||0);[[5000,100],[8000,100],[10000,100]].forEach(([goal,pt])=>{if(steps>=goal)award({id:`walk:steps:${dayKey()}:${goal}`,points:pt,category:'ACTION',label:`WALK ${goal.toLocaleString()}歩達成`,meta:{steps,goal}})});if(Number(s.points||0)>0)award({id:`walk:quest:${dayKey()}:${Number(s.points||0)}`,points:Number(s.points||0),category:'GOAL',label:'WALK QUEST達成',meta:{questPoints:Number(s.points||0)}})}
function trainingLogs(){return read('sug_body_training_log_v1',[])}
function syncTraining(){const logs=trainingLogs();const today=logs.find(x=>x.date===dayKey());if(!today)return;award({id:`training:done:${dayKey()}`,points:200,category:'ACTION',label:'トレーニング実施',meta:{items:today.items?.length||0}});(today.items||[]).forEach(cur=>{if(!cur.e1rm)return;let prev=null;for(const l of logs){if(l.date===today.date)continue;const x=(l.items||[]).find(i=>i.name===cur.name&&Number(i.e1rm)>0);if(x){prev=x;break}}if(prev&&Number(cur.e1rm)>Number(prev.e1rm))award({id:`training:e1rm:${dayKey()}:${cur.name}`,points:300,category:'PROGRESS',label:`${cur.name} e1RM更新`,meta:{from:prev.e1rm,to:cur.e1rm}})})}
function pom(){return read(POM_KEY,{records:[]})}
function recordPom(type,value,goal){type=String(type||'').trim();value=Number(value);goal=Number(goal);if(!type||!Number.isFinite(value))return {ok:false,reason:'INVALID'};const p=pom();p.records=Array.isArray(p.records)?p.records:[];const prev=[...p.records].reverse().find(r=>r.type===type);const rec={type,value,goal:Number.isFinite(goal)?goal:null,at:new Date().toISOString(),day:dayKey()};p.records.push(rec);p.records=p.records.slice(-200);write(POM_KEY,p);let earned=0;if(!prev||value>Number(prev.value)){const r=award({id:`pom:pr:${dayKey()}:${type}:${value}`,points:150,category:'PROGRESS',label:`POM ${type} 自己ベスト`,meta:{value,prev:prev?.value??null}});if(r.ok)earned+=150}if(Number.isFinite(goal)&&value>=goal){const r=award({id:`pom:goal:${type}:${goal}`,points:500,category:'GOAL',label:`POM ${type} 目標達成`,meta:{value,goal}});if(r.ok)earned+=500}return {ok:true,earned,record:rec}}
function addAction(id,label,points=100,meta){return award({id,points,category:'ACTION',label,meta})}
function sync(){syncWalk();syncTraining();return wallet()}
window.SuGPointsV2716={wallet,budget,award,addAction,sync,recordPom,pom,dayKey,monthKey,config:{rewardBudgetYen:20000}};
setTimeout(sync,0);
})();