'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const getClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function createUser(userData: any) {
  const supabase = getAdminClient()
  
  const { data: user, error: userError } = await supabase.from('user').insert({
    name: userData.name,
    age: userData.age,
    gender: userData.gender,
    phone_number: userData.phone,
    status: 'inprogress'
  }).select().single()
  
  if (userError || !user) return { data: null, error: userError }
  
  if (userData.classId) {
    await supabase.from('enrollment').insert({
      user_id: user.id,
      class: userData.classId
    })
  }
  
  return { data: user, error: null }
}

export async function getUsers() {
  const supabase = getClient()
  return await supabase.from('user').select('*')
}

export async function getUserById(id: string) {
  const supabase = getClient()
  return await supabase.from('user').select('*').eq('id', id).single()
}

export async function updateUser(id: string, updates: any) {
  const supabase = getClient()
  return await supabase.from('user').update(updates).eq('id', id).select().single()
}

export async function deleteUser(id: string) {
  const supabase = getClient()
  return await supabase.from('user').delete().eq('id', id)
}
