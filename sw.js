// Louis // Core : service worker (fonctionnement hors ligne, mises à jour automatiques)
const V = 'louis-v1';
const LOCAL = ['./', 'index.html', 'manifest.json', 'icon.svg', 'icon-192.png'];
const CDN = [
  'https://cdn.tailwindcss.com/3.4.17',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.js'
];
const CDN_HOSTS = ['cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(async c => {
    await Promise.all(LOCAL.map(u => c.add(u).catch(() => {})));
    await Promise.all(CDN.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
  }));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const keep = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(req, cp)); } return res; };

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const local = u.origin === location.origin, cdn = CDN_HOSTS.includes(u.hostname);
  if (!local && !cdn) return; // l'API Gemini passe toujours par le réseau
  if (local) {
    // Fichiers de l'app : réseau d'abord (mises à jour sans changer de version), cache en secours hors ligne
    e.respondWith(fetch(r).then(res => keep(r, res)).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
  } else {
    // Bibliothèques externes : cache d'abord, rafraîchi en arrière-plan
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => keep(r, res))));
    e.waitUntil(fetch(r).then(res => keep(r, res)).catch(() => {}));
  }
});
