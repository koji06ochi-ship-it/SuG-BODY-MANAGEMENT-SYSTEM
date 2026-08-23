(()=>{
'use strict';
const VERSION='26.5.139';
async function restoreSession(){
  try{
    if(typeof sb==='undefined'||!sb?.auth)return false;
    const {data,error}=await sb.auth.getSession();
    if(error||!data?.session?.user)return false;
    accessToken=data.session.access_token||accessToken;
    sessionUser=data.session.user||sessionUser;
    try{showApp()}catch(e){}
    try{await onSignedIn(data.session.user)}catch(e){console.error('session restore onSignedIn',e)}
    return true;
  }catch(e){console.error('session restore',e);return false}
}
async function boot(){
  for(const ms of [100,250,500,1000,1800]){
    await new Promise(r=>setTimeout(r,ms));
    if(await restoreSession())break;
  }
  try{
    if(typeof sb!=='undefined'&&sb?.auth){
      sb.auth.onAuthStateChange((event,session)=>{
        if((event==='SIGNED_IN'||event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')&&session?.user){
          accessToken=session.access_token||accessToken;
          sessionUser=session.user||sessionUser;
          try{showApp()}catch(e){}
        }
      });
    }
  }catch(e){}
  window.__SUG_AUTH_STABILITY_VERSION__=VERSION;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();