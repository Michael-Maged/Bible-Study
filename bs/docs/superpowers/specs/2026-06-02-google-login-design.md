# Google Login Design

**Date:** 2026-06-02  
**Status:** Approved

## Summary

Add "Sign in with Google" as an alternative login method for existing users (both kids and admins/teachers). Google login is login-only — not registration. Users must first create an account via the existing email+password flow. On subsequent visits they can click the Google button instead of typing credentials.

## Approach

Supabase Auto-Link + Callback Guard (Option A).

Supabase automatically links a Google identity to an existing email/password account when the email matches. A `/auth/callback` route guards the sign-in: it rejects Google accounts whose email has no corresponding row in the custom `user` table.

## Supabase Dashboard Change (One-Time)

Enable **"Allow automatic linking of accounts with the same email"** under:  
Auth → Settings → User Identities

This merges the Google OAuth identity into the existing auth.users entry on first Google sign-in.

## Flow

```
Login page
  └─ "Sign in with Google" button
       └─ supabase.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })
            └─ Supabase handles Google OAuth
                 └─ GET /auth/callback?code=...
                      ├─ exchangeCodeForSession(code)
                      ├─ query user table by auth_id
                      │    ├─ FOUND → set user-role cookie → redirect to /admin or /kid/dashboard
                      │    └─ NOT FOUND → signOut() → redirect to /login?error=not_registered
                      └─ on error → redirect to /login?error=auth_failed
```

## UI Changes

**`app/(auth)/login/page.tsx`** — add Google button between the "or" divider and the existing student/teacher buttons. Existing buttons are unchanged.

```
[Email field]
[Password field]
[Sign In button]
─────── or ───────
[G  Sign in with Google]    ← new
──────────────────────
[I'm a student] [I'm a teacher]   ← unchanged
```

- Google button: full-width, outlined, rounded-xl, Google "G" SVG logo, matches existing card style
- On `?error=not_registered`: show MessageBox — "No account found. Please register first."
- On `?error=auth_failed`: show MessageBox — "Sign in failed. Please try again."

## New Files

### `app/auth/callback/route.ts`

Next.js Route Handler (GET):
1. Extract `code` from query params
2. Call `supabase.auth.exchangeCodeForSession(code)`
3. Query `user` table: `select('*, admin(*), enrollment(*)')` where `auth_id = session.user.id`
4. If no user row → `signOut()` → redirect to `/login?error=not_registered`
5. Determine role (same logic as `emailActions.ts`): check `admin` array for role/status
6. If pending → `signOut()` → redirect to `/pending`
7. Set `user-role` cookie (same as `emailActions.ts`)
8. Redirect to `/admin` or `/kid/dashboard`

## Modified Files

### `app/(auth)/login/page.tsx`
- Add `handleGoogleLogin` async function: calls `createClient().auth.signInWithOAuth`
- Read `searchParams` for `?error=` and display via existing `MessageBox`
- Add Google button in JSX

## What Does NOT Change

- Existing email+password login (`emailActions.ts`) — untouched
- Existing phone OTP login (`actions.ts`) — untouched
- Middleware (`middleware.ts`) — untouched
- DB schema — no changes needed
- Registration flows (`/register`, `/admin-register`) — untouched
