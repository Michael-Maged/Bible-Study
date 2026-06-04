'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, toggle } = useLanguage()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle language"
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full border border-border bg-card text-xs font-bold transition-colors hover:bg-muted ${className}`}
    >
      <span style={{ color: lang === 'en' ? 'var(--foreground)' : 'var(--muted-foreground)' }}>EN</span>
      <span className="text-muted-foreground">|</span>
      <span style={{ color: lang === 'ar' ? 'var(--foreground)' : 'var(--muted-foreground)', fontFamily: 'var(--font-arabic)' }}>ع</span>
    </button>
  )
}
