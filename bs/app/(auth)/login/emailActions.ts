'use server'

import { createClient } from '@/utils/supabase/server'
import { timingSafeEqual, createHmac } from 'crypto'

export function superadminSessionToken(): string {
  const secret = process.env.SUPERADMIN_SESSION_SECRET ?? 'fallback-change-in-prod'
  return createHmac('sha256', secret)
    .update(`${process.env.SUPERADMIN_EMAIL}:${process.env.SUPERADMIN_PASSWORD}`)
    .digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  try { return timingSafeEqual(Buffer.from(a), Buffer.from(b)) } catch { return false }
}

export async function loginWithEmail(email: string, password: string) {
  // Superadmin: credential-only auth (no Supabase account)
  const saEmail = process.env.SUPERADMIN_EMAIL ?? ''
  const saPass  = process.env.SUPERADMIN_PASSWORD ?? ''
  if (saEmail && saPass && safeEqual(email, saEmail) && safeEqual(password, saPass)) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const baseOpts = {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    }
    cookieStore.set('user-role', 'superadmin', baseOpts)
    cookieStore.set('superadmin-token', superadminSessionToken(), { ...baseOpts, httpOnly: true })
    return { success: true, user: { role: 'superadmin' }, isPending: false }
  }

  try {
    const supabase = await createClient()
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      return { success: false, error: 'Invalid email or password' }
    }
    
    if (!data.session) {
      return { success: false, error: 'Login failed' }
    }
    
    // Get user details from custom user table
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('*, admin(*), enrollment(*)')
      .eq('auth_id', data.user.id)
      .single()
    
    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }
    
    // Determine role and check status
    let userRole = 'kid'
    let isPending = false
    
    if (user.admin && user.admin.length > 0) {
      userRole = user.admin[0].role
      isPending = user.admin[0].status === 'pending'
    } else if (user.enrollment && user.enrollment.length > 0) {
      isPending = user.enrollment[0].status === 'pending'
    }
    
    // Sign out if pending
    if (isPending) {
      await supabase.auth.signOut()
    } else {
      // Set user-role cookie for non-pending users
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      cookieStore.set('user-role', userRole, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
    }
    
    return { 
      success: true, 
      user: { 
        id: user.id, 
        name: user.name,
        role: userRole
      },
      isPending
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Login failed' }
  }
}
