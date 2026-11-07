import {createOtohimeSyncCoordinator} from './otohime-sync-coordinator.mjs';

const SCOPES=Object.freeze(['conversation','preferredName','approvedMemories']);
const MAP=Object.freeze({conversation:'conversations',preferredName:'display_name',approvedMemories:'memories'});
const LABELS=Object.freeze({conversation:'会話履歴',preferredName:'呼び名',approvedMemories:'本人承認済みの長期記憶'});
const emptyScopes=()=>Object.fromEntries(Object.keys(MAP).map(k=>[k,false]));
function identity(state){return state?.status==='authenticated'&&state?.verified===true&&typeof state?.userId==='string'&&state.userId.trim()?state.userId:null;}

/**
 * UI-only sync preview. The coordinator is backed by an in-memory consent store;
 * mutations carrying personal content always fail closed. No Supabase client,
 * fetch, persistent storage, or network transport is referenced here.
 */
export function createOtohimeSyncPreview({getAuthState=()=>null}={}){
  const perUser=new Map();
  let userId=null,scopes=emptyScopes(),previewConsent=false,previewStatus='idle',paused=false;

  function auth(){try{return getAuthState();}catch{return null;}}
  function verifiedId(){return identity(auth());}
  function stateFor(id){
    if(!perUser.has(id))perUser.set(id,{epoch:1,revision:0,consent:{enabled:false,scopes:{conversations:false,display_name:false,memories:false}},profile:null,turns:[],memories:[]});
    return perUser.get(id);
  }
  function requireId(){const id=verifiedId();if(!id)throw Error('AUTH_NOT_VERIFIED');return id;}
  const store={
    async snapshot(){return structuredClone(stateFor(requireId()));},
    async setConsent(value,version){
      const id=requireId();
      if(version!=='TEST_ONLY_PREVIEW')throw Error('INVALID_CONSENT');
      const s=stateFor(id);
      s.revision++;
      s.consent={enabled:Object.values(value).some(Boolean),scopes:{...value}};
      return structuredClone(s.consent);
    },
    async applyMutation(){throw Error('CLOUD_NOT_READY');},
    async clearAll(){throw Error('CLOUD_NOT_READY');}
  };
  const coordinator=createOtohimeSyncCoordinator({store,getAuthState:auth});

  function reset(id){userId=id;scopes=emptyScopes();previewConsent=false;previewStatus='idle';paused=false;}
  function refresh(){
    const state=auth(),id=identity(state);
    if(!id||id!==userId)reset(id);
    const status=id?'authenticated':state?.status==='checking'||state?.status==='pending'?'checking':state?.status==='expired'||state?.status==='error'?'unverified':'unauthenticated';
    coordinator.getState();
    return getState(status);
  }
  function getState(status){
    const current=auth(),id=identity(current);
    const authStatus=status||(id?'authenticated':current?.status==='checking'||current?.status==='pending'?'checking':current?.status==='expired'||current?.status==='error'?'unverified':'unauthenticated');
    const coordinatorStatus=coordinator.getState().status;
    return Object.freeze({mode:'test-only',authStatus,authorized:Boolean(id),scopes:Object.freeze({...scopes}),previewConsent,previewStatus,syncStatus:paused?'paused-test-only':'not-connected',coordinatorStatus:coordinatorStatus==='synced'?'preview-only':coordinatorStatus});
  }
  function setSelection(scope,on){
    refresh();
    if(!verifiedId()||!SCOPES.includes(scope))return false;
    scopes[scope]=Boolean(on);previewConsent=false;paused=false;
    previewStatus=Object.values(scopes).some(Boolean)?'selected-test-only':'idle';
    return true;
  }
  async function applyConsent(next,successCode){
    const id=verifiedId();
    if(!id)return{ok:false,code:'AUTH_REQUIRED',state:getState()};
    try{
      const mapped=Object.fromEntries(SCOPES.map(k=>[MAP[k],Boolean(next[k])]));
      await coordinator.setConsent(mapped,'TEST_ONLY_PREVIEW');
      if(verifiedId()!==id)throw Error('AUTH_CHANGED');
      return{ok:true,code:successCode,state:getState()};
    }catch(error){return{ok:false,code:error.message==='AUTH_CHANGED'?'AUTH_CHANGED':'PREVIEW_FAILED',state:getState()};}
  }
  async function saveConsentPreview(){
    refresh();
    if(!verifiedId())return{ok:false,code:'AUTH_REQUIRED',state:getState()};
    if(!Object.values(scopes).some(Boolean)){
      previewConsent=false;previewStatus='declined-test-only';
      const result=await applyConsent(emptyScopes(),'NO_SCOPE_SELECTED');
      return{...result,state:getState()};
    }
    const result=await applyConsent(scopes,'PREVIEW_ONLY');
    previewConsent=result.ok;paused=false;previewStatus=result.ok?'consent-preview-only':'preview-error';
    return{...result,state:getState()};
  }
  async function refuse(){
    refresh();
    if(!verifiedId())return{ok:false,code:'AUTH_REQUIRED',state:getState()};
    scopes=emptyScopes();previewConsent=false;paused=false;previewStatus='declined-test-only';
    const result=await applyConsent(scopes,'DECLINED_NO_NETWORK');
    return{...result,state:getState()};
  }
  function pauseSyncPreview(){
    refresh();
    if(!verifiedId())return{ok:false,code:'AUTH_REQUIRED',state:getState()};
    if(!previewConsent)return{ok:false,code:'SYNC_NOT_ACTIVE',state:getState()};
    paused=true;previewStatus='paused-test-only';
    return{ok:true,code:'PAUSED_NO_NETWORK',state:getState()};
  }
  async function revokePreview(){
    refresh();
    if(!verifiedId())return{ok:false,code:'AUTH_REQUIRED',state:getState()};
    scopes=emptyScopes();previewConsent=false;paused=false;previewStatus='revoked-test-only';
    const result=await applyConsent(scopes,'REVOKED_NO_NETWORK');
    return{...result,state:getState()};
  }
  function requestCloudDelete(){return{ok:false,code:'CLOUD_NOT_READY',state:getState()};}
  return Object.freeze({scopes:SCOPES,labels:LABELS,refresh,getState,setSelection,saveConsentPreview,refuse,pauseSyncPreview,revokePreview,requestCloudDelete});
}
