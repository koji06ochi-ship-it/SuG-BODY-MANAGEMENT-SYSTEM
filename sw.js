const SW_VERSION='sug-v26.5.252-clean-home';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>fetch(event.request)))});
