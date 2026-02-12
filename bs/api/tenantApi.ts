'use server'

import { createClient } from '@/utils/supabase/server'

export async function getTenants() {
  const supabase = await createClient()
  return await supabase.from('tenant').select('*')
}

export async function getGradesByTenant(tenantId: string) {
  const supabase = await createClient()
  return await supabase.from('grade').select('*').eq('tenant', tenantId)
}

export async function getClassesByGrade(gradeNum: string) {
  const supabase = await createClient()
  return await supabase.from('classes').select('*').eq('grade', parseInt(gradeNum))
}
