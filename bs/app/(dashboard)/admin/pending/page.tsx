'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchPendingRequests, handleApproveRequest } from './actions'

type PendingUser = {
  id: string
  user: { name: string; gender: string }
  class?: { name: string; grade: number }
  grade?: { name: string }
  type: 'admin' | 'kid'
}

export default function PendingRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [availableClasses, setAvailableClasses] = useState<string[]>([])

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    console.log('loadRequests called')
    setLoading(true)
    const result = await fetchPendingRequests()
    console.log('fetchPendingRequests result:', result)
    if (result.success && result.data) {
      const allRequests: PendingUser[] = [
        ...result.data.superusers.map((s: any) => ({ ...s, type: 'admin' as const })),
        ...result.data.kids.map((k: any) => ({ ...k, type: 'kid' as const }))
      ]
      console.log('All requests count:', allRequests.length)
      console.log('All requests:', allRequests)
      console.log('Request IDs:', allRequests.map(r => `${r.type}-${r.id}`))
      setRequests(allRequests)
      
      // Extract unique class names using Set with proper mapping
      const classNames = allRequests
        .filter(r => r.class?.name)
        .map(r => r.class!.name)
      const uniqueClasses = Array.from(new Set(classNames))
      setAvailableClasses(uniqueClasses)
    }
    setLoading(false)
  }

  async function handleAction(id: string, type: 'admin' | 'kid', approved: boolean) {
    const result = await handleApproveRequest(type, id, approved)
    if (result.success) {
      await loadRequests()
    }
  }

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = classFilter === 'all' || r.class?.name === classFilter
    return matchesSearch && matchesClass
  })

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-[#121c0d] dark:text-[#f6f8f5] min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md border-b border-[#59f20d]/10">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto w-full">
          <button onClick={() => router.push('/admin')} className="flex size-10 items-center justify-center rounded-full hover:bg-[#59f20d]/10 transition-colors">
            <span className="text-2xl">←</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight flex-1 text-center">Pending Requests</h1>
          <div className="flex w-10 items-center justify-end">
            <span className="bg-[#59f20d] text-black text-xs font-bold px-2 py-1 rounded-full shrink-0 shadow-sm">{requests.length}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 max-w-md mx-auto w-full px-4">
        <div className="py-4 space-y-3">
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
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-none bg-white dark:bg-[#1f2e18] shadow-sm focus:ring-2 focus:ring-[#59f20d] text-base text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Classes</option>
            {availableClasses.map(className => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-zinc-500">Loading...</div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-6xl mb-4">✅</span>
            <p className="text-zinc-500">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={`${request.type}-${request.id}`} className="bg-white dark:bg-[#1f2e18] rounded-xl overflow-hidden shadow-sm border border-[#59f20d]/5">
                <button 
                  onClick={() => router.push(`/admin/pending/${request.type}/${request.id}`)}
                  className="w-full p-4 text-left hover:bg-[#59f20d]/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{request.user.name}</h3>
                      <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">{request.user.gender === 'male' ? '👦' : '👧'} {request.user.gender}</span>
                        <span className="flex items-center gap-1">🎓 {request.type === 'admin' ? request.grade?.name : request.class?.name}</span>
                      </div>
                    </div>
                    {request.type === 'admin' && <span className="text-[#59f20d] font-bold text-xs px-2 py-1 bg-[#59f20d]/10 rounded-full">Superuser</span>}
                  </div>
                </button>
                <div className="flex gap-3 p-4 pt-0">
                  <button 
                    onClick={() => handleAction(request.id, request.type, false)}
                    className="flex-1 h-12 rounded-full bg-[#59f20d]/10 text-[#121c0d] dark:text-[#59f20d] font-bold text-sm hover:bg-[#59f20d]/20 transition-colors border border-[#59f20d]/20"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(request.id, request.type, true)}
                    className="flex-[2] h-12 rounded-full bg-[#59f20d] text-black font-bold text-sm shadow-md active:scale-95 transition-all"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#1f2e18]/90 backdrop-blur-lg border-t border-[#59f20d]/10 pb-6 pt-2 z-50">
        <div className="max-w-md mx-auto flex justify-around px-4">
          <button className="flex flex-col items-center gap-1 text-[#59f20d]">
            <span className="text-2xl">⏳</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Pending</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">📜</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">👥</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Admins</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">⚙️</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
