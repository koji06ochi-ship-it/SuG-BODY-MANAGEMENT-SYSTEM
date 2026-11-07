(()=>{
  'use strict';
  const root=window;
  if(root.SUG_AUTH_ADAPTER?.version==='8.4A4')return;
  const CANONICAL='sug-body-management-v4-auth';
  const options=root.SUG_AUTH_ADAPTER_OPTIONS||{};
  const legacyKeys=[...new Set(Array.isArray(options.legacyStorageKeys)?options.legacyStorageKeys:[])].filter(k=>typeof k==='string'&&k&&k!==CANONICAL);
  const config=root.SUG_CLOUD_CONFIG||{};
  const url=config.url||'https://nnqzxcgkqjnmtzcvorha.supabase.co';
  const publishableKey=config.publishableKey||'sb_publishable_zcn7r2YSKDZa1lXJvmk3sg_GulOJXwI';
  const slots=[];
  const listeners=new Set();
  let generation=0,verification=null,activeClient=null;
  let current={status:'checking',verified:false,userId:null,user:null,source:null};
  const publicState=()=>Object.freeze({status:current.status,verified:current.verified,userId:current.userId,user:current.user?Object.freeze({id:current.user.id}):null,source:current.source});
  function emit(reason){
    const detail={...publicState(),reason};
    try{root.dispatchEvent(new CustomEvent('sug:auth-state',{detail}));}catch{}
    for(const fn of [...listeners]){try{fn(publicState());}catch{}}
  }
  function setState(status,userId=null,source=null,reason='state'){
    const verified=status==='authenticated'&&typeof userId==='string'&&userId.length>0;
    current={status,verified,userId:verified?userId:null,user:verified?{id:userId}:null,source:verified?source:null};
    activeClient=verified?(slots.find(x=>x.name===source)?.client||null):null;
    emit(reason);
  }
  function createSlot(name,key){
    if(!root.supabase?.createClient||!url||!publishableKey)return null;
    try{
      const client=root.supabase.createClient(url,publishableKey,{auth:{storageKey:key,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const slot={name,client};slots.push(slot);
      client.auth.onAuthStateChange((event)=>{
        generation++;
        verification=null;
        setState('checking',null,null,'auth-event:'+String(event||'unknown'));
        root.setTimeout(()=>{void verify({force:true,reason:'auth-event'});},0);
      });
      return slot;
    }catch{return null;}
  }
  const canonical=createSlot('canonical',CANONICAL);
  for(const key of legacyKeys)createSlot('legacy',key);
  async function inspect(slot){
    const sessionResult=await slot.client.auth.getSession();
    if(sessionResult?.error)return {error:true};
    const session=sessionResult?.data?.session||null;
    if(!session)return {session:null};
    const result=await slot.client.auth.getUser();
    if(result?.error)return {error:true,hadSession:true};
    const user=result?.data?.user;
    if(!user?.id||user.id!==session.user?.id)return {error:true,hadSession:true};
    return {session,user};
  }
  async function runVerify(ticket,reason){
    if(!canonical){setState('unavailable',null,null,'client-unavailable');return publicState();}
    try{
      const checked=await Promise.all(slots.map(async slot=>({slot,result:await inspect(slot)})));
      if(ticket!==generation)return publicState();
      if(checked.some(x=>x.result.error)){setState('unavailable',null,null,'server-verification-failed');return publicState();}
      const signed=checked.filter(x=>x.result.session);
      if(!signed.length){setState('anonymous',null,null,reason||'no-session');return publicState();}
      const ids=new Set(signed.map(x=>x.result.user.id));
      if(ids.size!==1){setState('conflict',null,null,'multiple-identities');return publicState();}
      const selected=signed.find(x=>x.slot.name==='canonical')||signed[0];
      setState('authenticated',selected.result.user.id,selected.slot.name,reason||'verified');
      return publicState();
    }catch{
      if(ticket===generation)setState('unavailable',null,null,'server-verification-failed');
      return publicState();
    }
  }
  function verify({force=false,reason='refresh'}={}){
    if(!force&&current.verified&&current.status==='authenticated')return Promise.resolve(publicState());
    if(verification)return verification;
    const ticket=++generation;
    setState('checking',null,null,reason+':checking');
    const promise=runVerify(ticket,reason).finally(()=>{if(verification===promise)verification=null;});
    verification=promise;
    return promise;
  }
  function invalidate(reason='invalidated'){
    generation++;
    verification=null;
    setState('checking',null,null,reason);
    root.setTimeout(()=>{void verify({force:true,reason});},0);
  }
  const watchedKeys=new Set([CANONICAL,...legacyKeys]);
  root.addEventListener('storage',event=>{if(event.key===null||watchedKeys.has(event.key))invalidate('storage-change');});
  root.addEventListener('pageshow',()=>invalidate('page-show'));
  root.addEventListener('offline',()=>invalidate('offline'));
  root.addEventListener('online',()=>invalidate('online'));
  root.addEventListener('visibilitychange',()=>{if(!root.document?.hidden)invalidate('visible');});
  async function signOutAll(){
    generation++;
    verification=null;
    setState('checking',null,null,'sign-out-started');
    const results=await Promise.all(slots.map(async slot=>{
      try{return await slot.client.auth.signOut({scope:'local'});}catch{return {error:true};}
    }));
    if(results.some(x=>x?.error))setState('unavailable',null,null,'sign-out-failed');
    else setState('anonymous',null,null,'signed-out');
    return {ok:results.every(x=>!x?.error)};
  }
  root.SUG_AUTH_ADAPTER=Object.freeze({
    version:'8.4A4',
    getState:publicState,
    getLoginClient:()=>canonical?.client||null,
    getVerifiedClient:()=>current.verified?activeClient:null,
    refresh:verify,
    signOut:signOutAll,
    invalidate,
    subscribe(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn);}
  });
  if(canonical)root.setTimeout(()=>{void verify({force:true,reason:'startup'});},0);
  else setState('unavailable',null,null,'client-unavailable');
})();
