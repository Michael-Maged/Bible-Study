# English/Arabic Interface + Terminology Rename — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an EN/AR language toggle (English default) and replace generic technical terms (admin/superuser/kid/tenant) with domain-accurate Coptic Sunday school names in all UI text.

**Architecture:** A `utils/labels.ts` file holds all UI strings as typed `{ en, ar }` pairs. A `LanguageContext` stores the active language in `localStorage` and sets `dir`/`data-lang` on `<html>`. A `LangToggle` pill component is placed in both navbars and all auth pages. DB values, URL paths, and cookies are not changed — display layer only.

**Tech Stack:** Next.js 15 App Router, React context, Tailwind CSS v4. Cairo font (already imported in layout.tsx with `--font-arabic` variable) used for Arabic. No i18n library.

---

## File Map

| Action | File |
|---|---|
| Create | `utils/labels.ts` |
| Create | `contexts/LanguageContext.tsx` |
| Create | `components/LangToggle.tsx` |
| Create | `components/Providers.tsx` |
| Modify | `app/layout.tsx` |
| Modify | `app/globals.css` |
| Modify | `components/AdminNav.tsx` |
| Modify | `components/KidNav.tsx` |
| Modify | `app/(auth)/login/page.tsx` |
| Modify | `app/(auth)/register/RegisterPage.tsx` |
| Modify | `app/(auth)/admin-register/AdminRegisterPage.tsx` |
| Modify | `app/(auth)/pending/page.tsx` |
| Modify | `app/(auth)/reset-password/page.tsx` |
| Modify | `app/(dashboard)/admin/AdminDashboardView.tsx` |
| Modify | `app/(dashboard)/admin/kids/page.tsx` |
| Modify | `app/(dashboard)/admin/kids/[type]/[id]/page.tsx` |
| Modify | `app/(dashboard)/admin/assignments/page.tsx` |
| Modify | `app/(dashboard)/admin/leaderboard/page.tsx` |
| Modify | `app/(dashboard)/admin/history/page.tsx` |
| Modify | `app/(dashboard)/kid/dashboard/KidDashboardView.tsx` |
| Modify | `app/(dashboard)/kid/leaderboard/page.tsx` |
| Modify | `app/(dashboard)/kid/history/page.tsx` |
| Modify | `app/(dashboard)/kid/profile/page.tsx` |

---

## Task 1: Create `utils/labels.ts`

**Files:**
- Create: `utils/labels.ts`

- [ ] **Step 1: Create the file**

