'use client'

import { getReadingHistory } from './actions'
import OfflineBanner from '@/components/OfflineBanner'
import LoadingScreen from '@/components/LoadingScreen'
import { cacheHistory, getCachedHistory } from '@/utils/offlineCache'
import KidNav from '@/components/KidNav'
import { useOfflineData } from '@/hooks/useOfflineData'

export default function HistoryPage() {
  const { data: history, loading } = useOfflineData(getReadingHistory, getCachedHistory, cacheHistory)

  if (loading) return <LoadingScreen />

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const completedSet = new Set(history?.completedDays || [])

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
  )

  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-[#0d1a08] text-slate-100 min-h-screen pb-24">
      <OfflineBanner />
      <header className="px-5 pt-12 pb-6">
        <p className="text-[#59f20d] text-xs font-bold uppercase tracking-widest mb-1">Progress</p>
        <h1 className="text-2xl font-black tracking-tight">My History</h1>
      </header>

      <main className="px-5 space-y-5 max-w-md mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '📚', label: 'Total Days', value: history?.totalDays || 0, color: 'text-slate-100' },
            { icon: '🔥', label: 'Streak', value: history?.currentStreak || 0, color: 'text-orange-400' },
            { icon: '⚡', label: 'Best', value: history?.longestStreak || 0, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1a2e12] rounded-2xl p-4 text-center border border-[#59f20d]/10">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-[#1a2e12] rounded-2xl border border-[#59f20d]/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#59f20d]/10 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#59f20d] rounded-full" />
            <p className="font-bold text-sm">{monthName}</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <p key={i} className="text-center text-[10px] font-black text-slate-600 uppercase">{d}</p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const done = completedSet.has(day)
                const future = day > today
                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center ${
                      future ? 'bg-[#0d1a08]' :
                      done ? 'bg-[#59f20d]/20 border border-[#59f20d]/40' :
                      'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${future ? 'text-slate-700' : done ? 'text-[#59f20d]' : 'text-red-400'}`}>
                      {i + 1}
                    </span>
                    {!future && (
                      <span className="text-[8px]">{done ? '✓' : '✗'}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="px-5 pb-4 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#59f20d]/20 border border-[#59f20d]/40 inline-block" /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/10 border border-red-500/20 inline-block" /> Missed
            </span>
          </div>
        </div>
      </main>

      <KidNav active="history" />
    </div>
  )
}
