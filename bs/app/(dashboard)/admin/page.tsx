'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getDashboardStats } from './actions'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [userRole, setUserRole] = useState<string>('')
  const [stats, setStats] = useState({ totalUsers: 0, pendingCount: 0 })
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
    
    // Reload stats when page becomes visible (user returns from another page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadStats()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [router])

  const loadStats = async () => {
    const result = await getDashboardStats()
    if (result.success && result.data) {
      setStats(result.data)
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
        <button onClick={handleLogout} className="bg-[#59f20d] text-[#121c0d] px-4 py-2 rounded-full font-bold text-sm shadow-sm hover:scale-105 transition-transform">
          Logout
        </button>
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
            <button onClick={() => router.push('/admin/pending')} className="w-full bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between hover:border-[#59f20d] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="text-left">
                  <p className="font-bold">Approve Requests</p>
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
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 pb-safe shadow-2xl">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-[#59f20d]' : 'text-zinc-400'}`}>
            <span className="text-2xl">🏠</span>
            <span className="text-[10px] font-bold">Dashboard</span>
          </button>
          <button onClick={() => router.push('/admin/assignments')} className={`flex flex-col items-center gap-1 ${activeTab === 'content' ? 'text-[#59f20d]' : 'text-zinc-400'}`}>
            <span className="text-2xl">📖</span>
            <span className="text-[10px] font-bold">Content</span>
          </button>
          <button onClick={() => router.push('/admin/pending')} className={`flex flex-col items-center gap-1 ${activeTab === 'kids' ? 'text-[#59f20d]' : 'text-zinc-400'}`}>
            <span className="text-2xl">👥</span>
            <span className="text-[10px] font-bold">Kids</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-[#59f20d]' : 'text-zinc-400'}`}>
            <span className="text-2xl">⚙️</span>
            <span className="text-[10px] font-bold">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
