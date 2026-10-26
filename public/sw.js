/* public/sw.js — service worker de Sepect (PWA instalable + uso sin conexión).
   Sin dependencias: precache del shell, cache-first para assets con hash,
   network-first para navegaciones y fallback al index cacheado. */
const VERSION = 'sepect-sw-v2';
const CACHE = `sepect-cache-${VERSION}`;
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './cover/arcade-cover.png',
  './categories/programacion.png',
  './categories/idiomas.png',
  './categories/universidad.png',
  './categories/personalizados.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(
        SHELL.map(async (path) => {
          const response = await fetch(new Request(path, { cache: 'reload' }));
          if (response && response.ok) await cache.put(path, response);
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name !== CACHE).map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

function isAsset(url) {
  return url.pathname.includes('/assets/');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegaciones: red primero (contenido fresco) y respaldo al shell cacheado.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put('./index.html', response.clone());
          return response;
        } catch (error) {
          const cached = await caches.match('./index.html', { ignoreSearch: true });
          if (cached) return cached;
          const fallback = await caches.match('./', { ignoreSearch: true });
          if (fallback) return fallback;
          throw error;
        }
      })()
    );
    return;
  }

  // Assets con hash: cache primero (el nombre cambia en cada build).
  if (isAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      })()
    );
    return;
  }

  // Resto (íconos, manifest, carátula): cache primero con refresco en segundo plano.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const network = fetch(request)
        .then(async (response) => {
          if (response && response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => null);
      return cached || (await network) || Response.error();
    })()
  );
});
