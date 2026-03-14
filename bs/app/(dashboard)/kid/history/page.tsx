'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getReadingHistory } from './actions'
import OfflineBanner from '@/components/OfflineBanner'
import LoadingScreen from '@/components/LoadingScreen'
import { cacheHistory, getCachedHistory, isOnline } from '@/utils/offlineCache'
import type { ReadingHistory } from '@/types'
import KidNav from '@/components/KidNav'

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<ReadingHistory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const offline = !navigator.onLine
    if (offline) {
      const cached = getCachedHistory()
      if (cached) setHistory(cached)
      setLoading(false)
      return
    }
    
    let timeoutFired = false
    const timeout = setTimeout(() => {
      timeoutFired = true
      const cached = getCachedHistory()
      if (cached) setHistory(cached)
      setLoading(false)
    }, 3000)
    
    try {
      const result = await getReadingHistory()
      if (!timeoutFired) {
        clearTimeout(timeout)
        if (result.success) {
          setHistory(result.data ?? null)
          if (result.data) cacheHistory(result.data)
        }
        setLoading(false)
      }
    } catch (error) {
      if (!timeoutFired) {
        clearTimeout(timeout)
        const cached = getCachedHistory()
        if (cached) setHistory(cached)
        setLoading(false)
      }
    }
  }

  const getCalendarDays = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push(dateStr)
    }
    return days
  }

  if (loading) {
    return <LoadingScreen />
  }

  const calendarDays = getCalendarDays()
  const completedSet = new Set(history?.completedDays || [])
  const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-slate-900 dark:text-slate-100 min-h-screen pb-24">
      <OfflineBanner />
      <header className="sticky top-0 z-50 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#59f20d]/10">
        <button onClick={() => router.back()} className="text-2xl">←</button>
        <h1 className="text-xl font-extrabold">My Progress</h1>
        <div className="w-8"></div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-6">
        <section className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#59f20d]/10 text-center">
            <div className="text-3xl mb-2">📚</div>
            <p className="text-2xl font-black">{history?.totalDays || 0}</p>
            <p className="text-xs font-bold text-slate-500 uppercase">Total Days</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#59f20d]/10 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-2xl font-black">{history?.currentStreak || 0}</p>
            <p className="text-xs font-bold text-slate-500 uppercase">Current</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#59f20d]/10 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-2xl font-black">{history?.longestStreak || 0}</p>
            <p className="text-xs font-bold text-slate-500 uppercase">Longest</p>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-[#59f20d]/10 mb-6">
          <h2 className="text-lg font-black mb-4">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const isCompleted = completedSet.has(day)
              const isFuture = day > today
              const dayNum = index + 1
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold ${
                    isFuture
                      ? 'bg-slate-50 dark:bg-slate-900 text-slate-300'
                      : isCompleted
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}
                  title={day}
                >
                  <span className="text-[10px] text-slate-500">{dayNum}</span>
                  {!isFuture && <span className="text-lg">{isCompleted ? '✅' : '❌'}</span>}
                </div>
              )
            })}
          </div>
        </section>
      </main>

        <KidNav active="history" />
    </div>
  )
}
