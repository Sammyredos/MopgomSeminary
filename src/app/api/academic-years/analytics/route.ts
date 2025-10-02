import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view analytics
    const allowedRoles = ['Super Admin', 'Principal', 'Admin', 'Teacher'];
    if (!allowedRoles.includes(authResult.user.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get analytics data
    const [totalAcademicYears, activeAcademicYears, currentAcademicYear, totalStudents, totalSemesters] = await Promise.all([
      // Total academic years
      prisma.academicYear.count(),
      
      // Active academic years
      prisma.academicYear.count({
        where: { isActive: true }
      }),
      
      // Current academic year
      prisma.academicYear.findFirst({
        where: { isCurrent: true },
        include: {
          semesters: true,
          _count: {
            select: {
              students: true,
              calendarEvents: true
            }
          }
        }
      }),
      
      // Total students across all academic years
      prisma.student.count(),
      
      // Total semesters
      prisma.semester.count()
    ]);

    const analyticsData = {
      totalAcademicYears,
      activeAcademicYears,
      currentAcademicYear,
      totalStudents,
      totalSemesters
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching academic years analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}