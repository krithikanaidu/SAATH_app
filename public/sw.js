/* SAATH service worker — app-shell caching only.
 *
 * Policy:
 *   - Navigation requests: network-first, fall back to cached index.html (offline SPA).
 *   - Same-origin static assets (hashed by Vite): cache-first, safe to keep.
 *   - NEVER cache: cross-origin requests, or anything under /api/ (sensitive data).
 *   - Old caches are purged on activate so deploys propagate safely.
 */
const VERSION = 'saath-v1'
const SHELL = `${VERSION}-shell`
const ASSETS = `${VERSION}-assets`
const OFFLINE_URL = '/index.html'

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then(cache =>
        cache.addAll([
          OFFLINE_URL,
          '/manifest.webmanifest',
          '/icons/icon-192.png',
          '/icons/icon-512.png',
          // self-hosted fonts — needed for offline fidelity
          '/fonts/inter-latin-var.woff2',
          '/fonts/bebas-neue-latin.woff2',
          '/fonts/noto-devanagari-var.woff2',
        ]),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => !key.startsWith(VERSION))
            .map(key => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never touch cross-origin or API traffic.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // Navigations: network-first so new deploys win, cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(SHELL).then(cache => cache.put(OFFLINE_URL, copy))
          return response
        })
        .catch(() => caches.match(OFFLINE_URL)),
    )
    return
  }

  // Hashed static assets: cache-first (filename changes on every build).
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        cached =>
          cached ||
          fetch(request).then(response => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(ASSETS).then(cache => cache.put(request, copy))
            }
            return response
          }),
      ),
    )
    return
  }

  // Everything else (fonts, manifest): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(ASSETS).then(cache => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
