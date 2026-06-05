# Superadmin Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single fixed superadmin account (credentials in env vars) that can approve/reject coordinator registrations from a dedicated `/superadmin` dashboard.

**Architecture:** Credentials checked in the existing login server action before Supabase auth — no DB account needed. A `user-role=superadmin` cookie gates a new `/superadmin` route group. The dashboard fetches all pending coordinators via the Supabase service-role client and exposes approve/reject server actions that reuse the existing `sendApprovalEmail`/`sendRejectionEmail` utilities.

**Tech Stack:** Next.js 15 App Router, Supabase (service role client), Resend email, Tailwind CSS v4, TypeScript.

---

## File Map

| Action | File |
|---|---|
| Modify | `app/(auth)/login/emailActions.ts` |
| Modify | `proxy.ts` |
| Create | `app/(dashboard)/superadmin/layout.tsx` |
| Create | `app/(dashboard)/superadmin/page.tsx` |
| Create | `app/(dashboard)/superadmin/actions.ts` |
| Create | `app/(dashboard)/superadmin/SuperadminView.tsx` |

---

## Task 1: Add superadmin credential check to login

**Files:**
- Modify: `app/(auth)/login/emailActions.ts`

- [ ] **Step 1: Read the current file**

Read `app/(auth)/login/emailActions.ts` to find the exact location of the `loginWithEmail` function.

- [ ] **Step 2: Add the credential check**

At the very top of the `loginWithEmail` function body — before any Supabase call — add:

```ts
// Superadmin: credential-only auth (no Supabase account)
if (
  email === process.env.SUPERADMIN_EMAIL &&
  password === process.env.SUPERADMIN_PASSWORD
) {
  const cookieStore = await cookies()
  cookieStore.set('user-role', 'superadmin', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  return { success: true, user: { role: 'superadmin' }, isPending: false }
}
```

`cookies` is already imported from `next/headers` in this file — no new import needed.

- [ ] **Step 3: Update the client-side redirect in `app/(auth)/login/page.tsx`**

In `LoginForm`, find the redirect after successful login:
```ts
window.location.href = result.user.role === 'admin' || result.user.role === 'superuser' ? '/admin' : '/kid/dashboard'
```

Replace with:
```ts
if (result.user.role === 'superadmin') {
  window.location.href = '/superadmin'
} else if (result.user.role === 'admin' || result.user.role === 'superuser') {
  window.location.href = '/admin'
} else {
  window.location.href = '/kid/dashboard'
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/login/emailActions.ts app/(auth)/login/page.tsx
git commit -m "feat: add superadmin credential check to login"
```

---

## Task 2: Update middleware routing for superadmin

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Read the current file**

Read `proxy.ts` to understand the full routing logic.

- [ ] **Step 2: Apply all routing changes**

Make these four targeted edits:

**Edit 1** — add `superadmin` paths to `adminPaths` protection:

Find:
```ts
if (isAdminPath && (userRole !== 'admin' && userRole !== 'superuser')) {
  return NextResponse.redirect(new URL('/kid/dashboard', request.url))
}
```

Replace with:
```ts
if (isAdminPath && userRole !== 'admin' && userRole !== 'superuser' && userRole !== 'superadmin') {
  return NextResponse.redirect(new URL('/kid/dashboard', request.url))
}
```

**Edit 2** — add `/superadmin` to `adminPaths` array so it gets route-protected:

Find:
```ts
const adminPaths = ['/admin']
```

Replace with:
```ts
const adminPaths = ['/admin', '/superadmin']
```

**Edit 3** — redirect superadmin away from `/admin` to `/superadmin`:

After the existing admin/kid redirect block, add:
```ts
// Redirect superadmin away from /admin to their own dashboard
if (userRole === 'superadmin' && pathname.startsWith('/admin')) {
  return NextResponse.redirect(new URL('/superadmin', request.url))
}
```

**Edit 4** — redirect superadmin from root `/` to `/superadmin`:

Find:
```ts
if (pathname === '/') {
  if (userRole === 'admin' || userRole === 'superuser') {
    return NextResponse.redirect(new URL('/admin', request.url))
  } else {
    return NextResponse.redirect(new URL('/kid/dashboard', request.url))
  }
}
```

