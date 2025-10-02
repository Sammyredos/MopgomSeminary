import { PrismaClient } from '@prisma/client'

// Create a dedicated Prisma client for data integrity checks
const prisma = new PrismaClient()

export interface DataConflict {
  type: 'duplicate_email' | 'duplicate_phone' | 'orphaned_user' | 'missing_data'
  severity: 'high' | 'medium' | 'low'
  message: string
  affectedRecords: number
  action?: string
  details?: any
}

export async function checkDataIntegrity(): Promise<DataConflict[]> {
  const conflicts: DataConflict[] = []

  try {
    // Check for duplicate emails across users and registrations
    const duplicateEmails = await findDuplicateEmails()
    if (duplicateEmails.length > 0) {
      conflicts.push({
        type: 'duplicate_email',
        severity: 'high',
        message: 'Duplicate email addresses found across users and registrations',
        affectedRecords: duplicateEmails.length,
        action: 'Resolve Duplicates',
        details: duplicateEmails
      })
    }

    // Check for duplicate phone numbers
    const duplicatePhones = await findDuplicatePhones()
    if (duplicatePhones.length > 0) {
      conflicts.push({
        type: 'duplicate_phone',
        severity: 'medium',
        message: 'Duplicate phone numbers found across users and registrations',
        affectedRecords: duplicatePhones.length,
        action: 'Resolve Duplicates',
        details: duplicatePhones
      })
    }

    // Check for orphaned users (users without corresponding registrations)
    const orphanedUsers = await findOrphanedUsers()
    if (orphanedUsers.length > 0) {
      conflicts.push({
        type: 'orphaned_user',
        severity: 'medium',
        message: 'User accounts found without corresponding registration records',
        affectedRecords: orphanedUsers.length,
        action: 'Review Users',
        details: orphanedUsers
      })
    }

    // Check for registrations with missing required data
    const incompleteRegistrations = await findIncompleteRegistrations()
    if (incompleteRegistrations.length > 0) {
      conflicts.push({
        type: 'missing_data',
        severity: 'low',
        message: 'Registrations with missing or incomplete required information',
        affectedRecords: incompleteRegistrations.length,
        action: 'Review Data',
        details: incompleteRegistrations
      })
    }

  } catch (error) {
    console.error('Error checking data integrity:', error)
    conflicts.push({
      type: 'missing_data',
      severity: 'high',
      message: 'Failed to perform data integrity check',
      affectedRecords: 0,
      action: 'Retry Check'
    })
  }

  return conflicts
}

async function findDuplicateEmails(): Promise<any[]> {
  // Find emails that exist in both users and registrations tables
  const userEmails = await prisma.user.findMany({
    select: { email: true, id: true, name: true, createdAt: true }
  })

  const registrationEmails = await prisma.registration.findMany({
    select: { emailAddress: true, id: true, fullName: true, createdAt: true }
  })

  const duplicates: any[] = []
  const emailMap = new Map()

  // Build map of user emails
  userEmails.forEach(user => {
    emailMap.set(user.email.toLowerCase(), {
      type: 'user',
      ...user
    })
  })

  // Check for duplicates in registrations
  registrationEmails.forEach(reg => {
    const email = reg.emailAddress.toLowerCase()
    if (emailMap.has(email)) {
      duplicates.push({
        email,
        user: emailMap.get(email),
        registration: {
          type: 'registration',
          id: reg.id,
          name: reg.fullName,
          createdAt: reg.createdAt
        }
      })
    }
  })

  return duplicates
}

async function findDuplicatePhones(): Promise<any[]> {
  // Find phone numbers that exist in both users and registrations tables
  const userPhones = await prisma.user.findMany({
    where: { phoneNumber: { not: null } },
    select: { phoneNumber: true, id: true, name: true, createdAt: true }
  })

  const registrationPhones = await prisma.registration.findMany({
    select: { phoneNumber: true, id: true, fullName: true, createdAt: true }
  })

  const duplicates: any[] = []
  const phoneMap = new Map()

  // Build map of user phones
  userPhones.forEach(user => {
    if (user.phoneNumber) {
      phoneMap.set(user.phoneNumber, {
        type: 'user',
        ...user
      })
    }
  })

  // Check for duplicates in registrations
  registrationPhones.forEach(reg => {
    if (phoneMap.has(reg.phoneNumber)) {
      duplicates.push({
        phone: reg.phoneNumber,
        user: phoneMap.get(reg.phoneNumber),
        registration: {
          type: 'registration',
          id: reg.id,
          name: reg.fullName,
          createdAt: reg.createdAt
        }
      })
    }
  })

  return duplicates
}

