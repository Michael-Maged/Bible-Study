import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const supabase = getAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subscription } = await req.json()

    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('id, gender')
      .eq('auth_id', user.id)
      .single()
    if (userError || !userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let grade: number | null = null
    let tenant: string | null = null
    let role = 'kid'

    const { data: adminData } = await supabase
      .from('admin')
      .select('grade, tenant')
      .eq('user_id', userData.id)
      .single()

    if (adminData) {
      grade = adminData.grade
      tenant = adminData.tenant
      role = 'admin'
    } else {
      const { data: enrollment } = await supabase
        .from('enrollment')
        .select('class')
        .eq('user_id', userData.id)
        .eq('status', 'accepted')
        .single()
      if (!enrollment?.class) return NextResponse.json({ error: 'No enrollment found' }, { status: 403 })

      const { data: classData } = await supabase
        .from('classes')
        .select('grade')
        .eq('id', enrollment.class)
        .single()
      if (!classData) return NextResponse.json({ error: 'Class not found' }, { status: 403 })

      const { data: gradeData } = await supabase
        .from('grade')
        .select('tenant')
        .eq('grade_num', classData.grade)
        .single()

      grade = classData.grade
      tenant = gradeData?.tenant ?? null
    }

    const { error: upsertError } = await supabase.from('pushsubscriptions').upsert({
      user_id: userData.id,
      subscription: JSON.stringify(subscription),
      grade,
      tenant,
      gender: userData.gender,
      role,
    }, { onConflict: 'user_id' })

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
