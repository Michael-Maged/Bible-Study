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
    getTenants()
      .then(res => {
        if (!res.success) setError((res as { error?: string }).error || 'Failed to load tenants')
        else setTenants(res.data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load tenants')
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

        {!loading && error && step !== 4 && (
          <p className="text-xs text-red-500 font-medium px-1">{error}</p>
        )}

        {/* Step 1: Tenants */}
        {!loading && !error && step === 1 && (
          <div className="space-y-2">
            {tenants.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No tenants found.</p>
            )}
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
