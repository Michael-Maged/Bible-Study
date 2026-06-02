# Google Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Sign in with Google" to the login page as a login-only alternative for users who already have email+password accounts.

**Architecture:** Supabase OAuth auto-links a Google identity to an existing auth.users entry when emails match. A new `/auth/callback` route handler exchanges the OAuth code, verifies the user exists in the custom `user` table, sets the `user-role` cookie, and redirects — or signs the user out and sends them back to `/login?error=not_registered` if no account is found. Middleware is updated to allow the callback URL through as a public path.

**Tech Stack:** Next.js 15 App Router, Supabase SSR (`@supabase/ssr`), Tailwind CSS v4

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `middleware.ts` | Add `/auth/callback` to public paths |
| Create | `app/auth/callback/route.ts` | OAuth code exchange + user lookup + cookie + redirect |
| Modify | `app/(auth)/login/page.tsx` | Google button + error message from `?error=` param |

---

## Task 1: Allow `/auth/callback` through middleware

**Files:**
- Modify: `middleware.ts:12`

The middleware currently blocks all non-public paths when there's no session. The OAuth callback arrives with a `?code=` param but no session cookie yet — it will be redirected to `/login` before the route handler can run. Adding it to `publicPaths` fixes this.

- [ ] **Step 1: Update publicPaths in middleware**

In `middleware.ts`, change line 12 from:
```typescript
const publicPaths = ['/login', '/register', '/admin-register']
```
to:
```typescript
const publicPaths = ['/login', '/register', '/admin-register', '/auth/callback']
```

- [ ] **Step 2: Verify the change**

Run:
```bash
npm run build
```
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: allow /auth/callback through middleware for OAuth"
```

---

## Task 2: Create the OAuth callback route handler

**Files:**
- Create: `app/auth/callback/route.ts`

This is a Next.js Route Handler (GET). It exchanges the OAuth `code` for a session, looks up the user in the custom `user` table by `auth_id`, determines their role using the same logic as `emailActions.ts`, sets the `user-role` cookie, and redirects. If the user has no row in the `user` table, it signs them out and sends them to `/login?error=not_registered`.

- [ ] **Step 1: Create `app/auth/callback/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const { data: user, error: userError } = await supabase
      .from('user')
      .select('*, admin(*), enrollment(*)')
      .eq('auth_id', data.user.id)
      .single()

    if (userError || !user) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=not_registered`)
    }

    let userRole = 'kid'
    let isPending = false

    if (user.admin && user.admin.length > 0) {
      userRole = user.admin[0].role
      isPending = user.admin[0].status === 'pending'
    } else if (user.enrollment && user.enrollment.length > 0) {
      isPending = user.enrollment[0].status === 'pending'
    }

    if (isPending) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/pending`)
    }

    const cookieStore = await cookies()
    cookieStore.set('user-role', userRole, { path: '/', maxAge: 60 * 60 * 24 * 7 })

    const redirectTo = userRole === 'admin' || userRole === 'superuser' ? '/admin' : '/kid/dashboard'
    return NextResponse.redirect(`${origin}${redirectTo}`)
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }
}
```

- [ ] **Step 2: Verify it builds**

```bash
npm run build
```
Expected: build completes, `app/auth/callback/route.ts` appears in the output route list.

- [ ] **Step 3: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "feat: add OAuth callback route for Google login"
```

---

## Task 3: Add Google button and error display to login page

**Files:**
- Modify: `app/(auth)/login/page.tsx`

Three changes to the existing client component:
1. Add `useSearchParams` to read `?error=` on mount and show it via the existing `MessageBox`
2. Add `handleGoogleLogin` function using the browser Supabase client
3. Add the Google button in the JSX between the "or" divider and the existing student/teacher buttons

- [ ] **Step 1: Update imports at top of `app/(auth)/login/page.tsx`**

Replace the existing import block:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { loginWithEmail } from './emailActions'
import { Button } from '@/components/ui/button'
import MessageBox from '@/components/MessageBox'
import PasswordInput from '@/components/PasswordInput'
import AppLogo from '@/components/AppLogo'
import OfflineBanner from '@/components/OfflineBanner'
```
with:
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { loginWithEmail } from './emailActions'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import MessageBox from '@/components/MessageBox'
import PasswordInput from '@/components/PasswordInput'
import AppLogo from '@/components/AppLogo'
import OfflineBanner from '@/components/OfflineBanner'
```

- [ ] **Step 2: Add `useSearchParams`, error state, and `handleGoogleLogin` inside `LoginPage`**

Inside the `LoginPage` component, after the existing state declarations (`const [status, ...]` and `const [message, ...]`), add:

```typescript
const searchParams = useSearchParams()

useEffect(() => {
  const error = searchParams.get('error')
  if (error === 'not_registered') {
    setStatus('error')
    setMessage('No account found. Please register first.')
  } else if (error === 'auth_failed') {
    setStatus('error')
    setMessage('Sign in failed. Please try again.')
  }
}, [searchParams])

async function handleGoogleLogin() {
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}
```

- [ ] **Step 3: Add Google button in JSX**

Find the existing divider + buttons section in the JSX (around line 107–126):
```tsx
<div className="flex items-center gap-3 text-xs text-muted-foreground my-4">
  <div className="flex-1 h-px bg-border" />
  or
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
```

Replace with:
```tsx
<div className="flex items-center gap-3 text-xs text-muted-foreground my-4">
  <div className="flex-1 h-px bg-border" />
  or
  <div className="flex-1 h-px bg-border" />
</div>

<button
  type="button"
  onClick={handleGoogleLogin}
  className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted transition-colors"
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
```

- [ ] **Step 4: Verify it builds**

```bash
npm run build
```
Expected: no TypeScript or build errors.

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/login/page.tsx
git commit -m "feat: add Google sign-in button and error display to login page"
```

---

## Task 4: Enable Google OAuth in Supabase dashboard

This is a manual step in the Supabase dashboard — no code changes.

- [ ] **Step 1: Enable Google provider**

1. Go to your Supabase project → **Authentication → Providers**
2. Find **Google** and toggle it on
3. Enter your Google OAuth **Client ID** and **Client Secret**
   - Get these from [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`

- [ ] **Step 2: Enable automatic account linking**

In Supabase dashboard → **Authentication → Settings → User Identities**:
- Enable **"Allow automatic linking of accounts with the same email address"**

This is what merges the Google identity into the existing email/password account so the same `auth_id` is used.

- [ ] **Step 3: Add authorized redirect URI in Google Cloud Console**

In your Google OAuth client, add to **Authorized redirect URIs**:
- `https://<your-supabase-project>.supabase.co/auth/v1/callback`

For local dev also add:
- `http://localhost:3000/auth/callback` (note: this goes to your app, not Supabase — Supabase handles its own redirect internally)

---

## Task 5: Manual end-to-end verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test happy path — existing user**

1. Navigate to `http://localhost:3000/login`
2. Click "Sign in with Google"
3. Select a Google account whose email matches an existing registered user
4. Expected: redirected to `/admin` or `/kid/dashboard` with no errors

- [ ] **Step 3: Test rejection — unknown Google account**

1. Click "Sign in with Google"  
2. Select a Google account whose email is NOT in your `user` table
3. Expected: redirected back to `/login` with error message "No account found. Please register first."

- [ ] **Step 4: Test pending user**

1. Click "Sign in with Google" with a Google account whose email belongs to a pending user
2. Expected: redirected to `/pending`

- [ ] **Step 5: Final commit if any tweaks were made**

```bash
git add -A
git commit -m "fix: google login e2e adjustments"
```
