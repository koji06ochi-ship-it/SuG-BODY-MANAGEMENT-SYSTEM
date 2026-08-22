const SW_VERSION = 'sug-v26.5.41-member-home';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async()=>{ await self.clients.claim(); })()));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: 'no-store' });
        const type = res.headers.get('content-type') || '';
        if (!type.includes('text/html')) return res;
        let html = await res.text();
        const tag = '<script src="assets/member-home/v26.5.41/engine.js?v=26.5.41"></script>';
        if (!html.includes('member-home/v26.5.41/engine.js')) html = html.replace('</body>', tag + '\n</body>');
        const headers = new Headers(res.headers);
        headers.set('cache-control', 'no-store, no-cache, must-revalidate');
        headers.delete('content-length');
        return new Response(html, { status: res.status, statusText: res.statusText, headers });
      } catch (_e) {
        return fetch(req, { cache: 'no-store' });
      }
    })());
    return;
  }
  event.respondWith(fetch(req, { cache: 'no-store' }));
});