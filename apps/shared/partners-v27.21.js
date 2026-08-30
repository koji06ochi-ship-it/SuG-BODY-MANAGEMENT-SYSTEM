(()=>{'use strict';
const KEY='sug_partner_master_v1';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){const s=read(KEY,{partners:[]});s.partners=Array.isArray(s.partners)?s.partners:[];return s}
function list({kind,activeOnly=false}={}){return state().partners.filter(p=>(!kind||p.kind===kind)&&(!activeOnly||p.active!==false)).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ja'))}
function upsert(input){const s=state(),id=String(input.id||('p_'+Date.now().toString(36))).trim(),name=String(input.name||'').trim();if(!name)return {ok:false,reason:'NAME_REQUIRED'};const p={id,name,kind:['FOOD','BATH','CAFE','OTHER'].includes(input.kind)?input.kind:'FOOD',discountYen:Math.max(0,Math.round(Number(input.discountYen)||0)),points:Math.max(0,Math.round(Number(input.points)||0)),costYen:Math.max(0,Math.round(Number(input.costYen)||0)),monthlyLimit:Math.max(0,Math.round(Number(input.monthlyLimit)||0)),targetMenu:String(input.targetMenu||'').trim(),address:String(input.address||'').trim(),note:String(input.note||'').trim(),active:input.active!==false,updatedAt:new Date().toISOString()};const i=s.partners.findIndex(x=>x.id===id);if(i>=0)s.partners[i]={...s.partners[i],...p};else s.partners.push(p);write(KEY,s);window.dispatchEvent(new CustomEvent('sug:partners-change',{detail:p}));return {ok:true,partner:p}}
function remove(id){const s=state(),n=s.partners.length;s.partners=s.partners.filter(p=>p.id!==id);write(KEY,s);if(s.partners.length!==n)window.dispatchEvent(new CustomEvent('sug:partners-change'));return s.partners.length!==n}
function usageCount(partnerId,month){const r=read('sug_rewards_v1',{redemptions:[]});return (r.redemptions||[]).filter(x=>x.partnerId===partnerId&&(!month||x.month===month)).length}
function eligible(kind){const month=window.SuGPointsV2716?.monthKey?.()||new Date().toISOString().slice(0,7);return list({kind,activeOnly:true}).filter(p=>!p.monthlyLimit||usageCount(p.id,month)<p.monthlyLimit)}
window.SuGPartnersV2721={state,list,upsert,remove,eligible,usageCount,key:KEY};
})();