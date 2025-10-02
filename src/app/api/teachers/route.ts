import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createTeacherSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  emailAddress: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.number().optional().nullable(),
  department: z.string().optional(),
  position: z.string().optional(),
  salary: z.number().optional().nullable(),
  hireDate: z.string(),
});

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTeacherSchema.parse(body);

    // Check if teacher ID already exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { teacherId: validatedData.teacherId },
    });

    if (existingTeacher) {
      return NextResponse.json(
        { message: 'Teacher ID already exists' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.teacher.findUnique({
      where: { emailAddress: validatedData.emailAddress },
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email address already exists' },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingPhone = await prisma.teacher.findUnique({
      where: { phoneNumber: validatedData.phoneNumber },
    });

    if (existingPhone) {
      return NextResponse.json(
        { message: 'Phone number already exists' },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.create({
      data: {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        hireDate: new Date(validatedData.hireDate),
      },
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}