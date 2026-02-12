import { createClient } from '@/utils/supabase/server'

export async function loginUser(phone: string, name: string) {
  const supabase = await createClient()
  return await supabase.from('user').select('*').eq('phone', phone).eq('name', name).single()
}

export async function verifyApproval(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('user').select('approved').eq('id', userId).single()
  return data?.approved || false
}
