import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const publicPaths = ['/login', '/register', '/admin-register', '/verify-phone', '/pending']
  const alwaysAccessible = ['/test-otp']
  const adminPaths = ['/admin']
  const kidPaths = ['/dashboard', '/classes', '/profile']
  
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const isAlwaysAccessible = alwaysAccessible.some(path => pathname.startsWith(path))
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  const isKidPath = kidPaths.some(path => pathname.startsWith(path))

  // Allow public paths without any checks
  if (isPublicPath || isAlwaysAccessible) {
    return NextResponse.next()
  }

  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  // Refresh session if it exists
  if (session) {
    await supabase.auth.getUser()
  }
  
  const userRole = request.cookies.get('user-role')?.value

  // Protect non-public routes - redirect to login if no session
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Protect admin routes - only admin and superuser can access
  if (isAdminPath && (userRole !== 'admin' && userRole !== 'superuser')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Protect kid routes - kids cannot access admin routes
  if (isKidPath && (userRole === 'admin' || userRole === 'superuser')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.png|.*\\.svg).*)']
}
