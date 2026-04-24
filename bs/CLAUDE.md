# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev        # Start dev server (Next.js)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

No test framework is configured.

## Architecture Overview

This is a **Next.js 16 App Router** Bible study platform for kids with admin management, built on **Supabase** (PostgreSQL + Auth) and **Tailwind CSS v4**.

### Route Groups

- `app/(auth)/` — Public auth routes: login, register, admin-register, verify-phone, pending
- `app/(dashboard)/admin/` — Admin/superuser protected routes
- `app/(dashboard)/kid/` — Kid/student protected routes
- `app/api/` — API routes (bible content, questions, attempts, OTP, push notifications)

Root (`app/page.tsx`) redirects to `/login`. The middleware (`middleware.ts`) handles session validation and role-based redirects using Supabase session cookies.

### Authentication & Authorization

Three roles: `kid`, `admin`, `superuser`. Role is stored in the user profile in Supabase. Middleware reads the `user-role` cookie for offline fallback.

- Admin/superuser → `/admin`
- Kid → `/kid/dashboard`
- Protected routes enforced by `middleware.ts`

### Supabase Clients

Two client factories in `utils/supabase/`:
- `client.ts` — Browser client (anon key), used in client components
- `server.ts` — Server client with cookie management for Server Components + `createAdminClient()` using service role key for privileged ops

### Data Layer

- `api/userApi.ts` — User CRUD
- `api/adminApi.ts` — Admin ops (approve/manage users)
- `api/tenantApi.ts` — Tenant/organization management
- All types defined in `types/index.ts`

### Path Alias

`@/*` maps to the repo root (`./`), so imports like `@/components/Foo` and `@/utils/supabase/client` are from the project root.

### PWA & Offline

- Service worker at `public/sw.js`, registered in root layout
- `hooks/useOfflineData.ts` handles caching for offline mode
- `components/OfflineBanner.tsx` shows offline status

### Push Notifications & Cron

- Web push via `web-push` package; subscription endpoint at `/api/push/subscribe`
- Vercel cron job runs `POST /api/push/daily` daily at 12:00 UTC (`vercel.json`)

### Styling

Tailwind CSS v4 via `@tailwindcss/postcss`. Theme color is `#59f20d`. Fonts: Spline Sans + Material Symbols (Google Fonts), loaded in root layout.

## Recent Changes
- 001-modern-gui-redesign: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
