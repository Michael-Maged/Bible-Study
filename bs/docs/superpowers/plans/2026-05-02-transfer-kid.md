# Transfer Kid Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins and superusers to transfer a kid to any class across any tenant or grade via a 4-step modal on the kid detail page.

**Architecture:** Four new server actions handle data fetching and the write operation. A new client component `TransferKidModal` manages the multi-step UI. The existing `getRequestDetails` action is enhanced to return the kid's current class ID and tenant so the modal knows what to highlight and what status will result.

**Tech Stack:** Next.js 16 App Router, Supabase (service role client), React, Tailwind CSS v4, shadcn/ui Button component.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `app/(dashboard)/admin/kids/actions.ts` |
| Modify | `types/index.ts` |
| Create | `app/(dashboard)/admin/kids/[type]/[id]/TransferKidModal.tsx` |
| Modify | `app/(dashboard)/admin/kids/[type]/[id]/page.tsx` |

---

## Task 1: Add server actions and enhance `getRequestDetails`

**File:** `app/(dashboard)/admin/kids/actions.ts`

### What to add

- Import `revalidatePath` from `next/cache`
- Add `getTenants()` — returns all rows from `tenant` table
- Add `getGradesByTenant(tenantId)` — returns grades filtered by tenant
- Add `getClassesByGrade(gradeNum)` — returns classes for a given grade number
- Add `transferKid(enrollmentId, newClassId)` — updates enrollment record with correct status
- Enhance `getRequestDetails` kid branch to also return `class.id` and `class.gradeInfo.tenant`

---

- [ ] **Step 1: Add `revalidatePath` import and four new server actions**

Open `app/(dashboard)/admin/kids/actions.ts`. Add the import and four functions at the bottom of the file:

```typescript
import { revalidatePath } from 'next/cache'
```

```typescript
export async function getTenants() {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('tenant')
    .select('id, name')
    .order('name')
  if (error) return { success: false as const, error: error.message, data: [] as { id: string; name: string }[] }
  return { success: true as const, data: data || [] }
}

export async function getGradesByTenant(tenantId: string) {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('grade')
    .select('id, grade_num, name, gender')
    .eq('tenant', tenantId)
    .order('grade_num')
  if (error) return { success: false as const, error: error.message, data: [] as { id: string; grade_num: number; name: string; gender: string }[] }
  return { success: true as const, data: data || [] }
}

export async function getClassesByGrade(gradeNum: number) {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('id, name')
    .eq('grade', gradeNum)
    .order('name')
  if (error) return { success: false as const, error: error.message, data: [] as { id: string; name: string }[] }
  return { success: true as const, data: data || [] }
}

export async function transferKid(enrollmentId: string, newClassId: string) {
  const supabaseAdmin = createAdminClient()

  const { data: enrollment } = await supabaseAdmin
    .from('enrollment')
    .select('class')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return { success: false as const, error: 'Enrollment not found' }

  const [{ data: currentClass }, { data: newClass }] = await Promise.all([
    supabaseAdmin
      .from('classes')
      .select('grade, gradeInfo:grade!class_grade_fkey(tenant)')
      .eq('id', enrollment.class)
      .single(),
    supabaseAdmin
      .from('classes')
      .select('grade, gradeInfo:grade!class_grade_fkey(tenant)')
      .eq('id', newClassId)
      .single(),
  ])

  if (!currentClass || !newClass) return { success: false as const, error: 'Class not found' }

  const currentGradeInfo = currentClass.gradeInfo as { tenant: string } | null
  const newGradeInfo = newClass.gradeInfo as { tenant: string } | null

  const sameContext =
    currentClass.grade === newClass.grade &&
    currentGradeInfo?.tenant === newGradeInfo?.tenant

  const newStatus = sameContext ? 'accepted' : 'transferred'

  const { error: updateError } = await supabaseAdmin
    .from('enrollment')
    .update({ class: newClassId, status: newStatus })
    .eq('id', enrollmentId)

  if (updateError) return { success: false as const, error: updateError.message }

  revalidatePath('/admin/kids')
  return { success: true as const, newStatus }
}
```

