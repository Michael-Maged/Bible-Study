import { createClient } from '@/utils/supabase/client'

export async function loginUser(phone: string, name: string) {
  const supabase = createClient()
  return await supabase.from('user').select('*').eq('phone', phone).eq('name', name).single()
}
