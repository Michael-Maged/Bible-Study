'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { approveCoordinator, rejectCoordinator, signOutSuperadmin } from './actions'
import type { SuperadminStats, PendingCoordinator, ActiveCoordinator } from './actions'

interface Props {
  stats: SuperadminStats
  pending: PendingCoordinator[]
  active: ActiveCoordinator[]
}

export default function SuperadminView({ stats, pending, active }: Props) {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'
  const [pendingList, setPendingList] = useState(pending)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleAction(id: string, approve: boolean) {
    setLoadingId(id)
    const result = approve ? await approveCoordinator(id) : await rejectCoordinator(id)
    if (result.success) setPendingList(p => p.filter(c => c.id !== id))
    setLoadingId(null)
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <main className="max-w-2xl mx-auto px-5 pt-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {isAr ? 'لوحة التحكم' : 'Super Admin'}
            </p>
            <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">
              {isAr ? 'نظرة عامة' : 'Overview'}
            </h1>
          </div>
          <form action={signOutSuperadmin}>
            <button
              type="submit"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {isAr ? 'تسجيل الخروج' : 'Sign out'}
            </button>
          </form>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard value={stats.totalCoordinators} label={isAr ? 'أمناء المراحل' : 'Coordinators'} sub={stats.pendingCoordinators > 0 ? `${stats.pendingCoordinators} ${isAr ? 'معلق' : 'pending'}` : undefined} warn={stats.pendingCoordinators > 0} />
          <StatCard value={stats.totalServants} label={isAr ? 'الخدام' : 'Servants'} sub={stats.pendingServants > 0 ? `${stats.pendingServants} ${isAr ? 'معلق' : 'pending'}` : undefined} warn={stats.pendingServants > 0} />
          <StatCard value={stats.totalStudents} label={isAr ? 'المخدومون' : 'Students'} />
          <StatCard value={stats.totalFamilies} label={isAr ? 'الأسر' : 'Families'} />
        </div>

        {/* Pending coordinators */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground mb-3">
            {isAr ? 'أمناء مراحل في الانتظار' : 'Pending Coordinators'}
            {pendingList.length > 0 && (
              <span className="ms-2 px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'rgba(194,133,27,0.12)', color: '#c2851b' }}>
                {pendingList.length}
              </span>
            )}
          </p>
          {pendingList.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {isAr ? 'لا يوجد طلبات معلقة' : 'No pending requests'}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {pendingList.map(coord => (
                <div key={coord.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{coord.user?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{coord.user?.email ?? '—'}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {coord.tenantName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                            {coord.tenantName}
                          </span>
                        )}
                        {coord.gradeName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                            {coord.gradeName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={loadingId === coord.id}
                      onClick={() => handleAction(coord.id, false)}
                    >
                      {loadingId === coord.id ? <Loader2 size={14} className="animate-spin" /> : (isAr ? 'رفض' : 'Reject')}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-[2] shadow-[0_2px_0_rgba(138,90,15,0.25)]"
                      disabled={loadingId === coord.id}
                      onClick={() => handleAction(coord.id, true)}
                    >
                      {loadingId === coord.id ? <Loader2 size={14} className="animate-spin" /> : (isAr ? 'قبول' : 'Approve')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active coordinators */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground mb-3">
            {isAr ? 'أمناء المراحل النشطون' : 'Active Coordinators'}
          </p>
          {active.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {isAr ? 'لا يوجد أمناء مراحل' : 'No coordinators yet'}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {active.map(coord => (
                <div key={coord.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{coord.user?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{coord.user?.email ?? '—'}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {coord.tenantName && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                        {coord.tenantName}
                      </span>
                    )}
                    {coord.gradeName && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                        {coord.gradeName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

function StatCard({ value, label, sub, warn }: { value: number; label: string; sub?: string; warn?: boolean }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={warn ? { background: 'rgba(194,133,27,0.08)', borderColor: 'rgba(194,133,27,0.3)' } : { background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: warn ? '#c2851b' : 'var(--primary)' }}>
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-2">{label}</div>
      {sub && <div className="text-[10px] font-semibold mt-0.5" style={{ color: '#c2851b' }}>{sub}</div>}
    </div>
  )
}
