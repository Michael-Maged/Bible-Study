'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithEmail } from './emailActions'
import MessageBox from '@/components/MessageBox'

export default function LoginPage() {
  const [step, setStep] = useState<'credentials' | 'pending'>('credentials')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await loginWithEmail(email, password)
      
      if (result.success && result.user) {
        if (result.isPending) {
          setStep('pending')
          return
        }
        
        const redirectPath = result.user.role === 'admin' || result.user.role === 'superuser' ? '/admin' : '/dashboard'
        router.push(redirectPath)
      } else {
        setStatus('error')
        setMessage(result.error || 'Login failed')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Login failed')
    }
  }

  if (step === 'pending') {
    return (
      <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex flex-col">
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
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#59f20d]/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#59f20d]/5 rounded-full blur-3xl"></div>
            
            <div className="relative mb-8">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-[#59f20d]/10 rounded-full flex items-center justify-center">
                <span className="text-6xl md:text-8xl">🌱</span>
              </div>
              <div className="absolute bottom-0 right-0 bg-[#59f20d] text-[#162210] px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-4 border-white dark:border-zinc-900">
                Reviewing
              </div>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-[#162210] dark:text-white mb-4 tracking-tight leading-tight">
              Hold tight! <br/><span className="text-[#59f20d]">We're making things safe.</span>
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 max-w-md leading-relaxed">
              Our team is currently reviewing your account to ensure the best and safest experience. This usually takes just a few minutes.
            </p>
            
            <button
              // onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']) }}
              className="text-[#59f20d] font-semibold hover:underline decoration-2 underline-offset-4 transition-all"
            >
              Back to Login
            </button>
          </div>
        </main>

        <footer className="p-8 text-center">
          <p className="mt-12 text-zinc-400 text-xs tracking-widest uppercase">© 2024 Kids' Bible App • All Rights Reserved</p>
        </footer>

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



  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#59f20d]/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#59f20d]/20 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-[480px] bg-white dark:bg-zinc-900 shadow-2xl rounded-xl p-8 md:p-12 z-10 border border-[#59f20d]/10">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-[#59f20d]/20 p-4 rounded-full mb-4">
            <div className="w-12 h-12 bg-[#59f20d] flex items-center justify-center rounded-full text-zinc-900 text-3xl">
              📖
            </div>
          </div>
          <h2 className="text-[#121c0d] dark:text-white text-3xl font-bold tracking-tight text-center">Bible Adventure</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-base mt-2 text-center">Sign in to continue your journey</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-2">Email</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-zinc-400 text-xl">📧</div>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                required
                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-4 focus:ring-[#59f20d]/20 focus:border-[#59f20d] outline-none transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-2">Password</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-zinc-400 text-xl">🔒</div>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                required
                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-4 focus:ring-[#59f20d]/20 focus:border-[#59f20d] outline-none transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>

          {status === 'error' && message && <MessageBox type="error" message={message} />}
          
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-[#59f20d] text-zinc-900 font-bold text-lg py-4 rounded-full shadow-lg shadow-[#59f20d]/30 hover:shadow-xl hover:shadow-[#59f20d]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {status === 'loading' ? 'Signing in...' : 'Start My Journey'}
            <span className="text-xl">🚀</span>
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            New here?
            <a className="text-[#59f20d] font-bold ml-1 hover:underline decoration-2 underline-offset-4" href="/register">Join the adventure!</a>
          </p>
        </div>
      </div>
    </div>
  )
}
