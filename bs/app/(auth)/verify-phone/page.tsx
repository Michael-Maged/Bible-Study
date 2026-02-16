'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyAndCreateUser } from './actions'
import MessageBox from '@/components/MessageBox'
import { createClient } from '@/utils/supabase/client'

export default function VerifyPhonePage() {
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
    
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleResend = async () => {
    if (resendCount >= 3) {
      setStatus('error')
      setMessage('Maximum resend attempts reached. Please try again later.')
      return
    }
    
    setIsResending(true)
    setMessage('')
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({ 
        phone,
        options: { channel: 'sms' }
      })
      
      if (error) throw error
      
      setResendCount(resendCount + 1)
      setOtp(['', '', '', '', '', ''])
      setStatus('success')
      setMessage('New code sent successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setStatus('error')
      setMessage('Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setStatus('error')
      setMessage('Please enter all 6 digits')
      return
    }
    
    setStatus('loading')
    setMessage('')
    
    const storageKey = type === 'kid' ? 'pendingRegistration' : 'pendingAdminRegistration'
    const pendingDataStr = sessionStorage.getItem(storageKey)
    
    if (!pendingDataStr) {
      setStatus('error')
      setMessage('Registration data not found. Please register again.')
      return
    }
    
    try {
      const pendingData = JSON.parse(pendingDataStr)
      const result = await verifyAndCreateUser(phone, otpCode, type, pendingData)
      
      if (result.success) {
        setStatus('success')
        setMessage(type === 'admin' ? 'Admin account created successfully!' : 'Registration successful!')
        sessionStorage.removeItem(storageKey)
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setStatus('error')
        setMessage(result.error || 'Verification failed. The code may have expired.')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="bg-[#f0fde4] dark:bg-[#1a2c14] min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-[#243d1c] rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-2xl font-bold text-[#0d1a08] dark:text-white mb-2">Verify Your Phone</h1>
          <p className="text-sm text-[#7cb85f]">Enter the 6-digit code sent to {phone}</p>
        </div>

        <div className="flex gap-2 justify-center mb-6">
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
              className="w-12 h-14 text-center text-2xl font-bold bg-[#f0fde4] dark:bg-[#1a2c14] border-2 border-[#6ef516]/20 rounded-lg focus:border-[#6ef516] focus:ring-2 focus:ring-[#6ef516]/20 text-[#0d1a08] dark:text-white"
            />
          ))}
        </div>

        {status === 'success' && message && (
          <MessageBox type="success" message={message} />
        )}

        {status === 'error' && message && (
          <MessageBox type="error" message={message} />
        )}

        <button
          onClick={handleVerify}
          disabled={status === 'loading' || otp.join('').length !== 6}
          className="w-full py-3 bg-[#6ef516] hover:bg-[#5ee305] text-[#0d1a08] font-bold rounded-full mb-4 disabled:opacity-50"
        >
          {status === 'loading' ? 'Verifying...' : 'Verify & Create Account'}
        </button>

        <button
          onClick={handleResend}
          disabled={resendCount >= 3 || isResending || status === 'loading'}
          className="w-full py-3 text-[#6ef516] font-semibold disabled:opacity-50 hover:text-[#5ee305] transition-colors"
        >
          {isResending ? 'Sending...' : `Resend Code (${resendCount}/3)`}
        </button>
      </div>
    </div>
  )
}
