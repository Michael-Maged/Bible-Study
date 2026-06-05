# Superadmin Account — Design Spec

**Date:** 2026-06-05  
**Branch:** Superadmin  

---

## Overview

A single fixed superadmin account with credentials stored in environment variables. This account sits above all existing roles and is responsible for approving/rejecting coordinator (امين مرحلة) registrations. It has a dedicated dashboard at `/superadmin` with full visibility across all families, coordinators, servants, and students.

---

## Role Hierarchy (updated)

```
superadmin  ← new, single fixed account
  └── coordinator (admin / امين مرحلة)
        └── servant (superuser / خادم)
              └── student (kid / مخدوم)
```

---

## Authentication

### Credentials
Stored in environment variables — no Supabase account, no DB record:
```
SUPERADMIN_EMAIL=<any string>
SUPERADMIN_PASSWORD=<strong password>
```

### Login flow
In `app/(auth)/login/emailActions.ts`, before the Supabase auth call:
```ts
if (email === process.env.SUPERADMIN_EMAIL && password === process.env.SUPERADMIN_PASSWORD) {
  cookies().set('user-role', 'superadmin', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  return { success: true, user: { role: 'superadmin' }, isPending: false }
}
```

No Supabase session is created. The middleware's existing cookie fallback handles all route protection.

### Sign out
Clear the `user-role` cookie and redirect to `/login`. No Supabase signOut call needed.

---

## Routing & Middleware (`proxy.ts`)

1. Add `superadmin` to admin path access:
```ts
if (isAdminPath && userRole !== 'admin' && userRole !== 'superuser' && userRole !== 'superadmin') {
  redirect to /kid/dashboard
}
```

2. Protect `/superadmin` — only `superadmin` role may access it. All other roles redirected away.

3. Root `/` redirect for superadmin → `/superadmin`.

4. Redirect superadmin away from `/admin` → `/superadmin` (they have their own dashboard).

---

## Dashboard — `/superadmin`

Single page. No bottom nav bar. Sign-out button top-right.

### Section 1: Overview stats (4 cards)
- Total coordinators (accepted + pending count from `admin` table)
- Total servants (accepted + pending from `admin` table where role = 'superuser')
- Total students (count from `enrollment` table where status = 'accepted')
- Total families (count from `grade` table distinct tenants, or `tenant` table if it exists)

### Section 2: Pending coordinators *(main feature)*
Lists all rows from `admin` table where `status = 'pending'` and `role = 'admin'`, joined with `user` table for name/email.

Each row shows:
- Name
- Email
- Family (tenant)
- Grade (مرحلة)
- Role label

Actions per row:
- **Approve** → set `admin.status = 'accepted'` + send approval email via `sendApprovalEmail()`
- **Reject** → send rejection email via `sendRejectionEmail()` + delete `admin` row + delete `user` row + delete auth user via admin client

### Section 3: All coordinators (read-only)
Lists all rows from `admin` table where `status = 'accepted'` and `role = 'admin'`, joined with `user` for name/email. No actions — overview only.

---

## Files Changed

| Action | File |
|---|---|
| Modify | `app/(auth)/login/emailActions.ts` — add superadmin credential check |
| Modify | `proxy.ts` — add superadmin routing rules |
| Create | `app/(dashboard)/superadmin/page.tsx` — server component, fetches data |
| Create | `app/(dashboard)/superadmin/SuperadminView.tsx` — client component, UI |
| Create | `app/(dashboard)/superadmin/actions.ts` — approve/reject server actions |
| Create | `app/(dashboard)/superadmin/layout.tsx` — minimal layout (no nav) |

---

## Data Queries

### Pending coordinators
```sql
SELECT admin.id, admin.role, admin.grade, admin.tenant, admin.status,
       user.name, user.email
FROM admin
JOIN user ON admin.user_id = user.id
WHERE admin.status = 'pending' AND admin.role = 'admin'
```

### Approve action
```ts
await supabase.from('admin').update({ status: 'accepted' }).eq('id', adminId)
await sendApprovalEmail(email, name)
```

### Reject action
```ts
await sendRejectionEmail(email, name)
await supabase.from('admin').delete().eq('id', adminId)
await supabase.from('user').delete().eq('id', userId)
await adminClient.auth.admin.deleteUser(authId)
```

---

## Constraints

- No Supabase session for superadmin — cookie-only auth
- Credentials never exposed to the client
- No registration flow for superadmin — account is pre-configured via env vars
- No forgot password — credentials managed via env vars directly
- Superadmin cannot access `/admin` (redirected to `/superadmin`)
- The `sendApprovalEmail` and `sendRejectionEmail` functions already exist in `utils/sendEmail.ts`
