'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function sendEmailOtp(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createAdminClient()

    // Prevent re-registration if email already has an active account
    const { data: existingUser } = await supabaseAdmin
      .from('user')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return { success: false, error: 'This email is already registered. Please sign in instead.' }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to send verification code' }
  }
}

export async function verifyEmailOtp(email: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

    if (error || !data.user) {
      return { success: false, error: 'Invalid or expired code' }
    }

    // Delete temp auth user so registration can create a proper one with a password
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)

    // Clear the temp session
    await supabase.auth.signOut()

    return { success: true }
  } catch {
    return { success: false, error: 'Verification failed' }
  }
}
