# Kid Registration Email OTP + Admin Rejection Design

**Date:** 2026-06-03  
**Status:** Approved

## Summary

Two tightly coupled features:
1. **Email OTP at registration** — kids verify their real email address before filling out the registration form, using Supabase's built-in email OTP (no paid API).
2. **Admin rejection with cleanup** — when an admin rejects a pending kid, a rejection email is sent to the kid's verified address, then all their data is deleted so they can re-register cleanly.

The OTP is **registration-only**. The login flow is untouched.

---

## Feature 1: Email OTP Verification at Registration

### Flow

```
Step 1 — Email verification (NEW)
  kid enters email
    → sendEmailOtp(email)
        → supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
        → Supabase sends 6-digit OTP email
    → kid enters 6-digit code
    → verifyEmailOtp(email, token)
        → supabase.auth.verifyOtp({ email, token, type: 'email' })
        → supabase.auth.signOut()  ← clear temp session immediately
    → advance to Step 2 with verified email locked in

Step 2 — Profile form (existing, minimally modified)
  email: pre-filled + readOnly + green checkmark
  name, password, confirm password, age, gender, church, grade, class
    → registerKidWithEmail() — unchanged
    → pending admin approval
```

### UI

`RegisterPage.tsx` gains a `step` state: `'email' | 'otp' | 'form'`.

**Step `'email'`:**
- Email input + "Send Code" button
- On success → transitions to `'otp'`

**Step `'otp'`:**
- Single `<input type="text" maxLength={6} />` for the OTP code
- "Verify" button
- "Resend code" link (re-calls `sendEmailOtp`)
- On success → transitions to `'form'` with `verifiedEmail` set

**Step `'form'`:**
- Existing registration form, unchanged
- Email field: pre-filled from `verifiedEmail`, `readOnly`, shows ✓ verified indicator
- All other fields unchanged

### New File: `app/(auth)/register/otpActions.ts`

```typescript
'use server'

export async function sendEmailOtp(email: string)
// Calls supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
// Returns { success: boolean, error?: string }

export async function verifyEmailOtp(email: string, token: string)
// Calls supabase.auth.verifyOtp({ email, token, type: 'email' })
// On success: calls supabase.auth.signOut()
// Returns { success: boolean, error?: string }
```

### Modified: `app/(auth)/register/RegisterPage.tsx`

- Add `step: 'email' | 'otp' | 'form'` state
- Add `verifiedEmail: string` state
- Add `handleSendOtp` and `handleVerifyOtp` handlers (use shared `otpActions.ts`)
- Step `'form'`: email input is `readOnly` with value from `verifiedEmail`
- No changes to `handleSubmit` or `registerKidWithEmail`

### Modified: `app/(auth)/admin-register/AdminRegisterPage.tsx`

- Same two-step pattern as `RegisterPage.tsx`
- Add `step: 'email' | 'otp' | 'form'` state
- Add `verifiedEmail: string` state
- Add `handleSendOtp` and `handleVerifyOtp` handlers (same shared `otpActions.ts`)
- Step `'form'`: email input is `readOnly` with value from `verifiedEmail`
- No changes to `handleSubmit` or `registerAdminWithEmail`

### Modified: `app/(auth)/register/emailActions.ts`

No changes needed.

---

## Feature 2: Admin Rejection with Cleanup + Email Notification

### Flow

```
Admin clicks Reject on a pending kid enrollment
  → handleApproveRequest(type='kid', id, approved=false)
       → fetch user email + name from user table
       → sendRejectionEmail(email, name)   ← nodemailer
       → delete enrollment row
       → delete user row
       → supabaseAdmin.auth.admin.deleteUser(auth_id)
```

Deletion order: enrollment first (FK dependency), then user row, then auth.users entry.

**Transferred kids** (existing special case in `handleApproveRequest`) are NOT deleted — they are sent back to their original class as before. Only first-time pending rejections trigger deletion + email.

### New File: `utils/sendEmail.ts`

```typescript
export async function sendRejectionEmail(to: string, name: string): Promise<void>
```

Uses `nodemailer` with Gmail SMTP. Required env vars:
- `EMAIL_USER` — Gmail address (e.g. `biblestudy@gmail.com`)
- `EMAIL_PASS` — Gmail App Password (not the account password)

Email content:
- Subject: "Your registration was not approved"
- Body: addresses kid by name, explains the submission was not approved, invites them to re-register with correct information

### Modified: `app/(dashboard)/admin/kids/actions.ts` — `handleApproveRequest`

On rejection of a `kid` type enrollment where `status !== 'transferred'`:
1. Fetch `user` row by `enrollment.user_id` to get `email`, `name`, `auth_id`
2. Call `sendRejectionEmail(email, name)`
3. Delete `enrollment` row by `id`
4. Delete `user` row by `user_id`
5. Delete `auth.users` entry via `supabaseAdmin.auth.admin.deleteUser(auth_id)`
6. Return `{ success: true }`

If email send fails: log the error but continue with deletion (deletion is more important than notification).

---

## Environment Variables Required

```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

Add to `.env.local` for development and to production environment config.

## Dependencies

- `nodemailer` (npm package) — for rejection email only
- No new dependencies for OTP (uses existing Supabase client)

## What Does NOT Change

- Login page (`app/(auth)/login/page.tsx`) — untouched
- `registerKidWithEmail` in `emailActions.ts` — untouched
- `registerAdminWithEmail` in `emailActions.ts` — untouched
- Transferred kid rejection handling — untouched (existing special case preserved)
