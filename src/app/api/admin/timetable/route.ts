import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const createCourseSessionSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  courseId: z.string().min(1, 'Course is required'),
  startTime: z.string().refine((time) => !isNaN(Date.parse(time)), 'Invalid start time'),
  endTime: z.string().refine((time) => !isNaN(Date.parse(time)), 'Invalid end time'),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  academicYear: z.string().min(1, 'Academic year is required'),
  term: z.string().optional(),
  isActive: z.boolean().default(true)
});

const updateCourseSessionSchema = createCourseSessionSchema.partial();

// Permission check helper
function hasTimetablePermission(userRole: string, action: 'read' | 'write' | 'delete'): boolean {
  const permissions = {
    'Super Admin': ['read', 'write', 'delete'],
    'Principal': ['read', 'write', 'delete'],
    'Admin': ['read', 'write', 'delete'],
    'Department Head': ['read', 'write'],
    'Manager': ['read', 'write'],
    'Instructor': ['read'],
    'Librarian': ['read'],
    'Parent': ['read']
  };

  return permissions[userRole as keyof typeof permissions]?.includes(action) || false;
}

// GET - Fetch class sessions (timetable)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    if (!hasTimetablePermission(authResult.user?.role?.name || '', 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const courseId = searchParams.get('courseId');
    const dayOfWeek = searchParams.get('dayOfWeek');
    const academicYear = searchParams.get('academicYear');
    const term = searchParams.get('term');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      isActive: true
    };

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek;
    }

    if (academicYear) {
      where.academicYear = academicYear;
    }

    if (term) {
      where.term = term;
    }

    const [courseSessions, totalCount] = await Promise.all([
      prisma.courseSession.findMany({
        where,
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ],
        skip,
        take: limit,
        include: {
          subject: {
            select: {
              id: true,
              subjectCode: true,
              subjectName: true,
              credits: true
            }
          },
          teacher: {
            select: {
              id: true,
              teacherId: true,
              fullName: true,
              emailAddress: true,
              department: true,
              position: true
            }
          },
          course: {
            select: {
              id: true,
              courseCode: true,
              courseName: true,
              capacity: true,
              courseType: true,
              building: true,
              floor: true
            }
          }
        }
      }),
      prisma.courseSession.count({ where })
    ]);

    // Group sessions by day for timetable view
    const timetableData = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    courseSessions.forEach(session => {
      timetableData[session.dayOfWeek as keyof typeof timetableData].push(session);
    });

    return NextResponse.json({
      courseSessions,
      timetableData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching class sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class sessions' },
      { status: 500 }
    );
  }
}

// POST - Create new class session
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    if (!hasTimetablePermission(authResult.user?.role?.name || '', 'write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createCourseSessionSchema.parse(body);

    // Validate time range
    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);
    
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflicts = await prisma.courseSession.findMany({
      where: {
        dayOfWeek: validatedData.dayOfWeek,
        isActive: true,
        OR: [
          {
            // Teacher conflict
            teacherId: validatedData.teacherId,
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            // Course conflict
            courseId: validatedData.courseId,
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } }
            ]
          }
        ]
      },
      include: {
        teacher: { select: { fullName: true } },
        course: { select: { courseCode: true } },
        subject: { select: { subjectName: true } }
      }
    });

    if (conflicts.length > 0) {
      const conflictMessages = conflicts.map(conflict => {
        if (conflict.teacherId === validatedData.teacherId) {
          return `Teacher ${conflict.teacher.fullName} is already scheduled for ${conflict.subject.subjectName} at this time`;
        } else {
          return `Course ${conflict.course.courseCode} is already booked for ${conflict.subject.subjectName} at this time`;
        }
      });
      
      return NextResponse.json(
        { error: 'Schedule conflict detected', conflicts: conflictMessages },
        { status: 400 }
      );
    }

    // Verify that teacher teaches the subject
    const teacherSubject = await prisma.teacherSubject.findFirst({
      where: {
        teacherId: validatedData.teacherId,
        subjectId: validatedData.subjectId
      }
    });

    if (!teacherSubject) {
      return NextResponse.json(
        { error: 'Teacher is not assigned to teach this subject' },
        { status: 400 }
      );
    }

    const courseSession = await prisma.courseSession.create({
      data: {
        ...validatedData,
        startTime: startTime,
        endTime: endTime
      },
      include: {
        subject: {
          select: {
            id: true,
            subjectCode: true,
            subjectName: true,
            credits: true
          }
        },
        teacher: {
          select: {
            id: true,
            teacherId: true,
            fullName: true,
            emailAddress: true,
            department: true
          }
        },
        course: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            capacity: true,
            courseType: true
          }
        }
      }
    });

    return NextResponse.json(courseSession, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating class session:', error);
    return NextResponse.json(
      { error: 'Failed to create class session' },
      { status: 500 }
    );
  }
}

// PUT - Update class session
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    if (!hasTimetablePermission(authResult.user?.role?.name || '', 'write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateCourseSessionSchema.parse(body);

    // Check if session exists
    const existingSession = await prisma.courseSession.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Class session not found' }, { status: 404 });
    }

    // Validate time range if times are being updated
    if (validatedData.startTime || validatedData.endTime) {
      const startTime = validatedData.startTime ? new Date(validatedData.startTime) : existingSession.startTime;
      const endTime = validatedData.endTime ? new Date(validatedData.endTime) : existingSession.endTime;
      
      if (startTime >= endTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    const updateData: any = { ...validatedData };
    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime);
    }
    if (validatedData.endTime) {
      updateData.endTime = new Date(validatedData.endTime);
    }

    const updatedSession = await prisma.courseSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        subject: {
          select: {
            id: true,
            subjectCode: true,
            subjectName: true,
            credits: true
          }
        },
        teacher: {
          select: {
            id: true,
            teacherId: true,
            fullName: true,
            emailAddress: true,
            department: true
          }
        },
        course: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            capacity: true,
            courseType: true
          }
        }
      }
    });

    return NextResponse.json(updatedSession);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating class session:', error);
    return NextResponse.json(
      { error: 'Failed to update class session' },
      { status: 500 }
    );
  }
}

// DELETE - Delete class session
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    if (!hasTimetablePermission(authResult.user?.role?.name || '', 'delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Check if session exists
    const existingSession = await prisma.courseSession.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Class session not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.courseSession.update({
      where: { id: sessionId },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Class session deleted successfully' });

  } catch (error) {
    console.error('Error deleting class session:', error);
    return NextResponse.json(
      { error: 'Failed to delete class session' },
      { status: 500 }
    );
  }
}