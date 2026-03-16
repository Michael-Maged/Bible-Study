'use client'

import { useEffect, useState } from 'react'
import { getLeaderboard, getCurrentUserRank } from './actions'
import OfflineBanner from '@/components/OfflineBanner'
import LoadingScreen from '@/components/LoadingScreen'
import { cacheLeaderboard, getCachedLeaderboard, isOnline } from '@/utils/offlineCache'
import type { LeaderboardUser, CurrentUserRank } from '@/types'
import KidNav from '@/components/KidNav'

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUserRank | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!navigator.onLine) {
      const cached = getCachedLeaderboard()
      if (cached) { setUsers(cached.users || []); setCurrentUser(cached.currentUser || null) }
      setLoading(false); return
    }
    try {
      const [lb, rank] = await Promise.all([getLeaderboard(), getCurrentUserRank()])
      if (lb.success) setUsers(lb.data)
      if (rank.success) setCurrentUser(rank.data ?? null)
      cacheLeaderboard({ users: lb.data, currentUser: rank.data ?? null })
    } catch {
      const cached = getCachedLeaderboard()
      if (cached) { setUsers(cached.users || []); setCurrentUser(cached.currentUser || null) }
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!isOnline()) {
      const cached = getCachedLeaderboard()
      if (cached) { setUsers(cached.users || []); setCurrentUser(cached.currentUser || null) }
      setLoading(false)
    } else { loadData() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <LoadingScreen />

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)
  const podiumOrder = [top3[1], top3[0], top3[2]]
  const podiumHeights = ['h-20', 'h-28', 'h-16']
  const podiumRanks = [2, 1, 3]
  const podiumColors = ['border-slate-500', 'border-[#59f20d]', 'border-orange-500']
  const podiumBg = ['bg-slate-500/10', 'bg-[#59f20d]/10', 'bg-orange-500/10']

  const ordSuffix = (n: number) => n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'

  return (
    <div className="bg-[#0d1a08] text-slate-100 min-h-screen pb-36">
      <OfflineBanner />
      <header className="px-5 pt-12 pb-2">
        <p className="text-[#59f20d] text-xs font-bold uppercase tracking-widest mb-1">Rankings</p>
        <h1 className="text-2xl font-black tracking-tight">Top Explorers</h1>
      </header>

      <main className="pb-4">
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
      </main>

      {/* Current user sticky bar */}
      {currentUser && (
        <div className="fixed bottom-[72px] left-0 right-0 px-5 z-10">
          <div className="max-w-md mx-auto bg-[#59f20d] rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-[#59f20d]/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0d1a08]/20 flex items-center justify-center font-black text-[#0d1a08] text-lg">
                {currentUser.rank}{ordSuffix(currentUser.rank)}
              </div>
              <div>
                <p className="font-black text-[#0d1a08] leading-none">{currentUser.name}</p>
                <p className="text-[10px] font-bold text-[#0d1a08]/60 uppercase">{currentUser.rank <= 10 ? 'Top 10!' : 'Keep going!'}</p>
              </div>
            </div>
            <div className="bg-[#0d1a08]/20 px-3 py-1.5 rounded-xl">
              <span className="font-black text-[#0d1a08] text-sm">{currentUser.score} pts</span>
            </div>
          </div>
        </div>
      )}

      <KidNav active="leaderboard" />
    </div>
  )
}
