import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-helpers'

// GET - Fetch all teachers with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check permissions - Allow all school staff to view teachers
    if (!['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager', 'Instructor', 'Librarian', 'Staff'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '1000')
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const department = searchParams.get('department') || ''
    const isActive = searchParams.get('isActive')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { teacherId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (department) {
      where.subject = { contains: department, mode: 'insensitive' }
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const skip = (page - 1) * limit

    // Fetch teachers with pagination
    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          teacherId: true,
          fullName: true,
          email: true,
          phone: true,
          subject: true,
          hireDate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.teacher.count({ where })
    ])

    return NextResponse.json({
      success: true,
      teachers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    )
  }
}