const CACHE_KEY = 'today_reading_cache'
const STATS_CACHE_KEY = 'admin_stats_cache'

export function cacheReading(reading: any) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data: reading, timestamp: Date.now() }))
}

export function getCachedReading() {
  const cached = localStorage.getItem(CACHE_KEY)
  return cached ? JSON.parse(cached) : null
}

export function cacheStats(stats: any) {
  localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ data: stats, timestamp: Date.now() }))
}

export function getCachedStats() {
  const cached = localStorage.getItem(STATS_CACHE_KEY)
  return cached ? JSON.parse(cached).data : null
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(STATS_CACHE_KEY)
}

export function isOnline() {
  return navigator.onLine
}
