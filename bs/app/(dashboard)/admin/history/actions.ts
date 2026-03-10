'use server'

import { createClient } from '@/utils/supabase/server'

export async function getFutureReadings() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Not authenticated' }
    
    const { data: userData } = await supabase
      .from('user')
      .select('*, admin(tenant, grade)')
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
    
    return { success: true, data: readings }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
