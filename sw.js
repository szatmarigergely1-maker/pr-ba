const C = 'strng-training-v14-home-estimates';
const SHELL = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(C).then(async cache => {
  // The app is required; optional icons must not break installation.
  await cache.add('./index.html');
  await Promise.allSettled(SHELL.slice(1).map(path => cache.add(path)));
})));
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('strng-training-') && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if(req.method !== 'GET' || url.origin !== location.origin || url.search || url.hash) return;
  // WOD freshness and offline fallback are handled explicitly in the app.
  if(url.pathname.endsWith('/coach-wods.json')) return;
  if(!req.mode.includes('navigate') && !SHELL.some(p => url.pathname.endsWith(p.slice(1)))) return;
  event.respondWith(fetch(req).then(res => {
    if(res.ok) event.waitUntil(caches.open(C).then(cache => cache.put(req, res.clone())));
    return res;
  }).catch(() => caches.match(req).then(cached => cached || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
