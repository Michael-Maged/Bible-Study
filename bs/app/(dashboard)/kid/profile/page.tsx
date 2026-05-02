'use client'

import { getUserProfile } from '../dashboard/actions'
import OfflineBanner from '@/components/OfflineBanner'
import LoadingScreen from '@/components/LoadingScreen'
import { cacheProfile, getCachedProfile } from '@/utils/offlineCache'
import KidNav from '@/components/KidNav'
import { useOfflineData } from '@/hooks/useOfflineData'
import { useState } from 'react'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function SettingRow({
  icon,
  label,
  sub,
  toggle,
  toggleOn,
  onToggle,
  chevron,
  onClick,
  danger,
  separator,
}: {
  icon: React.ReactNode
  label: string
  sub?: string
  toggle?: boolean
  toggleOn?: boolean
  onToggle?: () => void
  chevron?: boolean
  onClick?: () => void
  danger?: boolean
  separator?: boolean
}) {
  return (
    <div
      onClick={onClick || (toggle ? onToggle : undefined)}
      className="flex items-center gap-3 px-4 py-3 cursor-default"
      style={{
        borderTop: separator ? '1px solid var(--border)' : undefined,
        borderBottom: '1px solid var(--border)',
        cursor: (onClick || toggle) ? 'pointer' : 'default',
      }}
    >
      <div
        className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
        style={{
          background: danger ? 'rgba(166,66,66,0.12)' : '#f4e4c0',
          color: danger ? '#a64242' : '#8a5a0f',
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[13.5px] font-semibold leading-snug"
          style={{ color: danger ? '#a64242' : 'var(--foreground)', fontWeight: danger ? 700 : 600 }}
        >
          {label}
        </div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      {toggle && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.() }}
          className="flex-shrink-0"
          style={{
            width: 36, height: 22, borderRadius: 999,
            background: toggleOn ? '#c2851b' : '#f0e8d6',
            border: toggleOn ? 'none' : '1px solid #e4d8be',
            position: 'relative', transition: 'background 0.15s',
          }}
        >
          <span
            style={{
              position: 'absolute', top: 2,
              [toggleOn ? 'right' : 'left']: 2,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
              transition: 'left 0.15s, right 0.15s',
              display: 'block',
            }}
          />
        </button>
      )}
      {chevron && (
        <span style={{ color: danger ? '#a64242' : 'var(--muted-foreground)', fontSize: 18, lineHeight: 1 }}>›</span>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { data: profile, loading } = useOfflineData(getUserProfile, getCachedProfile, cacheProfile)
  const [notifEnabled, setNotifEnabled] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('push_opted_out') !== 'true'
  )

  const toggleNotifications = () => {
    const next = !notifEnabled
    setNotifEnabled(next)
    localStorage.setItem('push_opted_out', next ? 'false' : 'true')
  }

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.clear()
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((n) => caches.delete(n)))
    }
    window.location.href = '/login'
  }

  if (loading) return <LoadingScreen />

  if (!profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Profile not found</p>
    </div>
  )

  const initials = getInitials(profile.name)

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <OfflineBanner />

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-4">

        {/* Page header */}
        <div className="mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Account</p>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">Profile</h1>
        </div>

        {/* Hero card */}
        <div
          className="rounded-2xl border border-border p-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(160deg, #f7ecd3 0%, #f7f1e6 70%)' }}
        >
          <div
            className="rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
            style={{ width: 58, height: 58, background: '#c2851b', color: '#fff', fontSize: 22 }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#8a5a0f]">My class</p>
            <p className="text-[15px] font-bold text-foreground mt-0.5">
              {profile.tenant || 'Bible Kids'}
              {profile.className ? ` · ${profile.className}` : ''}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{profile.email}</p>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: profile.current_score ?? 0, label: 'Total pts', accent: true },
            { value: profile.streak ?? 0, label: 'Day streak', accent: false },
            { value: profile.best_streak ?? 0, label: 'Best streak', accent: false },
          ].map(({ value, label, accent }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-3">
              <div
                className="text-[22px] font-bold tracking-tight leading-none"
                style={{ color: accent ? 'var(--primary)' : 'var(--foreground)' }}
              >
                {value}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-1.5">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Details badges */}
        {(profile.grade || profile.age || profile.gender) && (
          <div className="flex flex-wrap gap-2">
            {profile.grade && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full border border-border bg-card text-foreground">
                {profile.grade}
              </span>
            )}
            {profile.age && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full border border-border bg-card text-foreground">
                {profile.age} yrs
              </span>
            )}
            {profile.gender && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full border border-border bg-card text-foreground capitalize">
                {profile.gender}
              </span>
            )}
          </div>
        )}

        {/* Settings section label */}
        <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground px-1 pt-1">
          Settings
        </p>

        {/* Settings list */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <SettingRow
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6a4 4 0 018 0v2l1.5 2.5H2.5L4 8V6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M6.5 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            }
            label="Daily reminder"
            sub={notifEnabled ? 'Notifications enabled' : 'Notifications off'}
            toggle
            toggleOn={notifEnabled}
            onToggle={toggleNotifications}
          />
          <SettingRow
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M2 8h12M8 2a8 8 0 010 12M8 2a8 8 0 000 12" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            }
            label="Language"
            sub="English"
            chevron
          />
          <SettingRow
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M3 14c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            }
            label={profile.name}
            sub={profile.email || undefined}
          />
          <SettingRow
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3H4a1 1 0 00-1 1v8a1 1 0 001 1h2M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            label="Log out"
            sub="Sign out of this device"
            chevron
            onClick={handleLogout}
            danger
            separator
          />
        </div>

      </main>

      <KidNav active="profile" />
    </div>
  )
}
