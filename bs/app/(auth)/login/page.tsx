'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { loginWithEmail } from './emailActions'
import { createClient } from '@/utils/supabase/client'
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

function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<'login' | 'forgot' | 'sent'>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const searchParams = useSearchParams()

  const errorParam = searchParams.get('error')
  const oauthError =
    errorParam === 'not_registered' ? 'No account found. Please register first.' :
    errorParam === 'auth_failed' ? 'Sign in failed. Please try again.' :
    null

  async function handleGoogleLogin() {
    setStatus('loading')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      setStatus('error')
      setMessage('Google sign-in failed. Please try again.')
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    const formData = new FormData(e.currentTarget)
    try {
      const result = await loginWithEmail(formData.get('email') as string, formData.get('password') as string)
      if (result.success && result.user) {
        if (result.isPending) { router.push('/pending'); return }
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

  async function handleSendReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value
    // Use browser client so PKCE code verifier is generated and stored in browser cookies
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (!error) {
      setForgotEmail(email)
      setStatus('idle')
      setStep('sent')
    } else {
      setStatus('error')
      setMessage(error.message || 'Failed to send reset email')
    }
  }

  if (step === 'forgot') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <OfflineBanner />
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <AppLogo size="lg" className="justify-center" />
            <WarmOrnament />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Bible Kids</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-3">Reset password</h1>
            <p className="text-sm text-muted-foreground">We'll send a reset link to your email</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <form onSubmit={handleSendReset} className="space-y-4">
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
              {status === 'error' && message && <MessageBox type="error" message={message} />}
              <Button type="submit" disabled={status === 'loading'} className="w-full h-11 font-bold shadow-[0_2px_0_rgba(138,90,15,0.25)]">
                {status === 'loading' ? <><Loader2 size={16} className="mr-2 animate-spin" />Sending…</> : 'Send Reset Link'}
              </Button>
            </form>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <button type="button" onClick={() => { setStep('login'); setStatus('idle'); setMessage('') }} className="text-primary font-semibold hover:underline underline-offset-4">
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    )
  }

  if (step === 'sent') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <OfflineBanner />
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <AppLogo size="lg" className="justify-center" />
            <WarmOrnament />
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-3">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">
              A reset link has been sent to{' '}
              <span className="font-semibold text-foreground">{forgotEmail}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
            <p className="text-sm text-muted-foreground">Click the link in the email to set a new password. Check your spam folder if you don't see it.</p>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <button type="button" onClick={() => setStep('login')} className="text-primary font-semibold hover:underline underline-offset-4">
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    )
  }

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
                <button
                  type="button"
                  onClick={() => { setStep('forgot'); setStatus('idle'); setMessage('') }}
                  className="text-xs text-primary font-semibold hover:underline underline-offset-4"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {oauthError && <MessageBox type="error" message={oauthError} />}
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

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={status === 'loading'}
            className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground my-4">
            <div className="flex-1 h-px bg-border" />
            new here?
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  )
}
