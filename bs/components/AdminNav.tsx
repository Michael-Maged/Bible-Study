'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type AdminNavTab = 'dashboard' | 'kids' | 'assignments' | 'history' | 'leaderboard'

const tabs = [
  {
    key: 'dashboard' as const, label: 'Home', path: '/admin',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
        <rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
        <rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
        <rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
      </svg>
    ),
  },
  {
    key: 'kids' as const, label: 'Kids', path: '/admin/kids',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
        <path d="M1 17c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
        <path d="M13 5a3 3 0 010 4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
        <path d="M16 17c1.5-1 2-2.5 2-3.5a2.5 2.5 0 00-3-2.4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'assignments' as const, label: 'Reading', path: '/admin/assignments',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
        <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'history' as const, label: 'History', path: '/admin/history',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'leaderboard' as const, label: 'Ranks', path: '/admin/leaderboard',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 18V11h6v7M3 18v-5h4v5M13 18V7h4v11" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export default function AdminNav({ active }: { active: AdminNavTab }) {
  const router = useRouter()

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.clear()
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((n) => caches.delete(n)))
    }
    window.location.href = '/login'
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => !isActive && router.push(tab.path)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {tab.icon(isActive)}
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-muted-foreground hover:text-destructive transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4H4a1 1 0 00-1 1v10a1 1 0 001 1h3M13 14l3-4-3-4M16 10H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] font-bold">Logout</span>
        </button>
      </div>
    </nav>
  )
}
