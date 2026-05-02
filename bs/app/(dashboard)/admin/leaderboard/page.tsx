'use client'

import { useEffect, useState } from 'react'
import AdminNav from '@/components/AdminNav'
import OfflineBanner from '@/components/OfflineBanner'
import LoadingScreen from '@/components/LoadingScreen'
import { getAdminLeaderboard } from './actions'
import type { AdminLeaderboardUser } from '@/types'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function UserAvatar({ name, size = 40, amber = false }: { name: string; size?: number; amber?: boolean }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.38,
        background: amber ? '#c2851b' : '#f4e4c0',
        color: amber ? '#fff' : '#8a5a0f',
      }}
    >
      {getInitials(name)}
    </div>
  )
}

const PODIUM_HEIGHTS = [66, 90, 50]
const PODIUM_COLORS = ['#f0e8d6', '#c2851b', '#f4e4c0']
const PODIUM_TEXT = ['#8a7a5e', '#fff', '#8a5a0f']

export default function AdminLeaderboardPage() {
  const [users, setUsers] = useState<AdminLeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminLeaderboard().then(result => {
      if (result.success) setUsers(result.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingScreen />

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)
  const podiumOrder = [top3[1], top3[0], top3[2]]
  const podiumRanks = [2, 1, 3]

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <OfflineBanner />

      <main className="max-w-2xl mx-auto px-5 pt-6 space-y-4">

        {/* Header */}
        <div className="mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Class ranking</p>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">Leaderboard</h1>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <svg width="40" height="40" viewBox="0 0 20 20" fill="none" className="mb-3 opacity-30">
              <path d="M6 16V9h8v7M3 16V12h3v4M14 16v-5h3v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            <p className="font-medium text-sm">No students yet</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="flex items-end justify-center gap-2.5 pt-6 pb-2">
              {podiumOrder.map((user, i) => {
                if (!user) return <div key={i} className="flex-1 max-w-[96px]" />
                const rank = podiumRanks[i]
                const isFirst = rank === 1
                return (
                  <div key={user.id} className="flex flex-col items-center gap-2 flex-1 max-w-[96px]">
                    <div className="relative">
                      {isFirst && (
                        <svg
                          className="absolute -top-5 left-1/2 -translate-x-1/2"
                          width="22" height="16" viewBox="0 0 22 16" fill="none"
                        >
                          <path d="M2 14l2-9 4 4 3-7 3 7 4-4 2 9z" fill="#c2851b" stroke="#8a5a0f" strokeWidth="1" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <UserAvatar name={user.name} size={isFirst ? 52 : 42} amber={isFirst} />
                    </div>
                    <div className="text-[13px] font-bold text-center text-foreground truncate w-full px-1">
                      {user.name.split(' ')[0]}
                    </div>
                    <div className="text-[11px] font-bold text-[#8a5a0f]">
                      {user.current_score} pts
                    </div>
                    <div
                      className="w-full rounded-t-[10px] rounded-b-[4px] flex items-start justify-center pt-1.5"
                      style={{
                        height: PODIUM_HEIGHTS[i],
                        background: PODIUM_COLORS[i],
                        border: rank === 2 ? '1px solid #e4d8be' : 'none',
                        fontSize: 16, fontWeight: 800,
                        color: PODIUM_TEXT[i],
                      }}
                    >
                      {rank}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Ranked list */}
            {rest.length > 0 && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {rest.map((user, idx) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ borderTop: idx > 0 ? '1px solid var(--border)' : undefined }}
                  >
                    <span className="text-[13px] font-bold text-muted-foreground w-5 text-center">
                      {idx + 4}
                    </span>
                    <UserAvatar name={user.name} size={32} />
                    <span className="flex-1 text-sm font-semibold text-foreground truncate">{user.name}</span>
                    {user.gender && (
                      <span className="text-xs text-muted-foreground capitalize">{user.gender}</span>
                    )}
                    <span className="text-[13px] font-bold text-[#8a5a0f]">{user.current_score}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>

      <AdminNav active="leaderboard" />
    </div>
  )
}
