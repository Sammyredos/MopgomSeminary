const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking Student role...');
    const studentRole = await prisma.role.findFirst({
      where: { name: 'Student' }
    });
    console.log('Student role:', studentRole);
    
    console.log('\nChecking users with Student role...');
    const studentsWithRole = await prisma.user.findMany({
      where: { 
        role: { name: 'Student' }
      },
      include: { role: true }
    });
    console.log('Users with Student role:', studentsWithRole.length);
    
    console.log('\nChecking all users...');
    const allUsers = await prisma.user.findMany({
      include: { role: true }
    });
    console.log('Total users:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`- ${user.email}: role = ${user.role?.name || 'No role'}, active = ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();