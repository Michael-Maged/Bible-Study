'use server'

import { getTenants, getGradesByTenant, getClassesByGrade } from '@/api/tenantApi'

export async function fetchTenants() {
  try {
    const { data, error } = await getTenants()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function fetchGradesByTenant(tenantId: string) {
  try {
    const { data, error } = await getGradesByTenant(tenantId)
    if (error) return { success: false, error: error.message, data: null }
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: null }
  }
}

export async function fetchClassesByGrade(gradeId: string) {
  try {
    const { data, error } = await getClassesByGrade(gradeId)
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: null }
  }
}
