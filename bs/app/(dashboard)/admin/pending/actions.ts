'use server'

import { getPendingRequestsForAdmin, approveAdminRequest, approveKidRequest } from '@/api/adminApi'
import { createClient } from '@/utils/supabase/server'

export async function fetchPendingRequests() {
  console.log('fetchPendingRequests called')
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log('Auth User:', user?.id, 'Phone:', user?.phone, 'Error:', userError)
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  // Try to find user by auth_id first
  let { data: userData } = await supabase
    .from('user')
    .select('id')
    .eq('auth_id', user.id)
    .single()
  
  // If not found by auth_id, try by phone number
  // if (!userData && user.phone) {
  //   // Try with + prefix first
  //   let phoneToSearch = user.phone.startsWith('+') ? user.phone : `+${user.phone}`
    
  //   console.log('Searching by phone:', phoneToSearch)
    
  //   const { data: userByPhone, error: phoneError } = await supabase
  //     .from('user')
  //     .select('id')
  //     .eq('phone_number', phoneToSearch)
  //     .single()
    
  //   console.log('User by phone:', userByPhone, 'Error:', phoneError)
    
  //   userData = userByPhone
    
  //   // Update auth_id for future use
  //   if (userData) {
  //     console.log('Updating auth_id for user:', userData.id)
  //     await supabase
  //       .from('user')
  //       .update({ auth_id: user.id })
  //       .eq('id', userData.id)
  //   }
  // }
  
  console.log('User data:', userData)
  
  if (!userData) {
    return { success: false, error: 'User not found' }
  }
  
  const { data, error } = await getPendingRequestsForAdmin(userData.id)
  
  console.log('Result:', data, 'Error:', error)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}

export async function handleApproveRequest(type: 'admin' | 'kid', id: string, approved: boolean) {
  if (type === 'admin') {
    const { error } = await approveAdminRequest(id, approved)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await approveKidRequest(id, approved)
    if (error) return { success: false, error: error.message }
  }
  
  return { success: true }
}
