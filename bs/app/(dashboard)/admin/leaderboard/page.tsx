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

  const topThree = users.slice(0, 3)
  const restUsers = users.slice(3)

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#59f20d] p-2 rounded-full shadow-lg shadow-[#59f20d]/20">
            <span className="text-white font-bold text-xl">🏆</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Leaderboard</h1>
        </div>
      </header>

      <main className="flex-1 pb-40">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <span className="text-4xl mb-3">📭</span>
            <p className="font-medium">No students found</p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-12 pb-8 flex items-end justify-center gap-2 sm:gap-6">
              {topThree[1] && (
                <div className="flex flex-col items-center group">
                  <div className="relative mb-2">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden shadow-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-3xl">
                      {topThree[1].gender === 'female' ? '👧' : '👦'}
                    </div>
                    <div className="absolute -bottom-2 -right-1 bg-slate-300 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">2</div>
                  </div>
                  <p className="text-sm font-bold truncate w-20 text-center">{topThree[1].name}</p>
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{topThree[1].current_score} pts</span>
                </div>
              )}

              {topThree[0] && (
                <div className="flex flex-col items-center scale-110">
                  <div className="relative mb-4">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 text-4xl">🏆</div>
                    <div className="w-24 h-24 rounded-full border-4 border-[#59f20d] overflow-hidden shadow-xl shadow-[#59f20d]/20 bg-[#59f20d]/20 flex items-center justify-center text-5xl">
                      {topThree[0].gender === 'female' ? '👧' : '👦'}
                    </div>
                    <div className="absolute -bottom-2 -right-1 bg-[#59f20d] text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-white">1</div>
                  </div>
                  <p className="text-base font-bold">{topThree[0].name}</p>
                  <span className="text-xs uppercase font-bold text-white bg-[#59f20d] px-3 py-1 rounded-full shadow-sm">{topThree[0].current_score} pts</span>
                </div>
              )}

              {topThree[2] && (
                <div className="flex flex-col items-center group">
                  <div className="relative mb-2">
                    <div className="w-16 h-16 rounded-full border-4 border-orange-300 overflow-hidden shadow-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-3xl">
                      {topThree[2].gender === 'female' ? '👧' : '👦'}
                    </div>
                    <div className="absolute -bottom-2 -right-1 bg-orange-300 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">3</div>
                  </div>
                  <p className="text-sm font-bold truncate w-20 text-center">{topThree[2].name}</p>
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{topThree[2].current_score} pts</span>
                </div>
              )}
            </div>

            <div className="px-6 space-y-3">
              {restUsers.map((user, idx) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 font-bold w-4 text-center">{idx + 4}</span>
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
                      {user.gender === 'female' ? '👧' : '👦'}
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
                  </div>
                  <div className="bg-[#59f20d]/10 px-3 py-1 rounded-full">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{user.current_score}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <AdminNav active="leaderboard" />

      <div className="fixed top-20 -left-10 w-40 h-40 bg-[#59f20d]/5 rounded-full blur-3xl -z-10"></div>
      <div className="fixed bottom-40 -right-10 w-60 h-60 bg-[#59f20d]/10 rounded-full blur-3xl -z-10"></div>
    </div>
  )
}
