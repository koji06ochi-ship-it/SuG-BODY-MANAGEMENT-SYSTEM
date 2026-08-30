(()=>{'use strict';
const base=window.SuGRewardsV2738;if(!base)return;
function verifyCode(code,{partnerId=''}={}){const clean=String(code||'').trim().toUpperCase();if(!clean)return{ok:false,reason:'CODE_REQUIRED'};const r=base.redemption(clean);if(!r)return{ok:false,reason:'NOT_FOUND'};if(r.status==='USED'||r.status==='RECEIVED')return{ok:false,reason:'ALREADY_FULFILLED',redemption:r};if(base.isExpired(r))return{ok:false,reason:'EXPIRED',redemption:r};if(r.delivery==='COUPON'){if(!r.partnerId)return{ok:false,reason:'PARTNER_MISSING',redemption:r};if(partnerId&&String(r.partnerId)!==String(partnerId))return{ok:false,reason:'WRONG_PARTNER',redemption:r}}return{ok:true,redemption:r}}
function consumeCode(code,{partnerId=''}={}){const v=verifyCode(code,{partnerId});if(!v.ok)return v;const status=v.redemption.delivery==='COUPON'?'USED':'RECEIVED';return base.setFulfillment(v.redemption.code,status)}
window.SuGRewardsV2739={...base,verifyCode,consumeCode};
})();