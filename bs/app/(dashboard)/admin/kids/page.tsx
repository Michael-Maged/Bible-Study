'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchAssignedKids, handleApproveRequest } from './actions'
import type { RequestDetail } from '@/types'
import AdminNav from '@/components/AdminNav'
import OfflineBanner from '@/components/OfflineBanner'
import KidSummaryTile from '@/components/admin/KidSummaryTile'
import { Button } from '@/components/ui/button'

type Kid = {
  id: string
  user: { name: string; gender: string; age?: number; id?: string; user_id?: string }
  class?: { name: string; grade: number }
  grade?: { name: string }
  status: 'pending' | 'accepted' | 'rejected'
  type: 'admin' | 'kid'
}

export default function AssignedKidsPage() {
  const router = useRouter()
  const [kids, setKids] = useState<Kid[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userRole, setUserRole] = useState<string>('')

  async function loadKids() {
    setLoading(true)
    const result = await fetchAssignedKids()
    if (result.success && result.data) {
      const allKids: Kid[] = [
        ...result.data.superusers.map((s: RequestDetail) => ({ ...s, type: 'admin' as const })),
        ...result.data.kids.map((k: RequestDetail) => ({ ...k, type: 'kid' as const })),
      ]
      setKids(allKids)
    }
    setLoading(false)
  }

  useEffect(() => {
    const role = document.cookie.split('; ').find((r) => r.startsWith('user-role='))?.split('=')[1]
    setUserRole(role || '')
    loadKids()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAction(id: string, type: 'admin' | 'kid', approved: boolean) {
    const result = await handleApproveRequest(type, id, approved)
    if (result.success) await loadKids()
  }

  const displayKids = userRole === 'superuser' ? kids.filter((k) => k.type === 'kid') : kids
  const filteredKids = displayKids.filter((k) => {
    const matchesSearch = k.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || k.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pending = displayKids.filter((k) => k.status === 'pending').length

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <OfflineBanner />

      <main className="max-w-2xl mx-auto px-5 pt-6 space-y-4">

        {/* Page header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Management</p>
            <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">Kids</h1>
          </div>
          {pending > 0 && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full mt-1"
              style={{ background: 'rgba(194,133,27,0.12)', color: '#c2851b' }}
            >
              {pending} pending
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>

        {/* Status filter */}
        <div
          className="flex gap-1 p-1 rounded-full"
          style={{ background: '#f0e8d6' }}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'accepted', label: 'Approved' },
            { key: 'pending', label: 'Pending' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className="flex-1 text-center text-xs font-bold py-1.5 rounded-full transition-colors"
              style={
                statusFilter === key
                  ? { background: '#fff', color: 'var(--foreground)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
                  : { color: 'var(--muted-foreground)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredKids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-3 opacity-30">
              <circle cx="16" cy="14" r="6" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M4 34c0-6 5.4-10 12-10s12 4 12 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <p className="font-semibold text-sm">No kids found</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {filteredKids.map((kid) => (
                <div key={`${kid.type}-${kid.id}`}>
                  <KidSummaryTile
                    kidId={kid.id}
                    kidName={kid.user.name}
                    readToday={kid.status === 'accepted'}
                    onTap={() => router.push(`/admin/kids/${kid.type}/${kid.id}`)}
                  />
                  {kid.status === 'pending' && (
                    <div className="flex gap-2 px-4 pb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAction(kid.id, kid.type, false)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="flex-[2] shadow-[0_2px_0_rgba(138,90,15,0.25)]"
                        onClick={() => handleAction(kid.id, kid.type, true)}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <AdminNav active="kids" />
    </div>
  )
}
