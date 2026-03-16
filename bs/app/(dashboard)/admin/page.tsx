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
  const [userRole, setUserRole] = useState('')
  const [stats, setStats] = useState({ totalUsers: 0, pendingCount: 0, lastUpdated: '' })
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [todayReading, setTodayReading] = useState<{ book: string; chapter: number; fromVerse: number; toVerse: number; verseCount: number } | null | undefined>(undefined)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const role = document.cookie.split('; ').find(r => r.startsWith('user-role='))?.split('=')[1]
      if (!session || (role !== 'admin' && role !== 'superuser')) {
        router.push('/login')
        return
      }
      setUserRole(role || '')
      if (!isOnline()) {
        const cached = getCachedStats()
        if (cached) setStats(cached)
      } else {
        const result = await getDashboardStats()
        if (result.success && result.data) { setStats(result.data); cacheStats(result.data) }
        else { const cached = getCachedStats(); if (cached) setStats(cached) }
      }
      getAnalytics().then(r => { if (r.success && r.data) setAnalytics(r.data) })
      getTodayAdminReading().then(r => { setTodayReading(r.success ? r.data : null) })
    }
    checkAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-[#0d1a08] text-slate-100 min-h-screen pb-24">
      <OfflineBanner />
      <PushSubscriber />

      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-[#59f20d] text-xs font-bold uppercase tracking-widest mb-1">
              {userRole === 'superuser' ? 'Superuser' : 'Admin'}
            </p>
            <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#59f20d]/10 border border-[#59f20d]/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#59f20d" strokeWidth={1.5} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-5 max-w-md mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#59f20d] rounded-2xl p-5">
            <p className="text-[#0d1a08] text-xs font-bold uppercase tracking-wider mb-2">
              {userRole === 'admin' ? 'Total Users' : 'Total Kids'}
            </p>
            <p className="text-[#0d1a08] text-4xl font-black">{stats.totalUsers}</p>
          </div>
          <div className="bg-[#1a2e12] rounded-2xl p-5 border border-[#59f20d]/10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pending</p>
            <p className="text-orange-400 text-4xl font-black">{stats.pendingCount}</p>
          </div>
        </div>

        {/* Today's Reading */}
        <div className="bg-[#1a2e12] rounded-2xl border border-[#59f20d]/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#59f20d]/10 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#59f20d] rounded-full" />
            <p className="font-bold text-sm">Today&apos;s Reading</p>
          </div>
          <div className="p-5">
            {todayReading === undefined ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-[#59f20d]/30 border-t-[#59f20d] rounded-full animate-spin" />
              </div>
            ) : todayReading === null ? (
              <p className="text-slate-500 text-sm text-center py-2">No reading assigned for today</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#59f20d]/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#59f20d]/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#59f20d" strokeWidth={1.5} className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-base truncate">
                    {bibleBooks.find(b => b.id === Number(todayReading.book))?.name ?? `Book ${todayReading.book}`}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Ch. {todayReading.chapter} · v.{todayReading.fromVerse}–{todayReading.toVerse}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-[#59f20d]">{todayReading.verseCount}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">verses</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-[#1a2e12] rounded-2xl border border-[#59f20d]/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#59f20d]/10 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#59f20d] rounded-full" />
            <p className="font-bold text-sm">Analytics</p>
          </div>
          {!analytics ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#59f20d]/30 border-t-[#59f20d] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0d1a08] rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reading Rate</p>
                  <p className="text-3xl font-black text-[#59f20d] mb-2">{analytics.overallReadingPct}%</p>
                  <div className="h-1.5 bg-[#59f20d]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#59f20d] rounded-full" style={{ width: `${analytics.overallReadingPct}%` }} />
                  </div>
                </div>
                <div className="bg-[#0d1a08] rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quiz Score</p>
                  <p className="text-3xl font-black text-blue-400 mb-2">{analytics.overallCorrectPct}%</p>
                  <div className="h-1.5 bg-blue-400/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${analytics.overallCorrectPct}%` }} />
                  </div>
                </div>
              </div>
              {analytics.byClass.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">By Class</p>
                  {analytics.byClass.map(cls => (
                    <div key={cls.className} className="bg-[#0d1a08] rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">{cls.className}</p>
                        <span className="text-xs text-slate-500 bg-[#1a2e12] px-2 py-0.5 rounded-full">{cls.totalKids} kids</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 w-12">Reading</span>
                          <div className="flex-1 h-1.5 bg-[#59f20d]/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#59f20d] rounded-full" style={{ width: `${cls.readingPct}%` }} />
                          </div>
                          <span className="text-xs font-black text-[#59f20d] w-8 text-right">{cls.readingPct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 w-12">Quiz</span>
                          <div className="flex-1 h-1.5 bg-blue-400/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${cls.correctPct}%` }} />
                          </div>
                          <span className="text-xs font-black text-blue-400 w-8 text-right">{cls.correctPct}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <AdminNav active="dashboard" />
    </div>
  )
}
