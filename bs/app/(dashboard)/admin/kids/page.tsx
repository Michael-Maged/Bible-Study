'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchAssignedKids, handleApproveRequest } from './actions'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userRole, setUserRole] = useState<string>('')

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/login'
  }

  useEffect(() => {
    const role = document.cookie.split('; ').find(row => row.startsWith('user-role='))?.split('=')[1]
    setUserRole(role || '')
    loadKids()
  }, [])

  async function loadKids() {
    setLoading(true)
    const result = await fetchAssignedKids()
    if (result.success && result.data) {
      const allKids: Kid[] = [
        ...result.data.superusers.map((s: any) => ({ ...s, type: 'admin' as const })),
        ...result.data.kids.map((k: any) => ({ ...k, type: 'kid' as const }))
      ]
      setKids(allKids)
    }
    setLoading(false)
  }

  async function handleAction(id: string, type: 'admin' | 'kid', approved: boolean) {
    const result = await handleApproveRequest(type, id, approved)
    if (result.success) {
      await loadKids()
    }
  }

  const filteredKids = kids.filter(k => {
    const matchesSearch = k.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || k.status === statusFilter
    const matchesType = userRole === 'superuser' ? k.type === 'kid' : true
    return matchesSearch && matchesStatus && matchesType
  })

  const displayKids = userRole === 'superuser' ? kids.filter(k => k.type === 'kid') : kids
  const stats = {
    superusers: kids.filter(k => k.type === 'admin').length,
    kids: kids.filter(k => k.type === 'kid').length,
    approved: displayKids.filter(k => k.status === 'accepted').length,
    pending: displayKids.filter(k => k.status === 'pending').length
  }

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-[#121c0d] dark:text-[#f6f8f5] min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md border-b border-[#59f20d]/10">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto w-full">
          <button onClick={() => router.push('/admin')} className="flex size-10 items-center justify-center rounded-full hover:bg-[#59f20d]/10 transition-colors">
            <span className="text-2xl">←</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight flex-1 text-center">My Kids</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 max-w-md mx-auto w-full px-4">
        <div className="py-4 space-y-3">
          {userRole === 'admin' ? (
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white dark:bg-[#1f2e18] rounded-xl p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-purple-500">{stats.superusers}</p>
                <p className="text-xs text-gray-500">Superusers</p>
              </div>
              <div className="bg-white dark:bg-[#1f2e18] rounded-xl p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-[#59f20d]">{stats.kids}</p>
                <p className="text-xs text-gray-500">Kids</p>
              </div>
              <div className="bg-white dark:bg-[#1f2e18] rounded-xl p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
                <p className="text-xs text-gray-500">Approved</p>
              </div>
              <div className="bg-white dark:bg-[#1f2e18] rounded-xl p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-[#1f2e18] rounded-xl p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-[#59f20d]">{stats.kids}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-white dark:bg-[#1f2e18] rounded-xl p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
                <p className="text-xs text-gray-500">Approved</p>
              </div>
              <div className="bg-white dark:bg-[#1f2e18] rounded-xl p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          )}

          <label className="relative flex items-center w-full">
            <span className="absolute left-4 text-[#59f20d]/70 text-xl">🔍</span>
            <input 
              className="w-full h-12 pl-12 pr-4 rounded-xl border-none bg-white dark:bg-[#1f2e18] shadow-sm focus:ring-2 focus:ring-[#59f20d] text-base placeholder:text-gray-400 dark:placeholder:text-gray-500" 
              placeholder="Search by name..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-none bg-white dark:bg-[#1f2e18] shadow-sm focus:ring-2 focus:ring-[#59f20d] text-base text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Status</option>
            <option value="accepted">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-zinc-500">Loading...</div>
          </div>
        ) : filteredKids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-6xl mb-4">👥</span>
            <p className="text-zinc-500">No kids found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredKids.map((kid) => (
              <div key={`${kid.type}-${kid.id}`} className="bg-white dark:bg-[#1f2e18] rounded-xl overflow-hidden shadow-sm border border-[#59f20d]/5">
                <button 
                  onClick={() => router.push(`/admin/kids/${kid.type}/${kid.id}`)}
                  className="w-full p-4 text-left hover:bg-[#59f20d]/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{kid.user.name}</h3>
                      <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">{kid.user.gender === 'male' ? '👦' : '👧'} {kid.user.gender}</span>
                        <span className="flex items-center gap-1">🎓 {kid.type === 'admin' ? kid.grade?.name : kid.class?.name}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        kid.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        kid.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {kid.status}
                      </span>
                      {kid.type === 'admin' && <span className="text-[#59f20d] font-bold text-xs px-2 py-1 bg-[#59f20d]/10 rounded-full">Superuser</span>}
                    </div>
                  </div>
                </button>
                {kid.status === 'pending' && (
                  <div className="flex gap-3 p-4 pt-0">
                    <button 
                      onClick={() => handleAction(kid.id, kid.type, false)}
                      className="flex-1 h-12 rounded-full bg-[#59f20d]/10 text-[#121c0d] dark:text-[#59f20d] font-bold text-sm hover:bg-[#59f20d]/20 transition-colors border border-[#59f20d]/20"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAction(kid.id, kid.type, true)}
                      className="flex-[2] h-12 rounded-full bg-[#59f20d] text-black font-bold text-sm shadow-md active:scale-95 transition-all"
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

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="bg-slate-900 dark:bg-slate-800 rounded-full p-2 flex items-center justify-between shadow-2xl border border-white/10">
          <button onClick={() => router.push('/admin')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">🏠</span>
            <span className="text-[10px] font-black uppercase mt-1">Dashboard</span>
          </button>
          <button onClick={() => router.push('/admin/assignments')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">📖</span>
            <span className="text-[10px] font-black uppercase mt-1">Content</span>
          </button>
          <button onClick={() => router.push('/admin/history')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">📚</span>
            <span className="text-[10px] font-black uppercase mt-1">History</span>
          </button>
          <button className="flex-1 flex flex-col items-center justify-center py-2 bg-[#59f20d] rounded-full text-slate-900">
            <span className="text-2xl">👥</span>
            <span className="text-[10px] font-black uppercase mt-1">Kids</span>
          </button>
          <button onClick={handleLogout} className="flex-1 flex flex-col items-center justify-center py-2 text-red-500 hover:text-red-400 transition-colors">
            <span className="text-2xl">❌</span>
            <span className="text-[10px] font-black uppercase mt-1">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
