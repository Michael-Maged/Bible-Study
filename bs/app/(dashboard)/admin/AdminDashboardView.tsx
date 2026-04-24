'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AdminNav from '@/components/AdminNav'
import OfflineBanner from '@/components/OfflineBanner'
import PushSubscriber from '@/components/PushSubscriber'
import { getAnalytics } from './actions'
import type { Analytics } from './actions'
import { bibleBooks } from '@/constants/bibleBooks'

interface AdminDashboardViewProps {
  userRole: string
  stats: { totalUsers: number; pendingCount: number; lastUpdated: string }
  todayReading: { book: string; chapter: number; fromVerse: number; toVerse: number; verseCount: number } | null | undefined
}

export default function AdminDashboardView({ userRole, stats, todayReading }: AdminDashboardViewProps) {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    getAnalytics().then((r) => { if (r.success && r.data) setAnalytics(r.data) })
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <OfflineBanner />
      <PushSubscriber />

      <main className="max-w-2xl mx-auto px-5 pt-6 space-y-5">

        {/* Page header */}
        <div className="mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {userRole === 'superuser' ? 'Superuser' : 'Admin'}
          </p>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">Overview</h1>
        </div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[26px] font-bold tracking-tight leading-none text-primary">
              {stats.totalUsers}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-2">
              {userRole === 'admin' ? 'Total Users' : 'Total Kids'}
            </div>
          </div>
          <div
            className="rounded-2xl border p-4"
            style={
              stats.pendingCount > 0
                ? { background: 'rgba(194,133,27,0.08)', borderColor: 'rgba(194,133,27,0.3)' }
                : { background: 'var(--card)', borderColor: 'var(--border)' }
            }
          >
            <div
              className="text-[26px] font-bold tracking-tight leading-none"
              style={{ color: stats.pendingCount > 0 ? '#c2851b' : 'var(--foreground)' }}
            >
              {stats.pendingCount}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-2">
              Pending Approval
            </div>
          </div>
        </motion.div>

        {/* Today's Reading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground mb-3">
            Today&apos;s Reading
          </p>
          {todayReading === undefined ? (
            <div className="rounded-2xl border border-border bg-card p-5 flex justify-center">
              <div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : todayReading === null ? (
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <p className="text-muted-foreground text-sm">No reading assigned for today</p>
            </div>
          ) : (
            <div
              className="rounded-2xl border border-border p-4 relative overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #f7ecd3 0%, #f7f1e6 70%)' }}
            >
              <div className="absolute top-[-14px] right-[-12px] opacity-15 pointer-events-none select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon0.svg" alt="" width={90} height={90} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[1.4px] text-[#8a5a0f]">Today</p>
              <h2 className="text-[20px] font-bold tracking-tight text-foreground mt-1.5 leading-snug">
                {bibleBooks.find((b) => b.id === Number(todayReading.book))?.name ?? `Book ${todayReading.book}`}
              </h2>
              <p className="text-sm text-muted-foreground font-semibold mt-0.5">
                Chapter {todayReading.chapter} · Verses {todayReading.fromVerse}–{todayReading.toVerse}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#8a5a0f]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 1l1.5 3L11 4.5 8.5 7l.7 3.5L6 9l-3.2 1.5.7-3.5L1 4.5 4.5 4 6 1z"/>
                </svg>
                {todayReading.verseCount} verses
              </div>
            </div>
          )}
        </motion.div>

        {/* Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground mb-3">
            Analytics
          </p>
          {!analytics ? (
            <div className="rounded-2xl border border-border bg-card p-6 flex justify-center">
              <div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-[26px] font-bold tracking-tight leading-none text-primary">
                    {analytics.overallReadingPct}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-2">
                    Reading Rate
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-[26px] font-bold tracking-tight leading-none text-foreground">
                    {analytics.overallCorrectPct}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-2">
                    Correct Answers
                  </div>
                </div>
              </div>

              {analytics.byClass.length > 0 && (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">Per Class</p>
                  </div>
                  <div className="divide-y divide-border">
                    {analytics.byClass.map((cls) => (
                      <div key={cls.className} className="px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm">{cls.className}</p>
                          <span className="text-xs text-muted-foreground">{cls.totalKids} kids</span>
                        </div>
                        <div className="space-y-1.5">
                          <ProgressBar label="Reading" value={cls.readingPct} amber />
                          <ProgressBar label="Correct" value={cls.correctPct} amber={false} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="pb-2"
        >
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/admin/kids')}
              className="rounded-2xl border border-border bg-card p-4 text-left space-y-2 hover:bg-accent/30 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--primary)' }}>
                <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M1 17c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M13 5a3 3 0 010 4M16 17c1.5-1 2-2.5 2-3.5a2.5 2.5 0 00-3-2.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <p className="font-bold text-sm text-foreground">Manage Kids</p>
            </button>
            <button
              onClick={() => router.push('/admin/assignments')}
              className="rounded-2xl border border-border bg-card p-4 text-left space-y-2 hover:bg-accent/30 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--primary)' }}>
                <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <p className="font-bold text-sm text-foreground">Assign Reading</p>
            </button>
          </div>
        </motion.div>

      </main>

      <AdminNav active="dashboard" />
    </div>
  )
}

function ProgressBar({ label, value, amber }: { label: string; value: number; amber: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-muted-foreground w-12 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: amber ? '#c2851b' : 'oklch(0.596 0.145 162.48)' }}
        />
      </div>
      <span
        className="text-xs font-black w-8 text-right"
        style={{ color: amber ? '#c2851b' : 'oklch(0.596 0.145 162.48)' }}
      >
        {value}%
      </span>
    </div>
  )
}