```ts
export type Lang = 'en' | 'ar'
export type Label = { en: string; ar: string }

export const L = {
  roles: {
    coordinator: { en: 'Coordinator', ar: 'امين مرحلة' },
    servant:     { en: 'Servant',     ar: 'خادم' },
    student:     { en: 'Student',     ar: 'مخدوم' },
    students:    { en: 'Students',    ar: 'المخدومون' },
  },
  entities: {
    family:      { en: 'Family',      ar: 'اسرة' },
    class:       { en: 'Class',       ar: 'فصل' },
    grade:       { en: 'Grade',       ar: 'مرحلة' },
  },
  status: {
    pending:     { en: 'Pending',     ar: 'في الانتظار' },
    accepted:    { en: 'Accepted',    ar: 'مقبول' },
    rejected:    { en: 'Rejected',    ar: 'مرفوض' },
    transferred: { en: 'Transferred', ar: 'محوّل' },
    approved:    { en: 'Approved',    ar: 'مقبول' },
    all:         { en: 'All',         ar: 'الكل' },
  },
  nav: {
    home:        { en: 'Home',         ar: 'الرئيسية' },
    students:    { en: 'Students',     ar: 'المخدومون' },
    reading:     { en: 'Reading',      ar: 'القراءة' },
    history:     { en: 'History',      ar: 'السجل' },
    ranks:       { en: 'Ranks',        ar: 'الترتيب' },
    logout:      { en: 'Logout',       ar: 'خروج' },
    today:       { en: 'Today',        ar: 'اليوم' },
    me:          { en: 'Me',           ar: 'أنا' },
  },
  auth: {
    welcomeBack:       { en: 'Welcome back',              ar: 'أهلاً بك' },
    continueReading:   { en: 'Continue your daily reading', ar: 'تابع قراءتك اليومية' },
    email:             { en: 'Email',                     ar: 'البريد الإلكتروني' },
    password:          { en: 'Password',                  ar: 'كلمة المرور' },
    signIn:            { en: 'Sign In',                   ar: 'تسجيل الدخول' },
    signingIn:         { en: 'Signing in…',               ar: 'جاري الدخول…' },
    forgotPassword:    { en: 'Forgot password?',          ar: 'نسيت كلمة المرور؟' },
    signInWithGoogle:  { en: 'Sign in with Google',       ar: 'تسجيل الدخول بجوجل' },
    newHere:           { en: 'new here?',                 ar: 'جديد هنا؟' },
    imAStudent:        { en: "I'm a student",             ar: 'أنا مخدوم' },
    imATeacher:        { en: "I'm a teacher",             ar: 'أنا خادم' },
    signOut:           { en: 'Sign out',                  ar: 'تسجيل الخروج' },
    backToSignIn:      { en: 'Back to sign in',           ar: 'العودة لتسجيل الدخول' },
    resetPassword:     { en: 'Reset password',            ar: 'إعادة تعيين كلمة المرور' },
    resetSubtitle:     { en: "We'll send a reset link to your email", ar: 'سنرسل رابط إعادة التعيين لبريدك' },
    sendResetLink:     { en: 'Send Reset Link',           ar: 'إرسال الرابط' },
    sending:           { en: 'Sending…',                  ar: 'جاري الإرسال…' },
    checkInbox:        { en: 'Check your inbox',          ar: 'تحقق من بريدك' },
    resetLinkSent:     { en: 'A reset link has been sent to', ar: 'تم إرسال رابط إعادة التعيين إلى' },
    checkSpam:         { en: "Click the link in the email to set a new password. Check your spam folder if you don't see it.", ar: 'انقر الرابط في البريد لتعيين كلمة مرور جديدة. تحقق من مجلد الرسائل غير المرغوب فيها إن لم تجده.' },
    setNewPassword:    { en: 'Set new password',          ar: 'تعيين كلمة مرور جديدة' },
    chooseStrongPass:  { en: 'Choose a strong password',  ar: 'اختر كلمة مرور قوية' },
    newPassword:       { en: 'New Password',              ar: 'كلمة المرور الجديدة' },
    confirmPassword:   { en: 'Confirm Password',          ar: 'تأكيد كلمة المرور' },
    setNewPasswordBtn: { en: 'Set New Password',          ar: 'تعيين كلمة المرور' },
    updating:          { en: 'Updating…',                 ar: 'جاري التحديث…' },
    linkInvalid:       { en: 'Link invalid',              ar: 'الرابط غير صالح' },
    verifyingLink:     { en: 'Verifying reset link…',     ar: 'جاري التحقق من الرابط…' },
    passwordUpdated:   { en: 'Password updated! Redirecting to sign in…', ar: 'تم تحديث كلمة المرور! جاري التحويل…' },
  },
  register: {
    createAccount:     { en: 'Create account',            ar: 'إنشاء حساب' },
    joinSubtitle:      { en: 'Join Bible Kids',           ar: 'انضم لـ Bible Kids' },
    startClass:        { en: 'Start a class',             ar: 'ابدأ فصلاً' },
    teacherSubtitle:   { en: 'Register as a servant',     ar: 'سجّل كخادم' },
    verifyEmail:       { en: 'Verify your email',         ar: 'تحقق من بريدك' },
    enterOtp:          { en: 'Enter the code sent to',    ar: 'أدخل الرمز المرسل إلى' },
    otpPlaceholder:    { en: '8-digit code',              ar: 'رمز مكوّن من 8 أرقام' },
    verify:            { en: 'Verify',                    ar: 'تحقق' },
    verifying:         { en: 'Verifying…',                ar: 'جاري التحقق…' },
    resendOtp:         { en: 'Resend code',               ar: 'إعادة إرسال الرمز' },
    yourDetails:       { en: 'Your details',              ar: 'بياناتك' },
    fullName:          { en: 'Full name',                 ar: 'الاسم الكامل' },
    age:               { en: 'Age',                       ar: 'العمر' },
    gender:            { en: 'Gender',                    ar: 'الجنس' },
    male:              { en: 'Male',                      ar: 'ذكر' },
    female:            { en: 'Female',                    ar: 'أنثى' },
    selectFamily:      { en: 'Select family',             ar: 'اختر الأسرة' },
    selectGrade:       { en: 'Select grade',              ar: 'اختر المرحلة' },
    selectClass:       { en: 'Select class',              ar: 'اختر الفصل' },
    selectRole:        { en: 'Select role',               ar: 'اختر الدور' },
    register:          { en: 'Register',                  ar: 'تسجيل' },
    registering:       { en: 'Registering…',              ar: 'جاري التسجيل…' },
    sendCode:          { en: 'Send Code',                 ar: 'إرسال الرمز' },
    sending:           { en: 'Sending…',                  ar: 'جاري الإرسال…' },
    alreadyHaveAccount: { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },
    signInHere:        { en: 'Sign in',                   ar: 'تسجيل الدخول' },
    emailVerified:     { en: 'Email verified',            ar: 'تم التحقق من البريد' },
    teacherBadge:      { en: 'Teacher account',           ar: 'حساب خادم' },
  },
  pending: {
    title:          { en: "You're in the queue",          ar: 'طلبك قيد المراجعة' },
    subtitle:       { en: "Your teacher will review your account. You'll be notified once approved — usually within 24 hours.", ar: 'سيراجع خادمك حسابك. ستُخطر بمجرد القبول — عادةً خلال 24 ساعة.' },
    waitingLabel:   { en: 'Waiting for teacher approval', ar: 'في انتظار موافقة الخادم' },
    inReview:       { en: 'In review',                    ar: 'قيد المراجعة' },
    startReading:   { en: "Start today's reading",        ar: 'ابدأ قراءة اليوم' },
    upNext:         { en: 'Up next',                      ar: 'التالي' },
  },
  admin: {
    overview:       { en: 'Overview',              ar: 'نظرة عامة' },
    totalUsers:     { en: 'Total Users',           ar: 'إجمالي المستخدمين' },
    totalStudents:  { en: 'Total Students',        ar: 'إجمالي المخدومين' },
    pendingApproval:{ en: 'Pending Approval',      ar: 'في انتظار الموافقة' },
    todayReading:   { en: "Today's Reading",       ar: 'قراءة اليوم' },
    noReadingToday: { en: 'No reading assigned for today', ar: 'لا توجد قراءة اليوم' },
    analytics:      { en: 'Analytics',             ar: 'الإحصائيات' },
    quickActions:   { en: 'Quick Actions',         ar: 'إجراءات سريعة' },
    manageStudents: { en: 'Manage Students',       ar: 'إدارة المخدومين' },
    assignReading:  { en: 'Assign Reading',        ar: 'تعيين القراءة' },
    readingRate:    { en: 'Reading Rate',          ar: 'معدل القراءة' },
    correctAnswers: { en: 'Correct Answers',       ar: 'الإجابات الصحيحة' },
    perClass:       { en: 'Per Class',             ar: 'لكل فصل' },
    management:     { en: 'Management',            ar: 'الإدارة' },
    searchByName:   { en: 'Search by name…',       ar: 'ابحث بالاسم…' },
    allTypes:       { en: 'All types',             ar: 'الكل' },
    coordinators:   { en: 'Coordinators',          ar: 'أمناء المراحل' },
    allClasses:     { en: 'All classes',           ar: 'كل الفصول' },
    noStudentsFound:{ en: 'No students found',     ar: 'لا يوجد مخدومون' },
    reject:         { en: 'Reject',                ar: 'رفض' },
    approve:        { en: 'Approve',               ar: 'قبول' },
    accept:         { en: 'Accept',                ar: 'قبول' },
    pending:        { en: 'pending',               ar: 'في الانتظار' },
    today:          { en: 'Today',                 ar: 'اليوم' },
    verses:         { en: 'verses',                ar: 'آيات' },
    kids:           { en: 'kids',                  ar: 'مخدومون' },
  },
  kid: {
    todayReading:    { en: "Today's Reading",      ar: 'قراءة اليوم' },
    peace:           { en: 'Peace,',               ar: 'السلام،' },
    noReadingToday:  { en: 'No Reading Today',     ar: 'لا توجد قراءة اليوم' },
    checkBackLater:  { en: 'Check back later for your next assignment.', ar: 'تحقق لاحقاً للقراءة القادمة.' },
    minRead:         { en: '~5 min read',          ar: '~٥ دقائق' },
    complete:        { en: 'Complete',             ar: 'مكتمل' },
    quickCheck:      { en: 'Quick check',          ar: 'اختبار سريع' },
    markComplete:    { en: 'Mark as Complete',     ar: 'تحديد كمكتمل' },
    marking:         { en: 'Marking…',             ar: 'جاري التحديث…' },
    readingComplete: { en: 'Reading Complete!',    ar: 'اكتملت القراءة!' },
    submitAnswers:   { en: 'Submit Answers',       ar: 'إرسال الإجابات' },
    submitting:      { en: 'Submitting…',          ar: 'جاري الإرسال…' },
    brilliantWork:   { en: 'Brilliant work!',      ar: 'عمل رائع!' },
    youEarned:       { en: 'You earned',           ar: 'حصلت على' },
    points:          { en: 'points!',              ar: 'نقطة!' },
    answerAll:       { en: 'Please answer all questions', ar: 'يرجى الإجابة على جميع الأسئلة' },
  },
  common: {
    biblekids:  { en: 'Bible Kids', ar: 'Bible Kids' },
    loading:    { en: 'Loading…',   ar: 'جاري التحميل…' },
    error:      { en: 'Error',      ar: 'خطأ' },
    or:         { en: 'or',         ar: 'أو' },
  },
} as const
```

