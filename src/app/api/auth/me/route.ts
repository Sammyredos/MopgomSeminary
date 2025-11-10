import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Determine if this is an admin or user based on the token type
    const userType = payload.type || 'admin' // Default to admin for backward compatibility

    let user
    if (userType === 'admin') {
      // Fetch admin user
      user = await prisma.admin.findUnique({
        where: { id: payload.adminId },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })
    } else {
      // Fetch regular user - tokens use adminId field for compatibility
      user = await prisma.user.findUnique({
        where: { id: payload.adminId },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })
    }

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }

    // Return user info with flattened permissions for easier access
    // Attempt to include courseDesired for student users from Registration
    let courseDesired: string | null = null
    try {
      if (userType === 'user' && user?.email) {
        const reg = await prisma.registration.findFirst({
          where: {
            OR: [
              { emailAddress: user.email },
              { emailAddress: user.email.toLowerCase() },
              { emailAddress: user.email.toUpperCase() }
            ]
          },
          select: { courseDesired: true }
        })
        courseDesired = reg?.courseDesired || null
      }
    } catch (e) {
      console.warn('/api/auth/me: unable to attach courseDesired', e)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        type: userType,
        role: user.role,
        permissions: user.role?.permissions?.map(p => p.name) || [],
        isActive: user.isActive,
        courseDesired
      }
    })

  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
