'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { verifyAndCreateUser } from './actions'
import { Button } from '@/components/ui/button'
import MessageBox from '@/components/MessageBox'
import AppLogo from '@/components/AppLogo'
import { createClient } from '@/utils/supabase/client'

function VerifyPhoneContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') || ''
  const type = (searchParams.get('type') || 'kid') as 'kid' | 'admin'

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [resendCount, setResendCount] = useState(0)
  const [isResending, setIsResending] = useState(false)

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus()
  }

  const handleResend = async () => {
    if (resendCount >= 3) { setStatus('error'); setMessage('Maximum resend attempts reached.'); return }
    setIsResending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel: 'sms' } })
      if (error) throw error
      setResendCount((c) => c + 1)
      setOtp(['', '', '', '', '', ''])
      setStatus('success')
      setMessage('New code sent!')
      setTimeout(() => setMessage(''), 3000)
    } catch {
      setStatus('error')
      setMessage('Failed to resend. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length !== 6) { setStatus('error'); setMessage('Please enter all 6 digits'); return }
    setStatus('loading')
    const storageKey = type === 'kid' ? 'pendingRegistration' : 'pendingAdminRegistration'
    const pendingDataStr = sessionStorage.getItem(storageKey)
    if (!pendingDataStr) { setStatus('error'); setMessage('Registration data not found. Please register again.'); return }
    try {
      const result = await verifyAndCreateUser(phone, code, type, JSON.parse(pendingDataStr))
      if (result.success) {
        setStatus('success')
        setMessage(type === 'admin' ? 'Admin account created!' : 'Registration successful!')
        sessionStorage.removeItem(storageKey)
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setStatus('error')
        setMessage(result.error || 'Verification failed. Code may have expired.')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-2">
          <AppLogo size="lg" className="justify-center" />
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <div className="w-6 h-px bg-primary opacity-60" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <div className="w-6 h-px bg-primary opacity-60" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-accent-foreground">
                <rect x="4" y="2" width="14" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 7h6M8 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="11" cy="16" r="1" fill="currentColor"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Verify Your Phone</h2>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Enter the 6-digit code sent to {phone}
            </p>
          </div>

          {/* OTP boxes */}
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-14 text-center text-xl font-black rounded-xl border-2 bg-background transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ borderColor: digit ? 'var(--primary)' : undefined }}
              />
            ))}
          </div>

          {(status === 'success' || status === 'error') && message && (
            <MessageBox type={status === 'success' ? 'success' : 'error'} message={message} />
          )}

          <Button
            onClick={handleVerify}
            disabled={status === 'loading' || otp.join('').length !== 6}
            className="w-full h-11 font-bold shadow-[0_2px_0_rgba(138,90,15,0.25)]"
          >
            {status === 'loading'
              ? <><Loader2 size={16} className="mr-2 animate-spin" />Verifying…</>
              : 'Verify & Create Account'}
          </Button>

          <button
            onClick={handleResend}
            disabled={resendCount >= 3 || isResending || status === 'loading'}
            className="w-full text-sm text-primary font-semibold hover:underline underline-offset-4 disabled:opacity-40 disabled:no-underline"
          >
            {isResending ? 'Sending…' : `Resend Code (${resendCount}/3)`}
          </button>
        </div>

      </div>
    </div>
  )
}

export default function VerifyPhonePage() {
  return (
    <Suspense>
      <VerifyPhoneContent />
    </Suspense>
  )
}
