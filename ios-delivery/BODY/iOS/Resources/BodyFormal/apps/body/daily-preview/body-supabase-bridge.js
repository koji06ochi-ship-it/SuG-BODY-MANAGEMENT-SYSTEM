(function(root){'use strict';
const URL='https://nnqzxcgkqjnmtzcvorha.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_zcn7r2YSKDZa1lXJvmk3sg_GulOJXwI';
const STORAGE_KEY='sug-body-management-v4-auth';
let client=null;
function getClient(){
 if(client)return client;
 if(!root.supabase||typeof root.supabase.createClient!=='function')return null;
 client=root.supabase.createClient(URL,PUBLISHABLE_KEY,{auth:{storageKey:STORAGE_KEY,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 root.__SUG_BODY_SUPABASE_CLIENT__=client;
 return client;
}
async function accessToken(){
 const c=getClient();if(!c)return null;
 const {data,error}=await c.auth.getSession();
 if(error)throw Error('SUPABASE_SESSION_ERROR');
 return data.session?.access_token||null;
}
async function status(){
 const c=getClient();
 if(!c)return {configured:true,sdkReady:false,authenticated:false,serverVerified:false,reason:'Supabase SDKを読み込めません'};
 const {data,error}=await c.auth.getSession();
 if(error)return {configured:true,sdkReady:true,authenticated:false,serverVerified:false,reason:'ログイン状態を確認できません'};
 if(!data.session)return {configured:true,sdkReady:true,authenticated:false,serverVerified:false,reason:'ログインが必要です'};
 const verified=await c.auth.getUser(data.session.access_token);
 if(verified.error||!verified.data.user)return {configured:true,sdkReady:true,authenticated:false,serverVerified:false,reason:'ログインの再確認が必要です'};
 return {configured:true,sdkReady:true,authenticated:true,serverVerified:false,reason:'本人認証済み・BODY利用権限はサーバー確認待ち'};
}
function configureAccess(){
 const runtime=root.__SUG_BODY_RUNTIME_CONFIG__=root.__SUG_BODY_RUNTIME_CONFIG__||{};
 const access=runtime.access=runtime.access||{};
 if(!access.endpoint)access.endpoint='/api/body-access-status';
 if(typeof access.accessToken!=='function')access.accessToken=accessToken;
 // Access checking remains off until the server endpoint and database policies are configured.
 if(access.enabled!==true)access.enabled=false;
}
async function publish(){const detail=await status();root.__SUG_BODY_SUPABASE_STATUS__=detail;root.dispatchEvent(new CustomEvent('sug:body-supabase-status',{detail}));return detail;}
function boot(){configureAccess();const c=getClient();if(c)c.auth.onAuthStateChange(()=>{setTimeout(publish,0)});publish();}
root.SuGBodySupabaseBridge={getClient,accessToken,status,publish,storageKey:STORAGE_KEY};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(typeof globalThis!=='undefined'?globalThis:this);
