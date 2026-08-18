const SW_VERSION = 'sug-v24-3-invite-setup-network-only';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => { event.respondWith(fetch(event.request)); });
