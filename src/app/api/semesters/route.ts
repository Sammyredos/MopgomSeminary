import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const db = prisma as any;

const createSemesterSchema = z.object({
  semesterNumber: z.number().int().min(1).max(3),
  name: z.string().min(1, 'Semester name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isCurrent: z.boolean().default(false),
  academicYearId: z.string().min(1, 'Academic year is required'),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    // Check permissions
    const allowedRoles = ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager', 'Teacher', 'Instructor'];
    if (!allowedRoles.includes(authResult.user?.role?.name || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const academicYear = searchParams.get('academicYear') || 'all';
    const semester = searchParams.get('semester') || 'all';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { academicYear: { year: { contains: search } } },
      ];
    }

    if (academicYear !== 'all') {
      where.academicYearId = academicYear;
    }

    if (semester !== 'all') {
      where.semesterNumber = parseInt(semester);
    }

    if (status !== 'all') {
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      } else if (status === 'current') {
        where.isCurrent = true;
      }
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'academicYear') {
      orderBy.academicYear = { year: sortOrder };
    } else if (sortBy === 'semesterNumber') {
      orderBy.semesterNumber = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [semesters, total] = await Promise.all([
      db.semester.findMany({
        where,
        include: {
          academicYear: true,
          _count: {
            select: {
              courseOfferings: true,
              enrollments: true,
              grades: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.semester.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      semesters,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching semesters:', error);
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
    const validatedData = createSemesterSchema.parse(body);

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if academic year exists
    const academicYear = await db.academicYear.findUnique({
      where: { id: validatedData.academicYearId },
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    // Validate semester dates are within academic year range
    if (startDate < academicYear.startDate || endDate > academicYear.endDate) {
      return NextResponse.json(
        { error: 'Semester dates must be within the academic year range' },
        { status: 400 }
      );
    }

    // Check if semester already exists for this academic year and semester number
    const existingSemester = await db.semester.findFirst({
      where: {
        academicYearId: validatedData.academicYearId,
        semesterNumber: validatedData.semesterNumber,
      },
    });

    if (existingSemester) {
      return NextResponse.json(
        { error: `Semester ${validatedData.semesterNumber} already exists for this academic year` },
        { status: 400 }
      );
    }

    // If setting as current, unset other current semesters
    if (validatedData.isCurrent) {
      await db.semester.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    // Create semester
    const semester = await db.semester.create({
      data: {
        semesterNumber: validatedData.semesterNumber,
        name: validatedData.name,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        description: validatedData.description,
        isActive: validatedData.isActive,
        isCurrent: validatedData.isCurrent,
        academicYearId: validatedData.academicYearId,
      },
      include: {
        academicYear: true,
        _count: {
          select: {
            courseOfferings: true,
            enrollments: true,
            grades: true,
          },
        },
      },
    });

    return NextResponse.json(semester, { status: 201 });
  } catch (error) {
    console.error('Error creating semester:', error);
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