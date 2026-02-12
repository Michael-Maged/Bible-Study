import { getTenants, getGradesByTenant, getClassesByGrade } from '@/api/tenantApi'

export async function handleGetTenants() {
  const { data, error } = await getTenants()
  if (error) throw new Error(error.message)
  return data
}

export async function handleGetGradesByTenant(tenantId: string) {
  const { data, error } = await getGradesByTenant(tenantId)
  if (error) throw new Error(error.message)
  return data
}

export async function handleGetClassesByGrade(gradeId: string) {
  const { data, error } = await getClassesByGrade(gradeId)
  if (error) throw new Error(error.message)
  return data
}
