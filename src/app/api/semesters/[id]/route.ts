import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const db = prisma as any;
const updateSemesterSchema = z.object({
  semesterNumber: z.number().int().min(1).max(3),
  name: z.string().min(1, 'Semester name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isCurrent: z.boolean().default(false),
  academicYearId: z.string().min(1, 'Academic year is required'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const semester = await db.semester.findUnique({
      where: { id: params.id },
      include: {
        academicYear: true,
        courseOfferings: {
          include: {
            course: true,
          },
        },
        enrollments: {
          include: {
            student: true,
          },
        },
        _count: {
          select: {
            courseOfferings: true,
            enrollments: true,
            grades: true,
          },
        },
      },
    });

    if (!semester) {
      return NextResponse.json(
        { error: 'Semester not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(semester);
  } catch (error) {
    console.error('Error fetching semester:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateSemesterSchema.parse(body);

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if semester exists
    const existingSemester = await db.semester.findUnique({
      where: { id: params.id },
      include: { academicYear: true },
    });

    if (!existingSemester) {
      return NextResponse.json(
        { error: 'Semester not found' },
        { status: 404 }
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

    // Check if semester number is being changed and if it conflicts
    if (validatedData.semesterNumber !== existingSemester.semesterNumber ||
        validatedData.academicYearId !== existingSemester.academicYearId) {
      const conflictingSemester = await db.semester.findFirst({
        where: {
          academicYearId: validatedData.academicYearId,
          semesterNumber: validatedData.semesterNumber,
          id: { not: params.id },
        },
      });

      if (conflictingSemester) {
        return NextResponse.json(
          { error: `Semester ${validatedData.semesterNumber} already exists for this academic year` },
          { status: 400 }
        );
      }
    }

    // If setting as current, unset other current semesters
    if (validatedData.isCurrent && !existingSemester.isCurrent) {
      await db.semester.updateMany({
        where: { 
          isCurrent: true,
          id: { not: params.id },
        },
        data: { isCurrent: false },
      });
    }

    // Update semester
    const updatedSemester = await db.semester.update({
      where: { id: params.id },
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

    return NextResponse.json(updatedSemester);
  } catch (error) {
    console.error('Error updating semester:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    // Check permissions
    const allowedRoles = ['Super Admin', 'Principal'];
    if (!allowedRoles.includes(authResult.user?.role?.name || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if semester exists
    const semester = await db.semester.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            courseOfferings: true,
            enrollments: true,
            grades: true,
          },
        },
      },
    });

    if (!semester) {
      return NextResponse.json(
        { error: 'Semester not found' },
        { status: 404 }
      );
    }

    // Check if semester is currently in use
    if (semester._count.enrollments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete semester with student enrollments' },
        { status: 400 }
      );
    }

    if (semester._count.courseOfferings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete semester with course offerings' },
        { status: 400 }
      );
    }

    if (semester._count.grades > 0) {
      return NextResponse.json(
        { error: 'Cannot delete semester with recorded grades' },
        { status: 400 }
      );
    }

    if (semester.isCurrent) {
      return NextResponse.json(
        { error: 'Cannot delete the current semester' },
        { status: 400 }
      );
    }

    // Delete semester
    await db.semester.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    console.error('Error deleting semester:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}