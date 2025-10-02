#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

// Create Prisma client with direct database URL to bypass validation
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

async function createAcademicYears() {
  try {
    // Use raw SQL to insert data directly
    const existingYears = await prisma.$queryRaw`SELECT * FROM academic_years LIMIT 1`;
    
    if (Array.isArray(existingYears) && existingYears.length > 0) {
      console.log('Academic years already exist');
      return;
    }

    // Insert academic years using raw SQL
    await prisma.$executeRaw`
      INSERT INTO academic_years (id, year, startDate, endDate, isActive, isCurrent, description, createdAt, updatedAt)
      VALUES 
        ('ay2023', '2023-2024', '2023-09-01T00:00:00.000Z', '2024-06-30T23:59:59.999Z', 1, 0, 'Academic Year 2023-2024', datetime('now'), datetime('now')),
        ('ay2024', '2024-2025', '2024-09-01T00:00:00.000Z', '2025-06-30T23:59:59.999Z', 1, 1, 'Academic Year 2024-2025 (Current)', datetime('now'), datetime('now')),
        ('ay2025', '2025-2026', '2025-09-01T00:00:00.000Z', '2026-06-30T23:59:59.999Z', 1, 0, 'Academic Year 2025-2026', datetime('now'), datetime('now'))
    `;

    console.log('Successfully created academic years!');
    
    // Verify the data
    const allYears = await prisma.$queryRaw`SELECT * FROM academic_years ORDER BY year`;
    console.log('All academic years in database:');
    console.table(allYears);

  } catch (error) {
    console.error('Error creating academic years:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAcademicYears();