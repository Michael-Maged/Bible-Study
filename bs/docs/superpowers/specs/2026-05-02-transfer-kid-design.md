# Transfer Kid Feature — Design Spec

**Date:** 2026-05-02  
**Status:** Approved

---

## Overview

Admins and superusers can transfer a kid from their current class to any other class across any tenant or grade. The transfer applies different status rules depending on whether the destination is within the same grade/tenant or not.

---

## Architecture

### New files
- `app/(dashboard)/admin/kids/[type]/[id]/TransferKidModal.tsx` — client component, 4-step modal UI

### Modified files
- `app/(dashboard)/admin/kids/actions.ts` — 4 new server actions added
- `app/(dashboard)/admin/kids/[type]/[id]/page.tsx` — Transfer button + modal mounted

---

## Server Actions (`actions.ts`)

Four new server actions, all using `createAdminClient()`:

### `getTenants()`
Returns all rows from the `tenant` table (`id`, `name`).

### `getGradesByTenant(tenantId: string)`
Returns all rows from the `grade` table where `tenant = tenantId` (`id`, `grade_num`, `name`, `gender`).

### `getClassesByGrade(gradeNum: number)`
Returns all rows from the `classes` table where `grade = gradeNum`. Returns (`id`, `name`). Since `grade_num` is globally unique in the DB, no tenant filter is needed.

### `transferKid(enrollmentId: string, newClassId: string)`
1. Fetch current enrollment → get current `class` id → get that class's `grade_num` and `tenant`.
2. Fetch target class → get its `grade_num` and `tenant`.
3. Determine new status:
   - `grade_num` is the same **AND** `tenant` is the same → `status = 'accepted'`
   - `grade_num` differs **OR** `tenant` differs → `status = 'transferred'`
4. Update enrollment: `{ class: newClassId, status }`.
5. Call `revalidatePath('/admin/kids')`.

---

## Modal UI (`TransferKidModal.tsx`)

Client component, receives `enrollmentId`, `currentClassName`, `currentGrade`, `currentTenant` as props.

### Step flow

| Step | Content |
|------|---------|
| 1 — Tenant | List of all tenants. Current tenant highlighted. |
| 2 — Grade | Grades for selected tenant. Current grade highlighted. |
| 3 — Class | Classes for selected grade+tenant. Current class highlighted. |
| 4 — Confirm | Summary card (see below) + Cancel / Confirm Transfer buttons. |

### Confirmation summary card
Shows:
- Kid's name
- `Current class → New class`
- Resulting status badge (`Accepted` in green or `Transferred` in amber)
- Warning message if status will be `transferred`: *"This kid will leave your management and require acceptance by the new admin."*

### After confirmation
- Calls `transferKid(enrollmentId, newClassId)`
- On success: closes modal, calls `router.refresh()` to reload page state
- On error: shows inline error message, stays on confirm step

---

## Kid Detail Page changes

- A **"Transfer"** button added to the action area (visible only when `isKid === true` and `request.status !== 'rejected'`).
- Button opens `TransferKidModal`.
- Existing Approve/Reject flow is unchanged.

---

## Status Logic Summary

| Destination | Resulting status | Visible to current admin after transfer |
|-------------|-----------------|----------------------------------------|
| Same grade, same tenant | `accepted` | Yes |
| Different grade OR different tenant | `transferred` | No (disappears) |

---

## Out of Scope

- Notification to destination admin (no push notification on transfer)
- Transfer history / audit log
- Bulk transfer
- Undo / reverse transfer
