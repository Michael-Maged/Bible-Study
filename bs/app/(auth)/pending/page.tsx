'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import AppLogo from '@/components/AppLogo'

function TimelineStep({
  state,
  label,
  meta,
  last,
}: {
  state: 'done' | 'active' | 'next'
  label: string
  meta: string
  last?: boolean
}) {
  const isDone = state === 'done'
  const isActive = state === 'active'
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] ${
            isDone
              ? 'bg-primary border-primary'
              : isActive
              ? 'bg-card border-primary'
              : 'bg-card border-border'
          }`}
        >
          {isDone && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {isActive && <div className="w-2 h-2 rounded-full bg-primary" />}
        </div>
        {!last && <div className="w-px bg-border mt-1" style={{ minHeight: 28 }} />}
      </div>
      <div className="flex-1 pb-4 last:pb-0">
        <div className={`text-sm font-semibold ${state === 'next' ? 'text-muted-foreground' : 'text-foreground'}`}>
          {label}
        </div>
        <div
          className={`text-xs mt-0.5 uppercase tracking-wide font-semibold ${
            isActive ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {meta}
        </div>
      </div>
    </div>
  )
}

export default function PendingPage() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #f7ecd3 0%, #f7f1e6 70%)' }}
    >
      <div className="w-full max-w-sm space-y-5">

        {/* Sign out top-right */}
        <div className="flex justify-end">
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Hero illustration */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative flex items-center justify-center w-36 h-36">
            <div className="absolute w-32 h-32 rounded-full bg-accent opacity-60" />
            <div className="absolute w-24 h-24 rounded-full bg-card/70 border border-border" />
            <div className="relative w-16 h-16 bg-card rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(40,30,15,0.12)]">
              <AppLogo size="md" showText={false} />
            </div>
            {/* Pulse accent dot */}
            <div
              className="absolute w-2.5 h-2.5 rounded-full bg-primary"
              style={{ top: 22, right: 'calc(50% - 46px)', boxShadow: '0 0 0 4px #f4e4c0' }}
            />
          </div>

          {/* Ornament */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <div className="w-6 h-px bg-primary opacity-60" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <div className="w-6 h-px bg-primary opacity-60" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-foreground mt-3">You&apos;re in the queue</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mt-2">
            Your teacher will review your account. You&apos;ll be notified once approved — usually within 24 hours.
          </p>
        </div>

        {/* Timeline card */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <TimelineStep state="done" label="Phone verified" meta="Submitted" />
          <TimelineStep state="active" label="Waiting for teacher approval" meta="In review" />
          <TimelineStep state="next" label="Start today's reading" meta="Up next" last />
        </div>

        {/* Sign out action */}
        <button
          onClick={handleSignOut}
          className="w-full h-11 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
        >
          Sign out
        </button>

      </div>
    </div>
  )
}
