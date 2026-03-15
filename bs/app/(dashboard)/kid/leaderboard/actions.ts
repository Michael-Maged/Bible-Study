'use server'

import { createClient } from '@/utils/supabase/server'

export async function getLeaderboard() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return { success: false, error: 'Not authenticated', data: [] }
    }

    const { data: currentUser } = await supabase
      .from('user')
      .select('gender, enrollment(class)')
      .eq('auth_id', authUser.id)
      .single()

    if (!currentUser?.enrollment?.[0]?.class) {
      return { success: false, error: 'Class not found', data: [] }
    }

    const classId = currentUser.enrollment[0].class

    const { data: classData } = await supabase
      .from('classes')
      .select('grade')
      .eq('id', classId)
      .single()

    if (!classData?.grade) {
      return { success: false, error: 'Grade not found', data: [] }
    }

    const { data: gradeData } = await supabase
      .from('grade')
      .select('gender')
      .eq('grade_num', classData.grade)
      .single()

    const classGender = gradeData?.gender
    const userGender = currentUser.gender

    const { data: enrollments } = await supabase
      .from('enrollment')
      .select('user_id')
      .eq('class', classId)

    const userIds = enrollments?.map(e => e.user_id) || []

    let query = supabase
      .from('user')
      .select('id, name, current_score, gender')
      .in('id', userIds)
      .order('current_score', { ascending: false })
      .limit(50)

    if (classGender !== 'mixed') {
      query = query.eq('gender', userGender)
    }

    const { data: users, error } = await query

    if (error) throw error

    return { success: true, data: users || [] }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: [] }
  }
}

export async function getCurrentUserRank() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('user')
      .select('id, name, current_score, gender, enrollment(class)')
      .eq('auth_id', authUser.id)
      .single()

    if (!user?.enrollment?.[0]?.class) {
      return { success: false, error: 'Class not found' }
    }

    const { data: classData } = await supabase
      .from('classes')
      .select('grade')
      .eq('id', user.enrollment[0].class)
      .single()

    if (!classData?.grade) {
      return { success: false, error: 'Grade not found' }
    }

    const { data: gradeData } = await supabase
      .from('grade')
      .select('gender')
      .eq('grade_num', classData.grade)
      .single()

    const classGender = gradeData?.gender

    const { data: enrollments } = await supabase
      .from('enrollment')
      .select('user_id')
      .eq('class', user.enrollment[0].class)

    const userIds = enrollments?.map(e => e.user_id) || []

    let countQuery = supabase
      .from('user')
      .select('*', { count: 'exact', head: true })
      .in('id', userIds)
      .gt('current_score', user.current_score)

    if (classGender !== 'mixed') {
      countQuery = countQuery.eq('gender', user.gender)
    }

    const { count } = await countQuery

    const rank = (count || 0) + 1

    return { 
      success: true, 
      data: { 
        name: user.name, 
        score: user.current_score, 
        rank 
      } 
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
