import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/register', '/admin-register', '/verify-phone']
  const alwaysAccessible = ['/test-otp']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const isAlwaysAccessible = alwaysAccessible.some(path => pathname.startsWith(path))

  if (!token && !isPublicPath && !isAlwaysAccessible) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
