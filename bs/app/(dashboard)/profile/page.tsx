'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUserProfile } from '../dashboard/actions'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const result = await getUserProfile()
    if (result.success) {
      setProfile(result.data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-[#59f20d]">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative pb-24">
        <header className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#59f20d] p-1.5 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">⛪</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Bible Kids</h1>
          </div>
          <button className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-[#59f20d]/10">
            <span className="text-slate-600 dark:text-slate-300">⚙️</span>
          </button>
        </header>

        <section className="px-6 mb-8 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-[#59f20d] p-1 bg-white dark:bg-slate-800 shadow-xl mx-auto overflow-hidden">
              <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-5xl">
                {profile.gender === 'male' ? '👦' : '👧'}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 bg-[#59f20d] text-white rounded-full p-1.5 border-2 border-white dark:border-slate-800 flex items-center justify-center">
              <span className="text-sm">✏️</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-1">{profile.name}</h2>
          <div className="inline-flex items-center gap-1.5 bg-[#59f20d]/20 text-[#59f20d] px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wide">
            <span className="text-sm">⭐</span>
            Faith Explorer
          </div>
        </section>

        <section className="px-6 grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center border border-[#59f20d]/5">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Age</span>
            <span className="text-xl font-bold">{profile.age || 'N/A'}</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center border border-[#59f20d]/5">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{profile.gender || 'N/A'}</span>
            <span className="text-[#59f20d] text-2xl">{profile.gender === 'male' ? '😊' : '😊'}</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center border border-[#59f20d]/5">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Points</span>
            <span className="text-xl font-bold text-[#59f20d]">{profile.points}</span>
          </div>
        </section>

        <section className="px-6 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-[#59f20d]/5">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Current Level</p>
                <h3 className="text-2xl font-bold">Level {profile.level}</h3>
              </div>
              <p className="text-sm font-bold text-[#59f20d]">{profile.progress}%</p>
            </div>
            <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-[#59f20d] rounded-full" style={{ width: `${profile.progress}%` }}></div>
            </div>
            <p className="mt-3 text-xs text-center text-slate-400 font-medium">{100 - profile.progress}% more to Level {profile.level + 1}!</p>
          </div>
        </section>

        <section className="px-6 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">My Achievements</h3>
            <a className="text-[#59f20d] text-sm font-bold" href="#">View All</a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            <div className="flex-shrink-0 w-28 flex flex-col items-center">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-2 shadow-inner border-2 border-amber-200 dark:border-amber-800">
                <span className="text-amber-500 text-4xl">🔥</span>
              </div>
              <span className="text-xs font-bold text-center leading-tight">7-Day Streak</span>
            </div>
            <div className="flex-shrink-0 w-28 flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 shadow-inner border-2 border-blue-200 dark:border-blue-800">
                <span className="text-blue-500 text-4xl">❓</span>
              </div>
              <span className="text-xs font-bold text-center leading-tight">Quiz Master</span>
            </div>
            <div className="flex-shrink-0 w-28 flex flex-col items-center">
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-2 shadow-inner border-2 border-rose-200 dark:border-rose-800">
                <span className="text-rose-500 text-4xl">☀️</span>
              </div>
              <span className="text-xs font-bold text-center leading-tight">Early Bird</span>
            </div>
            <div className="flex-shrink-0 w-28 flex flex-col items-center opacity-40">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2 shadow-inner border-2 border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-4xl">🔒</span>
              </div>
              <span className="text-xs font-bold text-center leading-tight">Memory Verse</span>
            </div>
          </div>
        </section>

        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#162210]/80 backdrop-blur-md border-t border-[#59f20d]/10 px-6 py-4 z-50">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <button onClick={() => router.push('/dashboard')} className="flex flex-col items-center gap-1 group">
              <div className="px-5 py-1.5 rounded-full group-hover:bg-[#59f20d]/10 transition-colors">
                <span className="text-slate-400 group-hover:text-[#59f20d] text-2xl">📖</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-[#59f20d]">Reading</span>
            </button>
            <button onClick={() => router.push('/leaderboard')} className="flex flex-col items-center gap-1 group">
              <div className="px-5 py-1.5 rounded-full group-hover:bg-[#59f20d]/10 transition-colors">
                <span className="text-slate-400 group-hover:text-[#59f20d] text-2xl">🏆</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-[#59f20d]">Leaderboard</span>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="px-5 py-1.5 rounded-full bg-[#59f20d] shadow-lg shadow-[#59f20d]/30">
                <span className="text-white text-2xl">👤</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#59f20d]">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
