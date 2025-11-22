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

    let student: any = null
    try {
      student = await prisma.user.findUnique({
        where: { email },
        include: { role: true }
      })
    } catch (err: any) {
      if (err && err.code === 'P2022') {
        student = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            role: { select: { id: true, name: true, description: true, isSystem: true } }
          }
        })
      } else {
        throw err
      }
    }

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (!student.role || student.role.name !== 'Student') {
      return NextResponse.json({ error: 'Target user is not a student' }, { status: 400 })
    }

    if (student.isPaid) {
      return NextResponse.json({ error: 'Student is already marked as paid' }, { status: 400 })
    }

    try {
      await prisma.user.update({
        where: { id: student.id },
        data: ({ isPaid: true } as any)
      })
    } catch (err: any) {
      if (err && err.code === 'P2022') {
        return NextResponse.json({ error: 'Payment status column missing in database. Please run migrations.' }, { status: 500 })
      }
      throw err
    }

    return NextResponse.json({ success: true, message: 'Student marked as paid successfully' })
  } catch (error) {
    console.error('Mark paid error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}