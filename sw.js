/* ============================================================
   SERVICE WORKER — Relatório Fênix PWA
   Versão: 2.0.0
   Estratégia: Cache-First para shell, Network-First para dados.
   ============================================================ */

const CACHE_NAME = 'fenix-v2';
const SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

/* Instala e pré-cacheia o app shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

/* Ativa e limpa caches antigos */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Fetch: Firebase/CDN pela rede; app shell do cache */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Requisições não-GET e APIs externas: rede direta */
  if (
    e.request.method !== 'GET' ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('fonts') ||
    url.hostname.includes('flaticon') ||
    url.hostname.includes('wikipedia')
  ) {
    return; /* browser trata normalmente */
  }

  /* App shell: Cache First com fallback de rede */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