- [ ] **Step 2: Commit**

```bash
git add utils/labels.ts
git commit -m "feat: add EN/AR labels file"
```

---

## Task 2: Create `contexts/LanguageContext.tsx`

**Files:**
- Create: `contexts/LanguageContext.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Lang, Label } from '@/utils/labels'

interface LanguageContextValue {
  lang: Lang
  toggle: () => void
  t: (label: Label) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  toggle: () => {},
  t: (label) => label.en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang
    if (saved === 'ar' || saved === 'en') setLang(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.documentElement.dataset.lang = lang
  }, [lang])

  const toggle = () => setLang(l => l === 'en' ? 'ar' : 'en')
  const t = (label: Label) => label[lang]

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
```

- [ ] **Step 2: Commit**

```bash
git add contexts/LanguageContext.tsx
git commit -m "feat: add LanguageContext with EN/AR toggle"
```

---

## Task 3: Create `components/LangToggle.tsx` and `components/Providers.tsx`

**Files:**
- Create: `components/LangToggle.tsx`
- Create: `components/Providers.tsx`

- [ ] **Step 1: Create `components/LangToggle.tsx`**

```tsx
'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, toggle } = useLanguage()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle language"
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full border border-border bg-card text-xs font-bold transition-colors hover:bg-muted ${className}`}
    >
      <span style={{ color: lang === 'en' ? 'var(--foreground)' : 'var(--muted-foreground)' }}>EN</span>
      <span className="text-muted-foreground">|</span>
      <span style={{ color: lang === 'ar' ? 'var(--foreground)' : 'var(--muted-foreground)', fontFamily: 'var(--font-arabic)' }}>ع</span>
    </button>
  )
}
```

- [ ] **Step 2: Create `components/Providers.tsx`**

```tsx
'use client'

