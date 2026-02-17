'use server'

import { createClient } from '@/utils/supabase/server'

function getUserFriendlyError(error: string): string {
  if (error.includes('Invalid phone number')) {
    return 'Please enter a valid phone number with country code (e.g., +201234567890)'
  }
  if (error.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes before trying again.'
  }
  if (error.includes('SMS')) {
    return 'Unable to send verification code. Please check your phone number and try again.'
  }
  if (error.includes('network') || error.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.'
  }
  return 'Something went wrong. Please try again or contact support if the problem persists.'
}

export async function registerKid(formData: FormData) {
  const userData = {
    name: formData.get('name') as string,
    phone: '+2' + (formData.get('phone') as string),
    age: parseInt(formData.get('age') as string),
    gender: formData.get('gender') as 'male' | 'female',
    tenantId: formData.get('tenant') as string,
    gradeId: formData.get('grade') as string,
    classId: formData.get('class') as string
  }

  try {
    // Format phone number
    let formattedPhone = userData.phone.trim()
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone
    }
    
    // Generate unique email from phone + name
    const uniqueEmail = `${formattedPhone.replace(/\+/g, '')}.${userData.name.toLowerCase().replace(/\s+/g, '')}@biblestudy.app`
    
    const supabase = await createClient()
    // Sign up with email to create auth.users row
    const { error: signUpError } = await supabase.auth.signUp({
      email: uniqueEmail,
      password: Math.random().toString(36),
      options: {
        emailRedirectTo: undefined,
        data: { phone: formattedPhone }
      }
    })
    
    if (signUpError) {
      console.error('SignUp Error:', signUpError)
      throw new Error(getUserFriendlyError(signUpError.message))
    }
    
    // Send OTP to phone
    const { error: otpError } = await supabase.auth.signInWithOtp({ 
      phone: formattedPhone,
      options: { channel: 'sms' }
    })
    
    if (otpError) {
      console.error('OTP Error:', otpError)
      throw new Error(getUserFriendlyError(otpError.message))
    }
    
    // Return user data to be stored temporarily
    return { success: true, phone: formattedPhone, pendingData: { ...userData, phone: formattedPhone, email: uniqueEmail } }
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' }
  }
}
