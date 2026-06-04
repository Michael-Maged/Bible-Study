# English/Arabic Interface + Terminology Rename

**Date:** 2026-06-04  
**Branch:** BS-55-english-arabic-interface  
**Stories:** Terminology rename + EN/AR language toggle

---

## Overview

Two related stories implemented as one:

1. **Rename terminology** — replace generic technical terms (`admin`, `superuser`, `kid`, `tenant`) with domain-accurate names from the Coptic Sunday school context.
2. **English/Arabic toggle** — English-default UI with a toggle to switch to Arabic. Preference stored in `localStorage`.

Both are solved by a single labels system — a typed `utils/labels.ts` file holding all UI strings as `{ en, ar }` pairs.

DB values (`admin`, `superuser`, `kid`), URL paths, and cookies are **not changed**.

---

## Terminology Map

| Current (code/DB) | Arabic | English display name |
|---|---|---|
| `admin` | امين مرحلة | Coordinator |
| `superuser` | خادم | Servant |
| `kid` | مخدوم | Student |
| `tenant` | اسرة | Family |
| `class` | فصل | Class (unchanged) |
| `grade` | مرحلة | Grade (unchanged) |
| `enrollment` | تسجيل | Enrollment (internal, not shown) |
| `pending` | في الانتظار | Pending |
| `accepted` | مقبول | Accepted |
| `rejected` | مرفوض | Rejected |
| `transferred` | محوّل | Transferred |

---

## Architecture

### 1. Labels file — `utils/labels.ts`

Single source of truth for all UI strings. Typed object with `{ en: string; ar: string }` pairs, grouped by domain:

```
L.roles.coordinator   → { en: 'Coordinator', ar: 'امين مرحلة' }
L.roles.servant       → { en: 'Servant',     ar: 'خادم' }
L.roles.student       → { en: 'Student',     ar: 'مخدوم' }
L.entities.family     → { en: 'Family',      ar: 'اسرة' }
L.nav.dashboard       → { en: 'Dashboard',   ar: 'الرئيسية' }
L.nav.students        → { en: 'Students',    ar: 'المخدومين' }
L.nav.assignments     → { en: 'Assign Reading', ar: 'تعيين القراءة' }
L.nav.leaderboard     → { en: 'Leaderboard', ar: 'لوحة الشرف' }
L.auth.signIn         → { en: 'Sign In',     ar: 'تسجيل الدخول' }
... (all other UI strings)
```

No i18n library. Just a typed object. Adding a new string = add one line.

### 2. Language context — `contexts/LanguageContext.tsx`

Client component. Provides:
- `lang: 'en' | 'ar'` — current language
- `toggle()` — flip language and persist to `localStorage`
- `t(s: { en: string; ar: string }) => string` — resolve a label to current language

On mount: reads `localStorage.getItem('lang')`, defaults to `'en'`.  
On change: writes `localStorage`, sets `document.documentElement.dir` (`ltr`/`rtl`) and `document.documentElement.lang`.

`LanguageProvider` wraps `{children}` in `app/layout.tsx`.

### 3. Toggle component — `components/LangToggle.tsx`

Reusable pill button:
```
[EN | ع]   ← English active
[E | عر]   ← Arabic active (active side bold)
```

Placed in:
- `AdminNav` — top-right of nav bar
- `KidNav` — top-right of nav bar
- Login page — top-right corner
- Register page — top-right corner
- Admin-register page — top-right corner

### 4. Font

Replace **Spline Sans** with **Cairo** (Google Fonts). Cairo supports both Arabic and Latin scripts — no font-switching logic needed. Single font for both languages.

### 5. RTL handling

`dir="rtl"` on `<html>` (set by context) handles most layout flipping automatically. Tailwind RTL variants (`rtl:right-3 rtl:left-auto`) needed for ~5–6 places with hardcoded `left-*` absolute positions (e.g. input icons in login/register forms).

---

## Files Changed

| File | Change |
|---|---|
| `utils/labels.ts` | **new** — all EN/AR string pairs |
| `contexts/LanguageContext.tsx` | **new** — provider + hook |
| `components/LangToggle.tsx` | **new** — reusable toggle pill |
| `app/layout.tsx` | add `LanguageProvider`, swap font to Cairo |
| `components/AdminNav.tsx` | add `LangToggle`, translate nav labels |
| `components/KidNav.tsx` | add `LangToggle`, translate nav labels |
| `app/(auth)/login/page.tsx` | add `LangToggle`, translate all strings |
| `app/(auth)/register/RegisterPage.tsx` | add `LangToggle`, translate strings |
| `app/(auth)/admin-register/AdminRegisterPage.tsx` | add `LangToggle`, translate strings |
| `app/(auth)/pending/page.tsx` | translate strings |
| `app/(auth)/reset-password/page.tsx` | translate strings |
| `app/(dashboard)/admin/AdminDashboardView.tsx` | translate strings, role labels |
| `app/(dashboard)/admin/kids/page.tsx` | translate strings, status/type labels |
| `app/(dashboard)/admin/kids/[type]/[id]/page.tsx` | translate strings |
| `app/(dashboard)/admin/assignments/page.tsx` | translate strings |
| `app/(dashboard)/admin/leaderboard/page.tsx` | translate strings |
| `app/(dashboard)/kid/` pages | translate strings |

---

## Constraints

- DB values (`admin`, `superuser`, `kid`) are not renamed — display layer only.
- URL paths are not changed.
- Cookie `user-role` stays as-is.
- Language preference is per-device (`localStorage`), not per-user (no DB column needed).
- Server components pass translated strings as props; only client components call `useLanguage()` directly.
