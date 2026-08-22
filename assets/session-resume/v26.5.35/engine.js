(function(){
  "use strict";
  if(window.__SUG_SESSION_RESUME_535__)return;
  window.__SUG_SESSION_RESUME_535__=true;

  async function resumeSavedLogin(){
    try{
      if(typeof sb==="undefined" || !sb || !sb.auth || typeof onSignedIn!=="function")return false;
      if(typeof inviteLandingDetected!=="undefined" && inviteLandingDetected)return false;
      if(new URLSearchParams(location.search).get("recovery")==="1")return false;
      if(window.__SUG_AUTO_LOGIN_RUNNING__)return false;

      const result=await sb.auth.getSession();
      const session=result && result.data && result.data.session;
      if(!session || !session.user || !session.access_token)return false;

      window.__SUG_AUTO_LOGIN_RUNNING__=true;
      try{
        accessToken=session.access_token;
        sessionUser=session.user;
        await onSignedIn(session.user);
        return true;
      }finally{
        window.__SUG_AUTO_LOGIN_RUNNING__=false;
      }
    }catch(e){
      console.warn("S.u.G saved-session resume failed",e);
      window.__SUG_AUTO_LOGIN_RUNNING__=false;
      return false;
    }
  }

  async function boot(){
    for(var i=0;i<20;i++){
      if(await resumeSavedLogin())return;
      await new Promise(function(resolve){setTimeout(resolve,250)});
    }
  }

  window.resumeSugSavedLogin=resumeSavedLogin;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(boot,150)});
  else setTimeout(boot,150);
})();