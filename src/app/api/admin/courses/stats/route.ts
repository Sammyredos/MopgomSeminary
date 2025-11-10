import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest, hasAnyRole } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    // Only admin roles can view course statistics
    const allowedRoles = ['Super Admin', 'Admin', 'Manager', 'Staff'];
    if (!hasAnyRole(auth.user, allowedRoles)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all courses with their enrollment data
    const courses = await prisma.course.findMany({
      include: {
        courseAllocations: {
          where: {
            isActive: true
          }
        },
        _count: {
          select: {
            courseAllocations: true,
            courseSessions: true
          }
        }
      }
    });

    // Get total active students from the Students table
    const totalActiveStudents = await prisma.student.count({
      where: {
        isActive: true
      }
    });

    // Get students enrolled in courses
    const enrolledStudents = await prisma.courseAllocation.count({
      where: {
        isActive: true
      }
    });

    // Calculate statistics
    const totalCourses = courses.length;
    const activeCourses = courses.filter(course => course.isActive).length;
    
    // Calculate average rating (for now, we'll use a calculated value based on course utilization)
    // In the future, this could be replaced with actual student ratings
    const averageUtilization = courses.length > 0 
      ? courses.reduce((sum, course) => {
          const utilization = course.maxStudents ? course.currentEnrollment / course.maxStudents : 0;
          return sum + Math.min(utilization, 1); // Cap at 100%
        }, 0) / courses.length
      : 0;
    
    // Convert utilization to a rating scale (0.5 to 5.0)
    const averageRating = Math.round((3.5 + (averageUtilization * 1.5)) * 10) / 10;

    // Calculate program breakdown based on subjectArea
    const programBreakdown = {
      'general-certificate': 0,
      'diploma-certificate': 0,
      'bachelors-degree': 0,
      'masters-degree': 0
    };

    courses.forEach(course => {
      const subjectArea = course.subjectArea?.toLowerCase() || '';
      
      if (subjectArea.includes('general certificate') || subjectArea === 'general certificate') {
        programBreakdown['general-certificate']++;
      } else if (subjectArea.includes('diploma certificate') || subjectArea === 'diploma certificate') {
        programBreakdown['diploma-certificate']++;
      } else if (subjectArea.includes("bachelor's degree") || subjectArea === "bachelor's degree") {
        programBreakdown['bachelors-degree']++;
      } else if (subjectArea.includes("master's degree") || subjectArea === "master's degree") {
        programBreakdown['masters-degree']++;
      } else {
        // Default to general certificate if no clear category
        programBreakdown['general-certificate']++;
      }
    });

    // Additional statistics
    const courseUtilization = courses.map(course => ({
      id: course.id,
      name: course.courseName,
      currentEnrollment: course.currentEnrollment,
      maxStudents: course.maxStudents,
      utilization: course.maxStudents && course.maxStudents > 0 ? (course.currentEnrollment / course.maxStudents) * 100 : 0
    }));

    const stats = {
      totalCourses,
      activeCourses,
      totalStudents: enrolledStudents, // Students enrolled in courses
      averageRating,
      programBreakdown,
      courseUtilization,
      additionalMetrics: {
        totalActiveStudents,
        coursesWithSessions: courses.filter(c => c._count.courseSessions > 0).length,
        averageEnrollmentPerCourse: totalCourses > 0 ? Math.round(enrolledStudents / totalCourses) : 0,
        totalCapacity: courses.reduce((sum, course) => sum + (course.maxStudents || 0), 0),
        capacityUtilization: courses.reduce((sum, course) => sum + (course.maxStudents || 0), 0) > 0 
          ? Math.round((enrolledStudents / courses.reduce((sum, course) => sum + (course.maxStudents || 0), 0)) * 100)
          : 0
      }
    };

    return NextResponse.json({ 
      success: true, 
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching course statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course statistics' },
      { status: 500 }
    );
  }
}