Replace with:
```ts
if (pathname === '/') {
  if (userRole === 'superadmin') {
    return NextResponse.redirect(new URL('/superadmin', request.url))
  } else if (userRole === 'admin' || userRole === 'superuser') {
    return NextResponse.redirect(new URL('/admin', request.url))
  } else {
    return NextResponse.redirect(new URL('/kid/dashboard', request.url))
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add proxy.ts
git commit -m "feat: add superadmin routing to middleware"
```

---

## Task 3: Create superadmin server actions

**Files:**
- Create: `app/(dashboard)/superadmin/actions.ts`

- [ ] **Step 1: Create the file**

```ts
'use server'

import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { sendApprovalEmail, sendRejectionEmail } from '@/utils/sendEmail'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function adminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireSuperadmin() {
  const cookieStore = await cookies()
  if (cookieStore.get('user-role')?.value !== 'superadmin') {
    redirect('/login')
  }
}

export type PendingCoordinator = {
  id: string
  role: string
  grade: number | null
  tenant: string | null
  status: string
  user: { id: string; name: string; email: string; auth_id: string } | null
  gradeName: string | null
  tenantName: string | null
}

export type ActiveCoordinator = {
  id: string
  role: string
  grade: number | null
  tenant: string | null
  user: { name: string; email: string } | null
  gradeName: string | null
  tenantName: string | null
}

export type SuperadminStats = {
  totalCoordinators: number
  pendingCoordinators: number
  totalServants: number
  pendingServants: number
  totalStudents: number
  totalFamilies: number
}

export async function getSuperadminData(): Promise<{
  success: boolean
  stats?: SuperadminStats
  pending?: PendingCoordinator[]
  active?: ActiveCoordinator[]
  error?: string
}> {
  await requireSuperadmin()
  const supabase = adminClient()

  const [adminRows, enrollmentCount, tenantCount] = await Promise.all([
    supabase.from('admin').select('id, role, grade, tenant, status, user(id, name, email, auth_id), grade:grade!admin_grade_fkey(name), tenantInfo:tenant!admin_tenant_fkey(name)'),
    supabase.from('enrollment').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('tenant').select('id', { count: 'exact', head: true }),
  ])

  if (adminRows.error) return { success: false, error: adminRows.error.message }

  const rows = adminRows.data ?? []

  const stats: SuperadminStats = {
    totalCoordinators: rows.filter(r => r.role === 'admin').length,
    pendingCoordinators: rows.filter(r => r.role === 'admin' && r.status === 'pending').length,
    totalServants: rows.filter(r => r.role === 'superuser').length,
    pendingServants: rows.filter(r => r.role === 'superuser' && r.status === 'pending').length,
    totalStudents: enrollmentCount.count ?? 0,
    totalFamilies: tenantCount.count ?? 0,
  }

  const pending: PendingCoordinator[] = rows
    .filter(r => r.role === 'admin' && r.status === 'pending')
    .map(r => ({
      id: r.id,
      role: r.role,
      grade: r.grade as number | null,
      tenant: r.tenant,
      status: r.status,
      user: Array.isArray(r.user) ? (r.user[0] ?? null) : (r.user as PendingCoordinator['user']),
      gradeName: Array.isArray(r.grade) ? ((r.grade[0] as {name:string})?.name ?? null) : ((r.grade as {name:string} | null)?.name ?? null),
      tenantInfo: r.tenantInfo,
      tenantName: Array.isArray(r.tenantInfo) ? ((r.tenantInfo[0] as {name:string})?.name ?? null) : ((r.tenantInfo as {name:string} | null)?.name ?? null),
    }))

  const active: ActiveCoordinator[] = rows
    .filter(r => r.role === 'admin' && r.status === 'accepted')
    .map(r => ({
      id: r.id,
      role: r.role,
      grade: r.grade as number | null,
      tenant: r.tenant,
      user: Array.isArray(r.user) ? (r.user[0] ?? null) : (r.user as ActiveCoordinator['user']),
      gradeName: Array.isArray(r.grade) ? ((r.grade[0] as {name:string})?.name ?? null) : ((r.grade as {name:string} | null)?.name ?? null),
      tenantName: Array.isArray(r.tenantInfo) ? ((r.tenantInfo[0] as {name:string})?.name ?? null) : ((r.tenantInfo as {name:string} | null)?.name ?? null),
    }))

  return { success: true, stats, pending, active }
}

export async function approveCoordinator(adminId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()

  const { data: adminRow } = await supabase
    .from('admin')
    .select('user_id')
    .eq('id', adminId)
    .single()

  const { error } = await supabase.from('admin').update({ status: 'accepted' }).eq('id', adminId)
  if (error) return { success: false, error: error.message }

  if (adminRow?.user_id) {
    const { data: user } = await supabase
      .from('user')
      .select('email, name')
      .eq('id', adminRow.user_id)
      .single()
    if (user?.email && user?.name) {
      try { await sendApprovalEmail(user.email, user.name) } catch (e) { console.error('Approval email failed:', e) }
    }
  }

  return { success: true }
}

export async function rejectCoordinator(adminId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()

  const { data: adminRow } = await supabase
    .from('admin')
    .select('user_id')
    .eq('id', adminId)
    .single()

  if (!adminRow?.user_id) return { success: false, error: 'Admin record not found' }

  const { data: user } = await supabase
    .from('user')
    .select('id, email, name, auth_id')
    .eq('id', adminRow.user_id)
    .single()

  if (user?.email && user?.name) {
    try { await sendRejectionEmail(user.email, user.name) } catch (e) { console.error('Rejection email failed:', e) }
  }

  await supabase.from('admin').delete().eq('id', adminId)

  if (user?.id) {
    const { error } = await supabase.from('user').delete().eq('id', user.id)
    if (error) console.error('User delete failed:', error.message)
  }

  if (user?.auth_id) {
    const { error } = await supabase.auth.admin.deleteUser(user.auth_id)
    if (error) console.error('Auth delete failed:', error.message)
  }

  return { success: true }
}

export async function signOutSuperadmin() {
  const cookieStore = await cookies()
  cookieStore.set('user-role', '', { path: '/', maxAge: 0 })
  redirect('/login')
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Fix any type errors in this file only. The Supabase join shapes may need type assertions (`as unknown as X`) — that is acceptable here.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/superadmin/actions.ts"
git commit -m "feat: add superadmin server actions"
```

