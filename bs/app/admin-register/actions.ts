'use server'

import { handleAdminRegistration } from '@/features/admin/routes/adminRoutes'

export async function registerAdmin(formData: FormData) {
  const adminData = {
    user_id: formData.get('user_id') as string,
    grade: parseInt(formData.get('grade') as string),
    role: formData.get('role') as 'admin' | 'superuser',
    tenant: formData.get('tenant') as string
  }

  try {
    await handleAdminRegistration(adminData)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' }
  }
}
