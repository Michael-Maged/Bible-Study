'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getDashboardStats, getAnalytics, getTodayAdminReading } from './actions'
import type { Analytics } from './actions'
import { bibleBooks } from '@/constants/bibleBooks'
import { cacheStats, getCachedStats, isOnline } from '@/utils/offlineCache'
import OfflineBanner from '@/components/OfflineBanner'
import AdminNav from '@/components/AdminNav'
import PushSubscriber from '@/components/PushSubscriber'

export default function AdminDashboard() {
  const [userRole, setUserRole] = useState<string>('')
  const [stats, setStats] = useState({ totalUsers: 0, pendingCount: 0, lastUpdated: '' })
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [todayReading, setTodayReading] = useState<{ book: number; chapter: number; fromVerse: number; toVerse: number; verseCount: number } | null | undefined>(undefined)
  const router = useRouter()

  const loadStats = async () => {
    if (!isOnline()) {
      const cached = getCachedStats()
      if (cached) setStats(cached)
      return
    }
    const result = await getDashboardStats()
    if (result.success && result.data) {
      setStats(result.data)
      cacheStats(result.data)
    } else {
      const cached = getCachedStats()
      if (cached) setStats(cached)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const role = document.cookie.split('; ').find(row => row.startsWith('user-role='))?.split('=')[1]
      
      if (!session || (role !== 'admin' && role !== 'superuser')) {
        router.push('/login')
      } else {
        setUserRole(role || '')
        loadStats()
        getAnalytics().then(r => { if (r.success && r.data) setAnalytics(r.data) })
        getTodayAdminReading().then(r => { setTodayReading(r.success ? r.data : null) })
      }
    }
    checkAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-[#121c0d] dark:text-white min-h-screen pb-24">
      <OfflineBanner />
      <PushSubscriber />
      <header className="sticky top-0 z-20 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-[#59f20d]/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700">
            <span className="text-2xl">📖</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">{userRole === 'superuser' ? 'Superuser' : 'Admin'} Dashboard</h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">Manage Bible Study</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[#59f20d] text-2xl">📊</span>
            <h2 className="text-lg font-bold">Quick Stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{userRole === 'admin' ? 'Total Users' : 'Total Kids'}</p>
              <p className="text-3xl font-bold text-[#59f20d]">{stats.totalUsers}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Pending</p>
              <p className="text-3xl font-bold text-orange-500">{stats.pendingCount}</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[#59f20d] text-2xl">📅</span>
            <h2 className="text-lg font-bold">Today&apos;s Reading</h2>
          </div>
          {todayReading === undefined ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 flex justify-center">
              <div className="w-6 h-6 border-4 border-[#59f20d] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : todayReading === null ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
              <p className="text-zinc-400 text-sm font-medium">No reading assigned for today</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#59f20d]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📖</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-base truncate">{bibleBooks.find(b => b.id === todayReading.book)?.name ?? `Book ${todayReading.book}`}</p>
                  <p className="text-sm text-zinc-500 font-medium">Chapter {todayReading.chapter} · Verses {todayReading.fromVerse}–{todayReading.toVerse}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-[#59f20d]">{todayReading.verseCount}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Verses</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[#59f20d] text-2xl">📈</span>
            <h2 className="text-lg font-bold">Analytics</h2>
          </div>

          {!analytics ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 text-center shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="w-8 h-8 border-4 border-[#59f20d] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">📖 Reading Rate</p>
                  <p className="text-3xl font-black text-[#59f20d]">{analytics.overallReadingPct}%</p>
                  <div className="mt-2 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#59f20d] rounded-full transition-all" style={{ width: `${analytics.overallReadingPct}%` }} />
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">✅ Correct Answers</p>
                  <p className="text-3xl font-black text-blue-500">{analytics.overallCorrectPct}%</p>
                  <div className="mt-2 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${analytics.overallCorrectPct}%` }} />
                  </div>
                </div>
              </div>

              {analytics.byClass.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Per Class</p>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {analytics.byClass.map(cls => (
                      <div key={cls.className} className="px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm">{cls.className}</p>
                          <span className="text-xs text-zinc-400">{cls.totalKids} kids</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-zinc-400 w-16">📖 Reading</span>
                            <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-[#59f20d] rounded-full" style={{ width: `${cls.readingPct}%` }} />
                            </div>
                            <span className="text-xs font-black text-[#59f20d] w-8 text-right">{cls.readingPct}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-zinc-400 w-16">✅ Correct</span>
                            <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${cls.correctPct}%` }} />
                            </div>
                            <span className="text-xs font-black text-blue-500 w-8 text-right">{cls.correctPct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <AdminNav active="dashboard" />
    </div>
  )
}
