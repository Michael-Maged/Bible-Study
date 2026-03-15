'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAdminLeaderboard() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) return { success: false, error: 'Not authenticated', data: [] }

    const { data: userData } = await supabase
      .from('user')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()

    if (!userData) return { success: false, error: 'User not found', data: [] }

    const { data: adminData } = await supabase
      .from('admin')
      .select('*, user!inner(*), grade!inner(*)')
      .eq('user_id', userData.id)
      .single()

    if (!adminData) return { success: false, error: 'Admin not found', data: [] }

    const adminGradeNum = adminData.grade.grade_num
    const isMixed = adminData.grade.gender === 'mix' || adminData.grade.gender === 'mixed'
    const adminGender = adminData.user.gender

    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .eq('grade', adminGradeNum)

    if (!classes?.length) return { success: true, data: [] }

    const classIds = classes.map(c => c.id)

    const { data: enrollments } = await supabase
      .from('enrollment')
      .select('user_id')
      .in('class', classIds)

    const userIds = enrollments?.map(e => e.user_id) || []
    if (!userIds.length) return { success: true, data: [] }

    let query = supabase
      .from('user')
      .select('id, name, current_score, gender')
      .in('id', userIds)
      .order('current_score', { ascending: false })
      .limit(50)

    if (!isMixed) {
      query = query.eq('gender', adminGender)
    }

    const { data: users, error } = await query
    if (error) throw error

    return { success: true, data: users || [] }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: [] }
  }
}
