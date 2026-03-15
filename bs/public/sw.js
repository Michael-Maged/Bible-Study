const CACHE_NAME = 'bible-kids-v3'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Bible Study App', {
      body: data.body,
      icon: '/bible.svg',
      badge: '/bible.svg',
      data: { url: data.url ?? '/admin/pending' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/admin/pending'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.origin !== location.origin) return
  if (url.pathname.includes('/api/')) return
  if (url.hostname.includes('supabase')) return
  // Never cache Next.js JS/CSS chunks — they have their own versioning
  if (url.pathname.startsWith('/_next/')) return

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          })
          .catch(() => cached)
        return cached || fetchPromise
      })
    )
  )
})
