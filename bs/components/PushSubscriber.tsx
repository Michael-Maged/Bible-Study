'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

async function doSubscribe(): Promise<{ status: string; detail?: string }> {
  if (!('serviceWorker' in navigator)) return { status: 'unsupported', detail: 'Service Worker not supported — try closing and reopening the app' }
  if (!('PushManager' in window)) return { status: 'unsupported', detail: 'Push not supported on this browser' }
  if (!('Notification' in window)) return { status: 'unsupported', detail: 'Notifications not supported' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { status: 'denied', detail: `Permission: ${permission}` }

  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { status: 'error', detail: 'Not logged in' }

  // Explicitly register SW if not already registered
  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch (_) {}

  // Wait for SW to be ready with a timeout
  let reg: ServiceWorkerRegistration
  try {
    reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 10000))
    ]) as ServiceWorkerRegistration
  } catch (e) {
    return { status: 'error', detail: `SW not ready: ${e instanceof Error ? e.message : e}` }
  }

  let sub
  try {
    const existing = await reg.pushManager.getSubscription()
    sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    })
  } catch (e) {
    return { status: 'error', detail: `Subscribe failed: ${e instanceof Error ? e.message : e}` }
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ subscription: sub }),
  })

  const json = await res.json()
  if (!res.ok) return { status: 'error', detail: json.error ?? `HTTP ${res.status}` }
  return { status: 'ok' }
}

export default function PushSubscriber() {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'denied' | 'unsupported' | 'error'>('idle')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    if (localStorage.getItem('push_opted_out') === 'true') return
    if (!('Notification' in window)) { setState('unsupported'); setDetail('Notifications not supported'); return }
    if (Notification.permission === 'granted' || Notification.permission === 'default') {
      setState('loading')
      doSubscribe().then(r => { setState(r.status as typeof state); setDetail(r.detail ?? '') })
    }
  }, [])

  if (state === 'ok') return null
  if (typeof window !== 'undefined' && localStorage.getItem('push_opted_out') === 'true') return null

  if (state === 'loading') return (
    <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-500 text-center">
      Setting up notifications...
    </div>
  )

  if (state === 'unsupported') return (
    <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-400 text-center">
      {detail || 'Push notifications not supported on this device'}
    </div>
  )

  if (state === 'denied') return (
    <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-sm text-orange-600 dark:text-orange-400 text-center">
      Notifications blocked — enable them in browser settings
    </div>
  )

  if (state === 'error') return (
    <div className="mx-4 mt-3 space-y-2">
      <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400 text-center">
        {detail || 'Failed to enable notifications'}
      </div>
      <button
        onClick={() => { setState('loading'); doSubscribe().then(r => { setState(r.status as typeof state); setDetail(r.detail ?? '') }) }}
        className="w-full py-3 rounded-xl bg-[#59f20d]/10 border border-[#59f20d]/30 text-[#59f20d] text-sm font-semibold"
      >
        Retry
      </button>
    </div>
  )

  return (
    <div className="mx-4 mt-3 flex gap-2">
      <button
        onClick={() => { setState('loading'); doSubscribe().then(r => { setState(r.status as typeof state); setDetail(r.detail ?? '') }) }}
        className="flex-1 py-3 rounded-xl bg-[#59f20d]/10 border border-[#59f20d]/30 text-[#59f20d] text-sm font-semibold flex items-center justify-center gap-2"
      >
        🔔 Enable push notifications
      </button>
      <button
        onClick={() => { localStorage.setItem('push_opted_out', 'true'); setState('ok') }}
        className="px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-sm"
        title="Don't show again"
      >
        ✕
      </button>
    </div>
  )
}
