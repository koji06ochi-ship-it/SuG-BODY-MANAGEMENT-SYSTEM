const SW_VERSION = 'sug-v26.5.64-trainer-vision-movement-ai';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async()=>{ await self.clients.claim(); })()));
self.addEventListener('fetch', event => {
 const req=event.request;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{try{const res=await fetch(req,{cache:'no-store'});const type=res.headers.get('content-type')||'';if(!type.includes('text/html'))return res;let html=await res.text();const tags=[
   '<script src="assets/member-home/v26.5.41/engine.js?v=26.5.64"></script>',
   '<script src="assets/member-home/v26.5.42/login-render.js?v=26.5.64"></script>',
   '<script src="assets/member-home/v26.5.44/onboarding.js?v=26.5.64"></script>',
   '<script src="assets/member-home/v26.5.45/food-flow.js?v=26.5.64"></script>',
   '<script src="assets/member-home/v26.5.49/force-food-home.js?v=26.5.64"></script>',
   '<script src="assets/member-home/v26.5.51/meal-ai-client.js?v=26.5.64"></script>',
   '<script src="assets/member-home/v26.5.51/food-photo.js?v=26.5.64"></script>',
   '<script src="assets/member-home/v26.5.56/movement-ai.js?v=26.5.64"></script>',
   '<script src="assets/member-home/v26.5.57/craving-check.js?v=26.5.64"></script>',
   '<script src="assets/member-home/v26.5.59/trainer-clinical-guard.js?v=26.5.64"></script>',
   '<script src="assets/trainer-ai/v26.5.61/movement-error-hub.js?v=26.5.64"></script>',
   '<script src="assets/ui-feedback/v26.5.52/click-feedback.js?v=26.5.64"></script>'
  ];tags.forEach(tag=>{const src=tag.match(/src="([^"]+)/)?.[1]?.split('?')[0]||'';if(src&&!html.includes(src))html=html.replace('</body>',tag+'\n</body>')});const headers=new Headers(res.headers);headers.set('cache-control','no-store, no-cache, must-revalidate');headers.delete('content-length');return new Response(html,{status:res.status,statusText:res.statusText,headers})}catch(_e){return fetch(req,{cache:'no-store'})}})());return;
 }
 event.respondWith(fetch(req,{cache:'no-store'}));
});