- [ ] **Step 2: Enhance `getRequestDetails` kid branch**

In the same file, find the `getRequestDetails` function's `else` branch (type === 'kid'). Change the select string to include `id` and `gradeInfo` on the class join:

```typescript
// Before:
.select('*, user(*), class:classes!enrollment_class_fkey(*)')

// After:
.select('*, user(*), class:classes!enrollment_class_fkey(id, name, grade, gradeInfo:grade!class_grade_fkey(tenant))')
```

- [ ] **Step 3: Verify the file builds with no TypeScript errors**

```bash
cd "bs" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `actions.ts`. (Ignore unrelated pre-existing errors if any.)

- [ ] **Step 4: Commit**

```bash
git add bs/app/\(dashboard\)/admin/kids/actions.ts
git commit -m "feat: add transfer kid server actions"
```

---

## Task 2: Update `RequestDetail` type

**File:** `types/index.ts`

The `class` field on `RequestDetail` currently only has `{ name: string; grade: number }`. We need `id` and `gradeInfo.tenant` so the modal receives the kid's current class ID and tenant.

---

- [ ] **Step 1: Update the `class` field in `RequestDetail`**

In `types/index.ts`, find:

```typescript
export type RequestDetail = {
  id: string
  status: 'pending' | 'accepted' | 'rejected' | 'transferred'
  type: 'admin' | 'kid'
  role?: string
  user: { name: string; email?: string; age: number; gender: string }
  class?: { name: string; grade: number }
  grade?: { name: string }
}
```

Replace with:

```typescript
export type RequestDetail = {
  id: string
  status: 'pending' | 'accepted' | 'rejected' | 'transferred'
  type: 'admin' | 'kid'
  role?: string
  user: { name: string; email?: string; age: number; gender: string }
  class?: { id: string; name: string; grade: number; gradeInfo?: { tenant: string } }
  grade?: { name: string }
}
```

- [ ] **Step 2: Commit**

```bash
git add bs/types/index.ts
git commit -m "feat: extend RequestDetail class type with id and gradeInfo"
```

---

## Task 3: Create `TransferKidModal.tsx`

**File:** `app/(dashboard)/admin/kids/[type]/[id]/TransferKidModal.tsx`

Client component managing 4 steps: tenant → grade → class → confirm.

Props:
- `open: boolean`
- `onClose: () => void`
- `enrollmentId: string` — the enrollment record to update
- `kidName: string`
- `currentClassId: string` — used to disable "current" class in step 3
- `currentClassName: string` — shown in confirmation summary
- `currentGradeNum: number` — used to highlight current grade in step 2
- `currentTenantId: string` — used to highlight current tenant in step 1

---

- [ ] **Step 1: Create the file**

Create `app/(dashboard)/admin/kids/[type]/[id]/TransferKidModal.tsx` with this content:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getTenants, getGradesByTenant, getClassesByGrade, transferKid } from '../../actions'
import { Button } from '@/components/ui/button'

type Tenant = { id: string; name: string }
type GradeItem = { id: string; grade_num: number; name: string }
type ClassItem = { id: string; name: string }

type Props = {
  open: boolean
  onClose: () => void
  enrollmentId: string
  kidName: string
  currentClassId: string
  currentClassName: string
  currentGradeNum: number
  currentTenantId: string
}

export default function TransferKidModal({
  open, onClose, enrollmentId, kidName,
  currentClassId, currentClassName, currentGradeNum, currentTenantId,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [grades, setGrades] = useState<GradeItem[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<GradeItem | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setSelectedTenant(null)
    setSelectedGrade(null)
    setSelectedClass(null)
    setError(null)
    setLoading(true)
    getTenants().then(res => {
      setTenants(res.data)
      setLoading(false)
    })
  }, [open])

  async function handleSelectTenant(t: Tenant) {
    setSelectedTenant(t)
    setSelectedGrade(null)
    setSelectedClass(null)
    setLoading(true)
    const res = await getGradesByTenant(t.id)
    setGrades(res.data)
    setLoading(false)
    setStep(2)
  }

  async function handleSelectGrade(g: GradeItem) {
    setSelectedGrade(g)
    setSelectedClass(null)
    setLoading(true)
    const res = await getClassesByGrade(g.grade_num)
    setClasses(res.data)
    setLoading(false)
    setStep(3)
  }

  function handleSelectClass(c: ClassItem) {
    if (c.id === currentClassId) return
    setSelectedClass(c)
    setStep(4)
  }

  async function handleConfirm() {
    if (!selectedClass) return
    setSubmitting(true)
    setError(null)
    const res = await transferKid(enrollmentId, selectedClass.id)
    setSubmitting(false)
    if (!res.success) {
      setError((res as { error?: string }).error || 'Transfer failed')
      return
    }
    onClose()
    router.refresh()
  }

  const willBeTransferred =
    selectedTenant && selectedGrade
      ? selectedTenant.id !== currentTenantId || selectedGrade.grade_num !== currentGradeNum
      : false

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background rounded-t-2xl sm:rounded-2xl border border-border p-5 space-y-4 max-h-[80vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Step {step} of 4
            </p>
            <h2 className="text-[17px] font-bold text-foreground">
              {step === 1 && 'Select Tenant'}
              {step === 2 && 'Select Grade'}
              {step === 3 && 'Select Class'}
              {step === 4 && 'Confirm Transfer'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors text-muted-foreground text-sm"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="py-8 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Step 1: Tenants */}
        {!loading && step === 1 && (
          <div className="space-y-2">
            {tenants.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTenant(t)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  t.id === currentTenantId
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:bg-accent/30'
                }`}
              >
                <span className="text-sm font-medium text-foreground">{t.name}</span>
                {t.id === currentTenantId && (
                  <span className="ml-2 text-xs font-bold" style={{ color: 'var(--primary)' }}>current</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Grades */}
        {!loading && step === 2 && (
          <div className="space-y-2">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              ← {selectedTenant?.name}
            </button>
            {grades.map(g => (
              <button
                key={g.id}
                onClick={() => handleSelectGrade(g)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  g.grade_num === currentGradeNum && selectedTenant?.id === currentTenantId
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:bg-accent/30'
                }`}
              >
                <span className="text-sm font-medium text-foreground">{g.name}</span>
                {g.grade_num === currentGradeNum && selectedTenant?.id === currentTenantId && (
                  <span className="ml-2 text-xs font-bold" style={{ color: 'var(--primary)' }}>current</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Classes */}
        {!loading && step === 3 && (
          <div className="space-y-2">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              ← {selectedGrade?.name}
            </button>
            {classes.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No classes found for this grade.</p>
            )}
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelectClass(c)}
                disabled={c.id === currentClassId}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  c.id === currentClassId
                    ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                    : 'border-border bg-card hover:bg-accent/30'
                }`}
              >
                <span className="text-sm font-medium">{c.name}</span>
                {c.id === currentClassId && (
                  <span className="ml-2 text-xs text-muted-foreground font-bold">current</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && selectedClass && selectedTenant && selectedGrade && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(3)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-sm font-bold text-foreground">{kidName}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{currentClassName}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold text-foreground">{selectedClass.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Status after:</span>
                {willBeTransferred ? (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(194,133,27,0.10)', color: '#c2851b' }}
                  >
                    Transferred
                  </span>
                ) : (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(90,122,58,0.10)', color: '#5a7a3a' }}
                  >
                    Accepted
                  </span>
                )}
              </div>
            </div>

            {willBeTransferred && (
              <div
                className="rounded-xl border px-4 py-3"
                style={{ background: 'rgba(194,133,27,0.06)', borderColor: 'rgba(194,133,27,0.3)' }}
              >
                <p className="text-xs" style={{ color: '#c2851b' }}>
                  This kid will leave your management and require acceptance by the new admin.
                </p>
              </div>
            )}

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={submitting}
                className="shadow-[0_2px_0_rgba(138,90,15,0.25)]"
              >
                {submitting ? 'Transferring…' : 'Confirm Transfer'}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd "bs" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `TransferKidModal.tsx`.

- [ ] **Step 3: Commit**

```bash
git add "bs/app/(dashboard)/admin/kids/[type]/[id]/TransferKidModal.tsx"
git commit -m "feat: create TransferKidModal component"
```

---

## Task 4: Wire Transfer button into the kid detail page

**File:** `app/(dashboard)/admin/kids/[type]/[id]/page.tsx`

Add:
1. Import `TransferKidModal`
2. `transferOpen` boolean state
3. A "Transfer" button in the action area (visible when `isKid && request.status !== 'rejected'`)
4. Mount `<TransferKidModal>` at the bottom of the page, passing props derived from `request`

---

- [ ] **Step 1: Add import and `transferOpen` state**

At the top of `page.tsx`, add the import after the existing component imports:

```tsx
import TransferKidModal from './TransferKidModal'
```

Inside the component body, after the existing `const [actionLoading, setActionLoading] = useState(false)` line, add:

```tsx
const [transferOpen, setTransferOpen] = useState(false)
```

- [ ] **Step 2: Add Transfer button to the action area**

Find the Approve / Reject buttons block:

```tsx
{/* Approve / Reject */}
{request.status === 'pending' && (
  <div className="flex gap-3 pt-2">
    <Button variant="outline" className="flex-1" onClick={() => setConfirmAction('reject')}>Reject</Button>
    <Button className="flex-[2] shadow-[0_2px_0_rgba(138,90,15,0.25)]" onClick={() => setConfirmAction('approve')}>Approve</Button>
  </div>
)}
```

Replace it with:

```tsx
{/* Approve / Reject */}
{request.status === 'pending' && (
  <div className="flex gap-3 pt-2">
    <Button variant="outline" className="flex-1" onClick={() => setConfirmAction('reject')}>Reject</Button>
    <Button className="flex-[2] shadow-[0_2px_0_rgba(138,90,15,0.25)]" onClick={() => setConfirmAction('approve')}>Approve</Button>
  </div>
)}

{/* Transfer */}
{isKid && request.status !== 'rejected' && (
  <div className="pt-2">
    <Button
      variant="outline"
      className="w-full"
      onClick={() => setTransferOpen(true)}
    >
      Transfer to Another Class
    </Button>
  </div>
)}
```

- [ ] **Step 3: Mount `TransferKidModal` before the closing `</div>` of the page**

Find the last `<AdminNav active="kids" />` line near the bottom. Just before it, add:

```tsx
{isKid && request.class && (
  <TransferKidModal
    open={transferOpen}
    onClose={() => setTransferOpen(false)}
    enrollmentId={params.id as string}
    kidName={displayName}
    currentClassId={request.class.id}
    currentClassName={request.class.name}
    currentGradeNum={request.class.grade}
    currentTenantId={request.class.gradeInfo?.tenant ?? ''}
  />
)}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd "bs" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `page.tsx`.

- [ ] **Step 5: Start dev server and test the happy paths**

```bash
cd "bs" && npm run dev
```

Test cases to verify manually:
1. Navigate to an accepted kid's detail page → "Transfer to Another Class" button appears
2. Click Transfer → modal opens at step 1 showing tenants; current tenant is highlighted
3. Select tenant → step 2 shows grades for that tenant; current grade highlighted if same tenant
4. Select grade → step 3 shows classes; current class is disabled
5. Select a class in the **same grade and same tenant** → confirmation shows status "Accepted" (no warning)
6. Confirm → enrollment updated, page refreshes, kid still visible with status "accepted"
7. Repeat but select a class in a **different grade or tenant** → confirmation shows status "Transferred" with warning message
8. Confirm → kid disappears from this admin's view (enrollment updated to `transferred`)

- [ ] **Step 6: Commit**

```bash
git add "bs/app/(dashboard)/admin/kids/[type]/[id]/page.tsx"
git commit -m "feat: add Transfer button to kid detail page"
```
