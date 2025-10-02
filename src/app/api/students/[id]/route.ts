import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  emailAddress: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  address: z.string().optional(),
  grade: z.string().min(1, 'Grade is required'),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  graduationYear: z.number().optional(),
  currentClass: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  parentGuardianName: z.string().optional(),
  parentGuardianPhone: z.string().optional(),
  parentGuardianEmail: z.string().email().optional().or(z.literal('')),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactRelationship: z.string().min(1, 'Emergency contact relationship is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        grades: {
          include: {
            subject: true,
            teacher: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        attendance: {
          include: {
            classSession: {
              include: {
                subject: true,
                teacher: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          take: 20,
        },
        classSectionParticipants: {
          include: {
            classSection: {
              include: {
                subject: true,
                teacher: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
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
    const validatedData = updateStudentSchema.parse(body);

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: params.id },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if student ID already exists (excluding current student)
    if (validatedData.studentId !== existingStudent.studentId) {
      const existingStudentId = await prisma.student.findUnique({
        where: { studentId: validatedData.studentId },
      });

      if (existingStudentId) {
        return NextResponse.json(
          { error: 'Student ID already exists' },
          { status: 400 }
        );
      }
    }

    // Check if email already exists (excluding current student)
    if (validatedData.emailAddress !== existingStudent.emailAddress) {
      const existingEmail = await prisma.student.findUnique({
        where: { emailAddress: validatedData.emailAddress },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email address already exists' },
          { status: 400 }
        );
      }
    }

    // Check if phone number already exists (excluding current student)
    if (validatedData.phoneNumber !== existingStudent.phoneNumber) {
      const existingPhone = await prisma.student.findFirst({
        where: {
          phoneNumber: validatedData.phoneNumber,
          id: { not: params.id },
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: 'Phone number already exists' },
          { status: 400 }
        );
      }
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        parentGuardianEmail: validatedData.parentGuardianEmail || null,
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: params.id },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if student has active grades or attendance records
    const [gradesCount, attendanceCount, classSectionCount] = await Promise.all([
      prisma.grade.count({ where: { studentId: params.id } }),
      prisma.attendance.count({ where: { studentId: params.id } }),
      prisma.classSectionParticipant.count({ where: { studentId: params.id } }),
    ]);

    // If student has academic records, deactivate instead of delete
    if (gradesCount > 0 || attendanceCount > 0 || classSectionCount > 0) {
      const deactivatedStudent = await prisma.student.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: 'Student deactivated due to existing academic records',
        student: deactivatedStudent,
        deactivated: true,
      });
    }

    // If no academic records, permanently delete
    await prisma.student.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Student deleted successfully',
      deleted: true,
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}