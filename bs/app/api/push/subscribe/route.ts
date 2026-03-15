import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function POST(req: NextRequest) {
  try {
    console.log('[subscribe] request received')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) { console.log('[subscribe] no auth header'); return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

    const token = authHeader.replace('Bearer ', '')
    const supabase = getAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    console.log('[subscribe] auth user:', user?.id, 'error:', authError?.message)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subscription } = await req.json()
    console.log('[subscribe] subscription received:', !!subscription)

    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('id, gender')
      .eq('auth_id', user.id)
      .single()
    console.log('[subscribe] userData:', userData?.id, 'error:', userError?.message)
    if (userError || !userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Try admin first, then kid enrollment
    const { data: adminData } = await supabase
      .from('admin')
      .select('grade, tenant')
      .eq('user_id', userData.id)
      .single()

    let grade: number | null = null
    let tenant: string | null = null
    let role = 'kid'

    if (adminData) {
      grade = adminData.grade
      tenant = adminData.tenant
      role = 'admin'
    } else {
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollment')
        .select('class')
        .eq('user_id', userData.id)
        .eq('status', 'accepted')
        .single()
      console.log('[subscribe] enrollment:', JSON.stringify(enrollment), 'error:', enrollError?.message)
      if (!enrollment?.class) return NextResponse.json({ error: 'No enrollment found' }, { status: 403 })

      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('grade')
        .eq('id', enrollment.class)
        .single()
      console.log('[subscribe] classData:', JSON.stringify(classData), 'error:', classError?.message)
      if (!classData) return NextResponse.json({ error: 'Class not found' }, { status: 403 })

      const { data: gradeData, error: gradeError } = await supabase
        .from('grade')
        .select('tenant')
        .eq('grade_num', classData.grade)
        .single()
      console.log('[subscribe] gradeData:', JSON.stringify(gradeData), 'error:', gradeError?.message)

      grade = classData.grade
      tenant = gradeData?.tenant ?? null
      console.log('[subscribe] grade:', grade, 'tenant:', tenant)
    }

    console.log('[subscribe] role:', role, 'grade:', grade, 'tenant:', tenant)

    const { error: upsertError } = await supabase.from('pushsubscriptions').upsert({
      user_id: userData.id,
      subscription: JSON.stringify(subscription),
      grade,
      tenant,
      gender: userData.gender,
      role,
    }, { onConflict: 'user_id' })
    console.log('[subscribe] upsert error:', upsertError?.message)

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

    console.log('[subscribe] success')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[subscribe] exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
