import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Generates a unique matriculation number in the format MOPSEM/YEAR/####
 * @param year - The year of registration (defaults to current year)
 * @returns Promise<string> - The generated matriculation number
 */
export async function generateMatriculationNumber(year?: number): Promise<string> {
  const registrationYear = year || new Date().getFullYear()
  const prefix = `MTS/${registrationYear}/`
  
  // Find the highest existing matriculation number for this year
  const existingNumbers = await prisma.student.findMany({
    where: {
      matriculationNumber: {
        startsWith: prefix
      }
    },
    select: {
      matriculationNumber: true
    },
    orderBy: {
      matriculationNumber: 'desc'
    }
  })
  
  // Also check registration table for pending registrations
  const existingRegistrationNumbers = await prisma.registration.findMany({
    where: {
      matriculationNumber: {
        startsWith: prefix
      }
    },
    select: {
      matriculationNumber: true
    },
    orderBy: {
      matriculationNumber: 'desc'
    }
  })
  
  // Combine both arrays and find the highest number
  const allNumbers = [
    ...existingNumbers.map(s => s.matriculationNumber),
    ...existingRegistrationNumbers.map(r => r.matriculationNumber)
  ].filter(Boolean) as string[]
  
  let nextNumber = 1
  
  if (allNumbers.length > 0) {
    // Extract the numeric part from the highest matriculation number
    const highestNumber = allNumbers[0]
    const numericPart = highestNumber?.split('/')[2]
    if (numericPart) {
      nextNumber = parseInt(numericPart, 10) + 1
    }
  }
  
  // Format the number with leading zeros (4 digits)
  const formattedNumber = nextNumber.toString().padStart(4, '0')
  
  return `${prefix}${formattedNumber}`
}

/**
 * Validates if a matriculation number follows the correct format
 * @param matriculationNumber - The matriculation number to validate
 * @returns boolean - True if valid, false otherwise
 */
export function validateMatriculationNumber(matriculationNumber: string): boolean {
  const pattern = /^MTS\/\d{4}\/\d{4}$/
  return pattern.test(matriculationNumber)
}

/**
 * Extracts the year from a matriculation number
 * @param matriculationNumber - The matriculation number
 * @returns number | null - The year or null if invalid format
 */
export function extractYearFromMatriculationNumber(matriculationNumber: string): number | null {
  if (!validateMatriculationNumber(matriculationNumber)) {
    return null
  }
  
  const parts = matriculationNumber.split('/')
  return parseInt(parts[1], 10)
}