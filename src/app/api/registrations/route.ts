import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-helpers'

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

    // Build search conditions
    const searchConditions = search ? {
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
          branch: true,
          phoneNumber: true,
          emailAddress: true,
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

    // Map registrations to include matricNumber field for frontend compatibility
    const registrationsWithMatricNumbers = registrations.map(registration => ({
      ...registration,
      matricNumber: registration.matriculationNumber
    }))

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