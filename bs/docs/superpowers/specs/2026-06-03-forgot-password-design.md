# Forgot Password Design

**Date:** 2026-06-03  
**Status:** Approved

## Summary

Add forgot password functionality for both kids and admins. The request flow is inline on the login page (step-based, matching existing patterns). The reset flow lives on a new `/reset-password` page that Supabase redirects to after the user clicks the email link.

---

## Flow

```
Login page — step: 'login' | 'forgot' | 'sent'

'login' (default):
  → existing email + password form
  → "Forgot password?" button → step = 'forgot'

'forgot':
  → email input + "Send Reset Link" button
  → sendPasswordReset(email)
      → supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })
  → on success: forgotEmail = email, step = 'sent'
  → on error: show error via MessageBox
  → "Back to sign in" link → step = 'login'

'sent':
  → "Check your inbox — a reset link has been sent to {forgotEmail}"
  → "Back to sign in" link → step = 'login'

/reset-password (new page):
  → Supabase sends email → user clicks link → redirected here
  → client listens for PASSWORD_RECOVERY via onAuthStateChange
  → shows new password + confirm password form
  → supabase.auth.updateUser({ password: newPassword })
  → on success: router.push('/login')
  → on error: show error message
```

---

## New Files

### `app/(auth)/login/resetActions.ts`

```typescript
'use server'
// sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }>
// Calls supabase.auth.resetPasswordForEmail(email, { redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/reset-password' })
```

### `app/(auth)/reset-password/page.tsx`

Client component:
- Uses `createClient()` (browser client)
- `useEffect` subscribes to `supabase.auth.onAuthStateChange` — listens for `PASSWORD_RECOVERY` event to confirm valid reset session
- Form: new password + confirm password inputs
- On submit: `supabase.auth.updateUser({ password })`
- On success: `router.push('/login')`
- Loading + error states

---

## Modified Files

### `app/(auth)/login/page.tsx`

- Add `step: 'login' | 'forgot' | 'sent'` state
- Add `forgotEmail: string` state
- Add `handleSendReset` async function calling `sendPasswordReset`
- `'forgot'` step: email input, "Send Reset Link" button, "Back to sign in" link
- `'sent'` step: success message showing `forgotEmail`, "Back to sign in" link
- Existing "Forgot password?" `<span>` → `<button>` that sets `step = 'forgot'`

### `proxy.ts`

- Add `/reset-password` to `publicPaths` array

---

## What Does NOT Change

- Login email+password flow — untouched
- Google login flow — untouched
- Registration flows — untouched
- `emailActions.ts` — untouched
