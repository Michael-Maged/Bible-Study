'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendLoginOtp, verifyLoginOtp } from './actions'
import MessageBox from '@/components/MessageBox'

export default function LoginPage() {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [phone, setPhone] = useState('')
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const phoneInput = formData.get('phone') as string
    const formattedPhone = '+2' + phoneInput

    try {
      const result = await sendLoginOtp(name, formattedPhone)
      
      if (result.success) {
        setPhone(formattedPhone)
        setUserName(name)
        setUserRole(result.role || 'kid')
        setStep('otp')
        setStatus('idle')
      } else {
        setStatus('error')
        setMessage(result.error || 'Failed to send code')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Failed to send code')
    }
  }

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

  async function handleVerifyOtp() {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setStatus('error')
      setMessage('Please enter all 6 digits')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const result = await verifyLoginOtp(phone, otpCode, userName)
      
      if (result.success && result.user) {
        // Check if account is pending
        if (result.isPending) {
          router.push('/pending')
          return
        }
        
        // Session is already created by Supabase, just store role in cookie
        document.cookie = `user-role=${result.user.role}; path=/`
        
        // Redirect based on role
        const redirectPath = result.user.role === 'admin' || result.user.role === 'superuser' ? '/admin' : '/dashboard'
        router.push(redirectPath)
      } else {
        setStatus('error')
        setMessage(result.error || 'Invalid code')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  if (step === 'otp') {
    return (
      <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#59f20d]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#59f20d]/20 rounded-full blur-3xl"></div>
        
        <div className="relative w-full max-w-[480px] bg-white dark:bg-zinc-900 shadow-2xl rounded-xl p-8 md:p-12 z-10 border border-[#59f20d]/10">
          <div className="flex flex-col items-center mb-10">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-[#121c0d] dark:text-white text-3xl font-bold tracking-tight text-center">Enter Your Code</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base mt-2 text-center">Code sent to {phone}</p>
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
                className="w-12 h-14 text-center text-2xl font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-lg focus:border-[#59f20d] focus:ring-4 focus:ring-[#59f20d]/20 text-zinc-900 dark:text-white outline-none transition-all"
              />
            ))}
          </div>

          {status === 'error' && message && <MessageBox type="error" message={message} />}

          <button
            onClick={handleVerifyOtp}
            disabled={status === 'loading' || otp.join('').length !== 6}
            className="w-full bg-[#59f20d] text-zinc-900 font-bold text-lg py-4 rounded-full shadow-lg shadow-[#59f20d]/30 hover:shadow-xl hover:shadow-[#59f20d]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 mb-4"
          >
            {status === 'loading' ? 'Verifying...' : 'Sign In'}
          </button>

          <button
            onClick={() => setStep('credentials')}
            className="w-full py-3 text-[#59f20d] font-semibold hover:underline decoration-2 underline-offset-4 transition-all"
          >
            Change Credentials
          </button>
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
        
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-2">Your Name</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-zinc-400 text-xl">👤</div>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                required
                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-4 focus:ring-[#59f20d]/20 focus:border-[#59f20d] outline-none transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-2">Phone Number</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-zinc-400 text-xl">📱</div>
              <span className="absolute left-12 text-zinc-900 dark:text-white">+2</span>
              <input
                type="tel"
                name="phone"
                placeholder="1234567890"
                required
                className="w-full pl-[4.5rem] pr-4 py-4 rounded-full border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-4 focus:ring-[#59f20d]/20 focus:border-[#59f20d] outline-none transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>

          {status === 'error' && message && <MessageBox type="error" message={message} />}
          
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-[#59f20d] text-zinc-900 font-bold text-lg py-4 rounded-full shadow-lg shadow-[#59f20d]/30 hover:shadow-xl hover:shadow-[#59f20d]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {status === 'loading' ? 'Sending...' : 'Start My Journey'}
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
