import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getSession()

  return (
    <main>
      <h1>Bible Study</h1>
      <p>Welcome to your Bible study app.</p>
      {error ? (
        <p>❌ Connection failed: {error.message}</p>
      ) : (
        <p>✅ Supabase is connected and working!</p>
      )}
    </main>
  )
}

