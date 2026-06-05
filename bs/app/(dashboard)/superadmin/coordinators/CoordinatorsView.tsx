'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { demoteToServant } from '../actions'
import type { Member } from '../actions'
import SuperadminNav from '../SuperadminNav'
import { PersonRow } from '../SuperadminView'

export default function CoordinatorsView({ coordinators }: { coordinators: Member[] }) {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'
  const [list, setList] = useState(coordinators)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDemote(id: string) {
    setLoadingId(id)
    setError(null)
    const result = await demoteToServant(id)
    if (result.success) {
      setList(l => l.filter(c => c.id !== id))
    } else {
      setError(result.error ?? 'Failed')
    }
    setLoadingId(null)
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <main className="max-w-2xl mx-auto px-5 pt-6 space-y-6">

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Super Admin</p>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">
            {isAr ? 'أمناء المراحل' : 'Coordinators'}
          </h1>
        </div>

        <SuperadminNav />

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: 'rgba(166,66,66,0.08)', color: '#a64242', border: '1px solid rgba(166,66,66,0.2)' }}>
            {error}
          </div>
        )}

        {list.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {isAr ? 'لا يوجد أمناء مراحل' : 'No coordinators yet'}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {list.map(coord => (
              <div key={coord.id} className="px-4 py-3 flex items-center gap-3">
                <PersonRow name={coord.user?.name} email={coord.user?.email} tenantName={coord.tenantName} gradeName={coord.gradeName} />
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 text-xs"
                  disabled={loadingId === coord.id}
                  onClick={() => handleDemote(coord.id)}
                >
                  {loadingId === coord.id
                    ? <Loader2 size={12} className="animate-spin" />
                    : (isAr ? 'تحويل لخادم' : 'Make Servant')}
                </Button>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
