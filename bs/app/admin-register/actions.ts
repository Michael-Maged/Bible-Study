'use server'

import { handleAdminRegistration } from '@/routes/adminRoutes'
import { createAdminUser } from '@/api/userApi'
import { fetchGradesByTenant } from '../register/tenantActions'

export async function registerAdmin(formData: FormData) {
  const userData = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    age: parseInt(formData.get('age') as string),
    gender: formData.get('gender') as 'male' | 'female'
  }

  const gradeId = formData.get('grade') as string

  try {
    const { data: user, error: userError } = await createAdminUser(userData)
    if (userError || !user) throw new Error(userError?.message || 'Failed to create user')

    const { data: gradeData } = await fetchGradesByTenant(formData.get('tenant') as string)
    const selectedGrade = gradeData?.find((g: any) => g.id === gradeId)
    if (!selectedGrade) throw new Error('Grade not found')

    const adminData = {
      user_id: user.id,
      grade: selectedGrade.grade_num,
      role: formData.get('role') as 'admin' | 'superuser',
      tenant: formData.get('tenant') as string
    }

    await handleAdminRegistration(adminData)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' }
  }
}
