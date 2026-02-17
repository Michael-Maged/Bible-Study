'use server'

import { createClient } from '@/utils/supabase/server'

export async function sendLoginOtp(name: string, phone: string) {
  try {
    const supabase = await createClient()
    
    // Check if user exists with matching phone
    const { data: users, error: userError } = await supabase
      .from('user')
      .select('*, admin(*), enrollment(*)')
      .eq('phone_number', phone)
    
    if (userError || !users || users.length === 0) {
      return { success: false, error: 'Phone number not registered' }
    }
    
    // Find user with matching name (case-insensitive)
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase())
    
    if (!user) {
      return { success: false, error: 'Invalid name for this phone number' }
    }
    
    // Determine user role
    let userRole = 'kid'
    if (user.admin && user.admin.length > 0) {
      userRole = user.admin[0].role // admin or superuser
    }
    
    // Send OTP
    const { error } = await supabase.auth.signInWithOtp({ 
      phone,
      options: { channel: 'sms' }
    })
    
    if (error) {
      console.error('OTP Error:', JSON.stringify(error))
      return { success: false, error: error.message || 'Failed to send verification code' }
    }
    
    return { success: true, role: userRole, userName: user.name }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send code' }
  }
}

export async function verifyLoginOtp(phone: string, code: string, userName: string) {
  try {
    const supabase = await createClient()
    
    // Verify OTP - this creates the session
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms'
    })
    
    if (error || !data.session) {
      return { success: false, error: 'Invalid or expired code' }
    }
    
    // Get user details - match by phone AND name
    const { data: users, error: userError } = await supabase
      .from('user')
      .select('*, admin(*), enrollment(*)')
      .eq('phone_number', phone)
    
    if (userError || !users || users.length === 0) {
      return { success: false, error: 'User not found' }
    }
    
    // Find the specific user by name
    const user = users.find(u => u.name.toLowerCase() === userName.toLowerCase())
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    // Link auth.users to custom user table if not already linked
    if (!user.auth_id && data.user) {
      await supabase
        .from('user')
        .update({ auth_id: data.user.id })
        .eq('id', user.id)
    }
    
    // Determine role and check status
    let userRole = 'kid'
    let isPending = false
    
    if (user.admin && user.admin.length > 0) {
      userRole = user.admin[0].role
      isPending = user.admin[0].status === 'pending'
    } else if (user.enrollment && user.enrollment.length > 0) {
      isPending = user.enrollment[0].status === 'pending'
    }
    
    return { 
      success: true, 
      user: { 
        id: user.id, 
        name: user.name,
        role: userRole
      },
      isPending
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Verification failed' }
  }
}
