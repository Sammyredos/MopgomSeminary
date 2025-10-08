import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user info first
    const user = await prisma.user.findUnique({
      where: { id: payload.adminId },
      include: {
        role: true
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }

    // Check if user is a student
    if (user.role?.name !== 'Student') {
      return NextResponse.json({ error: 'Access denied. Student role required.' }, { status: 403 })
    }

    // Get registration data for the student
    const registration = await prisma.registration.findFirst({
      where: { 
        emailAddress: user.email 
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent registration
      }
    })

    if (!registration) {
      // Return basic user data if no registration found
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phoneNumber || null,
          dateOfBirth: null,
          gender: null,
          address: null,
          grade: null,
          currentClass: null,
          courseDesired: null,
          academicYear: null,
          parentGuardianName: null,
          parentGuardianPhone: null,
          parentGuardianEmail: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
          emergencyContactRelationship: null,
          profilePicture: null,
          status: user.isActive ? 'Active' : 'Inactive',
          createdAt: user.createdAt
        }
      })
    }

    // Parse schoolsAttended JSON if present
    const rawSchools = (registration as any).schoolsAttended as string | null
    let schoolsAttended: Array<{ institutionName: string; certificatesHeld: string }> | undefined
    try {
      schoolsAttended = rawSchools ? JSON.parse(rawSchools) : undefined
    } catch {
      schoolsAttended = undefined
    }

    // Return complete profile data with registration information
    return NextResponse.json({
      user: {
        id: user.id,
        name: registration.fullName,
        email: registration.emailAddress,
        phone: registration.phoneNumber,
        dateOfBirth: registration.dateOfBirth,
        gender: registration.gender,
        // Map DB address to homeAddress expected by UI
        homeAddress: registration.address,
        officePostalAddress: (registration as any).officePostalAddress || '',
        maritalStatus: (registration as any).maritalStatus || '',
        spouseName: (registration as any).spouseName || '',
        placeOfBirth: (registration as any).placeOfBirth || '',
        origin: (registration as any).origin || '',
        presentOccupation: (registration as any).presentOccupation || '',
        placeOfWork: (registration as any).placeOfWork || '',
        positionHeldInOffice: (registration as any).positionHeldInOffice || '',
        acceptedJesusChrist: (registration as any).acceptedJesusChrist ?? undefined,
        whenAcceptedJesus: (registration as any).whenAcceptedJesus || '',
        churchAffiliation: (registration as any).churchAffiliation || '',
        schoolsAttended,
        courseDesired: registration.courseDesired || '',
        // Legacy fields (may not exist in Registration model)
        grade: (registration as any).grade || null,
        currentClass: (registration as any).currentClass || null,
        academicYear: (registration as any).academicYear || new Date().getFullYear().toString(),
        matriculationNumber: registration.matriculationNumber,
        parentGuardianName: registration.parentGuardianName,
        parentGuardianPhone: registration.parentGuardianPhone,
        parentGuardianEmail: registration.parentGuardianEmail,
        emergencyContactName: registration.emergencyContactName,
        emergencyContactPhone: registration.emergencyContactPhone,
        emergencyContactRelationship: registration.emergencyContactRelationship,
        profilePicture: null,
        status: user.isActive ? 'Active' : 'Inactive',
        createdAt: registration.createdAt
      }
    })

  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user info first
    const user = await prisma.user.findUnique({
      where: { id: payload.adminId },
      include: { role: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }

    // Check if user is a student
    if (user.role?.name !== 'Student') {
      return NextResponse.json({ error: 'Access denied. Student role required.' }, { status: 403 })
    }

    // Get the most recent registration by user email
    const registration = await prisma.registration.findFirst({
      where: { emailAddress: user.email },
      orderBy: { createdAt: 'desc' }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found for user' }, { status: 404 })
    }

    // Parse body
    const body = await request.json()

    // Map known fields
    const fullName = (body.name ?? registration.fullName) as string
    const address = (body.homeAddress ?? registration.address) as string
    const courseDesired = (body.courseDesired ?? registration.courseDesired) as string | null

    // Update core fields via Prisma client
    const updatedCore = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        fullName,
        address,
        courseDesired: courseDesired ?? undefined,
        updatedAt: new Date()
      }
    })

    // Prepare additional fields for raw SQL update (new columns)
    const officePostalAddress = body.officePostalAddress ?? null
    const maritalStatus = body.maritalStatus ?? null
    const spouseName = body.spouseName ?? null
    const placeOfBirth = body.placeOfBirth ?? null
    const origin = body.origin ?? null
    const presentOccupation = body.presentOccupation ?? null
    const placeOfWork = body.placeOfWork ?? null
    const positionHeldInOffice = body.positionHeldInOffice ?? null
    const acceptedJesusChrist = typeof body.acceptedJesusChrist === 'boolean' ? body.acceptedJesusChrist : null
    const whenAcceptedJesus = body.whenAcceptedJesus ?? null
    const churchAffiliation = body.churchAffiliation ?? null
    const schoolsAttended = Array.isArray(body.schoolsAttended) ? JSON.stringify(body.schoolsAttended) : null

    // Update additional fields using raw SQL to avoid client generation issues
    await prisma.$executeRawUnsafe(
      `UPDATE registrations SET 
        officePostalAddress = ?,
        maritalStatus = ?,
        spouseName = ?,
        placeOfBirth = ?,
        origin = ?,
        presentOccupation = ?,
        placeOfWork = ?,
        positionHeldInOffice = ?,
        acceptedJesusChrist = ?,
        whenAcceptedJesus = ?,
        churchAffiliation = ?,
        schoolsAttended = ?
      WHERE id = ?`,
      officePostalAddress,
      maritalStatus,
      spouseName,
      placeOfBirth,
      origin,
      presentOccupation,
      placeOfWork,
      positionHeldInOffice,
      acceptedJesusChrist,
      whenAcceptedJesus,
      churchAffiliation,
      schoolsAttended,
      registration.id
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving student profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}