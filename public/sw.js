// Service worker de la PWA de Alejandra Salón.
// Estrategia deliberadamente simple y conservadora:
//  - Nunca cachea /api/* ni llamadas a Supabase: esos datos deben ser siempre frescos.
//  - Páginas (navegación): red primero, con respaldo en caché y una página offline final.
//  - Archivos estáticos (JS/CSS/íconos/fuentes de Next): caché primero, luego red.
// Sube CACHE_VERSION cuando quieras forzar que los usuarios reciban los assets nuevos.
const CACHE_VERSION = 'v1'
const CACHE_NAME = `salon-belleza-${CACHE_VERSION}`
const OFFLINE_URL = '/offline.html'

const PRECACHE_URLS = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        // Si algún recurso falla al precachear (ej. sin red durante el build/deploy),
        // no rompemos la instalación del service worker.
      })
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event

  // Solo interceptamos peticiones GET; todo lo demás (POST/PUT/DELETE) pasa directo a la red.
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Nunca cachear la API propia ni las llamadas directas a Supabase: siempre deben
  // reflejar el estado real (citas, disponibilidad, sesión, etc.)
  if (url.pathname.startsWith('/api/') || url.hostname.endsWith('.supabase.co')) {
    return
  }

  // Navegación entre páginas: red primero; si falla, caché; si tampoco hay caché, página offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match(OFFLINE_URL)))
    )
    return
  }

  // Archivos estáticos: caché primero (rápido y funciona offline), luego red.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
    })
  )
})
