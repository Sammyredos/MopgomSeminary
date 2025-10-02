import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { academicYearGenerator } from '@/lib/services/academic-year-generator';

// Validation schemas
const querySchema = z.object({
  page: z.string().default('1'),
  limit: z.string().default('10'),
  search: z.string().default(''),
  status: z.string().default('all'),
});

const createAcademicYearSchema = z.object({
  year: z.string().min(1, 'Academic year is required').regex(/^\d{4}(-\d{4})?$/, 'Academic year must be in format YYYY or YYYY-YYYY'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isCurrent: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    // Check permissions
    const allowedRoles = ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager'];
    const userRole = authResult.user?.role?.name || '';
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'all',
    });

    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.search) {
      where.OR = [
        { year: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status === 'active') {
      where.isActive = true;
    } else if (query.status === 'inactive') {
      where.isActive = false;
    } else if (query.status === 'current') {
      where.isCurrent = true;
    }

    // Get academic years with pagination
    const [academicYears, total] = await Promise.all([
      prisma.academicYear.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      prisma.academicYear.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      academicYears: academicYears,
      total,
      totalPages,
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching academic years:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Check permissions
    const allowedRoles = ['Super Admin', 'Principal', 'Admin'];
    if (!allowedRoles.includes(authResult.user?.role?.name || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createAcademicYearSchema.parse(body);

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if academic year already exists
    const existingAcademicYear = await prisma.academicYear.findFirst({
      where: { year: validatedData.year },
    });

    if (existingAcademicYear) {
      return NextResponse.json(
        { error: 'Academic year already exists' },
        { status: 400 }
      );
    }

    // If setting as current, unset other current academic years
    if (validatedData.isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    // Create academic year with three semesters
    const academicYear = await prisma.academicYear.create({
      data: {
        year: validatedData.year,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        description: validatedData.description,
        isActive: validatedData.isActive,
        isCurrent: validatedData.isCurrent,
        semesters: {
          create: [
            {
              name: 'First Semester',
              semesterNumber: 1,
              startDate: new Date(validatedData.startDate),
              endDate: new Date(startDate.getFullYear(), startDate.getMonth() + 4, startDate.getDate()), // ~4 months
              isActive: validatedData.isActive,
            },
            {
              name: 'Second Semester',
              semesterNumber: 2,
              startDate: new Date(startDate.getFullYear(), startDate.getMonth() + 4, startDate.getDate() + 1),
              endDate: new Date(startDate.getFullYear(), startDate.getMonth() + 8, startDate.getDate()), // ~4 months
              isActive: validatedData.isActive,
            },
            {
              name: 'Third Semester',
              semesterNumber: 3,
              startDate: new Date(startDate.getFullYear(), startDate.getMonth() + 8, startDate.getDate() + 1),
              endDate: new Date(validatedData.endDate),
              isActive: validatedData.isActive,
            },
          ],
        },
      },
      include: {
        semesters: {
          orderBy: { semesterNumber: 'asc' },
        },
        _count: {
          select: {
            students: true,
            calendarEvents: true,
          },
        },
      },
    });

    return NextResponse.json(academicYear, { status: 201 });
  } catch (error) {
    console.error('Error creating academic year:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}