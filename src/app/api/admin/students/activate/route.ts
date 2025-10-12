import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest, hasAnyRole } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
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

    if (student.isActive) {
      return NextResponse.json({ error: 'Student is already active' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: student.id },
      data: { isActive: true }
    })

    return NextResponse.json({ success: true, message: 'Student activated successfully' })
  } catch (error) {
    console.error('Activate student error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}