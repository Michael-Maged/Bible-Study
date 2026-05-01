'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { sendNewRegistrationNotification } from '@/utils/pushNotify'

const getAnonClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function createUser(userData: {
  name: string; email?: string; age: number; gender: string
  tenantId?: string; gradeId?: string; classId?: string; auth_id?: string
}) {
  const supabaseAdmin = createAdminClient()
  const { data: user, error: userError } = await supabaseAdmin
    .from('user')
    .insert({ name: userData.name, email: userData.email, age: userData.age, gender: userData.gender, auth_id: userData.auth_id })
    .select()
    .single()
  if (userError || !user) return { data: null, error: userError }

  const { error: enrollError } = await supabaseAdmin
    .from('enrollment')
    .insert({ user_id: user.id, class: userData.classId, status: 'pending' })
  if (enrollError) return { data: null, error: enrollError }

  return { data: user, error: null }
}

export async function registerKidWithEmail(formData: FormData) {
  const userData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    age: parseInt(formData.get('age') as string),
    gender: formData.get('gender') as 'male' | 'female',
    tenantId: formData.get('tenant') as string,
    gradeId: formData.get('grade') as string,
    classId: formData.get('class') as string
  }

  try {
    const supabaseAdmin = createAdminClient()
    
    const { data, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { name: userData.name }
    })
    
    if (signUpError || !data.user) {
      return { success: false, error: signUpError?.message || 'Registration failed' }
    }
    
    const { error: userError } = await createUser({
      name: userData.name,
      email: userData.email,
      age: userData.age,
      gender: userData.gender,
      tenantId: userData.tenantId,
      gradeId: userData.gradeId,
      classId: userData.classId,
      auth_id: data.user.id
    })
    
    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      return { success: false, error: userError.message }
    }

    // Fetch grade_num to notify matching admins
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: classData } = await supabaseAnon
      .from('classes')
      .select('grade')
      .eq('id', userData.classId)
      .single()

    if (classData) {
      const ageGroup = userData.age < 10 ? 'Under 10' : userData.age < 13 ? '10–12' : '13+'
      await sendNewRegistrationNotification({
        kidName: userData.name,
        ageGroup,
        grade: classData.grade,
        tenant: userData.tenantId,
        gender: userData.gender,
      })
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Registration failed' }
  }
}

export async function registerAdminWithEmail(formData: FormData) {
  const userData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    age: parseInt(formData.get('age') as string),
    gender: formData.get('gender') as 'male' | 'female',
    tenant: formData.get('tenant') as string,
    grade: formData.get('grade') as string,
    role: formData.get('role') as 'admin' | 'superuser'
  }

  try {
    const supabaseAdmin = createAdminClient()
    const supabaseAnon = getAnonClient()
    
    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    if (existingUser?.users.some(u => u.email === userData.email)) {
      return { success: false, error: 'Email already registered' }
    }
    
    // Use anon client for grade lookup (has RLS access)
    const { data: gradeData, error: gradeError } = await supabaseAnon
      .from('grade')
      .select('grade_num')
      .eq('id', userData.grade)
      .single()
    
    if (gradeError || !gradeData) {
      return { success: false, error: 'Grade not found' }
    }
    
    const { data, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { name: userData.name }
    })
    
    if (signUpError || !data.user) {
      return { success: false, error: signUpError?.message || 'Registration failed' }
    }
    
    const { data: user, error: userError } = await supabaseAdmin
      .from('user')
      .insert({
        name: userData.name,
        email: userData.email,
        age: userData.age,
        gender: userData.gender,
        auth_id: data.user.id
      })
      .select()
      .single()
    
    if (userError || !user) {
      // Rollback: delete auth user if custom user creation fails
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      return { success: false, error: `Failed to create user: ${userError?.message}` }
    }
    
    const { error: adminError } = await supabaseAdmin
      .from('admin')
      .insert({
        user_id: user.id,
        grade: gradeData.grade_num,
        role: userData.role,
        tenant: userData.tenant,
        status: 'pending'
      })
    
    if (adminError) {
      // Rollback: delete user and auth user if admin creation fails
      await supabaseAdmin.from('user').delete().eq('id', user.id)
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      return { success: false, error: `Failed to create admin: ${adminError.message}` }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Registration failed' }
  }
}
