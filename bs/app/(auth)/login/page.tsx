'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { loginWithEmail } from './emailActions'
import { Button } from '@/components/ui/button'
import MessageBox from '@/components/MessageBox'
import PasswordInput from '@/components/PasswordInput'
import AppLogo from '@/components/AppLogo'
import OfflineBanner from '@/components/OfflineBanner'

function WarmOrnament() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="w-6 h-px bg-primary opacity-60" />
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      <div className="w-6 h-px bg-primary opacity-60" />
    </div>
  )
}

function PendingView({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <OfflineBanner />
      <div className="w-full max-w-sm text-center space-y-6">
        <AppLogo size="lg" className="justify-center" />
        <div className="rounded-2xl border border-border bg-card p-8 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto">
            <span className="text-3xl">📖</span>
          </div>
          <h2 className="text-2xl font-black text-foreground">Almost there!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your account is being reviewed. This usually takes a few minutes.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
            <span className="text-xs text-muted-foreground ml-1">Waiting for approval…</span>
          </div>
        </div>
        <button onClick={onBack} className="text-sm text-primary font-semibold hover:underline underline-offset-4">
          Back to Login
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [step, setStep] = useState<'credentials' | 'pending'>('credentials')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')

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

  if (step === 'pending') return <PendingView onBack={() => setStep('credentials')} />

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <OfflineBanner />
      <div className="w-full max-w-sm space-y-6">

        {/* Hero */}
        <div className="text-center space-y-2">
          <AppLogo size="lg" className="justify-center" />
          <WarmOrnament />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Bible Kids</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-3">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Continue your daily reading</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor"/>
                  <path d="M1.5 3.5l5.5 4 5.5-4" stroke="currentColor"/>
                </svg>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="w-full h-11 pl-9 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</label>
              <PasswordInput
                name="password"
                placeholder="Enter your password"
                required
                className="h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <div className="text-right mt-1">
                <span className="text-xs text-primary font-semibold cursor-pointer">Forgot password?</span>
              </div>
            </div>

            {status === 'error' && message && <MessageBox type="error" message={message} />}

            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full h-11 font-bold text-base shadow-[0_2px_0_rgba(138,90,15,0.25)]"
            >
              {status === 'loading' ? <><Loader2 size={16} className="mr-2 animate-spin" />Signing in…</> : 'Sign In'}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground my-4">
            <div className="flex-1 h-px bg-border" />
            or
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2.5">
            <a
              href="/register"
              className="flex-1 h-10 flex items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              I&apos;m a student
            </a>
            <a
              href="/admin-register"
              className="flex-1 h-10 flex items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              I&apos;m a teacher
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
