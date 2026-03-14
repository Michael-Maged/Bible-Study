'use server'

import { createClient } from '@/utils/supabase/server'

export async function getFutureReadings() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Not authenticated' }
    
    const { data: userData } = await supabase
      .from('user')
      .select('*, admin(tenant, grade, user_id)')
      .eq('auth_id', user.id)
      .single()
    
    if (!userData?.admin?.[0]) return { success: false, error: 'Admin not found' }
    
    const { tenant } = userData.admin[0]
    const today = new Date().toISOString().split('T')[0]
    
    const { data: readings, error } = await supabase
      .from('reading')
      .select('*, grade(grade_num, gender)')
      .eq('tenant', tenant)
      .gte('day', today)
      .order('day', { ascending: true })
    
    if (error) throw error
    
    return { success: true, data: readings, currentUserId: userData.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function updateReading(readingId: string, updates: { day?: string, book?: number, chapter?: number, from_verse?: number, to_verse?: number }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Not authenticated' }
    
    const { error } = await supabase
      .from('reading')
      .update(updates)
      .eq('id', readingId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deleteReading(readingId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Not authenticated' }
    
    const { error } = await supabase
      .from('reading')
      .delete()
      .eq('id', readingId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
