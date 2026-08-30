(()=>{'use strict';
const KEY='sug_rewards_v1';
const CATALOG=[
{id:'meal100',name:'提携飲食店 100円OFF',points:600,costYen:100,kind:'FOOD',note:'提携店決定後に利用店舗を表示'},
{id:'bath100',name:'提携銭湯 100円OFF',points:600,costYen:100,kind:'BATH',note:'提携施設決定後に利用施設を表示'},
{id:'meal300',name:'提携飲食店 300円OFF',points:1600,costYen:300,kind:'FOOD',note:'栄養おすすめ店舗との連携用'},
{id:'stamp',name:'S.u.G LINEスタンプ',points:1200,costYen:0,kind:'DIGITAL',note:'配布方式・実費確定後に原価設定'},
{id:'quest',name:'QUEST 限定アイテム',points:500,costYen:0,kind:'QUEST',note:'デジタル特典'}
];
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){const s=read(KEY,{redemptions:[]});s.redemptions=Array.isArray(s.redemptions)?s.redemptions:[];return s}
function catalog(){return CATALOG.map(x=>({...x}))}
function redeem(id){const api=window.SuGPointsV2716;if(!api)return {ok:false,reason:'POINTS_NOT_READY'};const item=CATALOG.find(x=>x.id===id);if(!item)return {ok:false,reason:'NOT_FOUND'};const w=api.wallet(),b=api.budget();if(Number(w.balance||0)<item.points)return {ok:false,reason:'POINTS_LOW'};if(Number(b.usedCostYen||0)+item.costYen>Number(b.maxCostYen||20000))return {ok:false,reason:'MONTHLY_BUDGET'};
const s=state(),code=`SUG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
w.balance-=item.points;w.events.unshift({id:`redeem:${code}`,points:-item.points,category:'REDEEM',label:item.name,meta:{rewardId:item.id,costYen:item.costYen,code},at:new Date().toISOString(),day:api.dayKey(),month:api.monthKey()});localStorage.setItem('sug_points_v1',JSON.stringify(w));b.usedCostYen=Number(b.usedCostYen||0)+item.costYen;localStorage.setItem('sug_points_budget_v1',JSON.stringify(b));const r={code,rewardId:item.id,name:item.name,points:item.points,costYen:item.costYen,status:'ISSUED',at:new Date().toISOString(),month:api.monthKey()};s.redemptions.unshift(r);s.redemptions=s.redemptions.slice(0,100);write(KEY,s);window.dispatchEvent(new CustomEvent('sug:points-change',{detail:{wallet:w,redemption:r}}));return {ok:true,redemption:r,wallet:w,budget:b}}
window.SuGRewardsV2717={catalog,state,redeem};
})();