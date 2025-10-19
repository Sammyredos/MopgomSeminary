import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createTeacherSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  subject: z.string().min(1, 'Subject is required'),
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
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email address already exists' },
        { status: 400 }
      );
    }

    // Check if phone number already exists (not unique in schema, use findFirst)
    const existingPhone = await prisma.teacher.findFirst({
      where: { phone: validatedData.phone },
    });

    if (existingPhone) {
      return NextResponse.json(
        { message: 'Phone number already exists' },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.create({
      data: {
        teacherId: validatedData.teacherId,
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        subject: validatedData.subject,
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