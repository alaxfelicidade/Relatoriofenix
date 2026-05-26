/* ============================================================
   SERVICE WORKER — Relatório Fênix PWA
   Versão: 1.0.0
   Cache: app-shell + static assets. Firebase vai pela rede.
   ============================================================ */

const CACHE_NAME = 'fenix-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json'
];

/* Instala: pré-cacheia o shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

/* Ativa: limpa caches velhos */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch: Firebase/CDN sempre pela rede; app shell do cache */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Firebase, CDN e APIs: sempre rede */
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('fonts') ||
    url.hostname.includes('flaticon') ||
    e.request.method !== 'GET'
  ) {
    return; /* deixa o browser tratar normalmente */
  }

  /* App shell: Cache First com fallback de rede */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
