import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

    // Check permissions
    const allowedRoles = ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager', 'Teacher', 'Instructor'];
    if (!allowedRoles.includes(session.user?.role?.name || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get semester analytics
    const [totalSemesters, activeSemesters, currentSemester, totalEnrollments] = await Promise.all([
      // Total semesters
      prisma.semester.count(),
      
      // Active semesters
      prisma.semester.count({
        where: { isActive: true },
      }),
      
      // Current semester count (should be 1 or 0)
      prisma.semester.count({
        where: { isCurrent: true },
      }),
      
      // Total enrollments across all semesters
      prisma.studentEnrollment.count(),
    ]);

    // Get semester distribution by academic year
    const semestersByYear = await prisma.semester.groupBy({
      by: ['academicYearId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get semester distribution by semester number
    const semestersByNumber = await prisma.semester.groupBy({
      by: ['semesterNumber'],
      _count: {
        id: true,
      },
      orderBy: {
        semesterNumber: 'asc',
      },
    });

    // Get enrollment trends by semester
    const enrollmentTrends = await prisma.semester.findMany({
      select: {
        id: true,
        name: true,
        semesterNumber: true,
        academicYear: {
          select: {
            year: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            courseOfferings: true,
            grades: true,
          },
        },
      },
      orderBy: [
        { academicYear: { year: 'desc' } },
        { semesterNumber: 'asc' },
      ],
      take: 10, // Last 10 semesters
    });

    // Get current academic year statistics
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      include: {
        semesters: {
          select: {
            id: true,
            name: true,
            semesterNumber: true,
            isActive: true,
            isCurrent: true,
            _count: {
              select: {
                enrollments: true,
                courseOfferings: true,
                grades: true,
              },
            },
          },
          orderBy: { semesterNumber: 'asc' },
        },
      },
    });

    // Calculate semester completion rates
    const semesterCompletionRates = await Promise.all(
      (currentAcademicYear?.semesters || []).map(async (semester) => {
        const totalEnrollments = semester._count.enrollments;
        const completedGrades = semester._count.grades;
        const completionRate = totalEnrollments > 0 ? (completedGrades / totalEnrollments) * 100 : 0;
        
        return {
          semesterId: semester.id,
          semesterName: semester.name,
          semesterNumber: semester.semesterNumber,
          totalEnrollments,
          completedGrades,
          completionRate: Math.round(completionRate * 100) / 100,
        };
      })
    );

    // Get recent semester activities
    const recentActivities = await prisma.semester.findMany({
      select: {
        id: true,
        name: true,
        semesterNumber: true,
        createdAt: true,
        updatedAt: true,
        academicYear: {
          select: {
            year: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    const analytics = {
      totalSemesters,
      activeSemesters,
      currentSemester,
      totalEnrollments,
      distribution: {
        byYear: semestersByYear,
        byNumber: semestersByNumber,
      },
      trends: {
        enrollments: enrollmentTrends,
        completion: semesterCompletionRates,
      },
      currentAcademicYear: currentAcademicYear ? {
        id: currentAcademicYear.id,
        year: currentAcademicYear.year,
        semesters: currentAcademicYear.semesters,
      } : null,
      recentActivities,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching semester analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}