'use client'

import { useRouter } from 'next/navigation'
import { getUserProfile } from '../dashboard/actions'
import OfflineBanner from '@/components/OfflineBanner'
import LoadingScreen from '@/components/LoadingScreen'
import { cacheProfile, getCachedProfile } from '@/utils/offlineCache'
import type { UserProfile } from '@/types'
import KidNav from '@/components/KidNav'
import { useOfflineData } from '@/hooks/useOfflineData'
import { useState } from 'react'

export default function ProfilePage() {
  const router = useRouter()
  const { data: profile, loading } = useOfflineData(
    getUserProfile,
    getCachedProfile,
    cacheProfile
  )
  const [notifEnabled, setNotifEnabled] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('push_opted_out') !== 'true'
  )

  const toggleNotifications = () => {
    const next = !notifEnabled
    setNotifEnabled(next)
    localStorage.setItem('push_opted_out', next ? 'false' : 'true')
  }

  if (loading) {
    return <LoadingScreen />
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
      <OfflineBanner />
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative pb-24">
        <header className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#59f20d] p-1.5 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">⛪</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Bible Kids</h1>
          </div>
        </header>

        <section className="px-6 mb-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-28 h-28 rounded-full border-4 border-[#59f20d] bg-gradient-to-br from-[#59f20d]/20 to-[#59f20d]/5 shadow-xl mx-auto flex items-center justify-center text-6xl">
              {profile.gender === 'male' ? '👦' : '👧'}
            </div>
          </div>
          <h2 className="text-3xl font-black mb-2">{profile.name}</h2>
          <p className="text-slate-500 dark:text-slate-400">{profile.email}</p>
        </section>

        <section className="px-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 p-5 rounded-2xl shadow-sm border border-amber-200/50 dark:border-amber-800/30">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">⭐</span>
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Current</p>
                  <p className="text-2xl font-black text-amber-900 dark:text-amber-300">{profile.current_score}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 p-5 rounded-2xl shadow-sm border border-green-200/50 dark:border-green-800/30">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🔥</span>
                <div>
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase">Best Streak</p>
                  <p className="text-2xl font-black text-green-900 dark:text-green-300">{profile.best_streak}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 mb-6">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-2xl shadow-sm border border-orange-200/50 dark:border-orange-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-3xl shadow-lg">
                  🔥
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase">Streak</p>
                  <p className="text-3xl font-black text-orange-900 dark:text-orange-300">{profile.streak} Days</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 mb-6">
          <h3 className="text-lg font-black mb-3 text-slate-700 dark:text-slate-300">Details</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Age</span>
              <span className="font-black text-slate-900 dark:text-slate-100">{profile.age || 'N/A'}</span>
            </div>
            <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Gender</span>
              <span className="font-black text-slate-900 dark:text-slate-100 capitalize">{profile.gender || 'N/A'}</span>
            </div>
            {profile.grade && (
              <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Grade</span>
                <span className="font-black text-slate-900 dark:text-slate-100">{profile.grade}</span>
              </div>
            )}
            {profile.className && (
              <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Class</span>
                <span className="font-black text-slate-900 dark:text-slate-100">{profile.className}</span>
              </div>
            )}
            {profile.tenant && (
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Tenant</span>
                <span className="font-black text-slate-900 dark:text-slate-100">{profile.tenant}</span>
              </div>
            )}
          </div>
        </section>

        <section className="px-6 mb-6">
          <h3 className="text-lg font-black mb-3 text-slate-700 dark:text-slate-300">Notifications</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Daily Reading Reminder</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Get notified when it&apos;s time to read</p>
              </div>
              <button
                role="switch"
                aria-checked={notifEnabled}
                onClick={toggleNotifications}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 overflow-hidden ${
                  notifEnabled ? 'bg-[#59f20d]' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifEnabled ? 'left-[26px]' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>
        </section>

        <KidNav active="profile" />
      </div>
    </div>
  )
}
