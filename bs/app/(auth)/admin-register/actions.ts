'use server'

import { createClient } from '@/utils/supabase/server'

export async function registerAdmin(formData: FormData) {
  const phone = '+2' + (formData.get('phone') as string)
  const name = formData.get('name') as string
  const age = formData.get('age') as string
  const gender = formData.get('gender') as string
  const role = formData.get('role') as string
  const tenant = formData.get('tenant') as string
  const grade = formData.get('grade') as string

  try {
    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone
    }
    
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({ 
      phone: formattedPhone,
      options: {
        channel: 'sms'
      }
    })
    
    if (error) throw new Error(error.message)
    
    return {
      success: true,
      phone: formattedPhone,
      pendingData: { name, phone: formattedPhone, age, gender, role, tenant, grade }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send verification code' }
  }
}
