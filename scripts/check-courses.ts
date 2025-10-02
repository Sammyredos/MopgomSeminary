import { prisma } from '../src/lib/db'

async function checkCourses() {
  try {
    console.log('Checking courses in database...')
    
    // Get all courses
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Found ${courses.length} courses:`);
    
    if (courses.length === 0) {
      console.log('No courses found in database.');
    } else {
      courses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.courseCode} - ${course.courseName}`);
        console.log(`   Subject: ${course.subjectArea}`);
        console.log(`   Instructor: ${course.instructor}`);
        console.log(`   Active: ${course.isActive}`);
        console.log(`   Created: ${course.createdAt}`);
        console.log('---');
      });
    }
    
    // Test creating a sample course
    console.log('\nTesting course creation...');
    
    const testCourse = {
      courseCode: 'TEST001',
      courseName: 'Test Course',
      subjectArea: 'Computer Science',
      instructor: 'Test Instructor',
      maxStudents: 30,
      duration: 12,
      platform: 'Online',
      meetingUrl: 'https://example.com/meeting',
      description: 'This is a test course',
      prerequisites: 'None',
      isActive: true
    };
    
    // Check if test course already exists
    const existingTest = await prisma.course.findFirst({
      where: { courseCode: 'TEST001' }
    });
    
    if (existingTest) {
      console.log('Test course already exists, skipping creation.');
    } else {
      const newCourse = await prisma.course.create({
        data: {
          ...testCourse,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('Test course created successfully:');
      console.log(`ID: ${newCourse.id}`);
      console.log(`Code: ${newCourse.courseCode}`);
      console.log(`Name: ${newCourse.courseName}`);
    }
    
  } catch (error) {
    console.error('Error checking courses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourses();