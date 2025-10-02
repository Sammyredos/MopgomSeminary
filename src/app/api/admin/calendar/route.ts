import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth-helpers';

// Validation schemas
const createCalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  eventType: z.enum(['TERM', 'HOLIDAY', 'EXAM', 'EVENT', 'MEETING']),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  academicYear: z.string().regex(/^\d{4}(-\d{4})?$/, 'Academic year must be in format YYYY or YYYY-YYYY'),
  isActive: z.boolean().default(true)
});

const updateCalendarEventSchema = createCalendarEventSchema.partial();

// Permission check helper
function hasCalendarPermission(userRole: string, action: 'read' | 'write' | 'delete'): boolean {
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

// GET - Fetch calendar events
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    if (!hasCalendarPermission(user?.role?.name || '', 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const eventType = searchParams.get('eventType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build filter conditions
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

    const [events, totalCount] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip,
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
      }),
      prisma.calendarEvent.count({ where })
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// POST - Create new calendar event
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    if (!hasCalendarPermission(user?.role?.name || '', 'write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createCalendarEventSchema.parse(body);

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping events of the same type
    if (validatedData.eventType === 'TERM') {
      const overlappingTerm = await prisma.calendarEvent.findFirst({
        where: {
          eventType: 'TERM',
          academicYear: validatedData.academicYear,
          isActive: true,
          OR: [
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } }
              ]
            },
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } }
              ]
            },
            {
              AND: [
                { startDate: { gte: startDate } },
                { endDate: { lte: endDate } }
              ]
            }
          ]
        }
      });

      if (overlappingTerm) {
        return NextResponse.json(
          { error: 'Term dates overlap with existing term' },
          { status: 400 }
        );
      }
    }

    const calendarEvent = await prisma.calendarEvent.create({
      data: {
        ...validatedData,
        startDate: startDate,
        endDate: endDate
      }
    });

    return NextResponse.json(calendarEvent, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}

// PUT - Update calendar event
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    if (!hasCalendarPermission(user?.role?.name || '', 'write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateCalendarEventSchema.parse(body);

    // Check if event exists
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Calendar event not found' }, { status: 404 });
    }

    // Validate date range if dates are being updated
    if (validatedData.startDate || validatedData.endDate) {
      const startDate = validatedData.startDate ? new Date(validatedData.startDate) : existingEvent.startDate;
      const endDate = validatedData.endDate ? new Date(validatedData.endDate) : existingEvent.endDate;
      
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    const updateData: any = { ...validatedData };
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData
    });

    return NextResponse.json(updatedEvent);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete calendar event
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    if (!hasCalendarPermission(user?.role?.name || '', 'delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Check if event exists
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Calendar event not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.calendarEvent.update({
      where: { id: eventId },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Calendar event deleted successfully' });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}