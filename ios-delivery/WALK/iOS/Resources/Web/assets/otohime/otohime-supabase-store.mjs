const RPC={snapshot:'otohime_sync_snapshot',consent:'otohime_sync_set_consent',apply:'otohime_sync_apply',clear:'otohime_sync_clear_all'};
const KINDS=new Set(['append_exchange','set_name','delete_name','save_fact','delete_fact','delete_turn']);
const SCOPES=['conversations','display_name','memories'];
function fail(c){throw Error(c);}
function cleanScopes(v){const o={};for(const k of SCOPES){if(typeof v?.[k]!=='boolean')fail('INVALID_CONSENT');o[k]=v[k];}return o;}
export function createOtohimeSupabaseStore({authAdapter,getAuthState=()=>authAdapter?.getState?.(),isOnline=()=>globalThis.navigator?.onLine!==false}={}){
 if(!authAdapter||typeof getAuthState!=='function')fail('MISSING_AUTH_ADAPTER');
 function context(){if(!isOnline())fail('OFFLINE');const s=getAuthState();if(s?.status!=='authenticated'||s.verified!==true||typeof s.userId!=='string'||!s.userId.trim())fail('AUTH_NOT_VERIFIED');const client=authAdapter.getVerifiedClient?.();if(!client||typeof client.rpc!=='function')fail('AUTH_NOT_VERIFIED');return{id:s.userId,client};}
 async function call(name,args){const a=context();let r;try{r=await a.client.rpc(name,args);}catch{fail('SYNC_UNAVAILABLE');}const b=context();if(a.id!==b.id||a.client!==b.client)fail('AUTH_CHANGED');if(r?.error){const m=String(r.error.message||'');if(m.includes('OTOHIME_EPOCH_MISMATCH'))fail('EPOCH_MISMATCH');if(m.includes('OTOHIME_CONSENT_REQUIRED'))fail('CONSENT_REQUIRED');if(m.includes('OTOHIME_CONFLICT'))fail('SYNC_CONFLICT');fail('SYNC_UNAVAILABLE');}return r?.data;}
 return Object.freeze({
  async snapshot(){const d=await call(RPC.snapshot,{});if(!d||!Number.isSafeInteger(d.epoch)||!d.consent||!Array.isArray(d.turns)||!Array.isArray(d.memories))fail('INVALID_SYNC_RESPONSE');return structuredClone(d);},
  setConsent(scopes,version){if(typeof version!=='string'||!version.trim())fail('INVALID_CONSENT');return call(RPC.consent,{p_scopes:cleanScopes(scopes),p_consent_version:version});},
  applyMutation({expectedEpoch,operationId,kind,payload}){if(!Number.isSafeInteger(expectedEpoch)||expectedEpoch<1)fail('INVALID_EPOCH');if(typeof operationId!=='string'||!operationId.trim()||operationId.length>128)fail('INVALID_OPERATION_ID');if(!KINDS.has(kind)||!payload||typeof payload!=='object'||Array.isArray(payload))fail('INVALID_MUTATION');return call(RPC.apply,{p_expected_epoch:expectedEpoch,p_operation_id:operationId,p_kind:kind,p_payload:structuredClone(payload)});},
  clearAll({expectedEpoch,operationId}){if(!Number.isSafeInteger(expectedEpoch)||expectedEpoch<1)fail('INVALID_EPOCH');if(typeof operationId!=='string'||!operationId.trim())fail('INVALID_OPERATION_ID');return call(RPC.clear,{p_expected_epoch:expectedEpoch,p_operation_id:operationId});}
 });
}
