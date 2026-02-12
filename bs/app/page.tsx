
import { createClient } from '@/utils/supabase/server'
import RegisterPage from './register/RegisterPage'

export default async function Page() {
  const supabase = await createClient()

  const { data: todos } = await supabase.from('todos').select()

  return (
    <main>
      <RegisterPage></RegisterPage>
    </main>
  )
}
