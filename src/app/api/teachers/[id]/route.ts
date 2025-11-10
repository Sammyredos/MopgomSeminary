import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateTeacherSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required').optional(),
  fullName: z.string().min(1, 'Full name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
  subject: z.string().optional(),
  hireDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        teacherSubjects: {
          include: {
            subject: true,
          },
        },
        courseSessions: {
          include: {
            subject: true,
            course: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const validatedData = updateTeacherSchema.parse(body);

    // Check if teacher exists
    const { id } = await params;
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Check for unique constraints if they're being updated
    if (validatedData.teacherId && validatedData.teacherId !== existingTeacher.teacherId) {
      const teacherIdExists = await prisma.teacher.findUnique({
        where: { teacherId: validatedData.teacherId },
      });
      if (teacherIdExists) {
        return NextResponse.json(
          { message: 'Teacher ID already exists' },
          { status: 400 }
        );
      }
    }

    if (validatedData.email && validatedData.email !== existingTeacher.email) {
      const emailExists = await prisma.teacher.findUnique({
        where: { email: validatedData.email },
      });
      if (emailExists) {
        return NextResponse.json(
          { message: 'Email address already exists' },
          { status: 400 }
        );
      }
    }

    // Phone may not be unique in the schema, but we can still check duplicates
    if (validatedData.phone && validatedData.phone !== existingTeacher.phone) {
      const phoneExists = await prisma.teacher.findFirst({
        where: { phone: validatedData.phone },
      });
      if (phoneExists) {
        return NextResponse.json(
          { message: 'Phone number already exists' },
          { status: 400 }
        );
      }
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: {
        teacherId: validatedData.teacherId ?? undefined,
        fullName: validatedData.fullName ?? undefined,
        email: validatedData.email ?? undefined,
        phone: validatedData.phone ?? undefined,
        subject: validatedData.subject ?? undefined,
        hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : undefined,
        isActive: validatedData.isActive ?? undefined,
      },
    });

    return NextResponse.json(updatedTeacher);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if teacher exists
    const { id } = await params;
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Check if teacher has any active course sessions or grades
    const activeCourseSessions = await prisma.courseSession.count({
      where: {
        teacherId: id,
        isActive: true,
      },
    });

    const grades = await prisma.grade.count({
      where: {
        teacherId: id,
      },
    });

    if (activeCourseSessions > 0 || grades > 0) {
      // Instead of deleting, deactivate the teacher
      const deactivatedTeacher = await prisma.teacher.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: 'Teacher deactivated due to existing records',
        teacher: deactivatedTeacher,
      });
    }

    // If no dependencies, delete the teacher
    await prisma.teacher.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Teacher deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}