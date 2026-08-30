(()=>{'use strict';
const base=window.SuGRewardsV2737;if(!base)return;
const KEY='sug_rewards_v1',VALIDITY_KEY='sug_reward_validity_v1';
const defaults={protein:30,meal1000:30,powergrip:60,bracebelt:60};
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const validities=()=>{const v=read(VALIDITY_KEY,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}};
function validityDays(id){const n=Number(validities()[id]);return Number.isFinite(n)&&n>=1&&n<=365?Math.round(n):(defaults[id]||30)}
function setValidity(id,days){const n=Math.round(Number(days));if(!defaults[id]||!Number.isFinite(n)||n<1||n>365)return{ok:false,reason:'INVALID_VALIDITY'};const v=validities();v[id]=n;write(VALIDITY_KEY,v);window.dispatchEvent(new CustomEvent('sug:rewards-change'));return{ok:true,validityDays:n}}
function catalog(){return base.catalog().map(x=>({...x,validityDays:validityDays(x.id),requiresPartner:x.id==='meal1000'}))}
function foodPartners(){const api=window.SuGPartnersV2722;return api?api.list({kind:'FOOD',activeOnly:true}):[]}
function isExpired(r){return !!r?.expiresAt&&new Date(r.expiresAt).getTime()<Date.now()}
function redeem(id,options={}){let partner=null;if(id==='meal1000'){partner=foodPartners().find(p=>p.id===String(options.partnerId||''));if(!partner)return{ok:false,reason:'PARTNER_REQUIRED'}}const out=base.redeem(id);if(!out.ok)return out;const s=read(KEY,{redemptions:[]}),r=s.redemptions.find(x=>x.code===out.redemption.code);if(r){const days=validityDays(id),at=new Date(r.at||Date.now());r.validityDays=days;r.expiresAt=new Date(at.getTime()+days*86400000).toISOString();if(partner){r.partnerId=partner.id;r.partnerName=partner.name;r.partnerAddress=partner.address||'';r.targetMenu=partner.targetMenu||''}write(KEY,s);out.redemption=r;window.dispatchEvent(new CustomEvent('sug:rewards-change',{detail:{redemption:r}}))}return out}
function setFulfillment(code,status){const r=base.redemption(code);if(!r)return{ok:false,reason:'NOT_FOUND'};if(r.status==='USED'||r.status==='RECEIVED')return{ok:false,reason:'ALREADY_FULFILLED'};if(isExpired(r))return{ok:false,reason:'EXPIRED'};return base.setFulfillment(code,status)}
window.SuGRewardsV2738={...base,catalog,validities,validityDays,setValidity,foodPartners,isExpired,redeem,setFulfillment};
})();