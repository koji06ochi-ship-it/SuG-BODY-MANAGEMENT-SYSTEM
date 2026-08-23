(()=>{
'use strict';
const VERSION='26.5.138';
async function restoreSession(){
  try{
    if(!window.sb||!window.sb.auth)return false;
    const {data,error}=await window.sb.auth.getSession();
    if(error||!data?.session?.user)return false;
    window.accessToken=data.session.access_token||window.accessToken;
    window.sessionUser=data.session.user||window.sessionUser;
    try{window.showApp?.()}catch(e){}
    try{await window.onSignedIn?.(data.session.user)}catch(e){}
    return true;
  }catch(e){return false}
}
async function boot(){
  for(const ms of [150,400,900,1800]){
    await new Promise(r=>setTimeout(r,ms));
    if(await restoreSession())break;
  }
  try{
    window.sb?.auth?.onAuthStateChange?.((event,session)=>{
      if((event==='SIGNED_IN'||event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')&&session?.user){
        window.accessToken=session.access_token||window.accessToken;
        window.sessionUser=session.user||window.sessionUser;
        try{window.showApp?.()}catch(e){}
      }
    });
  }catch(e){}
  window.__SUG_AUTH_STABILITY_VERSION__=VERSION;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();