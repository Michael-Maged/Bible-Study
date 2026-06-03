'use server'

import { createClient } from '@/utils/supabase/server'

export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to send reset email' }
  }
}
