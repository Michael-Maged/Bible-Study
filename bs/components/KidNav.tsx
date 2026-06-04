'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import LangToggle from '@/components/LangToggle'
import { L } from '@/utils/labels'

type KidNavTab = 'dashboard' | 'history' | 'leaderboard' | 'profile'

export default function KidNav({ active }: { active: KidNavTab }) {
  const router = useRouter()
  const { t } = useLanguage()

  const tabs = [
    {
      key: 'dashboard' as const,
      label: t(L.nav.today),
      path: '/kid/dashboard',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path d="M3 8.5L10 3l7 5.5V16a1.5 1.5 0 01-1.5 1.5h-3v-5h-5v5h-3A1.5 1.5 0 013 16V8.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: 'history' as const,
      label: t(L.nav.history),
      path: '/kid/history',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M3 8h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      key: 'leaderboard' as const,
      label: t(L.nav.ranks),
      path: '/kid/leaderboard',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path d="M6 16V9h8v7M3 16V12h3v4M14 16v-5h3v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: 'profile' as const,
      label: t(L.nav.me),
      path: '/kid/profile',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M3.5 17c0-3 2.9-5.3 6.5-5.3S16.5 14 16.5 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border" style={{ paddingBottom: 8 }}>
      <div className="flex items-stretch max-w-lg mx-auto relative">
        <div className="absolute -top-8 end-3">
          <LangToggle />
        </div>
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
                  layoutId="kid-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-sm bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {tab.icon}
              <span className={cn('text-[10px]', isActive ? 'font-bold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
