'use client'

import { useRouter } from 'next/navigation'

type KidNavTab = 'dashboard' | 'history' | 'leaderboard' | 'profile'

const tabs = [
  { key: 'dashboard', icon: '📖', label: 'Reading', path: '/kid/dashboard' },
  { key: 'history', icon: '📚', label: 'History', path: '/kid/history' },
  { key: 'leaderboard', icon: '🏆', label: 'Ranks', path: '/kid/leaderboard' },
  { key: 'profile', icon: '👤', label: 'Profile', path: '/kid/profile' },
] as const

export default function KidNav({ active }: { active: KidNavTab }) {
  const router = useRouter()

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.clear()
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }
    window.location.href = '/login'
  }

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <div className="bg-slate-900 dark:bg-slate-800 rounded-full p-2 flex items-center justify-between shadow-2xl border border-white/10">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => tab.key !== active && router.push(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
              active === tab.key
                ? 'bg-[#59f20d] rounded-full text-slate-900'
                : 'text-white hover:text-[#59f20d]'
            }`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-[10px] font-black uppercase mt-1">{tab.label}</span>
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2 text-red-500 hover:text-red-400 transition-colors"
        >
          <span className="text-2xl">❌</span>
          <span className="text-[10px] font-black uppercase mt-1">Logout</span>
        </button>
      </div>
    </nav>
  )
}
