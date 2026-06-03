# Email OTP Registration + Admin Rejection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email OTP verification to the start of both kid and admin registration forms, and make admin rejection delete the kid's data and send a rejection email.

**Architecture:** Supabase's `signInWithOtp` sends the OTP email (no paid API). After verification, the temporary auth user is immediately deleted so the registration flow can create a proper password-protected account. Rejection uses nodemailer with Gmail SMTP to send a notification, then deletes enrollment → user → auth in order.

**Tech Stack:** Next.js 15 App Router, Supabase SSR (`@supabase/ssr`), nodemailer, Tailwind CSS v4

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Install | `nodemailer`, `@types/nodemailer` | Email sending for rejection notification |
| Create | `app/(auth)/register/otpActions.ts` | `sendEmailOtp` + `verifyEmailOtp` server actions (shared by both register pages) |
| Create | `utils/sendEmail.ts` | `sendRejectionEmail` — nodemailer Gmail SMTP |
| Rewrite | `app/(auth)/register/RegisterPage.tsx` | Add email→OTP→form three-step flow |
| Rewrite | `app/(auth)/admin-register/AdminRegisterPage.tsx` | Same three-step flow for admin registration |
| Modify | `app/(dashboard)/admin/kids/actions.ts` | `handleApproveRequest` — rejection now emails + deletes instead of just setting status |

---

## Task 1: Install nodemailer and create `utils/sendEmail.ts`

**Files:**
- Create: `utils/sendEmail.ts`

- [ ] **Step 1: Install nodemailer**

```bash
cd bs && npm install nodemailer @types/nodemailer
```

Expected: packages added to `package.json`, no errors.

- [ ] **Step 2: Create `utils/sendEmail.ts`**

```typescript
import nodemailer from 'nodemailer'

export async function sendRejectionEmail(to: string, name: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: `"Bible Kids" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your registration was not approved',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a1a">Hi ${name},</h2>
        <p style="color:#555">We're sorry to inform you that your registration was not approved at this time.</p>
        <p style="color:#555">Please re-register using the registration form with the correct information.</p>
        <p style="color:#555">If you believe this was a mistake, please contact your church administrator.</p>
        <p style="color:#555;margin-top:32px">— The Bible Kids Team</p>
      </div>
    `,
  })
}
```

- [ ] **Step 3: Add env vars to `.env.local`**

Add these two lines to `.env.local`:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

To get a Gmail App Password: Google Account → Security → 2-Step Verification → App passwords → create one for "Mail".

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add utils/sendEmail.ts package.json package-lock.json
git commit -m "feat: add sendRejectionEmail utility with nodemailer"
```

---

## Task 2: Create `app/(auth)/register/otpActions.ts`

**Files:**
- Create: `app/(auth)/register/otpActions.ts`

This file is shared by both `RegisterPage.tsx` and `AdminRegisterPage.tsx`.

Key logic in `sendEmailOtp`:
- Check our `user` table first — if the email is already registered, return an error before sending OTP
- Use `supabase.auth.signInWithOtp({ email })` (default `shouldCreateUser: true`) — this sends the OTP and creates a temporary auth user for new emails

Key logic in `verifyEmailOtp`:
- Verify the OTP with `supabase.auth.verifyOtp({ email, token, type: 'email' })`
- Immediately delete the temporary auth user with the admin client so `registerKidWithEmail` / `registerAdminWithEmail` can create a proper password-protected account with the same email
- Sign out the temporary session

- [ ] **Step 1: Create `app/(auth)/register/otpActions.ts`**

```typescript
'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function sendEmailOtp(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createAdminClient()

    // Prevent re-registration if email already has an active account
    const { data: existingUser } = await supabaseAdmin
      .from('user')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return { success: false, error: 'This email is already registered. Please sign in instead.' }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to send verification code' }
  }
}

