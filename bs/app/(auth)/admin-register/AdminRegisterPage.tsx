'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User, Mail, CheckCircle } from 'lucide-react'
import { registerAdminWithEmail } from '../register/emailActions'
import { sendEmailOtp, verifyEmailOtp } from '../register/otpActions'
import { fetchTenants, fetchGradesByTenant } from '../register/tenantActions'
import CustomSelect from '@/components/CustomSelect'
import MessageBox from '@/components/MessageBox'
import PasswordInput from '@/components/PasswordInput'
import AppLogo from '@/components/AppLogo'
import { Button } from '@/components/ui/button'
import type { Tenant, Grade } from '@/types'

function LabeledInput({ label, icon: Icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: React.ElementType }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input {...props} className="w-full h-11 pl-9 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
      </div>
    </div>
  )
}

function LabeledSelect({ label, ...props }: React.ComponentProps<typeof CustomSelect> & { label: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <CustomSelect {...props} />
    </div>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <AppLogo size="lg" className="justify-center" />
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <div className="w-6 h-px bg-primary opacity-60" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <div className="w-6 h-px bg-primary opacity-60" />
          </div>
          <div className="flex justify-center mt-2">
            <span className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Teacher account
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">Start a class</h1>
          <p className="text-sm text-muted-foreground">Set up your Sunday school program</p>
        </div>
        {children}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-primary font-semibold hover:underline underline-offset-4">Sign in</a>
        </p>
      </div>
    </div>
  )
}

export default function AdminRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp' | 'form'>('email')
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [selectedTenant, setSelectedTenant] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedGender, setSelectedGender] = useState('')

  useEffect(() => {
    fetchTenants().then((r) => { if (r.success) setTenants(r.data || []) })
  }, [])

  async function handleTenantChange(id: string) {
    setSelectedTenant(id); setSelectedGrade(''); setGrades([])
    if (id) fetchGradesByTenant(id).then((r) => { if (r.success) setGrades(r.data || []) })
  }

  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value
    const result = await sendEmailOtp(email)
    if (result.success) {
      setVerifiedEmail(email)
      setStatus('idle')
      setStep('otp')
    } else {
      setStatus('error')
      setMessage(result.error || 'Failed to send code')
    }
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    const token = (e.currentTarget.elements.namedItem('otp') as HTMLInputElement).value
    const result = await verifyEmailOtp(verifiedEmail, token)
    if (result.success) {
      setStatus('idle')
      setStep('form')
    } else {
      setStatus('error')
      setMessage(result.error || 'Invalid or expired code')
    }
  }

  async function handleResendOtp() {
    setStatus('idle')
    setMessage('')
    await sendEmailOtp(verifiedEmail)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const formData = new FormData(e.currentTarget)
    if (formData.get('password') !== formData.get('confirmPassword')) {
      setStatus('error'); setMessage('Passwords do not match'); return
    }
    try {
      const result = await registerAdminWithEmail(formData)
      if (result.success) {
        setStatus('success'); setMessage('Registration successful! Waiting for admin approval…')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setStatus('error'); setMessage(result.error || 'Registration failed')
      }
    } catch (err) {
      setStatus('error'); setMessage(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (step === 'email') {
    return (
      <PageShell>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSendOtp} className="space-y-4">
            <LabeledInput label="Email" icon={Mail} type="email" name="email" placeholder="your@email.com" required />
            {status === 'error' && message && <MessageBox type="error" message={message} />}
            <Button type="submit" disabled={status === 'loading'} className="w-full h-11 font-bold shadow-[0_2px_0_rgba(138,90,15,0.25)]">
              {status === 'loading' ? <><Loader2 size={16} className="mr-2 animate-spin" />Sending…</> : 'Send Code'}
            </Button>
          </form>
        </div>
      </PageShell>
    )
  }

  if (step === 'otp') {
    return (
      <PageShell>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            A 6-digit code was sent to{' '}
            <span className="font-semibold text-foreground">{verifiedEmail}</span>
          </p>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verification Code</label>
              <input
                type="text"
                name="otp"
                maxLength={6}
                placeholder="000000"
                required
                autoComplete="one-time-code"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>
            {status === 'error' && message && <MessageBox type="error" message={message} />}
            <Button type="submit" disabled={status === 'loading'} className="w-full h-11 font-bold shadow-[0_2px_0_rgba(138,90,15,0.25)]">
              {status === 'loading' ? <><Loader2 size={16} className="mr-2 animate-spin" />Verifying…</> : 'Verify Email'}
            </Button>
            <button
              type="button"
              onClick={handleResendOtp}
              className="w-full text-xs text-primary font-semibold text-center hover:underline underline-offset-4"
            >
              Resend code
            </button>
          </form>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <LabeledInput label="Full Name" icon={User} type="text" name="name" placeholder="Your full name" required />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                name="email"
                value={verifiedEmail}
                readOnly
                className="w-full h-11 pl-9 pr-10 rounded-xl border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed"
              />
              <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</label>
            <PasswordInput name="password" placeholder="Password (min 6 characters)" minLength={6} required className="h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirm Password</label>
            <PasswordInput name="confirmPassword" placeholder="Confirm Password" minLength={6} required className="h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-primary/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="Age" icon={User} type="number" name="age" placeholder="Age" min="18" required />
            <LabeledSelect label="Gender" id="gender" name="gender" value={selectedGender} onChange={setSelectedGender} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} placeholder="Gender" icon="⚧" required />
          </div>

          <LabeledSelect label="Role" id="role" name="role" value={selectedRole} onChange={setSelectedRole} options={[{ value: 'admin', label: 'Admin' }, { value: 'superuser', label: 'Superuser' }]} placeholder="Select Role" icon="🔑" required />
          <LabeledSelect label="Church Stage" id="tenant" name="tenant" value={selectedTenant} onChange={handleTenantChange} options={tenants.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select Tenant" icon="⛪" required />
          <LabeledSelect label="Grade" id="grade" name="grade" value={selectedGrade} onChange={setSelectedGrade} options={grades.map((g) => ({ value: g.id, label: g.name }))} placeholder="Select Grade" icon="🎓" disabled={!selectedTenant} required />

          {(status === 'success' || status === 'error') && message && (
            <MessageBox type={status === 'success' ? 'success' : 'error'} message={message} />
          )}

          <Button type="submit" disabled={status === 'loading'} className="w-full h-11 font-bold shadow-[0_2px_0_rgba(138,90,15,0.25)]">
            {status === 'loading' ? <><Loader2 size={16} className="mr-2 animate-spin" />Creating account…</> : 'Create Admin Account'}
          </Button>
        </form>
      </div>
    </PageShell>
  )
}