import { LanguageProvider } from '@/contexts/LanguageContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>
}
```

- [ ] **Step 3: Commit**

```bash
git add components/LangToggle.tsx components/Providers.tsx
git commit -m "feat: add LangToggle component and Providers wrapper"
```

---

## Task 4: Update `app/layout.tsx` and `app/globals.css`

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update `app/layout.tsx`** — wrap children with `<Providers>`. Cairo is already imported; Plus Jakarta Sans is the current main font. No font import changes needed.

```tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cairo } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bible Study App",
  description: "Bible study platform for kids",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4338ca",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            if('serviceWorker' in navigator){
              navigator.serviceWorker.register('/sw.js').then(function(r){
                console.log('[SW] registered scope:', r.scope)
              }).catch(function(e){
                console.error('[SW] registration failed:', e)
              })
            } else {
              console.warn('[SW] not supported')
            }
          `
        }} />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${cairo.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('visibilitychange', function() {
              if (document.visibilityState === 'visible') {
                var last = parseInt(sessionStorage.getItem('_last_active') || '0');
                var now = Date.now();
                if (now - last > 60000) {
                  sessionStorage.setItem('_last_active', now.toString());
                  window.location.reload();
                }
              } else {
                sessionStorage.setItem('_last_active', Date.now().toString());
              }
            });
            sessionStorage.setItem('_last_active', Date.now().toString());
          `
        }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add Arabic font override to `app/globals.css`**

Open `app/globals.css` and add at the end:

```css
/* Arabic font override — activated by LanguageContext setting data-lang="ar" */
html[data-lang="ar"] body {
  font-family: var(--font-arabic);
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: wrap app with Providers, add Arabic font override"
```

---

## Task 5: Update `components/AdminNav.tsx` and `components/KidNav.tsx`

**Files:**
- Modify: `components/AdminNav.tsx`
- Modify: `components/KidNav.tsx`

- [ ] **Step 1: Rewrite `components/AdminNav.tsx`**

Replace the entire file:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import LangToggle from '@/components/LangToggle'
import { L } from '@/utils/labels'

type AdminNavTab = 'dashboard' | 'kids' | 'assignments' | 'history' | 'leaderboard'

