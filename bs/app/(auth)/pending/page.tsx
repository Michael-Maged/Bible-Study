'use client'

import { createClient } from '@/utils/supabase/client'

export default function PendingPage() {
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/login'
  }

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white/50 dark:bg-[#162210]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#59f20d] p-2 rounded-lg flex items-center justify-center">
            <span className="text-[#162210] text-2xl">📖</span>
          </div>
          <h1 className="text-xl font-bold text-[#162210] dark:text-white tracking-tight">Kids' Bible App</h1>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 shadow-2xl shadow-[#59f20d]/5 rounded-xl p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden border border-[#59f20d]/10">
          {/* Decorative background */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#59f20d]/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#59f20d]/5 rounded-full blur-3xl"></div>
          
          {/* Illustration */}
          <div className="relative mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-[#59f20d]/10 rounded-full flex items-center justify-center">
              <span className="text-6xl md:text-8xl">🌱</span>
            </div>
            <div className="absolute bottom-0 right-0 bg-[#59f20d] text-[#162210] px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-4 border-white dark:border-zinc-900">
              Reviewing
            </div>
          </div>

          {/* Content */}
          <h2 className="text-3xl md:text-5xl font-black text-[#162210] dark:text-white mb-4 tracking-tight leading-tight">
            Hold tight! <br/><span className="text-[#59f20d]">We're making things safe.</span>
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 max-w-md leading-relaxed">
            Our team is currently reviewing your account to ensure the best and safest experience. This usually takes just a few minutes.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center">
          <p className="mt-12 text-zinc-400 text-xs tracking-widest uppercase">© 2024 Kids' Bible App • All Rights Reserved</p>
      </footer>

      {/* Bottom Toast */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-[#162210] text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-[#59f20d] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#59f20d]/60 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#59f20d]/30 rounded-full animate-pulse"></div>
          </div>
          <span className="text-sm font-medium">Waiting for admin...</span>
        </div>
      </div>
    </div>
  )
}
