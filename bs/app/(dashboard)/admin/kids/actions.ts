'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function fetchAssignedKids() {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: userData } = await supabaseAdmin
    .from('user')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!userData) return { success: false, error: 'User not found' }

  const { data: adminData } = await supabaseAdmin
    .from('admin')
    .select('*, user(*), grade:grade!admin_grade_fkey(*)')
    .eq('user_id', userData.id)
    .single()

  if (!adminData) return { success: false, error: 'Admin not found' }

  const { tenant } = adminData
  const adminGradeNum = adminData.grade?.grade_num
  const isMixedGender = adminData.grade?.gender === 'mix' || adminData.grade?.gender === 'mixed'

  const { data: superuserData } = await supabaseAdmin
    .from('admin')
    .select('*, user(*), grade:grade!admin_grade_fkey(*)')
    .eq('role', 'superuser')
    .eq('tenant', tenant)
    .eq('grade', adminGradeNum)

  const superusers = superuserData
    ? (isMixedGender ? superuserData : superuserData.filter(s => s.user?.gender === adminData.user?.gender))
    : []

  const { data: classes } = await supabaseAdmin
    .from('classes')
    .select('id')
    .eq('grade', adminGradeNum)

  if (!classes?.length) {
    return { success: true, data: { superusers, kids: [] } }
  }

  const { data: enrollments } = await supabaseAdmin
    .from('enrollment')
    .select('*, class:classes!enrollment_class_fkey(name, grade)')
    .in('class', classes.map(c => c.id))

  if (!enrollments?.length) {
    return { success: true, data: { superusers, kids: [] } }
  }

  const userIds = enrollments.map(e => e.user_id)
  const { data: users } = await supabaseAdmin
    .from('user')
    .select('*')
    .in('id', userIds)

  const usersById = Object.fromEntries((users || []).map(u => [u.id, u]))
  let kids = enrollments.map(e => ({ ...e, user: usersById[e.user_id] || null }))

  if (!isMixedGender) {
    kids = kids.filter(e => e.user?.gender === adminData.user?.gender)
  }

  return { success: true, data: { superusers, kids } }
}

export async function handleApproveRequest(type: 'admin' | 'kid', id: string, approved: boolean) {
  const supabase = await createClient()
  const status = approved ? 'accepted' : 'rejected'
  if (type === 'admin') {
    const { error } = await supabase.from('admin').update({ status }).eq('id', id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('enrollment').update({ status }).eq('id', id)
    if (error) return { success: false, error: error.message }
  }
  return { success: true }
}

export async function getRequestDetails(type: 'admin' | 'kid', id: string) {
  const supabase = await createClient()
  
  if (type === 'admin') {
    const { data, error } = await supabase
      .from('admin')
      .select('*, user(*), grade:grade!admin_grade_fkey(*)')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return { success: false, error: 'Request not found' }
    }
    
    return { success: true, data: { ...data, type: 'admin' } }
  } else {
    const { data, error } = await supabase
      .from('enrollment')
      .select('*, user(*), class:classes!enrollment_class_fkey(*)')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return { success: false, error: 'Request not found' }
    }
    
    return { success: true, data: { ...data, type: 'kid' } }
  }
}