export async function verifyEmailOtp(email: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

    if (error || !data.user) {
      return { success: false, error: 'Invalid or expired code' }
    }

    // Delete temp auth user so registration can create a proper one with a password
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)

    // Clear the temp session
    await supabase.auth.signOut()

    return { success: true }
  } catch {
    return { success: false, error: 'Verification failed' }
  }
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/register/otpActions.ts"
git commit -m "feat: add shared email OTP server actions for registration"
```

---

## Task 3: Rewrite `app/(auth)/register/RegisterPage.tsx` with three-step flow

**Files:**
- Modify: `app/(auth)/register/RegisterPage.tsx`

The page gets a `step` state (`'email' | 'otp' | 'form'`) and a `verifiedEmail` state. The existing `handleSubmit` and `registerKidWithEmail` call are untouched. A shared `PageShell` component wraps each step to avoid repeating the outer layout.

- [ ] **Step 1: Replace the full contents of `app/(auth)/register/RegisterPage.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User, Mail, CheckCircle } from 'lucide-react'
import { registerKidWithEmail } from './emailActions'
import { sendEmailOtp, verifyEmailOtp } from './otpActions'
import { fetchTenants, fetchGradesByTenant, fetchClassesByGrade } from './tenantActions'
import CustomSelect from '@/components/CustomSelect'
import MessageBox from '@/components/MessageBox'
import PasswordInput from '@/components/PasswordInput'
import AppLogo from '@/components/AppLogo'
import { Button } from '@/components/ui/button'
import type { Tenant, Grade, Class } from '@/types'

