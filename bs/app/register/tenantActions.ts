'use server'

import { getTenants, getGradesByTenant, getClassesByGrade } from '@/api/tenantApi'

export async function fetchTenants() {
  try {
    const { data, error } = await getTenants()
    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function fetchGradesByTenant(tenantId: string) {
  console.log('Server: Fetching grades for tenant:', tenantId)
  try {
    const { data, error } = await getGradesByTenant(tenantId)
    console.log('Server: Raw response:', { data, error })
    if (error) {
      console.error('Grade fetch error:', error)
      return { success: false, error: error.message, data: null }
    }
    console.log('Grades fetched:', data)
    return { success: true, data }
  } catch (error: any) {
    console.error('Grade fetch exception:', error)
    return { success: false, error: error.message, data: null }
  }
}

export async function fetchClassesByGrade(gradeId: string) {
  try {
    const { data, error } = await getClassesByGrade(gradeId)
    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
