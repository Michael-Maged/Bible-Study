import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { handleUserRegistration } from '@/routes/userRoutes'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('user')
      .select('*, admin(*), enrollment(*)')
      .eq('auth_id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const grade = user.admin?.[0]?.grade || user.enrollment?.[0]?.grade || null
    const tenant = user.admin?.[0]?.tenant || user.enrollment?.[0]?.tenant || null

    return NextResponse.json({ grade, tenant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userData = await req.json()
    const user = await handleUserRegistration(userData)
    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
