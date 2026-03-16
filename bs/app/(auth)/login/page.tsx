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
    try {
      const result = await loginWithEmail(formData.get('email') as string, formData.get('password') as string)
      if (result.success && result.user) {
        if (result.isPending) { setStep('pending'); return }
        window.location.href = result.user.role === 'admin' || result.user.role === 'superuser' ? '/admin' : '/kid/dashboard'
      } else {
        setStatus('error')
        setMessage(result.error || 'Login failed')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Login failed')
    }
  }

  if (step === 'pending') return (
    <div className="bg-[#0d1a08] min-h-screen flex flex-col items-center justify-center px-5 text-slate-100">
      <div className="w-24 h-24 rounded-3xl bg-[#1a2e12] border border-[#59f20d]/20 flex items-center justify-center text-5xl mb-6">
        🌱
      </div>
      <h2 className="text-2xl font-black text-center mb-2">Almost there!</h2>
      <p className="text-slate-400 text-center text-sm max-w-xs mb-8">
        Your account is being reviewed by an admin. This usually takes just a few minutes.
      </p>
      <div className="flex items-center gap-2 bg-[#1a2e12] border border-[#59f20d]/20 px-5 py-3 rounded-full">
        <span className="w-2 h-2 bg-[#59f20d] rounded-full animate-pulse" />
        <span className="text-sm font-bold text-slate-300">Waiting for approval...</span>
      </div>
      <button onClick={() => setStep('credentials')} className="mt-8 text-[#59f20d] text-sm font-bold hover:underline">
        Back to Login
      </button>
    </div>
  )

  return (
    <div className="bg-[#0d1a08] min-h-screen flex flex-col items-center justify-center px-5 text-slate-100">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#59f20d] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#59f20d]/30">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0d1a08" strokeWidth={2} className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-3xl font-black tracking-tight">Bible Kids</h1>
        <p className="text-slate-500 text-sm mt-1">Sign in to continue your journey</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <input
            type="email" name="email" required placeholder="Email address"
            className="w-full h-14 pl-11 pr-4 rounded-2xl bg-[#1a2e12] border border-[#59f20d]/10 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#59f20d]/40 transition-colors"
          />
        </div>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <input
            type="password" name="password" required placeholder="Password"
            className="w-full h-14 pl-11 pr-4 rounded-2xl bg-[#1a2e12] border border-[#59f20d]/10 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#59f20d]/40 transition-colors"
          />
        </div>

        {status === 'error' && message && <MessageBox type="error" message={message} />}

        <button
          type="submit" disabled={status === 'loading'}
          className="w-full h-14 rounded-2xl bg-[#59f20d] text-[#0d1a08] font-black text-base shadow-xl shadow-[#59f20d]/20 hover:shadow-[#59f20d]/30 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
        >
          {status === 'loading' ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-8 text-slate-500 text-sm">
        New here?{' '}
        <a href="/register" className="text-[#59f20d] font-bold hover:underline">Create account</a>
      </p>
    </div>
  )
}
