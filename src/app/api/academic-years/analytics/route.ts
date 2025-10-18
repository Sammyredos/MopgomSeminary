import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

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
    if (!allowedRoles.includes((authResult.user as any)?.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Derive analytics from existing models (Student, CalendarEvent)
    const [studentYears, activeEventYears, totalStudents] = await Promise.all([
      prisma.student.groupBy({
        by: ['academicYear'],
      }),
      prisma.calendarEvent.groupBy({
        by: ['academicYear'],
        where: { isActive: true },
      }),
      prisma.student.count(),
    ])

    const totalAcademicYears = studentYears.length
    const activeAcademicYears = activeEventYears.length

    // Determine current academic year as the max year present in events or students
    const allYears = [
      ...new Set([
        ...studentYears.map(y => y.academicYear),
        ...activeEventYears.map(y => y.academicYear),
      ]),
    ].filter(Boolean) as string[]

    const numericYears = allYears
      .map(y => parseInt(String(y).replace(/[^0-9]/g, ''), 10))
      .filter(n => !isNaN(n))

    const bestYear = numericYears.length > 0
      ? String(Math.max(...numericYears))
      : (allYears[0] || null)

    let currentAcademicYear: any = null

    if (bestYear) {
      const [studentCountForYear, eventCountForYear] = await Promise.all([
        prisma.student.count({ where: { academicYear: bestYear } }),
        prisma.calendarEvent.count({ where: { academicYear: bestYear } }),
      ])

      currentAcademicYear = {
        id: bestYear,
        year: bestYear,
        startDate: null,
        endDate: null,
        isActive: true,
        isCurrent: true,
        description: null,
        createdAt: null,
        updatedAt: null,
        semesters: [],
        _count: {
          students: studentCountForYear,
          calendarEvents: eventCountForYear,
        },
      }
    }

    const analyticsData = {
      totalAcademicYears,
      activeAcademicYears,
      currentAcademicYear,
      totalStudents,
      totalSemesters: 0,
    }

    return NextResponse.json(analyticsData)
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