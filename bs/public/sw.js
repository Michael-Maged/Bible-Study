const CACHE_NAME = 'bible-kids-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Only cache GET requests
  if (request.method !== 'GET') return
  
  // Only cache same-origin requests
  if (url.origin !== location.origin) return
  
  // Skip API calls and Supabase requests
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) return
  
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            cache.put(request, response.clone())
          }
          return response
        }).catch(() => cached) // Return cached on network error
        
        return cached || fetchPromise
      })
    })
  )
})
