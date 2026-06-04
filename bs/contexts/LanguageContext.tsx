'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Lang, Label } from '@/utils/labels'

interface LanguageContextValue {
  lang: Lang
  toggle: () => void
  t: (label: Label) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  toggle: () => {},
  t: (label) => label.en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang
    if (saved === 'ar' || saved === 'en') setLang(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.documentElement.dataset.lang = lang
  }, [lang])

  const toggle = () => setLang(l => l === 'en' ? 'ar' : 'en')
  const t = (label: Label) => label[lang]

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