---

## Task 4: Create superadmin layout and page (server components)

**Files:**
- Create: `app/(dashboard)/superadmin/layout.tsx`
- Create: `app/(dashboard)/superadmin/page.tsx`

- [ ] **Step 1: Create `app/(dashboard)/superadmin/layout.tsx`**

```tsx
export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
```

- [ ] **Step 2: Create `app/(dashboard)/superadmin/page.tsx`**

```tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSuperadminData } from './actions'
import SuperadminView from './SuperadminView'

export default async function SuperadminPage() {
  const cookieStore = await cookies()
  const role = cookieStore.get('user-role')?.value
  if (role !== 'superadmin') redirect('/login')

  const result = await getSuperadminData()
  if (!result.success) redirect('/login')

  return (
    <SuperadminView
      stats={result.stats!}
      pending={result.pending!}
      active={result.active!}
    />
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors (SuperadminView doesn't exist yet — a missing module error is expected and will be fixed in Task 5).

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/superadmin/layout.tsx" "app/(dashboard)/superadmin/page.tsx"
git commit -m "feat: add superadmin layout and page server components"
```

---

## Task 5: Create SuperadminView client component

**Files:**
- Create: `app/(dashboard)/superadmin/SuperadminView.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { approveCoordinator, rejectCoordinator, signOutSuperadmin } from './actions'
import type { SuperadminStats, PendingCoordinator, ActiveCoordinator } from './actions'

interface Props {
  stats: SuperadminStats
  pending: PendingCoordinator[]
  active: ActiveCoordinator[]
}

export default function SuperadminView({ stats, pending, active }: Props) {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'
  const [pendingList, setPendingList] = useState(pending)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleAction(id: string, approve: boolean) {
    setLoadingId(id)
    const result = approve ? await approveCoordinator(id) : await rejectCoordinator(id)
    if (result.success) setPendingList(p => p.filter(c => c.id !== id))
    setLoadingId(null)
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <main className="max-w-2xl mx-auto px-5 pt-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {isAr ? 'لوحة التحكم' : 'Super Admin'}
            </p>
            <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">
              {isAr ? 'نظرة عامة' : 'Overview'}
            </h1>
          </div>
          <form action={signOutSuperadmin}>
            <button
              type="submit"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {isAr ? 'تسجيل الخروج' : 'Sign out'}
            </button>
          </form>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard value={stats.totalCoordinators} label={isAr ? 'أمناء المراحل' : 'Coordinators'} sub={stats.pendingCoordinators > 0 ? `${stats.pendingCoordinators} ${isAr ? 'معلق' : 'pending'}` : undefined} warn={stats.pendingCoordinators > 0} />
          <StatCard value={stats.totalServants} label={isAr ? 'الخدام' : 'Servants'} sub={stats.pendingServants > 0 ? `${stats.pendingServants} ${isAr ? 'معلق' : 'pending'}` : undefined} warn={stats.pendingServants > 0} />
          <StatCard value={stats.totalStudents} label={isAr ? 'المخدومون' : 'Students'} />
          <StatCard value={stats.totalFamilies} label={isAr ? 'الأسر' : 'Families'} />
        </div>

        {/* Pending coordinators */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground mb-3">
            {isAr ? 'أمناء مراحل في الانتظار' : 'Pending Coordinators'}
            {pendingList.length > 0 && (
              <span className="ms-2 px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'rgba(194,133,27,0.12)', color: '#c2851b' }}>
                {pendingList.length}
              </span>
            )}
          </p>
          {pendingList.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {isAr ? 'لا يوجد طلبات معلقة' : 'No pending requests'}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {pendingList.map(coord => (
                <div key={coord.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{coord.user?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{coord.user?.email ?? '—'}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {coord.tenantName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                            {coord.tenantName}
                          </span>
                        )}
                        {coord.gradeName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                            {coord.gradeName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={loadingId === coord.id}
                      onClick={() => handleAction(coord.id, false)}
                    >
                      {loadingId === coord.id ? <Loader2 size={14} className="animate-spin" /> : (isAr ? 'رفض' : 'Reject')}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-[2] shadow-[0_2px_0_rgba(138,90,15,0.25)]"
                      disabled={loadingId === coord.id}
                      onClick={() => handleAction(coord.id, true)}
                    >
                      {loadingId === coord.id ? <Loader2 size={14} className="animate-spin" /> : (isAr ? 'قبول' : 'Approve')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active coordinators */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground mb-3">
            {isAr ? 'أمناء المراحل النشطون' : 'Active Coordinators'}
          </p>
          {active.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {isAr ? 'لا يوجد أمناء مراحل' : 'No coordinators yet'}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {active.map(coord => (
                <div key={coord.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{coord.user?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{coord.user?.email ?? '—'}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {coord.tenantName && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                        {coord.tenantName}
                      </span>
                    )}
                    {coord.gradeName && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                        {coord.gradeName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

function StatCard({ value, label, sub, warn }: { value: number; label: string; sub?: string; warn?: boolean }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={warn ? { background: 'rgba(194,133,27,0.08)', borderColor: 'rgba(194,133,27,0.3)' } : { background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: warn ? '#c2851b' : 'var(--primary)' }}>
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-2">{label}</div>
      {sub && <div className="text-[10px] font-semibold mt-0.5" style={{ color: '#c2851b' }}>{sub}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/superadmin/SuperadminView.tsx"
git commit -m "feat: add SuperadminView client component"
```

