'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { signOutSuperadmin } from './actions'

const tabs = [
  { href: '/superadmin',              labelEn: 'Overview',      labelAr: 'نظرة عامة'      },
  { href: '/superadmin/coordinators', labelEn: 'Coordinators',  labelAr: 'أمناء المراحل'  },
  { href: '/superadmin/servants',     labelEn: 'Servants',      labelAr: 'الخدام'          },
]

export default function SuperadminNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex gap-1 p-1 rounded-full" style={{ background: '#f0e8d6' }}>
        {tabs.map(tab => {
          const isActive = tab.href === '/superadmin' ? pathname === '/superadmin' : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
              style={isActive
                ? { background: '#fff', color: 'var(--foreground)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
                : { color: 'var(--muted-foreground)' }
              }
            >
              {isAr ? tab.labelAr : tab.labelEn}
            </Link>
          )
        })}
      </div>
      <form action={signOutSuperadmin}>
        <button type="submit" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          {isAr ? 'تسجيل الخروج' : 'Sign out'}
        </button>
      </form>
    </div>
  )
}
