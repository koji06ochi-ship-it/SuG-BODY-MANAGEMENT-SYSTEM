const SCOPES=Object.freeze(['conversation','preferredName','approvedMemories']);
const labels=Object.freeze({conversation:'会話履歴',preferredName:'呼び名',approvedMemories:'本人承認済みの長期記憶'});
function verifiedIdentity(state){const id=state?.userId;return state?.status==='authenticated'&&state?.verified===true&&typeof id==='string'&&id.length>0&&id.length<=200?id:null;}
export function createOtohimeConsentPreview({getAuthState=()=>null}={}){
 let userId=null,selected=Object.fromEntries(SCOPES.map(x=>[x,false])),previewConsent=false,authStatus='checking',previewStatus='idle',paused=false;
 function reset(id,status){userId=id;authStatus=status;selected=Object.fromEntries(SCOPES.map(x=>[x,false]));previewConsent=false;previewStatus='idle';paused=false;}
 function refresh(){let state;try{state=getAuthState();}catch{state=null;}const id=verifiedIdentity(state),status=id?'authenticated':state?.status==='checking'||state?.status==='pending'?'checking':state?.status==='expired'||state?.status==='error'?'unverified':'unauthenticated';if(!id||id!==userId)reset(id,status);else authStatus=status;return getState();}
 function getState(){return Object.freeze({mode:'test-only',authStatus,authorized:Boolean(userId),scopes:Object.freeze({...selected}),previewConsent,previewStatus,syncStatus:paused?'paused-test-only':'not-connected'});}
 function setSelection(scope,on){refresh();if(!userId||!SCOPES.includes(scope))return false;selected[scope]=Boolean(on);previewConsent=false;paused=false;previewStatus=Object.values(selected).some(Boolean)?'selected-test-only':'idle';return true;}
 function saveConsentPreview(){refresh();if(!userId)return{ok:false,code:'AUTH_REQUIRED',state:getState()};if(!Object.values(selected).some(Boolean)){previewConsent=false;previewStatus='declined-test-only';return{ok:true,code:'NO_SCOPE_SELECTED',state:getState()};}previewConsent=true;paused=false;previewStatus='consent-preview-only';return{ok:true,code:'PREVIEW_ONLY',state:getState()};}
 function refuse(){refresh();if(!userId)return{ok:false,code:'AUTH_REQUIRED',state:getState()};selected=Object.fromEntries(SCOPES.map(x=>[x,false]));previewConsent=false;paused=false;previewStatus='declined-test-only';return{ok:true,code:'DECLINED_NO_SYNC_WAS_ACTIVE',state:getState()};}
 function pauseSyncPreview(){refresh();if(!userId)return{ok:false,code:'AUTH_REQUIRED',state:getState()};if(!previewConsent)return{ok:false,code:'SYNC_NOT_ACTIVE',state:getState()};paused=true;previewStatus='paused-test-only';return{ok:true,code:'PAUSED_NO_NETWORK',state:getState()};}
 function revokePreview(){refresh();if(!userId)return{ok:false,code:'AUTH_REQUIRED',state:getState()};selected=Object.fromEntries(SCOPES.map(x=>[x,false]));previewConsent=false;paused=false;previewStatus='revoked-test-only';return{ok:true,code:'REVOKED_NO_SYNC_WAS_ACTIVE',state:getState()};}
 function requestCloudDelete(){refresh();return{ok:false,code:'CLOUD_NOT_READY',state:getState()};}
 return Object.freeze({scopes:SCOPES,labels,refresh,getState,setSelection,saveConsentPreview,refuse,pauseSyncPreview,revokePreview,requestCloudDelete});
}
