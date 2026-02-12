'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { handleLogin } from '@/routes/authRoutes'

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    
    const formData = new FormData(e.currentTarget)
    const phone = formData.get('phone') as string
    const name = formData.get('name') as string

    try {
      const user = await handleLogin(phone, name)
      document.cookie = `auth-token=${user.id}; path=/`
      router.push('/dashboard')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0fde4] dark:bg-[#1a2c14]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-[#243d1c] rounded-xl shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            required
            className="w-full px-4 py-3 rounded-lg bg-[#f0fde4] dark:bg-[#1a2c14]"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            required
            className="w-full px-4 py-3 rounded-lg bg-[#f0fde4] dark:bg-[#1a2c14]"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 bg-[#6ef516] text-white rounded-lg font-semibold"
          >
            {status === 'loading' ? 'Logging in...' : 'Login'}
          </button>
          {status === 'error' && <p className="text-red-500 text-sm">{message}</p>}
        </form>
      </div>
    </div>
  )
}
