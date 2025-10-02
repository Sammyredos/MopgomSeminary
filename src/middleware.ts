import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge, getTokenFromRequest } from '@/lib/auth-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Token extraction is now handled by the imported function

  // Protect admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && pathname !== '/admin/signup') {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const admin = await verifyTokenEdge(token)
    if (!admin) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // SECURITY FIX: Check if user type is admin
    if (admin.type !== 'admin') {
      // User is not an admin (e.g., student with type 'user'), deny access
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect logged-in admins away from login page
  if (pathname === '/admin/login') {
    const token = getTokenFromRequest(request)
    if (token) {
      const payload = await verifyTokenEdge(token)
      if (payload && payload.type === 'admin') {
        // Already logged in as admin, redirect to dashboard
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }
  }

  // Continue with the request
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}
