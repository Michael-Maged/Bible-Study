'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getRequestDetails, handleApproveRequest } from '../../actions'

export default function RequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequest()
  }, [])

  async function loadRequest() {
    const type = params.type as 'admin' | 'kid'
    const id = params.id as string
    const result = await getRequestDetails(type, id)
    if (result.success) {
      setRequest(result.data)
    }
    setLoading(false)
  }

  async function handleAction(approved: boolean) {
    const type = params.type as 'admin' | 'kid'
    const id = params.id as string
    const result = await handleApproveRequest(type, id, approved)
    if (result.success) {
      router.push('/admin/pending')
    }
  }

  if (loading) {
    return (
      <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">Request not found</div>
      </div>
    )
  }

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-[#121c0d] dark:text-[#f6f8f5] min-h-screen">
      <header className="sticky top-0 z-50 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md border-b border-[#59f20d]/10">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto w-full">
          <button onClick={() => router.back()} className="flex size-10 items-center justify-center rounded-full hover:bg-[#59f20d]/10 transition-colors">
            <span className="text-2xl">←</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight flex-1 text-center">Request Details</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 space-y-6">
        <div className="bg-white dark:bg-[#1f2e18] rounded-xl p-6 shadow-sm border border-[#59f20d]/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#59f20d]/10 rounded-full flex items-center justify-center text-3xl">
              {request.user.gender === 'male' ? '👦' : '👧'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{request.user.name}</h2>
              {request.type === 'admin' && <span className="text-[#59f20d] font-bold text-xs px-2 py-1 bg-[#59f20d]/10 rounded-full">Superuser</span>}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-base">{request.user.email || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Age</p>
              <p className="text-base">{request.user.age}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Gender</p>
              <p className="text-base capitalize">{request.user.gender}</p>
            </div>

            {request.type === 'kid' && (
              <>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Class</p>
                  <p className="text-base">{request.class?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Grade</p>
                  <p className="text-base">{request.class?.grade}</p>
                </div>
              </>
            )}

            {request.type === 'admin' && (
              <>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Role</p>
                  <p className="text-base capitalize">{request.role}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Grade</p>
                  <p className="text-base">{request.grade?.name}</p>
                </div>
              </>
            )}

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Status</p>
              <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-bold">
                Pending
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => handleAction(false)}
            className="flex-1 h-14 rounded-full bg-[#59f20d]/10 text-[#121c0d] dark:text-[#59f20d] font-bold text-base hover:bg-[#59f20d]/20 transition-colors border border-[#59f20d]/20"
          >
            Reject
          </button>
          <button 
            onClick={() => handleAction(true)}
            className="flex-[2] h-14 rounded-full bg-[#59f20d] text-black font-bold text-base shadow-md active:scale-95 transition-all"
          >
            Approve Request
          </button>
        </div>
      </main>
    </div>
  )
}
