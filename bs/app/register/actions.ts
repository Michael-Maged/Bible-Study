'use server'

import { handleUserRegistration } from '@/routes/userRoutes'

export async function registerKid(formData: FormData) {
  const userData = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    age: parseInt(formData.get('age') as string),
    gender: formData.get('gender') as 'male' | 'female',
    tenantId: formData.get('tenant') as string,
    gradeId: formData.get('grade') as string,
    classId: formData.get('class') as string
  }

  try {
    await handleUserRegistration(userData)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' }
  }
}
