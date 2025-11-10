import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    // Only allow students
    if (auth.user.role?.name !== 'Student') {
      return NextResponse.json({ error: 'Access denied. Students only.' }, { status: 403 })
    }

    // Find the student record by email (case-insensitive fallbacks)
    const email = auth.user.email
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { emailAddress: email },
          { emailAddress: email?.toLowerCase() || '' },
          { emailAddress: email?.toUpperCase() || '' },
        ]
      },
      select: { id: true }
    })

    if (!student) {
      return NextResponse.json({ enrolledSubjectsCount: 0 })
    }

    // Count active course allocations for the student
    const count = await prisma.courseAllocation.count({
      where: { studentId: student.id, isActive: true }
    })

    return NextResponse.json({ enrolledSubjectsCount: count })
  } catch (error) {
    console.error('Error fetching student enrollments:', error)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}