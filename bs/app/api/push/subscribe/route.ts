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

    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('grade, tenant, status')
      .eq('user_id', userData.id)
      .single()
    console.log('[subscribe] adminData:', adminData, 'error:', adminError?.message)
    if (adminError || !adminData) return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

    const { error: upsertError } = await supabase.from('pushsubscriptions').upsert({
      user_id: userData.id,
      subscription: JSON.stringify(subscription),
      grade: adminData.grade,
      tenant: adminData.tenant,
      gender: userData.gender,
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
