import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest, hasAnyRole } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const allowedRoles = ['Super Admin', 'Admin', 'School Administrator', 'Manager', 'Lecturer']
    if (!hasAnyRole(auth.user, allowedRoles)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        courseCode: true,
        courseName: true,
        subjectArea: true,
        instructor: true,
        maxStudents: true,
        currentEnrollment: true,
        duration: true,
        platform: true,
        meetingUrl: true,
        prerequisites: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        courseSessions: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, course, message: 'Course retrieved successfully' })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const allowedRoles = ['Super Admin', 'Admin', 'School Administrator', 'Manager', 'Lecturer']
    if (!hasAnyRole(auth.user, allowedRoles)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: courseId } = await params
    const data = await request.json()

    const existing = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Validate numeric fields if provided
    if (data.maxStudents !== undefined) {
      if (typeof data.maxStudents !== 'number' || data.maxStudents < 1) {
        return NextResponse.json({ error: 'maxStudents must be a positive number' }, { status: 400 })
      }
      if (data.maxStudents < existing.currentEnrollment) {
        return NextResponse.json({ error: `Cannot reduce maxStudents below current enrollment (${existing.currentEnrollment})` }, { status: 400 })
      }
    }

    if (data.duration !== undefined) {
      if (typeof data.duration !== 'number' || data.duration < 1) {
        return NextResponse.json({ error: 'duration must be a positive number' }, { status: 400 })
      }
    }

    // Ensure courseCode uniqueness if changing
    if (data.courseCode && data.courseCode !== existing.courseCode) {
      const byCode = await prisma.course.findUnique({ where: { courseCode: data.courseCode } })
      if (byCode) {
        return NextResponse.json({ error: 'A course with this code already exists' }, { status: 400 })
      }
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(data.courseCode && { courseCode: String(data.courseCode).trim() }),
        ...(data.courseName && { courseName: String(data.courseName).trim() }),
        ...(data.subjectArea && { subjectArea: String(data.subjectArea).trim() }),
        ...(data.instructor && { instructor: String(data.instructor).trim() }),
        ...(data.platform && { platform: String(data.platform).trim() }),
        ...(data.maxStudents !== undefined && { maxStudents: data.maxStudents }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.meetingUrl !== undefined && { meetingUrl: data.meetingUrl || null }),
        ...(data.prerequisites !== undefined && { prerequisites: data.prerequisites || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.isActive !== undefined && { isActive: !!data.isActive })
      },
      select: {
        id: true,
        courseCode: true,
        courseName: true,
        subjectArea: true,
        instructor: true,
        maxStudents: true,
        currentEnrollment: true,
        duration: true,
        platform: true,
        meetingUrl: true,
        prerequisites: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ success: true, course: updated, message: 'Course updated successfully' })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    // Restrict deletion to high-privilege roles
    const allowedRoles = ['Super Admin', 'Admin']
    if (!hasAnyRole(auth.user, allowedRoles)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { courseAllocations: true }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.courseAllocations.length > 0) {
      return NextResponse.json({ error: 'Cannot delete course with existing allocations' }, { status: 400 })
    }

    await prisma.course.delete({ where: { id: courseId } })

    return NextResponse.json({ success: true, message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}