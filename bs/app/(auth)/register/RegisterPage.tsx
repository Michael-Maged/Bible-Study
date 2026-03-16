'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { registerKidWithEmail } from './emailActions'
import { fetchTenants, fetchGradesByTenant, fetchClassesByGrade } from './tenantActions'
import CustomSelect from '@/components/CustomSelect'
import MessageBox from '@/components/MessageBox'
import type { Tenant, Grade, Class } from '@/types'

export default function RegisterPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedTenant, setSelectedTenant] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  useEffect(() => {
    fetchTenants().then(r => { if (r.success) setTenants(r.data || []) })
  }, [])

  async function handleTenantChange(id: string) {
    setSelectedTenant(id); setSelectedGrade(''); setGrades([]); setClasses([])
    if (id) { const r = await fetchGradesByTenant(id); if (r.success) setGrades(r.data || []) }
  }

  async function handleGradeChange(id: string) {
    setSelectedGrade(id); setClasses([])
    if (id) {
      const g = grades.find(g => g.id === id)
      if (g) { const r = await fetchClassesByGrade(g.grade_num.toString()); if (r.success) setClasses(r.data || []) }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus('loading')
    try {
      const result = await registerKidWithEmail(new FormData(e.currentTarget))
      if (result.success) {
        setStatus('success'); setMessage('Registration successful! Waiting for admin approval...')
        setTimeout(() => router.push('/login'), 2000)
      } else { setStatus('error'); setMessage(result.error || 'Registration failed') }
    } catch (err) { setStatus('error'); setMessage(err instanceof Error ? err.message : 'An error occurred') }
  }

  return (
    <div className="bg-[#0d1a08] min-h-screen flex flex-col items-center justify-center px-5 py-10 text-slate-100">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#59f20d] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#59f20d]/30">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0d1a08" strokeWidth={2} className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-3xl font-black tracking-tight">Join Bible Kids</h1>
        <p className="text-slate-500 text-sm mt-1">Create your account to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        {[
          { name: 'name', type: 'text', placeholder: 'Full name', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
          { name: 'email', type: 'email', placeholder: 'Email address', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
          { name: 'password', type: 'password', placeholder: 'Password (min 6 chars)', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> },
        ].map(f => (
          <div key={f.name} className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{f.icon}</svg>
            <input
              type={f.type} name={f.name} required placeholder={f.placeholder}
              minLength={f.name === 'password' ? 6 : undefined}
              className="w-full h-14 pl-11 pr-4 rounded-2xl bg-[#1a2e12] border border-[#59f20d]/10 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#59f20d]/40 transition-colors"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="number" name="age" required min="1" max="18" placeholder="Age"
              className="w-full h-14 pl-11 pr-4 rounded-2xl bg-[#1a2e12] border border-[#59f20d]/10 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#59f20d]/40 transition-colors"
            />
          </div>
          <CustomSelect id="gender" name="gender" value={selectedGender} onChange={setSelectedGender}
            options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
            placeholder="Gender" icon="⚧" required />
        </div>

        <CustomSelect id="tenant" name="tenant" value={selectedTenant} onChange={handleTenantChange}
          options={tenants.map(t => ({ value: t.id, label: t.name }))}
          placeholder="Select Church Stage" icon="⛪" required />

        <CustomSelect id="grade" name="grade" value={selectedGrade} onChange={handleGradeChange}
          options={grades.map(g => ({ value: g.id, label: g.name }))}
          placeholder="Select Grade" icon="🎓" disabled={!selectedTenant} required />

        <CustomSelect id="class" name="class" value={selectedClass} onChange={setSelectedClass}
          options={classes.map(c => ({ value: c.id, label: c.name }))}
          placeholder="Select Class" icon="📚" disabled={!selectedGrade} required />

        {(status === 'success' || status === 'error') && message && (
          <MessageBox type={status === 'success' ? 'success' : 'error'} message={message} />
        )}

        <button
          type="submit" disabled={status === 'loading'}
          className="w-full h-14 rounded-2xl bg-[#59f20d] text-[#0d1a08] font-black text-base shadow-xl shadow-[#59f20d]/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
        >
          {status === 'loading' ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-8 text-slate-500 text-sm">
        Already have an account?{' '}
        <a href="/login" className="text-[#59f20d] font-bold hover:underline">Sign in</a>
      </p>
    </div>
  )
}
