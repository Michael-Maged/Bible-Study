'use client'

import { useState, useEffect } from 'react'
import { registerKid } from './actions'
import { fetchTenants, fetchGradesByTenant, fetchClassesByGrade } from './tenantActions'
import CustomSelect from './CustomSelect'

export default function RegisterPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  
  const [tenants, setTenants] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  
  const [selectedTenant, setSelectedTenant] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedGender, setSelectedGender] = useState('')

  const [selectedClass, setSelectedClass] = useState('')

  useEffect(() => {
    loadTenants()
  }, [])

  async function loadTenants() {
    const result = await fetchTenants()
    if (result.success) {
      setTenants(result.data || [])
    }
  }

  async function handleTenantChange(tenantId: string) {
    setSelectedTenant(tenantId)
    setSelectedGrade('')
    setGrades([])
    setClasses([])
    
    if (tenantId) {
      const result = await fetchGradesByTenant(tenantId)
      if (result.success) {
        setGrades(result.data || [])
      }
    }
  }

  async function handleGradeChange(gradeId: string) {
    setSelectedGrade(gradeId)
    setClasses([])
    
    if (gradeId) {
      const selectedGradeObj = grades.find(g => g.id === gradeId)
      if (selectedGradeObj) {
        const result = await fetchClassesByGrade(selectedGradeObj.grade_num.toString())
        if (result.success) {
          setClasses(result.data || [])
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    
    const form = e.currentTarget
    const formData = new FormData(form)
    try {
      const result = await registerKid(formData)
      
      if (result.success) {
        setStatus('success')
        setMessage('Waiting for admin approval')
        if (form) form.reset()
        setSelectedTenant('')
        setSelectedGrade('')
        setGrades([])
        setClasses([])
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
      {/* Top Navigation Bar */}
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
          {/* Hero Image/Section */}
          <div className="relative h-40 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-[#6ef516]/20 mix-blend-multiply z-0"></div>
            <img
              alt="Peaceful morning with an open Bible"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnHDFDB0uyxKNP9dCdREDdgxqud5Jz9b0WU1BC68iv-cy4IjPzopaHqfeV7soYIPNWadSdL3TCgsMk0nxtMMTKMhab7tdeuw2pIkAqSzaO-YQtKRGfYTySBddZWJ8sDZSr1LVfPlJPJG2-1H9Z8yoX9anAslpvyj8lNBFwgGeOb28y0WwSOsJWKDQJSSC8wxuzm0saeio6i4MdamBysCAn2WovRuk2Ogn6duEmIH1foStxWi1cvJXUIXI_C1tWhet3RYYiEIHlIG7G"
            />
            <div className="absolute bottom-4 left-6 z-20">
              <h1 className="text-white text-2xl font-bold tracking-tight">Join the Family</h1>
              <p className="text-white/80 text-sm">Register and grow in faith together.</p>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {/* Name */}
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6ef516]/60 group-focus-within:text-[#6ef516]">👤</span>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Full Name"
                className="w-full pl-12 pr-4 py-4 bg-[#f0fde4] dark:bg-[#1a2c14] border-none rounded-full text-[#0d1a08] dark:text-white placeholder:text-[#7cb85f]/50 focus:ring-2 focus:ring-[#6ef516] transition-all"
              />
            </div>

            {/* Phone */}
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6ef516]/60 group-focus-within:text-[#6ef516]">📱</span>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                placeholder="Phone Number"
                className="w-full pl-12 pr-4 py-4 bg-[#f0fde4] dark:bg-[#1a2c14] border-none rounded-full text-[#0d1a08] dark:text-white placeholder:text-[#7cb85f]/50 focus:ring-2 focus:ring-[#6ef516] transition-all"
              />
            </div>

            {/* Age & Gender Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6ef516]/60 group-focus-within:text-[#6ef516]">🎂</span>
                <input
                  type="number"
                  id="age"
                  name="age"
                  required
                  min="1"
                  max="18"
                  placeholder="Age"
                  className="w-full pl-12 pr-4 py-4 bg-[#f0fde4] dark:bg-[#1a2c14] border-none rounded-full text-[#0d1a08] dark:text-white placeholder:text-[#7cb85f]/50 focus:ring-2 focus:ring-[#6ef516] transition-all"
                />
              </div>
              <CustomSelect
                id="gender"
                name="gender"
                value={selectedGender}
                onChange={setSelectedGender}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' }
                ]}
                placeholder="Gender"
                icon="⚧"
                required
              />
            </div>

            {/* Church Stage */}
            <CustomSelect
              id="tenant"
              name="tenant"
              value={selectedTenant}
              onChange={handleTenantChange}
              options={tenants.map(t => ({ value: t.id, label: t.name }))}
              placeholder="Select Church Stage"
              icon="⛪"
              required
            />

            {/* Grade */}
            <CustomSelect
              id="grade"
              name="grade"
              value={selectedGrade}
              onChange={handleGradeChange}
              options={grades.map(g => ({ value: g.id, label: g.name }))}
              placeholder="Select Grade"
              icon="🎓"
              disabled={!selectedTenant}
              required
            />

            {/* Class */}
            <CustomSelect
              id="class"
              name="class"
              value={selectedClass}
              onChange={setSelectedClass}
              options={classes.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select Class"
              icon="📚"
              disabled={!selectedGrade}
              required
            />

            {/* Status Messages */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-[#6ef516] hover:bg-[#5ee305] text-[#0d1a08] font-bold text-lg rounded-full shadow-lg shadow-[#6ef516]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'loading' ? 'Registering...' : 'Create Account'}
              <span>→</span>
            </button>
          </form>
        </div>
      </main>

      {/* Footer Decoration */}
      <footer className="py-10 flex flex-col items-center justify-center text-[#6ef516]/40 pointer-events-none select-none">
        <span className="text-4xl mb-2">🌳</span>
        <p className="text-xs font-medium uppercase tracking-widest">Grow in Grace</p>
      </footer>
    </div>
  )
}
