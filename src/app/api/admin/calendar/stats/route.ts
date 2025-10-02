import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-helpers';

// Permission check helper
function hasCalendarPermission(userRole: string): boolean {
  const permissions = {
    'Super Admin': true,
    'Principal': true,
    'Admin': true,
    'Department Head': true,
    'Manager': true,
    'Instructor': true,
    'Staff': false,
    'Parent': false
  };
  return permissions[userRole as keyof typeof permissions] || false;
}

// GET - Fetch calendar statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    if (!hasCalendarPermission(user?.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get total events count
    const totalEvents = await prisma.calendarEvent.count({
      where: {
        isActive: true
      }
    });

    // Get upcoming events count (events starting from today)
    const upcomingEvents = await prisma.calendarEvent.count({
      where: {
        isActive: true,
        startDate: {
          gte: now.toISOString()
        }
      }
    });

    // Get active terms count
    const activeTerms = await prisma.calendarEvent.count({
      where: {
        isActive: true,
        eventType: 'TERM',
        startDate: {
          lte: now.toISOString()
        },
        endDate: {
          gte: now.toISOString()
        }
      }
    });

    // Get holidays this month count
    const holidaysThisMonth = await prisma.calendarEvent.count({
      where: {
        isActive: true,
        eventType: 'HOLIDAY',
        OR: [
          {
            startDate: {
              gte: startOfMonth.toISOString(),
              lte: endOfMonth.toISOString()
            }
          },
          {
            endDate: {
              gte: startOfMonth.toISOString(),
              lte: endOfMonth.toISOString()
            }
          },
          {
            AND: [
              {
                startDate: {
                  lte: startOfMonth.toISOString()
                }
              },
              {
                endDate: {
                  gte: endOfMonth.toISOString()
                }
              }
            ]
          }
        ]
      }
    });

    const stats = {
      totalEvents,
      upcomingEvents,
      activeTerms,
      holidaysThisMonth
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar statistics' },
      { status: 500 }
    );
  }
}