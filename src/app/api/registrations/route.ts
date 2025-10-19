import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-helpers'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check permissions - only admin roles can view registrations
    const allowedRoles = ['Super Admin', 'Admin', 'School Administrator', 'Manager']
    if (!allowedRoles.includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit
    const includeStudentStatus = searchParams.get('includeStudentStatus') === 'true'

    // Build search conditions
    const searchConditions: Prisma.RegistrationWhereInput = search ? {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { emailAddress: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } }
      ]
    } : {}

    // Fetch registrations with pagination
    const [registrations, totalCount] = await Promise.all([
      prisma.registration.findMany({
        where: searchConditions,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          officePostalAddress: true,
          branch: true,
          phoneNumber: true,
          emailAddress: true,
          courseDesired: true,
          maritalStatus: true,
          spouseName: true,
          placeOfBirth: true,
          origin: true,
          presentOccupation: true,
          placeOfWork: true,
          positionHeldInOffice: true,
          acceptedJesusChrist: true,
          whenAcceptedJesus: true,
          churchAffiliation: true,
          schoolsAttended: true,
          matriculationNumber: true,
          emergencyContactName: true,
          emergencyContactRelationship: true,
          emergencyContactPhone: true,
          parentGuardianName: true,
          parentGuardianPhone: true,
          parentGuardianEmail: true,
          isVerified: true,
          verifiedAt: true,
          verifiedBy: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.registration.count({
        where: searchConditions
      })
    ])

    // Map registrations to include matricNumber, homeAddress and parsed schoolsAttended for frontend compatibility
    let registrationsWithMatricNumbers = registrations.map((registration: any) => {
      let schools: any[] = []
      try {
        schools = registration.schoolsAttended ? JSON.parse(registration.schoolsAttended) : []
      } catch {
        schools = []
      }
      return {
        ...registration,
        matricNumber: registration.matriculationNumber,
        homeAddress: registration.address,
        schoolsAttended: schools
      }
    })

    // Optionally include student active status by matching registration emails to user records
    if (includeStudentStatus && registrationsWithMatricNumbers.length > 0) {
      try {
        const emails = registrationsWithMatricNumbers
          .map((r: any) => r.emailAddress)
          .filter((e: string | null) => !!e) as string[]

        const users = await prisma.user.findMany({
          where: { email: { in: emails } },
          select: { email: true, isActive: true }
        })

        const statusMap = new Map<string, boolean>()
        users.forEach(u => {
          if (u.email) statusMap.set(u.email.toLowerCase(), !!u.isActive)
        })

        registrationsWithMatricNumbers = registrationsWithMatricNumbers.map((r: any) => ({
          ...r,
          userIsActive: statusMap.has(r.emailAddress?.toLowerCase())
            ? statusMap.get(r.emailAddress.toLowerCase())
            : true // default to active if no matching user record
        }))
      } catch (e) {
        // If status inclusion fails, proceed without it
        console.warn('Failed to include student status in registrations response:', e)
      }
    }

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      registrations: registrationsWithMatricNumbers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    })

  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}