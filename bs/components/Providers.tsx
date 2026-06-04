'use client'

import { LanguageProvider } from '@/contexts/LanguageContext'
import LangToggle from '@/components/LangToggle'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <LangToggle className="fixed top-4 end-4 z-50" />
      {children}
    </LanguageProvider>
  )
}
