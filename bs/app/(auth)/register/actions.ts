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
    
    // Send OTP first, don't create user yet
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({ 
      phone: formattedPhone,
      options: {
        channel: 'sms'
      }
    })
    
    if (error) {
      throw new Error(getUserFriendlyError(error.message))
    }
    
    // Return user data to be stored temporarily
    return { success: true, phone: formattedPhone, pendingData: userData }
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' }
  }
}
