const SW_VERSION='sug-v26.5.246-pwa-asset-cache';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())await caches.delete(k);await self.clients.claim()})()));

const PWA_MEMBER_RUNTIME=[
'assets/ui/v26.5.138/auth-session-stability.js',
'assets/member-home/v26.5.41/engine.js',
'assets/member-home/v26.5.42/login-render.js',
'assets/member-home/v26.5.44/onboarding.js',
'assets/member-home/v26.5.45/food-flow.js',
'assets/member-home/v26.5.49/force-food-home.js',
'assets/member-home/v26.5.51/meal-ai-client.js',
'assets/member-home/v26.5.51/food-photo.js',
'assets/member-home/v26.5.57/craving-check.js',
'assets/ui-feedback/v26.5.52/click-feedback.js',
'assets/ui/v26.5.99/health-shortcut-fix.js',
'assets/health-sync/v26.5.27/engine.js',
'assets/health-sync/v26.5.219/walk-bridge.js',
'assets/ui/v26.5.148/ideal-confirm-direct.js',
'assets/ui/v26.5.242/ideal-first-loader.js',
'assets/ui/v26.5.149/flow-controller.js',
'assets/ui/v26.5.152/recovery-autofill.js',
'assets/ui/v26.5.153/menu-continuation.js',
'assets/member/v26.5.151/member-access.js',
'assets/member/v26.5.151/member-card.js',
'assets/ui/v26.5.167/finalizer.js',
'assets/ui/v26.5.175/training-start.js',
'assets/ui/v26.5.176/session-flow.js',
'assets/ui/v26.5.184/session-training-bridge.js',
'assets/ui/v26.5.192/member-home-final.js',
'assets/ui/v26.5.193/state-migration.js',
'assets/ui/v26.5.199/next-load-home.js',
'assets/ui/v26.5.200/quest-entry.js',
'assets/ui/v26.5.203/flow-complete-release.js',
'assets/ui/v26.5.204/member-performance.js',
'assets/ui/v26.5.215/member-state-guard.js',
'assets/ui/v26.5.223/training-day-reset.js',
'assets/ui/v26.5.229/shrine-quest-home.js'
];

const LEGACY_RUNTIME=[
'assets/member-home/v26.5.41/engine.js','assets/member-home/v26.5.42/login-render.js','assets/member-home/v26.5.44/onboarding.js','assets/member-home/v26.5.45/food-flow.js','assets/member-home/v26.5.49/force-food-home.js','assets/member-home/v26.5.51/meal-ai-client.js','assets/member-home/v26.5.51/food-photo.js','assets/member-home/v26.5.56/movement-ai.js','assets/member-home/v26.5.57/craving-check.js','assets/member-home/v26.5.59/trainer-clinical-guard.js','assets/ui-feedback/v26.5.52/click-feedback.js','assets/ui/v26.5.98/canonical-ui.js','assets/ui/v26.5.99/health-shortcut-fix.js','assets/health-sync/v26.5.27/engine.js','assets/ui/v26.5.149/flow-controller.js','assets/ui/v26.5.152/recovery-autofill.js','assets/ui/v26.5.153/menu-continuation.js','assets/member/v26.5.151/member-access.js','assets/member/v26.5.151/member-card.js','assets/ui/v26.5.167/finalizer.js','assets/ui/v26.5.174/flow-scroll-controller.js','assets/ui/v26.5.175/training-start.js','assets/ui/v26.5.176/session-flow.js','assets/ui/v26.5.177/startup-recovery.js','assets/ui/v26.5.178/flow-bootstrap.js','assets/ui/v26.5.184/session-training-bridge.js','assets/ui/v26.5.192/member-home-final.js','assets/ui/v26.5.193/state-migration.js','assets/ui/v26.5.199/next-load-home.js'
];

function injectScripts(html,tags,version){
  for(const src of tags){
    if(!html.includes(src))html=html.replace('</body>','<script src="'+src+'?v='+version+'"></script>\n</body>');
  }
  return html;
}

function htmlResponse(res,html){
  const h=new Headers(res.headers);
  h.set('cache-control','no-store, no-cache, must-revalidate');
  h.delete('content-length');
  return new Response(html,{status:res.status,statusText:res.statusText,headers:h});
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.mode!=='navigate')return;
  event.respondWith((async()=>{
    try{
      const res=await fetch(req,{cache:'no-store'});
      const type=res.headers.get('content-type')||'';
      if(!type.includes('text/html'))return res;
      const url=new URL(req.url);
      const isPwa=url.searchParams.get('pwa')==='1';

      if(isPwa){
        let html=await res.text();
        const tags=[];
        if(url.searchParams.get('entry')==='member')tags.push(...PWA_MEMBER_RUNTIME);
        if(/\/walk-quest\.html$/i.test(url.pathname))tags.push('assets/health-sync/v26.5.221/walk-status.js','assets/walk/v26.5.225/qr-checkin.js');
        tags.push('assets/pwa/v26.5.243/member-pwa-nav.js');
        html=injectScripts(html,tags,'26.5.243');
        return htmlResponse(res,html);
      }

      const isQuest=/\/quest(?:-v[^\/]*)?\.html$/i.test(url.pathname);
      const isMemberEntry=/\/member\.html$/i.test(url.pathname);
      const isHubFrame=url.searchParams.get('hub')==='1';
      if(isQuest||isMemberEntry||isHubFrame)return res;

      let html=await res.text();
      const isMember=url.searchParams.get('entry')==='member';
      let tags=[...LEGACY_RUNTIME];
      if(isMember){
        const skip=new Set(['assets/member-home/v26.5.56/movement-ai.js','assets/member-home/v26.5.59/trainer-clinical-guard.js','assets/ui/v26.5.174/flow-scroll-controller.js','assets/ui/v26.5.177/startup-recovery.js','assets/ui/v26.5.178/flow-bootstrap.js']);
        tags=tags.filter(src=>!skip.has(src));
        tags.push('assets/ui/v26.5.200/quest-entry.js','assets/ui/v26.5.203/flow-complete-release.js','assets/ui/v26.5.204/member-performance.js');
      }
      html=injectScripts(html,tags,'26.5.204');
      return htmlResponse(res,html);
    }catch(e){
      return fetch(req,{cache:'no-store'});
    }
  })());
});