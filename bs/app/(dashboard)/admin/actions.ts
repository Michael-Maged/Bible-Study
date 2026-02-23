'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getDashboardStats() {
  try {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const userRole = cookieStore.get('user-role')?.value
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get current user's admin record
    const { data: currentUser } = await supabase
      .from('user')
      .select('*, admin(*)')
      .eq('auth_id', user.id)
      .single()
    
    if (!currentUser || !currentUser.admin || currentUser.admin.length === 0) {
      return { success: false, error: 'Admin record not found' }
    }
    
    const adminRecord = currentUser.admin[0]
    
    if (userRole === 'admin') {
      // Admin sees: superusers + kids from their grade/tenant
      const { data: pendingSuperusers, error: superuserError } = await supabase
        .from('admin')
        .select('*, user(*)')
        .eq('role', 'superuser')
        .eq('status', 'pending')
        .eq('grade', adminRecord.grade)
        .eq('tenant', adminRecord.tenant)
      
      const { data: pendingKids, error: kidsError } = await supabase
        .from('enrollment')
        .select('*, user(*), class:classes(grade)')
        .eq('status', 'pending')
      
      const filteredKids = (pendingKids || []).filter(enrollment => {
        return enrollment.class?.grade === adminRecord.grade
      })
      
      const { data: acceptedSuperusers } = await supabase
        .from('admin')
        .select('id')
        .eq('role', 'superuser')
        .eq('status', 'accepted')
        .eq('grade', adminRecord.grade)
        .eq('tenant', adminRecord.tenant)
      
      const { data: acceptedKids } = await supabase
        .from('enrollment')
        .select('*, class:classes(grade)')
        .eq('status', 'accepted')
      
      const filteredAcceptedKids = (acceptedKids || []).filter(enrollment => {
        return enrollment.class?.grade === adminRecord.grade
      })
      
      return {
        success: true,
        data: {
          totalUsers: (acceptedSuperusers?.length || 0) + (filteredAcceptedKids?.length || 0),
          pendingCount: (pendingSuperusers?.length || 0) + filteredKids.length
        }
      }
    } else {
      // Superuser sees: only kids from their grade/tenant
      const { data: pendingKids } = await supabase
        .from('enrollment')
        .select('*, user(*), class:classes(grade)')
        .eq('status', 'pending')
      
      const filteredKids = (pendingKids || []).filter(enrollment => {
        return enrollment.class?.grade === adminRecord.grade
      })
      
      const { data: acceptedKids } = await supabase
        .from('enrollment')
        .select('*, class:classes(grade)')
        .eq('status', 'accepted')
      
      const filteredAcceptedKids = (acceptedKids || []).filter(enrollment => {
        return enrollment.class?.grade === adminRecord.grade
      })
      
      return {
        success: true,
        data: {
          totalUsers: filteredAcceptedKids?.length || 0,
          pendingCount: filteredKids.length
        }
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
