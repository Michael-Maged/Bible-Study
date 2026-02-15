'use server'

import { createClient } from '@/utils/supabase/server'
import { createUser, createAdminUser } from '@/api/userApi'
import { handleAdminRegistration } from '@/routes/adminRoutes'
import { fetchGradesByTenant } from '../register/tenantActions'

export async function verifyAndCreateUser(phone: string, code: string, type: 'kid' | 'admin', pendingData: any) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms'
    })
    
    if (error) throw new Error('Invalid verification code')

    if (type === 'kid') {
      const userData = {
        name: pendingData.name,
        phone: pendingData.phone,
        age: parseInt(pendingData.age),
        gender: pendingData.gender,
        tenantId: pendingData.tenantId,
        gradeId: pendingData.gradeId,
        classId: pendingData.classId
      }

      const { data: user, error: userError } = await createUser(userData)
      if (userError || !user) throw new Error(userError?.message || 'Failed to create user')
    } else {
      const userData = {
        name: pendingData.name,
        phone: pendingData.phone,
        age: parseInt(pendingData.age),
        gender: pendingData.gender as 'male' | 'female'
      }

      const { data: user, error: userError } = await createAdminUser(userData)
      if (userError || !user) throw new Error(userError?.message || 'Failed to create user')

      const { data: gradeData } = await fetchGradesByTenant(pendingData.tenant)
      const selectedGrade = gradeData?.find((g: any) => g.id === pendingData.grade)
      if (!selectedGrade) throw new Error('Grade not found')

      const adminData = {
        user_id: user.id,
        grade: selectedGrade.grade_num,
        role: pendingData.role as 'admin' | 'superuser',
        tenant: pendingData.tenant
      }

      await handleAdminRegistration(adminData)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Verification failed' }
  }
}
