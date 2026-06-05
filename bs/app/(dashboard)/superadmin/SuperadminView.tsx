'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { approveCoordinator, rejectCoordinator } from './actions'
import type { SuperadminStats, PendingCoordinator } from './actions'
import SuperadminNav from './SuperadminNav'

interface Props {
  stats: SuperadminStats
  pending: PendingCoordinator[]
}

export default function SuperadminView({ stats, pending }: Props) {
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

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Super Admin</p>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">
            {isAr ? 'نظرة عامة' : 'Overview'}
          </h1>
        </div>

        <SuperadminNav />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard value={stats.totalCoordinators} label={isAr ? 'أمناء المراحل' : 'Coordinators'} sub={stats.pendingCoordinators > 0 ? `${stats.pendingCoordinators} ${isAr ? 'معلق' : 'pending'}` : undefined} warn={stats.pendingCoordinators > 0} />
          <StatCard value={stats.totalServants} label={isAr ? 'الخدام' : 'Servants'} />
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
                  <PersonRow name={coord.user?.name} email={coord.user?.email} tenantName={coord.tenantName} gradeName={coord.gradeName} />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" disabled={loadingId === coord.id} onClick={() => handleAction(coord.id, false)}>
                      {loadingId === coord.id ? <Loader2 size={14} className="animate-spin" /> : (isAr ? 'رفض' : 'Reject')}
                    </Button>
                    <Button size="sm" className="flex-[2] shadow-[0_2px_0_rgba(138,90,15,0.25)]" disabled={loadingId === coord.id} onClick={() => handleAction(coord.id, true)}>
                      {loadingId === coord.id ? <Loader2 size={14} className="animate-spin" /> : (isAr ? 'قبول' : 'Approve')}
                    </Button>
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

export function PersonRow({ name, email, tenantName, gradeName }: { name?: string | null; email?: string | null; tenantName?: string | null; gradeName?: string | null }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-sm text-foreground truncate">{name ?? '—'}</p>
      <p className="text-xs text-muted-foreground truncate">{email ?? '—'}</p>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {tenantName && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{tenantName}</span>}
        {gradeName && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{gradeName}</span>}
      </div>
    </div>
  )
}

export function StatCard({ value, label, sub, warn }: { value: number; label: string; sub?: string; warn?: boolean }) {
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
