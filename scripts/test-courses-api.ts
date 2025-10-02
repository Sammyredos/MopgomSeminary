import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCoursesAPI() {
  try {
    console.log('Testing courses API logic...')
    
    // Simulate the API logic
    const queryOptions = {
      include: {
        _count: {
          select: {
            courseSessions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' as const
      }
    }

    const courses = await prisma.course.findMany(queryOptions)
    console.log(`Found ${courses.length} courses in database`)
    
    // Calculate utilization stats for each course
    const coursesWithStats = courses.map(course => ({
      ...course,
      currentEnrollment: 0, // Add missing field
      utilization: {
        totalSessions: course._count.courseSessions,
        isFullyBooked: course._count.courseSessions >= 40, // Assuming 40 periods per week max
        availabilityRate: Math.max(0, (40 - course._count.courseSessions) / 40 * 100)
      }
    }))

    // Calculate overall stats
    const stats = {
      totalCourses: courses.length,
      availableCourses: courses.filter(c => c.isActive).length,
      totalCapacity: courses.reduce((sum, c) => sum + c.maxStudents, 0),
      averageUtilization: courses.length > 0 
        ? courses.reduce((sum, c) => sum + c._count.courseSessions, 0) / courses.length
        : 0
    }

    console.log('Courses with stats:', JSON.stringify(coursesWithStats, null, 2))
    console.log('Stats:', JSON.stringify(stats, null, 2))
    
    return {
      courses: coursesWithStats,
      stats
    }
  } catch (error) {
    console.error('Error in test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCoursesAPI()