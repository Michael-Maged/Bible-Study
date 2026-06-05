'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { approveCoordinator, rejectCoordinator, setAdminRole, signOutSuperadmin } from './actions'
import type { SuperadminStats, PendingCoordinator, ActiveCoordinator } from './actions'

interface Props {
  stats: SuperadminStats
  pending: PendingCoordinator[]
  active: ActiveCoordinator[]
  servants: ActiveCoordinator[]
}

export default function SuperadminView({ stats, pending, active, servants }: Props) {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'
  const [pendingList, setPendingList] = useState(pending)
  const [coordinators, setCoordinators] = useState(active)
  const [servantList, setServantList] = useState(servants)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleApproveReject(id: string, approve: boolean) {
    setLoadingId(id)
    const result = approve ? await approveCoordinator(id) : await rejectCoordinator(id)
    if (result.success) setPendingList(p => p.filter(c => c.id !== id))
    setLoadingId(null)
  }

  async function handleDemote(coord: ActiveCoordinator) {
    setLoadingId(coord.id)
    const result = await setAdminRole(coord.id, 'superuser')
    if (result.success) {
      setCoordinators(c => c.filter(x => x.id !== coord.id))
      setServantList(s => [...s, { ...coord, role: 'superuser' }])
    }
    setLoadingId(null)
  }

  async function handlePromote(servant: ActiveCoordinator) {
    setLoadingId(servant.id)
    const result = await setAdminRole(servant.id, 'admin')
    if (result.success) {
      setServantList(s => s.filter(x => x.id !== servant.id))
      setCoordinators(c => [...c, { ...servant, role: 'admin' }])
    }
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
          <StatCard value={coordinators.length} label={isAr ? 'أمناء المراحل' : 'Coordinators'} sub={pendingList.length > 0 ? `${pendingList.length} ${isAr ? 'معلق' : 'pending'}` : undefined} warn={pendingList.length > 0} />
          <StatCard value={servantList.length} label={isAr ? 'الخدام' : 'Servants'} />
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
                    <Button variant="outline" size="sm" className="flex-1" disabled={loadingId === coord.id} onClick={() => handleApproveReject(coord.id, false)}>
                      {loadingId === coord.id ? <Loader2 size={14} className="animate-spin" /> : (isAr ? 'رفض' : 'Reject')}
                    </Button>
                    <Button size="sm" className="flex-[2] shadow-[0_2px_0_rgba(138,90,15,0.25)]" disabled={loadingId === coord.id} onClick={() => handleApproveReject(coord.id, true)}>
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
          {coordinators.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {isAr ? 'لا يوجد أمناء مراحل' : 'No coordinators yet'}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {coordinators.map(coord => (
                <div key={coord.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <PersonRow name={coord.user?.name} email={coord.user?.email} tenantName={coord.tenantName} gradeName={coord.gradeName} />
                  <Button variant="outline" size="sm" className="flex-shrink-0 text-xs" disabled={loadingId === coord.id} onClick={() => handleDemote(coord)}>
                    {loadingId === coord.id ? <Loader2 size={12} className="animate-spin" /> : (isAr ? 'تحويل لخادم' : 'Make Servant')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active servants */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground mb-3">
            {isAr ? 'الخدام النشطون' : 'Active Servants'}
          </p>
          {servantList.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {isAr ? 'لا يوجد خدام' : 'No servants yet'}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {servantList.map(servant => (
                <div key={servant.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <PersonRow name={servant.user?.name} email={servant.user?.email} tenantName={servant.tenantName} gradeName={servant.gradeName} />
                  <Button size="sm" className="flex-shrink-0 text-xs shadow-[0_2px_0_rgba(138,90,15,0.25)]" disabled={loadingId === servant.id} onClick={() => handlePromote(servant)}>
                    {loadingId === servant.id ? <Loader2 size={12} className="animate-spin" /> : (isAr ? 'ترقية لأمين مرحلة' : 'Make Coordinator')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

function PersonRow({ name, email, tenantName, gradeName }: { name?: string | null; email?: string | null; tenantName?: string | null; gradeName?: string | null }) {
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
