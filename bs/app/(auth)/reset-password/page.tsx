'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import MessageBox from '@/components/MessageBox'
import PasswordInput from '@/components/PasswordInput'
import AppLogo from '@/components/AppLogo'

function WarmOrnament() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="w-6 h-px bg-primary opacity-60" />
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      <div className="w-6 h-px bg-primary opacity-60" />
    </div>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  // Prevent React Strict Mode's double-invocation from consuming the one-time code twice
  const exchangeAttempted = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const errorCode = params.get('error_code')
    if (errorCode) {
      setLinkError(
        errorCode === 'otp_expired'
          ? 'This reset link has expired or was already used. Please request a new one.'
          : 'Invalid reset link. Please request a new one.'
      )
      return
    }

    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    const code = params.get('code')
    if (code && !exchangeAttempted.current) {
      exchangeAttempted.current = true
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setLinkError('Invalid or expired reset link. Please request a new one.')
        }
        // On success PASSWORD_RECOVERY fires via onAuthStateChange above
      })
    }

    return () => subscription.unsubscribe()
  }, [])

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('Passwords do not match')
      return
    }

    setStatus('loading')
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setStatus('error')
      setMessage(error.message || 'Failed to reset password')
    } else {
      setStatus('success')
      setMessage('Password updated! Redirecting to sign in…')
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  // Link is bad — show error only, no form
  if (linkError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <AppLogo size="lg" className="justify-center" />
            <WarmOrnament />
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-3">Link invalid</h1>
          </div>
          <MessageBox type="error" message={linkError} />
          <p className="text-center text-sm text-muted-foreground">
            <a href="/login" className="text-primary font-semibold hover:underline underline-offset-4">
              Back to sign in
            </a>
          </p>
        </div>
      </div>
    )
  }

  // Waiting for PASSWORD_RECOVERY event
  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <AppLogo size="lg" className="justify-center" />
          <Loader2 size={24} className="animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Verifying reset link…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <AppLogo size="lg" className="justify-center" />
          <WarmOrnament />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Bible Kids</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-3">Set new password</h1>
          <p className="text-sm text-muted-foreground">Choose a strong password</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Password</label>
              <PasswordInput
                name="password"
                placeholder="New password (min 6 characters)"
                minLength={6}
                required
                className="h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirm Password</label>
              <PasswordInput
                name="confirmPassword"
                placeholder="Confirm new password"
                minLength={6}
                required
                className="h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {(status === 'error' || status === 'success') && message && (
              <MessageBox type={status === 'error' ? 'error' : 'success'} message={message} />
            )}

            <Button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="w-full h-11 font-bold shadow-[0_2px_0_rgba(138,90,15,0.25)]"
            >
              {status === 'loading' ? <><Loader2 size={16} className="mr-2 animate-spin" />Updating…</> : 'Set New Password'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <a href="/login" className="text-primary font-semibold hover:underline underline-offset-4">Back to sign in</a>
        </p>
      </div>
    </div>
  )
}
