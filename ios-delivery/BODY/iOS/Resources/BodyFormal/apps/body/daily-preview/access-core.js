(function(root){'use strict';
const roles=['member','body_customer','trainer','admin'];
function decide(input){const x=input&&typeof input==='object'?input:{};if(!x.authenticated)return{allowed:false,reason:'本人認証が必要です',permissions:[]};if(!x.serverVerified)return{allowed:false,reason:'サーバー側の利用権限を確認できません',permissions:[]};if(!roles.includes(x.role))return{allowed:false,reason:'利用区分が不明です',permissions:[]};
 let permissions=[];
 if(x.role==='member'&&x.membershipStatus==='active')permissions=['body_member'];
 if(x.role==='body_customer'&&x.entitlementStatus==='active')permissions=['body_general'];
 if(x.role==='trainer'&&x.staffStatus==='active')permissions=['body_trainer'];
 if(x.role==='admin'&&x.staffStatus==='active')permissions=['body_admin'];
 if(x.role==='member'&&x.coachingAssigned&&permissions.length)permissions.push('coaching_assigned');
 return permissions.length?{allowed:true,reason:'サーバー確認済み',permissions}:{allowed:false,reason:'有効な会員資格または購入権限がありません',permissions:[]};
}
root.BodyAccess={roles,decide};if(typeof module!=='undefined')module.exports=root.BodyAccess;
})(typeof globalThis!=='undefined'?globalThis:this);