---

## Task 6: Add env vars and verify end-to-end

**Files:** `.env.local` (local only, never committed)

- [ ] **Step 1: Add env vars to `.env.local`**

Open `.env.local` and add:
```
SUPERADMIN_EMAIL=superadmin@biblekids.internal
SUPERADMIN_PASSWORD=ChangeThisToAStrongPassword123!
```

Use any email format — it doesn't need to be a real address.

- [ ] **Step 2: Run dev server**

```bash
npm run dev
```

- [ ] **Step 3: Verify login**

1. Go to `http://localhost:3000/login`
2. Enter the `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` from `.env.local`
3. Expected: redirected to `/superadmin`
4. Check the dashboard shows stats cards and pending/active coordinator sections

- [ ] **Step 4: Verify route protection**

1. Sign out from superadmin
2. Go to `http://localhost:3000/superadmin` directly
3. Expected: redirected to `/login`
4. Log in as a regular `admin` user
5. Go to `http://localhost:3000/superadmin`
6. Expected: redirected to `/superadmin` → which redirects back to `/admin` (superadmin route is not accessible to other roles)

- [ ] **Step 5: Add env var to Vercel**

In the Vercel dashboard → Settings → Environment Variables, add:
- `SUPERADMIN_EMAIL` — your chosen email string
- `SUPERADMIN_PASSWORD` — a strong password

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete superadmin dashboard"
```
