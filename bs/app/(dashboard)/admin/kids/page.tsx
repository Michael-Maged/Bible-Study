'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchAssignedKids, handleApproveRequest } from './actions'
import type { RequestDetail } from '@/types'
import AdminNav from '@/components/AdminNav'

type Kid = {
  id: string
  user: { name: string; gender: string }
  class?: { name: string; grade: number }
  grade?: { name: string }
  status: 'pending' | 'accepted' | 'rejected'
  type: 'admin' | 'kid'
}

export default function AssignedKidsPage() {
  const router = useRouter()
  const [kids, setKids] = useState<Kid[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userRole, setUserRole] = useState('')

  async function loadKids() {
    setLoading(true)
    const result = await fetchAssignedKids()
    if (result.success && result.data) {
      setKids([
        ...result.data.superusers.map((s: RequestDetail) => ({ ...s, type: 'admin' as const })),
        ...result.data.kids.map((k: RequestDetail) => ({ ...k, type: 'kid' as const })),
      ])
    }
    setLoading(false)
  }

  useEffect(() => {
    const role = document.cookie.split('; ').find(r => r.startsWith('user-role='))?.split('=')[1]
    setUserRole(role || '')
    loadKids()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAction(id: string, type: 'admin' | 'kid', approved: boolean) {
    const result = await handleApproveRequest(type, id, approved)
    if (result.success) loadKids()
  }

  const displayKids = userRole === 'superuser' ? kids.filter(k => k.type === 'kid') : kids
  const filtered = displayKids.filter(k => {
    const matchSearch = k.user.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || k.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: displayKids.length,
    accepted: displayKids.filter(k => k.status === 'accepted').length,
    pending: displayKids.filter(k => k.status === 'pending').length,
  }

  const statusColor = (s: string) =>
    s === 'accepted' ? 'text-[#59f20d] bg-[#59f20d]/10' :
    s === 'pending'  ? 'text-orange-400 bg-orange-400/10' :
    'text-red-400 bg-red-400/10'

  return (
    <div className="bg-[#0d1a08] text-slate-100 min-h-screen pb-24">
      <header className="px-5 pt-12 pb-6">
        <p className="text-[#59f20d] text-xs font-bold uppercase tracking-widest mb-1">Management</p>
        <h1 className="text-2xl font-black tracking-tight">My Kids</h1>
      </header>

      <main className="px-5 space-y-4 max-w-md mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-100' },
            { label: 'Active', value: stats.accepted, color: 'text-[#59f20d]' },
            { label: 'Pending', value: stats.pending, color: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1a2e12] rounded-2xl p-4 text-center border border-[#59f20d]/10">
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="space-y-2">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#1a2e12] border border-[#59f20d]/10 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#59f20d]/40"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'accepted', 'pending', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-1 h-9 rounded-xl text-xs font-bold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-[#59f20d] text-[#0d1a08]'
                    : 'bg-[#1a2e12] text-slate-400 border border-[#59f20d]/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#59f20d]/30 border-t-[#59f20d] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-16 h-16 mx-auto mb-3 opacity-30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="font-bold">No kids found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(kid => (
              <div key={`${kid.type}-${kid.id}`} className="bg-[#1a2e12] rounded-2xl border border-[#59f20d]/10 overflow-hidden">
                <button
                  onClick={() => router.push(`/admin/kids/${kid.type}/${kid.id}`)}
                  className="w-full p-4 text-left flex items-center gap-3 hover:bg-[#59f20d]/5 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#0d1a08] flex items-center justify-center flex-shrink-0 text-2xl">
                    {kid.user.gender === 'male' ? '👦' : '👧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{kid.user.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {kid.type === 'admin' ? kid.grade?.name : kid.class?.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${statusColor(kid.status)}`}>
                      {kid.status}
                    </span>
                    {kid.type === 'admin' && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-purple-400 bg-purple-400/10">
                        superuser
                      </span>
                    )}
                  </div>
                </button>
                {kid.status === 'pending' && (
                  <div className="flex gap-2 px-4 pb-4">
                    <button
                      onClick={() => handleAction(kid.id, kid.type, false)}
                      className="flex-1 h-10 rounded-xl bg-[#0d1a08] text-slate-300 font-bold text-sm border border-[#59f20d]/10 hover:border-red-400/30 hover:text-red-400 transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(kid.id, kid.type, true)}
                      className="flex-[2] h-10 rounded-xl bg-[#59f20d] text-[#0d1a08] font-bold text-sm active:scale-95 transition-all"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <AdminNav active="kids" />
    </div>
  )
}
