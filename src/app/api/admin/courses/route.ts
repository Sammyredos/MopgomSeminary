import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const onlyActive = (searchParams.get('active') || 'true') === 'true';

    const courses = await prisma.course.findMany({
      where: {
        AND: [
          onlyActive ? { isActive: true } : {},
          search
            ? {
                OR: [
                  { courseName: { contains: search, mode: 'insensitive' } },
                  { courseCode: { contains: search, mode: 'insensitive' } },
                  { subjectArea: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      orderBy: { courseName: 'asc' },
      select: {
        id: true,
        courseCode: true,
        courseName: true,
        subjectArea: true,
        instructor: true,
        isActive: true,
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}