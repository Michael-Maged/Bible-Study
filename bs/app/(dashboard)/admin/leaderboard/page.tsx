'use client'

import { useEffect, useState } from 'react'
import AdminNav from '@/components/AdminNav'
import LoadingScreen from '@/components/LoadingScreen'
import { getAdminLeaderboard } from './actions'
import type { AdminLeaderboardUser } from '@/types'

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
  const podiumHeights = ['h-20', 'h-28', 'h-16']
  const podiumRanks = [2, 1, 3]
  const podiumColors = ['border-slate-500', 'border-[#59f20d]', 'border-orange-500']
  const podiumBg = ['bg-slate-500/10', 'bg-[#59f20d]/10', 'bg-orange-500/10']

  return (
    <div className="bg-[#0d1a08] text-slate-100 min-h-screen pb-24">
      <header className="px-5 pt-12 pb-2">
        <p className="text-[#59f20d] text-xs font-bold uppercase tracking-widest mb-1">Rankings</p>
        <h1 className="text-2xl font-black tracking-tight">Leaderboard</h1>
      </header>

      <main className="pb-8">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-16 h-16 mb-3 opacity-30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="font-bold">No students yet</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="px-5 pt-8 pb-6 flex items-end justify-center gap-3">
              {podiumOrder.map((user, i) => user && (
                <div key={user.id} className="flex flex-col items-center gap-2" style={{ flex: i === 1 ? '0 0 36%' : '0 0 28%' }}>
                  <div className={`relative w-full aspect-square rounded-2xl border-2 ${podiumBg[i]} ${podiumColors[i]} flex items-center justify-center text-4xl`}>
                    {user.gender === 'female' ? '👧' : '👦'}
                    <div className={`absolute -top-3 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 border-[#0d1a08] ${
                      i === 1 ? 'bg-[#59f20d] text-[#0d1a08]' : i === 0 ? 'bg-slate-500 text-white' : 'bg-orange-500 text-white'
                    }`}>{podiumRanks[i]}</div>
                  </div>
                  <div className={`w-full ${podiumHeights[i]} rounded-t-xl flex flex-col items-center justify-end pb-2 ${
                    i === 1 ? 'bg-[#59f20d]/20 border border-[#59f20d]/30' : 'bg-[#1a2e12] border border-[#59f20d]/10'
                  }`}>
                    <p className="text-[10px] font-black truncate w-full text-center px-1">{user.name.split(' ')[0]}</p>
                    <p className={`text-xs font-black ${i === 1 ? 'text-[#59f20d]' : 'text-slate-400'}`}>{user.current_score}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Rest */}
            <div className="px-5 space-y-2">
              {rest.map((user, idx) => (
                <div key={user.id} className="flex items-center gap-3 bg-[#1a2e12] rounded-2xl p-4 border border-[#59f20d]/10">
                  <span className="text-slate-600 font-black w-5 text-center text-sm">{idx + 4}</span>
                  <div className="w-10 h-10 rounded-xl bg-[#0d1a08] flex items-center justify-center text-xl flex-shrink-0">
                    {user.gender === 'female' ? '👧' : '👦'}
                  </div>
                  <p className="flex-1 font-bold text-sm truncate">{user.name}</p>
                  <span className="text-xs font-black text-[#59f20d] bg-[#59f20d]/10 px-3 py-1 rounded-full">
                    {user.current_score} pts
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <AdminNav active="leaderboard" />
    </div>
  )
}
