import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateTeacherSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required').optional(),
  fullName: z.string().min(1, 'Full name is required').optional(),
  emailAddress: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().min(1, 'Phone number is required').optional(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.number().optional().nullable(),
  department: z.string().optional(),
  position: z.string().optional(),
  salary: z.number().optional().nullable(),
  hireDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
        classSessions: {
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateTeacherSchema.parse(body);

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: params.id },
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

    if (validatedData.emailAddress && validatedData.emailAddress !== existingTeacher.emailAddress) {
      const emailExists = await prisma.teacher.findUnique({
        where: { emailAddress: validatedData.emailAddress },
      });
      if (emailExists) {
        return NextResponse.json(
          { message: 'Email address already exists' },
          { status: 400 }
        );
      }
    }

    if (validatedData.phoneNumber && validatedData.phoneNumber !== existingTeacher.phoneNumber) {
      const phoneExists = await prisma.teacher.findUnique({
        where: { phoneNumber: validatedData.phoneNumber },
      });
      if (phoneExists) {
        return NextResponse.json(
          { message: 'Phone number already exists' },
          { status: 400 }
        );
      }
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
        hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : undefined,
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
  { params }: { params: { id: string } }
) {
  try {
    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: params.id },
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Check if teacher has any active class sessions or grades
    const activeClassSessions = await prisma.classSession.count({
      where: {
        teacherId: params.id,
        isActive: true,
      },
    });

    const grades = await prisma.grade.count({
      where: {
        teacherId: params.id,
      },
    });

    if (activeClassSessions > 0 || grades > 0) {
      // Instead of deleting, deactivate the teacher
      const deactivatedTeacher = await prisma.teacher.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: 'Teacher deactivated due to existing records',
        teacher: deactivatedTeacher,
      });
    }

    // If no dependencies, delete the teacher
    await prisma.teacher.delete({
      where: { id: params.id },
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