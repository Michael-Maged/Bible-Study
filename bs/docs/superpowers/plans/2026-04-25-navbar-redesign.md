# Navbar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace both bottom nav bars with a floating card nav and add a slim top header with logout, improving visual polish and iPhone safe-area support.

**Architecture:** New `AppHeader` component handles the logo + logout button at the top; `AdminNav` and `KidNav` each become a floating pill card at the bottom with a `motion.div` pill that slides behind the active tab. Both dashboard layouts wrap children with the header and correct top/bottom padding.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, framer-motion (already installed), Supabase browser client (already in repo).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/layout.tsx` | Modify | Add `viewportFit: "cover"` so safe-area insets work on iPhone |
| `components/AppHeader.tsx` | **Create** | Fixed top bar — logo left, logout button right |
| `components/AdminNav.tsx` | Modify | Remove logout; floating card; indigo pill animation |
| `components/KidNav.tsx` | Modify | Floating card; indigo pill animation; remove inline style |
| `app/(dashboard)/admin/layout.tsx` | Modify | Mount AppHeader; add pt + pb to wrapper |
| `app/(dashboard)/kid/layout.tsx` | Modify | Mount AppHeader; add pt + pb to wrapper |

---

## Task 1: Enable safe-area insets in the viewport export

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Open `app/layout.tsx` and add `viewportFit`**

Replace the existing viewport export (lines 27–32):

```tsx
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4338ca",
  viewportFit: "cover",
}
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors on `app/layout.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add viewportFit cover for iPhone safe-area support"
```

---

## Task 2: Create the AppHeader component

**Files:**
- Create: `components/AppHeader.tsx`

- [ ] **Step 1: Create `components/AppHeader.tsx` with this exact content**

```tsx
'use client'

import AppLogo from '@/components/AppLogo'

export default function AppHeader() {
  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.clear()
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((n) => caches.delete(n)))
    }
    window.location.href = '/login'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between max-w-lg mx-auto px-4 h-[52px]">
        <AppLogo size="sm" />
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Logout"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path
              d="M7 4H4a1 1 0 00-1 1v10a1 1 0 001 1h3M13 14l3-4-3-4M16 10H7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/AppHeader.tsx
git commit -m "feat: add AppHeader component with logo and logout"
```

---

## Task 3: Rewrite AdminNav — floating card + pill animation

**Files:**
- Modify: `components/AdminNav.tsx`

- [ ] **Step 1: Replace the full contents of `components/AdminNav.tsx`**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type AdminNavTab = 'dashboard' | 'kids' | 'assignments' | 'history' | 'leaderboard'

