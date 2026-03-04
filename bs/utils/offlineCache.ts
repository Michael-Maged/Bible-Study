const CACHE_KEY = 'today_reading_cache'
const STATS_CACHE_KEY = 'admin_stats_cache'
const HISTORY_CACHE_KEY = 'user_history_cache'
const LEADERBOARD_CACHE_KEY = 'leaderboard_cache'
const PROFILE_CACHE_KEY = 'user_profile_cache'

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

export function cacheHistory(history: any) {
  localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify({ data: history, timestamp: Date.now() }))
}

export function getCachedHistory() {
  const cached = localStorage.getItem(HISTORY_CACHE_KEY)
  return cached ? JSON.parse(cached).data : null
}

export function cacheLeaderboard(leaderboard: any) {
  localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({ data: leaderboard, timestamp: Date.now() }))
}

export function getCachedLeaderboard() {
  const cached = localStorage.getItem(LEADERBOARD_CACHE_KEY)
  return cached ? JSON.parse(cached).data : null
}

export function cacheProfile(profile: any) {
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ data: profile, timestamp: Date.now() }))
}

export function getCachedProfile() {
  const cached = localStorage.getItem(PROFILE_CACHE_KEY)
  return cached ? JSON.parse(cached).data : null
}

export async function preloadAllData(actions: {
  getTodayReading: () => Promise<any>,
  getUserProfile: () => Promise<any>,
  getReadingHistory: () => Promise<any>,
  getLeaderboard: () => Promise<any>,
  getCurrentUserRank: () => Promise<any>
}) {
  try {
    const [reading, profile, history, leaderboard, userRank] = await Promise.all([
      actions.getTodayReading(),
      actions.getUserProfile(),
      actions.getReadingHistory(),
      actions.getLeaderboard(),
      actions.getCurrentUserRank()
    ])

    if (reading.success) cacheReading(reading.data)
    if (profile.success) cacheProfile(profile.data)
    if (history.success) cacheHistory(history.data)
    if (leaderboard.success && userRank.success) {
      cacheLeaderboard({ users: leaderboard.data, currentUser: userRank.data })
    }
  } catch (error) {
    console.error('Preload failed:', error)
  }
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(STATS_CACHE_KEY)
  localStorage.removeItem(HISTORY_CACHE_KEY)
  localStorage.removeItem(LEADERBOARD_CACHE_KEY)
  localStorage.removeItem(PROFILE_CACHE_KEY)
}

export function isOnline() {
  return navigator.onLine
}
