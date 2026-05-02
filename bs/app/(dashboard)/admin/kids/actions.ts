'use server'

import { revalidatePath } from 'next/cache'
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
  const supabaseAdmin = createAdminClient()

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
    const { data, error } = await supabaseAdmin
      .from('enrollment')
      .select('*, user(*), class:classes!enrollment_class_fkey(id, name, grade, gradeInfo:grade!class_grade_fkey(tenant))')
      .eq('id', id)
      .single()

    if (error || !data) {
      return { success: false, error: 'Request not found' }
    }

    return { success: true, data: { ...data, type: 'kid' } }
  }
}

export async function getTenants() {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('tenant')
    .select('id, name')
    .order('name')
  if (error) return { success: false as const, error: error.message, data: [] as { id: string; name: string }[] }
  return { success: true as const, data: data || [] }
}

export async function getGradesByTenant(tenantId: string) {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('grade')
    .select('id, grade_num, name, gender')
    .eq('tenant', tenantId)
    .order('grade_num')
  if (error) return { success: false as const, error: error.message, data: [] as { id: string; grade_num: number; name: string; gender: string }[] }
  return { success: true as const, data: data || [] }
}

export async function getClassesByGrade(gradeNum: number) {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('id, name')
    .eq('grade', gradeNum)
    .order('name')
  if (error) return { success: false as const, error: error.message, data: [] as { id: string; name: string }[] }
  return { success: true as const, data: data || [] }
}

export async function transferKid(enrollmentId: string, newClassId: string) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return { success: false as const, error: 'Not authenticated' }

  const { data: userData } = await supabaseAdmin
    .from('user')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()

  if (!userData) return { success: false as const, error: 'User not found' }

  const { data: adminData } = await supabaseAdmin
    .from('admin')
    .select('id')
    .eq('user_id', userData.id)
    .single()

  if (!adminData) return { success: false as const, error: 'Not authorized' }

  const { data: enrollment, error: enrollError } = await supabaseAdmin
    .from('enrollment')
    .select('class')
    .eq('id', enrollmentId)
    .single()

  if (enrollError || !enrollment) return { success: false as const, error: enrollError?.message || 'Enrollment not found' }

  const [currentClassResult, newClassResult] = await Promise.all([
    supabaseAdmin
      .from('classes')
      .select('grade, gradeInfo:grade!class_grade_fkey(tenant)')
      .eq('id', enrollment.class)
      .single(),
    supabaseAdmin
      .from('classes')
      .select('grade, gradeInfo:grade!class_grade_fkey(tenant)')
      .eq('id', newClassId)
      .single(),
  ])

  if (currentClassResult.error || newClassResult.error || !currentClassResult.data || !newClassResult.data) {
    return { success: false as const, error: 'Class not found' }
  }
  const currentClass = currentClassResult.data
  const newClass = newClassResult.data

  const currentGradeInfo = currentClass.gradeInfo as unknown as { tenant: string } | null
  const newGradeInfo = newClass.gradeInfo as unknown as { tenant: string } | null

  const sameContext =
    currentClass.grade === newClass.grade &&
    currentGradeInfo?.tenant === newGradeInfo?.tenant

  const newStatus = sameContext ? 'accepted' : 'transferred'

  const { error: updateError } = await supabaseAdmin
    .from('enrollment')
    .update({ class: newClassId, status: newStatus })
    .eq('id', enrollmentId)

  if (updateError) return { success: false as const, error: updateError.message }

  revalidatePath('/admin/kids')
  revalidatePath('/admin/kids/kid/[id]', 'page')
  return { success: true as const, newStatus }
}
