import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { checkRegistrationCompletion } from '@/utils/registrationCompletion'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Auth check
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const currentUser = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, isActive: true, role: { select: { name: true } } }
    })
    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }
    if (!['Super Admin', 'Admin', 'Staff'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const registration = await prisma.registration.findUnique({ where: { id } })
    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, registration })
  } catch (error) {
    console.error('Get registration error:', error)
    return NextResponse.json({ error: 'Failed to fetch registration' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Auth check
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    const currentUser = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, isActive: true, role: { select: { name: true } } }
    })
    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }
    if (!['Super Admin', 'Admin', 'Staff'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      fullName,
      dateOfBirth,
      gender,
      emailAddress,
      matriculationNumber,
      phoneNumber,
      address,
      branch,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      parentGuardianName,
      parentGuardianPhone,
      parentGuardianEmail,
      medications,
      allergies,
      specialNeeds,
      dietaryRestrictions,
      parentalPermissionGranted,
      courseDesired,
      // Accept admin UI fields for address mapping
      homeAddress,
      officePostalAddress
    } = body

    // Load existing registration first for partial updates
    const existingRegistration = await prisma.registration.findUnique({ where: { id } })
    if (!existingRegistration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Merge body with existing values for validation
    const effectiveFullName = (fullName ?? existingRegistration.fullName)?.trim()
    const effectiveGender = (gender ?? existingRegistration.gender)?.trim()
    const effectiveEmail = (emailAddress ?? existingRegistration.emailAddress)?.trim()
    const effectivePhone = (phoneNumber ?? existingRegistration.phoneNumber)?.trim()
    // Map admin UI's homeAddress to core address when provided
    const effectiveAddress = (address ?? homeAddress ?? existingRegistration.address)?.trim()
    const effectiveEmergencyContactName = (emergencyContactName ?? existingRegistration.emergencyContactName)?.trim()
    const effectiveEmergencyContactRelationship = (emergencyContactRelationship ?? existingRegistration.emergencyContactRelationship)?.trim()
    const effectiveEmergencyContactPhone = (emergencyContactPhone ?? existingRegistration.emergencyContactPhone)?.trim()

    const effectiveDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : existingRegistration.dateOfBirth

    // Validate required fields after merging; avoids false 400 on partial edits
    const missingFields: string[] = []
    if (!effectiveFullName) missingFields.push('fullName')
    if (!effectiveDateOfBirth) missingFields.push('dateOfBirth')
    if (!effectiveGender) missingFields.push('gender')
    if (!effectiveEmail) missingFields.push('emailAddress')
    if (!effectivePhone) missingFields.push('phoneNumber')
    // For admin updates, treat address and emergency contact as optional to allow partial edits

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      }, { status: 400 })
    }

    // Calculate age from effective date of birth
    const today = new Date()
    let age = today.getFullYear() - effectiveDateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - effectiveDateOfBirth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < effectiveDateOfBirth.getDate())) {
      age--
    }

    // Prepare update data, falling back to existing values for partial updates
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        matriculationNumber: matriculationNumber ?? existingRegistration.matriculationNumber,
        fullName: effectiveFullName,
        dateOfBirth: effectiveDateOfBirth,
        age,
        gender: effectiveGender,
        emailAddress: effectiveEmail,
        phoneNumber: effectivePhone,
        address: effectiveAddress,
        branch: (branch ?? existingRegistration.branch) || 'Not Specified',
        emergencyContactName: effectiveEmergencyContactName,
        emergencyContactRelationship: effectiveEmergencyContactRelationship,
        emergencyContactPhone: effectiveEmergencyContactPhone,
        parentGuardianName: parentGuardianName ?? existingRegistration.parentGuardianName,
        parentGuardianPhone: parentGuardianPhone ?? existingRegistration.parentGuardianPhone,
        parentGuardianEmail: parentGuardianEmail ?? existingRegistration.parentGuardianEmail,
        parentalPermissionGranted: typeof parentalPermissionGranted === 'boolean'
          ? parentalPermissionGranted
          : existingRegistration.parentalPermissionGranted,
        parentalPermissionDate: (typeof parentalPermissionGranted === 'boolean' && parentalPermissionGranted && !existingRegistration.parentalPermissionGranted)
          ? new Date()
          : existingRegistration.parentalPermissionDate,
        courseDesired: courseDesired ?? existingRegistration.courseDesired,
        updatedAt: new Date()
      }
    })

    // If the registration email changed, synchronize related user/student records used for login
    let emailSyncInfo: {
      attempted: boolean
      userUpdated: boolean
      studentUpdated: boolean
      reason?: string
    } = { attempted: false, userUpdated: false, studentUpdated: false }

    try {
      const oldEmail = (existingRegistration.emailAddress || '').toLowerCase().trim()
      const newEmail = (updatedRegistration.emailAddress || '').toLowerCase().trim()
      if (oldEmail && newEmail && oldEmail !== newEmail) {
        emailSyncInfo.attempted = true
        // Check for conflicts in target email across admins/users/students
        const [conflictAdmin, conflictUser, conflictStudent] = await Promise.all([
          prisma.admin.findFirst({ where: { email: newEmail } }),
          prisma.user.findFirst({ where: { email: newEmail } }),
          prisma.student.findFirst({ where: { emailAddress: newEmail } })
        ])

        // Find the current user/student by the old email (if they exist)
        const [currentUserByOldEmail, currentStudentByOldEmail] = await Promise.all([
          prisma.user.findFirst({ where: { email: oldEmail } }),
          prisma.student.findFirst({ where: { emailAddress: oldEmail } })
        ])

        // If target email is already used by another account (not the same user), don't proceed to avoid unique constraint errors
        const targetEmailInUseByAnother = (
          (conflictAdmin && conflictAdmin.email.toLowerCase() === newEmail) ||
          (conflictUser && (!currentUserByOldEmail || conflictUser.id !== currentUserByOldEmail.id)) ||
          (conflictStudent && (!currentStudentByOldEmail || conflictStudent.id !== currentStudentByOldEmail.id))
        )

        if (targetEmailInUseByAnother) {
          emailSyncInfo.reason = 'New email already exists on another account; login email not changed.'
        } else {
          // Perform sync updates atomically
          await prisma.$transaction(async (tx) => {
            if (currentUserByOldEmail) {
              const res = await tx.user.update({
                where: { id: currentUserByOldEmail.id },
                data: { email: newEmail }
              })
              emailSyncInfo.userUpdated = !!res
            }
            if (currentStudentByOldEmail) {
              const res = await tx.student.update({
                where: { id: currentStudentByOldEmail.id },
                data: { emailAddress: newEmail }
              })
              emailSyncInfo.studentUpdated = !!res
            }
          })
        }
      }
    } catch (syncError) {
      console.warn('Email sync failed:', syncError)
      emailSyncInfo.reason = 'Email sync encountered an error; login email may remain unchanged.'
    }

    // Auto-set verification based on completion
    try {
      const completionStatus = checkRegistrationCompletion({
        name: updatedRegistration.fullName,
        email: updatedRegistration.emailAddress,
        phone: updatedRegistration.phoneNumber,
        dateOfBirth: updatedRegistration.dateOfBirth?.toISOString?.() || '',
        gender: updatedRegistration.gender,
        // Map available fields if present; fallbacks keep completion false when missing
        homeAddress: (homeAddress ?? updatedRegistration.address) || '',
        officePostalAddress: officePostalAddress ?? '',
        maritalStatus: body.maritalStatus ?? '',
        spouseName: body.spouseName ?? '',
        placeOfBirth: body.placeOfBirth ?? '',
        origin: body.origin ?? '',
        presentOccupation: body.presentOccupation ?? '',
        placeOfWork: body.placeOfWork ?? '',
        positionHeldInOffice: body.positionHeldInOffice ?? '',
        acceptedJesusChrist: typeof body.acceptedJesusChrist === 'boolean' ? body.acceptedJesusChrist : undefined,
        whenAcceptedJesus: body.whenAcceptedJesus ?? '',
        churchAffiliation: body.churchAffiliation ?? '',
        schoolsAttended: Array.isArray(body.schoolsAttended) ? body.schoolsAttended : [],
        courseDesired: updatedRegistration.courseDesired || body.courseDesired || ''
      })

      if (completionStatus.isComplete) {
        // Determine current user for verifiedBy
        const token = request.cookies.get('auth-token')?.value
        const payload = token ? verifyToken(token) : null
        let verifiedByEmail: string | null = null
        if (payload) {
          const user = await prisma.admin.findUnique({ where: { id: payload.adminId } })
          verifiedByEmail = user?.email || null
        }

        const verifiedUpdate = await prisma.registration.update({
          where: { id },
          data: {
            isVerified: true,
            verifiedAt: new Date(),
            verifiedBy: verifiedByEmail
          }
        })
        // Reflect in response
        // @ts-ignore: dynamic field presence varies by schema
        updatedRegistration.isVerified = (verifiedUpdate as any).isVerified
        // @ts-ignore
        updatedRegistration.verifiedAt = (verifiedUpdate as any).verifiedAt
        // @ts-ignore
        updatedRegistration.verifiedBy = (verifiedUpdate as any).verifiedBy
      }
    } catch (e) {
      // Do not block update on completion check failures
      console.warn('Registration completion check failed:', e)
    }

    // Synchronize matriculationNumber with corresponding student record (by email/phone)
    try {
      if (updatedRegistration.matriculationNumber !== undefined) {
        await prisma.student.updateMany({
          where: {
            OR: [
              { emailAddress: updatedRegistration.emailAddress },
              { phoneNumber: updatedRegistration.phoneNumber }
            ]
          },
          data: {
            matriculationNumber: updatedRegistration.matriculationNumber || null
          }
        })
      }
    } catch (syncErr) {
      console.warn('Student matriculation sync failed:', syncErr)
    }

    console.log('Registration updated successfully:', updatedRegistration.id)

    // Create response with real-time update headers
    const response = NextResponse.json({
      success: true,
      message: 'Registration updated successfully',
      registration: updatedRegistration,
      // Provide informative notes about email synchronization outcomes
      emailSync: emailSyncInfo.attempted ? {
        attempted: emailSyncInfo.attempted,
        userUpdated: emailSyncInfo.userUpdated,
        studentUpdated: emailSyncInfo.studentUpdated,
        reason: emailSyncInfo.reason
      } : undefined
    })

    // Add headers to trigger real-time updates
    response.headers.set('X-Registration-Updated', 'true')
    response.headers.set('X-Registration-Action', 'edit')
    response.headers.set('X-Updated-Registration-Data', JSON.stringify({
      id: updatedRegistration.id,
      fullName: updatedRegistration.fullName,
      emailAddress: updatedRegistration.emailAddress,
      phoneNumber: updatedRegistration.phoneNumber,
      updatedAt: updatedRegistration.updatedAt
    }))
    if (emailSyncInfo.attempted) {
      response.headers.set('X-User-Email-Sync', JSON.stringify({
        userUpdated: emailSyncInfo.userUpdated,
        studentUpdated: emailSyncInfo.studentUpdated,
        reason: emailSyncInfo.reason || ''
      }))
    }

    return response

  } catch (error) {
    console.error('Update registration error:', error)
    return NextResponse.json({
      error: 'Failed to update registration'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Delete registration API called for ID:', id)

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Determine user type from token
    const userType = payload.type || 'admin'

    let currentUser
    if (userType === 'admin') {
      currentUser = await prisma.admin.findUnique({
        where: { id: payload.adminId },
        include: { role: true }
      })
    } else {
      currentUser = await prisma.user.findUnique({
        where: { id: payload.adminId },
        include: { role: true }
      })
    }

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }

    // Check if user has permission to delete registrations (Super Admin, Admin, Staff)
    if (!['Super Admin', 'Admin', 'Staff'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if registration exists
    const existingRegistration = await prisma.registration.findUnique({
      where: { id }
    })

    if (!existingRegistration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Delete the registration
    await prisma.registration.delete({
      where: { id }
    })

    console.log('Registration deleted successfully:', id)

    return NextResponse.json({
      success: true,
      message: 'Registration deleted successfully'
    })

  } catch (error) {
    console.error('Delete registration error:', error)
    return NextResponse.json({
      error: 'Failed to delete registration'
    }, { status: 500 })
  }
}


// Stray global sync block removed.

