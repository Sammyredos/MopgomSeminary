import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const db = prisma as any;

const updateAcademicYearSchema = z.object({
  year: z.string().min(1, 'Academic year is required').regex(/^\d{4}(-\d{4})?$/, 'Academic year must be in format YYYY or YYYY-YYYY'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isCurrent: z.boolean().default(false),
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
    const allowedRoles = ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager'];
    if (!allowedRoles.includes(authResult.user?.role?.name || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const academicYear = await db.academicYear.findUnique({
      where: { id: params.id },
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

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(academicYear);
  } catch (error) {
    console.error('Error fetching academic year:', error);
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
    const validatedData = updateAcademicYearSchema.parse(body);

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
    const existingAcademicYear = await db.academicYear.findUnique({
      where: { id: params.id },
    });

    if (!existingAcademicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    // Check if year is being changed and if it conflicts with another academic year
    if (validatedData.year !== existingAcademicYear.year) {
      const conflictingAcademicYear = await db.academicYear.findFirst({
        where: {
          year: validatedData.year,
          id: { not: params.id },
        },
      });

      if (conflictingAcademicYear) {
        return NextResponse.json(
          { error: 'Academic year already exists' },
          { status: 400 }
        );
      }
    }

    // If setting as current, unset other current academic years
    if (validatedData.isCurrent && !existingAcademicYear.isCurrent) {
      await db.academicYear.updateMany({
        where: { 
          isCurrent: true,
          id: { not: params.id },
        },
        data: { isCurrent: false },
      });
    }

    // Update academic year
    const updatedAcademicYear = await db.academicYear.update({
      where: { id: params.id },
      data: {
        year: validatedData.year,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        description: validatedData.description,
        isActive: validatedData.isActive,
        isCurrent: validatedData.isCurrent,
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

    // Update semester dates and status based on the academic year changes
    if (validatedData.startDate !== existingAcademicYear.startDate.toISOString().split('T')[0] ||
        validatedData.endDate !== existingAcademicYear.endDate.toISOString().split('T')[0] ||
        validatedData.isActive !== existingAcademicYear.isActive) {
      
      const yearDuration = endDate.getTime() - startDate.getTime();
      const semesterDuration = yearDuration / 3;

      await db.semester.updateMany({
        where: { academicYearId: params.id, semesterNumber: 1 },
        data: {
          startDate: startDate,
          endDate: new Date(startDate.getTime() + semesterDuration),
          isActive: validatedData.isActive,
        },
      });

      await db.semester.updateMany({
        where: { academicYearId: params.id, semesterNumber: 2 },
        data: {
          startDate: new Date(startDate.getTime() + semesterDuration + 1),
          endDate: new Date(startDate.getTime() + (semesterDuration * 2)),
          isActive: validatedData.isActive,
        },
      });

      await db.semester.updateMany({
        where: { academicYearId: params.id, semesterNumber: 3 },
        data: {
          startDate: new Date(startDate.getTime() + (semesterDuration * 2) + 1),
          endDate: endDate,
          isActive: validatedData.isActive,
        },
      });
    }

    return NextResponse.json(updatedAcademicYear);
  } catch (error) {
    console.error('Error updating academic year:', error);
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

    // Check if academic year exists
    const academicYear = await db.academicYear.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            students: true,
            calendarEvents: true,
            semesters: true,
          },
        },
      },
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    // Check if academic year is currently in use
    if (academicYear._count.students > 0) {
      return NextResponse.json(
        { error: 'Cannot delete academic year with enrolled students' },
        { status: 400 }
      );
    }

    if (academicYear.isCurrent) {
      return NextResponse.json(
        { error: 'Cannot delete the current academic year' },
        { status: 400 }
      );
    }

    // Delete academic year (this will cascade delete semesters)
    await db.academicYear.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}