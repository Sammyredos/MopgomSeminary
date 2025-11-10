import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateStudentSchema = z.object({
  studentId: z.string().optional(),
  matriculationNumber: z.string().optional().or(z.literal('')),
  matricNumber: z.string().optional().or(z.literal('')),
  fullName: z.string().optional(),
  emailAddress: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  grade: z.string().optional(),
  enrollmentDate: z.string().optional(),
  graduationYear: z.number().optional(),
  currentClass: z.string().optional(),
  academicYear: z.string().optional(),
  parentGuardianName: z.string().optional(),
  parentGuardianPhone: z.string().optional(),
  parentGuardianEmail: z.string().email().optional().or(z.literal('')),
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  isActive: z.boolean().optional(),
  courseId: z.string().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const data = updateStudentSchema.parse(body);
    const { id: studentIdParam } = await params;

    // Build update payload
    const updatePayload: any = {};

    if (data.studentId) updatePayload.studentId = data.studentId;
    if (data.fullName) updatePayload.fullName = data.fullName;
    if (data.emailAddress !== undefined) updatePayload.emailAddress = data.emailAddress || null;
    if (data.phoneNumber) updatePayload.phoneNumber = data.phoneNumber;
    if (data.dateOfBirth) updatePayload.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender) updatePayload.gender = data.gender;
    if (data.address !== undefined) updatePayload.address = data.address || '';
    if (data.grade) updatePayload.grade = data.grade;
    if (data.enrollmentDate) updatePayload.enrollmentDate = new Date(data.enrollmentDate);
    if (data.graduationYear !== undefined) updatePayload.graduationYear = data.graduationYear ?? null;
    if (data.currentClass !== undefined) updatePayload.currentClass = data.currentClass || null;
    if (data.academicYear) updatePayload.academicYear = data.academicYear;
    if (data.parentGuardianName !== undefined) updatePayload.parentGuardianName = data.parentGuardianName || null;
    if (data.parentGuardianPhone !== undefined) updatePayload.parentGuardianPhone = data.parentGuardianPhone || null;
    if (data.parentGuardianEmail !== undefined) updatePayload.parentGuardianEmail = data.parentGuardianEmail || null;
    if (data.emergencyContactName) updatePayload.emergencyContactName = data.emergencyContactName;
    if (data.emergencyContactRelationship) updatePayload.emergencyContactRelationship = data.emergencyContactRelationship;
    if (data.emergencyContactPhone) updatePayload.emergencyContactPhone = data.emergencyContactPhone;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    // Map matricNumber alias to matriculationNumber
    const matric = (data.matriculationNumber ?? data.matricNumber)?.trim();
    if (matric !== undefined) {
      updatePayload.matriculationNumber = matric || null;
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id: studentIdParam },
      data: updatePayload,
    });

    // Handle course allocation
    if (data.courseId) {
      await prisma.courseAllocation.upsert({
        where: { studentId: studentIdParam },
        update: { courseId: data.courseId, isActive: true },
        create: {
          studentId: studentIdParam,
          courseId: data.courseId,
          allocatedBy: 'system',
          isActive: true,
        },
      });
    }

    // Synchronize matriculationNumber to corresponding registration by email/phone
    try {
      if (updatePayload.matriculationNumber !== undefined) {
        await prisma.registration.updateMany({
          where: {
            OR: [
              { emailAddress: updatedStudent.emailAddress },
              { phoneNumber: updatedStudent.phoneNumber }
            ]
          },
          data: {
            matriculationNumber: updatePayload.matriculationNumber || null,
          },
        });
      }
    } catch (syncErr) {
      console.warn('Registration matriculation sync failed:', syncErr);
    }

    // Return student with current course allocation if any
    const result = await prisma.student.findUnique({
      where: { id: studentIdParam },
      include: {
        courseAllocations: {
          where: { isActive: true },
          include: { course: true },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating student:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}