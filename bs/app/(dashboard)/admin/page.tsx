'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getDashboardStats } from './actions'
import { cacheStats, getCachedStats, isOnline } from '@/utils/offlineCache'
import OfflineBanner from '@/components/OfflineBanner'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [userRole, setUserRole] = useState<string>('')
  const [stats, setStats] = useState({ totalUsers: 0, pendingCount: 0, lastUpdated: '' })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const role = document.cookie.split('; ').find(row => row.startsWith('user-role='))?.split('=')[1]
      
      if (!session || (role !== 'admin' && role !== 'superuser')) {
        router.push('/login')
      } else {
        setUserRole(role || '')
        loadStats()
      }
    }
    checkAuth()
  }, [router])

  const loadStats = async () => {
    if (!isOnline()) {
      const cached = getCachedStats()
      if (cached) setStats(cached)
      return
    }
    const result = await getDashboardStats()
    if (result.success && result.data) {
      setStats(result.data)
      cacheStats(result.data)
    } else {
      const cached = getCachedStats()
      if (cached) setStats(cached)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/login')
  }

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-[#121c0d] dark:text-white min-h-screen pb-24">
      <OfflineBanner />
      <header className="sticky top-0 z-20 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-[#59f20d]/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700">
            <span className="text-2xl">📖</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">{userRole === 'superuser' ? 'Superuser' : 'Admin'} Dashboard</h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">Manage Bible Study</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[#59f20d] text-2xl">📊</span>
            <h2 className="text-lg font-bold">Quick Stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{userRole === 'admin' ? 'Total Users' : 'Total Kids'}</p>
              <p className="text-3xl font-bold text-[#59f20d]">{stats.totalUsers}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Pending</p>
              <p className="text-3xl font-bold text-orange-500">{stats.pendingCount}</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[#59f20d] text-2xl">⚡</span>
            <h2 className="text-lg font-bold">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <button onClick={() => router.push('/admin/kids')} className="w-full bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between hover:border-[#59f20d] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="text-left">
                  <p className="font-bold">Manage Kids</p>
                  <p className="text-xs text-zinc-500">{stats.pendingCount} pending approvals</p>
                </div>
              </div>
              <span className="text-zinc-400">→</span>
            </button>

            <button onClick={() => router.push('/admin/assignments')} className="w-full bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between hover:border-[#59f20d] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="text-left">
                  <p className="font-bold">Bible Assignments</p>
                  <p className="text-xs text-zinc-500">Create daily readings</p>
                </div>
              </div>
              <span className="text-zinc-400">→</span>
            </button>

<button onClick={() => router.push('/admin/leaderboard')} className="w-full bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between hover:border-[#59f20d] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="text-left">
                  <p className="font-bold">Leaderboard</p>
                  <p className="text-xs text-zinc-500">View kids progress</p>
                </div>
              </div>
              <span className="text-zinc-400">→</span>
            </button>

            <button onClick={() => router.push('/admin/history')} className="w-full bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between hover:border-[#59f20d] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="text-left">
                  <p className="font-bold">Reading History</p>
                  <p className="text-xs text-zinc-500">View future assignments</p>
                </div>
              </div>
              <span className="text-zinc-400">→</span>
            </button>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="bg-slate-900 dark:bg-slate-800 rounded-full p-2 flex items-center justify-between shadow-2xl border border-white/10">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 flex flex-col items-center justify-center py-2 ${activeTab === 'dashboard' ? 'bg-[#59f20d] rounded-full text-slate-900' : 'text-white hover:text-[#59f20d]'} transition-colors`}>
            <span className="text-2xl">🏠</span>
            <span className="text-[10px] font-black uppercase mt-1">Dashboard</span>
          </button>
          <button onClick={() => router.push('/admin/assignments')} className={`flex-1 flex flex-col items-center justify-center py-2 ${activeTab === 'content' ? 'bg-[#59f20d] rounded-full text-slate-900' : 'text-white hover:text-[#59f20d]'} transition-colors`}>
            <span className="text-2xl">📖</span>
            <span className="text-[10px] font-black uppercase mt-1">Content</span>
          </button>
          <button onClick={() => router.push('/admin/history')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">📚</span>
            <span className="text-[10px] font-black uppercase mt-1">History</span>
          </button>
          <button onClick={() => router.push('/admin/kids')} className={`flex-1 flex flex-col items-center justify-center py-2 ${activeTab === 'kids' ? 'bg-[#59f20d] rounded-full text-slate-900' : 'text-white hover:text-[#59f20d]'} transition-colors`}>
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
