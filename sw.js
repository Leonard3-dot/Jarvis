const C = 'lisa-v2';
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'index.html', 'manifest.json']).catch(() => {}))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || /googleapis\.com|workers\.dev/.test(u.hostname) && !/fonts/.test(u.hostname)) return;
  e.respondWith(fetch(r).then(res => {
    if ((res.ok || res.type === 'opaque') && (u.origin === location.origin || /cdnjs|jsdelivr|tailwindcss|fonts\.(googleapis|gstatic)/.test(u.hostname))) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
