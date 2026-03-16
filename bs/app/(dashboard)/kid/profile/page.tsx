'use client'

import { getUserProfile } from '../dashboard/actions'
import OfflineBanner from '@/components/OfflineBanner'
import LoadingScreen from '@/components/LoadingScreen'
import { cacheProfile, getCachedProfile } from '@/utils/offlineCache'
import KidNav from '@/components/KidNav'
import { useOfflineData } from '@/hooks/useOfflineData'
import { useState } from 'react'

export default function ProfilePage() {
  const { data: profile, loading } = useOfflineData(getUserProfile, getCachedProfile, cacheProfile)
  const [notifEnabled, setNotifEnabled] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('push_opted_out') !== 'true'
  )

  const toggleNotifications = () => {
    const next = !notifEnabled
    setNotifEnabled(next)
    localStorage.setItem('push_opted_out', next ? 'false' : 'true')
  }

  if (loading) return <LoadingScreen />
  if (!profile) return (
    <div className="bg-[#0d1a08] min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Profile not found</p>
    </div>
  )

  return (
    <div className="bg-[#0d1a08] text-slate-100 min-h-screen pb-24">
      <OfflineBanner />

      {/* Hero */}
      <div className="px-5 pt-12 pb-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-[#1a2e12] border-2 border-[#59f20d]/30 flex items-center justify-center text-6xl mb-4 shadow-xl shadow-[#59f20d]/10">
          {profile.gender === 'male' ? '👦' : '👧'}
        </div>
        <h1 className="text-2xl font-black">{profile.name}</h1>
        <p className="text-slate-500 text-sm mt-1">{profile.email}</p>
        {profile.className && (
          <span className="mt-2 text-xs font-bold text-[#59f20d] bg-[#59f20d]/10 px-3 py-1 rounded-full">
            🎓 {profile.className}
          </span>
        )}
      </div>

      <main className="px-5 space-y-4 max-w-md mx-auto">
        {/* Score + Streak */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#59f20d] rounded-2xl p-5">
            <p className="text-[#0d1a08] text-xs font-bold uppercase tracking-wider mb-1">Score</p>
            <p className="text-[#0d1a08] text-4xl font-black">{profile.current_score}</p>
            <p className="text-[#0d1a08]/60 text-xs font-bold mt-1">total points</p>
          </div>
          <div className="bg-[#1a2e12] rounded-2xl p-5 border border-orange-400/20">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Streak</p>
            <p className="text-orange-400 text-4xl font-black">{profile.streak}</p>
            <p className="text-slate-500 text-xs font-bold mt-1">days in a row</p>
          </div>
        </div>

        <div className="bg-[#1a2e12] rounded-2xl p-5 border border-[#59f20d]/10">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Best Streak</p>
          <p className="text-blue-400 text-3xl font-black">{profile.best_streak} days</p>
          <div className="mt-3 h-1.5 bg-[#0d1a08] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full"
              style={{ width: `${Math.min(100, (profile.streak / Math.max(1, profile.best_streak)) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1">current vs best</p>
        </div>

        {/* Details */}
        <div className="bg-[#1a2e12] rounded-2xl border border-[#59f20d]/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#59f20d]/10 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#59f20d] rounded-full" />
            <p className="font-bold text-sm">Details</p>
          </div>
          {[
            { label: 'Age', value: profile.age || 'N/A' },
            { label: 'Gender', value: profile.gender },
            profile.grade ? { label: 'Grade', value: profile.grade } : null,
            profile.className ? { label: 'Class', value: profile.className } : null,
          ].filter(Boolean).map((row, i, arr) => (
            <div key={i} className={`px-5 py-3.5 flex justify-between items-center ${i < arr.length - 1 ? 'border-b border-[#59f20d]/5' : ''}`}>
              <span className="text-sm text-slate-500 font-bold">{(row as {label: string; value: unknown}).label}</span>
              <span className="font-black text-sm capitalize">{String((row as {label: string; value: unknown}).value)}</span>
            </div>
          ))}
        </div>

        {/* Notifications */}
        <div className="bg-[#1a2e12] rounded-2xl border border-[#59f20d]/10 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Daily Reminder</p>
              <p className="text-xs text-slate-500 mt-0.5">Get notified when it&apos;s time to read</p>
            </div>
            <button
              role="switch"
              aria-checked={notifEnabled}
              onClick={toggleNotifications}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${notifEnabled ? 'bg-[#59f20d]' : 'bg-[#0d1a08]'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifEnabled ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </main>

      <KidNav active="profile" />
    </div>
  )
}
