'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getRequestDetails, handleApproveRequest } from '../../actions'
import { getKidFullProfile, getKidDetailedStats, adjustKidPoints } from './actions'
import type { RequestDetail } from '@/types'
import AdminNav from '@/components/AdminNav'
import OfflineBanner from '@/components/OfflineBanner'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MessageBox from '@/components/MessageBox'
import LoadingScreen from '@/components/LoadingScreen'
import TransferKidModal from './TransferKidModal'

type KidProfile = {
  id: string; name: string; email?: string; age?: number; gender: string
  current_score: number; streak: number; best_streak: number
}
type ReadingRow = {
  readingId: string; day: string; book: string; chapter: number
  fromVerse: number; toVerse: number; completedAt: string
  hasQuiz: boolean; quizPct: number | null; earnedScore: number
  totalAttempts: number; correctAttempts: number
}
type DetailedStats = {
  readingHistory: ReadingRow[]; totalDaysRead: number; totalDaysThisMonth: number
  missedDaysThisMonth: number; overallQuizPct: number | null
  totalAttempts: number; totalCorrect: number
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  const load = async () => {
    const type = params.type as 'admin' | 'kid'
    const id = params.id as string
    const result = await getRequestDetails(type, id)
    if (!result.success) { setLoading(false); return }
    setRequest(result.data)
    if (result.data.type === 'kid') {
      const userId = result.data.user?.id || (result.data as Record<string, unknown>).user_id || result.data.user?.user_id
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

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAction(approved: boolean) {
    setActionLoading(true)
    const result = await handleApproveRequest(params.type as 'admin' | 'kid', params.id as string, approved)
    setActionLoading(false)
    setConfirmAction(null)
    if (result.success) router.push('/admin/kids')
  }

  async function handleAdjustPoints(sign: 1 | -1) {
    if (!profile || !pointsDelta) return
    const delta = parseInt(pointsDelta)
    if (isNaN(delta) || delta <= 0) return
    setAdjusting(true)
    setFeedback(null)
    const result = await adjustKidPoints(profile.id, sign * delta)
    if (result.success && result.data) {
      setProfile((p) => p ? { ...p, current_score: result.data!.newScore } : p)
      setFeedback({ type: 'success', message: `Points ${sign > 0 ? 'added' : 'removed'} successfully` })
      setPointsDelta('')
    } else {
      setFeedback({ type: 'error', message: (result as { error?: string }).error || 'Failed' })
    }
    setAdjusting(false)
    setTimeout(() => setFeedback(null), 3000)
  }

  if (loading) return <LoadingScreen />
  if (!request) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Not found</p>
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

  const statusColor =
    request.status === 'accepted' ? { bg: 'rgba(90,122,58,0.10)', text: '#5a7a3a', border: 'rgba(90,122,58,0.3)' }
    : request.status === 'pending' ? { bg: 'rgba(194,133,27,0.10)', text: '#c2851b', border: 'rgba(194,133,27,0.3)' }
    : { bg: 'rgba(166,66,66,0.10)', text: '#a64242', border: 'rgba(166,66,66,0.3)' }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <OfflineBanner />

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-5 space-y-4">

        {/* Back + title */}
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Student</p>
            <h1 className="text-[20px] font-bold tracking-tight text-foreground leading-tight">Kid Details</h1>
          </div>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full border capitalize"
            style={{ background: statusColor.bg, color: statusColor.text, borderColor: statusColor.border }}
          >
            {request.status}
          </span>
        </div>

        {/* Hero card */}
        <div
          className="rounded-2xl border border-border p-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(160deg, #f7ecd3 0%, #f7f1e6 70%)' }}
        >
          <div
            className="rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
            style={{ width: 58, height: 58, background: '#c2851b', color: '#fff', fontSize: 22 }}
          >
            {getInitials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold text-foreground truncate">{displayName}</h2>
            {profile?.email && <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{profile.email}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(profile?.age || request.user.age) && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-border bg-card text-foreground">
                  {profile?.age || request.user.age} yrs
                </span>
              )}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-border bg-card text-foreground capitalize">
                {request.user.gender}
              </span>
              {isKid && request.class?.name && (
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(194,133,27,0.10)', color: '#c2851b' }}
                >
                  {request.class.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {isKid && profile && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Score', value: score.toLocaleString(), accent: true },
              { label: 'Streak', value: `${streak}d`, accent: false },
              { label: 'Best', value: `${bestStreak}d`, accent: false },
            ].map(({ label, value, accent }) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-3">
                <div
                  className="text-[20px] font-bold tracking-tight leading-none"
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
        )}

        {/* This Month */}
        {isKid && stats && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">This Month</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1">
                <p className="text-[22px] font-bold text-primary">{stats.totalDaysThisMonth}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Days Read</p>
              </div>
              <div className="space-y-1">
                <p className="text-[22px] font-bold" style={{ color: '#a64242' }}>{stats.missedDaysThisMonth}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Missed</p>
              </div>
              <div className="space-y-1">
                <p className="text-[22px] font-bold text-foreground">{monthCompletion}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Rate</p>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${monthCompletion}%`, background: '#c2851b' }}
              />
            </div>
            {stats.overallQuizPct != null && (
              <p className="text-xs text-muted-foreground text-center">
                Quiz accuracy: <span className="font-bold text-foreground">{stats.overallQuizPct}%</span>
              </p>
            )}
          </div>
        )}

        {/* Adjust Points */}
        {isKid && profile && request.status === 'accepted' && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">Adjust Points</p>
            <input
              type="number"
              min="1"
              placeholder="Enter amount…"
              value={pointsDelta}
              onChange={(e) => setPointsDelta(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleAdjustPoints(1)}
                disabled={adjusting || !pointsDelta}
                size="sm"
                className="shadow-[0_2px_0_rgba(138,90,15,0.25)]"
              >
                + Add Points
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAdjustPoints(-1)}
                disabled={adjusting || !pointsDelta}
                size="sm"
              >
                − Remove
              </Button>
            </div>
            {feedback && <MessageBox type={feedback.type} message={feedback.message} />}
          </div>
        )}

        {/* Reading History */}
        {isKid && stats && stats.readingHistory.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">Reading History</p>
              <span className="text-xs text-muted-foreground">{stats.totalDaysRead} total</span>
            </div>
            <div className="divide-y divide-border">
              {stats.readingHistory.map((row) => (
                <div key={row.readingId} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{row.book} {row.chapter}:{row.fromVerse}–{row.toVerse}</p>
                    <p className="text-xs text-muted-foreground">{row.day}</p>
                  </div>
                  {row.hasQuiz && row.quizPct != null && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">{row.quizPct}%</Badge>
                  )}
                  {row.earnedScore > 0 && (
                    <span className="text-xs font-black flex-shrink-0" style={{ color: '#c2851b' }}>+{row.earnedScore}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approve / Reject */}
        {request.status === 'pending' && (
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmAction('reject')}>Reject</Button>
            <Button className="flex-[2] shadow-[0_2px_0_rgba(138,90,15,0.25)]" onClick={() => setConfirmAction('approve')}>Approve</Button>
          </div>
        )}

        {/* Transfer */}
        {isKid && request.class && request.status !== 'rejected' && (
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setTransferOpen(true)}
            >
              Transfer to Another Class
            </Button>
          </div>
        )}

      </main>

      <ConfirmDialog
        open={confirmAction === 'reject'}
        title="Reject this kid?"
        description="This will reject their registration request. They will not be able to access the platform."
        confirmLabel="Reject"
        onConfirm={() => handleAction(false)}
        onCancel={() => setConfirmAction(null)}
        loading={actionLoading}
      />
      <ConfirmDialog
        open={confirmAction === 'approve'}
        title="Approve this kid?"
        description="This will grant them access to the Bible study platform."
        confirmLabel="Approve"
        variant="warning"
        onConfirm={() => handleAction(true)}
        onCancel={() => setConfirmAction(null)}
        loading={actionLoading}
      />

      {isKid && request.class && (
        <TransferKidModal
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          enrollmentId={params.id as string}
          kidName={displayName}
          currentClassId={request.class.id}
          currentClassName={request.class.name}
          currentGradeNum={request.class.grade}
          currentTenantId={request.class.gradeInfo?.tenant ?? ''}
        />
      )}
      <AdminNav active="kids" />
    </div>
  )
}
