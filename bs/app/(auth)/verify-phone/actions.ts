'use server'

import { createClient } from '@/utils/supabase/server'
import { createUser, createAdminUser } from '@/api/userApi'
import { handleAdminRegistration } from '@/routes/adminRoutes'
import { fetchGradesByTenant } from '../register/tenantActions'

export async function verifyAndCreateUser(phone: string, code: string, type: 'kid' | 'admin', pendingData: any) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms'
    })
    
    if (error) {
      console.error('OTP verification error:', error)
      throw new Error('Invalid or expired verification code. Please check and try again.')
    }
    
    if (!data.session) {
      throw new Error('Verification failed. Please try again.')
    }

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

      console.log('Creating user with data:', userData)
      const { data: user, error: userError } = await createUser(userData)
      if (userError) {
        console.error('User creation error:', userError)
        throw new Error(userError.message || 'Failed to create user')
      }
      if (!user) throw new Error('Failed to create user')
    } else {
      const userData = {
        name: pendingData.name,
        phone: pendingData.phone,
        age: parseInt(pendingData.age),
        gender: pendingData.gender as 'male' | 'female'
      }

      console.log('Creating admin user with data:', userData)
      const { data: user, error: userError } = await createAdminUser(userData)
      if (userError) {
        console.error('Admin user creation error:', userError)
        throw new Error(userError.message || 'Failed to create admin user')
      }
      if (!user) throw new Error('Failed to create admin user')

      const { data: gradeData } = await fetchGradesByTenant(pendingData.tenant)
      const selectedGrade = gradeData?.find((g: any) => g.id === pendingData.grade)
      if (!selectedGrade) throw new Error('Grade not found')

      const adminData = {
        user_id: user.id,
        grade: selectedGrade.grade_num,
        role: pendingData.role as 'admin' | 'superuser',
        tenant: pendingData.tenant
      }

      console.log('Creating admin record with data:', adminData)
      await handleAdminRegistration(adminData)
    }

    return { success: true }
  } catch (error: any) {
    console.error('verifyAndCreateUser error:', error)
    return { success: false, error: error.message || 'Verification failed' }
  }
}
