import { createClient } from '@/utils/supabase/server'

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
