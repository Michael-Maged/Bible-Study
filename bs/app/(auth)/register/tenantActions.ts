'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function fetchTenants() {
  try {
    const { data, error } = await serviceSupabase.from('tenant').select('id, name').order('name')
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function fetchGradesByTenant(tenantId: string) {
  try {
    const { data, error } = await serviceSupabase.from('grade').select('id, name, grade_num').eq('tenant', tenantId).order('grade_num')
    if (error) return { success: false, error: error.message, data: null }
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: null }
  }
}

export async function fetchClassesByGrade(gradeNum: string) {
  try {
    const { data, error } = await serviceSupabase.from('classes').select('id, name, grade').eq('grade', gradeNum).order('name')
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: null }
  }
}
