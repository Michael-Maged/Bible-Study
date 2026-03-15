import type { TodayReading, UserProfile, ReadingHistory, AdminStats, AdminReading, LeaderboardUser, CurrentUserRank } from '@/types'

type LeaderboardCache = { users: LeaderboardUser[]; currentUser: CurrentUserRank | null }
type ReadingCache = { data: TodayReading | null; timestamp: number }

const CACHE_KEY = 'today_reading_cache'
const STATS_CACHE_KEY = 'admin_stats_cache'
const HISTORY_CACHE_KEY = 'user_history_cache'
const ADMIN_HISTORY_CACHE_KEY = 'admin_history_cache'
const LEADERBOARD_CACHE_KEY = 'leaderboard_cache'
const PROFILE_CACHE_KEY = 'user_profile_cache'

export function cacheReading(reading: TodayReading | null) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data: reading, timestamp: Date.now() }))
}

export function getCachedReading(): ReadingCache | null {
  const cached = localStorage.getItem(CACHE_KEY)
  return cached ? JSON.parse(cached) : null
}

export function cacheStats(stats: AdminStats) {
  localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ data: stats, timestamp: Date.now() }))
}

export function getCachedStats(): AdminStats | null {
  const cached = localStorage.getItem(STATS_CACHE_KEY)
  return cached ? JSON.parse(cached).data : null
}

export function cacheHistory(history: ReadingHistory) {
  localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify({ data: history, timestamp: Date.now() }))
}

export function getCachedHistory(): ReadingHistory | null {
  const cached = localStorage.getItem(HISTORY_CACHE_KEY)
  return cached ? JSON.parse(cached).data : null
}

export function cacheLeaderboard(leaderboard: LeaderboardCache) {
  localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({ data: leaderboard, timestamp: Date.now() }))
}

export function getCachedLeaderboard(): LeaderboardCache | null {
  const cached = localStorage.getItem(LEADERBOARD_CACHE_KEY)
  return cached ? JSON.parse(cached).data : null
}

export function cacheProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ data: profile, timestamp: Date.now() }))
}

export function getCachedProfile(): UserProfile | null {
  const cached = localStorage.getItem(PROFILE_CACHE_KEY)
  return cached ? JSON.parse(cached).data : null
}

export function cacheAdminHistory(history: AdminReading[]) {
  localStorage.setItem(ADMIN_HISTORY_CACHE_KEY, JSON.stringify({ data: history, timestamp: Date.now() }))
}

export function getCachedAdminHistory(): AdminReading[] | null {
  const cached = localStorage.getItem(ADMIN_HISTORY_CACHE_KEY)
  return cached ? JSON.parse(cached).data : null
}

export async function preloadAllData(actions: {
  getTodayReading: () => Promise<{ success: boolean; data?: TodayReading }>,
  getUserProfile: () => Promise<{ success: boolean; data?: UserProfile }>,
  getReadingHistory: () => Promise<{ success: boolean; data?: ReadingHistory }>,
  getLeaderboard: () => Promise<{ success: boolean; data?: LeaderboardUser[] }>,
  getCurrentUserRank: () => Promise<{ success: boolean; data?: CurrentUserRank }>
}) {
  try {
    const [reading, profile, history, leaderboard, userRank] = await Promise.all([
      actions.getTodayReading(),
      actions.getUserProfile(),
      actions.getReadingHistory(),
      actions.getLeaderboard(),
      actions.getCurrentUserRank()
    ])

    if (reading.success) cacheReading(reading.data ?? null)
    if (profile.success && profile.data) cacheProfile(profile.data)
    if (history.success && history.data) cacheHistory(history.data)
    if (leaderboard.success && userRank.success) {
      cacheLeaderboard({ users: leaderboard.data ?? [], currentUser: userRank.data ?? null })
    }
  } catch (error) {
    console.error('Preload failed:', error)
  }
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(STATS_CACHE_KEY)
  localStorage.removeItem(HISTORY_CACHE_KEY)
  localStorage.removeItem(ADMIN_HISTORY_CACHE_KEY)
  localStorage.removeItem(LEADERBOARD_CACHE_KEY)
  localStorage.removeItem(PROFILE_CACHE_KEY)
}

export function isOnline() {
  return navigator.onLine
}
