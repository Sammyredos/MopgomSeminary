import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { authenticateRequest, hasAnyRole } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    // Verify admin requester
    const auth = await authenticateRequest(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const allowedRoles = ['Super Admin', 'Admin', 'School Administrator', 'Manager', 'Lecturer']
    if (!hasAnyRole(auth.user, allowedRoles)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const email = (body?.email || '').trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find target student
    const student = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.role || student.role.name !== 'Student') {
      return NextResponse.json({ error: 'Target user is not a student' }, { status: 400 })
    }

    if (!student.isActive) {
      return NextResponse.json({ error: 'Student account is inactive' }, { status: 400 })
    }

    // Sign a student token using the user id
    const token = signToken({
      adminId: student.id,
      email: student.email,
      type: 'user'
    })

    const response = NextResponse.json({
      success: true,
      message: 'Impersonation successful',
      redirectUrl: '/student/dashboard'
    })

    // Scope cookie to /student to avoid overriding admin session globally
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/student'
    })

    return response
  } catch (error) {
    console.error('Impersonate student error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}