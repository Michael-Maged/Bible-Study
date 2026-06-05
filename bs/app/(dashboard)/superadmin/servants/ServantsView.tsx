'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { promoteToCoordinator, transferServant } from '../actions'
import type { Member, GradeOption } from '../actions'
import SuperadminNav from '../SuperadminNav'
import { PersonRow } from '../SuperadminView'

function groupByGrade(rows: ServantRowState[]): { key: string; label: string; members: ServantRowState[] }[] {
  const map = new Map<string, { label: string; members: ServantRowState[] }>()
  for (const row of rows) {
    const key = `${row.grade ?? 'none'}__${row.tenant ?? 'none'}`
    const label = row.gradeName ?? (row.grade != null ? `Grade ${row.grade}` : 'Unassigned')
    if (!map.has(key)) map.set(key, { label, members: [] })
    map.get(key)!.members.push(row)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      const gradeA = parseInt(a.split('__')[0]) || 9999
      const gradeB = parseInt(b.split('__')[0]) || 9999
      return gradeA - gradeB
    })
    .map(([key, { label, members }]) => ({ key, label, members }))
}

interface ServantRowState extends Member {
  transferring: boolean
  promoting: boolean
  error: string | null
}

export default function ServantsView({ servants, grades }: { servants: Member[]; grades: GradeOption[] }) {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const [rows, setRows] = useState<ServantRowState[]>(
    servants.map(s => ({ ...s, transferring: false, promoting: false, error: null }))
  )

  function updateRow(id: string, patch: Partial<ServantRowState>) {
    setRows(r => r.map(row => row.id === id ? { ...row, ...patch } : row))
  }

  async function handlePromote(id: string) {
    updateRow(id, { promoting: true, error: null })
    const result = await promoteToCoordinator(id)
    if (result.success) {
      setRows(r => r.filter(row => row.id !== id))
    } else {
      updateRow(id, { promoting: false, error: result.error ?? 'Failed' })
    }
  }

  async function handleTransfer(servant: ServantRowState, gradeNum: number, tenant: string, gradeName: string, tenantName: string) {
    updateRow(servant.id, { transferring: true, error: null })
    const result = await transferServant(servant.id, gradeNum, tenant)
    if (result.success) {
      updateRow(servant.id, { transferring: false, grade: gradeNum, tenant, gradeName, tenantName })
    } else {
      updateRow(servant.id, { transferring: false, error: result.error ?? 'Failed' })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <main className="max-w-2xl mx-auto px-5 pt-6 space-y-6">

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Super Admin</p>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">
            {isAr ? 'الخدام' : 'Servants'}
          </h1>
        </div>

        <SuperadminNav />

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {isAr ? 'لا يوجد خدام' : 'No servants yet'}
          </div>
        ) : (
          <div className="space-y-5">
            {groupByGrade(rows).map(({ key, label, members }) => (
              <section key={key}>
                <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground mb-2">{label}</p>
                <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                  {members.map(servant => (
                    <div key={servant.id} className="p-4 space-y-3">

                      {/* Info + Promote */}
                      <div className="flex items-center gap-3">
                        <PersonRow name={servant.user?.name} email={servant.user?.email} />
                        <Button
                          size="sm"
                          className="flex-shrink-0 text-xs shadow-[0_2px_0_rgba(138,90,15,0.25)]"
                          disabled={servant.promoting || servant.transferring}
                          onClick={() => handlePromote(servant.id)}
                        >
                          {servant.promoting
                            ? <Loader2 size={12} className="animate-spin" />
                            : (isAr ? 'ترقية لأمين مرحلة' : 'Make Coordinator')}
                        </Button>
                      </div>

                      {/* Grade transfer */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-semibold flex-shrink-0">
                          {isAr ? 'نقل إلى مرحلة:' : 'Transfer to:'}
                        </span>
                        <div className="relative flex-1">
                          {servant.transferring && (
                            <div className="absolute inset-0 flex items-center justify-center bg-card/70 rounded-lg z-10">
                              <Loader2 size={14} className="animate-spin text-primary" />
                            </div>
                          )}
                          <select
                            disabled={servant.transferring || servant.promoting}
                            value=""
                            onChange={e => {
                              const opt = grades.find(g => `${g.grade_num}__${g.tenant}` === e.target.value)
                              if (opt) handleTransfer(servant, opt.grade_num, opt.tenant, opt.name, opt.tenantName)
                            }}
                            className="w-full h-9 ps-3 pe-8 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 text-muted-foreground disabled:opacity-50"
                          >
                            <option value="" disabled>{isAr ? 'اختر مرحلة...' : 'Choose grade...'}</option>
                            {grades.map(g => (
                              <option key={`${g.grade_num}__${g.tenant}`} value={`${g.grade_num}__${g.tenant}`}>
                                {g.name} — {g.tenantName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {servant.error && (
                        <p className="text-xs font-semibold" style={{ color: '#a64242' }}>{servant.error}</p>
                      )}

                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
