import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAcademicYears() {
  try {
    console.log('🌱 Seeding academic years...')

    // Check if academic years already exist
    const existingCount = await prisma.academicYear.count()
    if (existingCount > 0) {
      console.log(`✅ Academic years already exist (${existingCount} found)`)
      return
    }

    // Create academic years
    const academicYears = [
      {
        year: '2023-2024',
        startDate: new Date('2023-09-01'),
        endDate: new Date('2024-06-30'),
        description: 'Academic Year 2023-2024',
        isActive: true,
        isCurrent: false
      },
      {
        year: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        description: 'Academic Year 2024-2025',
        isActive: true,
        isCurrent: true
      },
      {
        year: '2025-2026',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
        description: 'Academic Year 2025-2026',
        isActive: true,
        isCurrent: false
      }
    ]

    for (const academicYear of academicYears) {
      await prisma.academicYear.create({
        data: academicYear
      })
      console.log(`✅ Created academic year: ${academicYear.year}`)
    }

    console.log(`🎉 Successfully seeded ${academicYears.length} academic years`)

  } catch (error) {
    console.error('❌ Error seeding academic years:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
seedAcademicYears()
  .then(() => {
    console.log('✅ Academic years seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Academic years seeding failed:', error)
    process.exit(1)
  })