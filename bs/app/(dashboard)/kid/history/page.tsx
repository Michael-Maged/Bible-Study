'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getReadingHistory } from './actions'

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const result = await getReadingHistory()
    if (result.success) {
      setHistory(result.data)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/login'
  }

  const getCalendarDays = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isoDate = date.toISOString().split('T')[0]
      days.push(isoDate)
    }
    return days
  }

  if (loading) {
    return (
      <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-[#59f20d]">Loading...</div>
      </div>
    )
  }

  const calendarDays = getCalendarDays()
  const completedSet = new Set(history?.completedDays || [])
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-slate-900 dark:text-slate-100 min-h-screen pb-24">
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

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
          <div className="bg-slate-900 dark:bg-slate-800 rounded-full p-2 flex items-center justify-between shadow-2xl border border-white/10">
            <button onClick={() => router.push('/kid/dashboard')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
              <span className="text-2xl">📖</span>
              <span className="text-[10px] font-black uppercase mt-1">Reading</span>
            </button>
            <button className="flex-1 flex flex-col items-center justify-center py-2 bg-[#59f20d] rounded-full text-slate-900">
              <span className="text-2xl">📈</span>
              <span className="text-[10px] font-black uppercase mt-1">History</span>
            </button>
            <button onClick={() => router.push('/kid/leaderboard')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
              <span className="text-2xl">📊</span>
              <span className="text-[10px] font-black uppercase mt-1">Leaders</span>
            </button>
            <button onClick={() => router.push('/kid/profile')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
              <span className="text-2xl">👤</span>
              <span className="text-[10px] font-black uppercase mt-1">Profile</span>
            </button>
            <button onClick={handleLogout} className="flex-1 flex flex-col items-center justify-center py-2 text-red-500 hover:text-red-400 transition-colors">
              <span className="text-2xl">❌</span>
              <span className="text-[10px] font-black uppercase mt-1">Logout</span>
            </button>
          </div>
        </nav>
    </div>
  )
}
