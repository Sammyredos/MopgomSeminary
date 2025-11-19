import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

interface JWTPayload {
  adminId: string
  email: string
  type?: 'admin' | 'user'
  iat?: number
  exp?: number
}

async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    return cookies['auth-token'] || null
  }
  return null
}

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
