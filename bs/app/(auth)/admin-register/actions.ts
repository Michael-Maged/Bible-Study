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
    
    // Generate unique email from phone + name
    const uniqueEmail = `${formattedPhone.replace(/\+/g, '')}.${name.toLowerCase().replace(/\s+/g, '')}@biblestudy.app`
    
    const supabase = await createClient()
    // Sign up with email but send OTP to phone
    const { error: signUpError } = await supabase.auth.signUp({
      email: uniqueEmail,
      password: Math.random().toString(36),
      options: {
        emailRedirectTo: undefined // Disable email confirmation
      }
    })
    
    if (signUpError) throw new Error(signUpError.message)
    
    // Send OTP to phone
    const { error: otpError } = await supabase.auth.signInWithOtp({ 
      phone: formattedPhone,
      options: { channel: 'sms' }
    })
    
    if (otpError) throw new Error(otpError.message)
    
    return {
      success: true,
      phone: formattedPhone,
      pendingData: { name, phone: formattedPhone, age, gender, role, tenant, grade, email: uniqueEmail }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send verification code' }
  }
}
