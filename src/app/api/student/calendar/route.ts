import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-helpers';

// GET - Fetch calendar events for students (read-only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    // Only allow students to access this endpoint
    if (user?.role?.name !== 'Student') {
      return NextResponse.json({ error: 'Access denied. Students only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const eventType = searchParams.get('eventType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100'); // Higher limit for students to see more events

    // Build filter conditions - only show active events
    const where: any = {
      isActive: true
    };

    if (academicYear) {
      where.academicYear = academicYear;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (startDate && endDate) {
      where.AND = [
        { startDate: { gte: new Date(startDate) } },
        { endDate: { lte: new Date(endDate) } }
      ];
    }

    // Fetch events - students get all active events without pagination
    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        eventType: true,
        startDate: true,
        endDate: true,
        isRecurring: true,
        recurrencePattern: true,
        academicYear: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get some basic statistics for the student view
    const totalEvents = await prisma.calendarEvent.count({ where });
    
    // Get upcoming events count
    const upcomingEventsCount = await prisma.calendarEvent.count({
      where: {
        ...where,
        startDate: { gte: new Date() }
      }
    });

    // Get events by type for current academic year
    const eventsByType = await prisma.calendarEvent.groupBy({
      by: ['eventType'],
      where: {
        ...where,
        academicYear: academicYear || new Date().getFullYear().toString()
      },
      _count: {
        eventType: true
      }
    });

    return NextResponse.json({
      events,
      stats: {
        totalEvents,
        upcomingEvents: upcomingEventsCount,
        eventsByType: eventsByType.reduce((acc, item) => {
          acc[item.eventType] = item._count.eventType;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error fetching calendar events for student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// Only GET method is allowed for students - no POST, PUT, DELETE
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed for students' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed for students' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed for students' }, { status: 405 });
}