const tabs = [
  {
    key: 'dashboard' as const,
    label: 'Home',
    path: '/admin',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
        <rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
        <rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
        <rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
      </svg>
    ),
  },
  {
    key: 'kids' as const,
    label: 'Kids',
    path: '/admin/kids',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
        <path d="M1 17c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" />
        <path d="M13 5a3 3 0 010 4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" />
        <path d="M16 17c1.5-1 2-2.5 2-3.5a2.5 2.5 0 00-3-2.4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'assignments' as const,
    label: 'Reading',
    path: '/admin/assignments',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
        <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'history' as const,
    label: 'History',
    path: '/admin/history',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'leaderboard' as const,
    label: 'Ranks',
    path: '/admin/leaderboard',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 18V11h6v7M3 18v-5h4v5M13 18V7h4v11" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function AdminNav({ active }: { active: AdminNavTab }) {
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom,8px)+8px)]">
      <div className="flex items-stretch max-w-lg mx-auto bg-card rounded-[22px] shadow-[0_8px_32px_rgba(0,0,0,0.45)] p-1.5 gap-1">
        {tabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => !isActive && router.push(tab.path)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[48px] rounded-[16px] transition-colors duration-200',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-nav-pill"
                  className="absolute inset-0 bg-primary rounded-[16px]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.icon(isActive)}</span>
              <span className="relative z-10 text-[10px] font-bold">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/AdminNav.tsx
git commit -m "feat: AdminNav floating card with pill animation, remove logout"
```

---

## Task 4: Rewrite KidNav — floating card + pill animation

**Files:**
- Modify: `components/KidNav.tsx`

- [ ] **Step 1: Replace the full contents of `components/KidNav.tsx`**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type KidNavTab = 'dashboard' | 'history' | 'leaderboard' | 'profile'

const tabs = [
  {
    key: 'dashboard' as const,
    label: 'Today',
    path: '/kid/dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <path d="M3 8.5L10 3l7 5.5V16a1.5 1.5 0 01-1.5 1.5h-3v-5h-5v5h-3A1.5 1.5 0 013 16V8.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'history' as const,
    label: 'History',
    path: '/kid/history',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 8h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'leaderboard' as const,
    label: 'Ranks',
    path: '/kid/leaderboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <path d="M6 16V9h8v7M3 16V12h3v4M14 16v-5h3v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'profile' as const,
    label: 'Me',
    path: '/kid/profile',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3.5 17c0-3 2.9-5.3 6.5-5.3S16.5 14 16.5 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function KidNav({ active }: { active: KidNavTab }) {
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom,8px)+8px)]">
      <div className="flex items-stretch max-w-lg mx-auto bg-card rounded-[22px] shadow-[0_8px_32px_rgba(0,0,0,0.45)] p-1.5 gap-1">
        {tabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => !isActive && router.push(tab.path)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[48px] rounded-[16px] transition-colors duration-200',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="kid-nav-pill"
                  className="absolute inset-0 bg-primary rounded-[16px]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.icon}</span>
              <span className={cn('relative z-10 text-[10px]', isActive ? 'font-bold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/KidNav.tsx
git commit -m "feat: KidNav floating card with pill animation"
```

---

## Task 5: Update Admin dashboard layout

**Files:**
- Modify: `app/(dashboard)/admin/layout.tsx`

- [ ] **Step 1: Replace the full contents of `app/(dashboard)/admin/layout.tsx`**

```tsx
import AppHeader from '@/components/AppHeader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="warm-auth">
      <AppHeader />
      <div className="pt-[52px] pb-[calc(env(safe-area-inset-bottom,8px)+80px)]">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/admin/layout.tsx"
git commit -m "feat: add AppHeader and safe padding to admin layout"
```

---

## Task 6: Update Kid dashboard layout

**Files:**
- Modify: `app/(dashboard)/kid/layout.tsx`

- [ ] **Step 1: Replace the full contents of `app/(dashboard)/kid/layout.tsx`**

```tsx
import AppHeader from '@/components/AppHeader'

export default function KidLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="warm-auth">
      <AppHeader />
      <div className="pt-[52px] pb-[calc(env(safe-area-inset-bottom,8px)+80px)]">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/kid/layout.tsx"
git commit -m "feat: add AppHeader and safe padding to kid layout"
```

---

## Task 7: Build verification and visual QA

**Files:** none (verification only)

- [ ] **Step 1: Run a production build**

```bash
npm run build
```

Expected: exits with code 0, no TypeScript or compilation errors.

- [ ] **Step 2: Start the dev server and verify Admin nav**

```bash
npm run dev
```

Open `http://localhost:3000` and log in as an admin. Check:
- A slim header appears at the top with the Bible Kids logo on the left and a logout icon on the right
- The bottom nav is a floating card that sits above the screen floor
- Tapping each tab animates the indigo pill to the new position
- Logout button in the header signs out and redirects to `/login`
- No logout button in the bottom nav

- [ ] **Step 3: Verify Kid nav**

Log in as a kid user. Check:
- Same slim header (logo + logout)
- Floating card nav with 4 tabs: Today, History, Ranks, Me
- Pill animates between tabs
- On a phone (or DevTools mobile viewport), the nav sits above the home bar with visible space

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: navbar visual QA corrections"
```

Skip this step if no fixes were needed.
