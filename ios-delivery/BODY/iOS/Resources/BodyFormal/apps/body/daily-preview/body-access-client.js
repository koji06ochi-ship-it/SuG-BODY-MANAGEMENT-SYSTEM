(function(root){'use strict';
function create(config,fetchImpl){
 const c=config&&typeof config==='object'?config:{},endpoint=String(c.endpoint||''),token=typeof c.accessToken==='function'?c.accessToken:null,enabled=c.enabled===true;
 async function load(){if(!enabled)return{configured:false,status:{authenticated:false,serverVerified:false}};if(!token)throw Error('会員トークン取得処理が未設定です');if(!(/^https:\/\//i.test(endpoint)||endpoint.startsWith('/')))throw Error('権限確認先が未設定です');const accessToken=await token();if(!accessToken)throw Error('ログインが必要です');const r=await fetchImpl(endpoint,{method:'GET',headers:{Authorization:'Bearer '+accessToken,Accept:'application/json'},credentials:'omit',redirect:'error',signal:AbortSignal.timeout(10000)}),body=await r.json().catch(()=>({}));if(!r.ok)throw Error(body.error||'権限を確認できません');const permissions=Array.isArray(body.permissions)?body.permissions.slice(0,8):[],safe={authenticated:body.authenticated===true,serverVerified:body.serverVerified===true,role:String(body.role||''),membershipStatus:permissions.includes('body_member')?'active':'inactive',entitlementStatus:permissions.includes('body_general')?'active':'inactive',staffStatus:permissions.some(x=>x==='body_trainer'||x==='body_admin')?'active':'inactive'};return{configured:true,status:safe,permissions}}
 return{load};
}
root.BodyAccessClient={create};if(typeof module!=='undefined')module.exports=root.BodyAccessClient;
})(typeof globalThis!=='undefined'?globalThis:this);
