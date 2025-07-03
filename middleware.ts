import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Define public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/reset-password']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Define protected routes that require authentication
  const protectedRoutes = ['/feed', '/profile', '/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/auth/signin', req.url)
    redirectUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth pages, redirect to feed
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/feed', req.url))
  }

  // If user is authenticated and visiting root, redirect to feed
  if (session && pathname === '/') {
    return NextResponse.redirect(new URL('/feed', req.url))
  }

  // If user is not authenticated and visiting root, redirect to signin
  if (!session && pathname === '/') {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  return res
}

export const config = {
  matcher: [
    // Match all routes except API routes, static files, and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}