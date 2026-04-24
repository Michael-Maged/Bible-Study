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

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayNum = today.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay() // 0=Sun

  const completedSet = new Set(history?.completedDays || [])
  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(todayNum).padStart(2, '0')}`

  const monthLabel = today.toLocaleString('default', { month: 'long', year: 'numeric' })

  // completion rate
  const pastDays = todayNum
  const completedCount = history?.completedDays?.filter((d: string) => d <= todayStr).length ?? 0
  const completionRate = pastDays > 0 ? Math.round((completedCount / pastDays) * 100) : 0

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <OfflineBanner />

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-4">

        {/* Page header */}
        <div className="mb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{monthLabel}</p>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">Your month</h1>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: history?.longestStreak ?? 0, label: 'Longest streak', accent: true },
            { value: `${completionRate}%`, label: 'Completion', accent: false },
            { value: history?.totalDays ?? 0, label: 'Days read', accent: false },
          ].map(({ value, label, accent }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-3">
              <div
                className="text-[22px] font-bold tracking-tight leading-none"
                style={{ color: accent ? 'var(--primary)' : 'var(--foreground)' }}
              >
                {value}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-1.5">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-card p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map((d, i) => (
              <div key={i} className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1 justify-items-center">
            {/* leading blanks */}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`blank-${i}`} className="w-[34px] h-[34px]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = day === todayNum
              const isFuture = day > todayNum
              const isCompleted = completedSet.has(dateStr)
              const isMissed = !isFuture && !isCompleted && !isToday

              let style: React.CSSProperties = {}
              let textColor = ''

              if (isToday) {
                style = {
                  background: '#f4e4c0',
                  border: '2px solid #c2851b',
                  borderRadius: 10,
                }
                textColor = '#8a5a0f'
              } else if (isCompleted) {
                style = { background: '#c2851b', borderRadius: 10 }
                textColor = '#fff'
              } else if (isMissed) {
                style = {
                  background: 'rgba(166,66,66,0.10)',
                  border: '1px solid rgba(166,66,66,0.28)',
                  borderRadius: 10,
                }
                textColor = '#a64242'
              } else if (isFuture) {
                style = { borderRadius: 10, opacity: 0.4 }
                textColor = 'var(--muted-foreground)'
              }

              return (
                <div
                  key={day}
                  className="w-[34px] h-[34px] flex items-center justify-center text-[13px] font-semibold"
                  style={{ color: textColor || 'var(--muted-foreground)', ...style }}
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: '#c2851b' }} />
              <span className="text-[11px] font-semibold text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: 'rgba(166,66,66,0.10)', border: '1px solid rgba(166,66,66,0.28)' }} />
              <span className="text-[11px] font-semibold text-muted-foreground">Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: '#f4e4c0', border: '2px solid #c2851b' }} />
              <span className="text-[11px] font-semibold text-muted-foreground">Today</span>
            </div>
          </div>
        </div>

      </main>

      <KidNav active="history" />
    </div>
  )
}
