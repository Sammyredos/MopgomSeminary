import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { generateMatriculationNumber } from '@/lib/matriculation-generator';

const createStudentSchema = z.object({
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
});

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional().default(''),
  grade: z.string().optional().default(''),
  status: z.string().optional().default(''),
  academicYear: z.string().optional().default(''),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || '',
      grade: searchParams.get('grade') || '',
      status: searchParams.get('status') || '',
      academicYear: searchParams.get('academicYear') || '',
    });

    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { studentId: { contains: query.search, mode: 'insensitive' } },
        { emailAddress: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.grade) {
      where.grade = query.grade;
    }

    if (query.status === 'active') {
      where.isActive = true;
    } else if (query.status === 'inactive') {
      where.isActive = false;
    }

    if (query.academicYear) {
      where.academicYear = query.academicYear;
    }

    // Get students with pagination
    const [studentsRaw, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          courseAllocations: {
            where: { isActive: true },
            include: { course: true },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    const students = studentsRaw.map((s) => ({
      ...s,
      courseOfStudy: s.courseAllocations?.[0]?.course?.courseName || null,
    }));

    // Calculate analytics
    const [totalStudents, activeStudents, newThisMonth, allStudents] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { isActive: true } }),
      prisma.student.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.student.findMany({
        select: { dateOfBirth: true, grade: true },
      }),
    ]);

    // Calculate average age
    const currentDate = new Date();
    const ages = allStudents.map(student => {
      const birthDate = new Date(student.dateOfBirth);
      let age = currentDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = currentDate.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    });
    const averageAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;

    // Calculate grade distribution
    const gradeDistribution = allStudents.reduce((acc, student) => {
      acc[student.grade] = (acc[student.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const analytics = {
      totalStudents,
      activeStudents,
      newThisMonth,
      averageAge,
      gradeDistribution,
    };

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json({
      students,
      pagination,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createStudentSchema.parse(body);

    // Check if student ID already exists
    const existingStudentId = await prisma.student.findUnique({
      where: { studentId: validatedData.studentId },
    });

    if (existingStudentId) {
      return NextResponse.json(
        { error: 'Student ID already exists' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.student.findUnique({
      where: { emailAddress: validatedData.emailAddress },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email address already exists' },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingPhone = await prisma.student.findFirst({
      where: { phoneNumber: validatedData.phoneNumber },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 400 }
      );
    }

    // Generate matriculation number
    const matriculationNumber = await generateMatriculationNumber();

    // Create student
    const student = await prisma.student.create({
      data: {
        ...validatedData,
        address: validatedData.address ?? '',
        matriculationNumber,
        parentGuardianEmail: validatedData.parentGuardianEmail || null,
        isActive: true,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}