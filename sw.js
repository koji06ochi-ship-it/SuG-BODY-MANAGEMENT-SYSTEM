const SW_VERSION = 'sug-v26.5.35-session-resume';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async()=>{
  await self.clients.claim();
  const clients = await self.clients.matchAll({type:'window'});
  for (const client of clients) {
    try {
      const url = new URL(client.url);
      if (!url.searchParams.has('v') || url.searchParams.get('v') !== '26.5.35') {
        url.searchParams.set('v','26.5.35');
        await client.navigate(url.toString());
      }
    } catch (_e) {}
  }
})()));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: 'no-store' });
        const type = res.headers.get('content-type') || '';
        if (!type.includes('text/html')) return res;
        let html = await res.text();
        const tags = [
          '<script src="assets/member-ideal-compare/v26.5.32/engine.js?v=26.5.35"></script>',
          '<script src="assets/session-resume/v26.5.35/engine.js?v=26.5.35"></script>'
        ];
        if (!html.includes('member-ideal-compare/v26.5.32/engine.js')) html = html.replace('</body>', tags[0] + '\n</body>');
        if (!html.includes('session-resume/v26.5.35/engine.js')) html = html.replace('</body>', tags[1] + '\n</body>');
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