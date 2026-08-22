const SW_VERSION = 'sug-v26-5-32-member-ideal-compare';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith((async()=>{
      const res = await fetch(req);
      const type = res.headers.get('content-type') || '';
      if (!type.includes('text/html')) return res;
      let html = await res.text();
      const tag = '<script src="./assets/member-ideal-compare/v26.5.32/engine.js?v=26.5.32"></script>';
      if (!html.includes('member-ideal-compare/v26.5.32/engine.js')) html = html.replace('</body>', tag + '</body>');
      const headers = new Headers(res.headers);
      headers.set('cache-control','no-store');
      return new Response(html,{status:res.status,statusText:res.statusText,headers});
    })());
    return;
  }
  event.respondWith(fetch(req));
});
