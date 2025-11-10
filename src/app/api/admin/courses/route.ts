import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest, hasAnyRole } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    // Only admin roles can view courses
    const allowedRoles = ['Super Admin', 'Admin', 'School Administrator', 'Manager', 'Lecturer']
    if (!hasAnyRole(auth.user, allowedRoles)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const activeParam = searchParams.get('active');

    // Support tri-state active filter:
    // active=true  -> isActive: true
    // active=false -> isActive: false
    // active missing -> no filter (return all)
    const activeFilter =
      activeParam === 'true'
        ? { isActive: true }
        : activeParam === 'false'
          ? { isActive: false }
          : {};

    const courses = await prisma.course.findMany({
      where: {
        AND: [
          activeFilter,
          search
            ? {
                OR: [
                  { courseName: { contains: search } },
                  { courseCode: { contains: search } },
                  { subjectArea: { contains: search } },
                ],
              }
            : {},
        ],
      },
      orderBy: { courseName: 'asc' },
      select: {
        id: true,
        courseCode: true,
        courseName: true,
        subjectArea: true,
        instructor: true,
        description: true,
        isActive: true,
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    // Only admin roles can create courses
    const allowedRoles = ['Super Admin', 'Admin', 'School Administrator', 'Manager', 'Lecturer']
    if (!hasAnyRole(auth.user, allowedRoles)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = await request.json()

    // Required fields validation
    const required = ['courseCode', 'courseName', 'subjectArea', 'instructor']
    for (const field of required) {
      if (data[field] === undefined || data[field] === null || (typeof data[field] === 'string' && data[field].trim() === '')) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Type and value checks
    if (typeof data.courseCode !== 'string' || data.courseCode.trim().length < 2) {
      return NextResponse.json({ error: 'courseCode must be a non-empty string' }, { status: 400 })
    }
    if (typeof data.courseName !== 'string' || data.courseName.trim().length < 2) {
      return NextResponse.json({ error: 'courseName must be a non-empty string' }, { status: 400 })
    }
    if (typeof data.subjectArea !== 'string' || data.subjectArea.trim().length < 2) {
      return NextResponse.json({ error: 'subjectArea must be a non-empty string' }, { status: 400 })
    }
    if (typeof data.instructor !== 'string' || data.instructor.trim().length < 2) {
      return NextResponse.json({ error: 'instructor must be a non-empty string' }, { status: 400 })
    }

    // Check for existing course by code
    const existingByCode = await prisma.course.findUnique({ where: { courseCode: data.courseCode } })
    if (existingByCode) {
      return NextResponse.json({ error: 'A course with this code already exists' }, { status: 400 })
    }

    // Optional fields sanity
    const description = typeof data.description === 'string' ? data.description : undefined
    const prerequisites = typeof data.prerequisites === 'string' ? data.prerequisites : undefined
    const meetingUrl = typeof data.meetingUrl === 'string' ? data.meetingUrl : undefined
    const isActive = data.isActive === undefined ? true : !!data.isActive

    // Create course
    const course = await prisma.course.create({
      data: {
        courseCode: data.courseCode.trim(),
        courseName: data.courseName.trim(),
        subjectArea: data.subjectArea.trim(),
        instructor: data.instructor.trim(),
        meetingUrl,
        prerequisites,
        description,
        isActive
      },
      select: {
        id: true,
        courseCode: true,
        courseName: true,
        subjectArea: true,
        instructor: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ success: true, course, message: 'Course created successfully' })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}