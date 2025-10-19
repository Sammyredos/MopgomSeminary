import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-helpers'

// GET - Fetch all students with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check permissions - Allow all school staff to view students
    if (!['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager', 'Instructor', 'Librarian', 'Staff'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '1000')
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const grade = searchParams.get('grade') || ''
    const academicYear = searchParams.get('academicYear') || ''
    const isActive = searchParams.get('isActive')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
        { emailAddress: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (grade) {
      where.grade = grade
    }

    if (academicYear) {
      where.academicYear = academicYear
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const skip = (page - 1) * limit

    // Fetch students with pagination
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          studentId: true,
          fullName: true,
          emailAddress: true,
          phoneNumber: true,
          dateOfBirth: true,
          grade: true,
          academicYear: true,
          graduationYear: true,
          enrollmentDate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              grades: true,
              classSectionParticipants: true
            }
          }
        }
      }),
      prisma.student.count({ where })
    ])

    return NextResponse.json({
      success: true,
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}