async function findOrphanedUsers(): Promise<any[]> {
  // Find users that don't have corresponding registrations
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true }
  })

  const registrations = await prisma.registration.findMany({
    select: { emailAddress: true }
  })

  const registrationEmails = new Set(
    registrations.map(reg => reg.emailAddress.toLowerCase())
  )

  const orphaned = users.filter(user => 
    !registrationEmails.has(user.email.toLowerCase())
  )

  return orphaned
}

async function findIncompleteRegistrations(): Promise<any[]> {
  // Find registrations with missing required fields
  const registrations = await prisma.registration.findMany({
    select: {
      id: true,
      fullName: true,
      emailAddress: true,
      phoneNumber: true,
      address: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      createdAt: true
    }
  })

  const incomplete = registrations.filter(reg => {
    return !reg.fullName?.trim() ||
           !reg.emailAddress?.trim() ||
           !reg.phoneNumber?.trim() ||
           !reg.address?.trim() ||
           !reg.emergencyContactName?.trim() ||
           !reg.emergencyContactPhone?.trim()
  })

  return incomplete
}

export async function resolveDataConflict(conflictType: string, details?: any): Promise<boolean> {
  try {
    switch (conflictType) {
      case 'duplicate_email':
        return await resolveDuplicateEmails(details)
      case 'duplicate_phone':
        return await resolveDuplicatePhones(details)
      case 'orphaned_user':
        return await resolveOrphanedUsers(details)
      case 'missing_data':
        return await resolveMissingData(details)
      default:
        return false
    }
  } catch (error) {
    console.error(`Error resolving conflict ${conflictType}:`, error)
    return false
  }
}

async function resolveDuplicateEmails(duplicates: any[]): Promise<boolean> {
  // For each duplicate, keep the user record and remove the registration
  // This prevents the original issue from recurring
  for (const duplicate of duplicates) {
    if (duplicate.registration?.id) {
      await prisma.registration.delete({
        where: { id: duplicate.registration.id }
      })
    }
  }
  return true
}

async function resolveDuplicatePhones(duplicates: any[]): Promise<boolean> {
  // Similar to email duplicates, prioritize user records
  for (const duplicate of duplicates) {
    if (duplicate.registration?.id) {
      await prisma.registration.delete({
        where: { id: duplicate.registration.id }
      })
    }
  }
  return true
}

async function resolveOrphanedUsers(orphaned: any[]): Promise<boolean> {
  // This is informational - orphaned users might be legitimate
  // (e.g., admin users, imported users, etc.)
  // We don't automatically delete them
  return true
}

async function resolveMissingData(incomplete: any[]): Promise<boolean> {
  // This is informational - missing data should be handled manually
  // We don't automatically fill in missing data
  return true
}

export async function runDataCleanup(): Promise<{
  success: boolean
  message: string
  conflictsResolved: number
}> {
  try {
    const conflicts = await checkDataIntegrity()
    let resolved = 0

    for (const conflict of conflicts) {
      if (conflict.type === 'duplicate_email' || conflict.type === 'duplicate_phone') {
        const success = await resolveDataConflict(conflict.type, conflict.details)
        if (success) resolved++
      }
    }

    return {
      success: true,
      message: `Data cleanup completed. ${resolved} conflicts resolved.`,
      conflictsResolved: resolved
    }
  } catch (error) {
    console.error('Data cleanup failed:', error)
    return {
      success: false,
      message: 'Data cleanup failed. Please check logs for details.',
      conflictsResolved: 0
    }
  }
}