function WarmOrnament() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="w-6 h-px bg-primary opacity-60" />
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      <div className="w-6 h-px bg-primary opacity-60" />
    </div>
  )
}

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
          <WarmOrnament />
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">Join your class</h1>
          <p className="text-sm text-muted-foreground">Tell us a little about yourself</p>
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

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp' | 'form'>('email')
  const [verifiedEmail, setVerifiedEmail] = useState('')
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
    fetchTenants().then((r) => { if (r.success) setTenants(r.data || []) })
  }, [])

  async function handleTenantChange(id: string) {
    setSelectedTenant(id); setSelectedGrade(''); setGrades([]); setClasses([])
    if (id) fetchGradesByTenant(id).then((r) => { if (r.success) setGrades(r.data || []) })
  }

  async function handleGradeChange(id: string) {
    setSelectedGrade(id); setClasses([])
    if (id) {
      const g = grades.find((g) => g.id === id)
      if (g) fetchClassesByGrade(g.grade_num.toString()).then((r) => { if (r.success) setClasses(r.data || []) })
    }
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
      const result = await registerKidWithEmail(formData)
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
            <LabeledInput label="Age" icon={User} type="number" name="age" placeholder="Age" min="1" max="18" required />
            <LabeledSelect label="Gender" id="gender" name="gender" value={selectedGender} onChange={setSelectedGender} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} placeholder="Gender" icon="⚧" required />
          </div>

          <LabeledSelect label="Church Stage" id="tenant" name="tenant" value={selectedTenant} onChange={handleTenantChange} options={tenants.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select Church Stage" icon="⛪" required />
          <LabeledSelect label="Grade" id="grade" name="grade" value={selectedGrade} onChange={handleGradeChange} options={grades.map((g) => ({ value: g.id, label: g.name }))} placeholder="Select Grade" icon="🎓" disabled={!selectedTenant} required />
          <LabeledSelect label="Class" id="class" name="class" value={selectedClass} onChange={setSelectedClass} options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select Class" icon="📚" disabled={!selectedGrade} required />

          {(status === 'success' || status === 'error') && message && (
            <MessageBox type={status === 'success' ? 'success' : 'error'} message={message} />
          )}

          <Button type="submit" disabled={status === 'loading'} className="w-full h-11 font-bold shadow-[0_2px_0_rgba(138,90,15,0.25)]">
            {status === 'loading' ? <><Loader2 size={16} className="mr-2 animate-spin" />Creating account…</> : 'Create Account'}
          </Button>
        </form>
      </div>
    </PageShell>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build completes, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/register/RegisterPage.tsx"
git commit -m "feat: add email OTP verification step to kid registration"
```

---

## Task 4: Rewrite `app/(auth)/admin-register/AdminRegisterPage.tsx` with three-step flow

**Files:**
- Modify: `app/(auth)/admin-register/AdminRegisterPage.tsx`

Same three-step pattern as Task 3, but preserves the admin-specific header (Teacher account badge, "Start a class" heading) and admin-specific form fields (role, no class field, age min=18).

- [ ] **Step 1: Replace the full contents of `app/(auth)/admin-register/AdminRegisterPage.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/admin-register/AdminRegisterPage.tsx"
git commit -m "feat: add email OTP verification step to admin registration"
```

---

## Task 5: Update `handleApproveRequest` to email + delete on kid rejection

**Files:**
- Modify: `app/(dashboard)/admin/kids/actions.ts`

The existing function handles four cases:
1. Admin approval/rejection → update `admin.status`
2. Transferred kid rejection → send back to original class (existing, preserved)
3. Kid approval → update `enrollment.status = 'accepted'`
4. **Kid rejection (non-transferred) → NEW: send email + delete enrollment + user + auth**

The key change: for non-transferred kid rejection, instead of setting `status = 'rejected'`, we send the rejection email, delete the enrollment row, delete the user row, and delete the auth user. We return early after deletion so the old `update` path is never reached for rejections.

- [ ] **Step 1: Add the `sendRejectionEmail` import at the top of `app/(dashboard)/admin/kids/actions.ts`**

Add this import after the existing imports:
```typescript
import { sendRejectionEmail } from '@/utils/sendEmail'
```

- [ ] **Step 2: Replace the `handleApproveRequest` function**

Replace the entire `handleApproveRequest` function (lines 86–120) with:

```typescript
export async function handleApproveRequest(type: 'admin' | 'kid', id: string, approved: boolean) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  if (type === 'admin') {
    const status = approved ? 'accepted' : 'rejected'
    const { error } = await supabase.from('admin').update({ status }).eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  // type === 'kid'
  if (!approved) {
    const { data: enrollment } = await supabaseAdmin
      .from('enrollment')
      .select('status, pending_class, user_id')
      .eq('id', id)
      .single()

    // Transferred kid rejection: send back to original class (existing behavior)
    if (enrollment?.status === 'transferred' && enrollment?.pending_class) {
      const { error } = await supabaseAdmin
        .from('enrollment')
        .update({ class: enrollment.pending_class, pending_class: null, status: 'rejected' })
        .eq('id', id)
      if (error) return { success: false, error: error.message }
      return { success: true }
    }

    // Non-transferred rejection: send email + delete all data
    if (enrollment?.user_id) {
      const { data: user } = await supabaseAdmin
        .from('user')
        .select('id, name, email, auth_id')
        .eq('id', enrollment.user_id)
        .single()

      if (user?.email && user?.name) {
        try {
          await sendRejectionEmail(user.email, user.name)
        } catch (e) {
          console.error('Rejection email failed:', e)
        }
      }

      await supabaseAdmin.from('enrollment').delete().eq('id', id)
      if (user?.id) await supabaseAdmin.from('user').delete().eq('id', user.id)
      if (user?.auth_id) await supabaseAdmin.auth.admin.deleteUser(user.auth_id)
    }

    return { success: true }
  }

  // approved === true
  const { error } = await supabaseAdmin
    .from('enrollment')
    .update({ status: 'accepted', pending_class: null })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: build completes with no errors. The `ƒ /admin/kids` route is listed in the output.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/admin/kids/actions.ts"
git commit -m "feat: reject kid sends email and deletes all data"
```

---

## Task 6: Manual end-to-end verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test kid registration OTP flow**

1. Go to `http://localhost:3000/register`
2. Enter a real email address you have access to → click "Send Code"
3. Check inbox for 6-digit code → enter it → click "Verify Email"
4. Confirm you land on the profile form with the email pre-filled and a ✓ checkmark
5. Fill in the form and submit → confirm "Waiting for admin approval" message

- [ ] **Step 3: Test admin registration OTP flow**

1. Go to `http://localhost:3000/admin-register`
2. Same OTP verification flow
3. Confirm the Teacher account badge and "Start a class" heading are preserved throughout

- [ ] **Step 4: Test duplicate email rejection**

1. Go to `http://localhost:3000/register`
2. Enter the email of an already-registered user → click "Send Code"
3. Expected: error "This email is already registered. Please sign in instead."

- [ ] **Step 5: Test admin rejection with email + data deletion**

1. Register a new kid with a real email
2. In the admin panel, find the pending kid → click "Reject"
3. Check that:
   - The rejection email arrives in the kid's inbox
   - The kid disappears from the admin panel
   - The kid cannot log in (their account was deleted)

- [ ] **Step 6: Final commit if any tweaks were made**

```bash
git add -A
git commit -m "fix: email otp and rejection e2e tweaks"
```
