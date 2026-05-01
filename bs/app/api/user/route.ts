import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: user } = await supabase
      .from('user')
      .select('*, admin(*), enrollment(*, class:classes!enrollment_class_fkey(*, grade:grade!class_grade_fkey(*)))')
      .eq('auth_id', authUser.id)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const grade = user.admin?.[0]?.grade || user.enrollment?.[0]?.class?.grade?.id || null
    const tenant = user.admin?.[0]?.tenant || user.enrollment?.[0]?.tenant || null

    return NextResponse.json({ grade, tenant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userData = await req.json()
    const supabaseAdmin = createAdminClient()

    const { data: user, error: userError } = await supabaseAdmin
      .from('user')
      .insert({
        name: userData.name,
        email: userData.email,
        age: userData.age,
        gender: userData.gender,
        auth_id: userData.auth_id
      })
      .select()
      .single()

    if (userError || !user) throw new Error(userError?.message || 'Failed to create user')

    if (userData.classId) {
      const { error: enrollError } = await supabaseAdmin
        .from('enrollment')
        .insert({ user_id: user.id, class: userData.classId, status: 'pending' })
      if (enrollError) throw new Error(enrollError.message)
    }

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
