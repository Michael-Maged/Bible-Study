# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add forgot password flow — inline on the login page for requesting a reset, plus a dedicated `/reset-password` page for setting the new password.

**Architecture:** The login page gains a `step` state (`'login' | 'forgot' | 'sent'`) to show the request form inline. Supabase sends the reset email via the configured Resend SMTP. The reset link redirects to `/reset-password`, which listens for the `PASSWORD_RECOVERY` auth event and calls `supabase.auth.updateUser({ password })`.

**Tech Stack:** Next.js 15 App Router, Supabase SSR (`@supabase/ssr`), Tailwind CSS v4

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `proxy.ts` | Add `/reset-password` to publicPaths |
| Create | `app/(auth)/login/resetActions.ts` | `sendPasswordReset` server action |
| Modify | `app/(auth)/login/page.tsx` | Add forgot/sent steps to `LoginForm` |
| Create | `app/(auth)/reset-password/page.tsx` | New password entry after clicking reset link |

---

## Task 1: Add `/reset-password` to proxy publicPaths

**Files:**
- Modify: `proxy.ts:7`

- [ ] **Step 1: Update publicPaths in `proxy.ts`**

Change line 7 from:
```typescript
const publicPaths = ['/login', '/register', '/admin-register', '/auth/callback', '/pending']
```
to:
```typescript
const publicPaths = ['/login', '/register', '/admin-register', '/auth/callback', '/pending', '/reset-password']
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: add /reset-password to public paths"
```

---

## Task 2: Create `app/(auth)/login/resetActions.ts`

**Files:**
- Create: `app/(auth)/login/resetActions.ts`

- [ ] **Step 1: Create the file**

```typescript
'use server'

import { createClient } from '@/utils/supabase/server'

export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to send reset email' }
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/login/resetActions.ts"
git commit -m "feat: add sendPasswordReset server action"
```

---

## Task 3: Add forgot/sent steps to `LoginForm` in `app/(auth)/login/page.tsx`

**Files:**
- Modify: `app/(auth)/login/page.tsx`

The `LoginForm` component (line 24) gains `step` and `forgotEmail` state plus a `handleSendReset` handler. The JSX conditionally renders based on `step`. All existing login logic is preserved unchanged.

- [ ] **Step 1: Replace the `LoginForm` component (lines 24–178) with:**

