import { prisma } from '@/lib/db'

export interface DuplicateCheckResult {
  isDuplicate: boolean
  duplicateFields: string[]
  duplicateDetails: {
    email?: any
    phone?: any
    name?: any
    similar_name?: any
  }
  hasSimilarNames?: boolean
  similarRegistrations?: any[]
}

export interface DuplicateCheckParams {
  email?: string
  phone?: string
  surname?: string
  firstname?: string
  lastname?: string
  fullName?: string
  excludeId?: string // Exclude a specific record ID from the check (useful for updates)
}

/**
 * Unified duplicate check function that searches both users and registrations tables
 * This prevents conflicts between the two tables and ensures consistent validation
 */
export async function checkForDuplicates(params: DuplicateCheckParams): Promise<DuplicateCheckResult> {
  const { email, phone, surname, firstname, lastname, fullName: rawFullName, excludeId } = params
  
  const duplicateFields: string[] = []
  const duplicateDetails: any = {}
  
  // Normalize inputs
  const normalizedEmail = email?.toLowerCase().trim()
  const normalizedPhone = phone?.replace(/\D/g, '')
  const normalizedSurname = surname?.toLowerCase().trim()
  const normalizedFirstname = firstname?.toLowerCase().trim()
  const normalizedLastname = lastname?.toLowerCase().trim()
  const normalizedFullNameInput = rawFullName?.toLowerCase().trim()
  
  // Construct full name for comparison (prefer explicitly provided fullName)
  const fullName = normalizedFullNameInput || [normalizedSurname, normalizedFirstname, normalizedLastname]
    .filter(Boolean)
    .join(' ')

  try {
    // Check for email duplicates in both tables
    if (normalizedEmail) {
      // Check users table
      const userEmailDuplicate = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          ...(excludeId && { id: { not: excludeId } })
        },
        select: { id: true, email: true, name: true, createdAt: true }
      })
      
      if (userEmailDuplicate) {
        duplicateFields.push('email')
        duplicateDetails.email = userEmailDuplicate
      }
      
      // Check registrations table (only if not found in users)
      if (!userEmailDuplicate) {
        const registrationEmailDuplicate = await prisma.registration.findFirst({
          where: {
            emailAddress: normalizedEmail,
            ...(excludeId && { id: { not: excludeId } })
          },
          select: { id: true, emailAddress: true, fullName: true, createdAt: true }
        })
        
        if (registrationEmailDuplicate) {
          duplicateFields.push('email')
          duplicateDetails.email = registrationEmailDuplicate
        }
      }
    }

    // Check for phone duplicates in both tables
    if (normalizedPhone) {
      // Check users table (if users have phone field)
      // Note: Adjust this based on your user schema
      
      // Check registrations table
      const registrationPhoneDuplicate = await prisma.registration.findFirst({
        where: {
          phoneNumber: normalizedPhone,
          ...(excludeId && { id: { not: excludeId } })
        },
        select: { id: true, phoneNumber: true, fullName: true, createdAt: true }
      })
      
      if (registrationPhoneDuplicate) {
        duplicateFields.push('phone')
        duplicateDetails.phone = registrationPhoneDuplicate
      }
    }

    // Check for name duplicates in both tables
    if (fullName.trim()) {
      // Check users table
      const userNameDuplicate = await prisma.user.findFirst({
        where: {
          name: {
            equals: fullName
          },
          ...(excludeId && { id: { not: excludeId } })
        },
        select: { id: true, name: true, email: true, createdAt: true }
      })
      
      if (userNameDuplicate) {
        duplicateFields.push('name')
        duplicateDetails.name = userNameDuplicate
      }
      
      // Check registrations table (only if not found in users)
      if (!userNameDuplicate) {
        const registrationNameDuplicate = await prisma.registration.findFirst({
          where: {
            fullName: {
              equals: fullName
            },
            ...(excludeId && { id: { not: excludeId } })
          },
          select: { id: true, fullName: true, emailAddress: true, createdAt: true }
        })
        
        if (registrationNameDuplicate) {
          duplicateFields.push('name')
          duplicateDetails.name = registrationNameDuplicate
        }
      }
    }

    // Check for similar names (fuzzy matching)
    const similarRegistrations: any[] = []
    let fuzzyFirst = normalizedFirstname
    let fuzzyLast = normalizedLastname
    
    if ((!fuzzyFirst || !fuzzyLast) && normalizedFullNameInput) {
      const parts = normalizedFullNameInput.split(/\s+/).filter(Boolean)
      if (parts.length >= 2) {
        fuzzyFirst = parts[0]
        fuzzyLast = parts[parts.length - 1]
      }
    }

    if (fuzzyFirst && fuzzyLast) {
      // Check for similar name combinations in both tables
      const similarInUsers = await prisma.user.findMany({
        where: {
          AND: [
            {
              name: {
                contains: fuzzyFirst
              }
            },
            {
              name: {
                contains: fuzzyLast
              }
            }
          ],
          ...(excludeId && { id: { not: excludeId } })
        },
        select: { id: true, name: true, email: true, createdAt: true }
      })
      
      const similarInRegistrations = await prisma.registration.findMany({
        where: {
          AND: [
            {
              fullName: {
                contains: fuzzyFirst
              }
            },
            {
              fullName: {
                contains: fuzzyLast
              }
            }
          ],
          ...(excludeId && { id: { not: excludeId } })
        },
        select: { id: true, fullName: true, emailAddress: true, createdAt: true }
      })
      
      similarRegistrations.push(...similarInUsers, ...similarInRegistrations)
    }

    return {
      isDuplicate: duplicateFields.length > 0,
      duplicateFields,
      duplicateDetails,
      hasSimilarNames: similarRegistrations.length > 0,
      similarRegistrations
    }

  } catch (error) {
    console.error('Duplicate check error:', error)
    throw new Error('Failed to check for duplicates')
  }
}

/**
 * Quick email duplicate check across both tables
 */
export async function checkEmailDuplicate(email: string, excludeId?: string): Promise<boolean> {
  const result = await checkForDuplicates({ email, excludeId })
  return result.isDuplicate && result.duplicateFields.includes('email')
}

/**
 * Quick phone duplicate check across both tables
 */
export async function checkPhoneDuplicate(phone: string, excludeId?: string): Promise<boolean> {
  const result = await checkForDuplicates({ phone, excludeId })
  return result.isDuplicate && result.duplicateFields.includes('phone')
}

/**
 * Quick name duplicate check across both tables
 */
export async function checkNameDuplicate(surname: string, firstname: string, lastname: string, excludeId?: string): Promise<boolean> {
  const result = await checkForDuplicates({ surname, firstname, lastname, excludeId })
  return result.isDuplicate && result.duplicateFields.includes('name')
}