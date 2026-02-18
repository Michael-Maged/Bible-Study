import { createClient } from '@/utils/supabase/server'

export async function getPendingRequestsForAdmin(adminUserId: string) {
  const supabase = await createClient()
  
  // Get admin details with grade info
  const { data: adminData, error: adminError } = await supabase
    .from('admin')
    .select('*, user!inner(*), grade!inner(*)')
    .eq('user_id', adminUserId)
    .single()
  
  console.log('Admin data:', adminData, 'Error:', adminError)
  
  if (!adminData) return { data: null, error: { message: 'Admin not found' } }
  
  const { tenant, role: adminRole } = adminData
  const adminGradeNum = adminData.grade.grade_num
  const isMixedGender = adminData.grade.gender === 'mix'
  
  console.log('Admin grade num:', adminGradeNum, 'Tenant:', tenant, 'Mixed gender:', isMixedGender)
  
  // Get pending superusers (only for admin role)
  let pendingSuperusers = []
  if (adminRole === 'admin') {
    const { data: superusers } = await supabase
      .from('admin')
      .select('*, user!inner(*), grade:grade!inner(*)')
      .eq('status', 'pending')
      .eq('role', 'superuser')
      .eq('tenant', tenant)
      .eq('grade', adminGradeNum)
    
    console.log('Superusers found:', superusers)
    
    if (superusers) {
      pendingSuperusers = isMixedGender 
        ? superusers
        : superusers.filter(s => s.user.gender === adminData.user.gender)
    }
  }
  
  // Get all classes with matching grade number
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id')
    .eq('grade', adminGradeNum)
  
  console.log('Classes found:', classes, 'Error:', classesError)
  
  if (!classes || classes.length === 0) {
    return { 
      data: { 
        superusers: pendingSuperusers,
        kids: [] 
      }, 
      error: null 
    }
  }
  
  const classIds = classes.map(c => c.id)
  console.log('Class IDs:', classIds)
  
  // Get pending enrollments in these classes
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollment')
    .select('*, user!inner(*), class:classes!inner(name, grade)')
    .eq('status', 'pending')
    .in('class', classIds)
  
  console.log('Enrollments found:', enrollments, 'Error:', enrollError)
  
  let pendingKids = enrollments || []
  
  // Filter by gender if not mixed
  if (!isMixedGender) {
    pendingKids = pendingKids.filter(e => e.user.gender === adminData.user.gender)
  }
  
  console.log('Final pending kids:', pendingKids.length)
  
  return { 
    data: { 
      superusers: pendingSuperusers,
      kids: pendingKids 
    }, 
    error: null 
  }
}

export async function approveAdminRequest(adminId: string, approved: boolean) {
  const supabase = await createClient()
  return await supabase
    .from('admin')
    .update({ status: approved ? 'accepted' : 'rejected' })
    .eq('id', adminId)
    .select()
    .single()
}

export async function approveKidRequest(enrollmentId: string, approved: boolean) {
  const supabase = await createClient()
  return await supabase
    .from('enrollment')
    .update({ status: approved ? 'accepted' : 'rejected' })
    .eq('id', enrollmentId)
    .select()
    .single()
}

export async function getPendingUsers() {
  const supabase = await createClient()
  return await supabase.from('user').select('*').eq('approved', false).eq('role', 'kid')
}

export async function approveUser(userId: string, approved: boolean) {
  const supabase = await createClient()
  return await supabase.from('user').update({ approved }).eq('id', userId).select().single()
}

export async function getAllUsersByRole(role: string) {
  const supabase = await createClient()
  return await supabase.from('user').select('*').eq('role', role)
}

export async function createAdmin(adminData: {
  user_id: string
  grade: number
  role: 'admin' | 'superuser'
  tenant: string
  status: 'pending' 
}) {
  const supabase = await createClient()
  return await supabase.from('admin').insert(adminData).select().single()
}