export default function AdminNav({ active }: { active: AdminNavTab }) {
  const router = useRouter()
  const { t } = useLanguage()

  const tabs = [
    {
      key: 'dashboard' as const, label: t(L.nav.home), path: '/admin',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
          <rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
          <rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
          <rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
        </svg>
      ),
    },
    {
      key: 'kids' as const, label: t(L.nav.students), path: '/admin/kids',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
          <path d="M1 17c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
          <path d="M13 5a3 3 0 010 4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
          <path d="M16 17c1.5-1 2-2.5 2-3.5a2.5 2.5 0 00-3-2.4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      key: 'assignments' as const, label: t(L.nav.reading), path: '/admin/assignments',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
          <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      key: 'history' as const, label: t(L.nav.history), path: '/admin/history',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
          <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: 'leaderboard' as const, label: t(L.nav.ranks), path: '/admin/leaderboard',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7 18V11h6v7M3 18v-5h4v5M13 18V7h4v11" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-stretch justify-around max-w-lg mx-auto relative">
        {/* LangToggle floats above the nav bar */}
        <div className="absolute -top-8 end-3">
          <LangToggle />
        </div>
        {tabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => !isActive && router.push(tab.path)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {tab.icon(isActive)}
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-muted-foreground hover:text-destructive transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4H4a1 1 0 00-1 1v10a1 1 0 001 1h3M13 14l3-4-3-4M16 10H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] font-bold">{t(L.nav.logout)}</span>
        </button>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Rewrite `components/KidNav.tsx`**

Replace the entire file:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import LangToggle from '@/components/LangToggle'
import { L } from '@/utils/labels'

type KidNavTab = 'dashboard' | 'history' | 'leaderboard' | 'profile'

export default function KidNav({ active }: { active: KidNavTab }) {
  const router = useRouter()
  const { t } = useLanguage()

  const tabs = [
    {
      key: 'dashboard' as const,
      label: t(L.nav.today),
      path: '/kid/dashboard',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path d="M3 8.5L10 3l7 5.5V16a1.5 1.5 0 01-1.5 1.5h-3v-5h-5v5h-3A1.5 1.5 0 013 16V8.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: 'history' as const,
      label: t(L.nav.history),
      path: '/kid/history',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M3 8h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      key: 'leaderboard' as const,
      label: t(L.nav.ranks),
      path: '/kid/leaderboard',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path d="M6 16V9h8v7M3 16V12h3v4M14 16v-5h3v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: 'profile' as const,
      label: t(L.nav.me),
      path: '/kid/profile',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M3.5 17c0-3 2.9-5.3 6.5-5.3S16.5 14 16.5 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border" style={{ paddingBottom: 8 }}>
      <div className="flex items-stretch max-w-lg mx-auto relative">
        {/* LangToggle floats above the nav bar */}
        <div className="absolute -top-8 end-3">
          <LangToggle />
        </div>
        {tabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => !isActive && router.push(tab.path)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="kid-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-sm bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {tab.icon}
              <span className={cn('text-[10px]', isActive ? 'font-bold' : 'font-medium')}>
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

Note: `end-3` is a Tailwind logical property (= `right-3` in LTR, `left-3` in RTL). This ensures the toggle stays on the trailing side in both directions.

- [ ] **Step 3: Commit**

```bash
git add components/AdminNav.tsx components/KidNav.tsx
git commit -m "feat: translate nav labels, add LangToggle to both navbars"
```

---

## Task 6: Update `app/(auth)/login/page.tsx`

**Files:**
- Modify: `app/(auth)/login/page.tsx`

The login page has three steps (`login`, `forgot`, `sent`). Add `useLanguage` and replace every hardcoded string with `t(L.auth.xxx)`. Also add `<LangToggle>` to the top-right of the main login step. Add `rtl:left-auto rtl:right-3` to icon absolute positions.

- [ ] **Step 1: Update imports** — add at the top of the file:

```tsx
import { useLanguage } from '@/contexts/LanguageContext'
import LangToggle from '@/components/LangToggle'
import { L } from '@/utils/labels'
```

- [ ] **Step 2: Add hook inside `LoginForm`** — first line of the component body:

```tsx
const { t } = useLanguage()
```

- [ ] **Step 3: Replace strings in the `forgot` step**

Find the `forgot` step return and replace these strings:
- `"Reset password"` → `{t(L.auth.resetPassword)}`
- `"We'll send a reset link to your email"` → `{t(L.auth.resetSubtitle)}`
- `"Email"` label → `{t(L.auth.email)}`
- `placeholder="your@email.com"` → `placeholder="your@email.com"` (keep as-is, it's a format hint)
- The email input icon `left-3` → add `rtl:left-auto rtl:right-3` to className
- The email input `pl-9` → add `rtl:pl-4 rtl:pr-9` to className
- `"Sending…"` → `{t(L.auth.sending)}`
- `"Send Reset Link"` → `{t(L.auth.sendResetLink)}`
- `"Back to sign in"` → `{t(L.auth.backToSignIn)}`

- [ ] **Step 4: Replace strings in the `sent` step**

- `"Check your inbox"` → `{t(L.auth.checkInbox)}`
- `"A reset link has been sent to"` → `{t(L.auth.resetLinkSent)}`
- The spam notice paragraph → `{t(L.auth.checkSpam)}`
- `"Back to sign in"` → `{t(L.auth.backToSignIn)}`

- [ ] **Step 5: Replace strings in the main `login` step**

- `"Welcome back"` → `{t(L.auth.welcomeBack)}`
- `"Continue your daily reading"` → `{t(L.auth.continueReading)}`
- `"Email"` label → `{t(L.auth.email)}`
- Email icon: add `rtl:left-auto rtl:right-3` and `rtl:pl-4 rtl:pr-9` to the input
- `"Password"` label → `{t(L.auth.password)}`
- `"Forgot password?"` → `{t(L.auth.forgotPassword)}`
- `"Signing in…"` → `{t(L.auth.signingIn)}`
- `"Sign In"` → `{t(L.auth.signIn)}`
- `"or"` divider → `{t(L.common.or)}`
- `"Sign in with Google"` → `{t(L.auth.signInWithGoogle)}`
- `"new here?"` divider → `{t(L.auth.newHere)}`
- `"I'm a student"` → `{t(L.auth.imAStudent)}`
- `"I'm a teacher"` → `{t(L.auth.imATeacher)}`

- [ ] **Step 6: Add `LangToggle` to the main login step**

In the main login step's hero section, add the toggle top-right:

```tsx
{/* Hero */}
<div className="text-center space-y-2 relative">
  <div className="absolute top-0 end-0">
    <LangToggle />
  </div>
  <AppLogo size="lg" className="justify-center" />
  ...
```

- [ ] **Step 7: Commit**

```bash
git add "app/(auth)/login/page.tsx"
git commit -m "feat: translate login page, add LangToggle"
```

---

## Task 7: Update register pages

**Files:**
- Modify: `app/(auth)/register/RegisterPage.tsx`
- Modify: `app/(auth)/admin-register/AdminRegisterPage.tsx`

- [ ] **Step 1: Add to both files' imports**

```tsx
import { useLanguage } from '@/contexts/LanguageContext'
import LangToggle from '@/components/LangToggle'
import { L } from '@/utils/labels'
```

- [ ] **Step 2: Add `const { t } = useLanguage()` inside each component body**

- [ ] **Step 3: In `RegisterPage.tsx` — replace strings across all 3 steps**

Replace all hardcoded UI strings using these label keys:

| Current string | Label key |
|---|---|
| `"Create account"` / `"Join Bible Kids"` heading | `t(L.register.createAccount)` / `t(L.register.joinSubtitle)` |
| `"Send Code"` button | `t(L.register.sendCode)` |
| `"Sending…"` | `t(L.register.sending)` |
| `"Verify your email"` heading | `t(L.register.verifyEmail)` |
| `"Enter the code sent to"` | `t(L.register.enterOtp)` |
| OTP placeholder | `t(L.register.otpPlaceholder)` |
| `"Verify"` button | `t(L.register.verify)` |
| `"Verifying…"` | `t(L.register.verifying)` |
| `"Resend code"` | `t(L.register.resendOtp)` |
| `"Your details"` heading | `t(L.register.yourDetails)` |
| `"Full name"` label | `t(L.register.fullName)` |
| `"Age"` label | `t(L.register.age)` |
| `"Gender"` label | `t(L.register.gender)` |
| `"Male"` option | `t(L.register.male)` |
| `"Female"` option | `t(L.register.female)` |
| `"Select family"` placeholder | `t(L.register.selectFamily)` |
| `"Select grade"` placeholder | `t(L.register.selectGrade)` |
| `"Select class"` placeholder | `t(L.register.selectClass)` |
| `"Register"` button | `t(L.register.register)` |
| `"Registering…"` | `t(L.register.registering)` |
| `"Already have an account?"` | `t(L.register.alreadyHaveAccount)` |
| `"Sign in"` link | `t(L.register.signInHere)` |
| Email verified chip label | `t(L.register.emailVerified)` |

Add `<LangToggle className="absolute top-4 end-4" />` to the outer container of the email step.

Fix icon absolute positions: add `rtl:left-auto rtl:right-3` and `rtl:pl-4 rtl:pr-9` on email inputs with left-side icons.

- [ ] **Step 4: In `AdminRegisterPage.tsx` — apply same pattern**

Same replacements as above plus:
- `"Start a class"` heading → `t(L.register.startClass)`
- `"Register as a servant"` subtitle → `t(L.register.teacherSubtitle)`
- `"Teacher account"` badge → `t(L.register.teacherBadge)`
- `"Select role"` → `t(L.register.selectRole)`

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)/register/RegisterPage.tsx" "app/(auth)/admin-register/AdminRegisterPage.tsx"
git commit -m "feat: translate register pages"
```

---

## Task 8: Update `pending/page.tsx` and `reset-password/page.tsx`

**Files:**
- Modify: `app/(auth)/pending/page.tsx`
- Modify: `app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Update `pending/page.tsx`**

Add imports:
```tsx
import { useLanguage } from '@/contexts/LanguageContext'
import { L } from '@/utils/labels'
```

Add `const { t } = useLanguage()` inside `PendingPage`.

Replace strings:
- `"You're in the queue"` → `{t(L.pending.title)}`
- `"Your teacher will review your account..."` → `{t(L.pending.subtitle)}`
- `"Waiting for teacher approval"` → `{t(L.pending.waitingLabel)}`
- `"In review"` → `{t(L.pending.inReview)}`
- `"Start today's reading"` → `{t(L.pending.startReading)}`
- `"Up next"` → `{t(L.pending.upNext)}`
- Both `"Sign out"` buttons → `{t(L.auth.signOut)}`

- [ ] **Step 2: Update `reset-password/page.tsx`**

Add imports:
```tsx
import { useLanguage } from '@/contexts/LanguageContext'
import LangToggle from '@/components/LangToggle'
import { L } from '@/utils/labels'
```

Add `const { t } = useLanguage()` inside `ResetPasswordPage`.

Replace strings:
- `"Link invalid"` → `{t(L.auth.linkInvalid)}`
- `"Back to sign in"` → `{t(L.auth.backToSignIn)}`
- `"Verifying reset link…"` → `{t(L.auth.verifyingLink)}`
- `"Set new password"` heading → `{t(L.auth.setNewPassword)}`
- `"Choose a strong password"` → `{t(L.auth.chooseStrongPass)}`
- `"New Password"` label → `{t(L.auth.newPassword)}`
- `"Confirm Password"` label → `{t(L.auth.confirmPassword)}`
- `"Set New Password"` button → `{t(L.auth.setNewPasswordBtn)}`
- `"Updating…"` → `{t(L.auth.updating)}`
- `"Password updated! Redirecting..."` → `{t(L.auth.passwordUpdated)}`
- `"Back to sign in"` links → `{t(L.auth.backToSignIn)}`

Add `<LangToggle className="absolute top-4 end-4" />` inside the outermost container div.

Add `rtl:left-auto rtl:right-3` / `rtl:pl-4 rtl:pr-9` on password input icons if applicable.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/pending/page.tsx" "app/(auth)/reset-password/page.tsx"
git commit -m "feat: translate pending and reset-password pages"
```

---

## Task 9: Update admin dashboard and kids list

**Files:**
- Modify: `app/(dashboard)/admin/AdminDashboardView.tsx`
- Modify: `app/(dashboard)/admin/kids/page.tsx`

- [ ] **Step 1: Update `AdminDashboardView.tsx`**

Add imports:
```tsx
import { useLanguage } from '@/contexts/LanguageContext'
import { L } from '@/utils/labels'
```

Add `const { t, lang } = useLanguage()` inside the component.

Replace strings:
- `userRole === 'superuser' ? 'Superuser' : 'Admin'` → `userRole === 'superuser' ? t(L.roles.servant) : t(L.roles.coordinator)`
- `"Overview"` → `{t(L.admin.overview)}`
- `userRole === 'admin' ? 'Total Users' : 'Total Kids'` → `userRole === 'admin' ? t(L.admin.totalUsers) : t(L.admin.totalStudents)`
- `"Pending Approval"` → `{t(L.admin.pendingApproval)}`
- `"Today's Reading"` section label → `{t(L.admin.todayReading)}`
- `"No reading assigned for today"` → `{t(L.admin.noReadingToday)}`
- `"Today"` label on card → `{t(L.admin.today)}`
- `"verses"` label → `{t(L.admin.verses)}`
- `"Analytics"` section label → `{t(L.admin.analytics)}`
- `"Reading Rate"` → `{t(L.admin.readingRate)}`
- `"Correct Answers"` → `{t(L.admin.correctAnswers)}`
- `"Per Class"` → `{t(L.admin.perClass)}`
- `"kids"` suffix → `{t(L.admin.kids)}`
- `"Quick Actions"` → `{t(L.admin.quickActions)}`
- `"Manage Kids"` → `{t(L.admin.manageStudents)}`
- `"Assign Reading"` → `{t(L.admin.assignReading)}`

- [ ] **Step 2: Update `kids/page.tsx`**

Add imports:
```tsx
import { useLanguage } from '@/contexts/LanguageContext'
import { L } from '@/utils/labels'
```

Add `const { t } = useLanguage()` inside `AssignedKidsPage`.

Replace strings:
- `"Management"` → `{t(L.admin.management)}`
- `"Kids"` heading → `{t(L.roles.students)}`
- `"pending"` badge suffix → `{t(L.admin.pending)}`
- `placeholder="Search by name…"` → `placeholder={t(L.admin.searchByName)}`
- Status filter labels: `'All'` → `t(L.status.all)`, `'Approved'` → `t(L.status.approved)`, `'Pending'` → `t(L.status.pending)`, `'Transferred'` → `t(L.status.transferred)`
- Type filter options: `'All types'` → `t(L.admin.allTypes)`, `'Kids'` → `t(L.roles.students)`, `'Superusers'` → `t(L.admin.coordinators)`
- `'All classes'` → `t(L.admin.allClasses)`
- `"No kids found"` → `{t(L.admin.noStudentsFound)}`
- `"Reject"` button → `{t(L.admin.reject)}`
- `"Approve"` button → `{t(L.admin.approve)}`
- `"Accept"` button → `{t(L.admin.accept)}`
- Status labels in `KidSummaryTile` calls: `'Transferred'` → `t(L.status.transferred)`, `'Rejected'` → `t(L.status.rejected)`, `'Pending'` → `t(L.status.pending)`

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/admin/AdminDashboardView.tsx" "app/(dashboard)/admin/kids/page.tsx"
git commit -m "feat: translate admin dashboard and kids list"
```

---

## Task 10: Update remaining admin pages

**Files:**
- Modify: `app/(dashboard)/admin/kids/[type]/[id]/page.tsx`
- Modify: `app/(dashboard)/admin/assignments/page.tsx`
- Modify: `app/(dashboard)/admin/leaderboard/page.tsx`
- Modify: `app/(dashboard)/admin/history/page.tsx`

- [ ] **Step 1: For each file, add imports and hook**

```tsx
import { useLanguage } from '@/contexts/LanguageContext'
import { L } from '@/utils/labels'
// inside component:
const { t } = useLanguage()
```

- [ ] **Step 2: `kids/[type]/[id]/page.tsx`** — translate these strings:

Read the file first, then replace:
- Any page title headings (e.g. `"Student"`, `"Coordinator"`)
- Status badges using `L.status.*` keys
- Button labels: `"Approve"` → `t(L.admin.approve)`, `"Reject"` → `t(L.admin.reject)`, `"Transfer"` → keep or add key
- Stats labels: `"Reading Rate"` → `t(L.admin.readingRate)`, `"Correct Answers"` → `t(L.admin.correctAnswers)`
- Any `"History"` section labels → `t(L.nav.history)`

- [ ] **Step 3: `assignments/page.tsx`** — translate these strings:

Read the file first, then replace:
- Page heading section label → `t(L.nav.reading)` or similar
- `"Assign Reading"` title → `t(L.admin.assignReading)`
- Any button labels for submitting assignments

- [ ] **Step 4: `leaderboard/page.tsx`** — translate these strings:

Read the file first, then replace:
- Page heading → `t(L.nav.ranks)`
- Any `"Family"` / `"Grade"` / `"Class"` labels → use `L.entities.*`
- Column/row labels as applicable

- [ ] **Step 5: `history/page.tsx`** — translate these strings:

Read the file first, then replace:
- Page heading → `t(L.nav.history)`
- Any date/stats labels

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/admin/kids/[type]/[id]/page.tsx" "app/(dashboard)/admin/assignments/page.tsx" "app/(dashboard)/admin/leaderboard/page.tsx" "app/(dashboard)/admin/history/page.tsx"
git commit -m "feat: translate remaining admin pages"
```

---

## Task 11: Update kid pages

**Files:**
- Modify: `app/(dashboard)/kid/dashboard/KidDashboardView.tsx`
- Modify: `app/(dashboard)/kid/leaderboard/page.tsx`
- Modify: `app/(dashboard)/kid/history/page.tsx`
- Modify: `app/(dashboard)/kid/profile/page.tsx`

- [ ] **Step 1: For each file, add imports and hook**

```tsx
import { useLanguage } from '@/contexts/LanguageContext'
import { L } from '@/utils/labels'
// inside component:
const { t } = useLanguage()
```

- [ ] **Step 2: `KidDashboardView.tsx`** — translate:

- `"Peace,"` subtitle → `{t(L.kid.peace)}`
- `"Today's Reading"` heading → `{t(L.kid.todayReading)}`
- `"No Reading Today"` → `{t(L.kid.noReadingToday)}`
- `"Check back later for your next assignment."` → `{t(L.kid.checkBackLater)}`
- `"Today's reading"` card label → `{t(L.kid.todayReading)}`
- `"~5 min read"` → `{t(L.kid.minRead)}`
- `"Complete"` badge → `{t(L.kid.complete)}`
- `"Quick check"` → `{t(L.kid.quickCheck)}`
- `"Mark as Complete"` button → `{t(L.kid.markComplete)}`
- `"Marking…"` → `{t(L.kid.marking)}`
- `"Reading Complete!"` → `{t(L.kid.readingComplete)}`
- `"Submit Answers"` → `{t(L.kid.submitAnswers)}`
- `"Submitting…"` → `{t(L.kid.submitting)}`
- `"Brilliant work!"` → `{t(L.kid.brilliantWork)}`
- `"You earned"` → `{t(L.kid.youEarned)}`
- `"points!"` → `{t(L.kid.points)}`
- `'Please answer all questions'` error → `t(L.kid.answerAll)`
- `'Error submitting quiz'` — keep as-is (internal error)

- [ ] **Step 3: `leaderboard/page.tsx`** — translate page header and column labels by reading the file and applying `L.nav.ranks` for the title and any student/family/grade labels.

- [ ] **Step 4: `history/page.tsx`** — translate page header using `L.nav.history` and any date or stats labels.

- [ ] **Step 5: `profile/page.tsx`** — read the file and translate:
- Page title / section headers
- Setting row labels (notifications, sign out, etc.)
- Stats labels (streak, points, level, etc.)

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/kid/dashboard/KidDashboardView.tsx" "app/(dashboard)/kid/leaderboard/page.tsx" "app/(dashboard)/kid/history/page.tsx" "app/(dashboard)/kid/profile/page.tsx"
git commit -m "feat: translate kid dashboard pages"
```

---

## Task 12: Verify end-to-end

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test English mode (default)**

- Open `http://localhost:3000/login` — all text in English, toggle shows `EN | ع` with EN bold
- Toggle to Arabic — page text switches to Arabic, `dir="rtl"` applied, font switches to Cairo
- Toggle back to English — everything reverts
- Reload the page — language preference persists from localStorage

- [ ] **Step 3: Test all routes in Arabic**

Check that Arabic text renders correctly (no garbled characters) on:
- `/login`, `/register`, `/admin-register`, `/pending`
- `/admin`, `/admin/kids`, `/admin/assignments`
- `/kid/dashboard`, `/kid/leaderboard`, `/kid/profile`

- [ ] **Step 4: Test RTL layout**

In Arabic mode:
- Nav toggle appears on the correct trailing edge
- Email/password input icons flip to right side
- Text alignment is right-to-left throughout

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete EN/AR bilingual interface with terminology rename"
```
