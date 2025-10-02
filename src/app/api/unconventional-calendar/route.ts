import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-helpers';
import { academicYearGenerator, UnconventionalDate, DEFAULT_UNCONVENTIONAL_CALENDAR } from '@/lib/services/academic-year-generator';
import { z } from 'zod';

const generateYearsSchema = z.object({
  startYear: z.number().min(2020).max(2050),
  count: z.number().min(1).max(10).default(5),
});

const calendarEventsSchema = z.object({
  year: z.number().min(2020).max(2050),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    // Check permissions
    const allowedRoles = ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager'];
    if (!allowedRoles.includes(authResult.user?.role?.name || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'calendar-config':
        return NextResponse.json({
          success: true,
          config: DEFAULT_UNCONVENTIONAL_CALENDAR,
        });

      case 'current-date':
        const now = new Date();
        const unconventionalNow = UnconventionalDate.fromStandardDate(now);
        return NextResponse.json({
          success: true,
          currentDate: {
            standard: now.toISOString(),
            unconventional: {
              year: unconventionalNow.year,
              month: unconventionalNow.month,
              day: unconventionalNow.day,
              formatted: unconventionalNow.format(),
              academicYear: unconventionalNow.getAcademicYearString(),
            },
          },
        });

      case 'current-academic-year':
        const currentAcademicYear = await academicYearGenerator.getCurrentAcademicYear();
        return NextResponse.json({
          success: true,
          currentAcademicYear,
        });

      case 'calendar-events':
        const yearParam = searchParams.get('year');
        if (!yearParam) {
          return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 });
        }
        
        const { year } = calendarEventsSchema.parse({ year: parseInt(yearParam) });
        const events = academicYearGenerator.getUnconventionalCalendarEvents(year);
        
        return NextResponse.json({
          success: true,
          year,
          events: events.map(event => ({
            date: {
              year: event.date.year,
              month: event.date.month,
              day: event.date.day,
              formatted: event.date.format(),
              standard: event.date.toStandardDate().toISOString(),
            },
            name: event.name,
            type: event.type,
            description: event.description,
          })),
        });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in unconventional calendar API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    // Check permissions - only Super Admin and Principal can generate years
    const allowedRoles = ['Super Admin', 'Principal'];
    if (!allowedRoles.includes(authResult.user?.role?.name || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'generate-years':
        const { startYear, count } = generateYearsSchema.parse(body);
        await academicYearGenerator.generateAcademicYears(startYear, count);
        
        return NextResponse.json({
          success: true,
          message: `Successfully generated ${count} academic years starting from ${startYear}`,
        });

      case 'auto-generate':
        await academicYearGenerator.autoGenerateFutureYears();
        
        return NextResponse.json({
          success: true,
          message: 'Successfully auto-generated future academic years',
        });

      case 'convert-date':
        const { date, direction } = z.object({
          date: z.string(),
          direction: z.enum(['to-unconventional', 'to-standard']),
        }).parse(body);

        if (direction === 'to-unconventional') {
          const standardDate = new Date(date);
          const unconventionalDate = UnconventionalDate.fromStandardDate(standardDate);
          
          return NextResponse.json({
            success: true,
            conversion: {
              input: date,
              output: {
                year: unconventionalDate.year,
                month: unconventionalDate.month,
                day: unconventionalDate.day,
                formatted: unconventionalDate.format(),
                academicYear: unconventionalDate.getAcademicYearString(),
              },
            },
          });
        } else {
          const { year, month, day } = z.object({
            year: z.number(),
            month: z.number().min(1).max(13),
            day: z.number().min(1).max(28),
          }).parse(JSON.parse(date));
          
          const unconventionalDate = new UnconventionalDate(year, month, day);
          const standardDate = unconventionalDate.toStandardDate();
          
          return NextResponse.json({
            success: true,
            conversion: {
              input: { year, month, day },
              output: standardDate.toISOString(),
            },
          });
        }

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in unconventional calendar POST API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}