```tsx
function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<'login' | 'forgot' | 'sent'>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const searchParams = useSearchParams()

  const errorParam = searchParams.get('error')
  const oauthError =
    errorParam === 'not_registered' ? 'No account found. Please register first.' :
    errorParam === 'auth_failed' ? 'Sign in failed. Please try again.' :
    null

  async function handleGoogleLogin() {
    setStatus('loading')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      setStatus('error')
      setMessage('Google sign-in failed. Please try again.')
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    const formData = new FormData(e.currentTarget)
    try {
      const result = await loginWithEmail(formData.get('email') as string, formData.get('password') as string)
      if (result.success && result.user) {
        if (result.isPending) { router.push('/pending'); return }
        window.location.href = result.user.role === 'admin' || result.user.role === 'superuser' ? '/admin' : '/kid/dashboard'
      } else {
        setStatus('error')
        setMessage(result.error || 'Login failed')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Login failed')
    }
  }

  async function handleSendReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value
    const { sendPasswordReset } = await import('./resetActions')
    const result = await sendPasswordReset(email)
    if (result.success) {
      setForgotEmail(email)
      setStatus('idle')
      setStep('sent')
    } else {
      setStatus('error')
      setMessage(result.error || 'Failed to send reset email')
    }
  }

  if (step === 'forgot') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <OfflineBanner />
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <AppLogo size="lg" className="justify-center" />
            <WarmOrnament />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Bible Kids</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-3">Reset password</h1>
            <p className="text-sm text-muted-foreground">We'll send a reset link to your email</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <form onSubmit={handleSendReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor"/>
                    <path d="M1.5 3.5l5.5 4 5.5-4" stroke="currentColor"/>
                  </svg>
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    required
                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              {status === 'error' && message && <MessageBox type="error" message={message} />}
              <Button type="submit" disabled={status === 'loading'} className="w-full h-11 font-bold shadow-[0_2px_0_rgba(138,90,15,0.25)]">
                {status === 'loading' ? <><Loader2 size={16} className="mr-2 animate-spin" />Sending…</> : 'Send Reset Link'}
              </Button>
            </form>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <button type="button" onClick={() => { setStep('login'); setStatus('idle'); setMessage('') }} className="text-primary font-semibold hover:underline underline-offset-4">
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    )
  }

  if (step === 'sent') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <OfflineBanner />
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <AppLogo size="lg" className="justify-center" />
            <WarmOrnament />
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-3">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">
              A reset link has been sent to{' '}
              <span className="font-semibold text-foreground">{forgotEmail}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
            <p className="text-sm text-muted-foreground">Click the link in the email to set a new password. Check your spam folder if you don't see it.</p>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <button type="button" onClick={() => setStep('login')} className="text-primary font-semibold hover:underline underline-offset-4">
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <OfflineBanner />
      <div className="w-full max-w-sm space-y-6">

        {/* Hero */}
        <div className="text-center space-y-2">
          <AppLogo size="lg" className="justify-center" />
          <WarmOrnament />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Bible Kids</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-3">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Continue your daily reading</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor"/>
                  <path d="M1.5 3.5l5.5 4 5.5-4" stroke="currentColor"/>
                </svg>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="w-full h-11 pl-9 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</label>
              <PasswordInput
                name="password"
                placeholder="Enter your password"
                required
                className="h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => { setStep('forgot'); setStatus('idle'); setMessage('') }}
                  className="text-xs text-primary font-semibold hover:underline underline-offset-4"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {oauthError && <MessageBox type="error" message={oauthError} />}
            {status === 'error' && message && <MessageBox type="error" message={message} />}

            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full h-11 font-bold text-base shadow-[0_2px_0_rgba(138,90,15,0.25)]"
            >
              {status === 'loading' ? <><Loader2 size={16} className="mr-2 animate-spin" />Signing in…</> : 'Sign In'}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground my-4">
            <div className="flex-1 h-px bg-border" />
            or
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={status === 'loading'}
            className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground my-4">
            <div className="flex-1 h-px bg-border" />
            new here?
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2.5">
            <a
              href="/register"
              className="flex-1 h-10 flex items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              I&apos;m a student
            </a>
            <a
              href="/admin-register"
              className="flex-1 h-10 flex items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              I&apos;m a teacher
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
```

Also add `sendPasswordReset` is dynamically imported inside `handleSendReset` — no top-level import needed.

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: `/login` listed as static route, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/login/page.tsx"
git commit -m "feat: add forgot password inline steps to login page"
```

---

## Task 4: Create `app/(auth)/reset-password/page.tsx`

**Files:**
- Create: `app/(auth)/reset-password/page.tsx`

This page listens for the Supabase `PASSWORD_RECOVERY` auth event. Until that event fires, it shows a "Verifying…" state. Once the event fires (meaning a valid recovery session is established), it shows the new password form. On success it redirects to `/login`.

- [ ] **Step 1: Create `app/(auth)/reset-password/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
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
```

- [ ] **Step 2: Add `/reset-password` to Supabase redirect URL allowlist**

In Supabase dashboard → Authentication → URL Configuration → Redirect URLs, add:
```
http://localhost:3000/reset-password
```
And your production URL:
```
https://your-production-domain.com/reset-password
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: `/reset-password` listed as a static (`○`) route, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/reset-password/page.tsx"
git commit -m "feat: add reset password page"
```

---

## Task 5: Manual end-to-end verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test request flow**

1. Go to `http://localhost:3000/login`
2. Click "Forgot password?" — confirm the form switches to the reset request view
3. Enter a registered email → click "Send Reset Link"
4. Confirm the "Check your inbox" message appears showing the email

- [ ] **Step 3: Test reset flow**

1. Open the reset email → click the link
2. Confirm you land on `/reset-password` with the new password form
3. Enter a new password + confirm → click "Set New Password"
4. Confirm redirect to `/login` with no errors
5. Sign in with the new password — confirm it works

- [ ] **Step 4: Test back navigation**

1. Click "Forgot password?" → then "Back to sign in" → confirm returns to login form
2. Click "Forgot password?" → send → then "Back to sign in" from sent state → confirm returns to login form

- [ ] **Step 5: Final commit if any tweaks**

```bash
git add -A
git commit -m "fix: forgot password e2e adjustments"
```
