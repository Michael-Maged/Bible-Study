import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    // Password reset flow: exchange code then redirect to reset page with session established
    if (!error && data.session && next) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    if (error || !data.session) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const { data: user, error: userError } = await supabase
      .from('user')
      .select('*, admin(*), enrollment(*)')
      .eq('auth_id', data.user.id)
      .single()

    if (userError || !user) {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) console.error('signOut error (not_registered):', signOutError.message)
      return NextResponse.redirect(`${origin}/login?error=not_registered`)
    }

    let userRole = 'kid'
    let isPending = false

    if (user.admin && user.admin.length > 0) {
      userRole = user.admin[0].role
      isPending = user.admin[0].status === 'pending'
    } else if (user.enrollment && user.enrollment.length > 0) {
      isPending = user.enrollment[0].status === 'pending'
    }

    if (isPending) {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) console.error('signOut error (pending):', signOutError.message)
      return NextResponse.redirect(`${origin}/pending`)
    }

    const cookieStore = await cookies()
    cookieStore.set('user-role', userRole, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    const redirectTo = userRole === 'admin' || userRole === 'superuser' ? '/admin' : '/kid/dashboard'
    return NextResponse.redirect(`${origin}${redirectTo}`)
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }
}
