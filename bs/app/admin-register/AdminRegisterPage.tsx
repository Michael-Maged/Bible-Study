'use client'

import { useState, useEffect } from 'react'
import { registerAdmin } from './actions'
import { fetchTenants } from '../register/tenantActions'
import CustomSelect from '@/shared/components/CustomSelect'

export default function AdminRegisterPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')

  useEffect(() => {
    loadTenants()
  }, [])

  async function loadTenants() {
    const result = await fetchTenants()
    if (result.success) {
      setTenants(result.data || [])
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    
    const form = e.currentTarget
    const formData = new FormData(form)
    try {
      const result = await registerAdmin(formData)
      
      if (result.success) {
        setStatus('success')
        setMessage('Admin registered successfully')
        if (form) form.reset()
        setSelectedTenant('')
        setSelectedRole('')
        setSelectedGrade('')
      } else {
        setStatus('error')
        setMessage(result.error || 'Registration failed')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="bg-[#f0fde4] dark:bg-[#1a2c14] min-h-screen flex flex-col">
      <header className="w-full px-6 lg:px-40 py-5 bg-[#f0fde4] dark:bg-[#1a2c14] border-b border-[#6ef516]/20">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#6ef516] p-2 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl">📖</span>
            </div>
            <h2 className="text-[#0d1a08] dark:text-white text-xl font-bold tracking-tight">BibleApp</h2>
          </div>
          <a className="text-sm font-semibold text-[#0d1a08] dark:text-white hover:text-[#6ef516] transition-colors" href="#">
            Need help?
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[500px] bg-white dark:bg-[#243d1c] rounded-xl shadow-xl shadow-[#6ef516]/10 overflow-hidden">
          <div className="relative h-40 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-[#6ef516]/20 mix-blend-multiply z-0"></div>
            <img
              alt="Admin registration"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnHDFDB0uyxKNP9dCdREDdgxqud5Jz9b0WU1BC68iv-cy4IjPzopaHqfeV7soYIPNWadSdL3TCgsMk0nxtMMTKMhab7tdeuw2pIkAqSzaO-YQtKRGfYTySBddZWJ8sDZSr1LVfPlJPJG2-1H9Z8yoX9anAslpvyj8lNBFwgGeOb28y0WwSOsJWKDQJSSC8wxuzm0saeio6i4MdamBysCAn2WovRuk2Ogn6duEmIH1foStxWi1cvJXUIXI_C1tWhet3RYYiEIHlIG7G"
            />
            <div className="absolute bottom-4 left-6 z-20">
              <h1 className="text-white text-2xl font-bold tracking-tight">Admin Registration</h1>
              <p className="text-white/80 text-sm">Create an admin account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6ef516]/60 group-focus-within:text-[#6ef516]">👤</span>
              <input
                type="text"
                name="user_id"
                required
                placeholder="User ID"
                className="w-full pl-12 pr-4 py-4 bg-[#f0fde4] dark:bg-[#1a2c14] border-none rounded-full text-[#0d1a08] dark:text-white placeholder:text-[#7cb85f]/50 focus:ring-2 focus:ring-[#6ef516] transition-all"
              />
            </div>

            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6ef516]/60 group-focus-within:text-[#6ef516]">🎓</span>
              <input
                type="number"
                name="grade"
                required
                min="1"
                max="12"
                placeholder="Grade"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#f0fde4] dark:bg-[#1a2c14] border-none rounded-full text-[#0d1a08] dark:text-white placeholder:text-[#7cb85f]/50 focus:ring-2 focus:ring-[#6ef516] transition-all"
              />
            </div>

            <CustomSelect
              id="role"
              name="role"
              value={selectedRole}
              onChange={setSelectedRole}
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'superuser', label: 'Superuser' }
              ]}
              placeholder="Select Role"
              icon="🔑"
              required
            />

            <CustomSelect
              id="tenant"
              name="tenant"
              value={selectedTenant}
              onChange={setSelectedTenant}
              options={tenants.map(t => ({ value: t.id, label: t.name }))}
              placeholder="Select Tenant"
              icon="⛪"
              required
            />

            {status === 'success' && (
              <div className="p-4 bg-[#6ef516]/10 border border-[#6ef516]/20 rounded-2xl text-[#0d1a08] dark:text-white text-sm">
                {message}
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-[#6ef516] hover:bg-[#5ee305] text-[#0d1a08] font-bold text-lg rounded-full shadow-lg shadow-[#6ef516]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'loading' ? 'Registering...' : 'Create Admin Account'}
              <span>→</span>
            </button>
          </form>
        </div>
      </main>

      <footer className="py-10 flex flex-col items-center justify-center text-[#6ef516]/40 pointer-events-none select-none">
        <span className="text-4xl mb-2">🌳</span>
        <p className="text-xs font-medium uppercase tracking-widest">Grow in Grace</p>
      </footer>
    </div>
  )
}
