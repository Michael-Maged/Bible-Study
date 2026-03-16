'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getRequestDetails, handleApproveRequest } from '../../actions'
import { getKidFullProfile, getKidDetailedStats, adjustKidPoints } from './actions'
import type { RequestDetail } from '@/types'
import AdminNav from '@/components/AdminNav'

type KidProfile = {
  id: string
  name: string
  email?: string
  age?: number
  gender: string
  current_score: number
  streak: number
  best_streak: number
}

type ReadingRow = {
  readingId: string
  day: string
  book: string
  chapter: number
  fromVerse: number
  toVerse: number
  completedAt: string
  hasQuiz: boolean
  quizPct: number | null
  earnedScore: number
  totalAttempts: number
  correctAttempts: number
}

type DetailedStats = {
  readingHistory: ReadingRow[]
  totalDaysRead: number
  totalDaysThisMonth: number
  missedDaysThisMonth: number
  overallQuizPct: number | null
  totalAttempts: number
  totalCorrect: number
}

export default function KidDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [profile, setProfile] = useState<KidProfile | null>(null)
  const [stats, setStats] = useState<DetailedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [pointsDelta, setPointsDelta] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [pointsFeedback, setPointsFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  const load = async () => {
    const type = params.type as 'admin' | 'kid'
    const id = params.id as string
    const result = await getRequestDetails(type, id)
    if (!result.success) { setLoading(false); return }
    setRequest(result.data)

    if (result.data.type === 'kid') {
      const userId =
        result.data.user?.id ||
        (result.data as Record<string, unknown>).user_id ||
        (result.data as Record<string, unknown>).userId ||
        result.data.user?.user_id
      if (userId) {
        const [profileRes, statsRes] = await Promise.all([
          getKidFullProfile(userId as string),
          getKidDetailedStats(userId as string),
        ])
        if (profileRes.success) setProfile(profileRes.data as KidProfile)
        if (statsRes.success) setStats(statsRes.data as DetailedStats)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAction(approved: boolean) {
    const type = params.type as 'admin' | 'kid'
    const id = params.id as string
    const result = await handleApproveRequest(type, id, approved)
    if (result.success) router.push('/admin/kids')
  }

  async function handleAdjustPoints(sign: 1 | -1) {
    if (!profile || !pointsDelta) return
    const delta = parseInt(pointsDelta)
    if (isNaN(delta) || delta <= 0) return
    setAdjusting(true)
    setPointsFeedback(null)
    const result = await adjustKidPoints(profile.id, sign * delta)
    if (result.success && result.data) {
      setProfile(p => p ? { ...p, current_score: result.data!.newScore } : p)
      setPointsFeedback({ ok: true, msg: `Points ${sign > 0 ? 'added' : 'removed'} successfully` })
      setPointsDelta('')
    } else {
      setPointsFeedback({ ok: false, msg: (result as { error?: string }).error || 'Failed to adjust points' })
    }
    setAdjusting(false)
    setTimeout(() => setPointsFeedback(null), 3000)
  }

  if (loading) return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex items-center justify-center">
      <div className="text-slate-500">Loading...</div>
    </div>
  )

  if (!request) return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex items-center justify-center">
      <div className="text-slate-500">Not found</div>
    </div>
  )

  const isKid = request.type === 'kid'
  const displayName = profile?.name || request.user.name
  const score = profile?.current_score ?? 0
  const streak = profile?.streak ?? 0
  const bestStreak = profile?.best_streak ?? 0
  const monthCompletion = stats
    ? Math.round((stats.totalDaysThisMonth / Math.max(1, stats.totalDaysThisMonth + stats.missedDaysThisMonth)) * 100)
    : 0

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-slate-900 dark:text-slate-100 min-h-screen pb-32">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md border-b border-[#59f20d]/10">
        <div className="flex items-center px-4 py-4 max-w-md mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#59f20d]/10 transition-colors text-xl mr-3"
          >
            ←
          </button>
          <h1 className="text-lg font-bold flex-1">Kid Details</h1>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            request.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
            request.status === 'pending'  ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
            'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {request.status}
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Profile Card */}
        <div className="bg-white dark:bg-[#1f2e18] rounded-2xl p-5 shadow-sm border border-[#59f20d]/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#59f20d]/10 border-2 border-[#59f20d]/20 flex items-center justify-center text-4xl flex-shrink-0">
              {request.user.gender === 'male' ? '👦' : '👧'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate">{displayName}</h2>
              {profile?.email && <p className="text-sm text-slate-500 truncate">{profile.email}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {(profile?.age || request.user.age) && (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full font-medium">
                    🎂 {profile?.age || request.user.age} yrs
                  </span>
                )}
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full font-medium capitalize">
                  {request.user.gender === 'male' ? '👦' : '👧'} {request.user.gender}
                </span>
                {isKid && request.class?.name && (
                  <span className="text-xs bg-[#59f20d]/10 text-[#3a9e08] dark:text-[#59f20d] px-2 py-1 rounded-full font-bold">
                    🎓 {request.class.name}
                  </span>
                )}
                {!isKid && request.role && (
                  <span className="text-xs bg-[#59f20d]/10 text-[#3a9e08] dark:text-[#59f20d] px-2 py-1 rounded-full font-bold capitalize">
                    ⭐ {request.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {isKid && profile && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#1f2e18] rounded-2xl p-4 shadow-sm border border-[#59f20d]/10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Score</p>
              <p className="text-3xl font-black text-[#59f20d]">{score.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">total points</p>
            </div>

            <div className="bg-white dark:bg-[#1f2e18] rounded-2xl p-4 shadow-sm border border-orange-200/50 dark:border-orange-800/30">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Streak</p>
              <p className="text-3xl font-black text-orange-500">🔥 {streak}</p>
              <p className="text-xs text-slate-500 mt-1">days in a row</p>
            </div>

            <div className="bg-white dark:bg-[#1f2e18] rounded-2xl p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/30">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Best Streak</p>
              <p className="text-3xl font-black text-blue-500">⚡ {bestStreak}</p>
              <p className="text-xs text-slate-500 mt-1">personal best</p>
            </div>

            <div className="bg-white dark:bg-[#1f2e18] rounded-2xl p-4 shadow-sm border border-[#59f20d]/10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Quiz Accuracy</p>
              <p className="text-3xl font-black">
                {stats?.overallQuizPct != null ? `${stats.overallQuizPct}%` : '—'}
              </p>
              {stats?.overallQuizPct != null && (
                <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#59f20d] rounded-full" style={{ width: `${stats.overallQuizPct}%` }} />
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1">all time</p>
            </div>
          </div>
        )}

        {/* This Month Summary */}
        {isKid && stats && (
          <div className="bg-white dark:bg-[#1f2e18] rounded-2xl p-5 shadow-sm border border-[#59f20d]/10">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span>📅</span> This Month
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-[#59f20d]/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-[#59f20d]">{stats.totalDaysThisMonth}</p>
                <p className="text-xs text-slate-500 font-medium">Days Read</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-red-500">{stats.missedDaysThisMonth}</p>
                <p className="text-xs text-slate-500 font-medium">Missed</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black">{monthCompletion}%</p>
                <p className="text-xs text-slate-500 font-medium">Rate</p>
              </div>
            </div>
            {/* month progress bar */}
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#59f20d] rounded-full transition-all" style={{ width: `${monthCompletion}%` }} />
            </div>
          </div>
        )}

        {/* Quiz Summary */}
        {isKid && stats && stats.totalAttempts > 0 && (
          <div className="bg-white dark:bg-[#1f2e18] rounded-2xl p-5 shadow-sm border border-[#59f20d]/10">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span>🧠</span> Quiz Performance
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black">{stats.totalAttempts}</p>
                <p className="text-xs text-slate-500 font-medium">Answered</p>
              </div>
              <div className="bg-[#59f20d]/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-[#59f20d]">{stats.totalCorrect}</p>
                <p className="text-xs text-slate-500 font-medium">Correct</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-red-500">{stats.totalAttempts - stats.totalCorrect}</p>
                <p className="text-xs text-slate-500 font-medium">Wrong</p>
              </div>
            </div>
          </div>
        )}

        {/* Reading History Table */}
        {isKid && stats && stats.readingHistory.length > 0 && (
          <div className="bg-white dark:bg-[#1f2e18] rounded-2xl shadow-sm border border-[#59f20d]/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <span>📖</span> Reading History
              </h3>
              <span className="text-xs text-slate-400 font-medium">{stats.totalDaysRead} total</span>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.readingHistory.map((row) => (
                <li key={row.readingId} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {row.book} {row.chapter}:{row.fromVerse}–{row.toVerse}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{row.day}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {row.hasQuiz && row.quizPct != null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.quizPct >= 80 ? 'bg-[#59f20d]' : row.quizPct >= 50 ? 'bg-orange-400' : 'bg-red-400'}`}
                              style={{ width: `${row.quizPct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${row.quizPct >= 80 ? 'text-[#3a9e08] dark:text-[#59f20d]' : row.quizPct >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                            {row.quizPct}%
                          </span>
                        </div>
                      ) : row.hasQuiz ? (
                        <span className="text-xs text-slate-400">No attempt</span>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">No quiz</span>
                      )}
                      {row.earnedScore > 0 && (
                        <span className="text-xs font-bold text-[#59f20d]">+{row.earnedScore} pts</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Adjust Points */}
        {isKid && profile && request.status === 'accepted' && (
          <div className="bg-white dark:bg-[#1f2e18] rounded-2xl p-5 shadow-sm border border-[#59f20d]/10">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span>⭐</span> Adjust Points
            </h3>
            <input
              type="number"
              min="1"
              placeholder="Enter amount..."
              value={pointsDelta}
              onChange={e => setPointsDelta(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-[#59f20d] placeholder:text-slate-400 mb-3"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAdjustPoints(1)}
                disabled={adjusting || !pointsDelta}
                className="h-12 rounded-xl bg-[#59f20d] text-slate-900 font-bold text-sm active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + Add Points
              </button>
              <button
                onClick={() => handleAdjustPoints(-1)}
                disabled={adjusting || !pointsDelta}
                className="h-12 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-200 dark:hover:bg-red-900/40 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                − Remove Points
              </button>
            </div>
            {pointsFeedback && (
              <p className={`text-sm font-medium mt-3 text-center ${pointsFeedback.ok ? 'text-[#3a9e08] dark:text-[#59f20d]' : 'text-red-500'}`}>
                {pointsFeedback.ok ? '✓' : '✗'} {pointsFeedback.msg}
              </p>
            )}
          </div>
        )}

        {/* Approve / Reject */}
        {request.status === 'pending' && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleAction(false)}
              className="flex-1 h-14 rounded-full bg-[#59f20d]/10 text-slate-900 dark:text-[#59f20d] font-bold text-base hover:bg-[#59f20d]/20 transition-colors border border-[#59f20d]/20"
            >
              Reject
            </button>
            <button
              onClick={() => handleAction(true)}
              className="flex-[2] h-14 rounded-full bg-[#59f20d] text-slate-900 font-bold text-base shadow-lg shadow-[#59f20d]/20 active:scale-95 transition-all"
            >
              Approve
            </button>
          </div>
        )}

      </main>

      <AdminNav active="kids" />
    </div>
  )
}
